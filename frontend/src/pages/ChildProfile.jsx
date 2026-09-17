import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Baby, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Syringe, 
  BrainCircuit, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText,
  Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';

export function ChildProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [immunizationHistory, setImmunizationHistory] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Add Immunization Modal
  const [showImmModal, setShowImmModal] = useState(false);
  const [immForm, setImmForm] = useState({
    vaccine_id: '',
    date_administered: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [savingImm, setSavingImm] = useState(false);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    loadAllChildData();
  }, [id]);

  const loadAllChildData = async () => {
    try {
      setLoading(true);
      const [childRes, historyRes, vacRes, aiRes, smsRes] = await Promise.allSettled([
        api.get(`/children/${id}`),
        api.get(`/children/${id}/immunization-history`),
        api.get('/vaccines'),
        api.get(`/ai/assessments?child_id=${id}`),
        api.get(`/sms/logs?child_id=${id}`)
      ]);

      if (childRes.status === 'fulfilled') {
        setChild(childRes.value.data.child);
      }
      if (historyRes.status === 'fulfilled') {
        setImmunizationHistory(historyRes.value.data.history || []);
      }
      if (vacRes.status === 'fulfilled') {
        setVaccines(vacRes.value.data.vaccines || []);
      }
      if (aiRes.status === 'fulfilled') {
        setAssessments(aiRes.value.data.assessments || []);
      }
      if (smsRes.status === 'fulfilled') {
        setSmsLogs(smsRes.value.data.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load child profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordImmunization = async (e) => {
    e.preventDefault();
    if (!immForm.vaccine_id) {
      toast.error('Please select a vaccine');
      return;
    }

    setSavingImm(true);
    try {
      await api.post('/immunization', {
        child_id: parseInt(id),
        vaccine_id: parseInt(immForm.vaccine_id),
        date_administered: immForm.date_administered,
        remarks: immForm.remarks
      });
      toast.success('Immunization record saved successfully');
      setShowImmModal(false);
      loadAllChildData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to record immunization';
      toast.error(msg);
    } finally {
      setSavingImm(false);
    }
  };

  const handleRunAI = async () => {
    setAssessing(true);
    try {
      const res = await api.post(`/ai/assess/${id}`);
      const risk = res.data.assessment.risk_level;
      toast.success(`AI Assessment Completed: ${risk.toUpperCase()} Risk`);
      loadAllChildData();
    } catch (err) {
      toast.error('Failed to run AI assessment');
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading child health profile..." />;
  }

  if (!child) {
    return (
      <div className="text-center py-5">
        <h4 className="fw-bold text-danger">Child record not found</h4>
        <button className="btn-health-primary mt-3" onClick={() => navigate('/children')}>
          Back to Children Registry
        </button>
      </div>
    );
  }

  const completionPercentage = vaccines.length > 0
    ? Math.round((immunizationHistory.length / vaccines.length) * 100)
    : 0;

  const latestAssessment = assessments[0];

  return (
    <div>
      {/* Top Breadcrumb & Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button 
          className="btn btn-sm btn-health-outline d-inline-flex align-items-center gap-2"
          onClick={() => navigate('/children')}
        >
          <ArrowLeft size={16} />
          <span>Back to Children List</span>
        </button>

        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-health-secondary d-flex align-items-center gap-1"
            onClick={handleRunAI}
            disabled={assessing}
          >
            <BrainCircuit size={16} />
            <span>{assessing ? 'Evaluating...' : 'Run AI Assessment'}</span>
          </button>
          <button 
            className="btn btn-sm btn-health-primary d-flex align-items-center gap-1"
            onClick={() => setShowImmModal(true)}
          >
            <Syringe size={16} />
            <span>+ Record Vaccine</span>
          </button>
        </div>
      </div>

      {/* Child Profile Header Card */}
      <div className="health-card mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                fontSize: '1.5rem'
              }}
            >
              {child.first_name?.charAt(0)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h3 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>{child.full_name}</h3>
                <span className="badge font-monospace" style={{ backgroundColor: 'var(--mint)', color: 'var(--primary-dark)' }}>
                  {child.child_code}
                </span>
                <StatusBadge status={child.status} />
                {latestAssessment && (
                  <StatusBadge status={latestAssessment.risk_level} label={`AI: ${latestAssessment.risk_level} Risk`} />
                )}
              </div>
              <div className="d-flex align-items-center gap-3 text-muted small mt-1 flex-wrap">
                <span><strong>DOB:</strong> {child.birth_date}</span>
                <span>•</span>
                <span><strong>Age:</strong> {child.age_months} months</span>
                <span>•</span>
                <span className="text-capitalize"><strong>Sex:</strong> {child.sex}</span>
                <span>•</span>
                <span><strong>Address:</strong> {child.address || 'Brgy. Homapon'}</span>
              </div>
            </div>
          </div>

          {/* Quick Progress Indicator */}
          <div className="text-md-end p-3 rounded-3" style={{ backgroundColor: 'var(--mint-light)', minWidth: 200 }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted fw-bold">EPI Progress</small>
              <span className="fw-bold text-success">{completionPercentage}%</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div 
                className="progress-bar"
                style={{ 
                  width: `${completionPercentage}%`, 
                  backgroundColor: completionPercentage === 100 ? 'var(--accent)' : 'var(--primary)' 
                }}
              />
            </div>
            <small className="text-muted mt-1 d-block" style={{ fontSize: '0.72rem' }}>
              {immunizationHistory.length} of {vaccines.length} standard doses completed
            </small>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="d-flex gap-2 border-bottom mb-4 overflow-auto pb-2" style={{ borderColor: 'var(--border-color)' }}>
        <button
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-health-primary' : 'btn-health-outline'}`}
          onClick={() => setActiveTab('overview')}
        >
          <Baby size={15} />
          <span>Overview</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-health-primary' : 'btn-health-outline'}`}
          onClick={() => setActiveTab('history')}
        >
          <Syringe size={15} />
          <span>Immunization History ({immunizationHistory.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'ai' ? 'btn-health-primary' : 'btn-health-outline'}`}
          onClick={() => setActiveTab('ai')}
        >
          <BrainCircuit size={15} />
          <span>AI Risk Assessment ({assessments.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'sms' ? 'btn-health-primary' : 'btn-health-outline'}`}
          onClick={() => setActiveTab('sms')}
        >
          <MessageSquare size={15} />
          <span>SMS Reminders ({smsLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="health-card h-100">
              <h6 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <User size={18} className="text-primary" />
                <span>Primary Parent / Guardian</span>
              </h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Guardian Full Name:</span>
                  <span className="fw-bold">{child.guardian?.full_name || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Relationship:</span>
                  <span className="fw-semibold">{child.guardian?.relationship || 'Parent'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Contact Number:</span>
                  <span className="font-monospace fw-semibold">{child.guardian?.contact_number || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">SMS Consent:</span>
                  <span>
                    <StatusBadge 
                      status={child.guardian?.notification_enabled ? 'delivered' : 'failed'} 
                      label={child.guardian?.notification_enabled ? 'Enabled' : 'Disabled'}
                    />
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Residential Address:</span>
                  <span className="text-end small" style={{ maxWidth: 220 }}>{child.guardian?.address || child.address || 'Homapon'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="health-card h-100">
              <h6 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                <span>Health Center Summary</span>
              </h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Registered Facility:</span>
                  <span className="fw-bold">Barangay Homapon Health Center</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Vaccination Program:</span>
                  <span className="fw-semibold">Philippine EPI Schedule</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Total Doses Administered:</span>
                  <span className="fw-bold text-success">{immunizationHistory.length} doses</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Last Vaccination Date:</span>
                  <span className="fw-semibold">
                    {immunizationHistory.length > 0 ? immunizationHistory[0].date_administered : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Immunization History */}
      {activeTab === 'history' && (
        <div className="health-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table-health mb-0">
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Dose #</th>
                  <th>Date Administered</th>
                  <th>Administered By</th>
                  <th>Remarks / Lot #</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {immunizationHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted small">
                      No vaccines administered yet. Click "+ Record Vaccine" to add a dose.
                    </td>
                  </tr>
                ) : (
                  immunizationHistory.map((rec) => (
                    <tr key={rec.record_id}>
                      <td className="fw-bold" style={{ color: 'var(--primary-dark)' }}>{rec.vaccine_name}</td>
                      <td>
                        <span className="badge rounded-pill bg-light text-dark border">
                          Dose #{rec.dose_number}
                        </span>
                      </td>
                      <td>{rec.date_administered}</td>
                      <td className="small text-muted">{rec.recorded_by_name || 'Health Personnel'}</td>
                      <td className="small">{rec.remarks || 'Standard Dose'}</td>
                      <td>
                        <StatusBadge status="completed" label="Administered" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AI Assessment */}
      {activeTab === 'ai' && (
        <div className="d-flex flex-column gap-3">
          <div className="health-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">AI Follow-Up Risk Evaluation</h6>
                <small className="text-muted">Machine-learning classification for follow-up support</small>
              </div>
              <button 
                className="btn-health-primary btn-sm"
                onClick={handleRunAI}
                disabled={assessing}
              >
                <BrainCircuit size={16} />
                <span>{assessing ? 'Evaluating...' : 'Run New Assessment'}</span>
              </button>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No AI assessment has been generated yet for this child. Click "Run New Assessment".
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table-health mb-0">
                  <thead>
                    <tr>
                      <th>Assessment Date</th>
                      <th>Risk Classification</th>
                      <th>Confidence Score</th>
                      <th>Model Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={a.assessment_id}>
                        <td>{new Date(a.assessment_date).toLocaleString()}</td>
                        <td>
                          <StatusBadge status={a.risk_level} />
                        </td>
                        <td className="font-monospace">
                          {a.prediction_score !== null ? `${Math.round(a.prediction_score * 100)}%` : 'Rule-based'}
                        </td>
                        <td className="small text-muted">{a.model_version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: SMS History */}
      {activeTab === 'sms' && (
        <div className="health-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table-health mb-0">
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Recipient Phone</th>
                  <th>Notification Type</th>
                  <th>Message Preview</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {smsLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted small">
                      No SMS notifications sent to this guardian yet.
                    </td>
                  </tr>
                ) : (
                  smsLogs.map((log) => (
                    <tr key={log.sms_id}>
                      <td>{new Date(log.sent_at).toLocaleString()}</td>
                      <td className="font-monospace small">{log.recipient_number}</td>
                      <td>
                        <StatusBadge status={log.notification_type} />
                      </td>
                      <td className="small text-muted" style={{ maxWidth: 280 }}>
                        {log.message}
                      </td>
                      <td>
                        <StatusBadge status={log.delivery_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Vaccine Modal */}
      {showImmModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--card-radius)' }}>
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <Syringe size={20} className="text-primary" />
                  <h5 className="modal-title fw-bold mb-0">Record Administered Vaccine</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowImmModal(false)}></button>
              </div>
              <form onSubmit={handleRecordImmunization}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Child</label>
                    <input type="text" className="form-control" value={`${child.full_name} (${child.child_code})`} disabled />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Vaccine Dose <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={immForm.vaccine_id}
                      onChange={(e) => setImmForm({ ...immForm, vaccine_id: e.target.value })}
                      required
                    >
                      <option value="">Select EPI Vaccine...</option>
                      {vaccines.map((v) => (
                        <option key={v.vaccine_id} value={v.vaccine_id}>
                          {v.vaccine_name} — Dose #{v.dose_number} ({v.schedule_reference})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Date Administered <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={immForm.date_administered}
                      onChange={(e) => setImmForm({ ...immForm, date_administered: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Remarks / Batch Number</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Lot #ABC-1234, administered at health center"
                      value={immForm.remarks}
                      onChange={(e) => setImmForm({ ...immForm, remarks: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer px-4 py-3 bg-light border-top" style={{ borderColor: 'var(--border-light)' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowImmModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-health-primary btn-sm" disabled={savingImm}>
                    {savingImm ? 'Saving...' : 'Save Immunization Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChildProfile;
