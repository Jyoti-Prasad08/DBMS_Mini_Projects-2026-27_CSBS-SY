import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Eye, Edit, Trash2, Mail, Armchair } from 'lucide-react';
import { getTheaters, deleteTheater } from '../../api/theaters';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';

export default function TheaterList() {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('theaterName');
  const [sortDirection, setSortDirection] = useState('asc');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isDeleting: false });

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTheaters();
      const data = res.data?.data || res.data?.theaters || res.data || [];
      setTheaters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch theaters from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters();
  }, []);

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedTheaters = [...theaters].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const filteredTheaters = sortedTheaters.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (t.theaterName || '').toLowerCase();
    const id = (t.theaterId || '').toLowerCase();
    const email = (t.email || '').toLowerCase();
    const seat = (t.seatNo || '').toLowerCase();
    return name.includes(q) || id.includes(q) || email.includes(q) || seat.includes(q);
  });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const targetId = deleteModal.item._id || deleteModal.item.theaterId;
      await deleteTheater(targetId);
      setTheaters((prev) => prev.filter((t) => (t._id || t.theaterId) !== targetId));
      setDeleteModal({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns = [
    {
      key: 'theaterName',
      label: 'Theater Name & ID',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {val || `Theater ${row.theaterId}`}
          </strong>
          <span className="badge badge-id" style={{ marginLeft: '0.5rem' }}>
            {row.theaterId || row._id?.slice(-6).toUpperCase() || 'THR'}
          </span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Theater Email (Candidate Key)',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
          {val}
        </span>
      )
    },
    {
      key: 'quantity',
      label: 'Capacity (Quantity)',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Armchair size={14} style={{ color: 'var(--accent-gold)' }} />
          {val} seats
        </span>
      )
    },
    {
      key: 'seatNo',
      label: 'Seat Range',
      render: (val) => <span>{val || 'Standard (A1-Z50)'}</span>
    },
    {
      key: 'transId',
      label: 'Transaction Ref',
      render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{val || '—'}</span>
    },
    {
      key: 'ticketId',
      label: 'Linked Ticket ID',
      render: (val) => val ? <span className="badge badge-gray">{val}</span> : '—'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const id = row._id || row.theaterId;
        return (
          <div className="table-actions">
            <Link to={`/theaters/${id}`} className="btn btn-secondary btn-sm" title="View Screen Details">
              <Eye size={14} /> View
            </Link>
            <Link to={`/theaters/${id}/edit`} className="btn btn-outline btn-sm" title="Edit Theater">
              <Edit size={14} /> Edit
            </Link>
            <button
              className="btn btn-danger btn-sm"
              title="Delete Theater"
              onClick={() =>
                setDeleteModal({
                  isOpen: true,
                  item: row,
                  isDeleting: false
                })
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="container">
      <PageHeader
        title="Theater Screens"
        subtitle="Cinema auditoriums, seating layouts, and screen capacities"
        icon={MapPin}
        badge={<Badge variant="gold">Venues</Badge>}
        breadcrumbs={[{ label: 'Theaters' }]}
        actions={
          <Link to="/theaters/new" className="btn btn-primary">
            <Plus size={16} />
            Add Theater
          </Link>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchTheaters} />}

      <DataTable
        columns={columns}
        data={filteredTheaters}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by theater name, ID, or email..."
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyTitle="No theaters found"
        emptyDesc="Register a cinema hall or screen venue to link shows and tickets."
        emptyActionLabel="Add Theater"
        emptyActionTo="/theaters/new"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Delete Theater Screen"
        itemName={deleteModal.item ? `${deleteModal.item.theaterName || deleteModal.item.theaterId} (${deleteModal.item.email})` : ''}
        message="Are you sure you want to delete this theater? Removing it will clear its screen allocations."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, isDeleting: false })}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
