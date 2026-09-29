import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface PurchaseOrderOption {
  id: string;
  code: string;
  title: string;
  status: string;
  needByDate?: string;
  supplierId?: string;
  supplierName?: string;
  supplierEmail?: string;
}

interface SupplierOption {
  id: string;
  name: string;
  email: string;
  accountType?: string;
}

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  invoiceDate: string;
  status: string;
  purchaseOrderId?: string;
  purchaseOrderCode?: string;
  purchaseOrderTitle?: string;
  supplierId?: string;
  supplierName?: string;
}

interface PurchaseReceipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  purchaseOrderId?: string;
  purchaseOrderCode?: string;
  purchaseOrderTitle?: string;
  receivedFromSupplierId: string;
  receivedFromSupplierName: string;
  receivedFromSupplierEmail: string;
  invoiceId?: string;
  invoiceNumber?: string;
  quantity: number;
  receivedStatus: string;
  createdAt: string;
  updatedAt?: string;
}

const PurchaseReceipts: React.FC = () => {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form State (Create)
  const [receiptNumberSuffix, setReceiptNumberSuffix] = useState<string>('001');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [receivedStatus, setReceivedStatus] = useState<string>('Fully Received');

  // Edit Modal State
  const [editingReceipt, setEditingReceipt] = useState<PurchaseReceipt | null>(null);
  const [editReceiptNumberSuffix, setEditReceiptNumberSuffix] = useState<string>('');
  const [editReceiptDate, setEditReceiptDate] = useState<string>('');
  const [editPoId, setEditPoId] = useState<string>('');
  const [editSupplierId, setEditSupplierId] = useState<string>('');
  const [editInvoiceId, setEditInvoiceId] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editReceivedStatus, setEditReceivedStatus] = useState<string>('Fully Received');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [receiptsRes, posRes, suppliersRes, invoicesRes] = await Promise.all([
        api.get('/api/purchase-receipts'),
        api.get('/api/purchase-receipts/purchase-orders'),
        api.get('/api/purchase-receipts/connected-suppliers'),
        api.get('/api/purchase-receipts/invoices')
      ]);

      setReceipts(receiptsRes.data);
      setPurchaseOrders(posRes.data);
      setSuppliers(suppliersRes.data);
      setInvoices(invoicesRes.data);

      // Suggest default next receipt number
      if (receiptsRes.data && receiptsRes.data.length > 0) {
        const nextNum = (receiptsRes.data.length + 1).toString().padStart(3, '0');
        setReceiptNumberSuffix(nextNum);
      }
    } catch (err: any) {
      console.error('Error loading purchase receipts data:', err);
      setError(err.response?.data?.message || 'Failed to load purchase receipts data.');
    } finally {
      setLoading(false);
    }
  };

  // When PO changes in Create Form
  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    if (poId) {
      const matchedPo = purchaseOrders.find((p) => p.id === poId);
      if (matchedPo && matchedPo.supplierId) {
        setSelectedSupplierId(matchedPo.supplierId);
      }
      // Reset invoice selection if not belonging to PO
      const matchedInvoice = invoices.find((inv) => inv.purchaseOrderId === poId);
      if (matchedInvoice) {
        setSelectedInvoiceId(matchedInvoice.id);
      } else {
        setSelectedInvoiceId('');
      }
    }
  };

  // When PO changes in Edit Form
  const handleEditPoChange = (poId: string) => {
    setEditPoId(poId);
    if (poId) {
      const matchedPo = purchaseOrders.find((p) => p.id === poId);
      if (matchedPo && matchedPo.supplierId) {
        setEditSupplierId(matchedPo.supplierId);
      }
      const matchedInvoice = invoices.find((inv) => inv.purchaseOrderId === poId);
      if (matchedInvoice) {
        setEditInvoiceId(matchedInvoice.id);
      }
    }
  };

  const handleSuffixChange = (val: string, isEdit = false) => {
    // Only allow digits
    const cleaned = val.replace(/\D/g, '');
    if (isEdit) {
      setEditReceiptNumberSuffix(cleaned);
    } else {
      setReceiptNumberSuffix(cleaned);
    }
  };

  const handleCancelCreate = () => {
    const nextNum = (receipts.length + 1).toString().padStart(3, '0');
    setReceiptNumberSuffix(nextNum);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setSelectedPoId('');
    setSelectedSupplierId('');
    setSelectedInvoiceId('');
    setQuantity(1);
    setReceivedStatus('Fully Received');
    setError('');
    setSuccess('');
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!receiptNumberSuffix.trim()) {
      setError('Please enter a Receipt Number.');
      return;
    }

    if (!selectedSupplierId) {
      setError('Please select a Supplier in Received From.');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        receiptNo: `REC - ${receiptNumberSuffix.trim()}`,
        receiptDate,
        purchaseOrderId: selectedPoId || null,
        receivedFromSupplierId: selectedSupplierId,
        invoiceId: selectedInvoiceId || null,
        quantity: Number(quantity),
        receivedStatus
      };

      const res = await api.post('/api/purchase-receipts', payload);
      setSuccess(`Purchase Receipt ${res.data.receiptNo} created successfully!`);
      handleCancelCreate();
      await loadData();
    } catch (err: any) {
      console.error('Error creating purchase receipt:', err);
      setError(err.response?.data?.message || 'Failed to create Purchase Receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (receipt: PurchaseReceipt) => {
    setEditingReceipt(receipt);
    // Extract numeric suffix if it matches 'REC - 001'
    const match = receipt.receiptNo.match(/REC\s*-\s*(.*)/i);
    const suffix = match ? match[1].trim() : receipt.receiptNo.replace(/\D/g, '');
    setEditReceiptNumberSuffix(suffix || '001');
    setEditReceiptDate(receipt.receiptDate || new Date().toISOString().split('T')[0]);
    setEditPoId(receipt.purchaseOrderId || '');
    setEditSupplierId(receipt.receivedFromSupplierId || '');
    setEditInvoiceId(receipt.invoiceId || '');
    setEditQuantity(receipt.quantity || 1);
    setEditReceivedStatus(receipt.receivedStatus || 'Fully Received');
    setError('');
    setSuccess('');
  };

  const handleUpdateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;

    if (!editReceiptNumberSuffix.trim()) {
      setError('Please enter a Receipt Number.');
      return;
    }

    if (!editSupplierId) {
      setError('Please select a Supplier in Received From.');
      return;
    }

    if (editQuantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setEditSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        receiptNo: `REC - ${editReceiptNumberSuffix.trim()}`,
        receiptDate: editReceiptDate,
        purchaseOrderId: editPoId || null,
        receivedFromSupplierId: editSupplierId,
        invoiceId: editInvoiceId || null,
        quantity: Number(editQuantity),
        receivedStatus: editReceivedStatus
      };

      const res = await api.put(`/api/purchase-receipts/${editingReceipt.id}`, payload);
      setSuccess(`Purchase Receipt ${res.data.receiptNo} updated successfully!`);
      setEditingReceipt(null);
      await loadData();
    } catch (err: any) {
      console.error('Error updating purchase receipt:', err);
      setError(err.response?.data?.message || 'Failed to update Purchase Receipt.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteReceipt = async (receipt: PurchaseReceipt) => {
    if (!window.confirm(`Are you sure you want to delete purchase receipt '${receipt.receiptNo}'?`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/purchase-receipts/${receipt.id}`);
      setSuccess(`Purchase Receipt ${receipt.receiptNo} deleted successfully.`);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting purchase receipt:', err);
      setError(err.response?.data?.message || 'Failed to delete Purchase Receipt.');
    }
  };

  // Invoices filtered by selected PO in form
  const availableInvoices = selectedPoId
    ? invoices.filter((inv) => !inv.purchaseOrderId || inv.purchaseOrderId === selectedPoId)
    : invoices;

  const availableEditInvoices = editPoId
    ? invoices.filter((inv) => !inv.purchaseOrderId || inv.purchaseOrderId === editPoId)
    : invoices;

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <LeftNavigation activePage="purchase-receipts" />

      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Page Header */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                <path d="M9 14l2 2 4-4"></path>
              </svg>
              Purchase Receipts
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create and manage purchase order delivery receipts, track item fulfillment, and link supplier invoices.
            </p>
          </div>
          <div className="badge badge-buyer" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            Buyer Portal
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-color)', color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        {success && (
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--success-color)', color: 'var(--success-color)', background: 'rgba(34, 197, 94, 0.05)' }}>
            <strong>Success: </strong> {success}
          </div>
        )}

        {/* Create Receipt Form Card */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Create New Purchase Receipt
          </h3>

          <form onSubmit={handleCreateReceipt}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Receipt No */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Receipt No <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      borderRight: 'none',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px 0 0 8px',
                      color: 'var(--accent-color)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      userSelect: 'none'
                    }}
                  >
                    REC -
                  </span>
                  <input
                    type="text"
                    value={receiptNumberSuffix}
                    onChange={(e) => handleSuffixChange(e.target.value)}
                    placeholder="001"
                    pattern="[0-9]*"
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0 8px 8px 0',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Enter only digits (e.g. 001, 002). Formats as: <strong>REC - {receiptNumberSuffix || '___'}</strong>
                </small>
              </div>

              {/* Receipt Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Receipt Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Purchase Order Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Purchase Order
                </label>
                <select
                  value={selectedPoId}
                  onChange={(e) => handlePoChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Select Purchase Order (Optional) --</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.code} - {po.title} ({po.status})
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Purchase orders created by you.
                </small>
              </div>

              {/* Received From (Supplier) Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Received From <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                >
                  <option value="">-- Select Connected Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Connected suppliers linked to your account.
                </small>
              </div>

              {/* Payment For (Invoice) Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Payment For (Invoice)
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Select Supplier Invoice (Optional) --</option>
                  {availableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - ${Number(inv.totalAmount).toFixed(2)} ({inv.status})
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Invoices created by suppliers based on Purchase Order.
                </small>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Received Status Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Received <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <select
                  value={receivedStatus}
                  onChange={(e) => setReceivedStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                >
                  <option value="Partial Received">Partial Received</option>
                  <option value="Fully Received">Fully Received</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ minWidth: '110px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {submitting ? 'Creating...' : 'Create Receipt'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Receipts List */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Purchase Receipts History ({receipts.length})
            </h3>
            <button
              onClick={loadData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
              title="Refresh Receipts List"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.35rem', verticalAlign: 'middle' }}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading purchase receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', opacity: 0.6, display: 'block' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Purchase Receipts Found</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Fill out the form above to create your first purchase receipt.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Receipt No</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Receipt Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Purchase Order</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Received From</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment For (Invoice)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                        {r.receiptNo}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        {r.receiptDate}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        {r.purchaseOrderCode ? (
                          <span>
                            <strong>{r.purchaseOrderCode}</strong>
                            {r.purchaseOrderTitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.purchaseOrderTitle}</div>}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        <div>{r.receivedFromSupplierName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.receivedFromSupplierEmail}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        {r.invoiceNumber ? (
                          <span className="badge badge-individual" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                            {r.invoiceNumber}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.quantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          className={`badge ${r.receivedStatus === 'Fully Received' ? 'badge-supplier' : 'badge-buyer'}`}
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.6rem'
                          }}
                        >
                          {r.receivedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            title="Edit Receipt"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem', verticalAlign: 'middle' }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(r)}
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger-color)' }}
                            title="Delete Receipt"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem', verticalAlign: 'middle' }}>
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Receipt Modal */}
      {editingReceipt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '650px',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                Edit Purchase Receipt ({editingReceipt.receiptNo})
              </h3>
              <button
                type="button"
                onClick={() => setEditingReceipt(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReceipt}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Receipt No */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Receipt No <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-color)',
                        borderRight: 'none',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px 0 0 8px',
                        color: 'var(--accent-color)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      REC -
                    </span>
                    <input
                      type="text"
                      value={editReceiptNumberSuffix}
                      onChange={(e) => handleSuffixChange(e.target.value, true)}
                      placeholder="001"
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid var(--border-color)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Receipt Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Receipt Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editReceiptDate}
                    onChange={(e) => setEditReceiptDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                {/* Purchase Order */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Purchase Order
                  </label>
                  <select
                    value={editPoId}
                    onChange={(e) => handleEditPoChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select Purchase Order (Optional) --</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.code} - {po.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Received From (Supplier) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received From <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    required
                  >
                    <option value="">-- Select Connected Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment For (Invoice) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Payment For (Invoice)
                  </label>
                  <select
                    value={editInvoiceId}
                    onChange={(e) => setEditInvoiceId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select Supplier Invoice (Optional) --</option>
                    {availableEditInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - ${Number(inv.totalAmount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Received Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received Status <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={editReceivedStatus}
                    onChange={(e) => setEditReceivedStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    required
                  >
                    <option value="Partial Received">Partial Received</option>
                    <option value="Fully Received">Fully Received</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  disabled={editSubmitting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn btn-primary"
                >
                  {editSubmitting ? 'Saving...' : 'Update Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReceipts;
