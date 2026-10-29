import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, Save, X } from 'lucide-react';
import { getShow, createShow, updateShow } from '../../api/shows';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function ShowForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    showId: '',
    name: '',
    language: 'English',
    genre: '',
    duration: '',
    type: 'movies'
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
          const res = await getShow(id);
          const data = res.data?.data || res.data?.show || res.data;
          setFormData({
            showId: data.showId || '',
            name: data.name || '',
            language: data.language || 'English',
            genre: data.genre || '',
            duration: data.duration ?? '',
            type: data.type || 'movies'
          });
        } catch (err) {
          setError(`Failed to load show record: ${err.response?.data?.message || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    }
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};
    if (!formData.showId.trim()) errors.showId = 'Show ID is required (e.g. SHW-001)';
    if (!formData.name.trim()) errors.name = 'Show name / title is required';
    if (!formData.language.trim()) errors.language = 'Language is required';
    if (!formData.genre.trim()) errors.genre = 'Genre is required (e.g. Sci-Fi, Drama)';
    if (!formData.duration || Number(formData.duration) <= 0) errors.duration = 'Valid duration in minutes is required';
    if (!formData.type) errors.type = 'Type selection is required';

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
        duration: Number(formData.duration)
      };

      let result;
      if (isEdit) {
        result = await updateShow(id, payload);
      } else {
        result = await createShow(payload);
      }

      const saved = result.data?.data || result.data?.show || result.data;
      const targetId = saved?._id || saved?.showId || id || formData.showId;
      navigate(`/shows/${targetId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error saving show');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading show record..." />;

  return (
    <div className="container">
      <PageHeader
        title={isEdit ? 'Edit Show' : 'Add New Show'}
        subtitle={isEdit ? `Updating attributes for ${formData.showId}` : 'Program a new show, movie, or live performance'}
        icon={Film}
        breadcrumbs={[
          { to: '/shows', label: 'Shows' },
          { label: isEdit ? 'Edit' : 'New Show' }
        ]}
      />

      {error && <ErrorMessage message={error} />}

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField
              label="Show ID"
              name="showId"
              value={formData.showId}
              onChange={handleChange}
              placeholder="e.g. SHW-001"
              required
              error={fieldErrors.showId}
              helper="Unique identifier (e.g. SHW-001)"
              disabled={isEdit}
            />

            <FormField
              label="Show Type"
              name="type"
              type="select"
              value={formData.type}
              onChange={handleChange}
              required
              options={[
                { value: 'movies', label: '🎬 Movie' },
                { value: 'live Show', label: '🎭 Live Show' },
                { value: 'concert', label: '🎵 Concert' }
              ]}
              error={fieldErrors.type}
            />

            <FormField
              label="Title / Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Inception, Coldplay Live"
              required
              className="col-span-2"
              error={fieldErrors.name}
            />

            <FormField
              label="Language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="e.g. English, Hindi"
              required
              error={fieldErrors.language}
            />

            <FormField
              label="Genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              placeholder="e.g. Sci-Fi, Action, Musical"
              required
              error={fieldErrors.genre}
            />

            <FormField
              label="Duration (Minutes)"
              name="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g. 148"
              required
              error={fieldErrors.duration}
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
              {submitting ? 'Saving...' : isEdit ? 'Update Show' : 'Create Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
