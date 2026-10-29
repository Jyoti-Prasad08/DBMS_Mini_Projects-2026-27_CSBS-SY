import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone in the database.',
  itemName,
  confirmLabel = 'Delete Record',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-danger">
          <AlertTriangle size={24} />
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">
          {message}
          {itemName && (
            <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600, color: '#fca5a5' }}>
              Target: {itemName}
            </span>
          )}
        </p>
        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onCancel}
            disabled={isLoading}
          >
            <X size={14} />
            {cancelLabel}
          </button>
          <button 
            type="button" 
            className="btn btn-danger btn-sm" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            <Trash2 size={14} />
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
