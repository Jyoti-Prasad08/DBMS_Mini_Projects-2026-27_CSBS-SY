import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Mail, 
  Armchair, 
  Film, 
  Plus,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { getTheater, updateTheater, deleteTheater } from '../../api/theaters';
import { getShows } from '../../api/shows';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function TheaterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [theater, setTheater] = useState(null);
  const [shows, setShows] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingShows, setUpdatingShows] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getTheater(id);
      const data = res.data?.data || res.data?.theater || res.data;
      setTheater(data);

      const theaterRefId = data._id || data.theaterId || id;

      // Fetch shows hosted at this theater (R4: locate)
      try {
        const shwRes = await getShows();
        const showList = shwRes.data?.data || shwRes.data?.shows || shwRes.data || [];
        if (Array.isArray(showList)) {
          setAllShows(showList);
          const linkedIds = (data.showIds || []).map((s) => (typeof s === 'object' ? (s._id || s.showId) : s));
          const linked = showList.filter((s) =>
            linkedIds.includes(s._id) ||
            linkedIds.includes(s.showId) ||
            (Array.isArray(s.theaterIds) && s.theaterIds.some((tId) => (tId._id || tId) === theaterRefId || (tId.theaterId || tId) === data.theaterId))
          );
          setShows(linked);
        }
      } catch (e) {
        console.warn('Could not fetch linked shows:', e.message);
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to load theater profile: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Add Show to this Theater (R4: locate)
  const handleAddShow = async (e) => {
    e.preventDefault();
    if (!selectedShowId) return;

    try {
      setUpdatingShows(true);
      const currentIds = (theater.showIds || []).map((s) => (typeof s === 'object' ? (s._id || s.showId) : s));
      if (!currentIds.includes(selectedShowId)) {
        const updatedIds = [...currentIds, selectedShowId];
        await updateTheater(theater._id || id, { showIds: updatedIds });
      }
      setSelectedShowId('');
      fetchData();
    } catch (err) {
      alert(`Failed to assign show: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingShows(false);
    }
  };

  // Remove Show from this Theater
  const handleRemoveShow = async (showIdToRemove) => {
    try {
      setUpdatingShows(true);
      const currentIds = (theater.showIds || []).map((s) => (typeof s === 'object' ? (s._id || s.showId) : s));
      const updatedIds = currentIds.filter((sId) => sId !== showIdToRemove);
      await updateTheater(theater._id || id, { showIds: updatedIds });
      fetchData();
    } catch (err) {
      alert(`Failed to unlink show: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingShows(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTheater(theater._id || theater.theaterId || id);
      navigate('/theaters');
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching theater details..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/theaters')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Theaters
      </button>
    </div>
  );
  if (!theater) return null;

  const linkedShowIds = shows.map((s) => s._id || s.showId);
  const availableShows = allShows.filter((s) => !linkedShowIds.includes(s._id) && !linkedShowIds.includes(s.showId));

  return (
    <div className="container">
      <PageHeader
        title={theater.theaterName ? `${theater.theaterName} (${theater.theaterId})` : theater.email}
        subtitle="Cinema hall configuration and linked screen allocations"
        icon={MapPin}
        badge={
          <span className="badge badge-id">
            {theater.theaterId || 'THR'}
          </span>
        }
        breadcrumbs={[
          { to: '/theaters', label: 'Theaters' },
          { label: theater.theaterName || theater.theaterId || 'Detail' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/theaters/${theater._id || id}/edit`} className="btn btn-outline">
              <Edit size={16} />
              Edit Screen
            </Link>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Theater Profile */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <MapPin size={36} />
              </div>
              <h2 style={{ fontSize: '1.3rem' }}>{theater.theaterName || `Screen ${theater.theaterId}`}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Theater Venue (E3) • Screen {theater.theaterId}
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Theater Name</span>
                <span className="attribute-value" style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                  {theater.theaterName || `Theatre ${theater.theaterId}`}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Theater ID</span>
                <span className="badge badge-id">{theater.theaterId || '—'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Email (Candidate Key)</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                  {theater.email}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Seating Capacity</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Armchair size={13} style={{ color: 'var(--accent-gold)' }} />
                  {theater.quantity} seats
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Seat No / Range</span>
                <span className="attribute-value">{theater.seatNo || 'Standard'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Transaction ID (Trans ID)</span>
                <span className="attribute-value">{theater.transId || '—'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Ticket ID (Tricket ID in ER)</span>
                <span className="attribute-value">
                  {theater.ticketId ? <span className="badge badge-gray">{theater.ticketId}</span> : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hosted Shows (R4: locate) */}
        <div className="relationship-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Film size={20} />
                <span>Shows at This Theater</span>
                <Badge variant="gold">{shows.length} Shows</Badge>
              </div>
            </div>

            {shows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No active shows currently allocated to this theater screen. Use the selector below to link a show.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shows.map((s) => (
                  <div
                    key={s._id || s.showId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <span className="badge badge-id" style={{ marginRight: '0.75rem' }}>
                        {s.showId || 'SHW'}
                      </span>
                      <strong>{s.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {s.type} • {s.language} • {s.duration} mins
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link to={`/shows/${s._id || s.showId}`} className="btn btn-ghost btn-sm">
                        View <ChevronRight size={14} />
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.3rem 0.5rem' }}
                        title="Remove show from this theater"
                        onClick={() => handleRemoveShow(s._id || s.showId)}
                        disabled={updatingShows}
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Show Form */}
            <form onSubmit={handleAddShow} style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <select
                className="form-control"
                style={{ flex: 1 }}
                value={selectedShowId}
                onChange={(e) => setSelectedShowId(e.target.value)}
                disabled={updatingShows || availableShows.length === 0}
              >
                <option value="">
                  {availableShows.length === 0 ? '-- All available shows already scheduled --' : '-- Choose a show to program in this screen --'}
                </option>
                {availableShows.map((s) => (
                  <option key={s._id || s.showId} value={s._id || s.showId}>
                    {s.name} ({s.type} • {s.language})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={!selectedShowId || updatingShows}
              >
                <Plus size={14} />
                {updatingShows ? 'Saving...' : 'Add Show'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        title="Delete Theater Screen"
        itemName={`${theater.email} (${theater.theaterId})`}
        message="Are you sure you want to permanently delete this theater venue record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
