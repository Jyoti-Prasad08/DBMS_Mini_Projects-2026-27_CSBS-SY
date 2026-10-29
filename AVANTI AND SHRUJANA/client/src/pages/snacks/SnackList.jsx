import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Plus, Eye, Trash2, ShoppingBag, Sparkles, UserCircle2 } from 'lucide-react';
import { getSnacks, deleteSnack, createSnack } from '../../api/snacks';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';

const POPULAR_MENU = [
  { name: 'Caramel Popcorn (Large)', price: 220, emoji: '🍿', desc: 'Warm sweet & crunchy caramelized popcorn' },
  { name: 'Cheese Nachos & Salsa', price: 180, emoji: '🧀', desc: 'Crispy corn tortilla chips with warm melted cheese' },
  { name: 'Classic Salted Popcorn', price: 160, emoji: '🍿', desc: 'Freshly popped buttered theatre popcorn' },
  { name: 'Chilled Fountain Cola', price: 90, emoji: '🥤', desc: 'Ice cold refreshing carbonated beverage (500ml)' },
  { name: 'Cold Brew Iced Coffee', price: 140, emoji: '☕', desc: 'Smooth Arabica cold brewed iced coffee' },
  { name: 'Warm Fudge Brownie', price: 150, emoji: '🍫', desc: 'Gooey chocolate brownie with chocolate drizzle' },
];

export default function SnackList() {
  const { currentUser } = useUser();
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingItem, setOrderingItem] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('orderId');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isDeleting: false });

  const fetchSnacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSnacks();
      const allData = res.data?.data || res.data?.snacks || res.data || [];
      const list = Array.isArray(allData) ? allData : [];

      if (currentUser) {
        const myObjId = currentUser._id ? String(currentUser._id) : '';
        const myCustCode = currentUser.customerId ? String(currentUser.customerId) : '';

        const mySnacks = list.filter((s) => {
          const c = s.customerId;
          if (!c) return false;
          if (typeof c === 'object') {
            const cid = c._id ? String(c._id) : '';
            const ccode = c.customerId ? String(c.customerId) : '';
            return (myObjId && cid === myObjId) || (myCustCode && ccode === myCustCode);
          }
          const str = String(c);
          return (myObjId && str === myObjId) || (myCustCode && str === myCustCode);
        });
        setSnacks(mySnacks);
      } else {
        setSnacks([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch snack orders from backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnacks();
  }, [currentUser]);

  // Quick 1-click order from menu
  const handleQuickOrder = async (menuItem) => {
    if (!currentUser) {
      alert('Please select your profile from the top-right menu to order snacks.');
      return;
    }

    try {
      setOrderingItem(menuItem.name);
      const payload = {
        orderId: `ORD-${Math.floor(100 + Math.random() * 900)}`,
        itemName: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        customerId: currentUser._id || currentUser.customerId
      };
      await createSnack(payload);
      fetchSnacks();
    } catch (err) {
      alert(`Could not place order: ${err.response?.data?.message || err.message}`);
    } finally {
      setOrderingItem(null);
    }
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedSnacks = [...snacks].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const filteredSnacks = sortedSnacks.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const id = (s.orderId || '').toLowerCase();
    const item = (s.itemName || '').toLowerCase();
    return id.includes(q) || item.includes(q);
  });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const targetId = deleteModal.item._id || deleteModal.item.orderId;
      await deleteSnack(targetId);
      setSnacks((prev) => prev.filter((s) => (s._id || s.orderId) !== targetId));
      setDeleteModal({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const columns = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (val, row) => (
        <span className="badge badge-id">
          {val || row._id?.slice(-6).toUpperCase() || 'ORD'}
        </span>
      )
    },
    {
      key: 'itemName',
      label: 'Snack Item',
      sortable: true,
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (val) => <span>₹{val}</span>
    },
    {
      key: 'quantity',
      label: 'Qty',
      sortable: true,
      render: (val) => <span>{val}</span>
    },
    {
      key: 'total',
      label: 'Total',
      render: (_, row) => (
        <strong style={{ color: '#4ade80' }}>
          ₹{(Number(row.price) || 0) * (Number(row.quantity) || 1)}
        </strong>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="gold">Ready for Pickup</Badge>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/snacks/${row._id || row.orderId}`}
            className="btn btn-ghost btn-sm"
            title="View Order Details"
          >
            <Eye size={14} />
          </Link>
          <button
            className="btn btn-ghost btn-sm text-danger"
            title="Cancel Order"
            onClick={() => setDeleteModal({ isOpen: true, item: row, isDeleting: false })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  if (!currentUser) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <UserCircle2 size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem', display: 'block' }} />
        <h2>Select Your Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please select your profile from the top-right menu to order food & drinks.
        </p>
        <Link to="/shows" className="btn btn-primary">
          Browse Shows
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader
        title="Snack Bar & Treats"
        subtitle="Order fresh popcorn, drinks, and snacks straight to your seat"
        icon={Coffee}
        badge={<Badge variant="gold">{filteredSnacks.length} Orders</Badge>}
        breadcrumbs={[{ label: 'Snack Bar' }]}
        actions={
          <Link to="/snacks/new" className="btn btn-primary">
            <Plus size={16} />
            Custom Order
          </Link>
        }
      />

      {error && <ErrorMessage message={error} onRetry={fetchSnacks} />}

      {/* ── Popular Menu Grid ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.15rem' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-gold)' }} />
          Popular Cinema Treats
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {POPULAR_MENU.map((item) => (
            <div
              key={item.name}
              className="card"
              style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{item.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{item.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold)' }}>₹{item.price}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={orderingItem === item.name}
                  onClick={() => handleQuickOrder(item)}
                >
                  <ShoppingBag size={13} />
                  {orderingItem === item.name ? 'Ordering...' : 'Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── My Orders Table ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem' }}>My Snack Orders</h3>
        <div className="search-box" style={{ maxWidth: '280px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search my orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSnacks}
        keyField="_id"
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage="You haven't ordered any snacks yet. Grab some popcorn above!"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Cancel Snack Order"
        itemName={deleteModal.item ? `${deleteModal.item.itemName} (${deleteModal.item.orderId || ''})` : ''}
        message="Are you sure you want to cancel this snack order?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, item: null, isDeleting: false })}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
