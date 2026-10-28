import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Coffee, Save, X, CheckCircle2 } from 'lucide-react';
import { getSnack, createSnack, updateSnack } from '../../api/snacks';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function SnackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    orderId: `ORD-${Math.floor(100 + Math.random() * 900)}`,
    itemName: 'Caramel Popcorn (Regular)',
    price: '180',
    quantity: '1'
  });

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      getSnack(id)
        .then(res => {
          const s = res.data?.data || res.data?.snack || res.data;
          setFormData({
            orderId: s.orderId || '',
            itemName: s.itemName || '',
            price: String(s.price ?? ''),
            quantity: String(s.quantity ?? '1')
          });
        })
        .catch(err => setError(`Failed to load snack order: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const computedTotal = (Number(formData.price) || 0) * (Number(formData.quantity) || 1);

  const validate = () => {
    const errors = {};
    if (!formData.orderId.trim()) errors.orderId = 'Order code is required';
    if (!formData.itemName.trim()) errors.itemName = 'Please specify item name';
    if (!formData.price || Number(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = 'Quantity must be at least 1';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser) {
      setError('Please select a profile from the top-right menu before ordering snacks.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        customerId: currentUser._id || currentUser.customerId,
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };

      let result;
      if (isEdit) {
        result = await updateSnack(id, payload);
      } else {
        result = await createSnack(payload);
      }

      const saved = result.data?.data || result.data?.snack || result.data;
      const targetId = saved?._id || saved?.orderId || id || formData.orderId;
      navigate(`/snacks/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error saving snack order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading order details..." />;

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Update Snack Order' : 'Order Food & Drinks'}
        subtitle={isEdit ? `Editing order ${formData.orderId}` : 'Add custom refreshments to enjoy during the show'}
        icon={Coffee}
        breadcrumbs={[
          { to: '/snacks', label: 'Snack Bar' },
          { label: isEdit ? 'Update Order' : 'New Order' }
        ]}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {error && <ErrorMessage message={error} />}

        {/* Member Profile Banner */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-gold), #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0a0a0f', fontSize: '0.85rem' }}>
              {currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() : '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'No profile selected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {currentUser ? `Order will be linked to ${currentUser.email}` : 'Select your profile from top-right'}
              </div>
            </div>
          </div>
          {currentUser && <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group col-span-2">
                <FormField
                  label="Item Name"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="e.g. Cheese Nachos, Popcorn Tub, Soft Drink"
                  error={fieldErrors.itemName}
                  required
                />
              </div>

              <div className="form-group">
                <FormField
                  label="Unit Price (₹)"
                  name="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 150"
                  error={fieldErrors.price}
                  required
                />
              </div>

              <div className="form-group">
                <FormField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={fieldErrors.quantity}
                  required
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Total Payable</label>
                <div style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>₹{computedTotal}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    ₹{formData.price || 0} × {formData.quantity || 0}
                  </span>
                </div>
              </div>

              <div className="form-group col-span-2">
                <FormField
                  label="Order Reference ID"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="e.g. ORD-101"
                  error={fieldErrors.orderId}
                  helper="Auto-generated order code"
                  required
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Link to="/snacks" className="btn btn-secondary">
                <X size={16} /> Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !currentUser}
              >
                <Save size={16} />
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
