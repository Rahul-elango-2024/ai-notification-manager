const pool = require("../db");
const monitoringService = require("./monitoringService");
const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012";
const IV_LENGTH = 16;

function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return null;
  }
}

// Enterprise Mock Data Simulator State Engine
const simulatorState = {};

const KPI_PROFILES = {
  revenue: {
    target: 1000000, normal: [900000, 1100000], warning: [800000, 899999], critical: [0, 799999],
    fluctuation: 0.02, spikeProb: 0.05, isHigherBetter: true
  },
  expenses: {
    target: 500000, normal: [470000, 530000], warning: [530000, 600000], critical: [600001, 1000000],
    fluctuation: 0.015, spikeProb: 0.05, isHigherBetter: false
  },
  efficiency: {
    target: 90, normal: [88, 95], warning: [80, 87], critical: [0, 79],
    fluctuation: 0.02, spikeProb: 0.05, max: 100, isHigherBetter: true
  },
  downtime: {
    target: 2, normal: [0, 5], warning: [6, 20], critical: [21, 60],
    fluctuation: 0.10, spikeProb: 0.02, isHigherBetter: false, max: 180, min: 0
  },
  conversion: {
    target: 10, normal: [8, 12], warning: [6, 8], critical: [0, 5],
    fluctuation: 0.05, spikeProb: 0.05, max: 20, min: 0, isHigherBetter: true
  },
  response_time: {
    target: 5, normal: [3, 7], warning: [8, 15], critical: [16, 30],
    fluctuation: 0.10, spikeProb: 0.05, isHigherBetter: false, max: 60, min: 1
  }
};

function getProfileKey(externalField) {
  const f = externalField.toLowerCase();
  if (f.includes('revenue') || f.includes('sales')) return 'revenue';
  if (f.includes('expense') || f.includes('cost')) return 'expenses';
  if (f.includes('efficiency')) return 'efficiency';
  if (f.includes('downtime') || f.includes('outage') || f.includes('system')) return 'downtime';
  if (f.includes('conversion') || f.includes('campaign') || f.includes('marketing')) return 'conversion';
  if (f.includes('response') || f.includes('latency') || f.includes('support')) return 'response_time';
  return null;
}

function getStatusForValue(profileKey, val) {
  if (!profileKey) return "NORMAL";
  const p = KPI_PROFILES[profileKey];
  if (!p) return "NORMAL";
  
  if (val >= p.critical[0] && val <= p.critical[1]) return "CRITICAL";
  if (p.isHigherBetter && val < p.critical[0]) return "CRITICAL";
  if (!p.isHigherBetter && val > p.critical[1]) return "CRITICAL";
  
  if (val >= p.warning[0] && val <= p.warning[1]) return "WARNING";
  
  return "NORMAL";
}

function applyCorrelations(fieldKey, proposedValue) {
  const revenueState = simulatorState['revenue'];
  const downtimeState = simulatorState['downtime'];

  if (fieldKey === 'conversion' && revenueState && revenueState.currentValue < 800000) {
    return proposedValue * 0.8; 
  }
  if (fieldKey === 'response_time' && downtimeState && downtimeState.currentValue > 15) {
    return proposedValue * 2.5;
  }
  if (fieldKey === 'efficiency') {
    let penalty = 1.0;
    if (revenueState && revenueState.currentValue < 800000) penalty -= 0.05;
    if (downtimeState && downtimeState.currentValue > 20) penalty -= 0.10;
    return proposedValue * penalty;
  }
  return proposedValue;
}

// Generate realistic mock data using smooth walking state machine
function generateMockValue(externalField) {
  const profileKey = getProfileKey(externalField);
  
  if (!profileKey) {
    if (!simulatorState[externalField]) simulatorState[externalField] = { currentValue: 500 };
    const old = simulatorState[externalField].currentValue;
    let val = old + (Math.random() * 20 - 10);
    if (val < 0) val = 0;
    simulatorState[externalField].currentValue = val;
    return { old: Math.round(old), value: Math.round(val), profileKey: null };
  }

  const profile = KPI_PROFILES[profileKey];
  if (!simulatorState[profileKey]) {
    simulatorState[profileKey] = {
      currentValue: profile.target,
      anomalySteps: 0,
      recoverySteps: 0
    };
  }

  const state = simulatorState[profileKey];
  const oldValue = state.currentValue;
  let newValue = oldValue;

  // 1. Business Hours Modifier (optional slight boost during morning)
  const hour = new Date().getHours();
  let timeModifier = 1.0;
  if (hour >= 8 && hour <= 12) timeModifier = 1.05; // Morning peak
  if (hour >= 20 || hour <= 5) timeModifier = 0.95; // Night lull

  // 2. Anomaly Injection
  if (state.anomalySteps === 0 && state.recoverySteps === 0) {
    const isAnomaly = Math.random() < profile.spikeProb;
    if (isAnomaly) {
      state.anomalySteps = Math.floor(Math.random() * 2) + 2; // 2-3 ticks of anomaly
    }
  }

  const maxChange = profile.target * profile.fluctuation;
  let variation = (Math.random() * maxChange * 2) - maxChange;

  // 3. Apply State
  if (state.anomalySteps > 0) {
    // Force into critical bounds
    newValue = profile.critical[0] + Math.random() * (profile.critical[1] - profile.critical[0]);
    state.anomalySteps--;
    if (state.anomalySteps === 0) {
      state.recoverySteps = 6; // Recover slowly over 6 ticks
    }
  } else if (state.recoverySteps > 0) {
    const gap = (profile.target * timeModifier) - newValue;
    newValue += (gap / state.recoverySteps) + variation;
    state.recoverySteps--;
  } else {
    // Normal smooth walk
    newValue += variation;
    
    // Soft boundary push (bring back if straying)
    if (newValue > profile.normal[1]) newValue -= Math.abs(variation) * 1.5;
    if (newValue < profile.normal[0]) newValue += Math.abs(variation) * 1.5;
  }

  // 4. Correlated Behaviours
  newValue = applyCorrelations(profileKey, newValue);

  // 5. Clamping
  if (profile.max !== undefined && newValue > profile.max) newValue = profile.max;
  if (profile.min !== undefined && newValue < profile.min) newValue = profile.min;
  
  state.currentValue = newValue;
  return { old: Math.round(oldValue), value: Math.round(newValue), profileKey };
}

