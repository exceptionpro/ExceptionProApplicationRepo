import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import { useAuth } from '../context/AuthContext';
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
  poQuantity?: number;
  currencyType?: string;
  totalAmount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceCurrencyType?: string;
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
  currencyType?: string;
  invoiceDate: string;
  status: string;
  purchaseOrderId?: string;
  purchaseOrderCode?: string;
  purchaseOrderTitle?: string;
  supplierId?: string;
  supplierName?: string;
}

export interface ReceiptItem {
  id: string;
  productName: string;
  fullDescription?: string;
  quantity: number;
  unitMeasure?: string;
  price: number;
  currencyType?: string;
}

export interface PurchaseReceipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  purchaseOrderId?: string;
  purchaseOrderCode?: string;
  purchaseOrderTitle?: string;
  receivedFromSupplierId: string;
  receivedFromSupplierName: string;
  receivedFromSupplierEmail: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  currencyType?: string;
  quantity: number;
  poQuantity?: number;
  receivedQuantity?: number;
  pendingQuantity?: number;
  receivedStatus: string;
  supplierApprovalStatus?: string;
  supplierConfirmationMessage?: string;
  supplierApprovedPendingQuantity?: number;
  supplierApprovedAt?: string;
  supplierComments?: string;
  items?: ReceiptItem[];
  createdAt: string;
  updatedAt?: string;
}

