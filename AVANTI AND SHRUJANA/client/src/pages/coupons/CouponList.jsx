import React, { useEffect, useState } from 'react';
import { Tag, Calendar, Copy, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { getCoupons } from '../../api/coupons';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CouponList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // default to active offers
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCoupons({ status: statusFilter });
      const data = res.data?.data || res.data?.coupons || res.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Could not load deals and offers. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter]);

  const isExpired = (expireDate) => {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  };

  const filteredCoupons = coupons.filter((c) => {
    if (statusFilter === 'active') return !isExpired(c.expireDate);
    if (statusFilter === 'expired') return isExpired(c.expireDate);
    return true;
  });

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="container">
      <PageHeader
        title="Deals & Offers"
        subtitle="Exclusive ticket discount vouchers and promo codes"
        icon={Tag}
        badge={<Badge variant="gold">{filteredCoupons.length} Available</Badge>}
        breadcrumbs={[{ label: 'Deals & Offers' }]}
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={14} /> Active Deals
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Offers
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('expired')}
          className={`btn btn-sm ${statusFilter === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock size={14} /> Expired
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchCoupons} />}
      {loading && <LoadingSpinner message="Finding cinema offers..." />}

      {!loading && !error && (
        <>
          {filteredCoupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Tag size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3>No coupons found</h3>
              <p>Check back soon for upcoming holiday promotions and discounts!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expireDate);
                const isCopied = copiedCode === coupon.couponCode;

                return (
                  <div
                    key={coupon._id || coupon.couponId}
                    className="card"
                    style={{
                      padding: '1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: expired ? 0.6 : 1,
                      border: expired ? '1px dashed var(--border)' : '1px solid var(--border)'
                    }}
                  >
                    <div>
                      {/* Top banner */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: expired ? 'var(--text-muted)' : '#4ade80' }}>
                          {coupon.discount}% OFF
                        </span>
                        <Badge variant={expired ? 'gray' : 'green'}>
                          {expired ? 'Expired' : 'Verified Deal'}
                        </Badge>
                      </div>

                      <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Save {coupon.discount}% on admission tickets
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Apply this code when viewing your ticket to receive an instant {coupon.discount}% reduction on your total.
                      </p>
                    </div>

                    <div>
                      {/* Expiration date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        <Calendar size={13} />
                        {coupon.expireDate
                          ? `Valid until ${new Date(coupon.expireDate).toLocaleDateString()}`
                          : 'Limited time'}
                      </div>

                      {/* Coupon Code Pill + Copy CTA */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.6rem 0.45rem 0.85rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px dashed var(--accent-gold)'
                      }}>
                        <span style={{ fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                          {coupon.couponCode}
                        </span>
                        <button
                          type="button"
                          disabled={expired}
                          onClick={() => handleCopy(coupon.couponCode)}
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', color: isCopied ? '#4ade80' : 'var(--text-primary)' }}
                        >
                          {isCopied ? (
                            <><Check size={13} /> Copied</>
                          ) : (
                            <><Copy size={13} /> Copy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
