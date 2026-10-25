import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface EligibleRequest {
  id: string;
  requestType: 'STANDARD' | 'COLLABORATION';
  code: string;
  title: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  currencyType?: string;
  itemCount: number;
  needByDate: string;
}

interface InvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  currencyType?: string;
  unitMeasure?: string;
  totalPrice?: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  requestType: 'STANDARD' | 'COLLABORATION';
  requisitionId?: string;
  collaborationRequisitionId?: string;
  requestTitle: string;
  requestCode: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  supplierAddress?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  poAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  currencyType?: string;
  notes?: string;
  status: string;
  createdAt: string;
  items?: InvoiceItem[];
}

const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const accountTypeRaw = (user?.accountType || '').toLowerCase().trim();
  const isSupplier = accountTypeRaw.includes('supplier') || accountTypeRaw === '' || user?.role === 'ROLE_ADMIN';

  const [eligibleRequests, setEligibleRequests] = useState<EligibleRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form State (Create)
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [poAmount, setPoAmount] = useState<number | ''>(0);
  const [currencyType, setCurrencyType] = useState<string>('');
  const [taxPercentage, setTaxPercentage] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal State (View & Edit)
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceData | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState<string>('');
  const [editInvoiceDate, setEditInvoiceDate] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editPoAmount, setEditPoAmount] = useState<number | ''>(0);
  const [editCurrencyType, setEditCurrencyType] = useState<string>('');
  const [editTaxPercentage, setEditTaxPercentage] = useState<string>('');
  const [editTaxAmount, setEditTaxAmount] = useState<number>(0);
  const [editTotalInvoiceAmount, setEditTotalInvoiceAmount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isSupplier) {
      fetchEligibleRequests();
    }
    fetchInvoices();
  }, [isSupplier]);

  const fetchEligibleRequests = async () => {
    try {
      const res = await api.get('/api/invoices/eligible-requests');
      setEligibleRequests(res.data);
    } catch (err: any) {
      console.error('Failed to fetch eligible requests for invoicing', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const endpoint = isSupplier ? '/api/invoices' : '/api/invoices/buyer';
      const res = await api.get(endpoint);
      setInvoices(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxAmount = (base: number | '', taxPctStr: string): number => {
    const numericBase = typeof base === 'number' ? base : parseFloat(String(base));
    if (isNaN(numericBase) || numericBase < 0) return 0;
    const cleanTax = (taxPctStr || '').replace(/[^0-9.]/g, '');
    const numericTax = parseFloat(cleanTax);
    if (isNaN(numericTax) || numericTax <= 0) {
      return 0;
    }
    const calculated = (numericBase * numericTax) / 100;
    return Number(calculated.toFixed(2));
  };

  const calculateTotalInvoiceAmount = (base: number | '', taxPctStr: string): number => {
    const numericBase = typeof base === 'number' ? base : parseFloat(String(base));
    if (isNaN(numericBase) || numericBase < 0) return 0;
    const taxAmt = calculateTaxAmount(base, taxPctStr);
    return Number((numericBase + taxAmt).toFixed(2));
  };

  const handlePoAmountChange = (val: number | '') => {
    setPoAmount(val);
    setTaxAmount(calculateTaxAmount(val, taxPercentage));
    setTotalInvoiceAmount(calculateTotalInvoiceAmount(val, taxPercentage));
  };

  const handleTaxPercentageChange = (val: string) => {
    setTaxPercentage(val);
    setTaxAmount(calculateTaxAmount(poAmount, val));
    setTotalInvoiceAmount(calculateTotalInvoiceAmount(poAmount, val));
  };

  const handleEditPoAmountChange = (val: number | '') => {
    setEditPoAmount(val);
    setEditTaxAmount(calculateTaxAmount(val, editTaxPercentage));
    setEditTotalInvoiceAmount(calculateTotalInvoiceAmount(val, editTaxPercentage));
  };

  const handleEditTaxPercentageChange = (val: string) => {
    setEditTaxPercentage(val);
    setEditTaxAmount(calculateTaxAmount(editPoAmount, val));
    setEditTotalInvoiceAmount(calculateTotalInvoiceAmount(editPoAmount, val));
  };

  const generateDefaultInvoiceNumber = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `INV-${new Date().getFullYear()}-${randomNum}`;
  };

  const handleSelectRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    if (!reqId) {
      setPoAmount(0);
      setCurrencyType('');
      setTaxPercentage('');
      setTaxAmount(0);
      setTotalInvoiceAmount(0);
      return;
    }

    const req = eligibleRequests.find((r) => r.id === reqId);
    if (req) {
      const baseAmt = req.totalAmount !== undefined ? req.totalAmount : 0;
      setPoAmount(baseAmt);
      setCurrencyType(req.currencyType || 'USD');
      setTaxAmount(calculateTaxAmount(baseAmt, taxPercentage));
      setTotalInvoiceAmount(calculateTotalInvoiceAmount(baseAmt, taxPercentage));
      if (!invoiceNumber) {
        setInvoiceNumber(generateDefaultInvoiceNumber());
      }
      const today = new Date().toISOString().split('T')[0];
      if (!invoiceDate) {
        setInvoiceDate(today);
      }
      if (!dueDate) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        setDueDate(nextMonth.toISOString().split('T')[0]);
      }
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedRequestId) {
      setError('Please select an Accepted Purchase Request or Collaboration Request.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice Number is required.');
      return;
    }
    if (!invoiceDate) {
      setError('Invoice Date is required.');
      return;
    }
    if (!dueDate) {
      setError('Due Date is required.');
      return;
    }
    if (poAmount === '' || isNaN(Number(poAmount)) || Number(poAmount) < 0) {
      setError('PO Amount is required and must be non-negative.');
      return;
    }
    if (!currencyType.trim()) {
      setError('Currency Type is required.');
      return;
    }

    const req = eligibleRequests.find((r) => r.id === selectedRequestId);
    if (!req) {
      setError('Selected request not found.');
      return;
    }

    const numericTax = parseFloat((taxPercentage || '').replace(/[^0-9.]/g, '')) || 0;
    const calcTaxAmt = calculateTaxAmount(poAmount, taxPercentage);
    const finalTotal = calculateTotalInvoiceAmount(poAmount, taxPercentage);

    setSubmitting(true);
    try {
      const payload = {
        requestType: req.requestType,
        requisitionId: req.requestType === 'STANDARD' ? req.id : undefined,
        collaborationRequisitionId: req.requestType === 'COLLABORATION' ? req.id : undefined,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        poAmount: Number(poAmount),
        taxPercentage: numericTax,
        taxAmount: calcTaxAmt,
        totalAmount: finalTotal,
        currencyType: currencyType.trim(),
        notes,
      };

      await api.post('/api/invoices', payload);
      setSuccess(`Invoice '${invoiceNumber.trim()}' created successfully!`);

      // Reset form
      setSelectedRequestId('');
      setInvoiceNumber('');
      setInvoiceDate('');
      setDueDate('');
      setPoAmount(0);
      setCurrencyType('');
      setTaxPercentage('');
      setTaxAmount(0);
      setTotalInvoiceAmount(0);
      setNotes('');

      fetchInvoices();
      fetchEligibleRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (inv: InvoiceData) => {
    setEditingInvoice(inv);
    setEditInvoiceNumber(inv.invoiceNumber);
    setEditInvoiceDate(inv.invoiceDate);
    setEditDueDate(inv.dueDate);
    const basePo = inv.poAmount !== undefined ? inv.poAmount : inv.totalAmount;
    const taxPct = inv.taxPercentage !== undefined && inv.taxPercentage !== null ? String(inv.taxPercentage) : '';
    setEditPoAmount(basePo);
    setEditCurrencyType(inv.currencyType || 'USD');
    setEditTaxPercentage(taxPct === '0' ? '' : taxPct);
    const calculatedTax = inv.taxAmount !== undefined && inv.taxAmount !== null
      ? inv.taxAmount
      : calculateTaxAmount(basePo, taxPct);
    setEditTaxAmount(calculatedTax);
    setEditTotalInvoiceAmount(inv.totalAmount);
    setEditNotes(inv.notes || '');
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setError('');
    setSuccess('');

    if (editPoAmount === '' || isNaN(Number(editPoAmount)) || Number(editPoAmount) < 0) {
      setError('PO Amount is required and must be non-negative.');
      return;
    }
    if (!editCurrencyType.trim()) {
      setError('Currency Type is required.');
      return;
    }

    const numericTax = parseFloat((editTaxPercentage || '').replace(/[^0-9.]/g, '')) || 0;
    const calcTaxAmt = calculateTaxAmount(editPoAmount, editTaxPercentage);
    const finalTotal = calculateTotalInvoiceAmount(editPoAmount, editTaxPercentage);

    setEditSubmitting(true);
    try {
      const payload = {
        invoiceNumber: editInvoiceNumber.trim(),
        invoiceDate: editInvoiceDate,
        dueDate: editDueDate,
        poAmount: Number(editPoAmount),
        taxPercentage: numericTax,
        taxAmount: calcTaxAmt,
        totalAmount: finalTotal,
        currencyType: editCurrencyType.trim(),
        notes: editNotes,
      };

      await api.put(`/api/invoices/${editingInvoice.id}`, payload);
      setSuccess(`Invoice '${editInvoiceNumber.trim()}' updated successfully!`);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (inv: InvoiceData) => {
    if (!window.confirm(`Are you sure you want to delete invoice '${inv.invoiceNumber}'?`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/invoices/${inv.id}`);
      setSuccess(`Invoice '${inv.invoiceNumber}' deleted successfully!`);
      fetchInvoices();
      if (isSupplier) {
        fetchEligibleRequests();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleDownloadInvoice = (inv: InvoiceData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${inv.invoiceNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; }
          .status-badge { background: #fef3c7; color: #d97706; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 14px; border: 1px solid #fde68a; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; }
          .box h4 { margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .box p { margin: 4px 0; font-size: 14px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px; font-size: 14px; }
          .items-table th { background: #f1f5f9; color: #334155; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
          .items-table th.text-right, .items-table td.text-right { text-align: right; }
          .items-table th.text-center, .items-table td.text-center { text-align: center; }
          .amount-card { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; text-align: right; margin-top: 30px; }
          .amount-val { font-size: 26px; font-weight: bold; color: #2563eb; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">EXCEPTIONPRO INVOICE</div>
            <div style="color: #64748b; font-size: 14px; margin-top: 6px;">Invoice Number: <strong>${inv.invoiceNumber}</strong></div>
          </div>
          <div class="status-badge">${inv.status}</div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Supplier Details</h4>
            <p><strong>Organization / Name:</strong> ${inv.supplierName}</p>
            <p><strong>Email:</strong> ${inv.supplierEmail}</p>
            <p><strong>Address:</strong> ${inv.supplierAddress || 'Address not specified'}</p>
          </div>
          <div class="box">
            <h4>Buyer Details</h4>
            <p><strong>Organization / Name:</strong> ${inv.buyerName}</p>
            <p><strong>Email:</strong> ${inv.buyerEmail}</p>
            <p><strong>Address:</strong> ${inv.buyerAddress || 'Address not specified'}</p>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Purchase Order Reference</h4>
            <p><strong>Type:</strong> ${inv.requestType === 'STANDARD' ? 'Purchase Request / PO' : 'Collaboration Request'}</p>
            <p><strong>PO Reference Code:</strong> ${inv.requestCode}</p>
            <p><strong>Title:</strong> ${inv.requestTitle}</p>
          </div>
          <div class="box">
            <h4>Invoice Schedule</h4>
            <p><strong>Invoice Date:</strong> ${inv.invoiceDate}</p>
            <p><strong>Payment Due Date:</strong> ${inv.dueDate}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Product Name</th>
              <th class="text-center" style="width: 120px;">Quantity</th>
              <th class="text-right" style="width: 140px;">Price (Each)</th>
              <th class="text-right" style="width: 140px;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items && inv.items.length > 0) ? inv.items.map((it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.productName}</strong></td>
                <td class="text-center">${it.quantity} ${it.unitMeasure ? `(${it.unitMeasure})` : ''}</td>
                <td class="text-right">${it.currencyType || inv.currencyType || 'USD'} ${Number(it.price || 0).toFixed(2)}</td>
                <td class="text-right"><strong>${it.currencyType || inv.currencyType || 'USD'} ${Number(it.totalPrice !== undefined ? it.totalPrice : (it.quantity * it.price)).toFixed(2)}</strong></td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 16px;">No itemized products found</td>
              </tr>
            `}
          </tbody>
        </table>

        ${inv.notes ? `
        <div class="box" style="margin-bottom: 24px;">
          <h4>Notes & Payment Terms</h4>
          <p style="font-style: italic; color: #475569;">"${inv.notes}"</p>
        </div>
        ` : ''}

        <div class="amount-card">
          <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">PO Amount: <strong>${inv.currencyType || 'USD'} ${Number(inv.poAmount !== undefined ? inv.poAmount : inv.totalAmount).toFixed(2)}</strong></div>
          ${inv.taxPercentage ? `<div style="font-size: 13px; color: #475569; margin-bottom: 6px;">Tax (${inv.taxPercentage}%): <strong>${inv.currencyType || 'USD'} ${Number(inv.taxAmount !== undefined ? inv.taxAmount : 0).toFixed(2)}</strong></div>` : ''}
          <div style="font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase;">Total Amount Payable</div>
          <div class="amount-val">${inv.currencyType || 'USD'} ${Number(inv.totalAmount || 0).toFixed(2)}</div>
        </div>

        <div class="footer">
          Official Electronic Invoice Document &bull; Generated by ExceptionPro System
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Updated Invoice') {
      return (
        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          Updated Invoice
        </span>
      );
    }
    if (status === 'Paid') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>Paid</span>;
    }
    return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>Submitted</span>;
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      <LeftNavigation activePage="invoices" />

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* SECTION 1: CREATE INVOICE (Suppliers only) */}
        {isSupplier && (
          <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Invoice</h2>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
              Generate invoices exclusively for <strong>Accepted Purchase Requests</strong> or <strong>Accepted Collaboration Requests</strong>
            </p>

            {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

            <form onSubmit={handleCreateInvoice}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Select Accepted Purchase Request or Collaboration Request *
                </label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={selectedRequestId}
                  onChange={(e) => handleSelectRequest(e.target.value)}
                  required
                >
                  <option value="">-- Select Accepted Request --</option>
                  {eligibleRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      [{req.requestType === 'STANDARD' ? 'Purchase Request' : 'Collaboration Request'}] {req.code !== 'COLLAB' ? `${req.code} - ` : ''}{req.title} (Buyer: {req.buyerName}, Amount: {req.currencyType || 'USD'} {req.totalAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
                {eligibleRequests.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    No Accepted requests found. Invoices can only be created once a Buyer's request has been Accepted.
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Invoice Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. INV-2026-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">PO Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={poAmount}
                        onChange={(e) => handlePoAmountChange(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Currency Type *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. USD, EUR, INR"
                        value={currencyType}
                        onChange={(e) => setCurrencyType(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="form-label">Percentage of Tax</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10 or 18"
                    value={taxPercentage}
                    onChange={(e) => handleTaxPercentageChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="form-label">Tax Amount (Readonly)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0.00"
                    value={currencyType ? `${currencyType} ${Number(taxAmount || 0).toFixed(2)}` : Number(taxAmount || 0).toFixed(2)}
                    readOnly
                    style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                  <label className="form-label">Total Invoice Amount (Readonly)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0.00"
                    value={currencyType ? `${currencyType} ${Number(totalInvoiceAmount || 0).toFixed(2)}` : Number(totalInvoiceAmount || 0).toFixed(2)}
                    readOnly
                    style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', color: 'var(--accent-primary)', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Invoice Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Payment Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notes / Payment Terms</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Enter any additional notes, banking details, or payment instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Creating Invoice...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        )}

        {/* SECTION 2: LIST INVOICES */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>My Invoices</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>View and manage invoices created for Accepted requests</p>

          {!isSupplier && error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {!isSupplier && success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          {loading ? (
            <div>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No invoices found. Select an Accepted Request above to create an invoice!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Record Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Invoice Number: {inv.invoiceNumber}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>
                        [{inv.requestType === 'STANDARD' ? 'Purchase Request' : 'Collaboration Request'}] {inv.requestCode !== 'COLLAB' ? `${inv.requestCode} - ` : ''}{inv.requestTitle}
                      </h3>
                    </div>
                    <div>{getStatusBadge(inv.status)}</div>
                  </div>

                  {/* Record Fields Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '1rem',
                      fontSize: '0.9rem',
                      overflowX: 'auto',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Buyer Details</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{inv.buyerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.buyerEmail}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Invoice Date</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.invoiceDate}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Due Date</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.dueDate}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Total Amount</span>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1rem' }}>
                        {inv.currencyType || 'USD'} {Number(inv.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Notes</span>
                      <div style={{ color: 'var(--text-primary)' }}>{inv.notes || '-'}</div>
                    </div>
                  </div>

                  {/* Actions Row in Single Horizontal Row with Uniform 140px Width */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      gap: '0.75rem',
                      alignItems: 'center',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-color)',
                      marginTop: '0.25rem',
                      overflowX: 'auto',
                    }}
                  >
                    {/* View Invoices / Details */}
                    <button
                      className="btn"
                      style={{
                        width: '140px',
                        minWidth: '140px',
                        height: '38px',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        background: '#38bdf8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                      onClick={() => setViewingInvoice(inv)}
                    >
                      View Invoices
                    </button>

                    {/* Download Invoices */}
                    <button
                      className="btn"
                      style={{
                        width: '140px',
                        minWidth: '140px',
                        height: '38px',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                      onClick={() => handleDownloadInvoice(inv)}
                    >
                      Download Invoices
                    </button>

                    {/* Edit (Supplier only) */}
                    {isSupplier && (
                      <button
                        className="btn"
                        style={{
                          width: '140px',
                          minWidth: '140px',
                          height: '38px',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          background: '#38bdf8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                        onClick={() => handleStartEdit(inv)}
                      >
                        Edit
                      </button>
                    )}

                    {/* Delete (Supplier only) */}
                    {isSupplier && (
                      <button
                        className="btn"
                        style={{
                          width: '140px',
                          minWidth: '140px',
                          height: '38px',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                        onClick={() => handleDeleteInvoice(inv)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: VIEW INVOICE DETAILS */}
      {viewingInvoice && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>Invoice Details</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {viewingInvoice.invoiceNumber}
                </span>
              </div>
              <div>{getStatusBadge(viewingInvoice.status)}</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Reference Request</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  [{viewingInvoice.requestType === 'STANDARD' ? 'Purchase Request' : 'Collaboration Request'}] {viewingInvoice.requestCode !== 'COLLAB' ? `${viewingInvoice.requestCode} - ` : ''}{viewingInvoice.requestTitle}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Buyer Details</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingInvoice.buyerName}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewingInvoice.buyerEmail}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Address: </span>{viewingInvoice.buyerAddress || 'Address not specified'}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Supplier Details</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingInvoice.supplierName}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewingInvoice.supplierEmail}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Address: </span>{viewingInvoice.supplierAddress || 'Address not specified'}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Invoice Date</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewingInvoice.invoiceDate}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Payment Due Date</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewingInvoice.dueDate}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>PO Amount</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {viewingInvoice.currencyType || 'USD'} {Number(viewingInvoice.poAmount !== undefined ? viewingInvoice.poAmount : viewingInvoice.totalAmount).toFixed(2)}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Tax Amount</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {viewingInvoice.taxPercentage ? `${viewingInvoice.taxPercentage}% - ` : ''}
                  {viewingInvoice.currencyType || 'USD'} {Number(viewingInvoice.taxAmount !== undefined && viewingInvoice.taxAmount !== null ? viewingInvoice.taxAmount : (viewingInvoice.totalAmount - (viewingInvoice.poAmount || viewingInvoice.totalAmount))).toFixed(2)}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Total Invoice Amount</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {viewingInvoice.currencyType || 'USD'} {Number(viewingInvoice.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              {viewingInvoice.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Notes / Payment Terms</span>
                  <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{viewingInvoice.notes}"</span>
                </div>
              )}
            </div>

            {/* Itemized Line Items Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Itemized Line Items
              </h4>
              {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, width: '40px' }}>#</th>
                        <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Product Name</th>
                        <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', width: '120px' }}>Quantity</th>
                        <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right', width: '130px' }}>Price (Each)</th>
                        <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right', width: '130px' }}>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingInvoice.items.map((it, idx) => {
                        const itCurr = it.currencyType || viewingInvoice.currencyType || 'USD';
                        const itTotal = it.totalPrice !== undefined ? it.totalPrice : (it.quantity * it.price);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{it.productName}</td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              {it.quantity} {it.unitMeasure ? `(${it.unitMeasure})` : ''}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                              {itCurr} {Number(it.price || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {itCurr} {Number(itTotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No item breakdown available for this invoice.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#10b981', color: '#fff', border: 'none' }}
                onClick={() => handleDownloadInvoice(viewingInvoice)}
              >
                Download Invoice
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVOICE */}
      {editingInvoice && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>Edit Invoice</h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setEditingInvoice(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice}>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Invoice Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">PO Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={editPoAmount}
                        onChange={(e) => handleEditPoAmountChange(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Currency Type *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. USD, EUR, INR"
                        value={editCurrencyType}
                        onChange={(e) => setEditCurrencyType(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="form-label">Percentage of Tax</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10 or 18"
                    value={editTaxPercentage}
                    onChange={(e) => handleEditTaxPercentageChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                  <label className="form-label">Tax Amount (Readonly)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0.00"
                    value={editCurrencyType ? `${editCurrencyType} ${Number(editTaxAmount || 0).toFixed(2)}` : Number(editTaxAmount || 0).toFixed(2)}
                    readOnly
                    style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                  <label className="form-label">Total Invoice Amount (Readonly)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCurrencyType ? `${editCurrencyType} ${Number(editTotalInvoiceAmount || 0).toFixed(2)}` : Number(editTotalInvoiceAmount || 0).toFixed(2)}
                    readOnly
                    style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', color: 'var(--accent-primary)', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Invoice Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editInvoiceDate}
                    onChange={(e) => setEditInvoiceDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Payment Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notes / Payment Terms</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingInvoice(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoicesPage;
