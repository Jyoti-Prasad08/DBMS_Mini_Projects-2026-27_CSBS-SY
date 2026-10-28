import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookmarkCheck, 
  Trash2, 
  ArrowLeft, 
  Film, 
  Calendar, 
  Clock, 
  ChevronRight,
  Globe,
  ShieldAlert
} from 'lucide-react';
import { getBooking, deleteBooking } from '../../api/bookings';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loadingUsers } = useUser();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBooking(id);
      const data = res.data?.data || res.data?.booking || res.data;
      setBooking(data);
    } catch (err) {
      console.error(err);
      setError(`Failed to load reservation: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBooking(booking._id || booking.bookingId || id);
      navigate('/bookings');
    } catch (err) {
      alert(`Cancel reservation failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading || loadingUsers) return <LoadingSpinner message="Fetching reservation details..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/bookings')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Reservations
      </button>
    </div>
  );
  if (!booking) return null;

  // Enforce privacy: user cannot view another user's reservation
  const myObjId = currentUser?._id ? String(currentUser._id) : '';
  const myCustCode = currentUser?.customerId ? String(currentUser.customerId) : '';
  const bc = booking.customerId;
  const bookingOwnerId = typeof bc === 'object' ? String(bc._id || '') : String(bc || '');
  const bookingOwnerCode = typeof bc === 'object' ? String(bc.customerId || '') : '';
  const isOwner = (myObjId && bookingOwnerId === myObjId) || (myCustCode && bookingOwnerCode === myCustCode);

  if (currentUser && !isOwner) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <ShieldAlert size={60} style={{ color: 'var(--accent-red)', margin: '0 auto 1.25rem', display: 'block' }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have permission to view other customers' reservations.
        </p>
        <Link to="/bookings" className="btn btn-primary">
          <BookmarkCheck size={16} /> View My Reservations
        </Link>
      </div>
    );
  }

  const show = booking.showId;

  return (
    <div className="container">
      <PageHeader
        title={`Reservation ${booking.bookingId || ''}`}
        subtitle="Your confirmed show seat reservation"
        icon={BookmarkCheck}
        badge={
          <span className="badge badge-id">
            {booking.bookingId || 'BKG'}
          </span>
        }
        breadcrumbs={[
          { to: '/bookings', label: 'My Reservations' },
          { label: booking.bookingId || 'Detail' }
        ]}
        actions={
          <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
            <Trash2 size={16} />
            Cancel Reservation
          </button>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Booking Record Info */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <BookmarkCheck size={36} />
              </div>
              <h2 style={{ fontSize: '1.4rem' }}>{booking.bookingId}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Confirmed Seat
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Reservation Code</span>
                <span className="badge badge-id">{booking.bookingId}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Reservation Date</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'Recent'}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Status</span>
                <Badge variant="green">Confirmed Reservation</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Show Details */}
        <div className="relationship-section">
          {show && typeof show === 'object' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Film size={20} />
                  <span>Reserved Show</span>
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Badge variant={show.type === 'movies' ? 'gold' : show.type === 'concert' ? 'blue' : 'purple'}>
                      {show.type}
                    </Badge>
                    <span className="badge badge-id">{show.showId || 'SHW'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{show.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <Globe size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {show.language} • {show.genre} • ⏱ {show.duration} mins
                  </div>
                </div>

                <Link
                  to={`/shows/${show._id || show.showId}`}
                  className="btn btn-secondary btn-sm"
                >
                  Show Details <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        title="Cancel Reservation"
        itemName={booking.bookingId}
        message="Are you sure you want to cancel this seat reservation? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
