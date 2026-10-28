import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  Trash2, 
  ArrowLeft, 
  ShieldAlert
} from 'lucide-react';
import { getSnack, deleteSnack } from '../../api/snacks';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function SnackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loadingUsers } = useUser();

  const [snack, setSnack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSnack(id);
      const data = res.data?.data || res.data?.snack || res.data;
      setSnack(data);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch snack order: ${err.response?.data?.message || err.message}`);
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
      await deleteSnack(snack._id || snack.orderId || id);
      navigate('/snacks');
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading || loadingUsers) return <LoadingSpinner message="Fetching snack order details..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/snacks')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Snacks
      </button>
    </div>
  );
  if (!snack) return null;

  // Enforce privacy: user cannot view another user's snack order
  const myObjId = currentUser?._id ? String(currentUser._id) : '';
  const myCustCode = currentUser?.customerId ? String(currentUser.customerId) : '';
  const sc = snack.customerId;
  const snackOwnerId = typeof sc === 'object' ? String(sc._id || '') : String(sc || '');
  const snackOwnerCode = typeof sc === 'object' ? String(sc.customerId || '') : '';
  const isOwner = (myObjId && snackOwnerId === myObjId) || (myCustCode && snackOwnerCode === myCustCode);

  if (currentUser && !isOwner) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <ShieldAlert size={60} style={{ color: 'var(--accent-red)', margin: '0 auto 1.25rem', display: 'block' }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have permission to view other customers' orders.
        </p>
        <Link to="/snacks" className="btn btn-primary">
          <Coffee size={16} /> View My Snack Orders
        </Link>
      </div>
    );
  }

  const totalAmount = Number((snack.price || 0) * (snack.quantity || 1)).toFixed(2);

  return (
    <div className="container">
      <PageHeader
        title={snack.itemName}
        subtitle="Your confirmed refreshment order"
        icon={Coffee}
        badge={
          <span className="badge badge-id">
            {snack.orderId || 'ORD'}
          </span>
        }
        breadcrumbs={[
          { to: '/snacks', label: 'Snack Bar' },
          { label: snack.orderId || 'Detail' }
        ]}
        actions={
          <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
            <Trash2 size={16} />
            Cancel Order
          </button>
        }
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card profile-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
              <Coffee size={36} />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>{snack.itemName}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Cinema Concession Order
            </p>
          </div>

          <div className="attribute-list">
            <div className="attribute-item">
              <span className="attribute-label">Order Reference</span>
              <span className="badge badge-id">{snack.orderId}</span>
            </div>
            <div className="attribute-item">
              <span className="attribute-label">Item</span>
              <span className="attribute-value">{snack.itemName}</span>
            </div>
            <div className="attribute-item">
              <span className="attribute-label">Unit Price</span>
              <span className="attribute-value">₹{snack.price}</span>
            </div>
            <div className="attribute-item">
              <span className="attribute-label">Quantity</span>
              <span className="attribute-value">{snack.quantity} units</span>
            </div>
            <div className="attribute-item">
              <span className="attribute-label">Order Total</span>
              <span className="attribute-value" style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 800 }}>
                ₹{totalAmount}
              </span>
            </div>
            {snack.createdAt && (
              <div className="attribute-item">
                <span className="attribute-label">Ordered At</span>
                <span className="attribute-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(snack.createdAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModal}
        title="Cancel Snack Order"
        itemName={snack.itemName}
        message="Are you sure you want to cancel this snack order?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
