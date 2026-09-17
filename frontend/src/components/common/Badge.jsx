import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  ShieldCheck, 
  Send, 
  XCircle,
  AlertCircle
} from 'lucide-react';

export function StatusBadge({ status, label, icon = true }) {
  const normStatus = (status || '').toLowerCase().trim();

  let badgeClass = 'badge-health ';
  let IconComponent = CheckCircle2;
  let displayLabel = label || status;

  switch (normStatus) {
    case 'completed':
    case 'active':
    case 'delivered':
    case 'sent':
      badgeClass += 'badge-completed';
      IconComponent = CheckCircle2;
      break;

    case 'upcoming':
    case 'pending':
      badgeClass += 'badge-upcoming';
      IconComponent = Calendar;
      break;

    case 'due':
      badgeClass += 'badge-due';
      IconComponent = Clock;
      break;

    case 'overdue':
    case 'inactive':
    case 'archived':
    case 'failed':
      badgeClass += 'badge-overdue';
      IconComponent = AlertTriangle;
      break;

    case 'low':
      badgeClass += 'badge-low';
      IconComponent = ShieldCheck;
      displayLabel = label || 'Low Risk';
      break;

    case 'moderate':
      badgeClass += 'badge-moderate';
      IconComponent = AlertCircle;
      displayLabel = label || 'Moderate Risk';
      break;

    case 'high':
      badgeClass += 'badge-high';
      IconComponent = ShieldAlert;
      displayLabel = label || 'High Risk';
      break;

    default:
      badgeClass += 'badge-completed';
      IconComponent = CheckCircle2;
  }

  return (
    <span className={badgeClass}>
      {icon && <IconComponent size={12} strokeWidth={2.5} />}
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
