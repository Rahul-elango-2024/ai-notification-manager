const pool = require("../db");

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status = 'SUCCESS') AS success_requests,
        COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_requests,
        COUNT(*) FILTER (WHERE status = 'RATE_LIMITED') AS rate_limited_requests,
        COALESCE(ROUND(AVG(latency_ms)), 0) AS avg_latency,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) AS today_requests,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') AS last_7_days_requests,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days_requests
      FROM api_request_logs
    `);

    const stats = totalResult.rows[0];
    const total = Number(stats.total_requests) || 0;
    const success = Number(stats.success_requests) || 0;
    const failed = Number(stats.failed_requests) || 0;

    const successRate = total > 0 ? Number(((success / total) * 100).toFixed(1)) : 100;
    const failureRate = total > 0 ? Number(((failed / total) * 100).toFixed(1)) : 0;

    // Top API Keys by request volume
    const topKeysResult = await pool.query(`
      SELECT 
        k.id,
        k.key_name,
        k.key_prefix,
        COUNT(l.id) AS request_count,
        COALESCE(ROUND(AVG(l.latency_ms)), 0) AS avg_latency
      FROM api_request_logs l
      JOIN api_keys k ON l.api_key_id = k.id
      GROUP BY k.id, k.key_name, k.key_prefix
      ORDER BY request_count DESC
      LIMIT 5
    `);

    // Department Activity Breakdown from Ingest logs
    const topDeptsResult = await pool.query(`
      SELECT 
        d.name AS department_name,
        COUNT(l.id) AS request_count
      FROM api_request_logs l
      JOIN api_keys k ON l.api_key_id = k.id
      LEFT JOIN departments d ON k.department_id = d.id
      GROUP BY d.name
      ORDER BY request_count DESC
      LIMIT 5
    `);

    res.status(200).json({
      totalRequests: total,
      successRequests: success,
      failedRequests: failed,
      rateLimitedRequests: Number(stats.rate_limited_requests) || 0,
      successRate,
      failureRate,
      avgLatencyMs: Number(stats.avg_latency) || 0,
      todayRequests: Number(stats.today_requests) || 0,
      last7DaysRequests: Number(stats.last_7_days_requests) || 0,
      last30DaysRequests: Number(stats.last_30_days_requests) || 0,
      topApiKeys: topKeysResult.rows,
      topDepartments: topDeptsResult.rows,
    });
  } catch (error) {
    console.error("getAnalyticsSummary Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve API analytics summary." });
  }
};

exports.getRequestLogs = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.api_key_id,
        k.key_name,
        k.key_prefix,
        l.endpoint,
        l.payload,
        l.response_status,
        l.response_body,
        l.latency_ms,
        l.ip_address,
        l.user_agent,
        l.status,
        l.timestamp
      FROM api_request_logs l
      LEFT JOIN api_keys k ON l.api_key_id = k.id
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE l.status = $${params.length}`;
    }

    params.push(Number(limit));
    query += ` ORDER BY l.timestamp DESC LIMIT $${params.length}`;

    params.push(Number(offset));
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("getRequestLogs Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve API request logs." });
  }
};
