import React, { useState, useEffect } from 'react';
import { 
  UserRound, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Bell, 
  Edit3, 
  Baby, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export function Guardians() {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    relationship: 'Mother',
    contact_number: '',
    address: 'Barangay Homapon, Legazpi City',
    notification_enabled: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGuardians();
  }, [searchTerm]);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/guardians', {
        params: { search: searchTerm }
      });
      setGuardians(res.data.guardians || []);
    } catch (err) {
      toast.error('Failed to load guardians');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (guardian = null) => {
    if (guardian) {
      setSelectedGuardian(guardian);
      setFormData({
        full_name: guardian.full_name || '',
        relationship: guardian.relationship || 'Mother',
        contact_number: guardian.contact_number || '',
        address: guardian.address || 'Barangay Homapon, Legazpi City',
        notification_enabled: guardian.notification_enabled ?? true
      });
    } else {
      setSelectedGuardian(null);
      setFormData({
        full_name: '',
        relationship: 'Mother',
        contact_number: '',
        address: 'Barangay Homapon, Legazpi City',
        notification_enabled: true
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contact_number.startsWith('09') && !formData.contact_number.startsWith('+63')) {
      toast.warning('Please enter a valid Philippine mobile number (e.g. 09171234567)');
    }

    setSaving(true);
    try {
      if (selectedGuardian) {
        await api.put(`/guardians/${selectedGuardian.guardian_id}`, formData);
        toast.success('Guardian profile updated');
      } else {
        await api.post('/guardians', formData);
        toast.success('New guardian added successfully');
      }
      setShowModal(false);
      loadGuardians();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save guardian';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredGuardians = guardians.filter(g => {
    return searchTerm === '' ||
      g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.contact_number.includes(searchTerm);
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Parents & Guardians</h2>
          <p className="text-muted small mb-0">Registered parents and legal guardians receiving child vaccination alerts</p>
        </div>
        <button className="btn-health-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Add New Guardian</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="health-card mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by guardian name or contact number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end text-muted small fw-semibold">
            {filteredGuardians.length} guardians registered
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="health-card p-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading guardians..." />
        ) : filteredGuardians.length === 0 ? (
          <EmptyState
            title="No guardians found"
            description="Add parents or guardians to link them with children for automated SMS reminders."
            actionLabel="Add Guardian"
            onAction={() => handleOpenModal()}
            icon={UserRound}
          />
        ) : (
          <div className="table-responsive">
            <table className="table-health mb-0">
              <thead>
                <tr>
                  <th>Guardian Full Name</th>
                  <th>Relationship</th>
                  <th>Contact Number (SMS)</th>
                  <th>Address</th>
                  <th>Registered Children</th>
                  <th>SMS Notifications</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuardians.map((g) => (
                  <tr key={g.guardian_id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary-dark)' }}>{g.full_name}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {g.relationship}
                      </span>
                    </td>
                    <td className="font-monospace fw-semibold">
                      <Phone size={13} className="me-1 text-muted" />
                      {g.contact_number}
                    </td>
                    <td className="small text-muted" style={{ maxWidth: 200 }}>
                      {g.address || 'Homapon'}
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-light text-primary border">
                        <Baby size={12} className="me-1" />
                        {g.children_count || 0} child(ren)
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={g.notification_enabled ? 'delivered' : 'failed'}
                        label={g.notification_enabled ? 'Active' : 'Disabled'}
                      />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-health-outline p-1"
                        onClick={() => handleOpenModal(g)}
                        title="Edit Guardian"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Guardian Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--card-radius)' }}>
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <UserRound size={20} className="text-primary" />
                  <h5 className="modal-title fw-bold mb-0">
                    {selectedGuardian ? 'Edit Guardian Profile' : 'Add New Guardian'}
                  </h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Maria Santos"
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold">Relationship <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Guardian">Legal Guardian</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold">Mobile Number (Philippines) <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        placeholder="09171234567"
                        required
                      />
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>e.g. 09171234567</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Residential Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Purok / Zone, Barangay Homapon, Legazpi City"
                    />
                  </div>

                  <div className="form-check p-3 rounded-3 mt-3" style={{ backgroundColor: 'var(--mint-light)' }}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="notification_enabled"
                      checked={formData.notification_enabled}
                      onChange={handleInputChange}
                      id="guardianNotifCheck"
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="guardianNotifCheck">
                      Enable SMS Vaccination Reminders (Semaphore API)
                    </label>
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-light border-top" style={{ borderColor: 'var(--border-light)' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-health-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : selectedGuardian ? 'Update Profile' : 'Save Guardian'}
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

export default Guardians;