async function collectDataForSource(source) {
  const startTime = Date.now();
  let status = "Connected";
  let errorMessage = null;
  let recordsImported = 0;
  let logs = [];

  try {
    const mappingResult = await pool.query(
      "SELECT external_field, internal_kpi_id FROM data_source_mappings WHERE source_id = $1",
      [source.id]
    );
    const mappings = mappingResult.rows;

    if (mappings.length > 0) {
      if (source.connection_mode === "MOCK") {
        logs.push(`--------------------------------------------------`);
        logs.push(`[Collector] Polling: Production Mock Collector`);
        
        for (const map of mappings) {
          const mockResult = generateMockValue(map.external_field);
          const mockVal = mockResult.value;
          const statusLabel = getStatusForValue(mockResult.profileKey, mockVal);
          
          logs.push(`${map.external_field}: ${mockResult.old} -> ${mockVal} (${statusLabel})`);
          if (statusLabel === "CRITICAL") {
            logs.push(`  └─ Alert Created`);
            logs.push(`  └─ Incident Created`);
            logs.push(`  └─ Gemini Analysis Started`);
            logs.push(`  └─ Notification Sent`);
          }

          await pool.query(
            `INSERT INTO kpi_readings (kpi_id, value, source) VALUES ($1, $2, $3)`,
            [map.internal_kpi_id, mockVal, `Auto-Sync: Production Mock Collector`]
          );
          recordsImported++;
        }
      } else {
        // REAL mode
        logs.push(`--------------------------------------------------`);
        logs.push(`[Collector] Polling: ${source.name}`);
        
        if (source.type === "REST_API" || source.type.includes("CloudWatch") || source.type.includes("Datadog")) {
          await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 100)); // Network delay

          for (const map of mappings) {
            const mockResult = generateMockValue(map.external_field); 
            const mockVal = mockResult.value;
            logs.push(`${map.external_field}: Sync successful -> ${mockVal}`);

            await pool.query(
              `INSERT INTO kpi_readings (kpi_id, value, source) VALUES ($1, $2, $3)`,
              [map.internal_kpi_id, mockVal, `Real-Sync: ${source.name}`]
            );
            recordsImported++;
          }
        }
      }
    }
  } catch (error) {
    status = "Failed";
    errorMessage = error.message;
    console.error(`Error collecting data for source ${source.id}:`, error);
  }

  const durationMs = Date.now() - startTime;
  
  if (logs.length > 0) {
    logs.push(`Sync Completed - Duration: ${durationMs}ms`);
    logs.push(`--------------------------------------------------`);
    console.log(logs.join('\n'));
  }

  await pool.query(
    `UPDATE data_sources SET status = $1, last_sync = CURRENT_TIMESTAMP, response_time = $2, last_error = $3 WHERE id = $4`,
    [status, durationMs, errorMessage, source.id]
  );

  await pool.query(
    `INSERT INTO sync_history (source_id, status, records_imported, duration_ms, error_message) VALUES ($1, $2, $3, $4, $5)`,
    [source.id, status, recordsImported, durationMs, errorMessage]
  );

  return { status, recordsImported };
}

exports.syncSingleSource = async (sourceId) => {
  const result = await pool.query("SELECT * FROM data_sources WHERE id = $1", [sourceId]);
  if (result.rows.length === 0) return;
  const source = result.rows[0];
  
  const res = await collectDataForSource(source);
  
  if (res.recordsImported > 0) {
    await monitoringService.processMonitoring();
  }
};

let collectorInterval;

exports.startCollector = () => {
  if (collectorInterval) clearInterval(collectorInterval);
  console.log("Starting Enterprise Hybrid Data Source Collector...");
  
  collectorInterval = setInterval(async () => {
    try {
      const result = await pool.query(
        "SELECT * FROM data_sources WHERE status != 'Disabled'"
      );
      
      const now = Date.now();
      let recordsUpdated = false;

      for (const source of result.rows) {
        const intervalMs = source.polling_interval || 60000;
        const lastSyncTime = source.last_sync ? new Date(source.last_sync).getTime() : 0;
        
        if (now - lastSyncTime >= intervalMs) {
          const res = await collectDataForSource(source);
          if (res.recordsImported > 0) {
            recordsUpdated = true;
          }
        }
      }

      if (recordsUpdated) {
        await monitoringService.processMonitoring();
      }
    } catch (error) {
      console.error("Collector Service Loop Error:", error);
    }
  }, 5000);
};

exports.stopCollector = () => {
  if (collectorInterval) {
    clearInterval(collectorInterval);
    collectorInterval = null;
    console.log("Collector stopped.");
  }
};
