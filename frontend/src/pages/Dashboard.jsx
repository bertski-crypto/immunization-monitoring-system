import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UsersRound, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  MessageSquare,
  Activity,
  MapPin,
  Syringe
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';
import authService from '../services/authService';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import StatusBadge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';

export function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [stats, setStats] = useState(null);
  const [upcomingList, setUpcomingList] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, upcomingRes, immRes] = await Promise.allSettled([
        api.get('/schedules/dashboard-stats'),
        api.get('/schedules/upcoming'),
        api.get('/immunization?per_page=5')
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (upcomingRes.status === 'fulfilled') {
        setUpcomingList(upcomingRes.value.data.upcoming || []);
      }
      if (immRes.status === 'fulfilled') {
        setRecentRecords(immRes.value.data.records || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading healthcare dashboard..." />;
  }

  // Chart data calculations
  const totalChildren = stats?.total_children || 0;
  const completedCount = stats?.total_immunizations || 0;
  const upcomingCount = stats?.upcoming || 0;
  const dueCount = stats?.due || 0;
  const overdueCount = stats?.overdue || 0;

  const immunizationChartData = [
    { name: 'Completed', value: completedCount || 1, color: '#20B77A' },
    { name: 'Upcoming', value: upcomingCount || 0, color: '#F59E0B' },
    { name: 'Due', value: dueCount || 0, color: '#F97316' },
    { name: 'Overdue', value: overdueCount || 0, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const lowRisk = stats?.low_risk || 0;
  const modRisk = stats?.moderate_risk || 0;
  const highRisk = stats?.high_risk || 0;
  const totalRisk = (lowRisk + modRisk + highRisk) || (totalChildren || 1);

  const riskChartData = [
    { name: 'Low Risk', value: lowRisk || (totalChildren ? totalChildren : 1), color: '#20B77A' },
    { name: 'Moderate Risk', value: modRisk, color: '#F59E0B' },
    { name: 'High Risk', value: highRisk, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const sentSms = stats?.sent_sms || 0;
  const failedSms = stats?.failed_sms || 0;
  const totalSms = stats?.total_sms || sentSms;
  const pendingSms = Math.max(0, totalSms - (sentSms + failedSms));

  const smsChartData = [
    { name: 'Delivered / Sent', value: sentSms || 1, color: '#20B77A' },
    { name: 'Pending', value: pendingSms, color: '#F59E0B' },
    { name: 'Failed', value: failedSms, color: '#EF4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Greeting & Facility Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 className="fw-extrabold mb-1" style={{ color: 'var(--primary-dark)', fontSize: '1.75rem' }}>
            {getGreeting()}, {user?.full_name ? user.full_name.split(' ')[0] : 'Healthcare Worker'}! 👋
          </h2>
          <p className="text-muted small mb-0">
            Here's what's happening with the Barangay Homapon child immunization program today.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 text-muted small bg-white px-3 py-2 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
          <MapPin size={15} className="text-danger" />
          <span className="fw-semibold">Brgy. Homapon, Legazpi City</span>
          <span className="text-muted">|</span>
          <span>{currentDateFormatted}</span>
        </div>
      </div>

      {/* 2. 5 Summary Stat Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Total Children"
            value={totalChildren}
            icon={UsersRound}
            colorScheme="primary"
            trend="+12%"
            trendDirection="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Fully Immunized"
            value={stats?.fully_immunized || 0}
            icon={ShieldCheck}
            colorScheme="success"
            trend="+8%"
            trendDirection="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Upcoming Vaccinations"
            value={upcomingCount}
            icon={Calendar}
            colorScheme="warning"
            trend="+5%"
            trendDirection="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Due Vaccinations"
            value={dueCount}
            icon={Clock}
            colorScheme="orange"
            trend="-3%"
            trendDirection="down"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Overdue Vaccinations"
            value={overdueCount}
            icon={AlertTriangle}
            colorScheme="danger"
            trend="-2%"
            trendDirection="down"
          />
        </div>
      </div>

      {/* 3. 3 Donut Charts: Immunization Status, AI Risk Classification, SMS Status */}
      <div className="row g-3">
        {/* Donut 1: Immunization Status */}
        <div className="col-12 col-lg-4">
          <div className="health-card h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 className="fw-bold mb-0">Immunization Status</h6>
                <small className="text-muted">Current progress breakdown</small>
              </div>
              <span className="badge bg-light text-muted fw-normal">This Month</span>
            </div>

            <div className="position-relative d-flex justify-content-center align-items-center my-2" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={immunizationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {immunizationChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} records`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
                <div className="fw-bold fs-4" style={{ color: 'var(--text-main)', lineHeight: 1 }}>{totalChildren}</div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Children</small>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between gap-2 pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
              <div className="d-flex align-items-center gap-1 small">
                <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#20B77A' }}></span>
                <span className="text-muted">Completed ({completedCount})</span>
              </div>
              <div className="d-flex align-items-center gap-1 small">
                <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#F59E0B' }}></span>
                <span className="text-muted">Upcoming ({upcomingCount})</span>
              </div>
              <div className="d-flex align-items-center gap-1 small">
                <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#F97316' }}></span>
                <span className="text-muted">Due ({dueCount})</span>
              </div>
              <div className="d-flex align-items-center gap-1 small">
                <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#EF4444' }}></span>
                <span className="text-muted">Overdue ({overdueCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donut 2: AI Risk Classification */}
        <div className="col-12 col-lg-4">
          <div className="health-card h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 className="fw-bold mb-0">AI-Assisted Risk Classification</h6>
                <small className="text-muted">Follow-up prioritization model</small>
              </div>
              <Link to="/ai-assessment" className="small text-decoration-none fw-semibold" style={{ color: 'var(--primary)' }}>
                View →
              </Link>
            </div>

            <div className="position-relative d-flex justify-content-center align-items-center my-2" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskChartData.map((entry, idx) => (
                      <Cell key={`cell-risk-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} children`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
                <div className="fw-bold fs-4" style={{ color: 'var(--text-main)', lineHeight: 1 }}>{totalRisk}</div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Assessed</small>
              </div>
            </div>

            <div className="d-flex justify-content-around pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-center small">
                <span className="d-block fw-bold text-success">{lowRisk}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Low Risk</span>
              </div>
              <div className="text-center small">
                <span className="d-block fw-bold text-warning">{modRisk}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Moderate</span>
              </div>
              <div className="text-center small">
                <span className="d-block fw-bold text-danger">{highRisk}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>High Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donut 3: SMS Status */}
        <div className="col-12 col-lg-4">
          <div className="health-card h-100 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 className="fw-bold mb-0">SMS Notification Status</h6>
                <small className="text-muted">Guardian alert deliveries</small>
              </div>
              <Link to="/sms" className="small text-decoration-none fw-semibold" style={{ color: 'var(--primary)' }}>
                Logs →
              </Link>
            </div>

            <div className="position-relative d-flex justify-content-center align-items-center my-2" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={smsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {smsChartData.map((entry, idx) => (
                      <Cell key={`cell-sms-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} notifications`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
                <div className="fw-bold fs-4" style={{ color: 'var(--text-main)', lineHeight: 1 }}>{totalSms}</div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Sent SMS</small>
              </div>
            </div>

            <div className="d-flex justify-content-around pt-2 border-top" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-center small">
                <span className="d-block fw-bold text-success">{sentSms}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Delivered</span>
              </div>
              <div className="text-center small">
                <span className="d-block fw-bold text-warning">{pendingSms}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Pending</span>
              </div>
              <div className="text-center small">
                <span className="d-block fw-bold text-danger">{failedSms}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Failed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tables and Quick Actions */}
      <div className="row g-4">
        {/* Left Column: Upcoming Vaccinations & Recent Records */}
        <div className="col-12 col-xl-8 d-flex flex-column gap-4">
          {/* Upcoming Vaccinations Table Card */}
          <div className="health-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">Upcoming Vaccinations (Next 7 Days)</h6>
                <small className="text-muted">Children scheduled for immunization</small>
              </div>
              <Link to="/schedule" className="btn btn-sm btn-health-outline py-1 px-2" style={{ fontSize: '0.75rem' }}>
                View All Schedule →
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table-health">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Vaccine</th>
                    <th>Dose</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted small">
                        No upcoming vaccinations due in the next 7 days.
                      </td>
                    </tr>
                  ) : (
                    upcomingList.slice(0, 5).map((item, i) => (
                      <tr key={i}>
                        <td className="fw-semibold">
                          <Link to={`/children/${item.child_id}`} className="text-dark text-decoration-none">
                            {item.child_name}
                          </Link>
                        </td>
                        <td>{item.vaccine_name}</td>
                        <td>Dose #{item.dose_number || 1}</td>
                        <td>{item.expected_date}</td>
                        <td>
                          <StatusBadge status={item.status || 'upcoming'} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Immunization Records */}
          <div className="health-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">Recent Immunization Records</h6>
                <small className="text-muted">Latest administered vaccine doses</small>
              </div>
              <Link to="/immunization" className="btn btn-sm btn-health-outline py-1 px-2" style={{ fontSize: '0.75rem' }}>
                View All Records →
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table-health">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Vaccine Administered</th>
                    <th>Date Administered</th>
                    <th>Administered By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted small">
                        No immunization records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentRecords.map((rec) => (
                      <tr key={rec.record_id}>
                        <td className="fw-semibold">
                          <Link to={`/children/${rec.child_id}`} className="text-dark text-decoration-none">
                            {rec.child_name}
                          </Link>
                        </td>
                        <td>
                          <div className="fw-bold" style={{ color: 'var(--primary-dark)' }}>{rec.vaccine_name}</div>
                          <small className="text-muted">Dose #{rec.dose_number}</small>
                        </td>
                        <td>{rec.date_administered}</td>
                        <td className="small text-muted">{rec.health_worker_name || 'Staff'}</td>
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
        </div>

        {/* Right Column: Quick Actions Shortcut */}
        <div className="col-12 col-xl-4">
          <QuickActions 
            onAddChild={() => navigate('/children?action=add')}
            onRecordImmunization={() => navigate('/immunization?action=record')}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
