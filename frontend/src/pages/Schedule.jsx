import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarClock, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  List, 
  Search, 
  Send, 
  Syringe, 
  Phone 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export function Schedule() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [due, setDue] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const [upRes, dueRes, overRes] = await Promise.allSettled([
        api.get('/schedules/upcoming'),
        api.get('/schedules/due'),
        api.get('/schedules/overdue')
      ]);

      if (upRes.status === 'fulfilled') setUpcoming(upRes.value.data.upcoming || []);
      if (dueRes.status === 'fulfilled') setDue(dueRes.value.data.due || []);
      if (overRes.status === 'fulfilled') setOverdue(overRes.value.data.overdue || []);
    } catch (err) {
      toast.error('Failed to load vaccination schedules');
    } finally {
      setLoading(false);
    }
  };

  const allItems = [
    ...overdue.map(i => ({ ...i, scheduleStatus: 'overdue' })),
    ...due.map(i => ({ ...i, scheduleStatus: 'due' })),
    ...upcoming.map(i => ({ ...i, scheduleStatus: 'upcoming' }))
  ];

  const getFilteredItems = () => {
    let list = allItems;
    if (activeTab === 'overdue') list = overdue.map(i => ({ ...i, scheduleStatus: 'overdue' }));
    else if (activeTab === 'due') list = due.map(i => ({ ...i, scheduleStatus: 'due' }));
    else if (activeTab === 'upcoming') list = upcoming.map(i => ({ ...i, scheduleStatus: 'upcoming' }));

    if (searchTerm.trim()) {
      list = list.filter(item => 
        (item.child_name && item.child_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.vaccine_name && item.vaccine_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.guardian_name && item.guardian_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return list;
  };

  const filteredItems = getFilteredItems();

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Vaccination Schedule Monitoring</h2>
          <p className="text-muted small mb-0">Track upcoming, due today, and overdue child immunization doses in Barangay Homapon</p>
        </div>

        {/* View Mode Toggle */}
        <div className="btn-group bg-white border p-1 rounded-3 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-health-primary' : 'btn-light'} py-1 px-3`}
            onClick={() => setViewMode('list')}
          >
            <List size={15} className="me-1" />
            <span>List View</span>
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-health-primary' : 'btn-light'} py-1 px-3`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={15} className="me-1" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Overdue Vaccinations"
            value={overdue.length}
            icon={AlertTriangle}
            colorScheme="danger"
            note="Urgent follow-up required"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Due Today"
            value={due.length}
            icon={Clock}
            colorScheme="orange"
            note="Scheduled for health center visit"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Upcoming (7 Days)"
            value={upcoming.length}
            icon={CalendarClock}
            colorScheme="warning"
            note="Reminder SMS recommended"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Total Monitored"
            value={allItems.length}
            icon={CheckCircle2}
            colorScheme="primary"
            note="Philippine EPI schedule doses"
          />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="health-card mb-4 p-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Tabs */}
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-health-primary' : 'btn-health-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              All Scheduled ({allItems.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'overdue' ? 'btn-health-primary' : 'btn-health-outline'}`}
              onClick={() => setActiveTab('overdue')}
            >
              Overdue ({overdue.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'due' ? 'btn-health-primary' : 'btn-health-outline'}`}
              onClick={() => setActiveTab('due')}
            >
              Due Today ({due.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-health-primary' : 'btn-health-outline'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcoming.length})
            </button>
          </div>

          {/* Search */}
          <div className="position-relative" style={{ minWidth: '260px' }}>
            <Search size={15} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              className="form-control form-control-sm ps-5"
              placeholder="Search child, vaccine, guardian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="health-card p-0 overflow-hidden">
          {loading ? (
            <LoadingState message="Loading schedule tracking..." />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No vaccination schedules found"
              description="No children are currently pending or overdue in this category."
              icon={CalendarClock}
            />
          ) : (
            <div className="table-responsive">
              <table className="table-health mb-0">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Age</th>
                    <th>Vaccine Target</th>
                    <th>Target Date</th>
                    <th>Guardian & Mobile</th>
                    <th>Status</th>
                    <th className="text-end">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <Link to={`/children/${item.child_id}`} className="fw-bold text-decoration-none" style={{ color: 'var(--primary)' }}>
                          {item.child_name}
                        </Link>
                      </td>
                      <td>{item.age_months} mos</td>
                      <td>
                        <div className="fw-bold" style={{ color: 'var(--primary-dark)' }}>{item.vaccine_name}</div>
                        <small className="text-muted">{item.schedule_reference || `Dose #${item.dose_number || 1}`}</small>
                      </td>
                      <td className="fw-semibold">
                        {item.due_date || item.expected_date}
                      </td>
                      <td>
                        <div>{item.guardian_name || 'N/A'}</div>
                        <small className="text-muted font-monospace">
                          <Phone size={12} className="me-1" />
                          {item.contact_number || 'No contact'}
                        </small>
                      </td>
                      <td>
                        <StatusBadge status={item.scheduleStatus || item.status} />
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <Link 
                            to={`/immunization?action=record&child_id=${item.child_id}`} 
                            className="btn btn-sm btn-health-outline p-1"
                            title="Record Dose"
                          >
                            <Syringe size={15} />
                          </Link>
                          <Link 
                            to={`/sms?action=send&child_id=${item.child_id}&type=${item.scheduleStatus}`} 
                            className="btn btn-sm btn-health-secondary p-1"
                            title="Send SMS Reminder"
                          >
                            <Send size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="health-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Monthly Immunization Schedule Overview</h6>
            <span className="badge bg-light text-muted">Barangay Homapon Health Center</span>
          </div>

          <div className="row g-2 text-center fw-bold small text-muted mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="col p-2 bg-light rounded-2">{d}</div>
            ))}
          </div>

          <div className="row g-2">
            {Array.from({ length: 35 }).map((_, index) => {
              const dayNum = (index % 31) + 1;
              const hasEvents = index % 5 === 2 || index % 7 === 3;
              const sampleCount = hasEvents ? (index % 3) + 1 : 0;

              return (
                <div key={index} className="col" style={{ flex: '0 0 14.28%', minHeight: '90px' }}>
                  <div className="p-2 border rounded-3 h-100 bg-white d-flex flex-column justify-content-between" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="small fw-semibold">{dayNum}</span>
                      {sampleCount > 0 && (
                        <span className="badge rounded-pill bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                          {sampleCount} due
                        </span>
                      )}
                    </div>
                    {sampleCount > 0 && (
                      <div className="d-flex flex-column gap-1 mt-1">
                        <span className="badge badge-upcoming text-truncate p-1" style={{ fontSize: '0.6rem' }}>
                          EPI Routine Doses
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
