import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection = 'up', 
  colorScheme = 'primary',
  note
}) {
  const schemeStyles = {
    primary: { bg: 'var(--mint)', text: 'var(--primary)' },
    success: { bg: '#DCFCE7', text: '#16A34A' },
    warning: { bg: '#FEF3C7', text: '#D97706' },
    orange: { bg: '#FFEDD5', text: '#EA580C' },
    danger: { bg: '#FEE2E2', text: '#DC2626' },
  };

  const currentScheme = schemeStyles[colorScheme] || schemeStyles.primary;

  return (
    <div className="stat-widget h-100">
      <div className="d-flex justify-content-between align-items-start">
        <div className="stat-icon-wrapper" style={{ backgroundColor: currentScheme.bg, color: currentScheme.text }}>
          {Icon && <Icon size={22} strokeWidth={2.2} />}
        </div>
        {trend && (
          <div className="stat-trend" style={{ color: trendDirection === 'up' ? '#16A34A' : '#DC2626' }}>
            {trendDirection === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {note && <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>{note}</small>}
      </div>
    </div>
  );
}

export default StatCard;
