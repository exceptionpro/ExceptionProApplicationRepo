import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface ChartDistributionItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface BuyerPrItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  totalRequested: number;
  approvedCount: number;
  declinedCount: number;
  pendingCount: number;
  approvalRatePercent: number;
}

interface BuyerCollaborationItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  totalRequests: number;
  approvedCount: number;
  declinedCount: number;
  proposalsCount: number;
  convertedToPoCount: number;
  conversionRatePercent: number;
}

interface PeriodSupplierData {
  buyerPurchaseRequests: BuyerPrItem[];
  buyerCollaborationRequests: BuyerCollaborationItem[];
  prStatusDistribution: ChartDistributionItem[];
  collabStatusDistribution: ChartDistributionItem[];
}

interface BuyerReceiptItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  totalReceipts: number;
  approvedCount: number;
  pendingApprovalCount: number;
  pendingQuantity: number;
  approvalRatePercent: number;
}

interface ReceiptSubGroup {
  totalReceipts: number;
  approvedCount: number;
  pendingApprovalCount: number;
  totalPendingQuantity: number;
  approvalRatePercent: number;
  buyerStats: BuyerReceiptItem[];
  approvalDistribution: ChartDistributionItem[];
}

interface BuyerPoVsInvoiceItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  poCount: number;
  poTotalAmount: number;
  invoicesCreatedCount: number;
  invoicesTotalAmount: number;
  invoicingRatePercent: number;
}

interface BuyerInvoiceVsPaymentItem {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  invoicesCount: number;
  invoicesTotalAmount: number;
  paymentsReceivedCount: number;
  paymentsReceivedAmount: number;
  dueAmount: number;
  paymentSettlementRatePercent: number;
}

interface SupplierDashboardData {
  summary: {
    totalPurchaseRequests: number;
    approvedPurchaseRequests: number;
    declinedPurchaseRequests: number;
    prApprovalRate: number;
    totalCollaborationRequests: number;
    approvedCollaborationRequests: number;
    declinedCollaborationRequests: number;
    proposalsSubmitted: number;
    convertedToPoCount: number;
    collabConversionRate: number;
    totalReceipts: number;
    pendingZeroReceipts: number;
    pendingZeroApprovedRate: number;
    pendingGreaterThanZeroReceipts: number;
    pendingGreaterThanZeroApprovedRate: number;
    totalPos: number;
    totalInvoices: number;
    totalPoAmount: number;
    totalInvoicedAmount: number;
    totalPaymentsReceived: number;
    totalPaidAmount: number;
  };
  purchaseAndCollaboration: {
    weekly: PeriodSupplierData;
    monthly: PeriodSupplierData;
    quarterly: PeriodSupplierData;
  };
  receipts: {
    allDeliveredReceipts: ReceiptSubGroup;
    pendingQuantityReceipts: ReceiptSubGroup;
    receiptDistribution: ChartDistributionItem[];
  };
  invoiceAndPayments: {
    buyerPoVsInvoices: BuyerPoVsInvoiceItem[];
    buyerInvoiceVsPayments: BuyerInvoiceVsPaymentItem[];
    poInvoicingDistribution: ChartDistributionItem[];
    paymentStatusDistribution: ChartDistributionItem[];
  };
}

const SupplierDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pr-collab' | 'receipts' | 'invoice-payments'>('pr-collab');
  const [timeHorizon, setTimeHorizon] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [dashboardData, setDashboardData] = useState<SupplierDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/dashboard/supplier');
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load supplier dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load supplier dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------------------------------
  // SVG Chart Helpers
  // --------------------------------------------------------------------------

  // SVG Donut / Pie Chart
  const renderDonutChart = (
    data: ChartDistributionItem[],
    centerLabel?: string,
    centerValue?: string | number,
    size = 180
  ) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No data recorded for this chart</p>
        </div>
      );
    }

    let cumulativeAngle = 0;
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
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{centerValue}</div>
              {centerLabel && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{centerLabel}</div>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
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

  // Grouped Horizontal Bar Chart
  const renderGroupedBarChart = (
    categories: {
      name: string;
      bars: { label: string; value: number; color: string }[];
    }[],
    unit = ''
  ) => {
    if (categories.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No activity data found for this selection</p>
        </div>
      );
    }

    // Find max value across all bars for scaling
    let maxValue = 0;
    categories.forEach(cat => {
      cat.bars.forEach(b => {
        if (b.value > maxValue) maxValue = b.value;
      });
    });
    if (maxValue === 0) maxValue = 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>{cat.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {cat.bars.map((bar, bIdx) => {
                const widthPct = Math.max(4, (bar.value / maxValue) * 100);
                return (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                    <span style={{ width: '130px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {bar.label}
                    </span>
                    <div style={{ flex: 1, height: '14px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: '100%',
                          backgroundColor: bar.color,
                          borderRadius: '6px',
                          transition: 'width 0.5s ease',
                        }}
                      ></div>
                    </div>
                    <span style={{ minWidth: '55px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {bar.value} {unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Grouped Amount Bar Chart (Currency format)
  const renderAmountBarChart = (
    categories: {
      name: string;
      bars: { label: string; value: number; color: string }[];
    }[]
  ) => {
    if (categories.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No financial activity data found</p>
        </div>
      );
    }

    let maxValue = 0;
    categories.forEach(cat => {
      cat.bars.forEach(b => {
        if (b.value > maxValue) maxValue = b.value;
      });
    });
    if (maxValue === 0) maxValue = 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {cat.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {cat.bars.map((bar, bIdx) => {
                const widthPct = Math.max(4, (bar.value / maxValue) * 100);
                return (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                    <span style={{ width: '140px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {bar.label}
                    </span>
                    <div style={{ flex: 1, height: '14px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${widthPct}%`,
                          height: '100%',
                          backgroundColor: bar.color,
                          borderRadius: '6px',
                          transition: 'width 0.5s ease',
                        }}
                      ></div>
                    </div>
                    <span style={{ minWidth: '95px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(bar.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const currentPeriodData: PeriodSupplierData = dashboardData?.purchaseAndCollaboration
    ? dashboardData.purchaseAndCollaboration[timeHorizon] || {
      buyerPurchaseRequests: [],
      buyerCollaborationRequests: [],
      prStatusDistribution: [],
      collabStatusDistribution: [],
    }
    : {
      buyerPurchaseRequests: [],
      buyerCollaborationRequests: [],
      prStatusDistribution: [],
      collabStatusDistribution: [],
    };

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem', minHeight: '100vh', width: '100%' }}>
      {/* Left Navigation: Dashboard is the First Item */}
      <LeftNavigation activePage="dashboard" />

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Top Header */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                  <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                  <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Supplier Analytics Dashboard</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Purchase & Collaboration metrics, receipt approval tracking, and invoice-payment settlements.
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

        {/* Global KPI Summary Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Purchase Requests</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.totalPurchaseRequests || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              {dashboardData?.summary?.approvedPurchaseRequests || 0} Approved ({dashboardData?.summary?.prApprovalRate || 0}%)
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Collaboration Requests</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.totalCollaborationRequests || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
              {dashboardData?.summary?.convertedToPoCount || 0} Converted to PO ({dashboardData?.summary?.collabConversionRate || 0}%)
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Buyer Purchase Receipts</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
              {dashboardData?.summary?.totalReceipts || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {dashboardData?.summary?.pendingZeroReceipts || 0} Full ({dashboardData?.summary?.pendingZeroApprovedRate || 0}% Approved)
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Disbursed Payments</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ec4899', marginTop: '0.25rem' }}>
              {formatCurrency(dashboardData?.summary?.totalPaidAmount)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {dashboardData?.summary?.totalPaymentsReceived || 0} Payments Received
            </span>
          </div>
        </div>

        {/* 3 Main Interactive Sub-Sections Tab Switcher */}
        <div className="glass-card" style={{ padding: '0.6rem', display: 'flex', gap: '0.6rem', borderRadius: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('pr-collab')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s ease',
              backgroundColor: activeTab === 'pr-collab' ? 'var(--accent-primary, #6366f1)' : 'transparent',
              color: activeTab === 'pr-collab' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'pr-collab' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Purchase & Collaboration Requests
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s ease',
              backgroundColor: activeTab === 'receipts' ? 'var(--accent-primary, #6366f1)' : 'transparent',
              color: activeTab === 'receipts' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'receipts' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
              <rect x="9" y="3" width="6" height="4" rx="1"></rect>
              <path d="M9 14l2 2 4-4"></path>
            </svg>
            Receipts
          </button>

          <button
            onClick={() => setActiveTab('invoice-payments')}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s ease',
              backgroundColor: activeTab === 'invoice-payments' ? 'var(--accent-primary, #6366f1)' : 'transparent',
              color: activeTab === 'invoice-payments' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'invoice-payments' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Invoice & Payments
          </button>
        </div>

        {/* ================================================================== */}
        {/* SUB-SECTION 1: PURCHASE & COLLABORATION REQUESTS                   */}
        {/* ================================================================== */}
        {activeTab === 'pr-collab' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Time Horizon Filter Bar */}
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analysis Time Period: </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter buyer-wise requests and conversion rates</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.3rem', borderRadius: '8px' }}>
                {(['weekly', 'monthly', 'quarterly'] as const).map(horizon => (
                  <button
                    key={horizon}
                    onClick={() => setTimeHorizon(horizon)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                      backgroundColor: timeHorizon === horizon ? 'var(--accent-primary, #6366f1)' : 'transparent',
                      color: timeHorizon === horizon ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {horizon === 'weekly' ? 'Weekly (7d)' : horizon === 'monthly' ? 'Monthly (30d)' : 'Quarterly (90d)'}
                  </button>
                ))}
              </div>
            </div>

            {/* PART A: Buyer-Wise Purchase Requests (Approved vs Declined) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Buyer Purchase Requests: Approved vs Declined
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Breakdown of buyer orders approved vs rejected ({timeHorizon})
                    </p>
                  </div>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>

                {renderGroupedBarChart(
                  currentPeriodData.buyerPurchaseRequests.slice(0, 7).map(item => ({
                    name: item.buyerName,
                    bars: [
                      { label: 'Approved', value: item.approvedCount, color: '#10b981' },
                      { label: 'Declined', value: item.declinedCount, color: '#ef4444' },
                      { label: 'Pending', value: item.pendingCount, color: '#f59e0b' },
                    ]
                  })),
                  'reqs'
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Purchase Requests Overall Distribution
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Proportional status ratio across all buyers ({timeHorizon})
                  </p>
                </div>
                {renderDonutChart(
                  currentPeriodData.prStatusDistribution,
                  'Total PRs',
                  currentPeriodData.buyerPurchaseRequests.reduce((sum, item) => sum + item.totalRequested, 0)
                )}
              </div>
            </div>

            {/* PART B: Buyer-Wise Collaboration Requests & PO Conversion */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Buyer Collaboration Requests & Proposals
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Approved, Declined, Proposals, and Converted POs ({timeHorizon})
                    </p>
                  </div>
                  <span className="badge badge-individual" style={{ textTransform: 'capitalize' }}>{timeHorizon}</span>
                </div>

                {renderGroupedBarChart(
                  currentPeriodData.buyerCollaborationRequests.slice(0, 7).map(item => ({
                    name: `${item.buyerName} (${item.conversionRatePercent}% PO Conv)`,
                    bars: [
                      { label: 'Approved', value: item.approvedCount, color: '#10b981' },
                      { label: 'Proposals', value: item.proposalsCount, color: '#3b82f6' },
                      { label: 'Converted to PO', value: item.convertedToPoCount, color: '#6366f1' },
                      { label: 'Declined', value: item.declinedCount, color: '#ef4444' },
                    ]
                  })),
                  'items'
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Collaboration Outcomes & PO Conversions
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Conversion rate of approved collaboration requests into actionable buyer POs
                  </p>
                </div>
                {renderDonutChart(
                  currentPeriodData.collabStatusDistribution,
                  'Collab Items',
                  currentPeriodData.buyerCollaborationRequests.reduce((sum, item) => sum + item.totalRequests, 0)
                )}
              </div>
            </div>

            {/* Detailed Table for PR & Collaboration */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Buyer Collaboration & Conversion Intelligence Table ({timeHorizon})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Buyer Partner</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>PR Approved</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>PR Declined</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>PR Acceptance Rate</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Collab Requests</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Collab Approved</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Proposals</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Converted to PO</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>PO Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeriodData.buyerCollaborationRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          No collaboration request data recorded for this time frame.
                        </td>
                      </tr>
                    ) : (
                      currentPeriodData.buyerCollaborationRequests.map((cItem, idx) => {
                        const prMatch = currentPeriodData.buyerPurchaseRequests.find(pr => pr.buyerId === cItem.buyerId);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {cItem.buyerName}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#10b981', fontWeight: 600 }}>
                              {prMatch ? prMatch.approvedCount : 0}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#ef4444' }}>
                              {prMatch ? prMatch.declinedCount : 0}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {prMatch ? `${prMatch.approvalRatePercent}%` : '0%'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{cItem.totalRequests}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#10b981' }}>{cItem.approvedCount}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#3b82f6' }}>{cItem.proposalsCount}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#6366f1', fontWeight: 700 }}>
                              {cItem.convertedToPoCount}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: cItem.conversionRatePercent >= 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: cItem.conversionRatePercent >= 50 ? '#10b981' : '#f59e0b',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                }}
                              >
                                {cItem.conversionRatePercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* SUB-SECTION 2: RECEIPTS                                            */}
        {/* ================================================================== */}
        {activeTab === 'receipts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Receipts KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  All Items Delivered (Pending = 0)
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                  {dashboardData?.receipts?.allDeliveredReceipts?.totalReceipts || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  Supplier Approved: {dashboardData?.receipts?.allDeliveredReceipts?.approvedCount || 0} ({dashboardData?.receipts?.allDeliveredReceipts?.approvalRatePercent || 0}%)
                </span>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Partial Delivery (Pending Qty &gt; 0)
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                  {dashboardData?.receipts?.pendingQuantityReceipts?.totalReceipts || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                  Pending Items: {dashboardData?.receipts?.pendingQuantityReceipts?.totalPendingQuantity || 0} units ({dashboardData?.receipts?.pendingQuantityReceipts?.approvalRatePercent || 0}% Approved)
                </span>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Receipts Received
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
                  {dashboardData?.summary?.totalReceipts || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Across all buyer partners
                </span>
              </div>
            </div>

            {/* PART A: "All Items Delivered" (Pending = 0) Bar & Pie Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Buyer Receipts vs Approved: "All Items Delivered" (Pending = 0)
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Buyer-wise receipts confirmed where full quantity delivered with zero pending items
                  </p>
                </div>
                {renderGroupedBarChart(
                  (dashboardData?.receipts?.allDeliveredReceipts?.buyerStats || []).slice(0, 7).map(item => ({
                    name: `${item.buyerName} (${item.approvalRatePercent}% Approved)`,
                    bars: [
                      { label: 'Total Receipts', value: item.totalReceipts, color: '#3b82f6' },
                      { label: 'Supplier Approved', value: item.approvedCount, color: '#10b981' },
                      { label: 'Pending Approval', value: item.pendingApprovalCount, color: '#f59e0b' },
                    ]
                  })),
                  'receipts'
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Approval Rate for "All Items Delivered"
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Supplier confirmation status breakdown when Pending Qty = 0
                  </p>
                </div>
                {renderDonutChart(
                  dashboardData?.receipts?.allDeliveredReceipts?.approvalDistribution || [],
                  'Full Delivered',
                  dashboardData?.receipts?.allDeliveredReceipts?.totalReceipts || 0
                )}
              </div>
            </div>

            {/* PART B: "Pending Quantity > 0" Bar & Pie Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Buyer Receipts vs Approved: Pending Quantity &gt; 0
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Buyer-wise receipts where partial quantities remain to be fulfilled by supplier
                  </p>
                </div>
                {renderGroupedBarChart(
                  (dashboardData?.receipts?.pendingQuantityReceipts?.buyerStats || []).slice(0, 7).map(item => ({
                    name: `${item.buyerName} (${item.pendingQuantity} pending units)`,
                    bars: [
                      { label: 'Total Receipts', value: item.totalReceipts, color: '#3b82f6' },
                      { label: 'Supplier Approved', value: item.approvedCount, color: '#10b981' },
                      { label: 'Pending Approval', value: item.pendingApprovalCount, color: '#ef4444' },
                    ]
                  })),
                  'receipts'
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Overall Receipt Delivery Breakdown
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Full deliveries (Pending = 0) vs Partial deliveries (Pending &gt; 0)
                  </p>
                </div>
                {renderDonutChart(
                  dashboardData?.receipts?.receiptDistribution || [],
                  'Total Receipts',
                  dashboardData?.summary?.totalReceipts || 0
                )}
              </div>
            </div>

            {/* Tabular Details for Receipts */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Buyer Receipts & Approval Audit Table
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Buyer Partner</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>All Delivered Receipts</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Approved (Pending=0)</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Pending Qty &gt; 0 Receipts</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Total Pending Quantity</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Approved (Pending&gt;0)</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Overall Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.receipts?.allDeliveredReceipts?.buyerStats || []).length === 0 &&
                      (dashboardData?.receipts?.pendingQuantityReceipts?.buyerStats || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          No receipt records found for this supplier.
                        </td>
                      </tr>
                    ) : (
                      (dashboardData?.receipts?.allDeliveredReceipts?.buyerStats || []).map((zeroItem, idx) => {
                        const partialMatch = dashboardData?.receipts?.pendingQuantityReceipts?.buyerStats.find(p => p.buyerId === zeroItem.buyerId);
                        const totalR = zeroItem.totalReceipts + (partialMatch ? partialMatch.totalReceipts : 0);
                        const totalApp = zeroItem.approvedCount + (partialMatch ? partialMatch.approvedCount : 0);
                        const overallPct = totalR > 0 ? Math.round((totalApp * 100.0 / totalR) * 10.0) / 10.0 : 0;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {zeroItem.buyerName}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{zeroItem.totalReceipts}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#10b981', fontWeight: 600 }}>
                              {zeroItem.approvedCount} ({zeroItem.approvalRatePercent}%)
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {partialMatch ? partialMatch.totalReceipts : 0}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#f59e0b', fontWeight: 600 }}>
                              {partialMatch ? `${partialMatch.pendingQuantity} units` : '0 units'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#10b981' }}>
                              {partialMatch ? `${partialMatch.approvedCount} (${partialMatch.approvalRatePercent}%)` : '0 (0%)'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: overallPct >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: overallPct >= 75 ? '#10b981' : '#f59e0b',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                }}
                              >
                                {overallPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================== */}
        {/* SUB-SECTION 3: INVOICE & PAYMENTS                                  */}
        {/* ================================================================== */}
        {activeTab === 'invoice-payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Financial KPI Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Purchase Orders</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
                  {dashboardData?.summary?.totalPos || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Value: {formatCurrency(dashboardData?.summary?.totalPoAmount)}
                </span>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Invoices Generated</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
                  {dashboardData?.summary?.totalInvoices || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Invoiced Value: {formatCurrency(dashboardData?.summary?.totalInvoicedAmount)}
                </span>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Payments Settled</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                  {formatCurrency(dashboardData?.summary?.totalPaidAmount)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  {dashboardData?.summary?.totalPaymentsReceived || 0} Payment Receipts Disbursed
                </span>
              </div>
            </div>

            {/* Part A: PO vs Invoices Created (Bar & Pie Charts) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Buyer Purchase Orders vs Invoices Created
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Buyer-wise assigned PO count vs invoices generated by supplier
                  </p>
                </div>
                {renderGroupedBarChart(
                  (dashboardData?.invoiceAndPayments?.buyerPoVsInvoices || []).slice(0, 7).map(item => ({
                    name: `${item.buyerName} (${item.invoicingRatePercent}% Invoiced)`,
                    bars: [
                      { label: 'Assigned POs', value: item.poCount, color: '#3b82f6' },
                      { label: 'Invoices Created', value: item.invoicesCreatedCount, color: '#8b5cf6' },
                    ]
                  })),
                  'items'
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    PO Invoicing Ratio
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Proportion of POs billed via invoices vs pending billing
                  </p>
                </div>
                {renderDonutChart(
                  dashboardData?.invoiceAndPayments?.poInvoicingDistribution || [],
                  'Total POs',
                  dashboardData?.summary?.totalPos || 0
                )}
              </div>
            </div>

            {/* Part B: Invoice vs Payments Received (Bar & Pie Charts) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Buyer Invoiced Value vs Payment Received
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Comparison of billed amounts against collected payments per buyer partner
                  </p>
                </div>
                {renderAmountBarChart(
                  (dashboardData?.invoiceAndPayments?.buyerInvoiceVsPayments || []).slice(0, 7).map(item => ({
                    name: `${item.buyerName} (${item.paymentSettlementRatePercent}% Settled)`,
                    bars: [
                      { label: 'Total Invoiced', value: item.invoicesTotalAmount, color: '#8b5cf6' },
                      { label: 'Payment Received', value: item.paymentsReceivedAmount, color: '#10b981' },
                    ]
                  }))
                )}
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Payment Settlement Ratio
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Proportion of billed invoices disbursed as paid vs outstanding balance due
                  </p>
                </div>
                {renderDonutChart(
                  dashboardData?.invoiceAndPayments?.paymentStatusDistribution || [],
                  'Settled %',
                  `${dashboardData?.summary?.totalInvoicedAmount && dashboardData.summary.totalInvoicedAmount > 0 ? Math.round(((dashboardData.summary.totalPaidAmount || 0) / dashboardData.summary.totalInvoicedAmount) * 100) : 0}%`
                )}
              </div>
            </div>

            {/* Detailed Table for POs, Invoices, and Payments */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                PO, Invoice & Payment Settlement Ledger
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Buyer Partner</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Assigned POs</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Total PO Value</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Invoices Created</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Invoiced Value</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Payments Received</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Paid Amount</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Outstanding Due</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Settlement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.invoiceAndPayments?.buyerPoVsInvoices || []).length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          No purchase orders or invoice records found for this supplier.
                        </td>
                      </tr>
                    ) : (
                      (dashboardData?.invoiceAndPayments?.buyerPoVsInvoices || []).map((poItem, idx) => {
                        const payMatch = dashboardData?.invoiceAndPayments?.buyerInvoiceVsPayments.find(p => p.buyerId === poItem.buyerId);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,200,0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {poItem.buyerName}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{poItem.poCount}</td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{formatCurrency(poItem.poTotalAmount)}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#8b5cf6', fontWeight: 600 }}>{poItem.invoicesCreatedCount}</td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{formatCurrency(poItem.invoicesTotalAmount)}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{payMatch ? payMatch.paymentsReceivedCount : 0}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#10b981', fontWeight: 700 }}>
                              {formatCurrency(payMatch ? payMatch.paymentsReceivedAmount : 0)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#ef4444' }}>
                              {formatCurrency(payMatch ? payMatch.dueAmount : 0)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: (payMatch?.paymentSettlementRatePercent || 0) >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: (payMatch?.paymentSettlementRatePercent || 0) >= 75 ? '#10b981' : '#f59e0b',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                }}
                              >
                                {payMatch ? `${payMatch.paymentSettlementRatePercent}%` : '0%'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
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

export default SupplierDashboard;
