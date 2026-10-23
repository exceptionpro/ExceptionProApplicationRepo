import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface Supplier {
  id: string;
  email: string;
  name: string;
  accountType: string;
  status?: string;
  poNumber?: string;
  comments?: string;
}

interface CollaborationItem {
  id?: string;
  itemType: string;
  productName: string;
  fullDescription: string;
  quantity: number;
  unitMeasure: string;
  price: number;
  currencyType?: string;
}

interface SupplierProposal {
  id: string;
  supplierId: string;
  supplierEmail: string;
  supplierName: string;
  proposalText: string;
  evaluationStatus: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
}

interface PurchaseOrderItem {
  id?: string;
  productName: string;
  fullDescription?: string;
  quantity: number;
  unitMeasure?: string;
  price: number;
  currencyType?: string;
}

interface PurchaseOrderSummary {
  id: string;
  requisitionId?: string;
  reqNumber?: number;
  title: string;
  status: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierId?: string;
  needByDate?: string;
  createdAt?: string;
  items?: PurchaseOrderItem[];
}

interface PoItemAssignment {
  productName: string;
  fullDescription: string;
  unitMeasure: string;
  price: number;
  currencyType?: string;
  originalQuantity: number;
  assignedQuantity: number;
  included: boolean;
}

interface CollaborationRequisitionData {
  id: string;
  title: string;
  shipTo: string;
  deliverTo: string;
  needByDate: string;
  comments: string;
  status: string;
  createdAt: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  suppliers: Supplier[];
  acceptedSuppliers?: Supplier[];
  declinedSuppliers?: Supplier[];
  acceptedCount?: number;
  items: CollaborationItem[];
  proposals: SupplierProposal[];
  purchaseOrders?: PurchaseOrderSummary[];
  currentSupplierStatus?: string;
  purchaseOrderGenerated?: boolean;
  poNumber?: string;
}

interface SupplierMessageModalData {
  title: string;
  supplierName: string;
  supplierEmail: string;
  type: 'ACCEPTED' | 'PROPOSAL' | 'DECLINED';
  message: string;
  date?: string;
  fileUrl?: string;
  fileName?: string;
}

interface ConvertToPoItem {
  id?: string;
  productName: string;
  fullDescription: string;
  quantity: number;
  maxQuantity: number;
  unitMeasure: string;
  price: number;
  currencyType: string;
}

interface ConvertToPoModalState {
  requisition: CollaborationRequisitionData;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  items: ConvertToPoItem[];
  isProposedSupplier?: boolean;
}

