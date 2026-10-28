import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Film, 
  MapPin, 
  Ticket, 
  Tag, 
  Coffee, 
  BookmarkCheck, 
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import { getStats } from '../api/stats';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStats();
      const data = res.data?.data || res.data || {};
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Could not load analytics. Please check the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  // Parse aggregation data with robust fallbacks
  const showsByType = stats?.showsByType || [
    { type: 'movies', count: 0 },
    { type: 'live Show', count: 0 },
    { type: 'concert', count: 0 }
  ];

  const totalShowsCount = showsByType.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

  const topCustomers = stats?.topCustomers || [];
  const mostBookedShows = stats?.mostBookedShows || [];
  const topSnacks = stats?.topSnacks || stats?.snackBreakdown || [];
  const couponStats = stats?.couponStats || { active: stats?.activeCoupons || 0, expired: stats?.expiredCoupons || 0 };

  return (
    <div className="container">
      <PageHeader
        title="Analytics & Insights"
        subtitle="Live revenue, top customers, popular shows, and sales breakdowns"
        icon={BarChart3}
        badge={<Badge variant="gold">Live Data</Badge>}
        breadcrumbs={[{ label: 'Statistics' }]}
      />

      {error && <ErrorMessage message={error} onRetry={fetchStats} />}

      {/* Primary Stat Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          colorVariant="gold"
          subtitle="Registered member accounts"
        />
        <StatCard
          title="Total Shows"
          value={stats?.totalShows ?? 0}
          icon={Film}
          colorVariant="red"
          subtitle="Current movies & shows"
        />
        <StatCard
          title="Theaters / Screens"
          value={stats?.totalTheaters ?? 0}
          icon={MapPin}
          colorVariant="blue"
          subtitle="Screen auditoriums"
        />
        <StatCard
          title="Tickets Sold"
          value={stats?.totalTickets ?? 0}
          icon={Ticket}
          colorVariant="purple"
          subtitle="All tickets issued"
        />
        <StatCard
          title="Active Coupons"
          value={couponStats.active ?? stats?.totalCoupons ?? 0}
          icon={Tag}
          colorVariant="green"
          subtitle="Available for use"
        />
        <StatCard
          title="Snack Orders"
          value={stats?.totalSnacks ?? 0}
          icon={Coffee}
          colorVariant="gold"
          subtitle="Concession orders"
        />
        <StatCard
          title="Total Reservations"
          value={stats?.totalBookings ?? 0}
          icon={BookmarkCheck}
          colorVariant="purple"
          subtitle="Confirmed show reservations"
        />
        <StatCard
          title="Total Revenue from Ticket Sales"
          value={`₹${Number(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          colorVariant="green"
          subtitle="Gross ticket earnings"
        />
      </div>

      {/* Analytics Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Shows by Type (CSS Bar Chart) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Film size={20} />
              <span>Shows by Type</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distribution</span>
          </div>

          <div className="chart-bar-container">
            {showsByType.map((item, idx) => {
              const count = item.count || 0;
              const pct = Math.round((count / totalShowsCount) * 100);
              let fillClass = 'fill-gold';
              if (item.type === 'live Show') fillClass = 'fill-purple';
              if (item.type === 'concert') fillClass = 'fill-blue';

              return (
                <div key={item.type || idx} className="chart-bar-item">
                  <div className="chart-bar-header">
                    <span style={{ fontWeight: 600 }}>{item.type || 'Other'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong>{count}</strong> shows ({pct}%)
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${fillClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            * Breakdown across movies, live shows, and concerts.
          </p>
        </div>

        {/* Active Coupons vs Expired Coupons */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Tag size={20} />
              <span>Active Coupons vs Expired Coupons</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Comparison</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem 0' }}>
            <div style={{ flex: 1, padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600, marginBottom: '0.25rem' }}>
                ACTIVE COUPONS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80' }}>
                {couponStats.active ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Valid for ticket purchases
              </div>
            </div>

            <div style={{ flex: 1, padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600, marginBottom: '0.25rem' }}>
                EXPIRED COUPONS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>
                {couponStats.expired ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Past validity date
              </div>
            </div>
          </div>
        </div>

        {/* Most Reserved Shows (from bookings count) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Award size={20} />
              <span>Most Reserved Shows</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By total reservations</span>
          </div>

          {mostBookedShows.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No reservations recorded yet to rank shows.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {mostBookedShows.slice(0, 5).map((s, idx) => (
                <div
                  key={s._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                        color: idx === 0 ? '#0a0a0f' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.9rem' }}>{s.name || s.showName || `Show #${idx + 1}`}</strong>
                  </div>
                  <Badge variant="purple">{s.count || s.totalBookings || 1} Reservations</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers by Tickets Purchased */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Users size={20} />
              <span>Top Customers by Tickets Purchased</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By tickets issued</span>
          </div>

          {topCustomers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No ticket purchases recorded yet to rank patrons.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {topCustomers.slice(0, 5).map((c, idx) => (
                <div
                  key={c._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                        color: idx === 0 ? '#0a0a0f' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.9rem' }}>
                      {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || `Customer #${idx + 1}`}
                    </strong>
                  </div>
                  <Badge variant="gold">
                    {c.ticketCount || c.count || 1} Tickets
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Snack Items Sold Breakdown */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-title">
              <Coffee size={20} />
              <span>Snack Items Sold</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By items ordered</span>
          </div>

          {topSnacks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No concession snack orders placed yet to display breakdown.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {topSnacks.map((item, idx) => (
                <div
                  key={item._id || idx}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {item.itemName || item._id}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                    {item.totalQuantity || item.quantity || item.count || 1} units
                  </div>
                  {item.totalRevenue && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Sales: ₹{Number(item.totalRevenue).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
