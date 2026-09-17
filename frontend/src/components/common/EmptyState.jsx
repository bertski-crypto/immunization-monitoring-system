import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export function EmptyState({ 
  title = 'No records found', 
  description = 'Try adjusting your search terms or filters.',
  actionLabel,
  onAction,
  icon: CustomIcon
}) {
  const IconComponent = CustomIcon || Inbox;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center">
      <div 
        className="p-3 rounded-circle mb-3 d-flex align-items-center justify-content-center"
        style={{ width: '64px', height: '64px', backgroundColor: 'var(--mint)', color: 'var(--primary)' }}
      >
        <IconComponent size={30} strokeWidth={1.75} />
      </div>
      <h6 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>{title}</h6>
      <p className="text-muted small mb-3" style={{ maxWidth: '360px' }}>{description}</p>
      {actionLabel && onAction && (
        <button className="btn-health-primary btn-sm" onClick={onAction}>
          <Plus size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export default EmptyState;
