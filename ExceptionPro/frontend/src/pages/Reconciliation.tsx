import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface ReconciliationRecord {
  id: string;
  reconciliationNumber: string;
  reconciliationDate: string;
  requestType: 'STANDARD' | 'COLLABORATION';
  poNumber: string;
  orderTitle: string;
  supplierId?: string;
  supplierName: string;
  supplierEmail: string;
  buyerId?: string;
  buyerName: string;
  receiptGrnNumber: string;
  invoiceNumber: string;
  currency: string;
  status: string;

  // 1. Quantity
  poQuantity: number;
  receiptQuantity: number;
  invoiceQuantity: number;
  poVsReceiptQtyVariance: number;
  receiptVsInvoiceQtyVariance: number;
  poVsInvoiceQtyVariance: number;
  quantityMatchStatus: string;
  quantityMatch: string;

  // 2. Price
  poUnitPrice: number;
  invoiceUnitPrice: number;
  priceVariance: number;
  priceVariancePercentage: number;
  priceMatchStatus: string;
  priceMatch: string;

  // 3. Amount
  poAmount: number;
  receiptAmount: number;
  invoiceAmount: number;
  poVsReceiptAmtVariance: number;
  receiptVsInvoiceAmtVariance: number;
  poVsInvoiceAmtVariance: number;
  amountMatchStatus: string;
  amountMatch: string;

  // 4. Result & Remarks
  overallResult: string;
  remarks?: string;
}

