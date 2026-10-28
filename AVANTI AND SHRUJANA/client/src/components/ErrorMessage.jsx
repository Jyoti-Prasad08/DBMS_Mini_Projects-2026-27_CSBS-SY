import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message = 'An unexpected error occurred while communicating with the backend server.', onRetry }) {
  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <AlertCircle size={20} />
        <div>
          <strong>Backend Error: </strong>
          <span>{message}</span>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-sm" style={{ borderColor: 'rgba(220, 38, 38, 0.4)', color: '#fca5a5' }}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