const PurchaseReceipts: React.FC = () => {
  const { user } = useAuth();
  const accountTypeRaw = (user?.accountType || '').toLowerCase().trim();
  const isSupplier = accountTypeRaw.includes('supplier') || accountTypeRaw === '' || user?.role === 'ROLE_ADMIN';
  const isBuyer = accountTypeRaw.includes('buyer') || accountTypeRaw === '' || user?.role === 'ROLE_ADMIN';

  const [viewMode, setViewMode] = useState<'buyer' | 'supplier'>(
    !isBuyer && isSupplier ? 'supplier' : 'buyer'
  );

  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Supplier Approval Form State (within View Receipt Modal)
  const [supplierApprovedPendingQty, setSupplierApprovedPendingQty] = useState<number | ''>('');
  const [supplierConfirmationMsg, setSupplierConfirmationMsg] = useState<string>('');
  const [supplierComments, setSupplierComments] = useState<string>('');
  const [approving, setApproving] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string>('');
  const [approvalSuccess, setApprovalSuccess] = useState<string>('');

  // Form State (Create) - PO Quantity, Received Quantity, Pending Quantity starting empty (not 1 or 0)
  const [receiptNumberSuffix, setReceiptNumberSuffix] = useState<string>('001');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');
  const [currencyType, setCurrencyType] = useState<string>('');
  const [poQuantity, setPoQuantity] = useState<number | ''>('');
  const [receivedQuantity, setReceivedQuantity] = useState<number | ''>('');
  const [pendingQuantity, setPendingQuantity] = useState<number | ''>('');
  const [receivedStatus, setReceivedStatus] = useState<string>('Fully Received');

  // Edit Modal State
  const [editingReceipt, setEditingReceipt] = useState<PurchaseReceipt | null>(null);
  const [editReceiptNumberSuffix, setEditReceiptNumberSuffix] = useState<string>('');
  const [editReceiptDate, setEditReceiptDate] = useState<string>('');
  const [editPoId, setEditPoId] = useState<string>('');
  const [editSupplierId, setEditSupplierId] = useState<string>('');
  const [editInvoiceId, setEditInvoiceId] = useState<string>('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState<string>('');
  const [editInvoiceAmount, setEditInvoiceAmount] = useState<number | ''>('');
  const [editCurrencyType, setEditCurrencyType] = useState<string>('');
  const [editPoQuantity, setEditPoQuantity] = useState<number | ''>('');
  const [editReceivedQuantity, setEditReceivedQuantity] = useState<number | ''>('');
  const [editPendingQuantity, setEditPendingQuantity] = useState<number | ''>('');
  const [editReceivedStatus, setEditReceivedStatus] = useState<string>('Fully Received');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

  // View Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<PurchaseReceipt | null>(null);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const isSupplierOnly = viewMode === 'supplier' && isSupplier && !isBuyer;
      const receiptsUrl = isSupplierOnly ? '/api/purchase-receipts/supplier' : '/api/purchase-receipts';

      const promises: Promise<any>[] = [
        api.get(receiptsUrl)
      ];

      if (isBuyer) {
        promises.push(
          api.get('/api/purchase-receipts/purchase-orders').catch(() => ({ data: [] })),
          api.get('/api/purchase-receipts/connected-suppliers').catch(() => ({ data: [] })),
          api.get('/api/purchase-receipts/invoices').catch(() => ({ data: [] }))
        );
      } else {
        promises.push(
          Promise.resolve({ data: [] }),
          Promise.resolve({ data: [] }),
          Promise.resolve({ data: [] })
        );
      }

      const [receiptsRes, posRes, suppliersRes, invoicesRes] = await Promise.all(promises);

      setReceipts(receiptsRes.data || []);
      setPurchaseOrders(posRes?.data || []);
      setSuppliers(suppliersRes?.data || []);
      setInvoices(invoicesRes?.data || []);

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

  const handleOpenView = (receipt: PurchaseReceipt) => {
    setViewingReceipt(receipt);
    const defaultPending = receipt.pendingQuantity !== undefined && receipt.pendingQuantity !== null ? receipt.pendingQuantity : 0;
    const initialApproved = receipt.supplierApprovedPendingQuantity !== undefined && receipt.supplierApprovedPendingQuantity !== null
      ? receipt.supplierApprovedPendingQuantity
      : defaultPending;
    setSupplierApprovedPendingQty(initialApproved);

    let initialMsg = Number(initialApproved) === 0 ? 'All Items Delivered' : 'Items Pending Delivery from Supplier';
    if (receipt.supplierConfirmationMessage && !receipt.supplierConfirmationMessage.toLowerCase().includes('still pending')) {
      initialMsg = receipt.supplierConfirmationMessage;
    }
    setSupplierConfirmationMsg(initialMsg);
    setSupplierComments(receipt.supplierComments || '');
    setApprovalError('');
    setApprovalSuccess('');
  };

  const handleSupplierApproval = async (status: string = 'Approved') => {
    if (!viewingReceipt) return;
    setApproving(true);
    setApprovalError('');
    setApprovalSuccess('');
    try {
      const pQty = supplierApprovedPendingQty !== '' ? Number(supplierApprovedPendingQty) : (viewingReceipt.pendingQuantity || 0);
      let confMsg = supplierConfirmationMsg.trim();
      if (!confMsg || confMsg.toLowerCase().includes('still pending')) {
        confMsg = pQty === 0 ? 'All Items Delivered' : 'Items Pending Delivery from Supplier';
      }
      const payload = {
        status,
        pendingQuantity: pQty,
        confirmationMessage: confMsg,
        comments: supplierComments.trim()
      };
      const res = await api.post(`/api/purchase-receipts/${viewingReceipt.id}/supplier-approval`, payload);
      setViewingReceipt(res.data);
      setReceipts((prev) => prev.map((r) => (r.id === res.data.id ? res.data : r)));
      setApprovalSuccess(`Confirmation submitted successfully! "${confMsg}"`);
      setSuccess(`Supplier approval confirmed for ${res.data.receiptNo}`);
    } catch (err: any) {
      console.error('Error submitting supplier approval:', err);
      setApprovalError(err.response?.data?.message || 'Failed to submit supplier approval.');
    } finally {
      setApproving(false);
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

      // Expected Result: The Currency Type must be same as Purchase Order Price Currency Type
      const poCurrency = (matchedPo && matchedPo.currencyType) ? matchedPo.currencyType : 'USD';
      setCurrencyType(poCurrency);

      // Populate Invoice Number and Invoice Amount from matching invoice or PO
      const matchedInvoice = invoices.find((inv) => inv.purchaseOrderId === poId);
      if (matchedInvoice) {
        setSelectedInvoiceId(matchedInvoice.id);
        setInvoiceNumber(matchedInvoice.invoiceNumber || '');
        setInvoiceAmount(matchedInvoice.totalAmount !== undefined && matchedInvoice.totalAmount !== null ? matchedInvoice.totalAmount : '');
      } else if (matchedPo && matchedPo.invoiceNumber) {
        setSelectedInvoiceId(matchedPo.invoiceId || '');
        setInvoiceNumber(matchedPo.invoiceNumber || '');
        setInvoiceAmount(matchedPo.invoiceAmount !== undefined && matchedPo.invoiceAmount !== null ? matchedPo.invoiceAmount : '');
      } else {
        setSelectedInvoiceId('');
        setInvoiceNumber('');
        setInvoiceAmount(matchedPo && matchedPo.totalAmount !== undefined && matchedPo.totalAmount !== null ? matchedPo.totalAmount : '');
      }

      // Auto populate PO Quantity based on selection of PO from Drop down Purchase Order
      const poQty = matchedPo && matchedPo.poQuantity !== undefined ? matchedPo.poQuantity : '';
      setPoQuantity(poQty);

      if (poQty !== '' && receivedQuantity !== '') {
        const pending = Math.max(0, Number(poQty) - Number(receivedQuantity));
        setPendingQuantity(pending);
        setReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
      } else if (receivedQuantity !== '') {
        setPendingQuantity('');
      }
    } else {
      setSelectedInvoiceId('');
      setInvoiceNumber('');
      setInvoiceAmount('');
      setCurrencyType('');
      setPoQuantity('');
      setPendingQuantity('');
    }
  };

  const handleReceivedQuantityChange = (val: string) => {
    if (val === '') {
      setReceivedQuantity('');
      setPendingQuantity('');
      return;
    }
    const num = Math.max(0, parseInt(val, 10));
    const safeNum = isNaN(num) ? '' : num;
    setReceivedQuantity(safeNum);

    if (poQuantity !== '' && safeNum !== '') {
      const pending = Math.max(0, Number(poQuantity) - Number(safeNum));
      setPendingQuantity(pending);
      setReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
    } else {
      setPendingQuantity('');
    }
  };

  const handlePoQuantityChange = (val: string) => {
    if (val === '') {
      setPoQuantity('');
      setPendingQuantity('');
      return;
    }
    const num = Math.max(0, parseInt(val, 10));
    const safeNum = isNaN(num) ? '' : num;
    setPoQuantity(safeNum);

    if (safeNum !== '' && receivedQuantity !== '') {
      const pending = Math.max(0, Number(safeNum) - Number(receivedQuantity));
      setPendingQuantity(pending);
      setReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
    } else {
      setPendingQuantity('');
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

      const poCurrency = (matchedPo && matchedPo.currencyType) ? matchedPo.currencyType : 'USD';
      setEditCurrencyType(poCurrency);

      const matchedInvoice = invoices.find((inv) => inv.purchaseOrderId === poId);
      if (matchedInvoice) {
        setEditInvoiceId(matchedInvoice.id);
        setEditInvoiceNumber(matchedInvoice.invoiceNumber || '');
        setEditInvoiceAmount(matchedInvoice.totalAmount !== undefined && matchedInvoice.totalAmount !== null ? matchedInvoice.totalAmount : '');
      } else if (matchedPo && matchedPo.invoiceNumber) {
        setEditInvoiceId(matchedPo.invoiceId || '');
        setEditInvoiceNumber(matchedPo.invoiceNumber || '');
        setEditInvoiceAmount(matchedPo.invoiceAmount !== undefined && matchedPo.invoiceAmount !== null ? matchedPo.invoiceAmount : '');
      } else {
        setEditInvoiceId('');
        setEditInvoiceNumber('');
        setEditInvoiceAmount(matchedPo && matchedPo.totalAmount !== undefined && matchedPo.totalAmount !== null ? matchedPo.totalAmount : '');
      }

      if (matchedPo && matchedPo.poQuantity !== undefined) {
        setEditPoQuantity(matchedPo.poQuantity);
        if (editReceivedQuantity !== '') {
          const pending = Math.max(0, matchedPo.poQuantity - Number(editReceivedQuantity));
          setEditPendingQuantity(pending);
          setEditReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
        }
      }
    } else {
      setEditInvoiceId('');
      setEditInvoiceNumber('');
      setEditInvoiceAmount('');
      setEditCurrencyType('');
      setEditPoQuantity('');
      setEditPendingQuantity('');
    }
  };

  const handleEditReceivedQuantityChange = (val: string) => {
    if (val === '') {
      setEditReceivedQuantity('');
      setEditPendingQuantity('');
      return;
    }
    const num = Math.max(0, parseInt(val, 10));
    const safeNum = isNaN(num) ? '' : num;
    setEditReceivedQuantity(safeNum);

    if (editPoQuantity !== '' && safeNum !== '') {
      const pending = Math.max(0, Number(editPoQuantity) - Number(safeNum));
      setEditPendingQuantity(pending);
      setEditReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
    } else {
      setEditPendingQuantity('');
    }
  };

  const handleEditPoQuantityChange = (val: string) => {
    if (val === '') {
      setEditPoQuantity('');
      setEditPendingQuantity('');
      return;
    }
    const num = Math.max(0, parseInt(val, 10));
    const safeNum = isNaN(num) ? '' : num;
    setEditPoQuantity(safeNum);

    if (safeNum !== '' && editReceivedQuantity !== '') {
      const pending = Math.max(0, Number(safeNum) - Number(editReceivedQuantity));
      setEditPendingQuantity(pending);
      setEditReceivedStatus(pending === 0 ? 'Fully Received' : 'Partial Received');
    } else {
      setEditPendingQuantity('');
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
    setInvoiceNumber('');
    setInvoiceAmount('');
    setCurrencyType('');
    setPoQuantity('');
    setReceivedQuantity('');
    setPendingQuantity('');
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

    if (receivedQuantity === '' || Number(receivedQuantity) <= 0) {
      setError('Received Quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const effectivePoQty = poQuantity !== '' ? Number(poQuantity) : Number(receivedQuantity);
      const effectivePending = pendingQuantity !== '' ? Number(pendingQuantity) : Math.max(0, effectivePoQty - Number(receivedQuantity));

      const payload = {
        receiptNo: `REC - ${receiptNumberSuffix.trim()}`,
        receiptDate,
        purchaseOrderId: selectedPoId || null,
        receivedFromSupplierId: selectedSupplierId,
        invoiceId: selectedInvoiceId || null,
        invoiceNumber: invoiceNumber.trim() || null,
        invoiceAmount: invoiceAmount !== '' ? Number(invoiceAmount) : null,
        currencyType: currencyType || null,
        quantity: Number(receivedQuantity),
        receivedQuantity: Number(receivedQuantity),
        poQuantity: effectivePoQty,
        pendingQuantity: effectivePending,
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

    const matchedPo = purchaseOrders.find((p) => p.id === receipt.purchaseOrderId);
    const matchedInvoice = invoices.find((inv) => (receipt.invoiceId && inv.id === receipt.invoiceId) || (receipt.purchaseOrderId && inv.purchaseOrderId === receipt.purchaseOrderId));
    const poCurrency = (matchedPo && matchedPo.currencyType) ? matchedPo.currencyType : (receipt.currencyType || 'USD');
    setEditCurrencyType(poCurrency);
    setEditInvoiceNumber(receipt.invoiceNumber || (matchedInvoice ? matchedInvoice.invoiceNumber : ''));
    setEditInvoiceAmount(receipt.invoiceAmount !== undefined && receipt.invoiceAmount !== null ? receipt.invoiceAmount : (matchedInvoice && matchedInvoice.totalAmount !== undefined ? matchedInvoice.totalAmount : ''));

    const recQty = receipt.receivedQuantity !== undefined ? receipt.receivedQuantity : (receipt.quantity || '');
    const poQty = receipt.poQuantity !== undefined ? receipt.poQuantity : recQty;
    const pendQty = receipt.pendingQuantity !== undefined ? receipt.pendingQuantity : (poQty !== '' && recQty !== '' ? Math.max(0, Number(poQty) - Number(recQty)) : '');
    setEditPoQuantity(poQty);
    setEditReceivedQuantity(recQty);
    setEditPendingQuantity(pendQty);
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

    if (editReceivedQuantity === '' || Number(editReceivedQuantity) <= 0) {
      setError('Received Quantity must be greater than 0.');
      return;
    }

    setEditSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const effectivePoQty = editPoQuantity !== '' ? Number(editPoQuantity) : Number(editReceivedQuantity);
      const effectivePending = editPendingQuantity !== '' ? Number(editPendingQuantity) : Math.max(0, effectivePoQty - Number(editReceivedQuantity));

      const payload = {
        receiptNo: `REC - ${editReceiptNumberSuffix.trim()}`,
        receiptDate: editReceiptDate,
        purchaseOrderId: editPoId || null,
        receivedFromSupplierId: editSupplierId,
        invoiceId: editInvoiceId || null,
        invoiceNumber: editInvoiceNumber.trim() || null,
        invoiceAmount: editInvoiceAmount !== '' ? Number(editInvoiceAmount) : null,
        currencyType: editCurrencyType || null,
        quantity: Number(editReceivedQuantity),
        receivedQuantity: Number(editReceivedQuantity),
        poQuantity: effectivePoQty,
        pendingQuantity: effectivePending,
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

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <LeftNavigation activePage="purchase-receipts" />

      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Page Header */}
        {/* Page Header */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                <path d="M9 14l2 2 4-4"></path>
              </svg>
              {viewMode === 'supplier' ? 'Receipts' : 'Purchase Receipts'}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {viewMode === 'supplier'
                ? 'Receipt Confirmations / Receipt Acknowledgements — Review delivery product items and provide supplier approvals.'
                : 'Create and manage purchase order delivery receipts, track item fulfillment, and link supplier invoices.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isBuyer && isSupplier && (
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('buyer')}
                  className={`btn ${viewMode === 'buyer' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Buyer Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('supplier')}
                  className={`btn ${viewMode === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Supplier Acknowledgements
                </button>
              </div>
            )}
            <div className={`badge ${viewMode === 'supplier' ? 'badge-supplier' : 'badge-buyer'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              {viewMode === 'supplier' ? 'Supplier Portal' : 'Buyer Portal'}
            </div>
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

        {/* Create Receipt Form Card (Only shown in Buyer view) */}
        {viewMode === 'buyer' && (
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

                {/* Invoice Number */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Auto-populated from Purchase Order"
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
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Invoice number linked to selected Purchase Order.
                  </small>
                </div>

                {/* Invoice Amount */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Auto-populated from Purchase Order"
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
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Invoice amount for selected Purchase Order.
                  </small>
                </div>

                {/* Currency Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Currency Type
                  </label>
                  <input
                    type="text"
                    value={currencyType}
                    readOnly
                    placeholder="Auto-populated from PO Price Currency"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Same as Purchase Order Price Currency Type.
                  </small>
                </div>

                {/* PO Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    PO Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={poQuantity}
                    onChange={(e) => handlePoQuantityChange(e.target.value)}
                    placeholder="Auto-populated from PO"
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
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Populated from selected Purchase Order.
                  </small>
                </div>

                {/* Received Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receivedQuantity}
                    onChange={(e) => handleReceivedQuantityChange(e.target.value)}
                    placeholder="Enter received quantity"
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

                {/* Pending Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Pending Quantity <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(Read-only)</span>
                  </label>
                  <input
                    type="number"
                    value={pendingQuantity}
                    readOnly
                    placeholder="Auto-calculated (PO Qty - Received Qty)"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--accent-color)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Auto-calculated as PO Quantity - Received Quantity.
                  </small>
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
        )}

        {/* Existing Receipts List */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {viewMode === 'supplier'
                ? `Receipt Confirmations & Acknowledgements (${receipts.length})`
                : `Purchase Receipts History (${receipts.length})`}
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
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {viewMode === 'supplier' ? 'No Receipts Found for Confirmation' : 'No Purchase Receipts Found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {viewMode === 'supplier'
                  ? 'Delivery receipts created by buyers for your products will appear here for acknowledgement and approval.'
                  : 'Fill out the form above to create your first purchase receipt.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Receipt No</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Receipt Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Purchase Order</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{viewMode === 'supplier' ? 'Buyer' : 'Received From'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment For (Invoice)</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>PO Qty</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Received Qty</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Pending Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Supplier Confirmation</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Confirmation Message</th>
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
                        {viewMode === 'supplier' ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.buyerName || 'Buyer'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.buyerEmail || ''}</div>
                          </div>
                        ) : (
                          <div>
                            <div>{r.receivedFromSupplierName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.receivedFromSupplierEmail}</div>
                          </div>
                        )}
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
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {r.poQuantity !== undefined && r.poQuantity !== null ? r.poQuantity : '-'}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.receivedQuantity !== undefined && r.receivedQuantity !== null ? r.receivedQuantity : r.quantity}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 600, color: (r.pendingQuantity || 0) > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                        {r.pendingQuantity !== undefined && r.pendingQuantity !== null ? r.pendingQuantity : 0}
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
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          className={`badge ${r.supplierApprovalStatus === 'Approved' ? 'badge-supplier' : 'badge-individual'}`}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.55rem'
                          }}
                        >
                          {r.supplierApprovalStatus || 'Pending Approval'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', maxWidth: '240px', fontSize: '0.85rem' }}>
                        {r.supplierConfirmationMessage ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#16a34a', wordBreak: 'break-word' }}>
                              {(() => {
                                const msg = r.supplierConfirmationMessage;
                                if (!msg || msg.toLowerCase().includes('still pending')) {
                                  const qty = r.supplierApprovedPendingQuantity ?? r.pendingQuantity ?? 0;
                                  return qty === 0 ? 'All Items Delivered' : 'Items Pending Delivery from Supplier';
                                }
                                return msg;
                              })()}
                            </div>
                            {r.supplierComments && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>
                                Notes: {r.supplierComments}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              {(r.pendingQuantity || 0) > 0 ? `${r.pendingQuantity} item(s) pending` : 'No pending items'}
                            </span>
                            {r.supplierComments && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>
                                Notes: {r.supplierComments}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenView(r)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                            title={viewMode === 'supplier' ? 'View Details & Provide Approval' : 'View Purchase Receipt Details'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {viewMode === 'supplier' && r.supplierApprovalStatus !== 'Approved' ? 'View / Approve' : 'View'}
                          </button>
                          {viewMode === 'buyer' && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                              title="Edit Receipt"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Edit
                            </button>
                          )}
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

                {/* PO Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    PO Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPoQuantity}
                    onChange={(e) => handleEditPoQuantityChange(e.target.value)}
                    placeholder="PO Quantity"
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
                  />
                </div>

                {/* Received Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editReceivedQuantity}
                    onChange={(e) => handleEditReceivedQuantityChange(e.target.value)}
                    placeholder="Received Quantity"
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

                {/* Pending Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Pending Quantity (Read-only)
                  </label>
                  <input
                    type="number"
                    value={editPendingQuantity}
                    readOnly
                    placeholder="PO - Received"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--accent-color)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
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

                {/* Invoice Number */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    placeholder="Auto-populated from Purchase Order"
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
                  />
                </div>

                {/* Invoice Amount */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editInvoiceAmount}
                    onChange={(e) => setEditInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Auto-populated from Purchase Order"
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
                  />
                </div>

                {/* Currency Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Currency Type
                  </label>
                  <input
                    type="text"
                    value={editCurrencyType}
                    readOnly
                    placeholder="Auto-populated from PO Price Currency"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
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

      {/* View Purchase Receipt Modal */}
      {viewingReceipt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '650px',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '12px',
              boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.4)',
              border: '2px solid #000000'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000000', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#000000', fontSize: '1.25rem', fontWeight: 700 }}>
                    Purchase Receipt Details
                  </h3>
                  <div style={{ color: '#000000', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}>
                    {viewingReceipt.receiptNo}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                style={{ background: '#ffffff', border: '1px solid #000000', color: '#000000', cursor: 'pointer', fontSize: '1.15rem', padding: '0.25rem 0.55rem', borderRadius: '4px', fontWeight: 700 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Receipt No */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Receipt Number
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                  {viewingReceipt.receiptNo}
                </span>
              </div>

              {/* Receipt Date */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Receipt Date
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#000000' }}>
                  {viewingReceipt.receiptDate}
                </span>
              </div>

              {/* Purchase Order */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Purchase Order
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  {viewingReceipt.purchaseOrderCode ? (
                    <div>
                      <strong style={{ color: '#000000', fontWeight: 700 }}>{viewingReceipt.purchaseOrderCode}</strong>
                      {viewingReceipt.purchaseOrderTitle && (
                        <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                          {viewingReceipt.purchaseOrderTitle}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </span>
              </div>

              {/* Buyer Information */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Buyer (Issued By)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  <div>{viewingReceipt.buyerName || 'Buyer'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                    {viewingReceipt.buyerEmail || ''}
                  </div>
                </span>
              </div>

              {/* Received From Supplier */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Received From (Supplier)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  <div>{viewingReceipt.receivedFromSupplierName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                    {viewingReceipt.receivedFromSupplierEmail}
                  </div>
                </span>
              </div>

              {/* Payment For Invoice */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Payment For (Invoice)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  {viewingReceipt.invoiceNumber ? (
                    <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem', border: '1px solid #000000', borderRadius: '4px', background: '#f8fafc', color: '#000000', fontWeight: 600, display: 'inline-block' }}>
                      {viewingReceipt.invoiceNumber}
                      {viewingReceipt.invoiceAmount !== undefined && viewingReceipt.invoiceAmount !== null
                        ? ` - ${viewingReceipt.currencyType || 'USD'} ${Number(viewingReceipt.invoiceAmount).toFixed(2)}`
                        : ''}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
              </div>

              {/* Received Status */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Received Status
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.3rem 0.7rem',
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    background: '#f8fafc',
                    color: '#000000',
                    fontWeight: 700,
                    display: 'inline-block'
                  }}
                >
                  {viewingReceipt.receivedStatus}
                </span>
              </div>
            </div>

            {/* Quantities Breakdown Card */}
            <div style={{ padding: '1rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #000000', marginBottom: '1.25rem', color: '#000000' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000000', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quantity Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>PO QUANTITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000000' }}>
                    {viewingReceipt.poQuantity !== undefined && viewingReceipt.poQuantity !== null ? viewingReceipt.poQuantity : '-'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>RECEIVED QUANTITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000000' }}>
                    {viewingReceipt.receivedQuantity !== undefined && viewingReceipt.receivedQuantity !== null ? viewingReceipt.receivedQuantity : viewingReceipt.quantity}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>PENDING QUANTITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (viewingReceipt.pendingQuantity || 0) > 0 ? '#b45309' : '#000000' }}>
                    {viewingReceipt.pendingQuantity !== undefined && viewingReceipt.pendingQuantity !== null ? viewingReceipt.pendingQuantity : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Product Items Table (Requirement 2 & 5) */}
            <div style={{ padding: '1rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #000000', marginBottom: '1.25rem', color: '#000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Delivery Product Items {viewingReceipt.items && viewingReceipt.items.length > 0 ? `(${viewingReceipt.items.length})` : ''}
                </div>
                {viewingReceipt.purchaseOrderCode && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                    Linked PO: {viewingReceipt.purchaseOrderCode}
                  </span>
                )}
              </div>

              {viewingReceipt.items && viewingReceipt.items.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000000', textAlign: 'left', background: '#f8fafc' }}>
                        <th style={{ padding: '0.5rem 0.75rem', color: '#000000', fontWeight: 700 }}>Product Name</th>
                        <th style={{ padding: '0.5rem 0.75rem', color: '#000000', fontWeight: 700 }}>Description</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#000000', fontWeight: 700 }}>Ordered Qty</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#000000', fontWeight: 700 }}>Unit</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#000000', fontWeight: 700 }}>Price</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#000000', fontWeight: 700 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReceipt.items.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#000000' }}>
                            {item.productName}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                            {item.fullDescription || '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#000000' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#475569' }}>
                            {item.unitMeasure || 'Units'}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#000000' }}>
                            {item.currencyType || 'USD'} {Number(item.price || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#000000' }}>
                            {item.currencyType || 'USD'} {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                  Delivery products associated with {viewingReceipt.purchaseOrderCode || 'Receipt'}. Quantity received: {viewingReceipt.receivedQuantity || viewingReceipt.quantity} of {viewingReceipt.poQuantity || viewingReceipt.quantity}.
                </div>
              )}
            </div>

            {/* Supplier Confirmation & Approval Status Card (Requirement 4: Visible to BOTH Buyer and Supplier) */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '10px',
                background: viewingReceipt.supplierApprovalStatus === 'Approved' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: viewingReceipt.supplierApprovalStatus === 'Approved' ? '2px solid #16a34a' : '2px solid #d97706',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={viewingReceipt.supplierApprovalStatus === 'Approved' ? '#16a34a' : '#d97706'} strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: viewingReceipt.supplierApprovalStatus === 'Approved' ? '#15803d' : '#b45309' }}>
                    Supplier Confirmation Status
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    background: viewingReceipt.supplierApprovalStatus === 'Approved' ? '#16a34a' : '#d97706',
                    color: '#ffffff'
                  }}
                >
                  {viewingReceipt.supplierApprovalStatus || 'Pending Approval'}
                </span>
              </div>

              {viewingReceipt.supplierConfirmationMessage ? (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
                    Confirmation Message (Visible to Buyer & Supplier):
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 600,
                      lineHeight: '1.4'
                    }}
                  >
                    {(() => {
                      const msg = viewingReceipt.supplierConfirmationMessage;
                      if (!msg || msg.toLowerCase().includes('still pending')) {
                        const qty = viewingReceipt.supplierApprovedPendingQuantity ?? viewingReceipt.pendingQuantity ?? 0;
                        return qty === 0 ? 'All Items Delivered' : 'Items Pending Delivery from Supplier';
                      }
                      return msg;
                    })()}
                  </div>
                  {viewingReceipt.supplierComments && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
                        Supplier Delivery Notes / Fulfillment Comments:
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 500,
                          lineHeight: '1.4'
                        }}
                      >
                        {viewingReceipt.supplierComments}
                      </div>
                    </div>
                  )}
                  {viewingReceipt.supplierApprovedAt && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                      Confirmed at: {new Date(viewingReceipt.supplierApprovedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.88rem', color: '#92400e', fontWeight: 500 }}>
                    Awaiting confirmation from supplier ({viewingReceipt.receivedFromSupplierName}). When confirmed, the pending items message will appear here for both Buyer and Supplier.
                  </div>
                  {viewingReceipt.supplierComments && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
                        Supplier Delivery Notes / Fulfillment Comments:
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 500,
                          lineHeight: '1.4'
                        }}
                      >
                        {viewingReceipt.supplierComments}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Supplier Action: Provide Approval for Items and Pending Items (Requirement 3 & 5) */}
            {(isSupplier || viewMode === 'supplier' || user?.role === 'ROLE_ADMIN') && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '2px solid #2563eb',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>
                    Supplier Approval: Confirm Pending Items & Delivery Fulfillment
                  </h4>
                </div>

                {approvalError && (
                  <div style={{ padding: '0.6rem 0.85rem', marginBottom: '0.85rem', background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {approvalError}
                  </div>
                )}
                {approvalSuccess && (
                  <div style={{ padding: '0.6rem 0.85rem', marginBottom: '0.85rem', background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {approvalSuccess}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Pending Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={supplierApprovedPendingQty}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10));
                        setSupplierApprovedPendingQty(val);
                        if (val === 0) {
                          setSupplierConfirmationMsg('All Items Delivered');
                        } else {
                          setSupplierConfirmationMsg('Items Pending Delivery from Supplier');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #94a3b8',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#000000',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Calculated from receipt: {viewingReceipt.pendingQuantity || 0}
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Confirmation Message (Visible to Buyer & Supplier):
                    </label>
                    <input
                      type="text"
                      value={supplierConfirmationMsg}
                      onChange={(e) => setSupplierConfirmationMsg(e.target.value)}
                      placeholder="e.g. All Items Delivered or Items Pending Delivery from Supplier"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #94a3b8',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#000000',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      This message is populated in the receipt and visible to both parties.
                    </small>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Supplier Delivery Notes / Fulfillment Comments (Optional):
                  </label>
                  <input
                    type="text"
                    value={supplierComments}
                    onChange={(e) => setSupplierComments(e.target.value)}
                    placeholder="e.g., Remaining pending items are scheduled for delivery by Friday."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.85rem',
                      color: '#000000',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSupplierApproval('Approved')}
                    disabled={approving}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.6rem 1.4rem',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {approving ? 'Submitting Confirmation...' : '✓ Approve & Confirm Pending Items'}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '2px solid #000000', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="btn"
                style={{
                  minWidth: '100px',
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #000000',
                  fontWeight: 700,
                  padding: '0.55rem 1.4rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReceipts;
