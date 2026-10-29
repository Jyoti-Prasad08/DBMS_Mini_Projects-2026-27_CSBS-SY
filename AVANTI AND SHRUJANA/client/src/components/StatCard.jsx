import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  colorVariant = 'gold', 
  subtitle 
}) {
  const iconClass = `stat-icon-${colorVariant}`;

  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${iconClass}`}>
        {Icon && <Icon size={26} />}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
