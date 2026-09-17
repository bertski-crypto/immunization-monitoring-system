import { useState, useEffect } from 'react';
import { Button, Table, Card, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import authService from '../services/authService';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'health_worker',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        password: '', // Don't populate password for security
        role: user.role || 'health_worker',
        status: user.status || 'active'
      });
    } else {
      setSelectedUser(null);
      setFormData({
        full_name: '',
        username: '',
        password: '',
        role: 'health_worker',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = { ...formData };
      
      // Don't send empty password on update
      if (selectedUser && !submitData.password) {
        delete submitData.password;
      }

      if (selectedUser) {
        await api.put(`/users/${selectedUser.user_id}`, submitData);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', submitData);
        toast.success('User created successfully');
      }
      handleCloseModal();
      loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save user';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user status';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>User Management</h2>
          <p className="text-muted mb-0">Administrator access only</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle"></i> Add New User
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead className="bg-light">
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <strong>{user.full_name}</strong>
                        {user.user_id === currentUser?.user_id && (
                          <Badge bg="primary" className="ms-2">You</Badge>
                        )}
                      </td>
                      <td>{user.username}</td>
                      <td className="text-capitalize">
                        <Badge bg={user.role === 'administrator' ? 'danger' : 'info'}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleShowModal(user)}
                        >
                          Edit
                        </Button>
                        {user.user_id !== currentUser?.user_id && (
                          <Button
                            variant={user.status === 'active' ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            onClick={() => handleToggleStatus(user.user_id)}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* User Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Enter username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Password {selectedUser ? '' : <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!selectedUser}
                placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
              />
              {selectedUser && (
                <Form.Text className="text-muted">
                  Leave blank to keep the current password
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="health_worker">Health Worker</option>
                <option value="administrator">Administrator</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <div className="alert alert-warning">
              <small>
                <strong>Note:</strong> Administrators have full system access including user management.
                Health workers can manage children, immunizations, and view reports.
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Users;