const Reconciliation: React.FC = () => {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Editable Form State matching exact sections
  const [reconciliationNumber, setReconciliationNumber] = useState<string>('REC-2026-0001');
  const [reconciliationDate, setReconciliationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState<string>('ABC Supplies Pvt Ltd');
  const [poNumber, setPoNumber] = useState<string>('PO01');
  const [receiptGrnNumber, setReceiptGrnNumber] = useState<string>('REC-001');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-2026-101');
  const [currency, setCurrency] = useState<string>('INR');
  const [status, setStatus] = useState<string>('EXCEPTION');

  // ii) Quantity Reconciliation
  const [poQuantity, setPoQuantity] = useState<number>(100);
  const [receiptQuantity, setReceiptQuantity] = useState<number>(95);
  const [invoiceQuantity, setInvoiceQuantity] = useState<number>(95);
  const [poVsReceiptQtyVariance, setPoVsReceiptQtyVariance] = useState<number>(-5);
  const [receiptVsInvoiceQtyVariance, setReceiptVsInvoiceQtyVariance] = useState<number>(0);
  const [poVsInvoiceQtyVariance, setPoVsInvoiceQtyVariance] = useState<number>(-5);
  const [quantityMatchStatus, setQuantityMatchStatus] = useState<string>('PARTIAL');

  // iii) Price Reconciliation
  const [poUnitPrice, setPoUnitPrice] = useState<number>(1000);
  const [invoiceUnitPrice, setInvoiceUnitPrice] = useState<number>(1050);
  const [priceVariance, setPriceVariance] = useState<number>(50);
  const [priceVariancePercentage, setPriceVariancePercentage] = useState<number>(5.0);
  const [priceMatchStatus, setPriceMatchStatus] = useState<string>('MISMATCH');

  // iv) Amount Reconciliation
  const [poAmount, setPoAmount] = useState<number>(100000);
  const [receiptAmount, setReceiptAmount] = useState<number>(95000);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(95000);
  const [poVsReceiptAmtVariance, setPoVsReceiptAmtVariance] = useState<number>(-5000);
  const [receiptVsInvoiceAmtVariance, setReceiptVsInvoiceAmtVariance] = useState<number>(0);
  const [poVsInvoiceAmtVariance, setPoVsInvoiceAmtVariance] = useState<number>(-5000);
  const [amountMatchStatus, setAmountMatchStatus] = useState<string>('PARTIAL');

  // v) Reconciliation Result
  const [quantityMatch, setQuantityMatch] = useState<string>('PARTIAL');
  const [priceMatch, setPriceMatch] = useState<string>('MISMATCH');
  const [amountMatch, setAmountMatch] = useState<string>('PARTIAL');
  const [overallResult, setOverallResult] = useState<string>('EXCEPTION');
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    fetchReconciliationData();
  }, []);

  const fetchReconciliationData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/reconciliation');
      if (res.data && res.data.records) {
        setRecords(res.data.records);
        if (res.data.records.length > 0) {
          const first = res.data.records[0];
          populateFormWithRecord(first);
          setSelectedRecordId(first.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch reconciliation data:', err);
      setError(err.response?.data?.message || 'Failed to load reconciliation data.');
    } finally {
      setLoading(false);
    }
  };

  const populateFormWithRecord = (rec: ReconciliationRecord) => {
    setReconciliationNumber(rec.reconciliationNumber || `REC-${new Date().getFullYear()}-0001`);
    setReconciliationDate(rec.reconciliationDate || new Date().toISOString().split('T')[0]);
    setSupplier(rec.supplierName || 'Supplier');
    setPoNumber(rec.poNumber || 'PO01');
    setReceiptGrnNumber(rec.receiptGrnNumber || 'N/A');
    setInvoiceNumber(rec.invoiceNumber || 'N/A');
    setCurrency(rec.currency || 'INR');
    setStatus(rec.status || rec.overallResult || 'EXCEPTION');

    // ii) Quantity
    setPoQuantity(rec.poQuantity || 0);
    setReceiptQuantity(rec.receiptQuantity || 0);
    setInvoiceQuantity(rec.invoiceQuantity || 0);
    setPoVsReceiptQtyVariance(rec.poVsReceiptQtyVariance || 0);
    setReceiptVsInvoiceQtyVariance(rec.receiptVsInvoiceQtyVariance || 0);
    setPoVsInvoiceQtyVariance(rec.poVsInvoiceQtyVariance || 0);
    setQuantityMatchStatus(rec.quantityMatchStatus || 'PARTIAL');
    setQuantityMatch(rec.quantityMatch || rec.quantityMatchStatus || 'PARTIAL');

    // iii) Price
    setPoUnitPrice(rec.poUnitPrice || 0);
    setInvoiceUnitPrice(rec.invoiceUnitPrice || 0);
    setPriceVariance(rec.priceVariance || 0);
    setPriceVariancePercentage(rec.priceVariancePercentage || 0);
    setPriceMatchStatus(rec.priceMatchStatus || 'MISMATCH');
    setPriceMatch(rec.priceMatch || rec.priceMatchStatus || 'MISMATCH');

    // iv) Amount
    setPoAmount(rec.poAmount || 0);
    setReceiptAmount(rec.receiptAmount || 0);
    setInvoiceAmount(rec.invoiceAmount || 0);
    setPoVsReceiptAmtVariance(rec.poVsReceiptAmtVariance || 0);
    setReceiptVsInvoiceAmtVariance(rec.receiptVsInvoiceAmtVariance || 0);
    setPoVsInvoiceAmtVariance(rec.poVsInvoiceAmtVariance || 0);
    setAmountMatchStatus(rec.amountMatchStatus || 'PARTIAL');
    setAmountMatch(rec.amountMatch || rec.amountMatchStatus || 'PARTIAL');

    // v) Result & Remarks
    setOverallResult(rec.overallResult || 'EXCEPTION');
    setRemarks(rec.remarks || '');
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    const rec = records.find((r) => r.id === recordId);
    if (rec) {
      populateFormWithRecord(rec);
      setSuccess('');
      setError('');
    }
  };

  // Live Reconcile Calculation
  const handleReconcile = () => {
    // ii) Quantity Reconciliation
    const poVsRecQty = receiptQuantity - poQuantity;
    const recVsInvQty = invoiceQuantity - receiptQuantity;
    const poVsInvQty = invoiceQuantity - poQuantity;

    setPoVsReceiptQtyVariance(poVsRecQty);
    setReceiptVsInvoiceQtyVariance(recVsInvQty);
    setPoVsInvoiceQtyVariance(poVsInvQty);

    let qStatus = 'PARTIAL';
    if (poQuantity === receiptQuantity && receiptQuantity === invoiceQuantity && poQuantity > 0) {
      qStatus = 'MATCHED';
    } else if (poQuantity === 0 && receiptQuantity === 0 && invoiceQuantity === 0) {
      qStatus = 'MISMATCH';
    } else if (poQuantity === receiptQuantity && receiptQuantity !== invoiceQuantity) {
      qStatus = 'PARTIAL';
    } else if (receiptQuantity === invoiceQuantity && poQuantity !== receiptQuantity) {
      qStatus = 'PARTIAL';
    } else {
      qStatus = 'MISMATCH';
    }
    setQuantityMatchStatus(qStatus);
    setQuantityMatch(qStatus);

    // iii) Price Reconciliation
    const pVar = Number((invoiceUnitPrice - poUnitPrice).toFixed(2));
    let pVarPct = 0;
    if (poUnitPrice > 0) {
      pVarPct = Number(((pVar / poUnitPrice) * 100).toFixed(2));
    }

    setPriceVariance(pVar);
    setPriceVariancePercentage(pVarPct);

    const pStatus = (poUnitPrice === invoiceUnitPrice && poUnitPrice > 0) ? 'MATCHED' : 'MISMATCH';
    setPriceMatchStatus(pStatus);
    setPriceMatch(pStatus);

    // iv) Amount Reconciliation
    const poVsRecAmt = Number((receiptAmount - poAmount).toFixed(2));
    const recVsInvAmt = Number((invoiceAmount - receiptAmount).toFixed(2));
    const poVsInvAmt = Number((invoiceAmount - poAmount).toFixed(2));

    setPoVsReceiptAmtVariance(poVsRecAmt);
    setReceiptVsInvoiceAmtVariance(recVsInvAmt);
    setPoVsInvoiceAmtVariance(poVsInvAmt);

    let aStatus = 'PARTIAL';
    if (poAmount === receiptAmount && receiptAmount === invoiceAmount && poAmount > 0) {
      aStatus = 'MATCHED';
    } else if (poAmount === 0 && receiptAmount === 0 && invoiceAmount === 0) {
      aStatus = 'MISMATCH';
    } else if (receiptAmount > 0 || invoiceAmount > 0) {
      aStatus = 'PARTIAL';
    } else {
      aStatus = 'MISMATCH';
    }
    setAmountMatchStatus(aStatus);
    setAmountMatch(aStatus);

    // v) Overall Result
    let overall = 'EXCEPTION';
    if (qStatus === 'MATCHED' && pStatus === 'MATCHED' && aStatus === 'MATCHED') {
      overall = 'MATCHED';
    } else {
      overall = 'EXCEPTION';
    }

    setOverallResult(overall);
    setStatus(overall);

    setSuccess('Reconciliation values and variances recalculated successfully!');
    setError('');
  };

  // Save Reconciliation to backend
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const currentRec = records.find((r) => r.id === selectedRecordId);

    const payload = {
      reconciliationNumber,
      reconciliationDate,
      requisitionId: currentRec?.id || null,
      supplierId: currentRec?.supplierId || null,
      poNumber,
      receiptGrnNumber,
      invoiceNumber,
      currency,
      status: overallResult,

      // ii) Quantity
      poQuantity,
      receiptQuantity,
      invoiceQuantity,
      poVsReceiptQtyVariance,
      receiptVsInvoiceQtyVariance,
      poVsInvoiceQtyVariance,
      quantityMatchStatus,

      // iii) Price
      poUnitPrice,
      invoiceUnitPrice,
      priceVariance,
      priceVariancePercentage,
      priceMatchStatus,

      // iv) Amount
      poAmount,
      receiptAmount,
      invoiceAmount,
      poVsReceiptAmtVariance,
      receiptVsInvoiceAmtVariance,
      poVsInvoiceAmtVariance,
      amountMatchStatus,

      // v) Result & Remarks
      overallResult,
      remarks
    };

    try {
      const res = await api.post('/api/reconciliation/save', payload);
      setSuccess(`Reconciliation #${reconciliationNumber} saved successfully!`);
      if (res.data) {
        setRecords((prev) => {
          const idx = prev.findIndex((r) => r.id === selectedRecordId || r.reconciliationNumber === reconciliationNumber);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...res.data };
            return updated;
          }
          return [res.data, ...prev];
        });
      }
    } catch (err: any) {
      console.error('Failed to save reconciliation:', err);
      setError(err.response?.data?.message || 'Failed to save reconciliation.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel / Reset
  const handleCancel = () => {
    if (selectedRecordId) {
      const rec = records.find((r) => r.id === selectedRecordId);
      if (rec) {
        populateFormWithRecord(rec);
      }
    } else if (records.length > 0) {
      populateFormWithRecord(records[0]);
    }
    setError('');
    setSuccess('Reconciliation changes reverted to saved state.');
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '₹';
    }
  };

  const currSym = getCurrencySymbol(currency);

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'MATCHED':
        return '#10b981';
      case 'PARTIAL':
        return '#f59e0b';
      case 'MISMATCH':
      case 'EXCEPTION':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem', minHeight: '100vh', width: '100%' }}>
      {/* Left Navigation */}
      <LeftNavigation activePage="reconciliation" />

      {/* Main Container (Stacked Vertically: First Section on Top, Second Section Directly Below) */}
      <main className="reconciliation-page-container" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', padding: 0 }}>

        {/* ==================================================== */}
        {/* a) FIRST SECTION: Top Controls (Vertical Approach)   */}
        {/* ==================================================== */}
        <div className="reconciliation-top-bar">
          {/* Dropdowns Row: Select Order to Reconcile & Currency in Same Row */}
          <div className="reconciliation-top-row">
            {/* 1. Select Order to Reconcile */}
            <div className="reconciliation-field-group order-select-group">
              <label className="reconciliation-field-label">
                Select Order to Reconcile:
              </label>
              <select
                value={selectedRecordId}
                onChange={(e) => handleSelectRecord(e.target.value)}
                className="form-control"
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  borderColor: '#cbd5e1',
                  width: '100%',
                  background: '#ffffff'
                }}
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.poNumber} - {r.orderTitle} ({r.supplierName})
                  </option>
                ))}
                {records.length === 0 && <option value="">No Purchase Orders Available</option>}
              </select>
            </div>

            {/* 2. Currency */}
            <div className="reconciliation-field-group currency-select-group">
              <label className="reconciliation-field-label">
                Currency:
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="form-control"
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  borderColor: '#cbd5e1',
                  width: '100%',
                  background: '#ffffff'
                }}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* 3. Refresh Button */}
          <div className="reconciliation-field-row" style={{ marginTop: '0.25rem', alignItems: 'center' }}>
            <button
              onClick={fetchReconciliationData}
              className="btn btn-secondary reconciliation-refresh-btn"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                width: '100%',
                maxWidth: '240px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                margin: '0 auto'
              }}
              title="Refresh Reconciliation Data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* b) SECOND SECTION: Main Reconciliation Details Sheet */}
        {/* ==================================================== */}
        <div className="reconciliation-main-sheet">
          {/* Notifications */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
              <span>{success}</span>
              <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#065f46' }}>×</button>
            </div>
          )}

          {/* Loading Spinner */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p>Loading Reconciliation Data...</p>
            </div>
          ) : (
            <>
              {/* ---------------------------------------------------- */}
              {/* i) Reconciliation Details                            */}
              {/* ---------------------------------------------------- */}
              <div className="reconciliation-sub-section">
                <div className="reconciliation-sub-header">
                  <h3 className="reconciliation-sub-title">
                    Reconciliation Details
                  </h3>
                  <span
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontWeight: 800,
                      textAlign: 'center',
                      background: getStatusColor(status),
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    Status: {status}
                  </span>
                </div>

                {/* Header Details Grid */}
                <div className="reconciliation-details-grid">
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Reconciliation Number
                    </label>
                    <input
                      type="text"
                      value={reconciliationNumber}
                      onChange={(e) => setReconciliationNumber(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 700, color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Reconciliation Date
                    </label>
                    <input
                      type="date"
                      value={reconciliationDate}
                      onChange={(e) => setReconciliationDate(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      PO Number
                    </label>
                    <input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 700, color: '#2563eb' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Receipt / GRN Number
                    </label>
                    <input
                      type="text"
                      value={receiptGrnNumber}
                      onChange={(e) => setReceiptGrnNumber(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600, color: '#10b981' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600, color: '#8b5cf6' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Currency
                    </label>
                    <input
                      type="text"
                      value={currency}
                      readOnly
                      className="form-control"
                      style={{ fontWeight: 700, background: '#f1f5f9' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Status
                    </label>
                    <span
                      style={{
                        display: 'block',
                        padding: '0.55rem 1rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: getStatusColor(status),
                        color: '#ffffff',
                        fontSize: '0.9rem'
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* ii) QUANTITY RECONCILIATION                          */}
              {/* ---------------------------------------------------- */}
              <div className="reconciliation-sub-section">
                <div className="reconciliation-sub-header">
                  <h3 className="reconciliation-sub-title">
                    Quantity Reconciliation
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getStatusColor(quantityMatchStatus) }}>
                    Quantity Match Status: <strong>{quantityMatchStatus}</strong>
                  </span>
                </div>

                {/* 3 Quantity Inputs Row */}
                <div className="reconciliation-cards-grid grid-3">
                  <div className="reconciliation-input-box po">
                    <label className="reconciliation-box-label label-po">
                      PO Quantity
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <input
                        type="number"
                        value={poQuantity}
                        onChange={(e) => setPoQuantity(Number(e.target.value))}
                        className="form-control reconciliation-input text-po"
                      />
                    </div>
                  </div>

                  <div className="reconciliation-input-box receipt">
                    <label className="reconciliation-box-label label-receipt">
                      Receipt Quantity
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <input
                        type="number"
                        value={receiptQuantity}
                        onChange={(e) => setReceiptQuantity(Number(e.target.value))}
                        className="form-control reconciliation-input text-receipt"
                      />
                    </div>
                  </div>

                  <div className="reconciliation-input-box invoice">
                    <label className="reconciliation-box-label label-invoice">
                      Invoice Quantity
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <input
                        type="number"
                        value={invoiceQuantity}
                        onChange={(e) => setInvoiceQuantity(Number(e.target.value))}
                        className="form-control reconciliation-input text-invoice"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity Variances Table */}
                <div className="reconciliation-variance-panel">
                  <div className="reconciliation-variance-grid grid-3">
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">PO vs Receipt Variance:</span>
                      <strong className="variance-val" style={{ color: poVsReceiptQtyVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {poVsReceiptQtyVariance > 0 ? `+${poVsReceiptQtyVariance}` : poVsReceiptQtyVariance}
                      </strong>
                    </div>
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">Receipt vs Invoice Variance:</span>
                      <strong className="variance-val" style={{ color: receiptVsInvoiceQtyVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {receiptVsInvoiceQtyVariance > 0 ? `+${receiptVsInvoiceQtyVariance}` : receiptVsInvoiceQtyVariance}
                      </strong>
                    </div>
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">PO vs Invoice Variance:</span>
                      <strong className="variance-val" style={{ color: poVsInvoiceQtyVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {poVsInvoiceQtyVariance > 0 ? `+${poVsInvoiceQtyVariance}` : poVsInvoiceQtyVariance}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* iii) PRICE RECONCILIATION                            */}
              {/* ---------------------------------------------------- */}
              <div className="reconciliation-sub-section">
                <div className="reconciliation-sub-header">
                  <h3 className="reconciliation-sub-title">
                    Price Reconciliation
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getStatusColor(priceMatchStatus) }}>
                    Price Match Status: <strong>{priceMatchStatus}</strong>
                  </span>
                </div>

                {/* 2 Price Inputs Row */}
                <div className="reconciliation-cards-grid grid-2">
                  <div className="reconciliation-input-box po">
                    <label className="reconciliation-box-label label-po">
                      PO Unit Price
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <span className="reconciliation-curr-symbol text-po">
                        {currSym}
                      </span>
                      <input
                        type="number"
                        value={poUnitPrice}
                        onChange={(e) => setPoUnitPrice(Number(e.target.value))}
                        className="form-control reconciliation-input text-po has-currency"
                      />
                    </div>
                  </div>

                  <div className="reconciliation-input-box invoice">
                    <label className="reconciliation-box-label label-invoice">
                      Invoice Unit Price
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <span className="reconciliation-curr-symbol text-invoice">
                        {currSym}
                      </span>
                      <input
                        type="number"
                        value={invoiceUnitPrice}
                        onChange={(e) => setInvoiceUnitPrice(Number(e.target.value))}
                        className="form-control reconciliation-input text-invoice has-currency"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Variances Table */}
                <div className="reconciliation-variance-panel">
                  <div className="reconciliation-variance-grid grid-2">
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">Price Variance:</span>
                      <strong className="variance-val" style={{ color: priceVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {currSym}{priceVariance > 0 ? `+${priceVariance}` : priceVariance}
                      </strong>
                    </div>
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">Price Variance %:</span>
                      <strong className="variance-val" style={{ color: priceVariancePercentage === 0 ? '#10b981' : '#ef4444' }}>
                        {priceVariancePercentage > 0 ? `+${priceVariancePercentage}` : priceVariancePercentage}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* iv) AMOUNT RECONCILIATION                            */}
              {/* ---------------------------------------------------- */}
              <div className="reconciliation-sub-section">
                <div className="reconciliation-sub-header">
                  <h3 className="reconciliation-sub-title">
                    Amount Reconciliation
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getStatusColor(amountMatchStatus) }}>
                    Amount Match Status: <strong>{amountMatchStatus}</strong>
                  </span>
                </div>

                {/* 3 Amount Inputs Row */}
                <div className="reconciliation-cards-grid grid-3">
                  <div className="reconciliation-input-box po">
                    <label className="reconciliation-box-label label-po">
                      PO Amount
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <span className="reconciliation-curr-symbol text-po">
                        {currSym}
                      </span>
                      <input
                        type="number"
                        value={poAmount}
                        onChange={(e) => setPoAmount(Number(e.target.value))}
                        className="form-control reconciliation-input text-po has-currency"
                      />
                    </div>
                  </div>

                  <div className="reconciliation-input-box receipt">
                    <label className="reconciliation-box-label label-receipt">
                      Receipt Amount
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <span className="reconciliation-curr-symbol text-receipt">
                        {currSym}
                      </span>
                      <input
                        type="number"
                        value={receiptAmount}
                        onChange={(e) => setReceiptAmount(Number(e.target.value))}
                        className="form-control reconciliation-input text-receipt has-currency"
                      />
                    </div>
                  </div>

                  <div className="reconciliation-input-box invoice">
                    <label className="reconciliation-box-label label-invoice">
                      Invoice Amount
                    </label>
                    <div className="reconciliation-input-wrapper">
                      <span className="reconciliation-curr-symbol text-invoice">
                        {currSym}
                      </span>
                      <input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                        className="form-control reconciliation-input text-invoice has-currency"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Variances Table */}
                <div className="reconciliation-variance-panel">
                  <div className="reconciliation-variance-grid grid-3">
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">PO vs Receipt Variance:</span>
                      <strong className="variance-val" style={{ color: poVsReceiptAmtVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {currSym}{poVsReceiptAmtVariance > 0 ? `+${poVsReceiptAmtVariance}` : poVsReceiptAmtVariance}
                      </strong>
                    </div>
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">Receipt vs Invoice Variance:</span>
                      <strong className="variance-val" style={{ color: receiptVsInvoiceAmtVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {currSym}{receiptVsInvoiceAmtVariance > 0 ? `+${receiptVsInvoiceAmtVariance}` : receiptVsInvoiceAmtVariance}
                      </strong>
                    </div>
                    <div className="reconciliation-variance-item">
                      <span className="variance-label">PO vs Invoice Variance:</span>
                      <strong className="variance-val" style={{ color: poVsInvoiceAmtVariance === 0 ? '#10b981' : '#ef4444' }}>
                        {currSym}{poVsInvoiceAmtVariance > 0 ? `+${poVsInvoiceAmtVariance}` : poVsInvoiceAmtVariance}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* v) RECONCILIATION RESULT                             */}
              {/* ---------------------------------------------------- */}
              <div className="reconciliation-sub-section" style={{ marginBottom: 0 }}>
                <div className="reconciliation-sub-header">
                  <h3 className="reconciliation-sub-title">
                    Reconciliation Result
                  </h3>
                </div>

                {/* Results Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="reconciliation-result-card">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quantity Match</span>
                    <span style={{ fontWeight: 800, color: getStatusColor(quantityMatch) }}>{quantityMatch}</span>
                  </div>

                  <div className="reconciliation-result-card">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Price Match</span>
                    <span style={{ fontWeight: 800, color: getStatusColor(priceMatch) }}>{priceMatch}</span>
                  </div>

                  <div className="reconciliation-result-card">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Amount Match</span>
                    <span style={{ fontWeight: 800, color: getStatusColor(amountMatch) }}>{amountMatch}</span>
                  </div>

                  <div style={{ background: getStatusColor(overallResult), color: '#ffffff', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Overall Result</span>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{overallResult}</span>
                  </div>
                </div>

                {/* Remarks Textarea */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                    Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reconciliation notes, discrepancy resolutions, or exception remarks..."
                    className="form-control"
                    style={{ width: '100%', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Action Buttons: [Reconcile]  [Save]  [Cancel] */}
                <div className="reconciliation-btn-group">
                  <button
                    onClick={handleReconcile}
                    className="btn btn-primary reconciliation-action-btn"
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: '1 1 0px',
                      minWidth: '120px',
                      maxWidth: '200px'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Reconcile
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary reconciliation-action-btn"
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: '1 1 0px',
                      minWidth: '120px',
                      maxWidth: '200px'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    {saving ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary reconciliation-action-btn"
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: '1 1 0px',
                      minWidth: '120px',
                      maxWidth: '200px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reconciliation;
