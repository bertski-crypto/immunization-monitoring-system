import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  Syringe, 
  CalendarClock, 
  MessageSquare, 
  FileText, 
  ChevronRight 
} from 'lucide-react';

export function QuickActions({ onAddChild, onRecordImmunization }) {
  const actions = [
    {
      title: 'Add Child',
      description: 'Register a new child in Barangay Homapon',
      icon: UserPlus,
      to: '/children?action=add',
      onClick: onAddChild
    },
    {
      title: 'Record Immunization',
      description: 'Add administered vaccination dose',
      icon: Syringe,
      to: '/immunization?action=record',
      onClick: onRecordImmunization
    },
    {
      title: 'Check Schedule',
      description: 'View due and overdue vaccinations',
      icon: CalendarClock,
      to: '/schedule'
    },
    {
      title: 'Send SMS Reminders',
      description: 'Notify parents/guardians via SMS',
      icon: MessageSquare,
      to: '/sms?action=send'
    },
    {
      title: 'Generate Reports',
      description: 'View & download monthly health reports',
      icon: FileText,
      to: '/reports'
    }
  ];

  return (
    <div className="health-card h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Quick Actions</h6>
        <span className="badge bg-light text-muted fw-normal">Shortcut</span>
      </div>

      <div className="d-flex flex-column">
        {actions.map((act, index) => {
          const Icon = act.icon;
          const content = (
            <div className="quick-action-item" key={index} onClick={act.onClick}>
              <div className="d-flex align-items-center gap-3">
                <div className="action-icon">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: '0.88rem' }}>{act.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{act.description}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </div>
          );

          return act.to && !act.onClick ? (
            <Link to={act.to} key={index} style={{ textDecoration: 'none' }}>
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
