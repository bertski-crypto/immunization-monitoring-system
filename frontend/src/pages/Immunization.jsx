import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Syringe, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  User, 
  FileText 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export function Immunization() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [children, setChildren] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterChild, setFilterChild] = useState('');
  const [filterVaccine, setFilterVaccine] = useState('');
  const [formData, setFormData] = useState({
    child_id: '',
    vaccine_id: '',
    date_administered: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
    loadChildren();
    loadVaccines();
  }, [filterChild, filterVaccine]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'record') {
      setShowModal(true);
    }
  }, [location.search]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterChild) params.child_id = filterChild;
      if (filterVaccine) params.vaccine_id = filterVaccine;

      const res = await api.get('/immunization', { params });
      setRecords(res.data.records || []);
    } catch (err) {
      toast.error('Failed to load immunization records');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const res = await api.get('/children?status=active');
      setChildren(res.data.children || []);
    } catch (err) {
      console.error('Failed to load children', err);
    }
  };

  const loadVaccines = async () => {
    try {
      const res = await api.get('/vaccines');
      setVaccines(res.data.vaccines || []);
    } catch (err) {
      console.error('Failed to load vaccines', err);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      child_id: children.length > 0 ? children[0].child_id : '',
      vaccine_id: vaccines.length > 0 ? vaccines[0].vaccine_id : '',
      date_administered: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.child_id || !formData.vaccine_id) {
      toast.error('Please select both child and vaccine dose');
      return;
    }

    setSaving(true);
    try {
      await api.post('/immunization', {
        child_id: parseInt(formData.child_id),
        vaccine_id: parseInt(formData.vaccine_id),
        date_administered: formData.date_administered,
        remarks: formData.remarks
      });
      toast.success('Immunization recorded successfully');
      setShowModal(false);
      loadRecords();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to record immunization';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId, childName, vaccineName) => {
    if (!window.confirm(`Are you sure you want to delete the ${vaccineName} record for ${childName}?`)) {
      return;
    }

    try {
      await api.delete(`/immunization/${recordId}`);
      toast.success('Immunization record removed');
      loadRecords();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Immunization Management</h2>
          <p className="text-muted small mb-0">Record and verify administered vaccine doses according to Philippine EPI schedule</p>
        </div>
        <button className="btn-health-primary" onClick={handleOpenModal}>
          <Syringe size={18} />
          <span>Record Vaccination</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="health-card mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-bold mb-1">Filter by Child</label>
            <select
              className="form-select"
              value={filterChild}
              onChange={(e) => setFilterChild(e.target.value)}
            >
              <option value="">All Registered Children</option>
              {children.map(c => (
                <option key={c.child_id} value={c.child_id}>
                  {c.full_name} ({c.child_code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-5">
            <label className="form-label small fw-bold mb-1">Filter by Vaccine</label>
            <select
              className="form-select"
              value={filterVaccine}
              onChange={(e) => setFilterVaccine(e.target.value)}
            >
              <option value="">All Vaccines (EPI Schedule)</option>
              {vaccines.map(v => (
                <option key={v.vaccine_id} value={v.vaccine_id}>
                  {v.vaccine_name} — Dose #{v.dose_number}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 text-md-end pt-md-4">
            <span className="text-muted small fw-semibold">{records.length} records</span>
          </div>
        </div>
      </div>

      {/* Immunization Table */}
      <div className="health-card p-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading immunization logs..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No immunization records found"
            description="Record administered vaccine doses to update child protection status."
            actionLabel="Record Vaccination"
            onAction={handleOpenModal}
            icon={Syringe}
          />
        ) : (
          <div className="table-responsive">
            <table className="table-health mb-0">
              <thead>
                <tr>
                  <th>Date Administered</th>
                  <th>Child Full Name</th>
                  <th>Vaccine</th>
                  <th>Dose #</th>
                  <th>Administered By</th>
                  <th>Remarks / Lot #</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.record_id}>
                    <td>
                      <div className="fw-semibold">{rec.date_administered}</div>
                    </td>
                    <td>
                      <Link to={`/children/${rec.child_id}`} className="fw-bold text-decoration-none" style={{ color: 'var(--primary)' }}>
                        {rec.child_name}
                      </Link>
                    </td>
                    <td>
                      <span className="fw-bold" style={{ color: 'var(--primary-dark)' }}>{rec.vaccine_name}</span>
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark border">
                        Dose #{rec.dose_number}
                      </span>
                    </td>
                    <td className="small text-muted">{rec.recorded_by_name || 'Staff'}</td>
                    <td className="small text-muted">{rec.remarks || 'Standard Dose'}</td>
                    <td>
                      <StatusBadge status="completed" label="Administered" />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger p-1"
                        title="Delete Record"
                        onClick={() => handleDelete(rec.record_id, rec.child_name, rec.vaccine_name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Immunization Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--card-radius)' }}>
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-2" style={{ backgroundColor: 'var(--mint)', color: 'var(--primary)' }}>
                    <Syringe size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Record Administered Vaccine</h5>
                    <small className="text-muted">Barangay Homapon Health Center</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Child <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={formData.child_id}
                      onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                      required
                    >
                      <option value="">Choose infant/child...</option>
                      {children.map(c => (
                        <option key={c.child_id} value={c.child_id}>
                          {c.full_name} ({c.child_code}) — {c.age_months} mos old
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Vaccine Dose <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={formData.vaccine_id}
                      onChange={(e) => setFormData({ ...formData, vaccine_id: e.target.value })}
                      required
                    >
                      <option value="">Choose Philippine EPI vaccine...</option>
                      {vaccines.map(v => (
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
                      value={formData.date_administered}
                      onChange={(e) => setFormData({ ...formData, date_administered: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Remarks / Batch / Lot #</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Lot #ABC-1234, no adverse reaction observed"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-light border-top" style={{ borderColor: 'var(--border-light)' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-health-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Immunization Record'}
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

export default Immunization;
