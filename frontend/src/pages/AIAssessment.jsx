import { useState, useEffect } from 'react';
import { Button, Table, Card, Badge, Spinner, Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AIAssessment() {
  const [assessments, setAssessments] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterRisk, setFilterRisk] = useState('');

  useEffect(() => {
    loadAssessments();
    loadChildren();
  }, [filterRisk]);

  const loadAssessments = async () => {
    try {
      const params = {};
      if (filterRisk) params.risk_level = filterRisk;

      const response = await api.get('/ai/assessments', { params });
      setAssessments(response.data.assessments);
    } catch (error) {
      toast.error('Failed to load AI assessments');
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

  const handleBatchAssess = async () => {
    if (!window.confirm('Run AI assessment for all active children? This may take a few moments.')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/ai/batch-assess');
      toast.success(`Successfully assessed ${response.data.results.length} children`);
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} assessments failed`);
      }
      loadAssessments();
    } catch (error) {
      toast.error('Failed to run batch assessment');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getRiskBadge = (riskLevel) => {
    const colors = {
      low: 'success',
      moderate: 'warning',
      high: 'danger'
    };
    return <Badge bg={colors[riskLevel] || 'secondary'}>{riskLevel?.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading AI assessments...</p>
      </div>
    );
  }

  const riskCounts = {
    high: assessments.filter(a => a.risk_level === 'high').length,
    moderate: assessments.filter(a => a.risk_level === 'moderate').length,
    low: assessments.filter(a => a.risk_level === 'low').length
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>AI Risk Assessment</h2>
          <p className="text-muted mb-0">
            Machine learning-based risk classification for immunization follow-up prioritization
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleBatchAssess}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Run Batch Assessment'}
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body>
              <h3>{riskCounts.high}</h3>
              <p className="mb-0">High Risk Children</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning text-white">
            <Card.Body>
              <h3>{riskCounts.moderate}</h3>
              <p className="mb-0">Moderate Risk Children</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body>
              <h3>{riskCounts.low}</h3>
              <p className="mb-0">Low Risk Children</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="mb-3">
            <Form.Label>Filter by Risk Level</Form.Label>
            <Form.Select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{ maxWidth: '300px' }}
            >
              <option value="">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="low">Low Risk</option>
            </Form.Select>
          </div>

          <div className="table-responsive">
            <Table hover>
              <thead className="bg-light">
                <tr>
                  <th>Child</th>
                  <th>Age</th>
                  <th>Risk Level</th>
                  <th>Confidence</th>
                  <th>Assessment Date</th>
                  <th>Model Version</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No AI assessments found. Click "Run Batch Assessment" to analyze all children.
                    </td>
                  </tr>
                ) : (
                  assessments.map((assessment) => (
                    <tr key={assessment.assessment_id}>
                      <td>
                        <Link to={`/children/${assessment.child_id}`}>
                          <strong>{assessment.child?.full_name}</strong>
                        </Link>
                      </td>
                      <td>{assessment.child?.age_months} months</td>
                      <td>{getRiskBadge(assessment.risk_level)}</td>
                      <td>
                        {assessment.prediction_score 
                          ? `${(assessment.prediction_score * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                      <td>{new Date(assessment.assessment_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg="secondary">{assessment.model_version}</Badge>
                      </td>
                      <td>
                        <Link to={`/children/${assessment.child_id}`}>
                          <Button variant="outline-primary" size="sm">
                            View Child
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mt-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">About AI Risk Assessment</h5>
        </Card.Header>
        <Card.Body>
          <p>
            The AI risk assessment system uses machine learning to identify children who may require 
            additional immunization follow-up based on factors such as:
          </p>
          <ul>
            <li>Age and expected vaccination schedule</li>
            <li>Number of received vs. missed doses</li>
            <li>Overdue vaccinations and delay patterns</li>
            <li>Immunization completion rate</li>
          </ul>
          <p className="mb-0">
            <strong>Important:</strong> AI predictions are decision support tools only. 
            Health professionals remain responsible for all medical decisions and follow-up actions.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AIAssessment;
