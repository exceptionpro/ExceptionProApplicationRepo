import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

export interface DeliveryProductItem {
  id: string;
  productName: string;
  fullDescription?: string;
  quantity: number;
  unitMeasure?: string;
  price: number;
  currencyType?: string;
}

export interface ReplacementRequestItem {
  id: string;
  requestNumber: string;
  requestDate: string;
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
  damagedQuantity: number;
  replacementQuantity: number;
  receivedStatus: string;
  supplierApprovalStatus?: string;
  supplierConfirmationMessage?: string;
  supplierApprovedReplacementQuantity?: number;
  supplierApprovedAt?: string;
  items?: DeliveryProductItem[];
  createdAt: string;
  updatedAt?: string;
}

const ReplacementRequests: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const accountTypeRaw = (user?.accountType || '').toLowerCase().trim();
  const isSupplier = accountTypeRaw.includes('supplier') || accountTypeRaw === '' || user?.role === 'ROLE_ADMIN';
  const isBuyer = accountTypeRaw.includes('buyer') || accountTypeRaw === '' || user?.role === 'ROLE_ADMIN';

  const isSupplierPath =
    location.pathname.includes('/replacements') ||
    location.pathname.includes('/replacement-confirmations') ||
    location.pathname.includes('/replacement-acknowledgements');

  const [viewMode, setViewMode] = useState<'buyer' | 'supplier'>(
    (!isBuyer && isSupplier) || isSupplierPath ? 'supplier' : 'buyer'
  );

  const [requests, setRequests] = useState<ReplacementRequestItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form State (Create Replacement Request)
  const [requestNumberSuffix, setRequestNumberSuffix] = useState<string>('001');
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');
  const [currencyType, setCurrencyType] = useState<string>('');
  const [damagedQuantity, setDamagedQuantity] = useState<number | ''>('');
  const [replacementQuantity, setReplacementQuantity] = useState<number | ''>('');
  const [receivedStatus, setReceivedStatus] = useState<string>('Initiated');

  // Edit Modal State
  const [editingRequest, setEditingRequest] = useState<ReplacementRequestItem | null>(null);
  const [editRequestNumberSuffix, setEditRequestNumberSuffix] = useState<string>('');
  const [editRequestDate, setEditRequestDate] = useState<string>('');
  const [editPoId, setEditPoId] = useState<string>('');
  const [editSupplierId, setEditSupplierId] = useState<string>('');
  const [editInvoiceId, setEditInvoiceId] = useState<string>('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState<string>('');
  const [editInvoiceAmount, setEditInvoiceAmount] = useState<number | ''>('');
  const [editCurrencyType, setEditCurrencyType] = useState<string>('');
  const [editDamagedQuantity, setEditDamagedQuantity] = useState<number | ''>('');
  const [editReplacementQuantity, setEditReplacementQuantity] = useState<number | ''>('');
  const [editReceivedStatus, setEditReceivedStatus] = useState<string>('Initiated');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // View Modal & Supplier Approval State
  const [viewingRequest, setViewingRequest] = useState<ReplacementRequestItem | null>(null);
  const [selectedSupplierAction, setSelectedSupplierAction] = useState<string>('Accept Request');
  const [supplierApprovedReplacementQty, setSupplierApprovedReplacementQty] = useState<number | ''>('');
  const [supplierConfirmationMsg, setSupplierConfirmationMsg] = useState<string>('');
  const [approving, setApproving] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string>('');
  const [approvalSuccess, setApprovalSuccess] = useState<string>('');

  useEffect(() => {
    if ((!isBuyer && isSupplier) || isSupplierPath) {
      setViewMode('supplier');
    }
  }, [location.pathname, isBuyer, isSupplier, isSupplierPath]);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const isSupplierOnly = viewMode === 'supplier' && isSupplier && !isBuyer;
      const requestsUrl = isSupplierOnly
        ? '/api/replacement-requests/supplier'
        : viewMode === 'supplier'
          ? '/api/replacement-requests?role=supplier'
          : '/api/replacement-requests';

      const promises: Promise<any>[] = [
        api.get(requestsUrl).catch(() => ({ data: [] }))
      ];

      if (isBuyer) {
        promises.push(
          api.get('/api/replacement-requests/purchase-orders').catch(() => ({ data: [] })),
          api.get('/api/replacement-requests/connected-suppliers').catch(() => ({ data: [] })),
          api.get('/api/replacement-requests/invoices').catch(() => ({ data: [] }))
        );
      } else {
        promises.push(
          Promise.resolve({ data: [] }),
          Promise.resolve({ data: [] }),
          Promise.resolve({ data: [] })
        );
      }

      const [requestsRes, posRes, suppliersRes, invoicesRes] = await Promise.all(promises);

      const loadedRequests = requestsRes.data || [];
      setRequests(loadedRequests);
      setPurchaseOrders(posRes?.data || []);
      setSuppliers(suppliersRes?.data || []);
      setInvoices(invoicesRes?.data || []);

      if (loadedRequests.length > 0) {
        const nextNum = (loadedRequests.length + 1).toString().padStart(3, '0');
        setRequestNumberSuffix(nextNum);
      } else {
        setRequestNumberSuffix('001');
      }
    } catch (err: any) {
      console.error('Error loading replacement requests data:', err);
      setError(err.response?.data?.message || 'Failed to load replacement requests data.');
    } finally {
      setLoading(false);
    }
  };

  // Invoices created by Suppliers based on selected Purchase Order
  const filteredInvoicesForSelectedPo = selectedPoId
    ? invoices.filter((inv) => inv.purchaseOrderId && String(inv.purchaseOrderId) === String(selectedPoId))
    : invoices;

  const filteredInvoicesForEditPo = editPoId
    ? invoices.filter((inv) => inv.purchaseOrderId && String(inv.purchaseOrderId) === String(editPoId))
    : invoices;

  const getExistingReplacementForPo = (poId: string): ReplacementRequestItem | undefined => {
    if (!poId) return undefined;
    const matchedPo = purchaseOrders.find((p) => String(p.id) === String(poId));
    return requests.find(
      (r) =>
        (r.purchaseOrderId && String(r.purchaseOrderId) === String(poId)) ||
        (matchedPo?.code && r.purchaseOrderCode && r.purchaseOrderCode === matchedPo.code)
    );
  };

  const existingReplacementForSelectedPo = getExistingReplacementForPo(selectedPoId);
  const isReadOnlyReplacementMode = Boolean(existingReplacementForSelectedPo);

  const handleSuffixChange = (val: string, isEdit = false) => {
    if (!isEdit && isReadOnlyReplacementMode) return;
    const cleaned = val.replace(/\D/g, '');
    if (isEdit) {
      setEditRequestNumberSuffix(cleaned);
    } else {
      setRequestNumberSuffix(cleaned);
    }
  };

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    setError('');
    setSuccess('');

    if (!poId) {
      const nextNum = (requests.length + 1).toString().padStart(3, '0');
      setRequestNumberSuffix(nextNum);
      setRequestDate(new Date().toISOString().split('T')[0]);
      setSelectedSupplierId('');
      setSelectedInvoiceId('');
      setInvoiceNumber('');
      setInvoiceAmount('');
      setCurrencyType('');
      setDamagedQuantity('');
      setReplacementQuantity('');
      setReceivedStatus('Initiated');
      return;
    }

    const matchedPo = purchaseOrders.find((p) => String(p.id) === String(poId));
    const poInvoices = invoices.filter(
      (inv) => inv.purchaseOrderId && String(inv.purchaseOrderId) === String(poId)
    );
    const existingReplacement = getExistingReplacementForPo(poId);

    // If Replacement Request is already created for this Purchase Order, populate and display all details in read-only mode
    if (existingReplacement) {
      const match = existingReplacement.requestNumber.match(/RR\s*-\s*(.*)/i);
      const suffix = match ? match[1].trim() : existingReplacement.requestNumber.replace(/\D/g, '');
      setRequestNumberSuffix(suffix || '001');
      setRequestDate(existingReplacement.requestDate || new Date().toISOString().split('T')[0]);
      setSelectedSupplierId(
        existingReplacement.receivedFromSupplierId
          ? String(existingReplacement.receivedFromSupplierId)
          : matchedPo?.supplierId
            ? String(matchedPo.supplierId)
            : ''
      );

      const matchedInv =
        poInvoices.find(
          (inv) =>
            (existingReplacement.invoiceId && String(inv.id) === String(existingReplacement.invoiceId)) ||
            (existingReplacement.invoiceNumber && inv.invoiceNumber === existingReplacement.invoiceNumber)
        ) || poInvoices[0];

      setSelectedInvoiceId(
        existingReplacement.invoiceId
          ? String(existingReplacement.invoiceId)
          : matchedInv?.id
            ? String(matchedInv.id)
            : matchedPo?.invoiceId
              ? String(matchedPo.invoiceId)
              : ''
      );
      setInvoiceNumber(
        existingReplacement.invoiceNumber || matchedInv?.invoiceNumber || matchedPo?.invoiceNumber || ''
      );
      setInvoiceAmount(
        existingReplacement.invoiceAmount !== undefined && existingReplacement.invoiceAmount !== null
          ? existingReplacement.invoiceAmount
          : matchedInv?.totalAmount !== undefined && matchedInv?.totalAmount !== null
            ? matchedInv.totalAmount
            : matchedPo?.invoiceAmount !== undefined && matchedPo?.invoiceAmount !== null
              ? matchedPo.invoiceAmount
              : ''
      );
      setCurrencyType(
        existingReplacement.currencyType ||
        matchedInv?.currencyType ||
        matchedPo?.invoiceCurrencyType ||
        matchedPo?.currencyType ||
        'USD'
      );
      setDamagedQuantity(
        existingReplacement.damagedQuantity !== undefined && existingReplacement.damagedQuantity !== null
          ? existingReplacement.damagedQuantity
          : 0
      );
      setReplacementQuantity(
        existingReplacement.replacementQuantity !== undefined && existingReplacement.replacementQuantity !== null
          ? existingReplacement.replacementQuantity
          : 0
      );
      setReceivedStatus(existingReplacement.receivedStatus || 'Initiated');
      return;
    }

    // Fresh Create Mode for selected Purchase Order (no Replacement Request created yet)
    const nextNum = (requests.length + 1).toString().padStart(3, '0');
    setRequestNumberSuffix(nextNum);
    setRequestDate(new Date().toISOString().split('T')[0]);
    setDamagedQuantity('');
    setReplacementQuantity('');
    setReceivedStatus('Initiated');

    if (matchedPo && matchedPo.supplierId) {
      setSelectedSupplierId(String(matchedPo.supplierId));
    } else {
      setSelectedSupplierId('');
    }

    if (poInvoices.length > 0) {
      const firstInv = poInvoices[0];
      setSelectedInvoiceId(String(firstInv.id));
      setInvoiceNumber(firstInv.invoiceNumber || '');
      setInvoiceAmount(
        firstInv.totalAmount !== undefined && firstInv.totalAmount !== null ? firstInv.totalAmount : ''
      );
      setCurrencyType(firstInv.currencyType || matchedPo?.invoiceCurrencyType || matchedPo?.currencyType || 'USD');
    } else if (matchedPo && (matchedPo.invoiceId || matchedPo.invoiceNumber)) {
      setSelectedInvoiceId(matchedPo.invoiceId ? String(matchedPo.invoiceId) : '');
      setInvoiceNumber(matchedPo.invoiceNumber || '');
      setInvoiceAmount(
        matchedPo.invoiceAmount !== undefined && matchedPo.invoiceAmount !== null ? matchedPo.invoiceAmount : ''
      );
      setCurrencyType(matchedPo.invoiceCurrencyType || matchedPo.currencyType || 'USD');
    } else {
      setSelectedInvoiceId('');
      setInvoiceNumber('');
      setInvoiceAmount('');
      setCurrencyType(matchedPo?.currencyType || '');
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    if (isReadOnlyReplacementMode) return;
    setSelectedInvoiceId(invoiceId);
    setError('');

    if (!invoiceId) {
      setInvoiceNumber('');
      setInvoiceAmount('');
      setCurrencyType('');
      return;
    }

    const matchedInvoice = invoices.find((inv) => String(inv.id) === String(invoiceId));
    if (matchedInvoice) {
      setInvoiceNumber(matchedInvoice.invoiceNumber || '');
      setInvoiceAmount(
        matchedInvoice.totalAmount !== undefined && matchedInvoice.totalAmount !== null
          ? matchedInvoice.totalAmount
          : ''
      );
      const matchedPo = purchaseOrders.find(
        (p) => String(p.id) === String(matchedInvoice.purchaseOrderId || selectedPoId)
      );
      setCurrencyType(
        matchedInvoice.currencyType || matchedPo?.invoiceCurrencyType || matchedPo?.currencyType || 'USD'
      );
      if (!selectedPoId && matchedInvoice.purchaseOrderId) {
        setSelectedPoId(String(matchedInvoice.purchaseOrderId));
      }
      if (!selectedSupplierId && matchedInvoice.supplierId) {
        setSelectedSupplierId(String(matchedInvoice.supplierId));
      }
    }
  };

  const handleCancel = () => {
    const nextNum = (requests.length + 1).toString().padStart(3, '0');
    setRequestNumberSuffix(nextNum);
    setRequestDate(new Date().toISOString().split('T')[0]);
    setSelectedPoId('');
    setSelectedSupplierId('');
    setSelectedInvoiceId('');
    setInvoiceNumber('');
    setInvoiceAmount('');
    setCurrencyType('');
    setDamagedQuantity('');
    setReplacementQuantity('');
    setReceivedStatus('Initiated');
    setError('');
    setSuccess('');
  };

  const handleCreateReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isReadOnlyReplacementMode) {
      return;
    }

    if (!requestNumberSuffix.trim()) {
      setError('Please enter a Request Number.');
      return;
    }

    if (!requestDate) {
      setError('Please select a Request Date.');
      return;
    }

    if (!selectedPoId) {
      setError('Please select a Purchase Order.');
      return;
    }

    if (!selectedSupplierId) {
      setError('Please select a Supplier in Received From.');
      return;
    }

    if (!selectedInvoiceId && !invoiceNumber.trim()) {
      setError('Please select an Invoice Number.');
      return;
    }

    if (damagedQuantity === '' || isNaN(Number(damagedQuantity)) || Number(damagedQuantity) < 0) {
      setError('Please enter a valid Damaged Quantity.');
      return;
    }

    if (replacementQuantity === '' || isNaN(Number(replacementQuantity)) || Number(replacementQuantity) < 0) {
      setError('Please enter a valid Replacement Quantity.');
      return;
    }

    if (!receivedStatus.trim()) {
      setError('Please select a Received status.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requestNumber: `RR - ${requestNumberSuffix.trim()}`,
        requestDate,
        purchaseOrderId: selectedPoId,
        receivedFromSupplierId: selectedSupplierId,
        invoiceId: selectedInvoiceId || null,
        invoiceNumber: invoiceNumber.trim() || null,
        invoiceAmount: invoiceAmount !== '' ? Number(invoiceAmount) : null,
        currencyType: currencyType.trim() || 'USD',
        damagedQuantity: Number(damagedQuantity),
        replacementQuantity: Number(replacementQuantity),
        receivedStatus: receivedStatus.trim()
      };

      const res = await api.post('/api/replacement-requests', payload);
      const createdRequestNo = res.data.requestNumber;
      await loadData();
      setRequestDate(new Date().toISOString().split('T')[0]);
      setSelectedPoId('');
      setSelectedSupplierId('');
      setSelectedInvoiceId('');
      setInvoiceNumber('');
      setInvoiceAmount('');
      setCurrencyType('');
      setDamagedQuantity('');
      setReplacementQuantity('');
      setReceivedStatus('Initiated');
      setSuccess(`Replacement Request ${createdRequestNo} created successfully!`);
    } catch (err: any) {
      console.error('Error creating replacement request:', err);
      setError(err.response?.data?.message || 'Failed to create Replacement Request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Handlers
  const handleOpenEdit = (reqItem: ReplacementRequestItem) => {
    setEditingRequest(reqItem);
    const match = reqItem.requestNumber.match(/RR\s*-\s*(.*)/i);
    const suffix = match ? match[1].trim() : reqItem.requestNumber.replace(/\D/g, '');
    setEditRequestNumberSuffix(suffix || '001');
    setEditRequestDate(reqItem.requestDate || new Date().toISOString().split('T')[0]);
    setEditPoId(reqItem.purchaseOrderId || '');
    setEditSupplierId(reqItem.receivedFromSupplierId || '');

    const matchedPo = purchaseOrders.find((p) => String(p.id) === String(reqItem.purchaseOrderId));
    const matchedInvoice = invoices.find(
      (inv) =>
        (reqItem.invoiceId && String(inv.id) === String(reqItem.invoiceId)) ||
        (reqItem.purchaseOrderId && String(inv.purchaseOrderId) === String(reqItem.purchaseOrderId))
    );

    setEditInvoiceId(reqItem.invoiceId || matchedInvoice?.id || matchedPo?.invoiceId || '');
    setEditInvoiceNumber(reqItem.invoiceNumber || matchedInvoice?.invoiceNumber || matchedPo?.invoiceNumber || '');
    setEditInvoiceAmount(
      reqItem.invoiceAmount !== undefined && reqItem.invoiceAmount !== null
        ? reqItem.invoiceAmount
        : matchedInvoice?.totalAmount !== undefined && matchedInvoice?.totalAmount !== null
          ? matchedInvoice.totalAmount
          : ''
    );
    setEditCurrencyType(
      reqItem.currencyType || matchedInvoice?.currencyType || matchedPo?.invoiceCurrencyType || matchedPo?.currencyType || 'USD'
    );
    setEditDamagedQuantity(reqItem.damagedQuantity !== undefined && reqItem.damagedQuantity !== null ? reqItem.damagedQuantity : '');
    setEditReplacementQuantity(
      reqItem.replacementQuantity !== undefined && reqItem.replacementQuantity !== null ? reqItem.replacementQuantity : ''
    );
    setEditReceivedStatus(reqItem.receivedStatus || 'Initiated');
    setEditError('');
    setError('');
    setSuccess('');
  };

  const handleEditPoChange = (poId: string) => {
    setEditPoId(poId);
    setEditError('');

    if (!poId) {
      setEditInvoiceId('');
      setEditInvoiceNumber('');
      setEditInvoiceAmount('');
      setEditCurrencyType('');
      return;
    }

    const matchedPo = purchaseOrders.find((p) => String(p.id) === String(poId));
    if (matchedPo && matchedPo.supplierId) {
      setEditSupplierId(String(matchedPo.supplierId));
    }

    const poInvoices = invoices.filter(
      (inv) => inv.purchaseOrderId && String(inv.purchaseOrderId) === String(poId)
    );

    if (poInvoices.length > 0) {
      const firstInv = poInvoices[0];
      setEditInvoiceId(String(firstInv.id));
      setEditInvoiceNumber(firstInv.invoiceNumber || '');
      setEditInvoiceAmount(
        firstInv.totalAmount !== undefined && firstInv.totalAmount !== null ? firstInv.totalAmount : ''
      );
      setEditCurrencyType(firstInv.currencyType || matchedPo?.invoiceCurrencyType || matchedPo?.currencyType || 'USD');
    } else if (matchedPo && (matchedPo.invoiceId || matchedPo.invoiceNumber)) {
      setEditInvoiceId(matchedPo.invoiceId ? String(matchedPo.invoiceId) : '');
      setEditInvoiceNumber(matchedPo.invoiceNumber || '');
      setEditInvoiceAmount(
        matchedPo.invoiceAmount !== undefined && matchedPo.invoiceAmount !== null ? matchedPo.invoiceAmount : ''
      );
      setEditCurrencyType(matchedPo.invoiceCurrencyType || matchedPo.currencyType || 'USD');
    } else {
      setEditInvoiceId('');
      setEditInvoiceNumber('');
      setEditInvoiceAmount('');
      setEditCurrencyType(matchedPo?.currencyType || '');
    }
  };

  const handleEditInvoiceChange = (invoiceId: string) => {
    setEditInvoiceId(invoiceId);
    setEditError('');

    if (!invoiceId) {
      setEditInvoiceNumber('');
      setEditInvoiceAmount('');
      setEditCurrencyType('');
      return;
    }

    const matchedInvoice = invoices.find((inv) => String(inv.id) === String(invoiceId));
    if (matchedInvoice) {
      setEditInvoiceNumber(matchedInvoice.invoiceNumber || '');
      setEditInvoiceAmount(
        matchedInvoice.totalAmount !== undefined && matchedInvoice.totalAmount !== null
          ? matchedInvoice.totalAmount
          : ''
      );
      const matchedPo = purchaseOrders.find(
        (p) => String(p.id) === String(matchedInvoice.purchaseOrderId || editPoId)
      );
      setEditCurrencyType(
        matchedInvoice.currencyType || matchedPo?.invoiceCurrencyType || matchedPo?.currencyType || 'USD'
      );
      if (!editPoId && matchedInvoice.purchaseOrderId) {
        setEditPoId(String(matchedInvoice.purchaseOrderId));
      }
      if (!editSupplierId && matchedInvoice.supplierId) {
        setEditSupplierId(String(matchedInvoice.supplierId));
      }
    }
  };

  const handleUpdateReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setEditError('');
    setError('');
    setSuccess('');

    if (!editRequestNumberSuffix.trim()) {
      setEditError('Please enter a Request Number.');
      return;
    }

    if (!editRequestDate) {
      setEditError('Please select a Request Date.');
      return;
    }

    if (!editPoId) {
      setEditError('Please select a Purchase Order.');
      return;
    }

    if (!editSupplierId) {
      setEditError('Please select a Supplier in Received From.');
      return;
    }

    if (!editInvoiceId && !editInvoiceNumber.trim()) {
      setEditError('Please select an Invoice Number.');
      return;
    }

    if (editDamagedQuantity === '' || isNaN(Number(editDamagedQuantity)) || Number(editDamagedQuantity) < 0) {
      setEditError('Please enter a valid Damaged Quantity.');
      return;
    }

    if (editReplacementQuantity === '' || isNaN(Number(editReplacementQuantity)) || Number(editReplacementQuantity) < 0) {
      setEditError('Please enter a valid Replacement Quantity.');
      return;
    }

    if (!editReceivedStatus.trim()) {
      setEditError('Please select a Received status.');
      return;
    }

    setEditSubmitting(true);
    try {
      const payload = {
        requestNumber: `RR - ${editRequestNumberSuffix.trim()}`,
        requestDate: editRequestDate,
        purchaseOrderId: editPoId,
        receivedFromSupplierId: editSupplierId,
        invoiceId: editInvoiceId || null,
        invoiceNumber: editInvoiceNumber.trim() || null,
        invoiceAmount: editInvoiceAmount !== '' ? Number(editInvoiceAmount) : null,
        currencyType: editCurrencyType.trim() || 'USD',
        damagedQuantity: Number(editDamagedQuantity),
        replacementQuantity: Number(editReplacementQuantity),
        receivedStatus: editReceivedStatus.trim()
      };

      const res = await api.put(`/api/replacement-requests/${editingRequest.id}`, payload);
      setSuccess(`Replacement Request ${res.data.requestNumber} updated successfully!`);
      setEditingRequest(null);
      await loadData();
    } catch (err: any) {
      console.error('Error updating replacement request:', err);
      setEditError(err.response?.data?.message || 'Failed to update Replacement Request.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenView = (reqItem: ReplacementRequestItem) => {
    setViewingRequest(reqItem);
    const existingStatus =
      reqItem.supplierApprovalStatus && reqItem.supplierApprovalStatus !== 'Pending Approval'
        ? reqItem.supplierApprovalStatus
        : 'Accept Request';
    setSelectedSupplierAction(existingStatus);

    const defaultApprovedQty =
      reqItem.supplierApprovedReplacementQuantity !== undefined && reqItem.supplierApprovedReplacementQuantity !== null
        ? reqItem.supplierApprovedReplacementQuantity
        : reqItem.replacementQuantity;
    setSupplierApprovedReplacementQty(defaultApprovedQty);
    setSupplierConfirmationMsg(reqItem.supplierConfirmationMessage || '');
    setApprovalError('');
    setApprovalSuccess('');
  };

  const handleSupplierApproval = async (actionStatus: string) => {
    if (
      !viewingRequest ||
      (viewingRequest.supplierApprovalStatus && viewingRequest.supplierApprovalStatus !== 'Pending Approval')
    ) {
      return;
    }
    setApprovalError('');
    setApprovalSuccess('');
    setSelectedSupplierAction(actionStatus);

    const trimmedMsg = supplierConfirmationMsg.trim();
    if (!trimmedMsg) {
      setApprovalError('Supplier confirmation message is mandatory. Please provide a message around 200 characters in length.');
      return;
    }

    let approvedQty = viewingRequest.replacementQuantity;
    if (actionStatus === 'Accept Request') {
      approvedQty = viewingRequest.replacementQuantity;
    } else if (actionStatus === 'Partially Accept') {
      approvedQty =
        supplierApprovedReplacementQty !== ''
          ? Number(supplierApprovedReplacementQty)
          : Math.max(1, viewingRequest.replacementQuantity - 1);
    } else if (actionStatus === 'Reject Request') {
      approvedQty = 0;
    }

    setApproving(true);
    try {
      const payload = {
        status: actionStatus,
        confirmationMessage: trimmedMsg,
        approvedReplacementQuantity: approvedQty
      };

      const res = await api.post(`/api/replacement-requests/${viewingRequest.id}/supplier-approval`, payload);
      setViewingRequest(res.data);
      setRequests((prev) => prev.map((r) => (r.id === res.data.id ? res.data : r)));
      setApprovalSuccess(`Replacement confirmation "${actionStatus}" submitted successfully!`);
      setSuccess(`Supplier confirmation (${actionStatus}) submitted for ${res.data.requestNumber}`);
    } catch (err: any) {
      console.error('Error submitting supplier replacement approval:', err);
      setApprovalError(err.response?.data?.message || 'Failed to submit supplier replacement confirmation.');
    } finally {
      setApproving(false);
    }
  };

  const getBadgeStyleForApproval = (status?: string) => {
    if (status === 'Accept Request') {
      return {
        background: 'rgba(22, 163, 74, 0.15)',
        color: '#16a34a',
        border: '1px solid rgba(22, 163, 74, 0.35)'
      };
    }
    if (status === 'Partially Accept') {
      return {
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.35)'
      };
    }
    if (status === 'Reject Request') {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.35)'
      };
    }
    return {
      background: 'rgba(148, 163, 184, 0.15)',
      color: 'var(--text-secondary)',
      border: '1px solid rgba(148, 163, 184, 0.3)'
    };
  };

  return (
    <div className="feed-layout-container" style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <LeftNavigation activePage="replacement-requests" />

      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Page Header */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              {viewMode === 'supplier' ? 'Replacements' : 'Replacement Requests'}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {viewMode === 'supplier'
                ? 'Replacements Confirmations / Replacements Acknowledgements — View buyer-created replacements for delivery product items and provide supplier approvals.'
                : 'Create and manage replacement requests for damaged items against Purchase Orders and Supplier Invoices.'}
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
                  Buyer Replacement Requests
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('supplier')}
                  className={`btn ${viewMode === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Replacements Acknowledgements
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

        {/* Create Replacement Requests Form Card (Only shown in Buyer view) */}
        {viewMode === 'buyer' && (
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Create Replacement Requests
            </h3>

            <form onSubmit={handleCreateReplacement}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* a) Request Number */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Request Number <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                      RR -
                    </span>
                    <input
                      type="text"
                      value={requestNumberSuffix}
                      onChange={(e) => handleSuffixChange(e.target.value)}
                      readOnly={isReadOnlyReplacementMode}
                      placeholder="001"
                      pattern="[0-9]*"
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid var(--border-color)',
                        background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'text'
                      }}
                      required
                    />
                  </div>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Enter only digits (e.g. 001, 002). Formats as: <strong>RR - {requestNumberSuffix || '___'}</strong>
                  </small>
                </div>

                {/* b) Request Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Request Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => {
                      if (!isReadOnlyReplacementMode) setRequestDate(e.target.value);
                    }}
                    readOnly={isReadOnlyReplacementMode}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'text'
                    }}
                    required
                  />
                </div>

                {/* c) Purchase Order Dropdown */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Purchase Order <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                    required
                  >
                    <option value="">-- Select Purchase Order --</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.code} - {po.title} ({po.status})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Purchase Orders created by the Buyer.
                  </small>
                </div>

                {/* d) Received From Dropdown */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received From <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      if (!isReadOnlyReplacementMode) setSelectedSupplierId(e.target.value);
                    }}
                    disabled={isReadOnlyReplacementMode}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'pointer'
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
                    Suppliers connected to this Buyer.
                  </small>
                </div>

                {/* e) Invoice Number Dropdown */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Number <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    disabled={isReadOnlyReplacementMode}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'pointer'
                    }}
                    required
                  >
                    <option value="">
                      {selectedPoId
                        ? filteredInvoicesForSelectedPo.length > 0
                          ? '-- Select Invoice Number --'
                          : invoiceNumber
                            ? invoiceNumber
                            : '-- No Invoice Found for Selected PO --'
                        : '-- Select Invoice Number --'}
                    </option>
                    {filteredInvoicesForSelectedPo.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber}
                        {inv.purchaseOrderCode ? ` (${inv.purchaseOrderCode})` : ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Invoices created by Suppliers based on Purchase Order.
                  </small>
                </div>

                {/* f) Invoice Amount */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Amount <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    readOnly
                    placeholder="Auto-populated from Invoice"
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
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Populated from selected Invoice Amount.
                  </small>
                </div>

                {/* g) Currency Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Currency Type <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={currencyType}
                    onChange={(e) => setCurrencyType(e.target.value)}
                    readOnly
                    placeholder="Auto-populated from Invoice Amount Currency"
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
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Populated from Invoice Amount Currency.
                  </small>
                </div>

                {/* i) Damaged Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Damaged Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={damagedQuantity}
                    onChange={(e) => {
                      if (!isReadOnlyReplacementMode) {
                        setDamagedQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)));
                      }
                    }}
                    readOnly={isReadOnlyReplacementMode}
                    placeholder="Enter damaged quantity"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'text'
                    }}
                    required
                  />
                </div>

                {/* j) Replacement Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Replacement Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={replacementQuantity}
                    onChange={(e) => {
                      if (!isReadOnlyReplacementMode) {
                        setReplacementQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)));
                      }
                    }}
                    readOnly={isReadOnlyReplacementMode}
                    placeholder="Enter replacement quantity"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'text'
                    }}
                    required
                  />
                </div>

                {/* k) Received Dropdown */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={receivedStatus}
                    onChange={(e) => {
                      if (!isReadOnlyReplacementMode) setReceivedStatus(e.target.value);
                    }}
                    disabled={isReadOnlyReplacementMode}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: isReadOnlyReplacementMode ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'pointer'
                    }}
                    required
                  >
                    <option value="Initiated">Initiated</option>
                    <option value="Fully Received">Fully Received</option>
                    <option value="Partial Received">Partial Received</option>
                  </select>
                </div>
              </div>

              {/* l) Create Replacement button and Cancel button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ minWidth: '110px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isReadOnlyReplacementMode}
                  onClick={(e) => {
                    if (isReadOnlyReplacementMode) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  className="btn btn-primary"
                  style={{
                    minWidth: '170px',
                    opacity: isReadOnlyReplacementMode ? 0.6 : 1,
                    cursor: isReadOnlyReplacementMode ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Replacement'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Created Replacement Requests / Replacements Confirmations List */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {viewMode === 'supplier'
                ? `Replacements Confirmations / Replacements Acknowledgements (${requests.length})`
                : `Replacement Requests History (${requests.length})`}
            </h3>
            <button
              onClick={loadData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
              title="Refresh Replacement Requests"
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
              Loading replacement requests...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {viewMode === 'supplier' ? 'No Replacement Requests Found for Confirmation' : 'No Replacement Requests Found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {viewMode === 'supplier'
                  ? 'Replacement requests created by buyers for your delivery product items will appear here for acknowledgement and approval.'
                  : 'Fill out the form above to create a replacement request.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Request Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Request Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Purchase Order</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{viewMode === 'supplier' ? 'Buyer' : 'Received From'}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice Amount</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Damaged Qty</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Replacement Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Received</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Supplier Confirmation</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Confirmation Message</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
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
                        {r.requestNumber}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        {r.requestDate}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        {r.purchaseOrderCode ? (
                          <span>
                            <strong>{r.purchaseOrderCode}</strong>
                            {r.purchaseOrderTitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.purchaseOrderTitle}</div>}
                          </span>
                        ) : (
                          '-'
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
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {r.invoiceAmount !== undefined && r.invoiceAmount !== null
                          ? `${r.currencyType || 'USD'} ${Number(r.invoiceAmount).toFixed(2)}`
                          : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}>
                        {r.damagedQuantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#10b981' }}>
                        {r.replacementQuantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              r.receivedStatus === 'Fully Received'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : r.receivedStatus === 'Partial Received'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                            color:
                              r.receivedStatus === 'Fully Received'
                                ? '#10b981'
                                : r.receivedStatus === 'Partial Received'
                                  ? '#f59e0b'
                                  : '#3b82f6'
                          }}
                        >
                          {r.receivedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block',
                            ...getBadgeStyleForApproval(r.supplierApprovalStatus)
                          }}
                        >
                          {r.supplierApprovalStatus || 'Pending Approval'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', maxWidth: '240px', fontSize: '0.85rem' }}>
                        {r.supplierConfirmationMessage ? (
                          <div style={{ wordBreak: 'break-word', fontWeight: 500 }}>
                            {r.supplierConfirmationMessage}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Awaiting Supplier Confirmation
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenView(r)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                            title={viewMode === 'supplier' ? 'View Replacement Items & Provide Approval' : 'View Replacement Request Details'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {viewMode === 'supplier' && (!r.supplierApprovalStatus || r.supplierApprovalStatus === 'Pending Approval')
                              ? 'View / Approve'
                              : 'View'}
                          </button>
                          {viewMode === 'buyer' && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                              title="Edit Replacement Request"
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

      {/* Edit Replacement Request Modal */}
      {editingRequest && (
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
              maxWidth: '680px',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                Edit Replacement Request ({editingRequest.requestNumber})
              </h3>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid var(--danger-color)', color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', fontSize: '0.88rem' }}>
                <strong>Error: </strong> {editError}
              </div>
            )}

            <form onSubmit={handleUpdateReplacement}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Request Number */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Request Number <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                      RR -
                    </span>
                    <input
                      type="text"
                      value={editRequestNumberSuffix}
                      onChange={(e) => handleSuffixChange(e.target.value, true)}
                      placeholder="001"
                      pattern="[0-9]*"
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

                {/* Request Date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Request Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editRequestDate}
                    onChange={(e) => setEditRequestDate(e.target.value)}
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
                    Purchase Order <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                    required
                  >
                    <option value="">-- Select Purchase Order --</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.code} - {po.title} ({po.status})
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
                    Invoice Number <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <select
                    value={editInvoiceId}
                    onChange={(e) => handleEditInvoiceChange(e.target.value)}
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
                    required={!editInvoiceNumber}
                  >
                    <option value="">
                      {editPoId
                        ? filteredInvoicesForEditPo.length > 0
                          ? '-- Select Invoice Number --'
                          : editInvoiceNumber
                            ? editInvoiceNumber
                            : '-- No Invoice Found for Selected PO --'
                        : '-- Select Invoice Number --'}
                    </option>
                    {filteredInvoicesForEditPo.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber}
                        {inv.purchaseOrderCode ? ` (${inv.purchaseOrderCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Amount */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Invoice Amount <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editInvoiceAmount}
                    onChange={(e) => setEditInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    readOnly
                    placeholder="Auto-populated from Invoice"
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
                    required
                  />
                </div>

                {/* Currency Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Currency Type <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editCurrencyType}
                    readOnly
                    placeholder="Auto-populated from Invoice Currency"
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
                    required
                  />
                </div>

                {/* Damaged Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Damaged Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editDamagedQuantity}
                    onChange={(e) => setEditDamagedQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                    placeholder="Enter damaged quantity"
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

                {/* Replacement Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Replacement Quantity <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editReplacementQuantity}
                    onChange={(e) => setEditReplacementQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                    placeholder="Enter replacement quantity"
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

                {/* Received Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Received <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                    <option value="Initiated">Initiated</option>
                    <option value="Fully Received">Fully Received</option>
                    <option value="Partial Received">Partial Received</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
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
                  {editSubmitting ? 'Saving...' : 'Update Replacement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Replacement Request & Supplier Approval Modal */}
      {viewingRequest && (
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
              maxWidth: '720px',
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
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#000000', fontSize: '1.25rem', fontWeight: 700 }}>
                    Replacement Request Details
                  </h3>
                  <div style={{ color: '#000000', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}>
                    {viewingRequest.requestNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                style={{ background: '#ffffff', border: '1px solid #000000', color: '#000000', cursor: 'pointer', fontSize: '1.15rem', padding: '0.25rem 0.55rem', borderRadius: '4px', fontWeight: 700 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Request Number
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                  {viewingRequest.requestNumber}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Request Date
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#000000' }}>
                  {viewingRequest.requestDate}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Purchase Order
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  {viewingRequest.purchaseOrderCode ? (
                    <div>
                      <strong style={{ color: '#000000', fontWeight: 700 }}>{viewingRequest.purchaseOrderCode}</strong>
                      {viewingRequest.purchaseOrderTitle && (
                        <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                          {viewingRequest.purchaseOrderTitle}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Buyer (Requested By)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  <div>{viewingRequest.buyerName || 'Buyer'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                    {viewingRequest.buyerEmail || ''}
                  </div>
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Received From (Supplier)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  <div>{viewingRequest.receivedFromSupplierName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#000000', marginTop: '2px', fontWeight: 500 }}>
                    {viewingRequest.receivedFromSupplierEmail}
                  </div>
                </span>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000', color: '#000000' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#000000', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                  Invoice Details
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>
                  {viewingRequest.invoiceNumber ? (
                    <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem', border: '1px solid #000000', borderRadius: '4px', background: '#f8fafc', color: '#000000', fontWeight: 600, display: 'inline-block' }}>
                      {viewingRequest.invoiceNumber}
                      {viewingRequest.invoiceAmount !== undefined && viewingRequest.invoiceAmount !== null
                        ? ` - ${viewingRequest.currencyType || 'USD'} ${Number(viewingRequest.invoiceAmount).toFixed(2)}`
                        : ''}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>

            {/* Replacement Quantities Card */}
            <div style={{ padding: '1rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #000000', marginBottom: '1.25rem', color: '#000000' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000000', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Replacement Quantity Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>DAMAGED QUANTITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                    {viewingRequest.damagedQuantity}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>REPLACEMENT QUANTITY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {viewingRequest.replacementQuantity}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #000000' }}>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700, marginBottom: '0.25rem' }}>RECEIVED STATUS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000000', marginTop: '0.15rem' }}>
                    {viewingRequest.receivedStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Product Items Table */}
            <div style={{ padding: '1rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #000000', marginBottom: '1.25rem', color: '#000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Delivery Product Items {viewingRequest.items && viewingRequest.items.length > 0 ? `(${viewingRequest.items.length})` : ''}
                </div>
                {viewingRequest.purchaseOrderCode && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                    Linked PO: {viewingRequest.purchaseOrderCode}
                  </span>
                )}
              </div>

              {viewingRequest.items && viewingRequest.items.length > 0 ? (
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
                      {viewingRequest.items.map((item, idx) => (
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
                  Delivery products associated with {viewingRequest.purchaseOrderCode || 'Replacement Request'}. Damaged Qty: {viewingRequest.damagedQuantity}, Replacement Qty: {viewingRequest.replacementQuantity}.
                </div>
              )}
            </div>

            {/* Supplier Confirmation Status Card (Visible to Buyer & Supplier) */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '10px',
                background:
                  viewingRequest.supplierApprovalStatus === 'Accept Request'
                    ? 'rgba(34, 197, 94, 0.08)'
                    : viewingRequest.supplierApprovalStatus === 'Reject Request'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(245, 158, 11, 0.08)',
                border:
                  viewingRequest.supplierApprovalStatus === 'Accept Request'
                    ? '2px solid #16a34a'
                    : viewingRequest.supplierApprovalStatus === 'Reject Request'
                      ? '2px solid #dc2626'
                      : '2px solid #d97706',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
                  Supplier Confirmation Status
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    background:
                      viewingRequest.supplierApprovalStatus === 'Accept Request'
                        ? '#16a34a'
                        : viewingRequest.supplierApprovalStatus === 'Reject Request'
                          ? '#dc2626'
                          : '#d97706',
                    color: '#ffffff'
                  }}
                >
                  {viewingRequest.supplierApprovalStatus || 'Pending Approval'}
                </span>
              </div>

              {viewingRequest.supplierConfirmationMessage ? (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '0.35rem' }}>
                    Supplier Confirmation Message:
                  </div>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 600,
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}
                  >
                    {viewingRequest.supplierConfirmationMessage}
                  </div>
                  {viewingRequest.supplierApprovedAt && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                      Confirmed at: {new Date(viewingRequest.supplierApprovedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.88rem', color: '#92400e', fontWeight: 500 }}>
                  Awaiting confirmation from supplier ({viewingRequest.receivedFromSupplierName}).
                </div>
              )}
            </div>

            {/* Supplier Approval Section (Requirements 3, 4, 5) */}
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
                    Supplier Approval for Replacement Items
                  </h4>
                </div>

                {/* Supplier Actions Reference Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    onClick={() => {
                      setSelectedSupplierAction('Accept Request');
                      setSupplierApprovedReplacementQty(viewingRequest.replacementQuantity);
                    }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: selectedSupplierAction === 'Accept Request' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: selectedSupplierAction === 'Accept Request' ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803d', marginBottom: '0.25rem' }}>
                      Accept Request
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.35 }}>
                      Supplier agrees to replace all requested items.
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedSupplierAction('Partially Accept')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: selectedSupplierAction === 'Partially Accept' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      background: selectedSupplierAction === 'Partially Accept' ? '#fffbeb' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#b45309', marginBottom: '0.25rem' }}>
                      Partially Accept
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.35 }}>
                      Supplier agrees to replace only some items.
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setSelectedSupplierAction('Reject Request');
                      setSupplierApprovedReplacementQty(0);
                    }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: selectedSupplierAction === 'Reject Request' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: selectedSupplierAction === 'Reject Request' ? '#fef2f2' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#b91c1c', marginBottom: '0.25rem' }}>
                      Reject Request
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.35 }}>
                      Supplier declines the replacement request with a reason.
                    </div>
                  </div>
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

                {selectedSupplierAction === 'Partially Accept' && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Approved Replacement Quantity (Requested: {viewingRequest.replacementQuantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={viewingRequest.replacementQuantity}
                      value={supplierApprovedReplacementQty}
                      onChange={(e) =>
                        setSupplierApprovedReplacementQty(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))
                      }
                      style={{
                        width: '220px',
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
                  </div>
                )}

                {/* Mandatory Confirmation Message (~200 characters) */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Confirmation Message <span style={{ color: '#dc2626' }}>*</span> (Around 200 characters in length)
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      {supplierConfirmationMsg.length} / 200 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={supplierConfirmationMsg}
                    onChange={(e) => setSupplierConfirmationMsg(e.target.value)}
                    placeholder="Enter mandatory confirmation message (around 200 characters in length) for Accept Request, Partially Accept, or Reject Request..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '0.88rem',
                      color: '#000000',
                      background: '#ffffff',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.74rem' }}>
                    For each confirmation (Accept Request / Partially Accept / Reject Request), Supplier must provide a message around 200 characters in length.
                  </small>
                </div>

                {/* Supplier Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {(() => {
                    const isAlreadyApproved = Boolean(
                      viewingRequest.supplierApprovalStatus &&
                      viewingRequest.supplierApprovalStatus !== 'Pending Approval'
                    );
                    const isAcceptDisabled = approving || isAlreadyApproved || selectedSupplierAction !== 'Accept Request';
                    const isPartialDisabled = approving || isAlreadyApproved || selectedSupplierAction !== 'Partially Accept';
                    const isRejectDisabled = approving || isAlreadyApproved || selectedSupplierAction !== 'Reject Request';

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => !isAcceptDisabled && handleSupplierApproval('Accept Request')}
                          disabled={isAcceptDisabled}
                          style={{
                            background: isAcceptDisabled ? '#94a3b8' : '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.6rem 1.15rem',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isAcceptDisabled ? 'not-allowed' : 'pointer',
                            opacity: isAcceptDisabled ? 0.55 : 1
                          }}
                        >
                          Accept Request
                        </button>
                        <button
                          type="button"
                          onClick={() => !isPartialDisabled && handleSupplierApproval('Partially Accept')}
                          disabled={isPartialDisabled}
                          style={{
                            background: isPartialDisabled ? '#94a3b8' : '#d97706',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.6rem 1.15rem',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isPartialDisabled ? 'not-allowed' : 'pointer',
                            opacity: isPartialDisabled ? 0.55 : 1
                          }}
                        >
                          Partially Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => !isRejectDisabled && handleSupplierApproval('Reject Request')}
                          disabled={isRejectDisabled}
                          style={{
                            background: isRejectDisabled ? '#94a3b8' : '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.6rem 1.15rem',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isRejectDisabled ? 'not-allowed' : 'pointer',
                            opacity: isRejectDisabled ? 0.55 : 1
                          }}
                        >
                          Reject Request
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '2px solid #000000', paddingTop: '1rem' }}>
              {viewMode === 'buyer' && (
                <button
                  type="button"
                  onClick={() => {
                    const reqToEdit = viewingRequest;
                    setViewingRequest(null);
                    handleOpenEdit(reqToEdit);
                  }}
                  className="btn"
                  style={{
                    minWidth: '100px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #2563eb',
                    fontWeight: 700,
                    padding: '0.55rem 1.4rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
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

export default ReplacementRequests;
