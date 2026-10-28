import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  User, 
  Ticket, 
  Coffee, 
  BookmarkCheck, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { getCustomer, deleteCustomer } from '../../api/customers';
import { getBookings } from '../../api/bookings';
import { getTickets } from '../../api/tickets';
import { getSnacks } from '../../api/snacks';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch customer profile
      const custRes = await getCustomer(id);
      const custData = custRes.data?.data || custRes.data?.customer || custRes.data;
      setCustomer(custData);

      const customerRefId = custData._id || custData.customerId || id;

      // 2. Fetch related bookings (R2: book)
      try {
        const bkgRes = await getBookings({ customerId: customerRefId });
        const bkgData = bkgRes.data?.data || bkgRes.data?.bookings || bkgRes.data || [];
        setBookings(Array.isArray(bkgData) ? bkgData : []);
      } catch (e) {
        console.warn('Could not load related bookings:', e.message);
      }

      // 3. Fetch related tickets (R3: buy)
      try {
        const tktRes = await getTickets({ customerId: customerRefId });
        const tktData = tktRes.data?.data || tktRes.data?.tickets || tktRes.data || [];
        setTickets(Array.isArray(tktData) ? tktData : []);
      } catch (e) {
        console.warn('Could not load related tickets:', e.message);
      }

      // 4. Fetch related snacks (R1: Order)
      try {
        const snkRes = await getSnacks({ customerId: customerRefId });
        const snkData = snkRes.data?.data || snkRes.data?.snacks || snkRes.data || [];
        setSnacks(Array.isArray(snkData) ? snkData : []);
      } catch (e) {
        console.warn('Could not load related snacks:', e.message);
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to load customer profile: ${err.response?.data?.message || err.message}`);
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
      await deleteCustomer(customer._id || customer.customerId || id);
      navigate('/customers');
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer profile & relational links..." />;
  if (error) return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <ErrorMessage message={error} onRetry={fetchData} />
      <button onClick={() => navigate('/customers')} className="btn btn-secondary">
        <ArrowLeft size={16} /> Back to Customers
      </button>
    </div>
  );
  if (!customer) return null;

  return (
    <div className="container">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        subtitle="Customer entity record and relational transaction history"
        icon={Users}
        badge={
          <span className="badge badge-id">
            {customer.customerId || 'CUST'}
          </span>
        }
        breadcrumbs={[
          { to: '/customers', label: 'Customers' },
          { label: customer.customerId || 'Detail' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/customers/${customer._id || id}/edit`} className="btn btn-outline">
              <Edit size={16} />
              Edit Profile
            </Link>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        }
      />

      <div className="detail-grid">
        {/* Left Column: Profile Card */}
        <div>
          <div className="card profile-card">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ margin: '0 auto 1rem auto' }}>
                <User size={36} />
              </div>
              <h2 style={{ fontSize: '1.35rem' }}>
                {customer.firstName} {customer.lastName}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Registered Customer
              </p>
            </div>

            <div className="attribute-list">
              <div className="attribute-item">
                <span className="attribute-label">Customer ID</span>
                <span className="badge badge-id">{customer.customerId || '—'}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Full Name</span>
                <span className="attribute-value">{customer.firstName} {customer.lastName}</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Email Address</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                  {customer.email}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Contact Number</span>
                <span className="attribute-value" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                  {customer.contactNo || '—'}
                </span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Age</span>
                <span className="attribute-value">{customer.age ?? '—'} yrs</span>
              </div>
              <div className="attribute-item">
                <span className="attribute-label">Gender</span>
                <Badge variant={customer.gender === 'Male' ? 'blue' : customer.gender === 'Female' ? 'purple' : 'gray'}>
                  {customer.gender || 'Other'}
                </Badge>
              </div>
              {customer.createdAt && (
                <div className="attribute-item">
                  <span className="attribute-label">Registered On</span>
                  <span className="attribute-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: ER Relationships */}
        <div className="relationship-section">
          {/* R2: Shows Reserved (Bookings) */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <BookmarkCheck size={20} />
                <span>🎟 Shows Reserved</span>
                <Badge variant="purple">{bookings.length} Reserved</Badge>
              </div>
              <Link to="/bookings/new" className="btn btn-primary btn-sm">
                + Reserve a Show
              </Link>
            </div>

            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No active show reservations found for this customer.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map((b) => (
                  <div 
                    key={b._id || b.bookingId} 
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
                        {b.bookingId || 'BKG'}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {b.showId?.name || (typeof b.showId === 'string' ? b.showId : 'Movie Reservation')}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Type: {b.showId?.type || 'Show'} • Booked: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <Link to={`/bookings/${b._id || b.bookingId}`} className="btn btn-ghost btn-sm">
                      Details <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* R3: Tickets Purchased */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Ticket size={20} />
                <span>💳 Tickets Purchased</span>
                <Badge variant="blue">{tickets.length} Tickets</Badge>
              </div>
              <Link to="/tickets/new" className="btn btn-primary btn-sm">
                + Purchase Ticket
              </Link>
            </div>

            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No tickets purchased yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tickets.map((t) => (
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
                        Unit: ₹{t.unitPrice} • Total: <strong style={{ color: '#fbbf24' }}>₹{t.amount}</strong>
                      </div>
                    </div>
                    <Link to={`/tickets/${t._id || t.ticketId}`} className="btn btn-ghost btn-sm">
                      View Ticket <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* R1: Snacks at Theatre */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Coffee size={20} />
                <span>🍿 Snacks at Theatre</span>
                <Badge variant="green">{snacks.length} Orders</Badge>
              </div>
              <Link to="/snacks/new" className="btn btn-primary btn-sm">
                + Order Snacks
              </Link>
            </div>

            {snacks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No snack orders placed.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {snacks.map((s) => (
                  <div 
                    key={s._id || s.orderId}
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
                        {s.orderId || 'ORD'}
                      </span>
                      <strong>{s.itemName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Price: ₹{s.price} × {s.quantity} = <strong style={{ color: '#4ade80' }}>₹{Number(s.price * s.quantity).toFixed(2)}</strong>
                      </div>
                    </div>
                    <Link to={`/snacks/${s._id || s.orderId}`} className="btn btn-ghost btn-sm">
                      View Order <ChevronRight size={14} />
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
        title="Delete Customer Profile"
        itemName={`${customer.firstName} ${customer.lastName} (${customer.customerId})`}
        message="Are you sure you want to permanently delete this customer profile? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
