import { useState, useEffect } from 'react';
import { Button, Table, Card, Modal, Form, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

function SMSNotifications() {
  const [logs, setLogs] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    child_id: '',
    notification_type: 'upcoming',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadLogs();
    loadChildren();
  }, [filterType, filterStatus]);

  const loadLogs = async () => {
    try {
      const params = {};
      if (filterType) params.notification_type = filterType;
      if (filterStatus) params.delivery_status = filterStatus;

      const response = await api.get('/sms/logs', { params });
      setLogs(response.data.logs);
    } catch (error) {
      toast.error('Failed to load SMS logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await api.get('/children');
      setChildren(response.data.children);
    } catch (error) {
      console.error('Failed to load children', error);
    }
  };

  const handleShowModal = () => {
    setFormData({
      child_id: '',
      notification_type: 'upcoming',
      message: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await api.post('/sms/send', {
        ...formData,
        child_id: parseInt(formData.child_id)
      });
      toast.success('SMS sent successfully');
      setShowModal(false);
      loadLogs();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send SMS';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      sent: 'success',
      delivered: 'info',
      failed: 'danger',
      pending: 'warning'
    };
    return <Badge bg={colors[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      upcoming: 'info',
      due: 'warning',
      overdue: 'danger',
      follow_up: 'primary',
      reminder: 'primary',
      announcement: 'secondary'
    };
    return <Badge bg={colors[type] || 'secondary'}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading SMS notifications...</p>
      </div>
    );
  }

  const statusCounts = {
    sent: logs.filter(l => l.delivery_status === 'sent').length,
    delivered: logs.filter(l => l.delivery_status === 'delivered').length,
    failed: logs.filter(l => l.delivery_status === 'failed').length,
    pending: logs.filter(l => l.delivery_status === 'pending').length
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>SMS Notifications</h2>
          <p className="text-muted mb-0">Send and track SMS reminders to parents/guardians</p>
        </div>
        <Button variant="primary" onClick={handleShowModal}>
          <i className="bi bi-envelope"></i> Send SMS
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">{statusCounts.sent}</h3>
              <p className="text-muted mb-0">Sent</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info">{statusCounts.delivered}</h3>
              <p className="text-muted mb-0">Delivered</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-danger">{statusCounts.failed}</h3>
              <p className="text-muted mb-0">Failed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">{statusCounts.pending}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Type</Form.Label>
                <Form.Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="due">Due</option>
                  <option value="overdue">Overdue</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="announcement">Announcement</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover>
              <thead className="bg-light">
                <tr>
                  <th>Date/Time</th>
                  <th>Child</th>
                  <th>Recipient</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No SMS notifications found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.sms_id}>
                      <td>{new Date(log.sent_at).toLocaleString()}</td>
                      <td><strong>{log.child_name}</strong></td>
                      <td>{log.guardian_name}</td>
                      <td>{log.recipient_number}</td>
                      <td>{getTypeBadge(log.notification_type)}</td>
                      <td>
                        <small>{log.message.substring(0, 50)}
                        {log.message.length > 50 && '...'}</small>
                      </td>
                      <td>{getStatusBadge(log.delivery_status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Send SMS Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send SMS Notification</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Child <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="child_id"
                value={formData.child_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select child...</option>
                {children.map((child) => (
                  <option key={child.child_id} value={child.child_id}>
                    {child.full_name} - Guardian: {child.guardian?.full_name} ({child.guardian?.contact_number})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notification Type <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="notification_type"
                value={formData.notification_type}
                onChange={handleInputChange}
                required
              >
                <option value="upcoming">Upcoming Vaccination</option>
                <option value="due">Due Vaccination</option>
                <option value="overdue">Overdue Vaccination</option>
                <option value="follow_up">Follow-up Reminder</option>
                <option value="announcement">General Announcement</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message here..."
                maxLength={160}
                required
              />
              <Form.Text className="text-muted">
                {formData.message.length}/160 characters
              </Form.Text>
            </Form.Group>

            <div className="alert alert-info">
              <strong>SMS Templates:</strong>
              <ul className="mb-0 mt-2">
                <li><small>Reminder: [Child Name] is due for [Vaccine] vaccination on [Date]. Please visit Barangay Homapon Health Center.</small></li>
                <li><small>IMPORTANT: [Child Name]'s [Vaccine] vaccination is overdue. Please schedule immediately.</small></li>
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send SMS'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default SMSNotifications;
