import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ 
  icon: Icon = Database, 
  title = 'No records found', 
  description = 'There are no records matching your query or database is currently empty.', 
  actionLabel, 
  actionTo 
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm">
          <Plus size={16} />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
