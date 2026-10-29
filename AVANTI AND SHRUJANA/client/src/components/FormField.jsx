import React from 'react';
import { AlertCircle, Calculator } from 'lucide-react';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helper,
  disabled = false,
  readOnly = false,
  isDerived = false,
  derivedNote = 'Auto-computed from unitPrice × quantity',
  options = [], // For select: [{ value, label }]
  className = '',
  rows = 3,
  min,
  max,
  step
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
          {isDerived && (
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent-gold)' }}>
              (Derived Attribute)
            </span>
          )}
        </label>
      )}

      {isDerived ? (
        <div className="form-derived-box">
          <div className="form-derived-value">
            {value !== undefined && value !== null && value !== '' ? `₹${Number(value).toFixed(2)}` : '₹0.00'}
          </div>
          <div className="form-derived-note">
            <Calculator size={13} />
            {derivedNote}
          </div>
          <input type="hidden" name={name} value={value ?? 0} />
        </div>
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled || readOnly}
          className="form-control"
          style={{ cursor: 'pointer' }}
        >
          <option value="">{placeholder || `-- Select ${label || 'Option'} --`}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          rows={rows}
          className="form-control"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          className={`form-control ${readOnly ? 'read-only' : ''}`}
        />
      )}

      {helper && !error && <div className="form-helper">{helper}</div>}
      {error && (
        <div className="form-error">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}
