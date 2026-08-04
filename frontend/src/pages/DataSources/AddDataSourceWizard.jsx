import React, { useState, useEffect } from "react";
import { X, Server, Database, Globe, Activity, HardDrive, TestTube, Save, Plus } from "lucide-react";

const AddDataSourceWizard = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    connection_mode: "REAL",
    base_url: "",
    authentication_type: "Bearer",
    api_key: "",
    polling_interval: 60000,
    headers: {},
    mappings: []
  });
  
  const [kpis, setKpis] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/kpis")
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(console.error);
  }, []);

  const handleNext = () => {
    if (step === 1 && !formData.type) {
      alert("Please select a data source type.");
      return;
    }
    setStep(step + 1);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/data-sources/test/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ status: "Host Unreachable", response_time: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to save data source.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const addMapping = () => {
    setFormData({
      ...formData,
      mappings: [...formData.mappings, { external_field: "", internal_kpi_id: kpis[0]?.id || "" }]
    });
  };

  const updateMapping = (index, field, value) => {
    const newMappings = [...formData.mappings];
    newMappings[index][field] = value;
    setFormData({ ...formData, mappings: newMappings });
  };

  const removeMapping = (index) => {
    const newMappings = [...formData.mappings];
    newMappings.splice(index, 1);
    setFormData({ ...formData, mappings: newMappings });
  };

  const sourceTypes = [
    { id: "MOCK", label: "Mock Business Data", icon: <Activity size={32} />, mode: "MOCK" },
    { id: "REST_API", label: "REST API", icon: <Globe size={32} />, mode: "REAL" },
    { id: "GraphQL", label: "GraphQL", icon: <Globe size={32} />, mode: "REAL" },
    { id: "PostgreSQL", label: "PostgreSQL", icon: <Database size={32} />, mode: "REAL" },
    { id: "Datadog", label: "Datadog", icon: <Server size={32} />, mode: "REAL" },
    { id: "AWS_CloudWatch", label: "AWS CloudWatch", icon: <HardDrive size={32} />, mode: "REAL" },
    { id: "Kafka", label: "Kafka Stream", icon: <Activity size={32} />, mode: "REAL" },
  ];

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal large">
        <div className="ds-modal-header">
          <h2>Add New Data Source</h2>
          <button className="ds-modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="ds-modal-body">
          <div className="wizard-steps">
            <div className={`wizard-step ${step === 1 ? 'active' : ''}`}>1. Select Type</div>
            <div className={`wizard-step ${step === 2 ? 'active' : ''}`}>2. Configuration</div>
            <div className={`wizard-step ${step === 3 ? 'active' : ''}`}>3. Data Mapping</div>
          </div>

          {step === 1 && (
            <div>
              <p className="text-secondary" style={{ marginBottom: "16px" }}>Select the external system you want to integrate with.</p>
              <div className="source-type-grid">
                {sourceTypes.map(type => (
                  <div 
                    key={type.id} 
                    className={`source-type-card ${formData.type === type.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, type: type.id, connection_mode: type.mode })}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-group">
                <label>Connection Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Production Datadog" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {formData.connection_mode === "REAL" && (
                <>
                  <div className="form-group">
                    <label>Base URL / Endpoint</label>
                    <input 
                      type="text" 
                      placeholder="https://api.example.com/v1" 
                      value={formData.base_url}
                      onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Authentication Type</label>
                    <select 
                      value={formData.authentication_type}
                      onChange={(e) => setFormData({...formData, authentication_type: e.target.value})}
                    >
                      <option value="Bearer">Bearer Token</option>
                      <option value="Basic">Basic Auth</option>
                      <option value="API_Key">API Key Header</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  {formData.authentication_type !== "None" && (
                    <div className="form-group">
                      <label>Secret / API Key (will be encrypted)</label>
                      <input 
                        type="password" 
                        placeholder="Enter secret..." 
                        value={formData.api_key}
                        onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      />
                    </div>
                  )}
                </>
              )}

              {formData.connection_mode === "MOCK" && (
                <div className="form-group">
                  <label>Simulated Business Domain</label>
                  <select>
                    <option value="IT">IT Operations & Infrastructure</option>
                    <option value="Finance">Financial Services</option>
                    <option value="Retail">Retail & E-Commerce</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                  <p className="text-secondary" style={{ fontSize: "0.75rem", marginTop: "8px" }}>
                    The Hybrid Collector will generate realistic telemetry data within safe bounds and occasionally introduce anomalies to trigger alerts.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Polling Interval</label>
                <select 
                  value={formData.polling_interval}
                  onChange={(e) => setFormData({...formData, polling_interval: Number(e.target.value)})}
                >
                  <option value={15000}>15 Seconds</option>
                  <option value={30000}>30 Seconds</option>
                  <option value={60000}>1 Minute</option>
                  <option value={300000}>5 Minutes</option>
                  <option value={900000}>15 Minutes</option>
                </select>
              </div>

              {testResult && (
                <div className={`test-result-alert ${testResult.status === 'Connected' ? 'success' : 'error'}`}>
                  <strong>{testResult.status}</strong> - Response Time: {testResult.response_time}ms
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-secondary" style={{ marginBottom: "16px" }}>Map fields from the external data source to internal KPI Engine metrics.</p>
              
              <div className="mapping-card">
                <div className="mapping-grid-header">
                  <div>External Field Name</div>
                  <div></div>
                  <div>Internal KPI</div>
                  <div></div>
                </div>
                
                {formData.mappings.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px 0", fontSize: "0.875rem" }}>
                    No mappings configured. Click "Add Mapping" to begin.
                  </div>
                ) : (
                  formData.mappings.map((mapping, idx) => (
                    <div key={idx} className="mapping-grid-row">
                      <input 
                        className="form-group" style={{ marginBottom: 0 }}
                        type="text" 
                        placeholder="e.g. system.cpu.usage" 
                        value={mapping.external_field}
                        onChange={(e) => updateMapping(idx, 'external_field', e.target.value)}
                      />
                      <span className="mapping-arrow">→</span>
                      <select 
                        className="form-group" style={{ marginBottom: 0 }}
                        value={mapping.internal_kpi_id}
                        onChange={(e) => updateMapping(idx, 'internal_kpi_id', Number(e.target.value))}
                      >
                        <option value="">Select KPI...</option>
                        {kpis.map(kpi => (
                          <option key={kpi.id} value={kpi.id}>{kpi.kpi_name} ({kpi.department})</option>
                        ))}
                      </select>
                      <button className="icon-btn danger" onClick={() => removeMapping(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
                
                <button className="btn-secondary" onClick={addMapping} style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                  <Plus size={14} /> Add Mapping
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="ds-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>
          )}
          
          {step === 2 && formData.connection_mode === "REAL" && (
            <button className="btn-secondary" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? "Testing..." : <><TestTube size={16}/> Test Connection</>}
            </button>
          )}

          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext}>Next step</button>
          ) : (
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? "Saving..." : <><Save size={16}/> Save Source</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDataSourceWizard;
