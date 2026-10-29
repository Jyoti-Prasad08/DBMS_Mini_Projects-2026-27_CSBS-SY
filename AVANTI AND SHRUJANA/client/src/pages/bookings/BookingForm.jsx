import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BookmarkCheck, Save, X, Film, CheckCircle2, Ticket } from 'lucide-react';
import { createBooking } from '../../api/bookings';
import { createTicket } from '../../api/tickets';
import { getShows } from '../../api/shows';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function BookingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();

  // Check if showId was passed in query string (e.g. /bookings/new?showId=...)
  const queryParams = new URLSearchParams(location.search);
  const initialShowId = queryParams.get('showId') || '';

  const [formData, setFormData] = useState({
    bookingId: `BKG-${Math.floor(100 + Math.random() * 900)}`,
    showId: initialShowId,
    seatNo: 'A-12',
    unitPrice: '250'
  });

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const sRes = await getShows();
        const showList = sRes.data?.data || sRes.data?.shows || sRes.data || [];
        setShows(Array.isArray(showList) ? showList : []);
      } catch (err) {
        setError(`Failed to load shows: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.showId) errors.showId = 'Please select a show to reserve';
    if (!formData.bookingId.trim()) errors.bookingId = 'Booking reference code is required';
    if (!formData.seatNo.trim()) errors.seatNo = 'Seat number is required (e.g. A-12)';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser) {
      setError('Please select a profile from the top-right menu before reserving.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const custId = currentUser._id || currentUser.customerId;

      // Create Booking reservation (backend automatically creates synchronized ticket)
      const payload = {
        bookingId: formData.bookingId,
        customerId: custId,
        showId: formData.showId,
        seatNo: formData.seatNo || 'A-12',
        unitPrice: Number(formData.unitPrice) || 250
      };

      const res = await createBooking(payload);
      const saved = res.data?.data || res.data?.booking || res.data;
      const targetId = saved?._id || saved?.bookingId || formData.bookingId;

      navigate(`/bookings/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Error reserving seat');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading shows..." />;

  const showOptions = shows.map((s) => ({
    value: s._id || s.showId,
    label: `${s.name} (${s.type} • ${s.language})`
  }));

  const selectedShow = shows.find(s => (s._id || s.showId) === formData.showId);

  return (
    <div className="container">
      <PageHeader
        title="Reserve a Seat"
        subtitle="Book your seat and get your admission ticket issued"
        icon={BookmarkCheck}
        breadcrumbs={[
          { to: '/bookings', label: 'My Reservations' },
          { label: 'Reserve Seat' }
        ]}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {error && <ErrorMessage message={error} />}

        {/* Member Profile Banner */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-gold), #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a0a0f', fontSize: '0.85rem' }}>
              {currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() : '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'No profile selected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {currentUser ? `Reservation & ticket will be linked to ${currentUser.email}` : 'Select your profile from top-right'}
              </div>
            </div>
          </div>
          {currentUser && <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group col-span-2">
                <FormField
                  label="Select Show"
                  name="showId"
                  type="select"
                  value={formData.showId}
                  onChange={handleChange}
                  options={showOptions}
                  error={fieldErrors.showId}
                  placeholder="-- Choose a movie, concert, or live show --"
                  required
                />
              </div>

              {selectedShow && (
                <div className="col-span-2" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Film size={16} style={{ color: 'var(--accent-gold)' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedShow.name}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {selectedShow.genre} · {selectedShow.language} · ⏱ {selectedShow.duration} mins
                  </div>
                </div>
              )}

              {/* Seat Selection */}
              <div className="form-group">
                <FormField
                  label="Select Seat Number"
                  name="seatNo"
                  value={formData.seatNo}
                  onChange={handleChange}
                  placeholder="e.g. A-12, B-04"
                  error={fieldErrors.seatNo}
                  helper="Assigned seat code in auditorium"
                  required
                />
              </div>

              {/* Price per seat */}
              <div className="form-group">
                <FormField
                  label="Ticket Price (₹)"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  helper="Standard admission price"
                  required
                />
              </div>

              <div className="form-group col-span-2">
                <FormField
                  label="Reservation Reference Code"
                  name="bookingId"
                  value={formData.bookingId}
                  onChange={handleChange}
                  placeholder="e.g. BKG-101"
                  error={fieldErrors.bookingId}
                  helper="Auto-generated reservation identifier"
                  required
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Link to="/bookings" className="btn btn-secondary">
                <X size={16} /> Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !currentUser}
              >
                <Save size={16} />
                {submitting ? 'Confirming...' : 'Confirm Reservation & Issue Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
