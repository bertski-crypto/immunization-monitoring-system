import { useState } from 'react';
import { Card, Form, Button, Table, Badge, Spinner, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('children');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    risk_level: '',
    vaccine_id: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = {};

      switch (reportType) {
        case 'children':
          endpoint = '/reports/children';
          if (filters.start_date) params.start_date = filters.start_date;
          if (filters.end_date) params.end_date = filters.end_date;
          break;
        case 'immunization':
          endpoint = '/reports/immunization';
          if (filters.start_date) params.start_date = filters.start_date;
          if (filters.end_date) params.end_date = filters.end_date;
          if (filters.vaccine_id) params.vaccine_id = filters.vaccine_id;
          break;
        case 'ai_assessment':
          endpoint = '/reports/ai-assessment';
          if (filters.risk_level) params.risk_level = filters.risk_level;
          break;
        case 'sms':
          endpoint = '/reports/sms';
          if (filters.start_date) params.start_date = filters.start_date;
          if (filters.end_date) params.end_date = filters.end_date;
          break;
        default:
          break;
      }

      const response = await api.get(endpoint, { params });
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    toast.info(`Exporting report as ${format}... (Feature coming soon)`);
    // Implementation for PDF/CSV export would go here
  };

  return (
    <div>
      <h2 className="mb-4">Reports</h2>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Generate Report</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="children">Child Registration Report</option>
                  <option value="immunization">Immunization Report</option>
                  <option value="ai_assessment">AI Risk Assessment Report</option>
                  <option value="sms">SMS Notification Report</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            {reportType === 'ai_assessment' && (
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Risk Level</Form.Label>
                  <Form.Select
                    name="risk_level"
                    value={filters.risk_level}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="high">High Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="low">Low Risk</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>

          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {reportData && (
              <>
                <Button 
                  variant="outline-success" 
                  onClick={() => exportReport('PDF')}
                >
                  Export as PDF
                </Button>
                <Button 
                  variant="outline-info" 
                  onClick={() => exportReport('CSV')}
                >
                  Export as CSV
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Generating report...</p>
        </div>
      )}

      {reportData && !loading && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Report Results</h5>
            <Badge bg="primary">{reportData.total || 0} records</Badge>
          </Card.Header>
          <Card.Body>
            <Tabs defaultActiveKey="summary" className="mb-3">
              <Tab eventKey="summary" title="Summary">
                <ReportSummary data={reportData} type={reportType} />
              </Tab>
              <Tab eventKey="details" title="Details">
                <ReportDetails data={reportData} type={reportType} />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}

      {!reportData && !loading && (
        <div className="text-center py-5 text-muted">
          <p>Select report type and filters, then click "Generate Report" to view results.</p>
        </div>
      )}
    </div>
  );
}

function ReportSummary({ data, type }) {
  return (
    <div>
      <h5>Report Summary</h5>
      <Table bordered>
        <tbody>
          <tr>
            <td><strong>Total Records</strong></td>
            <td>{data.total || 0}</td>
          </tr>
          <tr>
            <td><strong>Generated On</strong></td>
            <td>{new Date().toLocaleString()}</td>
          </tr>
          {type === 'ai_assessment' && data.risk_counts && (
            <>
              <tr>
                <td><strong>High Risk</strong></td>
                <td className="text-danger">{data.risk_counts.high}</td>
              </tr>
              <tr>
                <td><strong>Moderate Risk</strong></td>
                <td className="text-warning">{data.risk_counts.moderate}</td>
              </tr>
              <tr>
                <td><strong>Low Risk</strong></td>
                <td className="text-success">{data.risk_counts.low}</td>
              </tr>
            </>
          )}
          {type === 'sms' && data.status_counts && (
            <>
              <tr>
                <td><strong>Sent</strong></td>
                <td className="text-success">{data.status_counts.sent}</td>
              </tr>
              <tr>
                <td><strong>Delivered</strong></td>
                <td className="text-info">{data.status_counts.delivered}</td>
              </tr>
              <tr>
                <td><strong>Failed</strong></td>
                <td className="text-danger">{data.status_counts.failed}</td>
              </tr>
            </>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function ReportDetails({ data, type }) {
  if (!data || data.total === 0) {
    return <p className="text-muted">No records found.</p>;
  }

  // Render different tables based on report type
  switch (type) {
    case 'children':
      return (
        <div className="table-responsive">
          <Table hover>
            <thead className="bg-light">
              <tr>
                <th>Child Code</th>
                <th>Name</th>
                <th>Birth Date</th>
                <th>Sex</th>
                <th>Guardian</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {data.children?.map((child, index) => (
                <tr key={index}>
                  <td>{child.child_code}</td>
                  <td>{child.full_name}</td>
                  <td>{child.birth_date}</td>
                  <td className="text-capitalize">{child.sex}</td>
                  <td>{child.guardian?.full_name}</td>
                  <td>{new Date(child.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );

    case 'immunization':
      return (
        <div className="table-responsive">
          <Table hover>
            <thead className="bg-light">
              <tr>
                <th>Child</th>
                <th>Vaccine</th>
                <th>Dose</th>
                <th>Date Administered</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {data.records?.map((record, index) => (
                <tr key={index}>
                  <td>{record.child_name}</td>
                  <td>{record.vaccine_name}</td>
                  <td>
                    <Badge bg="info">Dose {record.dose_number}</Badge>
                  </td>
                  <td>{record.date_administered}</td>
                  <td>{record.recorded_by_name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );

    case 'ai_assessment':
      return (
        <div className="table-responsive">
          <Table hover>
            <thead className="bg-light">
              <tr>
                <th>Child</th>
                <th>Age</th>
                <th>Risk Level</th>
                <th>Confidence</th>
                <th>Assessment Date</th>
              </tr>
            </thead>
            <tbody>
              {data.assessments?.map((assessment, index) => (
                <tr key={index}>
                  <td>{assessment.child?.full_name}</td>
                  <td>{assessment.child?.age_months} months</td>
                  <td>
                    <Badge 
                      bg={
                        assessment.risk_level === 'high' ? 'danger' :
                        assessment.risk_level === 'moderate' ? 'warning' : 'success'
                      }
                    >
                      {assessment.risk_level?.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    {assessment.prediction_score 
                      ? `${(assessment.prediction_score * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </td>
                  <td>{new Date(assessment.assessment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );

    case 'sms':
      return (
        <div className="table-responsive">
          <Table hover>
            <thead className="bg-light">
              <tr>
                <th>Date/Time</th>
                <th>Child</th>
                <th>Recipient</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.notifications?.map((sms, index) => (
                <tr key={index}>
                  <td>{new Date(sms.sent_at).toLocaleString()}</td>
                  <td>{sms.child_name}</td>
                  <td>{sms.guardian_name}</td>
                  <td className="text-capitalize">{sms.notification_type}</td>
                  <td>
                    <Badge 
                      bg={
                        sms.delivery_status === 'sent' || sms.delivery_status === 'delivered' 
                          ? 'success' 
                          : sms.delivery_status === 'failed' 
                          ? 'danger' 
                          : 'warning'
                      }
                    >
                      {sms.delivery_status?.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );

    default:
      return <p>Report details not available.</p>;
  }
}

export default Reports;
