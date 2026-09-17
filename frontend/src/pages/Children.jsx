import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Archive, 
  UsersRound, 
  Baby, 
  Calendar, 
  Phone, 
  MapPin, 
  Check, 
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export function Children() {
  const location = useLocation();
  const [children, setChildren] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  // Form State with Section 1 (Child) & Section 2 (Guardian selection / create)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    sex: 'male',
    address: 'Barangay Homapon, Legazpi City',
    guardian_id: '',
    // Quick inline guardian fields
    new_guardian: false,
    guardian_name: '',
    guardian_relationship: 'Mother',
    guardian_contact: '',
    notification_enabled: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChildren();
    loadGuardians();
  }, [filterStatus]);

  // Open modal if action=add query parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      handleOpenModal();
    }
  }, [location.search]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const response = await api.get('/children', { params });
      setChildren(response.data.children || []);
    } catch (err) {
      toast.error('Failed to load child records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGuardians = async () => {
    try {
      const response = await api.get('/guardians');
      setGuardians(response.data.guardians || []);
    } catch (err) {
      console.error('Failed to load guardians', err);
    }
  };

  const handleOpenModal = (child = null) => {
    if (child) {
      setSelectedChild(child);
      setFormData({
        first_name: child.first_name || '',
        middle_name: child.middle_name || '',
        last_name: child.last_name || '',
        birth_date: child.birth_date || '',
        sex: child.sex || 'male',
        address: child.address || 'Barangay Homapon, Legazpi City',
        guardian_id: child.guardian_id || '',
        new_guardian: false,
        guardian_name: '',
        guardian_relationship: 'Mother',
        guardian_contact: '',
        notification_enabled: true
      });
    } else {
      setSelectedChild(null);
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        birth_date: '',
        sex: 'male',
        address: 'Barangay Homapon, Legazpi City',
        guardian_id: guardians.length > 0 ? guardians[0].guardian_id : '',
        new_guardian: false,
        guardian_name: '',
        guardian_relationship: 'Mother',
        guardian_contact: '',
        notification_enabled: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedChild(null);
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
    setSaving(true);

    try {
      let finalGuardianId = formData.guardian_id;

      // If creating new guardian inline
      if (formData.new_guardian && !selectedChild) {
        if (!formData.guardian_name || !formData.guardian_contact) {
          toast.error('Please enter guardian name and contact number');
          setSaving(false);
          return;
        }
        const gRes = await api.post('/guardians', {
          full_name: formData.guardian_name,
          relationship: formData.guardian_relationship,
          contact_number: formData.guardian_contact,
          address: formData.address,
          notification_enabled: formData.notification_enabled
        });
        finalGuardianId = gRes.data.guardian.guardian_id;
      }

      if (!finalGuardianId) {
        toast.error('A guardian is required to register a child');
        setSaving(false);
        return;
      }

      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        sex: formData.sex,
        address: formData.address,
        guardian_id: parseInt(finalGuardianId)
      };

      if (selectedChild) {
        await api.put(`/children/${selectedChild.child_id}`, payload);
        toast.success('Child profile updated successfully');
      } else {
        await api.post('/children', payload);
        toast.success('New child registered successfully');
      }

      handleCloseModal();
      loadChildren();
      loadGuardians();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save child record';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (childId, name) => {
    if (!window.confirm(`Are you sure you want to archive record for ${name}?`)) return;

    try {
      await api.patch(`/children/${childId}/archive`);
      toast.success('Child record archived');
      loadChildren();
    } catch (err) {
      toast.error('Failed to archive child record');
    }
  };

  // Filter children in memory for fast instant search
  const filteredChildren = children.filter(c => {
    const matchSearch = searchTerm === '' || 
      (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.child_code && c.child_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.guardian?.full_name && c.guardian.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSex = !filterSex || c.sex === filterSex;
    return matchSearch && matchSex;
  });

  return (
    <div>
      {/* Header & Main Actions */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Children Registry</h2>
          <p className="text-muted small mb-0">Registered infants and children under the Barangay Homapon immunization program</p>
        </div>
        <button className="btn-health-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Register New Child</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="health-card mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by name, child code, or guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
            >
              <option value="">All Sexes</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="active">Active Records</option>
              <option value="archived">Archived Records</option>
              <option value="">All Statuses</option>
            </select>
          </div>
          <div className="col-12 col-md-1 text-md-end text-muted small fw-semibold">
            {filteredChildren.length} items
          </div>
        </div>
      </div>

      {/* Children Data Table */}
      <div className="health-card p-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading children registry..." />
        ) : filteredChildren.length === 0 ? (
          <EmptyState
            title="No children records found"
            description="No matching records in the system. Click Register New Child to add an infant."
            actionLabel="Register New Child"
            onAction={() => handleOpenModal()}
            icon={Baby}
          />
        ) : (
          <div className="table-responsive">
            <table className="table-health mb-0">
              <thead>
                <tr>
                  <th>Child Code</th>
                  <th>Child Full Name</th>
                  <th>Age (Months)</th>
                  <th>Sex</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((child) => (
                  <tr key={child.child_id}>
                    <td>
                      <span className="badge font-monospace" style={{ backgroundColor: 'var(--mint)', color: 'var(--primary-dark)', fontSize: '0.8rem' }}>
                        {child.child_code}
                      </span>
                    </td>
                    <td>
                      <Link to={`/children/${child.child_id}`} className="fw-bold text-decoration-none" style={{ color: 'var(--primary)' }}>
                        {child.full_name}
                      </Link>
                      <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                        DOB: {child.birth_date}
                      </small>
                    </td>
                    <td>
                      <span className="fw-semibold">{child.age_months}</span>
                      <span className="text-muted small"> mos</span>
                    </td>
                    <td className="text-capitalize">{child.sex}</td>
                    <td>
                      <div className="fw-semibold">{child.guardian?.full_name || 'N/A'}</div>
                      <small className="text-muted">{child.guardian?.relationship || 'Parent'}</small>
                    </td>
                    <td>
                      <div className="small font-monospace text-muted">
                        <Phone size={12} className="me-1" />
                        {child.guardian?.contact_number || 'None'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={child.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <Link to={`/children/${child.child_id}`} className="btn btn-sm btn-health-outline p-1" title="View Profile">
                          <Eye size={15} />
                        </Link>
                        <button 
                          className="btn btn-sm btn-health-outline p-1" 
                          title="Edit Child"
                          onClick={() => handleOpenModal(child)}
                        >
                          <Edit3 size={15} />
                        </button>
                        {child.status === 'active' && (
                          <button
                            className="btn btn-sm btn-outline-danger p-1"
                            title="Archive Record"
                            onClick={() => handleArchive(child.child_id, child.full_name)}
                          >
                            <Archive size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2-Section Add / Edit Child Modal */}
      {showModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 'var(--card-radius)' }}>
              <div className="modal-header border-bottom px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-2" style={{ backgroundColor: 'var(--mint)', color: 'var(--primary)' }}>
                    <Baby size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">
                      {selectedChild ? 'Edit Child Profile' : 'Register New Child'}
                    </h5>
                    <small className="text-muted">Barangay Homapon Immunization Registry</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close"></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 overflow-auto" style={{ maxHeight: '75vh' }}>
                  {/* Section 1: Child Information */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                      <span className="badge rounded-circle bg-primary text-white" style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      <h6 className="fw-bold mb-0 text-primary">Child Information</h6>
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-bold">First Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Juan"
                          required
                        />
                      </div>
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-bold">Middle Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="middle_name"
                          value={formData.middle_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Reyes"
                        />
                      </div>
                      <div className="col-12 col-sm-4">
                        <label className="form-label small fw-bold">Last Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Dela Cruz"
                          required
                        />
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold">Date of Birth <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          name="birth_date"
                          value={formData.birth_date}
                          onChange={handleInputChange}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold">Sex <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="sex"
                          value={formData.sex}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div className="col-12">
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
                    </div>
                  </div>

                  {/* Section 2: Guardian Information */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-circle bg-primary text-white" style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                        <h6 className="fw-bold mb-0 text-primary">Guardian / Parent Information</h6>
                      </div>
                      {!selectedChild && (
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="new_guardian"
                            checked={formData.new_guardian}
                            onChange={handleInputChange}
                            id="newGuardianSwitch"
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="newGuardianSwitch">
                            Add New Guardian
                          </label>
                        </div>
                      )}
                    </div>

                    {!formData.new_guardian || selectedChild ? (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label small fw-bold">Select Existing Guardian <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            name="guardian_id"
                            value={formData.guardian_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Choose registered parent/guardian...</option>
                            {guardians.map(g => (
                              <option key={g.guardian_id} value={g.guardian_id}>
                                {g.full_name} ({g.relationship}) — {g.contact_number}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted mt-1 d-block">
                            Select the primary parent or guardian who will receive SMS vaccination reminders.
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="row g-3 p-3 rounded-3" style={{ backgroundColor: 'var(--mint-light)', border: '1px dashed var(--accent)' }}>
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-bold">Guardian Full Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            name="guardian_name"
                            value={formData.guardian_name}
                            onChange={handleInputChange}
                            placeholder="e.g. Maria Santos"
                            required={formData.new_guardian}
                          />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-bold">Relationship <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            name="guardian_relationship"
                            value={formData.guardian_relationship}
                            onChange={handleInputChange}
                          >
                            <option value="Mother">Mother</option>
                            <option value="Father">Father</option>
                            <option value="Grandmother">Grandmother</option>
                            <option value="Grandfather">Grandfather</option>
                            <option value="Other">Other Guardian</option>
                          </select>
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-bold">Mobile Number (SMS Alerts) <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            name="guardian_contact"
                            value={formData.guardian_contact}
                            onChange={handleInputChange}
                            placeholder="09171234567"
                            required={formData.new_guardian}
                          />
                        </div>
                        <div className="col-12 col-sm-6 d-flex align-items-center">
                          <div className="form-check mt-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="notification_enabled"
                              checked={formData.notification_enabled}
                              onChange={handleInputChange}
                              id="notifConsent"
                            />
                            <label className="form-check-label small fw-semibold" htmlFor="notifConsent">
                              Consent to receive SMS vaccination reminders
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-light border-top" style={{ borderColor: 'var(--border-light)' }}>
                  <button type="button" className="btn btn-secondary btn-sm rounded-3" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-health-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : selectedChild ? 'Save Changes' : 'Register Child'}
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

export default Children;
