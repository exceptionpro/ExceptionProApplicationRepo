import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftNavigation from '../components/LeftNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface PaymentRecord {
  id: string;
  paymentId: string;
  paymentDate: string;
  paymentStatus: 'Pending' | 'Payment Due' | 'Paid' | 'On Hold' | 'Cancelled';
  currency: string;

  supplierId?: string;
  supplierName: string;
  supplierEmail?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;

  // 1. PO Details
  requisitionId?: string;
  poNumber: string;
  poQuantity: number;
  poUnitPrice: number;
  poAmount: number;
  poDate?: string;

  // 2. Purchase Receipt
  purchaseReceiptId?: string;
  receiptNumber: string;
  receiptDate: string;
  receivedQuantity: number;
  receivedAmount: number;

  // 3. Invoice
  invoiceId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceQuantity: number;
  invoiceUnitPrice: number;
  invoiceAmount: number;

  // 4. Reconciliation
  reconciliationId?: string;
  reconciliationStatus: string;
  exceptionReason?: string;
  poVsReceiptQtyVariance?: number;
  receiptVsInvoiceQtyVariance?: number;
  poVsInvoiceQtyVariance?: number;
  priceVariance?: number;
  amountVariance?: number;

  // 5. Payment Amount
  amountToPay: number;

  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_SUPPLIER_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-000001-default',
    paymentId: 'PAY-000001',
    paymentDate: '2026-09-21',
    paymentStatus: 'Paid',
    currency: 'INR',
    buyerName: 'XYZ Manufacturing',
    supplierName: 'ABC Technologies Pvt Ltd',
    poNumber: 'PO-00125',
    poQuantity: 100,
    poUnitPrice: 1250,
    poAmount: 125000,
    receiptNumber: 'REC-003',
    receiptDate: '2026-09-21',
    receivedQuantity: 100,
    receivedAmount: 125000,
    invoiceNumber: 'INV-00456',
    invoiceDate: '2026-09-22',
    invoiceQuantity: 100,
    invoiceUnitPrice: 1250,
    invoiceAmount: 125000,
    amountToPay: 125000,
    reconciliationStatus: 'Matched'
  },
  {
    id: 'pay-000002-default',
    paymentId: 'PAY-000002',
    paymentDate: '2026-09-22',
    paymentStatus: 'Payment Due',
    currency: 'INR',
    buyerName: 'ABC Industries',
    supplierName: 'ABC Technologies Pvt Ltd',
    poNumber: 'PO-00126',
    poQuantity: 85,
    poUnitPrice: 1000,
    poAmount: 85000,
    receiptNumber: 'REC-004',
    receiptDate: '2026-09-22',
    receivedQuantity: 85,
    receivedAmount: 85000,
    invoiceNumber: 'INV-00478',
    invoiceDate: '2026-09-23',
    invoiceQuantity: 85,
    invoiceUnitPrice: 1000,
    invoiceAmount: 85000,
    amountToPay: 85000,
    reconciliationStatus: 'Matched'
  },
  {
    id: 'pay-000003-default',
    paymentId: 'PAY-000003',
    paymentDate: '2026-09-20',
    paymentStatus: 'On Hold',
    currency: 'INR',
    buyerName: 'DEF Corp',
    supplierName: 'ABC Technologies Pvt Ltd',
    poNumber: 'PO-00127',
    poQuantity: 50,
    poUnitPrice: 1000,
    poAmount: 50000,
    receiptNumber: 'REC-005',
    receiptDate: '2026-09-20',
    receivedQuantity: 40,
    receivedAmount: 40000,
    invoiceNumber: 'INV-00489',
    invoiceDate: '2026-09-23',
    invoiceQuantity: 50,
    invoiceUnitPrice: 1000,
    invoiceAmount: 50000,
    amountToPay: 50000,
    reconciliationStatus: 'Exception',
    exceptionReason: 'Invoice quantity exceeds received quantity.'
  },
  {
    id: 'pay-000004-default',
    paymentId: 'PAY-000004',
    paymentDate: '2026-09-24',
    paymentStatus: 'Pending',
    currency: 'INR',
    buyerName: 'PQR Ltd',
    supplierName: 'ABC Technologies Pvt Ltd',
    poNumber: 'PO-00128',
    poQuantity: 75,
    poUnitPrice: 1000,
    poAmount: 75000,
    receiptNumber: 'REC-006',
    receiptDate: '2026-09-23',
    receivedQuantity: 75,
    receivedAmount: 75000,
    invoiceNumber: 'INV-00501',
    invoiceDate: '2026-09-24',
    invoiceQuantity: 75,
    invoiceUnitPrice: 1000,
    invoiceAmount: 75000,
    amountToPay: 75000,
    reconciliationStatus: 'Matched'
  }
];

