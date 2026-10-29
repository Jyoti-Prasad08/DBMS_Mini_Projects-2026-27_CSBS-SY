/**
 * Landing.jsx — User-facing cinema home page (BookMyShow style)
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Film, Ticket, Tag, Coffee, BookmarkCheck,
  ArrowRight, Sparkles, Star, TrendingUp, Users,
  Tv, Volume2, Armchair, ShieldCheck
} from 'lucide-react';
import { getShows } from '../api/shows';
import { useUser } from '../context/UserContext';
import ErrorMessage from '../components/ErrorMessage';
import Badge from '../components/Badge';

export default function Landing() {
  const { currentUser } = useUser();
  const [featuredShows, setFeaturedShows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShows()
      .then((showsRes) => {
        const list = showsRes.data?.data || showsRes.data?.shows || showsRes.data || [];
        setFeaturedShows(Array.isArray(list) ? list.slice(0, 6) : []);
      })
      .catch((err) => {
        setError('Could not connect to backend. Please ensure the server is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  const getTypeBadge = (type) => {
    if (type === 'movies') return <Badge variant="gold">🎬 Movie</Badge>;
    if (type === 'live Show') return <Badge variant="purple">🎭 Live Show</Badge>;
    if (type === 'concert') return <Badge variant="blue">🎵 Concert</Badge>;
    return <Badge variant="gray">{type}</Badge>;
  };

  return (
    <div className="container">

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Your next great show awaits</span>
        </div>
        <h1 className="hero-title">
          {currentUser
            ? <>Welcome back, <span className="hero-title-highlight">{currentUser.firstName}!</span></>
            : <>Book Shows, <span className="hero-title-highlight">Make Memories</span></>
          }
        </h1>
        <p className="hero-tagline">
          Browse the latest movies, live performances, and concerts — then book your seat in seconds.
        </p>

        {error && <ErrorMessage message={error} />}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.75rem', flexWrap: 'wrap' }}>
          <Link to="/shows" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
            <Film size={18} /> Browse Shows
          </Link>
          {currentUser ? (
            <Link to="/bookings/new" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
              <BookmarkCheck size={18} /> Reserve a Seat
            </Link>
          ) : (
            <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
              <Users size={18} /> Select Your Profile
            </Link>
          )}
        </div>

        {/* Cinema Experience Highlights (User-Facing) */}
        <div style={{
          display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap',
          marginTop: '2.5rem', padding: '1rem 1.5rem',
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          {[
            { label: '4K Laser Projection', icon: Tv },
            { label: 'Dolby Atmos Sound', icon: Volume2 },
            { label: 'Luxury Recliners', icon: Armchair },
            { label: 'Instant Mobile Entry', icon: ShieldCheck },
          ].map(h => {
            const Icon = h.icon;
            return (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Icon size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>{h.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Featured Shows ── */}
      {featuredShows.length > 0 && (
        <section style={{ margin: '3rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} style={{ color: 'var(--accent-gold)' }} />
              Now Showing
            </h2>
            <Link to="/shows" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {featuredShows.map(show => {
              const showId = show._id || show.showId;
              return (
                <div key={showId} className="card" style={{ padding: '1.35rem' }}>
                  {/* Show type color bar */}
                  <div style={{
                    height: '4px', borderRadius: '2px', marginBottom: '1rem',
                    background: show.type === 'movies'
                      ? 'linear-gradient(90deg, #F59E0B, #d97706)'
                      : show.type === 'concert'
                      ? 'linear-gradient(90deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(90deg, #7c3aed, #6d28d9)'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    {getTypeBadge(show.type)}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ⏱ {show.duration} min
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {show.name}
                  </h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {show.genre} · {show.language}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/bookings/new?showId=${showId}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <BookmarkCheck size={13} /> Reserve
                    </Link>
                    <Link
                      to={`/shows/${showId}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Film size={13} /> Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section style={{ margin: '3rem 0' }}>
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={20} style={{ color: 'var(--accent-gold)' }} />
          What would you like to do?
        </h2>
        <div className="quick-nav-grid">
          {[
            {
              title: 'Browse Shows',
              desc: 'Movies, live performances & concerts — find what\'s on.',
              to: '/shows', icon: Film, color: 'gold', cta: 'Explore Shows'
            },
            {
              title: 'My Reservations',
              desc: 'View and manage your booked show seats.',
              to: '/bookings', icon: BookmarkCheck, color: 'purple', cta: 'View Reservations'
            },
            {
              title: 'My Tickets',
              desc: 'All admission tickets you have purchased.',
              to: '/tickets', icon: Ticket, color: 'blue', cta: 'View Tickets'
            },
            {
              title: 'Snack Bar',
              desc: 'Order popcorn, drinks and snacks for your show.',
              to: '/snacks', icon: Coffee, color: 'green', cta: 'Order Snacks'
            },
            {
              title: 'Deals & Offers',
              desc: 'Active discount coupons you can apply to tickets.',
              to: '/coupons', icon: Tag, color: 'red', cta: 'View Deals'
            },
          ].map(card => {
            const Icon = card.icon;
            return (
              <Link to={card.to} key={card.to} className="quick-nav-card">
                <div className={`quick-nav-icon stat-icon-${card.color}`}>
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                    {card.desc}
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                    {card.cta} <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
