import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Save, X } from 'lucide-react';
import { getCoupon, createCoupon, updateCoupon } from '../../api/coupons';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CouponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    couponId: '',
    couponCode: '',
    discount: '15',
    expireDate: ''
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
          const res = await getCoupon(id);
          const data = res.data?.data || res.data?.coupon || res.data;
          
          let formattedDate = '';
          if (data.expireDate) {
            formattedDate = new Date(data.expireDate).toISOString().split('T')[0];
          }

          setFormData({
            couponId: data.couponId || '',
            couponCode: data.couponCode || '',
            discount: String(data.discount ?? '15'),
            expireDate: formattedDate
          });
        } catch (err) {
          setError(`Failed to load coupon: ${err.response?.data?.message || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    } else {
      // Default expiry date 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        expireDate: nextMonth.toISOString().split('T')[0]
      }));
    }
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};
    if (!formData.couponId.trim()) errors.couponId = 'Coupon ID is required (e.g. CPN-001)';
    if (!formData.couponCode.trim()) errors.couponCode = 'Coupon Code is required (e.g. SAVE20)';
    if (formData.discount === '' || Number(formData.discount) < 0 || Number(formData.discount) > 100) {
      errors.discount = 'Discount must be a percentage between 0 and 100';
    }
    if (!formData.expireDate) errors.expireDate = 'Expiration date is required';

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
        couponCode: formData.couponCode.toUpperCase().trim(),
        discount: Number(formData.discount),
        expireDate: new Date(formData.expireDate)
      };

      let result;
      if (isEdit) {
        result = await updateCoupon(id, payload);
      } else {
        result = await createCoupon(payload);
      }

      const saved = result.data?.data || result.data?.coupon || result.data;
      const targetId = saved?._id || saved?.couponId || id || formData.couponId;
      navigate(`/coupons/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error saving coupon');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading coupon form..." />;

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Edit Coupon' : 'Create Promotional Coupon'}
        subtitle={isEdit ? `Updating attributes for ${formData.couponCode}` : 'Register a new discount coupon entity (E5)'}
        icon={Tag}
        breadcrumbs={[
          { to: '/coupons', label: 'Coupons' },
          { label: isEdit ? 'Edit' : 'New Coupon' }
        ]}
      />

      {error && <ErrorMessage message={error} />}

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Coupon ID (Primary Key)"
              name="couponId"
              value={formData.couponId}
              onChange={handleChange}
              placeholder="e.g. CPN-001"
              required
              error={fieldErrors.couponId}
              helper="Auto-generated coupon reference number"
              disabled={isEdit}
            />

            <FormField
              label="Coupon Code"
              name="couponCode"
              value={formData.couponCode}
              onChange={handleChange}
              placeholder="e.g. FESTIVE20, CINEMA10"
              required
              error={fieldErrors.couponCode}
              helper="Promotional code entered by customers"
            />

            <FormField
              label="Discount Value (%)"
              name="discount"
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={handleChange}
              required
              error={fieldErrors.discount}
              helper="Percentage discount value (e.g. 20 means 20%)"
            />

            <FormField
              label="Expire Date"
              name="expireDate"
              type="date"
              value={formData.expireDate}
              onChange={handleChange}
              required
              error={fieldErrors.expireDate}
              helper="After this date, the coupon will be marked Expired"
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
              {submitting ? 'Saving Coupon...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
