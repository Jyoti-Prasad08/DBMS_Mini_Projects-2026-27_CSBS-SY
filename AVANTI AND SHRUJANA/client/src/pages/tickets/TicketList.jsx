import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Plus, Eye, Trash2, Film } from 'lucide-react';
import { getTickets, deleteTicket } from '../../api/tickets';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TicketList() {
  const { currentUser, loadingUsers } = useUser();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('ticketId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isDeleting: false });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTickets();
      const allData = res.data?.data || res.data?.tickets || res.data || [];
      const list = Array.isArray(allData) ? allData : [];

      if (currentUser) {
        const myObjId = currentUser._id ? String(currentUser._id) : '';
        const myCustCode = currentUser.customerId ? String(currentUser.customerId) : '';

        // Strict filter: ONLY tickets belonging to the single logged-in user
        const myTickets = list.filter((t) => {
          const c = t.customerId;
          if (!c) return false;
          if (typeof c === 'object') {
            const cid = c._id ? String(c._id) : '';
            const ccode = c.customerId ? String(c.customerId) : '';
            return (myObjId && cid === myObjId) || (myCustCode && ccode === myCustCode);
          }
          const str = String(c);
          return (myObjId && str === myObjId) || (myCustCode && str === myCustCode);
        });

        setTickets(myTickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tickets from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUsers) {
      fetchTickets();
    }
  }, [currentUser, loadingUsers]);

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const filteredTickets = sortedTickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const id = (t.ticketId || '').toLowerCase();
    const txn = (t.transactionId || '').toLowerCase();
    const seat = (t.seatNo || '').toLowerCase();
    const showName = (t.showId?.name || '').toLowerCase();
    return id.includes(q) || txn.includes(q) || seat.includes(q) || showName.includes(q);
  });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const targetId = deleteModal.item._id || deleteModal.item.ticketId;
      await deleteTicket(targetId);
      setTickets((prev) => prev.filter((t) => (t._id || t.ticketId) !== targetId));
      setDeleteModal({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns = [
    {
      key: 'ticketId',
      label: 'Ticket ID',
      sortable: true,
      render: (val, row) => (
        <span className="badge badge-id">
          {val || row._id?.slice(-6).toUpperCase() || 'TKT'}
        </span>
      )
    },
    {
      key: 'showId',
      label: 'Show / Movie',
      render: (val) => {
        if (!val) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Film size={14} style={{ color: 'var(--accent-gold)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{typeof val === 'object' ? val.name : String(val).slice(-6)}</strong>
          </div>
        );
      }
    },
    {
      key: 'seatNo',
      label: 'Seat No.',
      sortable: true,
      render: (val) => <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{val}</span>
    },
    {
      key: 'quantity',
      label: 'Qty',
      sortable: true,
      render: (val) => <span>{val}</span>
    },
    {
      key: 'unitPrice',
      label: 'Price',
      sortable: true,
      render: (val) => <span>₹{val}</span>
    },
    {
      key: 'amount',
      label: 'Total Amount',
      sortable: true,
      render: (val, row) => (
        <strong style={{ color: '#4ade80' }}>
          ₹{val || (row.unitPrice * row.quantity) || 0}
        </strong>
      )
    },
    {
      key: 'transactionId',
      label: 'Transaction Ref',
      render: (val) => <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{val || '—'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/tickets/${row._id || row.ticketId}`}
            className="btn btn-ghost btn-sm"
            title="View Ticket / Apply Offers"
          >
            <Eye size={14} />
          </Link>
          <button
            className="btn btn-ghost btn-sm text-danger"
            title="Cancel Ticket"
            onClick={() => setDeleteModal({ isOpen: true, item: row, isDeleting: false })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  if (loadingUsers) {
    return <LoadingSpinner message="Loading your tickets..." />;
  }

  return (
    <div className="container">
      <PageHeader
        title="My Tickets"
        subtitle={currentUser ? `Confirmed admission tickets for ${currentUser.firstName} ${currentUser.lastName}` : 'Your admission passes'}
        icon={Ticket}
        badge={<Badge variant="gold">{filteredTickets.length} Tickets</Badge>}
        breadcrumbs={[{ label: 'My Tickets' }]}
        actions={
          <Link to="/tickets/new" className="btn btn-primary">
            <Plus size={16} />
            Buy New Ticket
          </Link>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchTickets} />}

      <div className="table-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search tickets by ID, seat number, show..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTickets}
        keyField="_id"
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="You haven't bought any tickets yet. Browse shows to purchase admission tickets!"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Cancel Ticket"
        itemName={deleteModal.item ? `Ticket ${deleteModal.item.ticketId || ''}` : ''}
        message="Are you sure you want to cancel this ticket? This will cancel admission for this seat."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, isDeleting: false })}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
