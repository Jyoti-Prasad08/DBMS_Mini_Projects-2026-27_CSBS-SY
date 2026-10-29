import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Save, X, ArrowLeft } from 'lucide-react';
import { getCustomer, createCustomer, updateCustomer } from '../../api/customers';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    customerId: '',
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    age: '',
    gender: 'Male'
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
          const res = await getCustomer(id);
          const data = res.data?.data || res.data?.customer || res.data;
          setFormData({
            customerId: data.customerId || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            contactNo: data.contactNo || '',
            age: data.age ?? '',
            gender: data.gender || 'Male'
          });
        } catch (err) {
          setError(`Failed to load customer for editing: ${err.response?.data?.message || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    }
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};
    if (!formData.customerId.trim()) errors.customerId = 'Customer ID is required (e.g. CUST-001)';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.contactNo.trim()) errors.contactNo = 'Contact number is required';
    if (!formData.age || Number(formData.age) <= 0) errors.age = 'Valid age is required';
    if (!formData.gender) errors.gender = 'Gender selection is required';

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
        age: Number(formData.age)
      };

      let result;
      if (isEdit) {
        result = await updateCustomer(id, payload);
      } else {
        result = await createCustomer(payload);
      }

      const created = result.data?.data || result.data?.customer || result.data;
      const targetId = created?._id || created?.customerId || id || formData.customerId;
      navigate(`/customers/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error saving customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer record..." />;

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'Register New Customer'}
        subtitle={isEdit ? `Updating attributes for ${formData.customerId}` : 'Create a new customer profile record'}
        icon={Users}
        breadcrumbs={[
          { to: '/customers', label: 'Customers' },
          { label: isEdit ? 'Edit' : 'New Customer' }
        ]}
      />

      {error && <ErrorMessage message={error} />}

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Customer ID"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              placeholder="e.g. CUST-001"
              required
              error={fieldErrors.customerId}
              disabled={isEdit}
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@cinema.com"
              required
              error={fieldErrors.email}
            />

            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              required
              error={fieldErrors.firstName}
            />

            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              required
              error={fieldErrors.lastName}
            />

            <FormField
              label="Contact Number"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              required
              error={fieldErrors.contactNo}
            />

            <FormField
              label="Age"
              name="age"
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 24"
              required
              error={fieldErrors.age}
            />

            <FormField
              label="Gender"
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              required
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              error={fieldErrors.gender}
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
              {submitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
