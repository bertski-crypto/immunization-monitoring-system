import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <div className="p-3 rounded-circle mb-3" style={{ background: 'var(--mint)', color: 'var(--primary)' }}>
        <Loader2 size={32} className="spin-animation" />
      </div>
      <h6 className="fw-semibold text-muted mb-1">{message}</h6>
      <small className="text-light">Please wait a moment</small>

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingState;
