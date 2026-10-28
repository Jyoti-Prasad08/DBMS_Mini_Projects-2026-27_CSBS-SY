/**
 * MyProfile.jsx — User's personal profile page
 * Shows the current user's profile details and quick links to their tickets, bookings, snacks
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, Calendar, Ticket, BookmarkCheck,
  Coffee, Edit, ArrowRight, Tag
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyProfile() {
  const { currentUser, loadingUsers } = useUser();

  if (loadingUsers) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!currentUser) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <h2>Profile Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Could not load customer profile.</p>
      </div>
    );
  }

  const userId = currentUser._id || currentUser.customerId;

  const quickLinks = [
    {
      label: 'My Reservations',
      desc: 'Shows you have booked seats for',
      icon: BookmarkCheck,
      to: '/bookings',
      color: 'purple',
    },
    {
      label: 'My Tickets',
      desc: 'Tickets purchased for shows',
      icon: Ticket,
      to: '/tickets',
      color: 'blue',
    },
    {
      label: 'My Snack Orders',
      desc: 'Food & drinks ordered at the theatre',
      icon: Coffee,
      to: '/snacks',
      color: 'green',
    },
    {
      label: 'Deals & Offers',
      desc: 'Browse available discount coupons',
      icon: Tag,
      to: '/coupons',
      color: 'gold',
    },
  ];

  return (
    <div className="container">
      {/* Profile Header */}
      <div className="card profile-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-gold), #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: '#000', flexShrink: 0
          }}>
            {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <span className="badge badge-id">{currentUser.customerId}</span>
              <Badge variant={currentUser.gender === 'Male' ? 'blue' : currentUser.gender === 'Female' ? 'purple' : 'gray'}>
                {currentUser.gender}
              </Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> {currentUser.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} /> {currentUser.contactNo || '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> Age {currentUser.age}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowRight size={20} style={{ color: 'var(--accent-gold)' }} />
        My Activity
      </h2>
      <div className="quick-nav-grid" style={{ marginBottom: '2rem' }}>
        {quickLinks.map((lnk) => {
          const Icon = lnk.icon;
          return (
            <Link to={lnk.to} key={lnk.to} className="quick-nav-card">
              <div className={`quick-nav-icon stat-icon-${lnk.color}`}>
                <Icon size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{lnk.label}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{lnk.desc}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                  View <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
