import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Film, 
  ArrowLeft, 
  Clock, 
  Globe, 
  Tag, 
  MapPin, 
  BookmarkCheck,
  Ticket,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { getShow } from '../../api/shows';
import { getBookings } from '../../api/bookings';
import { getTheaters } from '../../api/theaters';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function ShowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [show, setShow] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch show record
      const res = await getShow(id);
      const showData = res.data?.data || res.data?.show || res.data;
      setShow(showData);

      const showRefId = showData._id || showData.showId || id;

      // 2. Fetch bookings for this show
      try {
        const bkgRes = await getBookings({ showId: showRefId });
        const bkgData = bkgRes.data?.data || bkgRes.data?.bookings || bkgRes.data || [];
        setBookings(Array.isArray(bkgData) ? bkgData : []);
      } catch (e) {
        console.warn('Could not load bookings for show:', e.message);
      }

      // 3. Fetch all theaters
      try {
        const thrRes = await getTheaters();
        const theaterList = thrRes.data?.data || thrRes.data?.theaters || thrRes.data || [];
        if (Array.isArray(theaterList)) {
          const linkedIds = (showData.theaterIds || []).map((t) => (typeof t === 'object' ? (t._id || t.theaterId) : t));
          const linked = theaterList.filter((t) => 
            linkedIds.includes(t._id) || 
            linkedIds.includes(t.theaterId) ||
            (Array.isArray(t.showIds) && t.showIds.some((sId) => (sId._id || sId) === showRefId || (sId.showId || sId) === showData.showId))
          );
          setTheaters(linked);
        }
      } catch (e) {
        console.warn('Could not load theaters for show:', e.message);
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to fetch show details: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner message="Fetching show details..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/shows')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Shows
      </button>
    </div>
  );
  if (!show) return null;

  const showRefId = show._id || show.showId || id;

  // Filter bookings to ONLY current user's bookings (privacy protecting)
  const myObjId = currentUser?._id ? String(currentUser._id) : '';
  const myCustCode = currentUser?.customerId ? String(currentUser.customerId) : '';

  const myBookings = currentUser ? bookings.filter((b) => {
    const c = b.customerId;
    if (!c) return false;
    if (typeof c === 'object') {
      const cid = c._id ? String(c._id) : '';
      const ccode = c.customerId ? String(c.customerId) : '';
      return (myObjId && cid === myObjId) || (myCustCode && ccode === myCustCode);
    }
    const str = String(c);
    return (myObjId && str === myObjId) || (myCustCode && str === myCustCode);
  }) : [];

  return (
    <div className="container">
      <PageHeader
        title={show.name}
        subtitle="Experience this show live on screen"
        icon={Film}
        badge={
          <span className="badge badge-id">
            {show.showId || 'SHW'}
          </span>
        }
        breadcrumbs={[
          { to: '/shows', label: 'Shows' },
          { label: show.name }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to={`/bookings/new?showId=${showRefId}`}
              className="btn btn-primary"
            >
              <BookmarkCheck size={16} />
              Reserve a Seat
            </Link>
            <Link
              to={`/tickets/new?showId=${showRefId}`}
              className="btn btn-secondary"
            >
              <Ticket size={16} />
              Buy Ticket
            </Link>
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Show Details Card */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <Film size={36} />
              </div>
              <h2 style={{ fontSize: '1.4rem' }}>{show.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                {show.type} • {show.genre}
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Show Code</span>
                <span className="badge badge-id">{show.showId || '—'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Type</span>
                <Badge variant={show.type === 'movies' ? 'gold' : show.type === 'concert' ? 'red' : 'purple'}>
                  {show.type}
                </Badge>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Language</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                  {show.language}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Genre</span>
                <span className="attribute-value">{show.genre || '—'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Duration</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  {show.duration ? `${show.duration} mins` : '—'}
                </span>
              </div>
            </div>

            {/* Quick booking CTA box */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link
                to={`/bookings/new?showId=${showRefId}`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <BookmarkCheck size={16} /> Book Your Seat Now
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Venues & User's Reservations */}
        <div className="relationship-section">
          {/* Venues / Theaters Hosting this show */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <MapPin size={20} />
                <span>Playing At These Venues</span>
                <Badge variant="blue">{theaters.length} Venues</Badge>
              </div>
            </div>

            {theaters.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Venue schedules are currently being updated for this show.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {theaters.map((t) => (
                  <div
                    key={t._id || t.theaterId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <span className="badge badge-id" style={{ marginRight: '0.75rem' }}>
                        {t.theaterId || 'THR'}
                      </span>
                      <strong>{t.email}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Screen: {t.seatNo || 'Auditorium 1'} • Capacity: {t.quantity} seats
                      </div>
                    </div>
                    <Link
                      to={`/bookings/new?showId=${showRefId}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Book Here <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Own Bookings (Privacy-safe: only shows user's personal bookings) */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <BookmarkCheck size={20} />
                <span>Your Reservations For This Show</span>
                {myBookings.length > 0 && <Badge variant="gold">{myBookings.length} Booked</Badge>}
              </div>
              <Link to={`/bookings/new?showId=${showRefId}`} className="btn btn-primary btn-sm">
                + Reserve Seat
              </Link>
            </div>

            {myBookings.length === 0 ? (
              <div style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  {currentUser
                    ? `You haven't reserved a seat for ${show.name} yet.`
                    : 'Select your profile from the top-right menu to view your reservations.'}
                </p>
                <Link to={`/bookings/new?showId=${showRefId}`} className="btn btn-outline btn-sm">
                  <BookmarkCheck size={14} /> Reserve a Seat Now
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myBookings.map((b) => (
                  <div
                    key={b._id || b.bookingId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(245, 158, 11, 0.25)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--accent-gold)' }} />
                        <span className="badge badge-id">{b.bookingId || 'BKG'}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Confirmed Seat</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Booked: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>
                    <Link to={`/bookings/${b._id || b.bookingId}`} className="btn btn-ghost btn-sm">
                      View Details <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
