import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <div 
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-red-subtle)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}
      >
        <Film size={40} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fbbf24' }}>
        Scene Not Found
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 2rem auto', fontSize: '1rem' }}>
        The page or cinema record you are looking for does not exist in the database or has been relocated.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={16} />
          Return to Dashboard
        </Link>
        <button onClick={() => window.history.back()} className="btn btn-secondary">
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}
