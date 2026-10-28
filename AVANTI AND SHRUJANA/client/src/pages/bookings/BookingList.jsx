import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, Plus, Eye, Trash2, Calendar, Film } from 'lucide-react';
import { getBookings, deleteBooking } from '../../api/bookings';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BookingList() {
  const { currentUser, loadingUsers } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isDeleting: false });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBookings();
      const allData = res.data?.data || res.data?.bookings || res.data || [];
      const list = Array.isArray(allData) ? allData : [];

      if (currentUser) {
        const myObjId = currentUser._id ? String(currentUser._id) : '';
        const myCustCode = currentUser.customerId ? String(currentUser.customerId) : '';

        // Strict filter: ONLY bookings belonging to the single logged-in user
        const myBookings = list.filter((b) => {
          const c = b.customerId;
          if (!c) return false;
          if (typeof c === 'object') {
            const cid = c._id ? String(c._id) : '';
            const ccode = c.customerId ? String(c.customerId) : '';
            return (myObjId && cid === myObjId) || (myCustCode && ccode === myCustCode);
          }
          const str = String(c);
          return (myObjId && str === myObjId) || (myCustCode && str === myCustCode);
        });

        setBookings(myBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load reservations. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUsers) {
      fetchBookings();
    }
  }, [currentUser, loadingUsers]);

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const filteredBookings = sortedBookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const id = (b.bookingId || '').toLowerCase();
    const show = (b.showId?.name || '').toLowerCase();
    return id.includes(q) || show.includes(q);
  });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const targetId = deleteModal.item._id || deleteModal.item.bookingId;
      await deleteBooking(targetId);
      setBookings((prev) => prev.filter((b) => (b._id || b.bookingId) !== targetId));
      setDeleteModal({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(`Cancel reservation failed: ${err.response?.data?.message || err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns = [
    {
      key: 'bookingId',
      label: 'Reservation Code',
      sortable: true,
      render: (val, row) => (
        <span className="badge badge-id">
          {val || row._id?.slice(-6).toUpperCase() || 'BKG'}
        </span>
      )
    },
    {
      key: 'showId',
      label: 'Show / Movie',
      render: (val) => {
        if (!val) return '—';
        if (typeof val === 'object') {
          return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Film size={14} style={{ color: 'var(--accent-gold)' }} />
              <strong style={{ color: 'var(--text-primary)' }}>{val.name}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({val.type})</span>
            </div>
          );
        }
        return <span>{String(val).slice(-6)}</span>;
      }
    },
    {
      key: 'createdAt',
      label: 'Booked On',
      sortable: true,
      render: (val) => {
        if (!val) return 'Recent';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            {new Date(val).toLocaleDateString()}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="green">Confirmed</Badge>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/bookings/${row._id || row.bookingId}`}
            className="btn btn-ghost btn-sm"
            title="View Details"
          >
            <Eye size={14} />
          </Link>
          <button
            className="btn btn-ghost btn-sm text-danger"
            title="Cancel Reservation"
            onClick={() => setDeleteModal({ isOpen: true, item: row, isDeleting: false })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  if (loadingUsers) {
    return <LoadingSpinner message="Loading your reservations..." />;
  }

  return (
    <div className="container">
      <PageHeader
        title="My Reservations"
        subtitle={currentUser ? `Reserved seats for ${currentUser.firstName} ${currentUser.lastName}` : 'Your booked seats'}
        icon={BookmarkCheck}
        badge={<Badge variant="gold">{filteredBookings.length} Active</Badge>}
        breadcrumbs={[{ label: 'My Reservations' }]}
        actions={
          <Link to="/bookings/new" className="btn btn-primary">
            <Plus size={16} />
            Reserve a Seat
          </Link>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchBookings} />}

      <div className="table-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search by reservation code or show..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredBookings}
        keyField="_id"
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="You don't have any reservations yet. Browse shows to reserve your seat!"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Cancel Reservation"
        itemName={deleteModal.item ? `Reservation ${deleteModal.item.bookingId || ''}` : ''}
        message="Are you sure you want to cancel this seat reservation? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, isDeleting: false })}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
