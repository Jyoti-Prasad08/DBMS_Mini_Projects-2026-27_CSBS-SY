/**
 * ShowList.jsx — Read-only public show catalogue (no admin controls)
 * Users can browse and click "Reserve" or "Buy Ticket" from here.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Eye, Clock, Globe, BookmarkCheck, Ticket, Search } from 'lucide-react';
import { getShows } from '../../api/shows';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function ShowList() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');

  const fetchShows = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getShows({ type: typeFilter, language: langFilter });
      const data = res.data?.data || res.data?.shows || res.data || [];
      setShows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load shows. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShows(); }, [typeFilter, langFilter]);

  const filteredShows = shows.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.genre || '').toLowerCase().includes(q) ||
      (s.language || '').toLowerCase().includes(q)
    );
  });

  const getTypeBadge = (type) => {
    if (type === 'movies')    return <Badge variant="gold">🎬 Movie</Badge>;
    if (type === 'live Show') return <Badge variant="purple">🎭 Live Show</Badge>;
    if (type === 'concert')   return <Badge variant="blue">🎵 Concert</Badge>;
    return <Badge variant="gray">{type}</Badge>;
  };

  return (
    <div className="container">
      <PageHeader
        title="Browse Shows"
        subtitle="Discover movies, live performances, and concerts playing near you"
        icon={Film}
        badge={<Badge variant="gold">{filteredShows.length} Showing</Badge>}
        breadcrumbs={[{ label: 'Browse Shows' }]}
      />

      {/* Category Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'All',          val: '',         emoji: '🎞' },
          { label: 'Movies',       val: 'movies',   emoji: '🎬' },
          { label: 'Live Shows',   val: 'live Show', emoji: '🎭' },
          { label: 'Concerts',     val: 'concert',  emoji: '🎵' },
        ].map(tab => (
          <button
            key={tab.val}
            type="button"
            onClick={() => setTypeFilter(tab.val)}
            className={`btn btn-sm ${typeFilter === tab.val ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}

        {/* Language filter */}
        <select
          className="select-filter"
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          style={{ marginLeft: 'auto' }}
        >
          <option value="">All Languages</option>
          {['English','Hindi','Spanish','Japanese','Korean'].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '420px' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, genre, language..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchShows} />}
      {loading && <LoadingSpinner message="Loading shows..." />}

      {/* Show Cards Grid */}
      {!loading && !error && (
        <>
          {filteredShows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Film size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3>No shows found</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '1.25rem'
            }}>
              {filteredShows.map(show => {
                const showId = show._id || show.showId;
                return (
                  <div key={showId} className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column' }}>
                    {/* Color bar by type */}
                    <div style={{
                      height: '4px', borderRadius: '2px', marginBottom: '1rem',
                      background: show.type === 'movies'
                        ? 'linear-gradient(90deg,#F59E0B,#d97706)'
                        : show.type === 'concert'
                        ? 'linear-gradient(90deg,#2563eb,#1d4ed8)'
                        : 'linear-gradient(90deg,#7c3aed,#6d28d9)'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      {getTypeBadge(show.type)}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {show.duration} min
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{show.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      <Globe size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                      {show.language} · {show.genre}
                    </p>

                    {show.showId && (
                      <span className="badge badge-id" style={{ alignSelf: 'flex-start', marginBottom: '1rem', fontSize: '0.7rem' }}>
                        {show.showId}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <Link
                        to={`/bookings/new?showId=${showId}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <BookmarkCheck size={13} /> Reserve
                      </Link>
                      <Link
                        to={`/tickets/new?showId=${showId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Ticket size={13} /> Buy Ticket
                      </Link>
                      <Link
                        to={`/shows/${showId}`}
                        className="btn btn-outline btn-sm"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