const CollaborationRequisitionPage: React.FC = () => {
  const [requisitions, setRequisitions] = useState<CollaborationRequisitionData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const getFileUrl = (url?: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  const isSupplierPoConverted = (
    req: CollaborationRequisitionData,
    supplierId: string,
    supplierEmail?: string
  ): boolean => {
    if (req.purchaseOrders && req.purchaseOrders.length > 0) {
      const match = req.purchaseOrders.find(
        (po) =>
          (po.supplierId && po.supplierId === supplierId) ||
          (supplierEmail && po.supplierEmail && po.supplierEmail.toLowerCase() === supplierEmail.toLowerCase())
      );
      if (match) return true;
    }
    if (req.acceptedSuppliers && req.acceptedSuppliers.length > 0) {
      const match = req.acceptedSuppliers.find(
        (sup) =>
          sup.id === supplierId ||
          (supplierEmail && sup.email && sup.email.toLowerCase() === supplierEmail.toLowerCase())
      );
      if (match && (match.status === 'Purchase Order Generated' || Boolean(match.poNumber))) {
        return true;
      }
    }
    return false;
  };

  const getSupplierPoNumber = (
    req: CollaborationRequisitionData,
    supplierId: string,
    supplierEmail?: string
  ): string => {
    if (req.purchaseOrders && req.purchaseOrders.length > 0) {
      const match = req.purchaseOrders.find(
        (po) =>
          (po.supplierId && po.supplierId === supplierId) ||
          (supplierEmail && po.supplierEmail && po.supplierEmail.toLowerCase() === supplierEmail.toLowerCase())
      );
      if (match) {
        return match.requisitionId || (match.reqNumber ? `PO${String(match.reqNumber).padStart(2, '0')}` : 'PO');
      }
    }
    if (req.acceptedSuppliers && req.acceptedSuppliers.length > 0) {
      const match = req.acceptedSuppliers.find(
        (sup) =>
          sup.id === supplierId ||
          (supplierEmail && sup.email && sup.email.toLowerCase() === supplierEmail.toLowerCase())
      );
      if (match?.poNumber && match.poNumber.trim()) {
        return match.poNumber.trim();
      }
    }
    return 'PO';
  };

  const getItemAllocatedQuantity = (req: CollaborationRequisitionData, productName?: string): number => {
    if (!req.purchaseOrders || req.purchaseOrders.length === 0) return 0;
    let allocated = 0;
    req.purchaseOrders.forEach((po) => {
      if (po.items && po.items.length > 0) {
        po.items.forEach((pItem) => {
          if (!productName || pItem.productName === productName) {
            allocated += (pItem.quantity || 0);
          }
        });
      }
    });
    return allocated;
  };

  const getItemAvailableQuantity = (req: CollaborationRequisitionData, item: CollaborationItem): number => {
    const totalOriginal = item.quantity || 0;
    const allocated = getItemAllocatedQuantity(req, item.productName);
    return Math.max(0, totalOriginal - allocated);
  };

  const getTotalAvailableQuantity = (req: CollaborationRequisitionData): number => {
    if (!req.items || req.items.length === 0) return 0;
    return req.items.reduce((sum, item) => sum + getItemAvailableQuantity(req, item), 0);
  };

  const checkIsPoConverted = (req: CollaborationRequisitionData): boolean => {
    if (req.status === 'Purchase Order Generated') {
      return true;
    }
    if (req.purchaseOrders && req.purchaseOrders.length > 0) {
      if (req.items && req.items.length > 0) {
        const remaining = getTotalAvailableQuantity(req);
        if (remaining <= 0) return true;
      }
    }
    if (req.acceptedSuppliers && req.acceptedSuppliers.length > 0) {
      return req.acceptedSuppliers.every((s) => isSupplierPoConverted(req, s.id, s.email));
    }
    return Boolean(
      (req.purchaseOrders && req.purchaseOrders.length > 0) ||
      req.purchaseOrderGenerated ||
      (req.poNumber && req.poNumber.trim().length > 0)
    );
  };

  // Create Collaboration Requisition Form State
  const [title, setTitle] = useState('');
  const [shipTo, setShipTo] = useState('');
  const [deliverTo, setDeliverTo] = useState('');
  const [needByDate, setNeedByDate] = useState('');
  const [comments, setComments] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [items, setItems] = useState<CollaborationItem[]>([]);

  // Item Modal State (Shared for Create Requisition & Edit Requisition flows)
  const [showNonCatalogModal, setShowNonCatalogModal] = useState(false);
  const [editingContext, setEditingContext] = useState<'CREATE' | 'EDIT_REQ'>('CREATE');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [nonCatProductName, setNonCatProductName] = useState('');
  const [nonCatDescription, setNonCatDescription] = useState('');
  const [nonCatQuantity, setNonCatQuantity] = useState<number | ''>('');
  const [nonCatUnitMeasure, setNonCatUnitMeasure] = useState('Each');
  const [nonCatPrice, setNonCatPrice] = useState<number | ''>('');
  const [nonCatCurrencyType, setNonCatCurrencyType] = useState<string>('');
  const [modalSelectedSupplierIds, setModalSelectedSupplierIds] = useState<string[]>([]);
  const [modalSupplierError, setModalSupplierError] = useState<string>('');

  // Edit Requisition / Details / Accepted Suppliers State
  const [editingRequisition, setEditingRequisition] = useState<CollaborationRequisitionData | null>(null);
  const [viewingReq, setViewingReq] = useState<CollaborationRequisitionData | null>(null);
  const [selectedAcceptedSuppliersReq, setSelectedAcceptedSuppliersReq] = useState<CollaborationRequisitionData | null>(null);
  const [supplierMessageModal, setSupplierMessageModal] = useState<SupplierMessageModalData | null>(null);

  // Convert to Purchase Order Quantity Modal State
  const [convertToPoModal, setConvertToPoModal] = useState<ConvertToPoModalState | null>(null);
  const [convertToPoSubmitting, setConvertToPoSubmitting] = useState<boolean>(false);
  const [convertToPoError, setConvertToPoError] = useState<string>('');

  // Create Purchase Order Modal State
  const [showCreatePoModal, setShowCreatePoModal] = useState<boolean>(false);
  const [poCollabReq, setPoCollabReq] = useState<CollaborationRequisitionData | null>(null);
  const [poMode, setPoMode] = useState<'SPECIFIC' | 'ALL_ACCEPTED'>('SPECIFIC');
  const [poSelectedSupplierId, setPoSelectedSupplierId] = useState<string>('');
  const [poTitle, setPoTitle] = useState<string>('');
  const [poShipTo, setPoShipTo] = useState<string>('');
  const [poDeliverTo, setPoDeliverTo] = useState<string>('');
  const [poNeedByDate, setPoNeedByDate] = useState<string>('');
  const [poComments, setPoComments] = useState<string>('');
  const [poItems, setPoItems] = useState<PoItemAssignment[]>([]);
  const [poSubmitting, setPoSubmitting] = useState<boolean>(false);
  const [poError, setPoError] = useState<string>('');

  useEffect(() => {
    fetchCollaborationRequisitions();
    fetchSuppliers();
  }, []);

  const fetchCollaborationRequisitions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/collaboration-requisitions');
      setRequisitions(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn('Failed to fetch collaboration requisitions', err);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/requisitions/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  const areSupplierListsEqual = (listA: string[], listB: string[]): boolean => {
    if (listA.length !== listB.length) return false;
    const setA = new Set(listA);
    return listB.every((id) => setA.has(id));
  };

  const getCollabSupplierMismatchMsg = (
    formSupIds: string[],
    modalSupIds: string[]
  ): string => {
    const formSupList = formSupIds.map((id) => {
      const sup = suppliers.find((s) => s.id === id);
      return sup ? `${sup.name} (${sup.email})` : id;
    });

    const modalSupList = modalSupIds.map((id) => {
      const sup = suppliers.find((s) => s.id === id);
      return sup ? `${sup.name} (${sup.email})` : id;
    });

    const formDetails = formSupList.length > 0
      ? formSupList.map((s) => `  • ${s}`).join('\n')
      : '  • None selected';

    const modalDetails = modalSupList.length > 0
      ? modalSupList.map((s) => `  • ${s}`).join('\n')
      : '  • None selected';

    const formSummary = formSupList.length > 0 ? formSupList.join(', ') : 'None';

    return `The Suppliers which were selected in Collaboration Requisition should match with Suppliers Selected in Add Non-Catalog page.\n\n• Collaboration Requisition Suppliers:\n${formDetails}\n\n• Add Non-Catalog Page Selected Suppliers:\n${modalDetails}\n\nNote: All suppliers invited in the Collaboration Requisition form ("${formSummary}") must match the suppliers selected in the Add Non-Catalog page. Please ensure the exact same suppliers are selected before adding items.`;
  };

  const handleToggleSupplierSelectionInModal = (supplierId: string) => {
    const nextModalIds = modalSelectedSupplierIds.includes(supplierId)
      ? modalSelectedSupplierIds.filter((id) => id !== supplierId)
      : [...modalSelectedSupplierIds, supplierId];

    setModalSelectedSupplierIds(nextModalIds);

    const activeFormSupplierIds = editingContext === 'CREATE'
      ? selectedSupplierIds
      : (editingRequisition?.suppliers?.map((s) => s.id) || []);

    if (activeFormSupplierIds.length > 0 && !areSupplierListsEqual(activeFormSupplierIds, nextModalIds)) {
      setModalSupplierError(getCollabSupplierMismatchMsg(activeFormSupplierIds, nextModalIds));
    } else {
      setModalSupplierError('');
    }
  };

  const handleToggleCreateSupplierSelection = (supplierId: string) => {
    if (selectedSupplierIds.includes(supplierId)) {
      setSelectedSupplierIds(selectedSupplierIds.filter((id) => id !== supplierId));
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, supplierId]);
    }
  };

  const handleToggleEditReqSupplier = (supplierId: string) => {
    if (!editingRequisition) return;
    const currentSuppliers = editingRequisition.suppliers || [];
    const exists = currentSuppliers.some((s) => s.id === supplierId);
    let updatedSuppliers: Supplier[];
    if (exists) {
      updatedSuppliers = currentSuppliers.filter((s) => s.id !== supplierId);
    } else {
      const foundSupplier = suppliers.find((s) => s.id === supplierId);
      if (foundSupplier) {
        updatedSuppliers = [...currentSuppliers, foundSupplier];
      } else {
        updatedSuppliers = currentSuppliers;
      }
    }
    setEditingRequisition({
      ...editingRequisition,
      suppliers: updatedSuppliers,
    });
  };

  const handleInlineCreateItemQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: qty };
    setItems(updated);
  };

  const handleInlineCreateItemPriceChange = (index: number, prc: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], price: prc };
    setItems(updated);
  };

  const handleInlineEditReqItemQuantityChange = (index: number, qty: number) => {
    if (!editingRequisition) return;
    const updated = [...(editingRequisition.items || [])];
    updated[index] = { ...updated[index], quantity: qty };
    setEditingRequisition({
      ...editingRequisition,
      items: updated,
    });
  };

  const handleInlineEditReqItemPriceChange = (index: number, prc: number) => {
    if (!editingRequisition) return;
    const updated = [...(editingRequisition.items || [])];
    updated[index] = { ...updated[index], price: prc };
    setEditingRequisition({
      ...editingRequisition,
      items: updated,
    });
  };

  const openAddItemModal = (context: 'CREATE' | 'EDIT_REQ') => {
    setEditingContext(context);
    setEditingItemIndex(null);
    setNonCatProductName('');
    setNonCatDescription('');
    setNonCatQuantity('');
    setNonCatUnitMeasure('Each');
    setNonCatPrice('');
    setNonCatCurrencyType('');
    setModalSupplierError('');

    const activeFormSupplierIds = context === 'CREATE'
      ? selectedSupplierIds
      : (editingRequisition?.suppliers?.map((s) => s.id) || []);

    setModalSelectedSupplierIds([...activeFormSupplierIds]);
    setShowNonCatalogModal(true);
  };

  const openEditItemModal = (context: 'CREATE' | 'EDIT_REQ', index: number) => {
    setEditingContext(context);
    setEditingItemIndex(index);
    setModalSupplierError('');

    const activeFormSupplierIds = context === 'CREATE'
      ? selectedSupplierIds
      : (editingRequisition?.suppliers?.map((s) => s.id) || []);

    setModalSelectedSupplierIds([...activeFormSupplierIds]);

    let targetItem: CollaborationItem | null = null;
    if (context === 'CREATE') {
      targetItem = items[index];
    } else if (editingRequisition && editingRequisition.items) {
      targetItem = editingRequisition.items[index];
    }

    if (targetItem) {
      setNonCatProductName(targetItem.productName || '');
      setNonCatDescription(targetItem.fullDescription || '');
      setNonCatQuantity(targetItem.quantity ?? '');
      setNonCatUnitMeasure(targetItem.unitMeasure || 'Each');
      setNonCatPrice(targetItem.price ?? '');
      setNonCatCurrencyType(targetItem.currencyType || '');
    }
    setShowNonCatalogModal(true);
  };

  const handleSaveItemModal = () => {
    const activeFormSupplierIds = editingContext === 'CREATE'
      ? selectedSupplierIds
      : (editingRequisition?.suppliers?.map((s) => s.id) || []);

    if (activeFormSupplierIds.length > 0 && !areSupplierListsEqual(activeFormSupplierIds, modalSelectedSupplierIds)) {
      setModalSupplierError(getCollabSupplierMismatchMsg(activeFormSupplierIds, modalSelectedSupplierIds));
      return;
    }

    if (modalSelectedSupplierIds.length === 0) {
      if (activeFormSupplierIds.length > 0) {
        setModalSupplierError(getCollabSupplierMismatchMsg(activeFormSupplierIds, []));
      } else {
        setModalSupplierError('Please select at least one supplier for the collaboration requisition.');
      }
      return;
    }

    if (!nonCatProductName.trim()) {
      alert('Product Name is required');
      return;
    }
    if (!nonCatDescription.trim()) {
      alert('Full Description is required');
      return;
    }
    if (nonCatQuantity === '' || Number(nonCatQuantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    if (nonCatPrice === '' || Number(nonCatPrice) < 0) {
      alert('Price is required and cannot be negative');
      return;
    }
    if (!nonCatCurrencyType.trim()) {
      alert('Currency Type is required');
      return;
    }

    const itemToSave: CollaborationItem = {
      itemType: 'NON_CATALOG',
      productName: nonCatProductName.trim(),
      fullDescription: nonCatDescription.trim(),
      quantity: Number(nonCatQuantity),
      unitMeasure: nonCatUnitMeasure.trim(),
      price: Number(nonCatPrice),
      currencyType: nonCatCurrencyType.trim(),
    };

    if (editingContext === 'CREATE') {
      if (editingItemIndex === null) {
        setItems([...items, itemToSave]);
      } else {
        const updated = [...items];
        updated[editingItemIndex] = itemToSave;
        setItems(updated);
      }
      setSelectedSupplierIds(modalSelectedSupplierIds);
    } else if (editingContext === 'EDIT_REQ' && editingRequisition) {
      const currentItems = [...(editingRequisition.items || [])];
      if (editingItemIndex === null) {
        currentItems.push(itemToSave);
      } else {
        currentItems[editingItemIndex] = itemToSave;
      }
      const newSuppliersList = suppliers.filter((s) => modalSelectedSupplierIds.includes(s.id));

      setEditingRequisition({
        ...editingRequisition,
        items: currentItems,
        suppliers: newSuppliersList,
      });
    }

    setNonCatProductName('');
    setNonCatDescription('');
    setNonCatQuantity('');
    setNonCatUnitMeasure('Each');
    setNonCatPrice('');
    setNonCatCurrencyType('');
    setModalSelectedSupplierIds([]);
    setEditingItemIndex(null);
    setModalSupplierError('');
    setShowNonCatalogModal(false);
  };

  const handleRemoveCreateItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleRemoveEditReqItem = (index: number) => {
    if (!editingRequisition) return;
    const updated = (editingRequisition.items || []).filter((_, idx) => idx !== index);
    setEditingRequisition({
      ...editingRequisition,
      items: updated,
    });
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (items.length === 0) {
      setError('Please add at least one Non-Catalog item to the collaboration requisition.');
      return;
    }

    try {
      const payload = {
        title,
        shipTo,
        deliverTo,
        needByDate,
        comments,
        supplierIds: selectedSupplierIds,
        items: items.map((i) => ({
          itemType: i.itemType,
          productName: i.productName,
          fullDescription: i.fullDescription,
          quantity: i.quantity,
          unitMeasure: i.unitMeasure,
          price: i.price,
          currencyType: i.currencyType || 'USD',
        })),
      };

      await api.post('/api/collaboration-requisitions', payload);
      setSuccess('Collaboration Requisition created successfully!');
      setTitle('');
      setShipTo('');
      setDeliverTo('');
      setNeedByDate('');
      setComments('');
      setSelectedSupplierIds([]);
      setItems([]);
      fetchCollaborationRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create collaboration requisition');
    }
  };

  const handleUpdateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequisition) return;
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: editingRequisition.title,
        shipTo: editingRequisition.shipTo,
        deliverTo: editingRequisition.deliverTo,
        needByDate: editingRequisition.needByDate,
        comments: editingRequisition.comments,
        supplierIds: editingRequisition.suppliers?.map((s) => s.id) || [],
        items: editingRequisition.items?.map((i) => ({
          itemType: i.itemType,
          productName: i.productName,
          fullDescription: i.fullDescription,
          quantity: i.quantity,
          unitMeasure: i.unitMeasure,
          price: i.price,
          currencyType: i.currencyType || 'USD',
        })) || [],
      };

      await api.put(`/api/collaboration-requisitions/${editingRequisition.id}`, payload);
      setSuccess('Collaboration Requisition updated successfully!');
      setEditingRequisition(null);
      fetchCollaborationRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update collaboration requisition');
    }
  };

  const handleDeleteRequisition = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collaboration requisition?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/collaboration-requisitions/${id}`);
      setSuccess('Collaboration Requisition deleted successfully!');
      fetchCollaborationRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete collaboration requisition');
    }
  };

  const handleEvaluateProposal = async (proposalId: string, status: string) => {
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/api/collaboration-requisitions/proposals/${proposalId}/evaluate?status=${encodeURIComponent(status)}`);
      const updatedReq = res.data;
      setSuccess(`Proposal evaluated as "${status}" successfully!`);
      fetchCollaborationRequisitions();
      if (viewingReq && viewingReq.id === updatedReq.id) {
        setViewingReq(updatedReq);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to evaluate proposal');
    }
  };

  const handleEvaluateAllProposals = async (collabReqId: string, status: string) => {
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/api/collaboration-requisitions/${collabReqId}/proposals/evaluate-all?status=${encodeURIComponent(status)}`);
      const updatedReq = res.data;
      setSuccess(`All proposals evaluated as "${status}" successfully!`);
      fetchCollaborationRequisitions();
      if (viewingReq && viewingReq.id === updatedReq.id) {
        setViewingReq(updatedReq);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to evaluate proposals');
    }
  };

  const handleDeclineAcceptedSupplier = async (collabReqId: string, supplierId: string, supplierName: string) => {
    if (!window.confirm(`Are you sure you want to decline supplier "${supplierName}" for this collaboration requisition?`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/api/collaboration-requisitions/${collabReqId}/suppliers/${supplierId}/decline`);
      const updatedReq = res.data;
      setSuccess(`Supplier "${supplierName}" was declined.`);
      fetchCollaborationRequisitions();
      if (selectedAcceptedSuppliersReq && selectedAcceptedSuppliersReq.id === updatedReq.id) {
        setSelectedAcceptedSuppliersReq(updatedReq);
      }
      if (viewingReq && viewingReq.id === updatedReq.id) {
        setViewingReq(updatedReq);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline supplier');
    }
  };

  const handleDeclineProposedSupplier = async (
    collabReqId: string,
    proposalId: string,
    supplierId: string,
    supplierName: string
  ) => {
    if (!window.confirm(`Are you sure you want to decline supplier "${supplierName}" for this collaboration requisition?`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      if (proposalId) {
        await api.put(`/api/collaboration-requisitions/proposals/${proposalId}/evaluate?status=Declined`);
      }
      let updatedReq = null;
      if (collabReqId && supplierId) {
        const res = await api.put(`/api/collaboration-requisitions/${collabReqId}/suppliers/${supplierId}/decline`);
        updatedReq = res.data;
      }
      setSuccess(`Supplier "${supplierName}" was declined.`);
      fetchCollaborationRequisitions();
      if (selectedAcceptedSuppliersReq && updatedReq && selectedAcceptedSuppliersReq.id === updatedReq.id) {
        setSelectedAcceptedSuppliersReq(updatedReq);
      }
      if (viewingReq && updatedReq && viewingReq.id === updatedReq.id) {
        setViewingReq(updatedReq);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline supplier');
    }
  };

  const openConvertToPoModal = (
    req: CollaborationRequisitionData,
    supplierOrId: { id: string; name: string; email?: string } | string,
    isProposedSupplier: boolean = false
  ) => {
    setConvertToPoError('');
    let supId = '';
    let supName = '';
    let supEmail = '';

    if (typeof supplierOrId === 'string') {
      supId = supplierOrId;
      const found = (req.acceptedSuppliers || []).find((s) => s.id === supId) ||
        (req.suppliers || []).find((s) => s.id === supId) ||
        suppliers.find((s) => s.id === supId);
      supName = found ? found.name : 'Supplier';
      supEmail = found?.email || '';
    } else {
      supId = supplierOrId.id;
      supName = supplierOrId.name;
      supEmail = supplierOrId.email || '';
    }

    if (!supId) {
      setError('No supplier found for this collaboration requisition to convert to Purchase Order.');
      return;
    }

    if (checkIsPoConverted(req)) {
      return;
    }

    if (isSupplierPoConverted(req, supId, supEmail)) {
      return;
    }

    const modalItems: ConvertToPoItem[] = (req.items || []).map((item) => {
      const avail = getItemAvailableQuantity(req, item);
      return {
        id: item.id,
        productName: item.productName,
        fullDescription: item.fullDescription || '',
        quantity: avail,
        maxQuantity: avail,
        unitMeasure: item.unitMeasure || 'Each',
        price: item.price || 0,
        currencyType: item.currencyType || 'USD',
      };
    });

    setConvertToPoModal({
      requisition: req,
      supplierId: supId,
      supplierName: supName,
      supplierEmail: supEmail,
      items: modalItems,
      isProposedSupplier,
    });
  };

  const handleConvertToPoItemQtyChange = (index: number, val: string) => {
    if (!convertToPoModal) return;
    const updated = [...convertToPoModal.items];
    const item = updated[index];
    if (val === '') {
      updated[index] = { ...item, quantity: 0 };
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        const clamped = Math.max(0, Math.min(item.maxQuantity, num));
        updated[index] = { ...item, quantity: clamped };
      }
    }
    setConvertToPoModal({ ...convertToPoModal, items: updated });
  };

  const handleConvertToPoItemPriceChange = (index: number, val: string) => {
    if (!convertToPoModal) return;
    const updated = [...convertToPoModal.items];
    const item = updated[index];
    if (val === '') {
      updated[index] = { ...item, price: 0 };
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        updated[index] = { ...item, price: Math.max(0, num) };
      }
    }
    setConvertToPoModal({ ...convertToPoModal, items: updated });
  };

  const handleConfirmConvertToPo = async () => {
    if (!convertToPoModal) return;
    const { requisition: req, supplierId, items: modalItems } = convertToPoModal;

    for (const item of modalItems) {
      if (!item.quantity || item.quantity <= 0) {
        setConvertToPoError(`Please enter a valid quantity for "${item.productName}" (between 1 and ${item.maxQuantity}).`);
        return;
      }
      if (item.quantity > item.maxQuantity) {
        setConvertToPoError(`Quantity for "${item.productName}" cannot exceed available quantity (${item.maxQuantity}).`);
        return;
      }
      if (convertToPoModal.isProposedSupplier && (item.price === undefined || item.price === null || item.price < 0)) {
        setConvertToPoError(`Please enter a valid price for "${item.productName}".`);
        return;
      }
    }

    try {
      setConvertToPoSubmitting(true);
      setConvertToPoError('');

      const targetSupplierIds = [supplierId];
      const payload = {
        supplierId: supplierId,
        supplierIds: targetSupplierIds,
        title: req.title ? `PO - ${req.title}` : 'Purchase Order',
        shipTo: req.shipTo || '',
        deliverTo: req.deliverTo || '',
        needByDate: req.needByDate || '',
        comments: req.comments || '',
        items: modalItems.map((i) => ({
          productName: i.productName,
          fullDescription: i.fullDescription || '',
          quantity: i.quantity,
          unitMeasure: i.unitMeasure || 'Each',
          price: i.price || 0,
          currencyType: i.currencyType || 'USD',
          itemType: 'NON_CATALOG',
        })),
      };

      const res = await api.post(`/api/collaboration-requisitions/${req.id}/create-po`, payload);
      const createdPOs = Array.isArray(res.data) ? res.data : [res.data];
      const poCode = createdPOs[0]?.requisitionId || (createdPOs[0]?.reqNumber ? `PO${String(createdPOs[0].reqNumber).padStart(2, '0')}` : 'PO');
      setSuccess(`Purchase Order (${poCode}) generated successfully for ${convertToPoModal.supplierName}!`);
      setConvertToPoModal(null);
      await fetchCollaborationRequisitions();
      if (viewingReq && viewingReq.id === req.id) {
        const fresh = await api.get('/api/collaboration-requisitions');
        const match = Array.isArray(fresh.data) ? fresh.data.find((r: any) => r.id === req.id) : null;
        if (match) setViewingReq(match);
      }
      if (selectedAcceptedSuppliersReq && selectedAcceptedSuppliersReq.id === req.id) {
        const fresh = await api.get('/api/collaboration-requisitions');
        const match = Array.isArray(fresh.data) ? fresh.data.find((r: any) => r.id === req.id) : null;
        if (match) setSelectedAcceptedSuppliersReq(match);
      }
    } catch (err: any) {
      setConvertToPoError(err.response?.data?.message || 'Failed to convert to Purchase Order');
    } finally {
      setConvertToPoSubmitting(false);
    }
  };

  const openCreatePoModal = (
    req: CollaborationRequisitionData,
    presetSupplierId?: string,
    mode: 'SPECIFIC' | 'ALL_ACCEPTED' = 'SPECIFIC'
  ) => {
    if (checkIsPoConverted(req)) {
      return;
    }
    setPoCollabReq(req);
    setPoMode(mode);
    setPoError('');

    const defaultSupId = presetSupplierId ||
      (req.acceptedSuppliers && req.acceptedSuppliers.length > 0 ? req.acceptedSuppliers[0].id : '') ||
      (req.suppliers && req.suppliers.length > 0 ? req.suppliers[0].id : '');

    setPoSelectedSupplierId(defaultSupId);
    setPoTitle(`PO - ${req.title}`);
    setPoShipTo(req.shipTo || '');
    setPoDeliverTo(req.deliverTo || '');
    setPoNeedByDate(req.needByDate || '');
    setPoComments(req.comments || '');

    const initialPoItems: PoItemAssignment[] = (req.items || []).map((item) => ({
      productName: item.productName,
      fullDescription: item.fullDescription || '',
      unitMeasure: item.unitMeasure || 'Each',
      price: item.price || 0,
      currencyType: item.currencyType || 'USD',
      originalQuantity: item.quantity,
      assignedQuantity: item.quantity,
      included: true,
    }));

    setPoItems(initialPoItems);
    setShowCreatePoModal(true);
  };

  const handleTogglePoItemIncluded = (index: number) => {
    const updated = [...poItems];
    updated[index].included = !updated[index].included;
    setPoItems(updated);
  };

  const handlePoItemQuantityChange = (index: number, newQty: number) => {
    const updated = [...poItems];
    updated[index].assignedQuantity = newQty;
    setPoItems(updated);
  };

  const handleCreatePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poCollabReq) return;
    setPoError('');

    if (poMode === 'SPECIFIC' && !poSelectedSupplierId) {
      setPoError('Please select a supplier for this Purchase Order.');
      return;
    }

    const includedItems = poItems.filter((i) => i.included && Number(i.assignedQuantity) > 0);
    if (includedItems.length === 0) {
      setPoError('Please assign a quantity greater than 0 for at least one item.');
      return;
    }

    try {
      setPoSubmitting(true);

      const targetSupplierIds: string[] = poMode === 'ALL_ACCEPTED'
        ? ((poCollabReq.acceptedSuppliers && poCollabReq.acceptedSuppliers.length > 0)
          ? poCollabReq.acceptedSuppliers.map((s) => s.id)
          : poCollabReq.suppliers.map((s) => s.id))
        : [poSelectedSupplierId];

      const payload = {
        supplierId: poMode === 'SPECIFIC' ? poSelectedSupplierId : undefined,
        supplierIds: targetSupplierIds,
        title: poTitle.trim(),
        shipTo: poShipTo.trim(),
        deliverTo: poDeliverTo.trim(),
        needByDate: poNeedByDate,
        comments: poComments.trim(),
        items: includedItems.map((i) => ({
          productName: i.productName,
          fullDescription: i.fullDescription,
          quantity: Number(i.assignedQuantity),
          unitMeasure: i.unitMeasure,
          price: Number(i.price),
          currencyType: i.currencyType || 'USD',
          itemType: 'NON_CATALOG',
        })),
      };

      const res = await api.post(`/api/collaboration-requisitions/${poCollabReq.id}/create-po`, payload);
      const createdCount = Array.isArray(res.data) ? res.data.length : 1;
      setSuccess(`Successfully created ${createdCount} Purchase Order(s) from Collaboration Requisition!`);
      setShowCreatePoModal(false);
      fetchCollaborationRequisitions();
      if (viewingReq && viewingReq.id === poCollabReq.id) {
        const fresh = await api.get('/api/collaboration-requisitions');
        const match = Array.isArray(fresh.data) ? fresh.data.find((r: any) => r.id === poCollabReq.id) : null;
        if (match) setViewingReq(match);
      }
    } catch (err: any) {
      setPoError(err.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setPoSubmitting(false);
    }
  };

  const renderStatusColumn = (req: CollaborationRequisitionData) => {
    const isAllPo = checkIsPoConverted(req);
    const hasAnyPo = (req.purchaseOrders && req.purchaseOrders.length > 0) || req.purchaseOrderGenerated;
    const acceptedCount = req.acceptedSuppliers ? req.acceptedSuppliers.length : (req.acceptedCount || 0);

    let badgeText = 'Collaborating';
    let badgeBg = 'rgba(168, 85, 247, 0.2)';
    let badgeColor = '#a855f7';
    let badgeBorder = '1px solid rgba(168, 85, 247, 0.35)';

    if (isAllPo || (hasAnyPo && acceptedCount === 0)) {
      badgeText = 'Purchase Order Generated';
      badgeBg = 'rgba(59, 130, 246, 0.2)';
      badgeColor = '#3b82f6';
      badgeBorder = '1px solid rgba(59, 130, 246, 0.35)';
    } else if (acceptedCount > 0) {
      badgeText = hasAnyPo ? 'Partially Converted' : 'Accepted';
      badgeBg = 'rgba(16, 185, 129, 0.2)';
      badgeColor = '#10b981';
      badgeBorder = '1px solid rgba(16, 185, 129, 0.35)';
    } else if (req.status === 'Declined') {
      badgeText = 'Declined';
      badgeBg = 'rgba(239, 68, 68, 0.2)';
      badgeColor = '#ef4444';
      badgeBorder = '1px solid rgba(239, 68, 68, 0.35)';
    } else if (req.status === 'Purchase Order Generated') {
      badgeText = 'Purchase Order Generated';
      badgeBg = 'rgba(59, 130, 246, 0.2)';
      badgeColor = '#3b82f6';
      badgeBorder = '1px solid rgba(59, 130, 246, 0.35)';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
        <span
          className="badge"
          style={{
            background: badgeBg,
            color: badgeColor,
            border: badgeBorder,
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          {badgeText}
        </span>
      </div>
    );
  };

  return (
    <div className="feed-container">
      <LeftNavigation activePage="collaboration-requisition" />

      <main className="feed-center-column" style={{ flex: 1, maxWidth: '950px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* SECTION 1: CREATE COLLABORATION REQUISITION */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Collaboration Requisition</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Submit a new collaboration requisition to request supplier proposals</p>

          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          <form onSubmit={handleSubmitRequisition}>
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter collaboration requisition title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Need By Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={needByDate}
                  onChange={(e) => setNeedByDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Ship To *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Shipping address / location"
                  value={shipTo}
                  onChange={(e) => setShipTo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Deliver To *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Delivery department or person"
                  value={deliverTo}
                  onChange={(e) => setDeliverTo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comments</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Additional instructions for suppliers"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <label className="form-label">Selection of Suppliers</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select suppliers to invite for this collaboration requisition:</p>
              {suppliers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registered suppliers available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {suppliers.map((sup) => (
                    <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.includes(sup.id)}
                        onChange={() => handleToggleCreateSupplierSelection(sup.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span><strong>{sup.name}</strong> ({sup.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                onClick={() => openAddItemModal('CREATE')}
              >
                ➕ Add Non-Catalog Item
              </button>
            </div>

            {items.length > 0 && (
              <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Non-Catalog Items ({items.length})</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Product Name</th>
                      <th style={{ padding: '0.5rem' }}>Full Description</th>
                      <th style={{ padding: '0.5rem' }}>Quantity</th>
                      <th style={{ padding: '0.5rem' }}>Unit</th>
                      <th style={{ padding: '0.5rem' }}>Price</th>
                      <th style={{ padding: '0.5rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ padding: '0.5rem' }}>{item.fullDescription}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ width: '75px', padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                            value={item.quantity}
                            onChange={(e) => handleInlineCreateItemQuantityChange(idx, Number(e.target.value))}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span>{item.currencyType ? `${item.currencyType} ` : '$'}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input"
                              style={{ width: '85px', padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                              value={item.price}
                              onChange={(e) => handleInlineCreateItemPriceChange(idx, Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => openEditItemModal('CREATE', idx)}
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            >
                              Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCreateItem(idx)}
                              style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Collaboration Requisition
            </button>
          </form>
        </div>

        {/* SECTION 2: LIST COLLABORATION REQUISITIONS */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>List Collaboration Requisitions</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Manage your submitted collaboration requisitions and review supplier proposals</p>

          {loading ? (
            <div>Loading collaboration requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No collaboration requisitions created yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Title</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Ship To</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Deliver To</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Need By Date</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Comments</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((req) => {
                    const isAllPo = checkIsPoConverted(req);
                    const hasAccepted = req.acceptedSuppliers && req.acceptedSuppliers.length > 0;
                    const hasProposed = req.proposals && req.proposals.length > 0;
                    const hasDeclined = req.declinedSuppliers && req.declinedSuppliers.length > 0;

                    return (
                      <React.Fragment key={req.id}>
                        {/* Main Requisition Row */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{req.title}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{req.shipTo}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{req.deliverTo}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{req.needByDate}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{req.comments || '-'}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{renderStatusColumn(req)}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={isAllPo}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.8rem',
                                  width: 'auto',
                                  cursor: isAllPo ? 'not-allowed' : 'pointer',
                                  opacity: isAllPo ? 0.5 : 1,
                                }}
                                onClick={() => !isAllPo && setEditingRequisition(req)}
                                title={isAllPo ? 'Cannot edit: Purchase Order already generated' : 'Edit'}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn"
                                disabled={isAllPo}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.8rem',
                                  background: isAllPo ? '#6b7280' : '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: isAllPo ? 'not-allowed' : 'pointer',
                                  opacity: isAllPo ? 0.5 : 1,
                                }}
                                onClick={() => !isAllPo && handleDeleteRequisition(req.id)}
                                title={isAllPo ? 'Cannot delete: Purchase Order already generated' : 'Delete'}
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                                onClick={() => setViewingReq(req)}
                              >
                                View Details ({req.proposals?.length || 0} Proposals)
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ROW 1: Accepted Supplier Details: */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))' }}>
                          <td colSpan={7} style={{ padding: '0.75rem 1rem 0.9rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#10b981' }}>
                                    Accepted Supplier Details:
                                  </span>
                                  {hasAccepted && (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        padding: '0.12rem 0.5rem',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                      }}
                                    >
                                      {req.acceptedSuppliers!.length} accepted
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!hasAccepted ? (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                                  No accepted suppliers for this requisition yet.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {req.acceptedSuppliers!.map((sup) => {
                                    const isSupPoGen = isSupplierPoConverted(req, sup.id, sup.email);
                                    const supPoNumber = getSupplierPoNumber(req, sup.id, sup.email);
                                    const isReqFullyConverted = checkIsPoConverted(req);

                                    return (
                                      <div
                                        key={sup.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '0.6rem 0.9rem',
                                          borderRadius: '6px',
                                          background: 'var(--bg-primary, #0f172a)',
                                          border: isSupPoGen
                                            ? '1px solid rgba(59, 130, 246, 0.3)'
                                            : '1px solid var(--border-color)',
                                          gap: '0.75rem',
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                          <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                              {sup.name}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                              ({sup.email})
                                            </span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {/* Clickable "Accepted" button to view message */}
                                            <button
                                              type="button"
                                              className="btn"
                                              style={{
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                              }}
                                              onClick={() =>
                                                setSupplierMessageModal({
                                                  title: `Accepted Message - ${sup.name}`,
                                                  supplierName: sup.name,
                                                  supplierEmail: sup.email,
                                                  type: 'ACCEPTED',
                                                  message: sup.comments || 'Supplier accepted the collaboration request without additional comments.',
                                                })
                                              }
                                              title="Click to view message provided by supplier"
                                            >
                                              <span>💬 Accepted</span>
                                            </button>
                                            {isSupPoGen && (
                                              <span
                                                className="badge"
                                                style={{
                                                  background: 'rgba(59, 130, 246, 0.2)',
                                                  color: '#3b82f6',
                                                  border: '1px solid rgba(59, 130, 246, 0.35)',
                                                  padding: '0.2rem 0.5rem',
                                                  borderRadius: '4px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                }}
                                              >
                                                PO: {supPoNumber}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          {isSupPoGen ? (
                                            <button
                                              type="button"
                                              disabled={true}
                                              style={{
                                                padding: '0.3rem 0.75rem',
                                                fontSize: '0.8rem',
                                                background: 'var(--bg-tertiary, #4b5563)',
                                                color: 'var(--text-muted, #9ca3af)',
                                                border: '1px solid var(--border-color, #6b7280)',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                cursor: 'not-allowed',
                                                opacity: 0.75,
                                              }}
                                              title={`Purchase Order Number: ${supPoNumber} (Action not allowed - Purchase Order already generated)`}
                                            >
                                              {supPoNumber}
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                className="btn"
                                                disabled={isReqFullyConverted}
                                                style={{
                                                  padding: '0.3rem 0.75rem',
                                                  fontSize: '0.8rem',
                                                  background: isReqFullyConverted ? 'var(--bg-tertiary, #4b5563)' : '#10b981',
                                                  color: isReqFullyConverted ? 'var(--text-muted, #9ca3af)' : '#fff',
                                                  border: isReqFullyConverted ? '1px solid var(--border-color, #6b7280)' : 'none',
                                                  borderRadius: '4px',
                                                  fontWeight: 600,
                                                  cursor: isReqFullyConverted ? 'not-allowed' : 'pointer',
                                                  opacity: isReqFullyConverted ? 0.6 : 1,
                                                }}
                                                onClick={() => !isReqFullyConverted && openConvertToPoModal(req, sup)}
                                                title={
                                                  isReqFullyConverted
                                                    ? 'All available quantity has already been converted into Purchase Orders'
                                                    : `Convert to PO only for ${sup.name}`
                                                }
                                              >
                                                Convert to PO
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isReqFullyConverted}
                                                style={{
                                                  padding: '0.3rem 0.65rem',
                                                  fontSize: '0.8rem',
                                                  background: isReqFullyConverted ? 'var(--bg-tertiary, #4b5563)' : 'rgba(239, 68, 68, 0.15)',
                                                  color: isReqFullyConverted ? 'var(--text-muted, #9ca3af)' : '#ef4444',
                                                  border: isReqFullyConverted ? '1px solid var(--border-color, #6b7280)' : '1px solid rgba(239, 68, 68, 0.3)',
                                                  borderRadius: '4px',
                                                  fontWeight: 600,
                                                  cursor: isReqFullyConverted ? 'not-allowed' : 'pointer',
                                                  opacity: isReqFullyConverted ? 0.6 : 1,
                                                }}
                                                onClick={() => !isReqFullyConverted && handleDeclineAcceptedSupplier(req.id, sup.id, sup.name)}
                                                title={
                                                  isReqFullyConverted
                                                    ? 'Purchase Order already generated for available quantities'
                                                    : `Decline accepted supplier ${sup.name}`
                                                }
                                              >
                                                Decline
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ROW 2: Proposed Supplier Details: */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))' }}>
                          <td colSpan={7} style={{ padding: '0.75rem 1rem 0.9rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#8b5cf6' }}>
                                    Proposed Supplier Details:
                                  </span>
                                  {hasProposed && (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        color: '#8b5cf6',
                                        padding: '0.12rem 0.5rem',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                      }}
                                    >
                                      {req.proposals!.length} proposed
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!hasProposed ? (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                                  No proposed suppliers for this requisition yet.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {req.proposals!.map((prop) => {
                                    const isSupPoGen = isSupplierPoConverted(req, prop.supplierId, prop.supplierEmail);
                                    const isReqFullyConverted = checkIsPoConverted(req);
                                    const supPoNumber = getSupplierPoNumber(req, prop.supplierId, prop.supplierEmail);

                                    return (
                                      <div
                                        key={prop.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '0.6rem 0.9rem',
                                          borderRadius: '6px',
                                          background: 'var(--bg-primary, #0f172a)',
                                          border: isSupPoGen
                                            ? '1px solid rgba(59, 130, 246, 0.3)'
                                            : '1px solid var(--border-color)',
                                          gap: '0.75rem',
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                          <div>
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                              {prop.supplierName}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                              ({prop.supplierEmail})
                                            </span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {/* Clickable "Proposal" button to view message - replaces "Need to Evaluate" badge */}
                                            <button
                                              type="button"
                                              className="btn"
                                              style={{
                                                background: 'rgba(139, 92, 246, 0.2)',
                                                color: '#8b5cf6',
                                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                              }}
                                              onClick={() =>
                                                setSupplierMessageModal({
                                                  title: `Supplier Proposal Message - ${prop.supplierName}`,
                                                  supplierName: prop.supplierName,
                                                  supplierEmail: prop.supplierEmail,
                                                  type: 'PROPOSAL',
                                                  message: prop.proposalText || 'No proposal message provided.',
                                                  date: prop.createdAt,
                                                  fileUrl: prop.fileUrl,
                                                  fileName: prop.fileName,
                                                })
                                              }
                                              title="Click to view proposal message provided by supplier"
                                            >
                                              <span>📝 Proposal</span>
                                            </button>
                                            {isSupPoGen && (
                                              <span
                                                className="badge"
                                                style={{
                                                  background: 'rgba(59, 130, 246, 0.2)',
                                                  color: '#3b82f6',
                                                  border: '1px solid rgba(59, 130, 246, 0.35)',
                                                  padding: '0.2rem 0.5rem',
                                                  borderRadius: '4px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                }}
                                              >
                                                PO: {supPoNumber}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          {isSupPoGen ? (
                                            <button
                                              type="button"
                                              disabled={true}
                                              style={{
                                                padding: '0.3rem 0.75rem',
                                                fontSize: '0.8rem',
                                                background: 'var(--bg-tertiary, #4b5563)',
                                                color: 'var(--text-muted, #9ca3af)',
                                                border: '1px solid var(--border-color, #6b7280)',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                cursor: 'not-allowed',
                                                opacity: 0.75,
                                              }}
                                              title={`Purchase Order Number: ${supPoNumber} (Action not allowed - Purchase Order already generated)`}
                                            >
                                              {supPoNumber}
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                className="btn"
                                                disabled={isReqFullyConverted}
                                                style={{
                                                  padding: '0.3rem 0.75rem',
                                                  fontSize: '0.8rem',
                                                  background: isReqFullyConverted ? 'var(--bg-tertiary, #4b5563)' : '#10b981',
                                                  color: isReqFullyConverted ? 'var(--text-muted, #9ca3af)' : '#fff',
                                                  border: isReqFullyConverted ? '1px solid var(--border-color, #6b7280)' : 'none',
                                                  borderRadius: '4px',
                                                  fontWeight: 600,
                                                  cursor: isReqFullyConverted ? 'not-allowed' : 'pointer',
                                                  opacity: isReqFullyConverted ? 0.6 : 1,
                                                }}
                                                onClick={() =>
                                                  !isReqFullyConverted &&
                                                  openConvertToPoModal(
                                                    req,
                                                    {
                                                      id: prop.supplierId,
                                                      name: prop.supplierName,
                                                      email: prop.supplierEmail,
                                                    },
                                                    true
                                                  )
                                                }
                                                title={
                                                  isReqFullyConverted
                                                    ? 'All available quantity has already been converted into Purchase Orders'
                                                    : `Convert to PO only for ${prop.supplierName}`
                                                }
                                              >
                                                Convert to PO
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isReqFullyConverted}
                                                style={{
                                                  padding: '0.3rem 0.65rem',
                                                  fontSize: '0.8rem',
                                                  background: isReqFullyConverted ? 'var(--bg-tertiary, #4b5563)' : 'rgba(239, 68, 68, 0.15)',
                                                  color: isReqFullyConverted ? 'var(--text-muted, #9ca3af)' : '#ef4444',
                                                  border: isReqFullyConverted ? '1px solid var(--border-color, #6b7280)' : '1px solid rgba(239, 68, 68, 0.3)',
                                                  borderRadius: '4px',
                                                  fontWeight: 600,
                                                  cursor: isReqFullyConverted ? 'not-allowed' : 'pointer',
                                                  opacity: isReqFullyConverted ? 0.6 : 1,
                                                }}
                                                onClick={() =>
                                                  !isReqFullyConverted &&
                                                  handleDeclineProposedSupplier(req.id, prop.id, prop.supplierId, prop.supplierName)
                                                }
                                                title={
                                                  isReqFullyConverted
                                                    ? 'Purchase Order already generated for available quantities'
                                                    : `Decline proposed supplier ${prop.supplierName}`
                                                }
                                              >
                                                Decline
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ROW 3: Declined supplier Details: */}
                        <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))' }}>
                          <td colSpan={7} style={{ padding: '0.75rem 1rem 0.9rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ef4444' }}>
                                    Declined supplier Details:
                                  </span>
                                  {hasDeclined && (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        padding: '0.12rem 0.5rem',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                      }}
                                    >
                                      {req.declinedSuppliers!.length} declined
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!hasDeclined ? (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0' }}>
                                  No declined suppliers for this requisition yet.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {req.declinedSuppliers!.map((sup) => (
                                    <div
                                      key={sup.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.6rem 0.9rem',
                                        borderRadius: '6px',
                                        background: 'var(--bg-primary, #0f172a)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div>
                                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                            {sup.name}
                                          </span>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                            ({sup.email})
                                          </span>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {/* Clickable "Declined" button to view message */}
                                        <button
                                          type="button"
                                          className="btn"
                                          style={{
                                            padding: '0.3rem 0.75rem',
                                            fontSize: '0.8rem',
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.35)',
                                            borderRadius: '4px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                          }}
                                          onClick={() =>
                                            setSupplierMessageModal({
                                              title: `Declined Reason - ${sup.name}`,
                                              supplierName: sup.name,
                                              supplierEmail: sup.email,
                                              type: 'DECLINED',
                                              message: sup.comments || 'Supplier declined the collaboration request without additional comments.',
                                            })
                                          }
                                          title="Click to view message / reason provided by supplier"
                                        >
                                          <span>❌ Declined</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* MODAL: ACCEPTED SUPPLIERS HYPERLINK POPUP */}
      {selectedAcceptedSuppliersReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: '0.35rem', color: '#10b981', fontSize: '1.3rem' }}>
                  Accepted Suppliers for "{selectedAcceptedSuppliersReq.title}"
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Manage accepted suppliers, share orders, or send specific Purchase Orders.
                </p>
              </div>

              {selectedAcceptedSuppliersReq.acceptedSuppliers && selectedAcceptedSuppliersReq.acceptedSuppliers.length > 1 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => {
                    const req = selectedAcceptedSuppliersReq;
                    setSelectedAcceptedSuppliersReq(null);
                    openCreatePoModal(req, undefined, 'ALL_ACCEPTED');
                  }}
                  title="Share this order to all accepted suppliers with assigned quantities"
                >
                  📤 Share Order to All Accepted Suppliers
                </button>
              )}
            </div>

            {selectedAcceptedSuppliersReq.acceptedSuppliers && selectedAcceptedSuppliersReq.acceptedSuppliers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.25rem 0' }}>
                {selectedAcceptedSuppliersReq.acceptedSuppliers.map((sup) => (
                  <div
                    key={sup.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{sup.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sup.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Accepted
                      </span>
                      {(() => {
                        const isSupPoGen = isSupplierPoConverted(selectedAcceptedSuppliersReq, sup.id, sup.email);
                        const isReqFullyConverted = checkIsPoConverted(selectedAcceptedSuppliersReq);
                        const supPoNum = getSupplierPoNumber(selectedAcceptedSuppliersReq, sup.id, sup.email);
                        const isPoDisabled = isSupPoGen || isReqFullyConverted;

                        return (
                          <>
                            <button
                              type="button"
                              className="btn"
                              disabled={isPoDisabled}
                              style={{
                                background: isPoDisabled ? 'var(--bg-tertiary, #4b5563)' : '#10b981',
                                color: isPoDisabled ? 'var(--text-muted, #9ca3af)' : '#fff',
                                border: isPoDisabled ? '1px solid var(--border-color, #6b7280)' : 'none',
                                borderRadius: '4px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isPoDisabled ? 'not-allowed' : 'pointer',
                                opacity: isPoDisabled ? 0.75 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              onClick={() => {
                                if (isPoDisabled) return;
                                const req = selectedAcceptedSuppliersReq;
                                openConvertToPoModal(req, sup);
                              }}
                              title={
                                isSupPoGen
                                  ? `Purchase Order already generated: ${supPoNum}`
                                  : isReqFullyConverted
                                    ? 'All available quantity has already been converted into Purchase Orders'
                                    : 'Convert To PO'
                              }
                            >
                              {isSupPoGen ? supPoNum : 'Convert To PO'}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={isPoDisabled}
                              style={{
                                background: isPoDisabled ? 'var(--bg-tertiary, #4b5563)' : 'rgba(239, 68, 68, 0.15)',
                                color: isPoDisabled ? 'var(--text-muted, #9ca3af)' : '#ef4444',
                                border: isPoDisabled ? '1px solid var(--border-color, #6b7280)' : '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '4px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isPoDisabled ? 'not-allowed' : 'pointer',
                                opacity: isPoDisabled ? 0.5 : 1
                              }}
                              onClick={() => !isPoDisabled && handleDeclineAcceptedSupplier(selectedAcceptedSuppliersReq.id, sup.id, sup.name)}
                              title={
                                isSupPoGen
                                  ? 'Cannot decline: Purchase Order already generated'
                                  : isReqFullyConverted
                                    ? 'Purchase Order already generated for available quantities'
                                    : `Decline supplier ${sup.name}`
                              }
                            >
                              ✕ Decline
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', margin: '1rem 0' }}>
                No accepted suppliers available.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedAcceptedSuppliersReq(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT NON-CATALOG ITEM */}
      {showNonCatalogModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
              {editingItemIndex !== null ? 'Edit Non-Catalog Item Details' : 'Create Non-Catalog Item'}
            </h3>

            {modalSupplierError && (
              <div
                className="alert-error"
                style={{
                  marginBottom: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  lineHeight: '1.55',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.35rem', lineHeight: '1.2' }}>⚠️</span>
                <div style={{ flex: 1, whiteSpace: 'pre-line' }}>{modalSupplierError}</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter detailed description of the non-catalog item"
                value={nonCatDescription}
                onChange={(e) => setNonCatDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter product name"
                value={nonCatProductName}
                onChange={(e) => setNonCatProductName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Enter quantity"
                  value={nonCatQuantity}
                  onChange={(e) => setNonCatQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Unit Measure *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Each, Box, Kg, Hours"
                  value={nonCatUnitMeasure}
                  onChange={(e) => setNonCatUnitMeasure(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="Enter price"
                  value={nonCatPrice}
                  onChange={(e) => setNonCatPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Currency Type *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. USD, EUR, INR"
                  value={nonCatCurrencyType}
                  onChange={(e) => setNonCatCurrencyType(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Selection of Multiple Supplier *</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select one or more suppliers to send this collaboration requisition request to:</p>
              {suppliers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registered suppliers available.</div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: modalSupplierError ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  }}
                >
                  {suppliers.map((sup) => (
                    <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={modalSelectedSupplierIds.includes(sup.id)}
                        onChange={() => handleToggleSupplierSelectionInModal(sup.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span><strong>{sup.name}</strong> ({sup.email})</span>
                    </label>
                  ))}
                </div>
              )}
              {modalSupplierError && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 500 }}>
                  The selected suppliers must match the suppliers chosen in the Collaboration Requisition form.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowNonCatalogModal(false);
                  setEditingItemIndex(null);
                  setNonCatPrice('');
                  setNonCatQuantity('');
                  setNonCatCurrencyType('');
                  setModalSupplierError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveItemModal}
              >
                {editingItemIndex !== null ? 'Save Item Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COLLABORATION REQUISITION */}
      {editingRequisition && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Edit Collaboration Requisition</h3>

            <form onSubmit={handleUpdateRequisition}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingRequisition.title}
                  onChange={(e) => setEditingRequisition({ ...editingRequisition, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Ship To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRequisition.shipTo}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, shipTo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Deliver To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRequisition.deliverTo}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, deliverTo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Need By Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingRequisition.needByDate}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, needByDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Comments</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRequisition.comments || ''}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, comments: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                <label className="form-label">Selection of Suppliers</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Update suppliers assigned to this requisition:</p>
                {suppliers.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registered suppliers available.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {suppliers.map((sup) => {
                      const isChecked = (editingRequisition.suppliers || []).some((s) => s.id === sup.id);
                      return (
                        <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEditReqSupplier(sup.id)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span><strong>{sup.name}</strong> ({sup.email})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                    Line Items ({(editingRequisition.items || []).length})
                  </h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: 'auto', fontSize: '0.85rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => openAddItemModal('EDIT_REQ')}
                  >
                    ➕ Add Non-Catalog Item
                  </button>
                </div>

                {(!editingRequisition.items || editingRequisition.items.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center' }}>
                    No line items attached to this requisition.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Product Name</th>
                          <th style={{ padding: '0.5rem' }}>Full Description</th>
                          <th style={{ padding: '0.5rem' }}>Quantity</th>
                          <th style={{ padding: '0.5rem' }}>Unit</th>
                          <th style={{ padding: '0.5rem' }}>Price</th>
                          <th style={{ padding: '0.5rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingRequisition.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.productName}</td>
                            <td style={{ padding: '0.5rem' }}>{item.fullDescription}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ width: '75px', padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                                value={item.quantity}
                                onChange={(e) => handleInlineEditReqItemQuantityChange(idx, Number(e.target.value))}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span>{item.currencyType ? `${item.currencyType} ` : '$'}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-input"
                                  style={{ width: '85px', padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                                  value={item.price}
                                  onChange={(e) => handleInlineEditReqItemPriceChange(idx, Number(e.target.value))}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditItemModal('EDIT_REQ', idx)}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                                >
                                  Edit Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditReqItem(idx)}
                                  style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                >
                                  Remove
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingRequisition(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS & SUPPLIER PROPOSALS EVALUATION */}
      {viewingReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '800px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>Collaboration Requisition Details</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Title: <strong style={{ color: 'var(--text-primary)' }}>{viewingReq.title}</strong></p>
              </div>
              <div>{renderStatusColumn(viewingReq)}</div>
            </div>

            {/* Assigned Suppliers */}
            <div style={{ marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Assigned Suppliers:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {viewingReq.suppliers && viewingReq.suppliers.length > 0 ? (
                  viewingReq.suppliers.map((sup) => (
                    <span key={sup.id} className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.25rem 0.6rem' }}>
                      {sup.name} ({sup.email})
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None assigned</span>
                )}
              </div>
            </div>

            {/* Items */}
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Attached Items ({viewingReq.items?.length || 0})</h4>
            {viewingReq.items && viewingReq.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Product Name</th>
                    <th style={{ padding: '0.5rem' }}>Full Description</th>
                    <th style={{ padding: '0.5rem' }}>Qty</th>
                    <th style={{ padding: '0.5rem' }}>Unit</th>
                    <th style={{ padding: '0.5rem' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingReq.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '0.5rem' }}>{item.fullDescription}</td>
                      <td style={{ padding: '0.5rem' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                      <td style={{ padding: '0.5rem' }}>{item.currencyType ? `${item.currencyType} ` : '$'}{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>No items attached.</div>
            )}

            {/* Generated Purchase Orders from this Collaboration Requisition */}
            {viewingReq.purchaseOrders && viewingReq.purchaseOrders.length > 0 && (
              <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.65rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📦</span> Generated Purchase Orders ({viewingReq.purchaseOrders.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {viewingReq.purchaseOrders.map((po) => {
                    const poNum = po.requisitionId || (po.reqNumber ? `PO${String(po.reqNumber).padStart(2, '0')}` : 'PO');
                    return (
                      <div
                        key={po.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'var(--bg-secondary)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#3b82f6', fontSize: '0.92rem' }}>{poNum}</strong>
                          <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{po.title}</span>
                          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                            → Supplier: <strong style={{ color: 'var(--text-primary)' }}>{po.supplierName || po.supplierEmail || 'Assigned'}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Need by: {po.needByDate || '-'}</span>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                            {po.status || 'PO'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Supplier Proposals Received & Evaluation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Supplier Proposals Received ({viewingReq.proposals?.length || 0})
              </h4>
              {viewingReq.proposals && viewingReq.proposals.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleEvaluateAllProposals(viewingReq.id, 'Need to Evaluate')}
                    title="Mark all proposals as Pending / Need to Evaluate"
                  >
                    ⏳ Mark All Pending
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleEvaluateAllProposals(viewingReq.id, 'Declined')}
                    title="Decline all supplier proposals"
                  >
                    ✕ Decline All Proposals
                  </button>
                </div>
              )}
            </div>

            {viewingReq.proposals && viewingReq.proposals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {viewingReq.proposals.map((prop) => {
                  const isAccepted = prop.evaluationStatus === 'Accepted';
                  const isDeclined = prop.evaluationStatus === 'Declined';
                  return (
                    <div key={prop.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>{prop.supplierName}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({prop.supplierEmail})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge" style={{
                            background: isAccepted
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isDeclined
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color: isAccepted
                              ? '#10b981'
                              : isDeclined
                                ? '#ef4444'
                                : '#f59e0b',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}>
                            {isAccepted ? 'Accepted' : isDeclined ? 'Declined' : 'Pending / Need to Evaluate'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(prop.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: '0.5rem 0 0.85rem 0', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {prop.proposalText}
                      </p>

                      {prop.fileUrl && (
                        <div style={{ margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '1.1rem' }}>📎</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, wordBreak: 'break-all' }}>
                            {prop.fileName || 'Attached Proposal File'}
                          </span>
                          <a
                            href={getFileUrl(prop.fileUrl)}
                            download={prop.fileName || 'proposal-attachment'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.25rem 0.65rem',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              textDecoration: 'none',
                            }}
                          >
                            ⬇ Download
                          </a>
                        </div>
                      )}

                      {/* Buyer Evaluation & PO Buttons */}
                      {(() => {
                        const isPropPoGen = isSupplierPoConverted(viewingReq, prop.supplierId, prop.supplierEmail);
                        const isReqFullyConverted = checkIsPoConverted(viewingReq);
                        const propPoNum = getSupplierPoNumber(viewingReq, prop.supplierId, prop.supplierEmail);
                        const isPoDisabled = isPropPoGen || isReqFullyConverted;

                        return (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn"
                              disabled={isPropPoGen}
                              style={{
                                padding: '0.35rem 0.85rem',
                                fontSize: '0.82rem',
                                background: isPropPoGen ? 'var(--bg-tertiary, #4b5563)' : (isAccepted ? '#10b981' : 'transparent'),
                                color: isPropPoGen ? 'var(--text-muted, #9ca3af)' : (isAccepted ? '#fff' : '#10b981'),
                                border: isPropPoGen ? '1px solid var(--border-color, #6b7280)' : '1px solid #10b981',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: isPropPoGen ? 'not-allowed' : 'pointer',
                                opacity: isPropPoGen ? 0.5 : 1
                              }}
                              onClick={() => !isPropPoGen && handleEvaluateProposal(prop.id, 'Accepted')}
                            >
                              ✓ Accept Proposal
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={isPropPoGen}
                              style={{
                                padding: '0.35rem 0.85rem',
                                fontSize: '0.82rem',
                                background: isPropPoGen ? 'var(--bg-tertiary, #4b5563)' : ((!isAccepted && !isDeclined) ? '#f59e0b' : 'transparent'),
                                color: isPropPoGen ? 'var(--text-muted, #9ca3af)' : ((!isAccepted && !isDeclined) ? '#fff' : '#f59e0b'),
                                border: isPropPoGen ? '1px solid var(--border-color, #6b7280)' : '1px solid #f59e0b',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: isPropPoGen ? 'not-allowed' : 'pointer',
                                opacity: isPropPoGen ? 0.5 : 1
                              }}
                              onClick={() => !isPropPoGen && handleEvaluateProposal(prop.id, 'Need to Evaluate')}
                            >
                              ⏳ Make Pending
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={isPropPoGen}
                              style={{
                                padding: '0.35rem 0.85rem',
                                fontSize: '0.82rem',
                                background: isPropPoGen ? 'var(--bg-tertiary, #4b5563)' : (isDeclined ? '#ef4444' : 'transparent'),
                                color: isPropPoGen ? 'var(--text-muted, #9ca3af)' : (isDeclined ? '#fff' : '#ef4444'),
                                border: isPropPoGen ? '1px solid var(--border-color, #6b7280)' : '1px solid #ef4444',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: isPropPoGen ? 'not-allowed' : 'pointer',
                                opacity: isPropPoGen ? 0.5 : 1
                              }}
                              onClick={() => !isPropPoGen && handleEvaluateProposal(prop.id, 'Declined')}
                            >
                              ✕ Decline Proposal
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={isPoDisabled}
                              style={{
                                padding: '0.35rem 0.85rem',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: isPoDisabled ? 'not-allowed' : 'pointer',
                                background: isPoDisabled ? 'var(--bg-tertiary, #4b5563)' : undefined,
                                color: isPoDisabled ? 'var(--text-muted, #9ca3af)' : undefined,
                                border: isPoDisabled ? '1px solid var(--border-color, #6b7280)' : undefined,
                                opacity: isPoDisabled ? 0.75 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                              onClick={() => {
                                if (isPoDisabled) return;
                                const req = viewingReq;
                                openConvertToPoModal(
                                  req,
                                  {
                                    id: prop.supplierId,
                                    name: prop.supplierName,
                                    email: prop.supplierEmail
                                  },
                                  true
                                );
                              }}
                              title={
                                isPropPoGen
                                  ? `Purchase Order already generated: ${propPoNum}`
                                  : isReqFullyConverted
                                    ? 'All available quantity has already been converted into Purchase Orders'
                                    : 'Convert To PO'
                              }
                            >
                              {isPropPoGen ? propPoNum : 'Convert To PO'}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', marginBottom: '1.5rem' }}>
                No supplier proposals submitted yet.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingReq(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER FROM COLLABORATION REQUISITION */}
      {showCreatePoModal && poCollabReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300 }}>
          <div className="glass-card" style={{ width: '92%', maxWidth: '850px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📦</span> Convert Collaboration Requisition into Purchase Order
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
                  Convert requisition to Purchase Order and assign item quantities to supplier(s).
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                {poCollabReq.title}
              </span>
            </div>

            {poError && (
              <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
                {poError}
              </div>
            )}

            <form onSubmit={handleCreatePoSubmit}>
              {/* Supplier Selection Mode */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Target Supplier *</label>
                {poCollabReq.acceptedSuppliers && poCollabReq.acceptedSuppliers.length > 1 && (
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="poMode"
                        value="SPECIFIC"
                        checked={poMode === 'SPECIFIC'}
                        onChange={() => setPoMode('SPECIFIC')}
                      />
                      <span>Send to Specific Supplier</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="poMode"
                        value="ALL_ACCEPTED"
                        checked={poMode === 'ALL_ACCEPTED'}
                        onChange={() => setPoMode('ALL_ACCEPTED')}
                      />
                      <span>Share Order to All Accepted Suppliers ({poCollabReq.acceptedSuppliers.length})</span>
                    </label>
                  </div>
                )}

                {poMode === 'SPECIFIC' ? (
                  <div>
                    <select
                      className="form-input"
                      value={poSelectedSupplierId}
                      onChange={(e) => setPoSelectedSupplierId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Target Supplier --</option>
                      {/* Accepted suppliers first */}
                      {poCollabReq.acceptedSuppliers && poCollabReq.acceptedSuppliers.length > 0 && (
                        <optgroup label="Accepted Suppliers">
                          {poCollabReq.acceptedSuppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              ✓ [Accepted] {s.name} ({s.email})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {/* Suppliers with proposals */}
                      {poCollabReq.proposals && poCollabReq.proposals.length > 0 && (
                        <optgroup label="Suppliers with Submitted Proposals">
                          {poCollabReq.proposals.map((p) => (
                            <option key={`prop-${p.supplierId}`} value={p.supplierId}>
                              📝 [Proposal: {p.evaluationStatus}] {p.supplierName} ({p.supplierEmail})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {/* Other invited suppliers */}
                      <optgroup label="Other Assigned Suppliers">
                        {poCollabReq.suppliers
                          .filter((s) => !poCollabReq.acceptedSuppliers?.some((as) => as.id === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.email})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>A separate Purchase Order will be created and shared to each of the {poCollabReq.acceptedSuppliers?.length || 0} accepted suppliers:</span>
                    <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                      {poCollabReq.acceptedSuppliers?.map((s) => (
                        <li key={s.id}><strong>{s.name}</strong> ({s.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Order Fields */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Purchase Order Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={poTitle}
                    onChange={(e) => setPoTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Need By Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={poNeedByDate}
                    onChange={(e) => setPoNeedByDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Ship To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={poShipTo}
                    onChange={(e) => setPoShipTo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Deliver To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={poDeliverTo}
                    onChange={(e) => setPoDeliverTo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Comments</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional comments for this Purchase Order"
                  value={poComments}
                  onChange={(e) => setPoComments(e.target.value)}
                />
              </div>

              {/* Item Quantity Assignment Table */}
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Assign Item Quantities for this Purchase Order *
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Multiple POs can be created by assigning partial or full quantities
                  </span>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  ℹ️ <strong>Quantity Assignment:</strong> Specify the exact quantity of each item you want to include in this Purchase Order. You can create multiple Purchase Orders for each supplier by assigning portions of item quantities.
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem', width: '50px' }}>Include</th>
                        <th style={{ padding: '0.5rem' }}>Product Name</th>
                        <th style={{ padding: '0.5rem' }}>Description</th>
                        <th style={{ padding: '0.5rem' }}>Unit</th>
                        <th style={{ padding: '0.5rem' }}>Original Qty</th>
                        <th style={{ padding: '0.5rem' }}>Assigned Qty *</th>
                        <th style={{ padding: '0.5rem' }}>Unit Price</th>
                        <th style={{ padding: '0.5rem' }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item, idx) => {
                        const lineTotal = item.included && item.assignedQuantity > 0
                          ? (item.assignedQuantity * (item.price || 0))
                          : 0;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', opacity: item.included ? 1 : 0.5 }}>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item.included}
                                onChange={() => handleTogglePoItemIncluded(idx)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.productName}</td>
                            <td style={{ padding: '0.5rem' }}>{item.fullDescription}</td>
                            <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{item.originalQuantity}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                max={item.originalQuantity}
                                className="form-input"
                                style={{ width: '85px', padding: '0.25rem 0.45rem', fontSize: '0.85rem' }}
                                value={item.assignedQuantity}
                                disabled={!item.included}
                                onChange={(e) => handlePoItemQuantityChange(idx, Number(e.target.value))}
                                required={item.included}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              {item.currencyType ? `${item.currencyType} ` : '$'}{item.price.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.currencyType ? `${item.currencyType} ` : '$'}{lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                  <span>Total Order Amount:&nbsp;</span>
                  <span style={{ color: '#10b981' }}>
                    ${poItems.reduce((acc, curr) => curr.included && curr.assignedQuantity > 0 ? acc + (curr.assignedQuantity * (curr.price || 0)) : acc, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={poSubmitting}
                  onClick={() => setShowCreatePoModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={poSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {poSubmitting ? 'Converting to Purchase Order...' : 'Convert To PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SUPPLIER MESSAGE (ACCEPTED / PROPOSAL / DECLINED) */}
      {supplierMessageModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
          }}
          onClick={() => setSupplierMessageModal(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '90%',
              maxWidth: '560px',
              padding: '2rem',
              borderRadius: '12px',
              background: 'var(--bg-secondary, #1e293b)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3
                  style={{
                    margin: '0 0 0.35rem 0',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color:
                      supplierMessageModal.type === 'ACCEPTED'
                        ? '#10b981'
                        : supplierMessageModal.type === 'PROPOSAL'
                          ? '#a855f7'
                          : '#ef4444',
                  }}
                >
                  {supplierMessageModal.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Supplier: <strong>{supplierMessageModal.supplierName}</strong> ({supplierMessageModal.supplierEmail})
                </p>
                {supplierMessageModal.date && (
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Submitted on: {new Date(supplierMessageModal.date).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSupplierMessageModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0 0.25rem',
                  lineHeight: 1,
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Message provided by the Supplier:
              </label>
              <div
                style={{
                  background: 'var(--bg-primary, #0f172a)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.92rem',
                  color: 'var(--text-primary)',
                  minHeight: '90px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}
              >
                {supplierMessageModal.message && supplierMessageModal.message.trim().length > 0 ? (
                  supplierMessageModal.message
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No comments or message were provided by the supplier.
                  </span>
                )}
              </div>
            </div>

            {supplierMessageModal.fileUrl && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-primary, #0f172a)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '1.5rem' }}>📎</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {supplierMessageModal.fileName || 'Attached Proposal File'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Attached document provided by supplier
                    </div>
                  </div>
                </div>
                <a
                  href={getFileUrl(supplierMessageModal.fileUrl)}
                  download={supplierMessageModal.fileName || 'proposal-attachment'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    background: '#6366f1',
                    borderColor: '#6366f1',
                  }}
                >
                  <span>⬇</span> Download File
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSupplierMessageModal(null)}
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.9rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT TO PO QUANTITY SELECTION */}
      {convertToPoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !convertToPoSubmitting) {
              setConvertToPoModal(null);
              setConvertToPoError('');
            }
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              background: 'var(--bg-primary, #0f172a)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #334155)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Convert to Purchase Order
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Assign quantity for Supplier: <strong style={{ color: '#10b981' }}>{convertToPoModal.supplierName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!convertToPoSubmitting) {
                    setConvertToPoModal(null);
                    setConvertToPoError('');
                  }
                }}
                disabled={convertToPoSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  cursor: convertToPoSubmitting ? 'not-allowed' : 'pointer',
                  padding: '0.2rem 0.5rem',
                }}
              >
                &times;
              </button>
            </div>

            {convertToPoError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                  fontSize: '0.88rem',
                }}
              >
                {convertToPoError}
              </div>
            )}

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color, #334155)', background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))' }}>
                    <th style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>Product Name</th>
                    <th style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>Full Description</th>
                    <th style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)', minWidth: '130px' }}>Quantity</th>
                    <th style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>Unit</th>
                    <th style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {convertToPoModal.items.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color, #334155)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      }}
                    >
                      {/* Product Name (read-only) */}
                      <td style={{ padding: '0.85rem 0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.productName}
                      </td>

                      {/* Full Description (read-only) */}
                      <td style={{ padding: '0.85rem 0.6rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                        {item.fullDescription || '-'}
                      </td>

                      {/* Quantity (Buyer can change quantity only) */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <input
                            type="number"
                            min="1"
                            max={item.maxQuantity}
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => handleConvertToPoItemQtyChange(idx, e.target.value)}
                            disabled={convertToPoSubmitting}
                            className="form-input"
                            style={{
                              width: '110px',
                              padding: '0.4rem 0.5rem',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: '1px solid var(--border-color, #475569)',
                              background: 'var(--bg-secondary, #1e293b)',
                              color: 'var(--text-primary, #fff)',
                            }}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Available: {item.maxQuantity}
                          </span>
                        </div>
                      </td>

                      {/* Unit (read-only) */}
                      <td style={{ padding: '0.85rem 0.6rem', color: 'var(--text-primary)' }}>
                        {item.unitMeasure || 'Each'}
                      </td>

                      {/* Price (Editable only for Proposed Suppliers) */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        {convertToPoModal.isProposedSupplier ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {item.currencyType || 'USD'}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price === 0 ? '' : item.price}
                              onChange={(e) => handleConvertToPoItemPriceChange(idx, e.target.value)}
                              disabled={convertToPoSubmitting}
                              className="form-input"
                              placeholder="0.00"
                              style={{
                                width: '110px',
                                padding: '0.4rem 0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid var(--border-color, #475569)',
                                background: 'var(--bg-secondary, #1e293b)',
                                color: 'var(--text-primary, #fff)',
                              }}
                            />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {item.currencyType || 'USD'} {Number(item.price || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-color, #334155)',
                paddingTop: '1.25rem',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setConvertToPoModal(null);
                  setConvertToPoError('');
                }}
                disabled={convertToPoSubmitting}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmConvertToPo}
                disabled={convertToPoSubmitting}
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.9rem',
                  background: '#10b981',
                  borderColor: '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {convertToPoSubmitting ? 'Converting...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CollaborationRequisitionPage;

