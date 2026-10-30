import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface SupplierPoItem {
  supplierId: string;
  supplierName: string;
  poCount: number;
  totalAmount: number;
}

interface SupplierAcceptanceItem {
  supplierId: string;
  supplierName: string;
  totalAssigned: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  acceptanceRatePercent: number;
}

interface PeriodData {
  supplierPoCreated: SupplierPoItem[];
  supplierAcceptanceRate: SupplierAcceptanceItem[];
}

interface SupplierPoVsInvoiceItem {
  supplierId: string;
  supplierName: string;
  poCount: number;
  invoiceCount: number;
  poTotalAmount: number;
  invoiceTotalAmount: number;
}

interface PoReceiptInvoiceReconItem {
  poId: string;
  poNumber: string;
  poTitle: string;
  supplierName: string;
  poQuantity: number;
  poAmount: number;
  receivedQuantity: number;
  receivedAmount: number;
  invoiceQuantity: number;
  invoiceAmount: number;
  receiptGrnNumber: string;
  invoiceNumber: string;
  reconciliationStatus: string;
  isReconciled: boolean;
}

interface PoReconVsPaymentItem {
  poId: string;
  poNumber: string;
  poTitle: string;
  supplierName: string;
  reconciliationStatus: string;
  isReconciled: boolean;
  hasPaymentId: boolean;
  paymentId?: string;
  paymentStatus: string;
  reconciledAmount: number;
  paidAmount: number;
  paymentDueAmount: number;
}

interface PaymentDistribution {
  paidCount: number;
  paymentDueCount: number;
  onHoldCount: number;
  unreconciledCount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
}

interface BuyerDashboardData {
  summary: {
    totalPurchaseOrders: number;
    acceptedPurchaseOrders: number;
    overallAcceptanceRate: number;
    totalInvoices: number;
    totalReceipts: number;
    reconciledMatchedCount: number;
    reconciledExceptionCount: number;
    totalPaymentAmountDisbursed: number;
    totalPaymentAmountDue: number;
  };
  purchaseOrders: {
    weekly: PeriodData;
    monthly: PeriodData;
    quarterly: PeriodData;
  };
  invoiceAndReconciliation: {
    supplierPoVsInvoices: SupplierPoVsInvoiceItem[];
    poReceiptsInvoicesVsRecon: PoReceiptInvoiceReconItem[];
  };
  payments: {
    poReconVsPayments: PoReconVsPaymentItem[];
    distribution: PaymentDistribution;
  };
}

const PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316'  // Orange
];

const BuyerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'po' | 'invoice-recon' | 'payments'>('po');
  const [timeHorizon, setTimeHorizon] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [dashboardData, setDashboardData] = useState<BuyerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/dashboard/buyer');
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load buyer dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  };

  // --------------------------------------------------------------------------
  // SVG Charts Helpers
  // --------------------------------------------------------------------------

  // Render SVG Donut / Pie Chart
  const renderDonutChart = (
    data: { label: string; value: number; color: string }[],
    centerLabel?: string,
    centerValue?: string | number
  ) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No data available for this chart</p>
        </div>
      );
    }

    let cumulativeAngle = 0;
    const size = 180;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {data.map((item, idx) => {
              if (item.value === 0) return null;
              const fraction = item.value / total;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle * circumference;
              cumulativeAngle += fraction;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                >
                  <title>{`${item.label}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
                </circle>
              );
            })}
          </svg>
          {centerValue !== undefined && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{centerValue}</div>
              {centerLabel && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{centerLabel}</div>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color, flexShrink: 0 }}></span>
              <span style={{ color: 'var(--text-secondary)', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</span>
              <strong style={{ color: 'var(--text-primary)' }}>{item.value} ({((item.value / total) * 100).toFixed(0)}%)</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Horizontal Bar Chart (for Acceptance Rates)
  const renderHorizontalBarChart = (
    items: { label: string; rate: number; total: number; accepted: number }[]
  ) => {
    if (items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No supplier acceptance data recorded for this period</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {items.map((it, idx) => {
          const color = it.rate >= 80 ? '#10b981' : it.rate >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color }}>{it.rate}%</strong> ({it.accepted}/{it.total} Accepted)
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, it.rate))}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '5px',
                    transition: 'width 0.6s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Vertical Column Chart
  const renderColumnBarChart = (
    categories: string[],
    series: { name: string; color: string; values: number[] }[]
  ) => {
    const allValues = series.flatMap(s => s.values);
    const maxVal = Math.max(1, ...allValues);
    const height = 200;

    if (categories.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No data records to display</p>
        </div>
      );
    }

    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: `${height}px`, gap: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {categories.map((cat, catIdx) => (
            <div key={catIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                {series.map((s, sIdx) => {
                  const val = s.values[catIdx] || 0;
                  const barHeight = (val / maxVal) * (height - 40);
                  return (
                    <div
                      key={sIdx}
                      style={{
                        width: '18px',
                        height: `${Math.max(4, barHeight)}px`,
                        backgroundColor: s.color,
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${cat} - ${s.name}: ${val}`}
                    >
                      {val > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}>
                          {val}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
                {cat}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {series.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: s.color }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentPoPeriod: PeriodData = dashboardData?.purchaseOrders
    ? dashboardData.purchaseOrders[timeHorizon] || { supplierPoCreated: [], supplierAcceptanceRate: [] }
    : { supplierPoCreated: [], supplierAcceptanceRate: [] };

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem', minHeight: '100vh', width: '100%' }}>
      {/* Left Navigation with Dashboard as First Item */}
      <LeftNavigation activePage="dashboard" />

      {/* Main Dashboard Container */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Top Header */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                  <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                  <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Buyer Analytics Dashboard</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Procurement performance, 3-way reconciliation audit, and disbursement intelligence.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.55rem 1.1rem', borderRadius: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh Analytics
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ padding: '0.85rem 1.25rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {/* Executive KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Purchase Orders</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.totalPurchaseOrders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              {dashboardData?.summary?.acceptedPurchaseOrders || 0} Accepted ({dashboardData?.summary?.overallAcceptanceRate || 0}%)
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Invoices & Receipts</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.totalInvoices || 0} / {dashboardData?.summary?.totalReceipts || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Invoices received vs. GRN Receipts
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>3-Way Reconciliation Match</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.reconciledMatchedCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
              {dashboardData?.summary?.reconciledExceptionCount || 0} Exceptions / Discrepancies
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Disbursed Payments</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
              {formatCurrency(dashboardData?.summary?.totalPaymentAmountDisbursed || 0)}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
              Due: {formatCurrency(dashboardData?.summary?.totalPaymentAmountDue || 0)}
            </span>
          </div>
        </div>

        {/* 3 Sub-Sections Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('po')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'po' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'po' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              color: activeTab === 'po' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>📦</span>
            Purchase Order
          </button>

          <button
            onClick={() => setActiveTab('invoice-recon')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'invoice-recon' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'invoice-recon' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              color: activeTab === 'invoice-recon' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🧾</span>
            Invoice & Reconciliation
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'payments' ? '#ffffff' : 'transparent',
              boxShadow: activeTab === 'payments' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              color: activeTab === 'payments' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>💳</span>
            Payments
          </button>
        </div>

        {/* ============================================================ */}
        {/* SUB-SECTION 1: PURCHASE ORDER                               */}
        {/* ============================================================ */}
        {activeTab === 'po' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Time Horizon Filter Bar */}
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Analysis Time Period:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px' }}>
                <button
                  onClick={() => setTimeHorizon('weekly')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: timeHorizon === 'weekly' ? 'var(--accent-primary)' : 'transparent',
                    color: timeHorizon === 'weekly' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Weekly (Last 7 Days)
                </button>
                <button
                  onClick={() => setTimeHorizon('monthly')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: timeHorizon === 'monthly' ? 'var(--accent-primary)' : 'transparent',
                    color: timeHorizon === 'monthly' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Monthly (Last 30 Days)
                </button>
                <button
                  onClick={() => setTimeHorizon('quarterly')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: timeHorizon === 'quarterly' ? 'var(--accent-primary)' : 'transparent',
                    color: timeHorizon === 'quarterly' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Quarterly (Last 90 Days)
                </button>
              </div>
            </div>

            {/* A) Supplier-wise Purchase Orders Created (Bar & Pie Charts) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Supplier-wise Purchase Orders Created (Bar Chart)
                  </h3>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Number of purchase orders generated per supplier in the selected period.
                </p>
                {renderColumnBarChart(
                  currentPoPeriod.supplierPoCreated.map(s => s.supplierName),
                  [
                    {
                      name: 'POs Created',
                      color: '#6366f1',
                      values: currentPoPeriod.supplierPoCreated.map(s => s.poCount)
                    }
                  ]
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Supplier Purchase Order Share (Pie Chart)
                  </h3>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Percentage distribution of orders across suppliers.
                </p>
                {renderDonutChart(
                  currentPoPeriod.supplierPoCreated.map((s, idx) => ({
                    label: s.supplierName,
                    value: s.poCount,
                    color: PALETTE[idx % PALETTE.length]
                  })),
                  'Total POs',
                  currentPoPeriod.supplierPoCreated.reduce((sum, s) => sum + s.poCount, 0)
                )}
              </div>
            </div>

            {/* B) Supplier Accepted Purchase Order Rate (Bar & Pie Charts) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Supplier Acceptance Rate % (Bar Chart)
                  </h3>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Proportion of issued POs officially accepted vs. pending or declined by each supplier.
                </p>
                {renderHorizontalBarChart(
                  currentPoPeriod.supplierAcceptanceRate.map(s => ({
                    label: s.supplierName,
                    rate: s.acceptanceRatePercent,
                    total: s.totalAssigned,
                    accepted: s.acceptedCount
                  }))
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Overall PO Acceptance Breakdown (Pie Chart)
                  </h3>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Aggregated acceptance vs. pending vs. declined status for all suppliers.
                </p>
                {(() => {
                  const totalAccepted = currentPoPeriod.supplierAcceptanceRate.reduce((acc, s) => acc + s.acceptedCount, 0);
                  const totalPending = currentPoPeriod.supplierAcceptanceRate.reduce((acc, s) => acc + s.pendingCount, 0);
                  const totalDeclined = currentPoPeriod.supplierAcceptanceRate.reduce((acc, s) => acc + s.declinedCount, 0);
                  const total = totalAccepted + totalPending + totalDeclined;
                  const rate = total > 0 ? ((totalAccepted / total) * 100).toFixed(0) + '%' : '0%';

                  return renderDonutChart(
                    [
                      { label: 'Accepted', value: totalAccepted, color: '#10b981' },
                      { label: 'Pending Response', value: totalPending, color: '#f59e0b' },
                      { label: 'Declined / Cancelled', value: totalDeclined, color: '#ef4444' }
                    ],
                    'Acceptance',
                    rate
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-SECTION 2: INVOICE & RECONCILIATION                      */}
        {/* ============================================================ */}
        {activeTab === 'invoice-recon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* a) Purchase Order versus Invoices available with respect suppliers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Purchase Orders vs. Invoices Available (Grouped Bar Chart)
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Comparison of purchase orders issued vs. supplier invoices submitted.
                </p>
                {renderColumnBarChart(
                  (dashboardData?.invoiceAndReconciliation?.supplierPoVsInvoices || []).map(s => s.supplierName),
                  [
                    {
                      name: 'Purchase Orders',
                      color: '#3b82f6',
                      values: (dashboardData?.invoiceAndReconciliation?.supplierPoVsInvoices || []).map(s => s.poCount)
                    },
                    {
                      name: 'Invoices Received',
                      color: '#8b5cf6',
                      values: (dashboardData?.invoiceAndReconciliation?.supplierPoVsInvoices || []).map(s => s.invoiceCount)
                    }
                  ]
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Invoicing Coverage Ratio (Pie Chart)
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Proportion of purchase orders with corresponding invoices received.
                </p>
                {(() => {
                  const items = dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || [];
                  const withInvoice = items.filter(i => i.invoiceQuantity > 0).length;
                  const withoutInvoice = items.length - withInvoice;

                  return renderDonutChart(
                    [
                      { label: 'Invoiced POs', value: withInvoice, color: '#8b5cf6' },
                      { label: 'Pending Invoice', value: Math.max(0, withoutInvoice), color: '#cbd5e1' }
                    ],
                    'Invoiced',
                    items.length > 0 ? `${((withInvoice / items.length) * 100).toFixed(0)}%` : '0%'
                  );
                })()}
              </div>
            </div>

            {/* b) Purchase Receipts and Invoices Versus Reconciliation per Purchase Order */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Purchase Receipts and Invoices vs. Reconciliation (Per Purchase Order)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  3-Way matching verification: PO Quantity vs. Received Quantity vs. Invoiced Quantity.
                </p>
              </div>

              {/* Multi-Bar comparison */}
              {renderColumnBarChart(
                (dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || []).map(r => r.poNumber),
                [
                  {
                    name: 'PO Quantity',
                    color: '#3b82f6',
                    values: (dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || []).map(r => r.poQuantity)
                  },
                  {
                    name: 'Received Quantity',
                    color: '#10b981',
                    values: (dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || []).map(r => r.receivedQuantity)
                  },
                  {
                    name: 'Invoiced Quantity',
                    color: '#8b5cf6',
                    values: (dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || []).map(r => r.invoiceQuantity)
                  }
                ]
              )}

              {/* Drill-down PO Details Table */}
              <div style={{ overflowX: 'auto', marginTop: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="payments-list-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>PO Qty</th>
                      <th>Receipt GRN</th>
                      <th>Received Qty</th>
                      <th>Invoice No</th>
                      <th>Invoiced Qty</th>
                      <th>Reconciliation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.invoiceAndReconciliation?.poReceiptsInvoicesVsRecon || []).map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.poNumber}</strong></td>
                        <td>{row.supplierName}</td>
                        <td>{row.poQuantity}</td>
                        <td>{row.receiptGrnNumber || 'N/A'}</td>
                        <td>
                          <span style={{ color: row.receivedQuantity === row.poQuantity ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                            {row.receivedQuantity}
                          </span>
                        </td>
                        <td>{row.invoiceNumber || 'N/A'}</td>
                        <td>
                          <span style={{ color: row.invoiceQuantity === row.poQuantity ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                            {row.invoiceQuantity}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${row.reconciliationStatus === 'MATCHED' ? 'badge-success' : row.reconciliationStatus === 'EXCEPTION' ? 'badge-danger' : 'badge-individual'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            {row.reconciliationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-SECTION 3: PAYMENTS                                     */}
        {/* ============================================================ */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Business Invariant Banner */}
            <div style={{
              padding: '0.9rem 1.25rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#1e40af',
              fontSize: '0.88rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div>
                <strong>Reconciliation-to-Payment Invariant:</strong> Only Purchase Orders that have <strong>reconciled successfully (`MATCHED`)</strong> have a <strong>Payment ID generated</strong> and are eligible for disbursement authorization.
              </div>
            </div>

            {/* a) Reconciliation versus Payments with respect to each Purchase Order */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>

              {/* Bar Chart: Reconciled Amount vs Paid Amount per PO */}
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Reconciliation vs. Payments (Per Purchase Order)
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Reconciled amount vs. actual disbursed amount vs. payment due per order.
                </p>
                {renderColumnBarChart(
                  (dashboardData?.payments?.poReconVsPayments || []).map(p => p.poNumber),
                  [
                    {
                      name: 'Reconciled Amount',
                      color: '#6366f1',
                      values: (dashboardData?.payments?.poReconVsPayments || []).map(p => p.reconciledAmount)
                    },
                    {
                      name: 'Paid / Disbursed',
                      color: '#10b981',
                      values: (dashboardData?.payments?.poReconVsPayments || []).map(p => p.paidAmount)
                    },
                    {
                      name: 'Payment Due',
                      color: '#f59e0b',
                      values: (dashboardData?.payments?.poReconVsPayments || []).map(p => p.paymentDueAmount)
                    }
                  ]
                )}
              </div>

              {/* Donut Chart: Payment Status Distribution */}
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Disbursement Authorization Breakdown (Pie Chart)
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Payment IDs generated vs. blocked / pending reconciliation orders.
                </p>
                {(() => {
                  const dist = dashboardData?.payments?.distribution || { paidCount: 0, paymentDueCount: 0, onHoldCount: 0, unreconciledCount: 0 };
                  const total = dist.paidCount + dist.paymentDueCount + dist.onHoldCount + dist.unreconciledCount;
                  const eligiblePct = total > 0 ? (((dist.paidCount + dist.paymentDueCount) / total) * 100).toFixed(0) + '%' : '0%';

                  return renderDonutChart(
                    [
                      { label: 'Paid (Settled)', value: dist.paidCount, color: '#10b981' },
                      { label: 'Payment Due (Reconciled)', value: dist.paymentDueCount, color: '#3b82f6' },
                      { label: 'On Hold (Exception)', value: dist.onHoldCount, color: '#f59e0b' },
                      { label: 'Blocked (Unreconciled)', value: dist.unreconciledCount, color: '#ef4444' }
                    ],
                    'Eligible',
                    eligiblePct
                  );
                })()}
              </div>
            </div>

            {/* Audit Matrix: Reconciliation to Payment Table */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Reconciliation vs. Payments Audit Matrix
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Verifies that only successfully matched Purchase Orders possess an authorized Payment ID.
                </p>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="payments-list-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Reconciliation Status</th>
                      <th>Payment ID Generated?</th>
                      <th>Payment ID</th>
                      <th>Payment Status</th>
                      <th>Reconciled Amount</th>
                      <th>Paid Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.payments?.poReconVsPayments || []).map((item, idx) => (
                      <tr key={idx}>
                        <td><strong>{item.poNumber}</strong></td>
                        <td>{item.supplierName}</td>
                        <td>
                          <span
                            className={`badge ${item.reconciliationStatus === 'MATCHED' || item.reconciliationStatus === 'Matched' ? 'badge-success' : 'badge-danger'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            {item.reconciliationStatus}
                          </span>
                        </td>
                        <td>
                          {item.hasPaymentId ? (
                            <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>✓</span> Yes
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>✕</span> No (Unreconciled)
                            </span>
                          )}
                        </td>
                        <td>
                          {item.paymentId ? (
                            <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                              {item.paymentId}
                            </strong>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Generated</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${item.paymentStatus === 'Paid' ? 'badge-success' : item.paymentStatus === 'Payment Due' ? 'badge-individual' : 'badge-danger'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td><strong>{formatCurrency(item.reconciledAmount)}</strong></td>
                        <td style={{ color: item.paidAmount > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                          {formatCurrency(item.paidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerDashboard;
