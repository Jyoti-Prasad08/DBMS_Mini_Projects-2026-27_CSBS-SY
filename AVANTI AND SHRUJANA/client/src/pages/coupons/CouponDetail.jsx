import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Tag, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  Ticket, 
  CheckCircle, 
  Clock,
  Percent,
  ChevronRight
} from 'lucide-react';
import { getCoupon, deleteCoupon } from '../../api/coupons';
import { getTickets } from '../../api/tickets';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CouponDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState(null);
  const [linkedTickets, setLinkedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch coupon details
      const res = await getCoupon(id);
      const cpnData = res.data?.data || res.data?.coupon || res.data;
      setCoupon(cpnData);

      const couponRefId = cpnData._id || cpnData.couponId || id;

      // 2. Fetch tickets utilizing this coupon (R5: apply)
      try {
        const tktRes = await getTickets();
        const allTickets = tktRes.data?.data || tktRes.data?.tickets || tktRes.data || [];
        if (Array.isArray(allTickets)) {
          const applied = allTickets.filter((t) => {
            return Array.isArray(t.couponIds) && t.couponIds.some((c) => {
              const cId = typeof c === 'object' ? (c._id || c.couponId) : c;
              return cId === couponRefId || cId === cpnData.couponId || cId === cpnData._id;
            });
          });
          setLinkedTickets(applied);
        }
      } catch (e) {
        console.warn('Could not load tickets using this coupon:', e.message);
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to fetch coupon details: ${err.response?.data?.message || err.message}`);
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
      await deleteCoupon(coupon._id || coupon.couponId || id);
      navigate('/coupons');
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching coupon details..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/coupons')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Coupons
      </button>
    </div>
  );
  if (!coupon) return null;

  const isExpired = coupon.expireDate && new Date(coupon.expireDate) < new Date();

  return (
    <div className="container">
      <PageHeader
        title={`Coupon ${coupon.couponCode}`}
        subtitle="Promotional discount specification and coupon usage tracking"
        icon={Tag}
        badge={
          <span className="badge badge-id">
            {coupon.couponId || 'CPN'}
          </span>
        }
        breadcrumbs={[
          { to: '/coupons', label: 'Coupons' },
          { label: coupon.couponCode }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/coupons/${coupon._id || id}/edit`} className="btn btn-outline">
              <Edit size={16} />
              Edit Coupon
            </Link>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Coupon Profile Card */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <Percent size={36} />
              </div>
              <h2 style={{ fontSize: '1.4rem' }}>{coupon.couponCode}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {coupon.discount}% Discount Promotion
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Coupon ID (PK)</span>
                <span className="badge badge-id">{coupon.couponId}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Coupon Code</span>
                <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
                  {coupon.couponCode}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Discount Value</span>
                <span className="attribute-value" style={{ color: '#4ade80', fontWeight: 700 }}>
                  {coupon.discount}%
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Expire Date</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  {coupon.expireDate ? new Date(coupon.expireDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Status</span>
                {isExpired ? (
                  <Badge variant="red" icon={Clock}>Expired</Badge>
                ) : (
                  <Badge variant="green" icon={CheckCircle}>Active</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tickets Utilizing This Coupon (R5: apply) */}
        <div className="relationship-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Ticket size={20} />
                <span>Tickets Using This Coupon</span>
                <Badge variant="blue">{linkedTickets.length} Redemptions</Badge>
              </div>
              <Link to="/tickets" className="btn btn-secondary btn-sm">
                View All Tickets
              </Link>
            </div>

            {linkedTickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                This coupon code has not been applied to any tickets yet. You can apply it on any individual ticket detail screen.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {linkedTickets.map((t) => (
                  <div
                    key={t._id || t.ticketId}
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
                        {t.ticketId || 'TKT'}
                      </span>
                      <span>Seat: <strong>{t.seatNo}</strong> • Qty: <strong>{t.quantity}</strong></span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Amount: <strong style={{ color: '#fbbf24' }}>₹{t.amount}</strong> • Customer: {t.customerId?.firstName || 'Patron'}
                      </div>
                    </div>
                    <Link to={`/tickets/${t._id || t.ticketId}`} className="btn btn-ghost btn-sm">
                      Ticket Info <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        title="Delete Coupon"
        itemName={`${coupon.couponCode} (${coupon.couponId})`}
        message="Are you sure you want to delete this coupon? It will be removed from future ticket applications."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
