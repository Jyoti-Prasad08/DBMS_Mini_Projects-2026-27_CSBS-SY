import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Trash2, 
  ArrowLeft, 
  Film, 
  Calculator, 
  Tag, 
  Plus, 
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { getTicket, deleteTicket, applyCoupon, removeCoupon } from '../../api/tickets';
import { getCoupons } from '../../api/coupons';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loadingUsers } = useUser();

  const [ticket, setTicket] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingCouponId, setRemovingCouponId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch ticket details
      const res = await getTicket(id);
      const ticketData = res.data?.data || res.data?.ticket || res.data;
      setTicket(ticketData);

      // 2. Fetch available active coupons
      try {
        const cpnRes = await getCoupons();
        const allCoupons = cpnRes.data?.data || cpnRes.data?.coupons || cpnRes.data || [];
        if (Array.isArray(allCoupons)) {
          // Filter to active and not already applied
          const appliedIds = (ticketData.couponIds || []).map((c) => (c._id || c.couponId || c));
          const available = allCoupons.filter((c) => !appliedIds.includes(c._id) && !appliedIds.includes(c.couponId));
          setAvailableCoupons(available);
        }
      } catch (e) {
        console.warn('Could not load coupons for dropdown:', e.message);
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to fetch ticket: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!selectedCouponId) return;

    try {
      setApplyingCoupon(true);
      const targetId = ticket._id || ticket.ticketId || id;
      const res = await applyCoupon(targetId, selectedCouponId);
      const updated = res.data?.data || res.data?.ticket || res.data;
      setTicket(updated);
      setSelectedCouponId('');
      fetchData(); // refresh
    } catch (err) {
      alert(`Failed to apply coupon: ${err.response?.data?.message || err.message}`);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async (couponIdToRemove) => {
    try {
      setRemovingCouponId(couponIdToRemove);
      const targetId = ticket._id || ticket.ticketId || id;
      const res = await removeCoupon(targetId, couponIdToRemove);
      const updated = res.data?.data || res.data?.ticket || res.data;
      setTicket(updated);
      fetchData(); // refresh
    } catch (err) {
      alert(`Failed to remove coupon: ${err.response?.data?.message || err.message}`);
    } finally {
      setRemovingCouponId(null);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTicket(ticket._id || ticket.ticketId || id);
      navigate('/tickets');
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading || loadingUsers) return <LoadingSpinner message="Loading ticket status..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/tickets')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Tickets
      </button>
    </div>
  );
  if (!ticket) return null;

  // Enforce privacy: user cannot view another user's ticket
  const myObjId = currentUser?._id ? String(currentUser._id) : '';
  const myCustCode = currentUser?.customerId ? String(currentUser.customerId) : '';
  const tc = ticket.customerId;
  const ticketOwnerId = typeof tc === 'object' ? String(tc._id || '') : String(tc || '');
  const ticketOwnerCode = typeof tc === 'object' ? String(tc.customerId || '') : '';
  const isOwner = (myObjId && ticketOwnerId === myObjId) || (myCustCode && ticketOwnerCode === myCustCode);

  if (currentUser && !isOwner) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <ShieldAlert size={60} style={{ color: 'var(--accent-red)', margin: '0 auto 1.25rem', display: 'block' }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have permission to view other customers' tickets.
        </p>
        <Link to="/tickets" className="btn btn-primary">
          <Ticket size={16} /> View My Tickets
        </Link>
      </div>
    );
  }

  const appliedCoupons = Array.isArray(ticket.couponIds) ? ticket.couponIds : [];

  return (
    <div className="container">
      <PageHeader
        title={`Ticket ${ticket.ticketId || ''}`}
        subtitle="Your confirmed admission pass"
        icon={Ticket}
        badge={
          <span className="badge badge-id">
            {ticket.ticketId || 'TKT'}
          </span>
        }
        breadcrumbs={[
          { to: '/tickets', label: 'My Tickets' },
          { label: ticket.ticketId || 'Detail' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <Trash2 size={16} />
              Cancel Ticket
            </button>
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Ticket Specification */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <Ticket size={36} />
              </div>
              <h2 style={{ fontSize: '1.4rem' }}>Seat {ticket.seatNo}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Transaction #{ticket.transactionId}
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Ticket ID</span>
                <span className="badge badge-id">{ticket.ticketId}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Transaction ID</span>
                <span className="attribute-value">{ticket.transactionId}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Seat Number</span>
                <span className="attribute-value" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                  {ticket.seatNo}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Quantity</span>
                <span className="attribute-value">{ticket.quantity}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Unit Price</span>
                <span className="attribute-value">₹{ticket.unitPrice}</span>
              </div>
              
              {/* Total Amount */}
              <div className="form-derived-box" style={{ margin: '0.5rem 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  Total Amount
                </div>
                <div className="form-derived-value">
                  ₹{ticket.amount ?? Number((ticket.unitPrice || 0) * (ticket.quantity || 1)).toFixed(2)}
                </div>
                <div className="form-derived-note">
                  <Calculator size={13} />
                  ₹{ticket.unitPrice} × {ticket.quantity} seats
                </div>
              </div>

              {ticket.showId && (
                <div className="attribute-item">
                  <span className="attribute-label">Show</span>
                  <span className="attribute-value">
                    {typeof ticket.showId === 'object' ? (
                      <Link to={`/shows/${ticket.showId._id || ticket.showId.showId}`} style={{ color: 'var(--accent-gold)' }}>
                        {ticket.showId.name}
                      </Link>
                    ) : (
                      ticket.showId
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Applied Coupons & Apply Form */}
        <div className="relationship-section">
          {/* Applied Coupons List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Tag size={20} />
                <span>Applied Discount Offers</span>
                <Badge variant={appliedCoupons.length > 0 ? 'purple' : 'gray'}>
                  {appliedCoupons.length} Active
                </Badge>
              </div>
            </div>

            {appliedCoupons.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No promo discounts applied to this ticket. Use the selector below to apply an available offer.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appliedCoupons.map((c) => {
                  const couponId = c._id || c.couponId || c;
                  const isRemoving = removingCouponId === couponId;

                  return (
                    <div 
                      key={couponId}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-purple">
                            <Tag size={12} /> {c.couponCode || 'PROMO'}
                          </span>
                          <span style={{ fontWeight: 700, color: '#4ade80' }}>
                            {c.discount}% OFF
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Code: {c.couponId || couponId}
                        </div>
                      </div>

                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        style={{ padding: '0.3rem 0.5rem' }}
                        title="Remove discount"
                        onClick={() => handleRemoveCoupon(couponId)}
                        disabled={isRemoving}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Apply New Coupon Form */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <select
                className="form-control"
                style={{ flex: 1 }}
                value={selectedCouponId}
                onChange={(e) => setSelectedCouponId(e.target.value)}
                disabled={applyingCoupon || availableCoupons.length === 0}
              >
                <option value="">
                  {availableCoupons.length === 0 
                    ? '-- No other discounts available --' 
                    : '-- Select a promo code to apply --'}
                </option>
                {availableCoupons.map((c) => (
                  <option key={c._id || c.couponId} value={c._id || c.couponId}>
                    {c.couponCode} — {c.discount}% OFF
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={!selectedCouponId || applyingCoupon}
              >
                <Plus size={14} />
                {applyingCoupon ? 'Applying...' : 'Apply Offer'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        title="Cancel Ticket"
        itemName={`Ticket ${ticket.ticketId || ''}`}
        message="Are you sure you want to cancel this ticket? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
