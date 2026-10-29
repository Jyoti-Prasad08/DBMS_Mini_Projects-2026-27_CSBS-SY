import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Ticket, Save, X, Info, Film, CheckCircle2, Coffee, Plus, Minus, UtensilsCrossed } from 'lucide-react';
import { getTicket, createTicket, updateTicket } from '../../api/tickets';
import { getShows } from '../../api/shows';
import { createSnack } from '../../api/snacks';
import { createBooking } from '../../api/bookings';
import { useUser } from '../../context/UserContext';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';

const AVAILABLE_SNACKS = [
  { id: 'snk-1', name: 'Caramel Popcorn (Regular)', price: 180, emoji: '🍿', desc: 'Warm sweet caramelized popcorn' },
  { id: 'snk-2', name: 'Cheese Nachos & Salsa', price: 150, emoji: '🧀', desc: 'Crispy corn tortilla with warm melted cheese' },
  { id: 'snk-3', name: 'Chilled Fountain Cola (500ml)', price: 90, emoji: '🥤', desc: 'Ice cold carbonated soft drink' },
  { id: 'snk-4', name: 'Iced Cold Coffee', price: 120, emoji: '☕', desc: 'Rich espresso blended with chilled milk' },
];

export default function TicketForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
  const isEdit = Boolean(id);

  const queryParams = new URLSearchParams(location.search);
  const initialShowId = queryParams.get('showId') || '';

  const [formData, setFormData] = useState({
    ticketId: `TKT-${Math.floor(100 + Math.random() * 900)}`,
    transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    seatNo: 'A-12',
    quantity: '1',
    unitPrice: '250',
    showId: initialShowId
  });

  // Snack choice: 'none' | 'custom'
  const [snackChoice, setSnackChoice] = useState('none');
  const [selectedSnacks, setSelectedSnacks] = useState({});

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const showRes = await getShows();
        const list = Array.isArray(showList) ? showList : [];
        setShows(list);

        if (isEdit) {
          const res = await getTicket(id);
          const t = res.data?.data || res.data?.ticket || res.data;
          setFormData({
            ticketId: t.ticketId || '',
            transactionId: t.transactionId || '',
            seatNo: t.seatNo || '',
            quantity: String(t.quantity ?? 1),
            unitPrice: String(t.unitPrice ?? 250),
            showId: t.showId?._id || t.showId || ''
          });
        }
      } catch (err) {
        setError(`Failed to initialize form: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEdit]);

  // Derived ticket amount: unitPrice * quantity
  const ticketAmount = Number(formData.unitPrice || 0) * Number(formData.quantity || 0);

  // Compute snack total
  const snackTotal = snackChoice === 'none' ? 0 : Object.entries(selectedSnacks).reduce((sum, [snackId, qty]) => {
    const item = AVAILABLE_SNACKS.find(s => s.id === snackId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const grandTotal = ticketAmount + snackTotal;

  const updateSnackQty = (snackId, delta) => {
    setSelectedSnacks(prev => {
      const current = prev[snackId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[snackId];
        return copy;
      }
      return { ...prev, [snackId]: next };
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.showId) errors.showId = 'Please select a show / movie';
    if (!formData.ticketId.trim()) errors.ticketId = 'Ticket ID is required';
    if (!formData.seatNo.trim()) errors.seatNo = 'Seat Number is required (e.g. A-12)';
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = 'Quantity must be at least 1';
    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) errors.unitPrice = 'Ticket price must be greater than 0';

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
      setError('Please select your profile from the top-right menu to purchase tickets.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const custId = currentUser._id || currentUser.customerId;

      // 1. Create Ticket
      const ticketPayload = {
        ...formData,
        customerId: custId,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        amount: ticketAmount
      };

      if (!ticketPayload.showId) delete ticketPayload.showId;

      let result;
      if (isEdit) {
        result = await updateTicket(id, ticketPayload);
      } else {
        result = await createTicket(ticketPayload);
      }

      // 2. If snacks were selected, create Snack Orders linked to customer
      if (snackChoice === 'custom') {
        const snackOrders = Object.entries(selectedSnacks).filter(([_, qty]) => qty > 0);
        for (const [snackId, qty] of snackOrders) {
          const item = AVAILABLE_SNACKS.find(s => s.id === snackId);
          if (item) {
            try {
              await createSnack({
                orderId: `ORD-${Math.floor(100 + Math.random() * 900)}`,
                itemName: item.name,
                price: item.price,
                quantity: qty,
                customerId: custId
              });
            } catch (snkErr) {
              console.warn('Could not save snack item:', snkErr.message);
            }
          }
        }
      }

      const saved = result.data?.data || result.data?.ticket || result.data;
      const targetId = saved?._id || saved?.ticketId || id || formData.ticketId;
      navigate(`/tickets/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Error processing ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading ticket options..." />;

  const showOptions = shows.map((s) => ({
    value: s._id || s.showId,
    label: `${s.name} (${s.type} • ${s.language})`
  }));

  const selectedShow = shows.find(s => (s._id || s.showId) === formData.showId);

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Edit Ticket' : 'Buy Admission Ticket'}
        subtitle={isEdit ? `Updating ticket ${formData.ticketId}` : 'Select your show, choose seats, add snacks, and confirm your ticket'}
        icon={Ticket}
        breadcrumbs={[
          { to: '/tickets', label: 'My Tickets' },
          { label: isEdit ? 'Edit Ticket' : 'Buy Ticket' }
        ]}
      />

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
                {currentUser ? `Ticket will be registered to ${currentUser.email}` : 'Select your profile from top-right'}
              </div>
            </div>
          </div>
          {currentUser && <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)' }} />}
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── STEP 1: Ticket Details ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={18} style={{ color: 'var(--accent-gold)' }} />
              1. Show & Seat Details
            </h3>

            <div className="form-grid">
              {/* Show Selection */}
              <div className="form-group col-span-2">
                <FormField
                  label="Select Show / Movie"
                  name="showId"
                  type="select"
                  value={formData.showId}
                  onChange={handleChange}
                  options={showOptions}
                  error={fieldErrors.showId}
                  placeholder="-- Choose a show --"
                />
              </div>

              {selectedShow && (
                <div className="col-span-2" style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Film size={15} style={{ color: 'var(--accent-gold)' }} />
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{selectedShow.name}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({selectedShow.type} · {selectedShow.language})</span>
                  </div>
                </div>
              )}

              {/* Seat Number */}
              <div className="form-group">
                <FormField
                  label="Seat Number"
                  name="seatNo"
                  value={formData.seatNo}
                  onChange={handleChange}
                  placeholder="e.g. A-12, B-04"
                  error={fieldErrors.seatNo}
                  helper="Assigned seat code in the auditorium"
                  required
                />
              </div>

              {/* Quantity */}
              <div className="form-group">
                <FormField
                  label="Number of Seats (Qty)"
                  name="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={fieldErrors.quantity}
                  required
                />
              </div>

              {/* Unit Price */}
              <div className="form-group">
                <FormField
                  label="Price per Ticket (₹)"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  error={fieldErrors.unitPrice}
                  required
                />
              </div>

              {/* Auto ticket identifier */}
              <div className="form-group">
                <FormField
                  label="Ticket Code"
                  name="ticketId"
                  value={formData.ticketId}
                  onChange={handleChange}
                  placeholder="e.g. TKT-001"
                  error={fieldErrors.ticketId}
                  helper="Auto-generated ticket reference"
                  required
                />
              </div>

              {/* Transaction Ref */}
              <div className="form-group col-span-2">
                <FormField
                  label="Payment Transaction ID"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="e.g. TXN-101"
                  helper="Auto payment reference"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── STEP 2: Snacks Selection (Choose Snacks or No Snacks) ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coffee size={18} style={{ color: 'var(--accent-gold)' }} />
              2. Cinema Snacks & Refreshments
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Enjoy hot popcorn, chilled drinks, and snacks delivered right to your seat.
            </p>

            {/* Toggle: No Snacks vs Add Snacks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => { setSnackChoice('none'); setSelectedSnacks({}); }}
                className={`card ${snackChoice === 'none' ? 'card-selected' : ''}`}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: snackChoice === 'none' ? '2px solid var(--accent-gold)' : '1px solid var(--border)',
                  backgroundColor: snackChoice === 'none' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    🍿 No Snacks
                  </span>
                  {snackChoice === 'none' && <Badge variant="gold">Selected</Badge>}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Proceed with ticket admission only (+₹0)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSnackChoice('custom')}
                className={`card ${snackChoice === 'custom' ? 'card-selected' : ''}`}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: snackChoice === 'custom' ? '2px solid var(--accent-gold)' : '1px solid var(--border)',
                  backgroundColor: snackChoice === 'custom' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    🥤 Add Snacks & Drinks
                  </span>
                  {snackChoice === 'custom' && <Badge variant="gold">Selected</Badge>}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Choose from popcorn, nachos, cola, and coffee
                </div>
              </button>
            </div>

            {/* Snack Items Grid if 'custom' is chosen */}
            {snackChoice === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {AVAILABLE_SNACKS.map((snack) => {
                  const qty = selectedSnacks[snack.id] || 0;
                  return (
                    <div
                      key={snack.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: qty > 0 ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ fontSize: '1.6rem' }}>{snack.emoji}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {snack.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                            ₹{snack.price}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller (+ / -) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}
                          disabled={qty === 0}
                          onClick={() => updateSnackQty(snack.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ width: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: qty > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center' }}
                          onClick={() => updateSnackQty(snack.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── STEP 3: Order Summary & Grand Total ── */}
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(26, 26, 36, 0.9)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Booking Summary
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <span>Tickets ({formData.quantity} × ₹{formData.unitPrice})</span>
              <strong style={{ color: 'var(--text-primary)' }}>₹{ticketAmount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              <span>Snacks & Refreshments</span>
              <strong style={{ color: snackTotal > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                {snackTotal > 0 ? `₹${snackTotal}` : 'No snacks (₹0)'}
              </strong>
            </div>

            <div style={{
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Payable Amount
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>
                ₹{grandTotal}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to="/tickets" className="btn btn-secondary">
              <X size={16} /> Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !currentUser}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            >
              <Save size={16} />
              {submitting ? 'Confirming Purchase...' : `Confirm & Pay ₹${grandTotal}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
