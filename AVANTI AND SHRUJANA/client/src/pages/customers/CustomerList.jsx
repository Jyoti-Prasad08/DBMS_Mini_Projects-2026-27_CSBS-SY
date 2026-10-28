import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { getCustomers, deleteCustomer } from '../../api/customers';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortField, setSortField] = useState('customerId');
  const [sortDirection, setSortDirection] = useState('asc');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isDeleting: false });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCustomers({ search, gender: genderFilter });
      const data = res.data?.data || res.data?.customers || res.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load customers from backend. Ensure API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [genderFilter]);

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Sort customers
  const sortedCustomers = [...customers].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'name') {
      aVal = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      bVal = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Filter client-side if needed
  const filteredCustomers = sortedCustomers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const id = (c.customerId || '').toLowerCase();
    const contact = (c.contactNo || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || id.includes(q) || contact.includes(q);
  });

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const targetId = deleteModal.item._id || deleteModal.item.customerId;
      await deleteCustomer(targetId);
      setCustomers((prev) => prev.filter((c) => (c._id || c.customerId) !== targetId));
      setDeleteModal({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns = [
    {
      key: 'customerId',
      label: 'Customer ID',
      sortable: true,
      render: (val, row) => (
        <span className="badge badge-id">
          {val || row._id?.slice(-6).toUpperCase() || 'CUST'}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Full Name',
      sortable: true,
      render: (_, row) => (
        <span style={{ fontWeight: 600 }}>
          {row.firstName} {row.lastName}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email Address',
      sortable: true,
      render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      key: 'contactNo',
      label: 'Contact No',
      render: (val) => <span>{val || '—'}</span>
    },
    {
      key: 'age',
      label: 'Age',
      sortable: true,
      render: (val) => <span>{val ?? '—'}</span>
    },
    {
      key: 'gender',
      label: 'Gender',
      sortable: true,
      render: (val) => {
        let variant = 'gray';
        if (val === 'Male') variant = 'blue';
        if (val === 'Female') variant = 'purple';
        return <Badge variant={variant}>{val || 'Other'}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const id = row._id || row.customerId;
        return (
          <div className="table-actions">
            <Link to={`/customers/${id}`} className="btn btn-secondary btn-sm" title="View Customer">
              <Eye size={14} />
              View
            </Link>
            <Link to={`/customers/${id}/edit`} className="btn btn-outline btn-sm" title="Edit Customer">
              <Edit size={14} />
              Edit
            </Link>
            <button
              className="btn btn-danger btn-sm"
              title="Delete Customer"
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

  const genderOptions = (
    <select
      className="select-filter"
      value={genderFilter}
      onChange={(e) => setGenderFilter(e.target.value)}
    >
      <option value="">All Genders</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
  );

  return (
    <div className="container">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage registered patrons, contact details, and their linked reservations"
        icon={Users}
        badge={<Badge variant="gold">Customers</Badge>}
        breadcrumbs={[{ label: 'Customers' }]}
        actions={
          <Link to="/customers/new" className="btn btn-primary">
            <Plus size={16} />
            Add Customer
          </Link>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchCustomers} />}

      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, ID, or phone..."
        filters={genderOptions}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyTitle="No customers registered"
        emptyDesc="Create the first customer record to begin issuing tickets and bookings."
        emptyActionLabel="Add Customer"
        emptyActionTo="/customers/new"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Delete Customer Record"
        itemName={deleteModal.item ? `${deleteModal.item.firstName} ${deleteModal.item.lastName} (${deleteModal.item.customerId})` : ''}
        message="Are you sure you want to delete this customer? This will permanently remove their record and cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, isDeleting: false })}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