const statusOptions: Array<'Pending' | 'Payment Due' | 'Paid' | 'On Hold' | 'Cancelled'> = [
  'Pending',
  'Payment Due',
  'Paid',
  'On Hold',
  'Cancelled'
];

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const accountTypeRaw = (user?.accountType || '').toLowerCase().trim();
  const isSupplier = accountTypeRaw.includes('supplier');

  const [payments, setPayments] = useState<PaymentRecord[]>(isSupplier ? DEFAULT_SUPPLIER_PAYMENTS : []);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'detail'>(isSupplier ? 'table' : 'detail');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/payments');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPayments(res.data);
        setSelectedPaymentId(prev => {
          const exists = res.data.some((p: PaymentRecord) => p.id === prev || p.paymentId === prev);
          return exists ? prev : res.data[0].id;
        });
      } else {
        if (isSupplier) {
          setPayments(DEFAULT_SUPPLIER_PAYMENTS);
          setSelectedPaymentId(DEFAULT_SUPPLIER_PAYMENTS[0].id);
        } else {
          setPayments([]);
          setSelectedPaymentId('');
        }
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      if (isSupplier) {
        setPayments(DEFAULT_SUPPLIER_PAYMENTS);
        setSelectedPaymentId(DEFAULT_SUPPLIER_PAYMENTS[0].id);
      } else {
        setError(err.response?.data?.message || 'Failed to load payments.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPayment: PaymentRecord | undefined =
    payments.find(p => p.id === selectedPaymentId || p.paymentId === selectedPaymentId) ||
    (payments.length > 0 ? payments[0] : undefined);

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenPayment = (payment: PaymentRecord) => {
    setSelectedPaymentId(payment.id);
    setViewMode('detail');
  };

  const handleApprovePayment = async () => {
    if (!selectedPayment) return;
    setUpdating(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/payments/${selectedPayment.id}/approve`);
      if (res.data) {
        setPayments(prev => prev.map(p => p.id === selectedPayment.id ? res.data : p));
        setSuccessMessage('Payment has been Approved (Status: Payment Due).');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      console.error('Error approving payment:', err);
      setError(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return;
    setUpdating(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/payments/${selectedPayment.id}/mark-paid`);
      if (res.data) {
        setPayments(prev => prev.map(p => p.id === selectedPayment.id ? res.data : p));
        setSuccessMessage('Payment successfully marked as Paid!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      console.error('Error marking payment as paid:', err);
      setError(err.response?.data?.message || 'Failed to mark payment as paid.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'badge-success';
      case 'payment due':
        return 'badge-warning';
      case 'on hold':
        return 'badge-danger';
      case 'pending':
        return 'badge-secondary';
      case 'cancelled':
        return 'badge-muted';
      default:
        return 'badge-primary';
    }
  };

  const filteredPayments = payments.filter(p => {
    const sTerm = searchTerm.toLowerCase().trim();
    const matchesSearch = !sTerm ||
      (p.paymentId && p.paymentId.toLowerCase().includes(sTerm)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(sTerm)) ||
      (p.buyerName && p.buyerName.toLowerCase().includes(sTerm)) ||
      (p.poNumber && p.poNumber.toLowerCase().includes(sTerm)) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(sTerm));

    const matchesFilter = filterStatus === 'ALL' || (p.paymentStatus && p.paymentStatus.toLowerCase() === filterStatus.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const isException = selectedPayment?.reconciliationStatus?.toLowerCase() === 'exception' ||
    Boolean(selectedPayment?.exceptionReason && selectedPayment.exceptionReason.trim().length > 0);

  return (
    <div className="feed-layout payment-page-layout">
      {/* Left Sidebar Navigation */}
      <LeftNavigation activePage="payments" />

      {/* Main Payment Content Area */}
      <main className="payment-main-content">
        {/* Page Header Banner */}
        <div className="glass-card payment-header-card">
          <div className="payment-header-title-wrap">
            <div className="payment-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {isSupplier ? 'PAYMENTS' : 'Payments & Disbursements'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isSupplier
                  ? 'Track customer payment disbursements, settlement status, and 3-way matched purchase orders.'
                  : 'Manage 3-way matched purchase payments, approval workflows, and settlement details.'}
              </p>
            </div>
          </div>

          <div className="payment-header-actions">
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px' }}>
              <button
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={`payments-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Table List View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Table List
              </button>
              <button
                id="view-mode-detail-btn"
                onClick={() => setViewMode('detail')}
                className={`payments-view-toggle-btn ${viewMode === 'detail' ? 'active' : ''}`}
                title="Detailed Statement View"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M9 21V9"></path>
                </svg>
                Statement View
              </button>
            </div>

            <button
              id="payments-refresh-btn"
              onClick={fetchPayments}
              className="btn btn-outline"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              title="Refresh payments list"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 1: PAYMENTS TABLE VIEW (Default for Supplier) */}
        {/* ==================================================== */}
        {viewMode === 'table' && (
          <div className="glass-card payment-table-card">
            <div className="payment-table-header">
              <div>
                <h3 className="payment-table-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  PAYMENTS
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Click on any Payment ID hyperlink to view detailed Payment Information and reconciliation breakdown.
                </p>
              </div>

              {/* Filter & Search Toolbar */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="payment-search-box" style={{ maxWidth: '280px' }}>
                  <input
                    id="supplier-payments-search-input"
                    type="text"
                    placeholder={`Search Payment ID, ${isSupplier ? 'Buyer' : 'Supplier'}, Invoice...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="payment-search-input"
                  />
                </div>
                <select
                  id="supplier-payments-filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="payment-filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="payment-table-responsive" style={{ margin: 0, border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <table className="payments-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Payment ID</th>
                    <th style={{ width: '25%' }}>{isSupplier ? 'Buyer' : 'Supplier'}</th>
                    <th style={{ width: '20%' }}>Invoice</th>
                    <th style={{ width: '18%' }}>Amount</th>
                    <th style={{ width: '17%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    return (
                      <tr key={p.id || p.paymentId}>
                        <td>
                          <button
                            id={`payment-id-link-${p.paymentId}`}
                            className="payment-id-link"
                            onClick={() => handleOpenPayment(p)}
                            title="Click to view full payment information"
                          >
                            <span>{p.paymentId}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </button>
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {isSupplier ? (p.buyerName || 'XYZ Manufacturing') : (p.supplierName || 'ABC Technologies Pvt Ltd')}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: '500' }}>
                          {p.invoiceNumber || 'INV-00456'}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {formatCurrency(p.amountToPay || p.invoiceAmount || p.poAmount)}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(p.paymentStatus)}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No payments found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: DETAILED PAYMENT INFORMATION STATEMENT VIEW */}
        {/* ==================================================== */}
        {viewMode === 'detail' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Payment Records Selector Tabs & Search */}
            <div className="glass-card payment-selector-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  id="back-to-payments-table-btn"
                  onClick={() => setViewMode('table')}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  Back to Payments List
                </button>

                <div className="payment-filter-controls" style={{ margin: 0, padding: 0 }}>
                  <div className="payment-search-box">
                    <input
                      id="payments-search-input"
                      type="text"
                      placeholder={`Search Payment ID, ${isSupplier ? 'Buyer' : 'Supplier'}, PO, or Invoice...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="payment-search-input"
                    />
                  </div>
                  <div className="payment-filter-group">
                    <label htmlFor="payments-filter-status" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      Status:
                    </label>
                    <select
                      id="payments-filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="payment-filter-select"
                    >
                      <option value="ALL">All Statuses</option>
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Tabs to Switch Active Payment */}
              <div className="payment-tabs-scroll">
                {filteredPayments.map((p) => {
                  const isSelected = (p.id === selectedPayment?.id || p.paymentId === selectedPayment?.paymentId);
                  const isPException = p.reconciliationStatus?.toLowerCase() === 'exception';
                  return (
                    <button
                      key={p.id || p.paymentId}
                      id={`payment-tab-${p.paymentId}`}
                      onClick={() => setSelectedPaymentId(p.id)}
                      className={`payment-tab-item ${isSelected ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {p.paymentId}
                        </strong>
                        <span className={`badge ${getStatusBadgeClass(p.paymentStatus)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {p.paymentStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {isSupplier ? (p.buyerName || 'Buyer') : (p.supplierName || 'Supplier')}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(p.amountToPay || p.invoiceAmount || p.poAmount)}</span>
                        {isPException && <span style={{ color: 'var(--error)', fontSize: '0.7rem', fontWeight: '600' }}>⚠ Exception</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {!selectedPayment && !loading && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Payment Records Available</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
                  Payments are automatically generated from 3-way matched Purchase Orders and Invoices.
                </p>
                <button
                  onClick={fetchPayments}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Refresh / Fetch Payments
                </button>
              </div>
            )}

            {selectedPayment && (
              <>
                {/* ==================================================== */}
                {/* PAYMENT STATEMENT HEADER */}
                {/* ==================================================== */}
                <div className={`glass-card payment-statement-card ${isException ? 'exception' : 'matched'}`}>
                  <div className="payment-statement-top">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                          PAYMENT STATEMENT
                        </span>
                        <span className={`badge ${getStatusBadgeClass(selectedPayment.paymentStatus)}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                          {selectedPayment.paymentStatus}
                        </span>
                        {isException && (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                            ⚠ Reconciliation Exception
                          </span>
                        )}
                      </div>
                      <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Payment ID: {selectedPayment.paymentId}
                      </h1>
                    </div>
                  </div>

                  {/* Payment Header Key Summary Grid */}
                  <div className="payment-summary-grid">
                    <div className="payment-summary-stat-box">
                      <span className="payment-stat-label">Buyer</span>
                      <div className="payment-stat-val">
                        {selectedPayment.buyerName || 'XYZ Manufacturing'}
                      </div>
                    </div>

                    <div className="payment-summary-stat-box">
                      <span className="payment-stat-label">Supplier</span>
                      <div className="payment-stat-val">
                        {selectedPayment.supplierName || 'ABC Technologies Pvt Ltd'}
                      </div>
                    </div>

                    <div className="payment-summary-stat-box">
                      <span className="payment-stat-label">PO Number</span>
                      <div className="payment-stat-val">
                        {selectedPayment.poNumber || 'PO-2026-00125'}
                      </div>
                    </div>

                    <div className="payment-summary-stat-box">
                      <span className="payment-stat-label">Invoice</span>
                      <div className="payment-stat-val">
                        {selectedPayment.invoiceNumber || 'INV-2026-00456'}
                      </div>
                    </div>

                    <div className="payment-summary-stat-box">
                      <span className="payment-stat-label">Payment Date</span>
                      <div className="payment-stat-val">
                        {formatDate(selectedPayment.paymentDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Column Top Breakdown (PO Details, Purchase Receipt, Invoice) */}
                <div className="payment-breakdown-grid">
                  {/* ==================================================== */}
                  {/* 1. PO DETAILS */}
                  {/* ==================================================== */}
                  <div className="glass-card payment-breakdown-card">
                    <div className="payment-section-header">
                      <span className="payment-step-badge step-po">1</span>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        PO DETAILS
                      </h3>
                    </div>

                    <div className="payment-breakdown-rows">
                      <div className="payment-data-row">
                        <span>PO Number</span>
                        <strong>{selectedPayment.poNumber || 'PO-00125'}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>PO Quantity</span>
                        <strong>{selectedPayment.poQuantity}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>PO Unit Price</span>
                        <strong>{formatCurrency(selectedPayment.poUnitPrice)}</strong>
                      </div>

                      <div className="payment-total-box po">
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>PO Amount</span>
                        <strong style={{ color: 'var(--accent-primary)', fontSize: '1.05rem', fontWeight: '800' }}>
                          {formatCurrency(selectedPayment.poAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================== */}
                  {/* 2. PURCHASE RECEIPT */}
                  {/* ==================================================== */}
                  <div className="glass-card payment-breakdown-card">
                    <div className="payment-section-header">
                      <span className="payment-step-badge step-receipt">2</span>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        PURCHASE RECEIPT
                      </h3>
                    </div>

                    <div className="payment-breakdown-rows">
                      <div className="payment-data-row">
                        <span>Receipt Number</span>
                        <strong>{selectedPayment.receiptNumber || 'REC-003'}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>Receipt Date</span>
                        <strong>{formatDate(selectedPayment.receiptDate || selectedPayment.paymentDate)}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>Received Quantity</span>
                        <strong>{selectedPayment.receivedQuantity}</strong>
                      </div>

                      <div className="payment-total-box receipt">
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Received Amount</span>
                        <strong style={{ color: '#0284c7', fontSize: '1.05rem', fontWeight: '800' }}>
                          {formatCurrency(selectedPayment.receivedAmount || (selectedPayment.poUnitPrice * selectedPayment.receivedQuantity))}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================== */}
                  {/* 3. INVOICE */}
                  {/* ==================================================== */}
                  <div className="glass-card payment-breakdown-card">
                    <div className="payment-section-header">
                      <span className="payment-step-badge step-invoice">3</span>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        INVOICE
                      </h3>
                    </div>

                    <div className="payment-breakdown-rows">
                      <div className="payment-data-row">
                        <span>Invoice Number</span>
                        <strong>{selectedPayment.invoiceNumber || 'INV-00456'}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>Invoice Quantity</span>
                        <strong>{selectedPayment.invoiceQuantity}</strong>
                      </div>

                      <div className="payment-data-row">
                        <span>Invoice Unit Price</span>
                        <strong>{formatCurrency(selectedPayment.invoiceUnitPrice)}</strong>
                      </div>

                      <div className="payment-total-box invoice">
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Invoice Amount</span>
                        <strong style={{ color: 'var(--success)', fontSize: '1.05rem', fontWeight: '800' }}>
                          {formatCurrency(selectedPayment.invoiceAmount || selectedPayment.amountToPay)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* 4. RECONCILIATION */}
                {/* ==================================================== */}
                <div className="glass-card payment-reconciliation-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="payment-step-badge step-reconciliation">4</span>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        RECONCILIATION (3-WAY MATCH)
                      </h3>
                    </div>

                    {!isSupplier && (
                      <button
                        id="payments-view-reconciliation-btn"
                        onClick={() => navigate('/reconciliation')}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.85rem', fontWeight: '600' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        [View Reconciliation]
                      </button>
                    )}
                  </div>

                  {/* 3-Way Match Matrix Table */}
                  <div className="payment-table-responsive">
                    <table className="payment-match-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>PO (Requisition)</th>
                          <th>Purchase Receipt</th>
                          <th>Invoice</th>
                          <th>Variance</th>
                          <th>Match Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Quantity Row */}
                        <tr>
                          <td style={{ fontWeight: '600' }}>Quantity</td>
                          <td>{selectedPayment.poQuantity}</td>
                          <td>{selectedPayment.receivedQuantity}</td>
                          <td>{selectedPayment.invoiceQuantity}</td>
                          <td style={{ fontWeight: '600', color: selectedPayment.poQuantity === selectedPayment.invoiceQuantity ? 'var(--text-secondary)' : 'var(--error)' }}>
                            {selectedPayment.invoiceQuantity - selectedPayment.poQuantity !== 0 ? `${selectedPayment.invoiceQuantity - selectedPayment.poQuantity > 0 ? '+' : ''}${selectedPayment.invoiceQuantity - selectedPayment.poQuantity}` : '0'}
                          </td>
                          <td>
                            {selectedPayment.poQuantity === selectedPayment.receivedQuantity && selectedPayment.receivedQuantity === selectedPayment.invoiceQuantity ? (
                              <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✓ Matched</span>
                            ) : (
                              <span style={{ color: 'var(--warning)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⚠ Mismatch</span>
                            )}
                          </td>
                        </tr>

                        {/* Unit Price Row */}
                        <tr>
                          <td style={{ fontWeight: '600' }}>Unit Price</td>
                          <td>{formatCurrency(selectedPayment.poUnitPrice)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>—</td>
                          <td>{formatCurrency(selectedPayment.invoiceUnitPrice)}</td>
                          <td style={{ fontWeight: '600', color: selectedPayment.poUnitPrice === selectedPayment.invoiceUnitPrice ? 'var(--text-secondary)' : 'var(--error)' }}>
                            {formatCurrency(Math.abs(selectedPayment.invoiceUnitPrice - selectedPayment.poUnitPrice))}
                          </td>
                          <td>
                            {selectedPayment.poUnitPrice === selectedPayment.invoiceUnitPrice ? (
                              <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✓ Matched</span>
                            ) : (
                              <span style={{ color: 'var(--error)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⚠ Mismatch</span>
                            )}
                          </td>
                        </tr>

                        {/* Total Amount Row */}
                        <tr>
                          <td style={{ fontWeight: '600' }}>Total Amount</td>
                          <td style={{ fontWeight: '600' }}>{formatCurrency(selectedPayment.poAmount)}</td>
                          <td style={{ fontWeight: '600' }}>{formatCurrency(selectedPayment.receivedAmount || (selectedPayment.poUnitPrice * selectedPayment.receivedQuantity))}</td>
                          <td style={{ fontWeight: '600' }}>{formatCurrency(selectedPayment.invoiceAmount || selectedPayment.amountToPay)}</td>
                          <td style={{ fontWeight: '600', color: (selectedPayment.poAmount === selectedPayment.invoiceAmount) ? 'var(--text-secondary)' : 'var(--error)' }}>
                            {formatCurrency(Math.abs((selectedPayment.invoiceAmount || selectedPayment.amountToPay) - selectedPayment.poAmount))}
                          </td>
                          <td>
                            {selectedPayment.poAmount === (selectedPayment.receivedAmount || selectedPayment.poAmount) && selectedPayment.poAmount === (selectedPayment.invoiceAmount || selectedPayment.amountToPay) ? (
                              <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✓ Matched</span>
                            ) : (
                              <span style={{ color: 'var(--warning)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⚠ Mismatch</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Status & Exception Alert Banner */}
                  {!isException ? (
                    <div className="payment-recon-banner-matched">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.25rem', color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                        <div>
                          <strong style={{ color: '#047857', fontSize: '0.95rem' }}>Reconciliation Status: ✓ Matched</strong>
                          <div style={{ fontSize: '0.8rem', color: '#065f46', marginTop: '0.1rem' }}>
                            All 3-way check invariants (PO, Purchase Receipt, and Invoice quantities & pricing) match perfectly.
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        Cleared for Payment
                      </span>
                    </div>
                  ) : (
                    <div className="payment-recon-banner-exception">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.35rem', color: 'var(--error)' }}>⚠</span>
                          <strong style={{ color: '#b91c1c', fontSize: '1.05rem' }}>
                            Reconciliation Status: ⚠ Exception
                          </strong>
                        </div>
                        <div style={{
                          backgroundColor: 'var(--error)',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          padding: '0.35rem 0.8rem',
                          borderRadius: '6px',
                          letterSpacing: '0.05em'
                        }}>
                          PAYMENT STATUS: ON HOLD
                        </div>
                      </div>

                      <div className="payment-exception-reason-box">
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>Reason:</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#7f1d1d', marginTop: '0.15rem' }}>
                          {selectedPayment.exceptionReason || 'Invoice quantity exceeds received quantity.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ==================================================== */}
                {/* 5. PAYMENT AMOUNT & ACTION CONTROLS */}
                {/* ==================================================== */}
                <div className="glass-card payment-auth-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <span className="payment-step-badge step-authorization">5</span>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      PAYMENT AMOUNT & SETTLEMENT
                    </h3>
                  </div>

                  <div className="payment-auth-grid">
                    {/* Amounts Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Invoice Amount</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                          {formatCurrency(selectedPayment.invoiceAmount || selectedPayment.amountToPay)}
                        </strong>
                      </div>

                      <div className="payment-amount-box">
                        <div>
                          <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
                            {isSupplier ? 'AMOUNT TO RECEIVE' : 'AMOUNT TO PAY'}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Approved Payable</div>
                        </div>
                        <strong className="payment-amount-highlight">
                          {formatCurrency(selectedPayment.amountToPay || selectedPayment.invoiceAmount || selectedPayment.poAmount)}
                        </strong>
                      </div>
                    </div>

                    {/* Status Indicator & Action Buttons */}
                    <div className="payment-auth-controls-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Current Payment Status:</span>
                        <span className={`badge ${getStatusBadgeClass(selectedPayment.paymentStatus)}`} style={{ fontSize: '0.88rem', padding: '0.35rem 0.85rem', fontWeight: '800' }}>
                          {selectedPayment.paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Buyer Action Buttons (for Buyer role) or Status confirmation for Supplier */}
                      {!isSupplier ? (
                        <div className="payment-auth-btn-group">
                          <button
                            id="payment-approve-btn"
                            onClick={handleApprovePayment}
                            disabled={updating || selectedPayment.paymentStatus === 'Paid'}
                            className="btn btn-primary"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            [Approve Payment]
                          </button>

                          <button
                            id="payment-mark-paid-btn"
                            onClick={handleMarkAsPaid}
                            disabled={updating || selectedPayment.paymentStatus === 'Paid'}
                            className="btn btn-success"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 14 14"></polyline>
                            </svg>
                            [Mark as Paid]
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                          <span>Disbursement authorization is handled directly by buyer procurement finance.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Payments;
