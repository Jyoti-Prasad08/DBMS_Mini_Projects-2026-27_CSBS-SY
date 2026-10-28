import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Save, X } from 'lucide-react';
import { getTheater, createTheater, updateTheater } from '../../api/theaters';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function TheaterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    theaterName: '',
    theaterId: '',
    email: '',
    seatNo: '',
    quantity: '',
    transId: '',
    ticketId: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchRecord = async () => {
        try {
          setLoading(true);
          const res = await getTheater(id);
          const data = res.data?.data || res.data?.theater || res.data;
          setFormData({
            theaterName: data.theaterName || '',
            theaterId: data.theaterId || '',
            email: data.email || '',
            seatNo: data.seatNo || '',
            quantity: data.quantity ?? '',
            transId: data.transId || '',
            ticketId: data.ticketId || ''
          });
        } catch (err) {
          setError(`Failed to load theater record: ${err.response?.data?.message || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    }
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};
    if (!formData.theaterName.trim()) errors.theaterName = 'Theater Name is required (e.g. Theatre 1)';
    if (!formData.theaterId.trim()) errors.theaterId = 'Theater ID is required (e.g. THR-001)';
    if (!formData.email.trim()) {
      errors.email = 'Theater email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errors.quantity = 'Valid seating capacity quantity is required';
    }

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

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        quantity: Number(formData.quantity)
      };

      let result;
      if (isEdit) {
        result = await updateTheater(id, payload);
      } else {
        result = await createTheater(payload);
      }

      const saved = result.data?.data || result.data?.theater || result.data;
      const targetId = saved?._id || saved?.theaterId || id || formData.theaterId;
      navigate(`/theaters/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error saving theater');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading theater configuration..." />;

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Edit Theater Screen' : 'Register New Theater Screen'}
        subtitle={isEdit ? `Updating attributes for ${formData.theaterName || formData.theaterId}` : 'Create a new cinema auditorium venue (E3)'}
        icon={MapPin}
        breadcrumbs={[
          { to: '/theaters', label: 'Theaters' },
          { label: isEdit ? 'Edit' : 'New Theater' }
        ]}
      />

      {error && <ErrorMessage message={error} />}

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Theater Name (e.g. Theatre 1)"
              name="theaterName"
              value={formData.theaterName}
              onChange={handleChange}
              placeholder="e.g. Theatre 1, Screen IMAX"
              required
              className="col-span-2"
              error={fieldErrors.theaterName}
              helper="Primary auditorium name for student and audience recognition"
            />

            <FormField
              label="Theater ID (Surrogate PK)"
              name="theaterId"
              value={formData.theaterId}
              onChange={handleChange}
              placeholder="e.g. THR-001"
              required
              error={fieldErrors.theaterId}
              helper="Unique screen identifier"
              disabled={isEdit}
            />

            <FormField
              label="Theater Email (Candidate Key)"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="screen1@cinemadb.com"
              required
              error={fieldErrors.email}

            />

            <FormField
              label="Seating Capacity (Quantity)"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 250"
              required
              error={fieldErrors.quantity}
            />

            <FormField
              label="Seat Range (e.g. A1-Z50)"
              name="seatNo"
              value={formData.seatNo}
              onChange={handleChange}
              placeholder="e.g. Rows A-K (Seats 1-20)"
              helper="Seating layout specification for this theater screen"
            />

            <FormField
              label="Transaction Reference (Trans ID)"
              name="transId"
              value={formData.transId}
              onChange={handleChange}
              placeholder="e.g. TXN-SCR-001"
              helper="Transaction reference for this theater screen"
            />

            <FormField
              label="Linked Ticket ID"
              name="ticketId"
              value={formData.ticketId}
              onChange={handleChange}
              placeholder="e.g. TKT-001 (optional)"
              helper="Linked Ticket ID referring to a seat in this theater"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={16} />
              {submitting ? 'Saving to Database...' : isEdit ? 'Update Theater' : 'Create Theater'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
