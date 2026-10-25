import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface RequisitionItem {
  id?: string;
  itemType: 'CATALOG' | 'NON_CATALOG';
  catalogueId?: string;
  productName: string;
  fullDescription: string;
  quantity: number | '';
  unitMeasure: string;
  price: number;
  currencyType?: string;
  supplierId?: string;
  supplierName?: string;
}

interface RequisitionData {
  id: string;
  requisitionId?: string;
  reqNumber?: number;
  title: string;
  shipTo: string;
  deliverTo: string;
  needByDate: string;
  comments: string;
  supplierComment?: string;
  cancellationReason?: string;
  status: string;
  createdAt: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  supplierId?: string;
  supplierEmail?: string;
  supplierName?: string;
  items: RequisitionItem[];
}

interface Supplier {
  id: string;
  email: string;
  name: string;
  accountType: string;
}

interface CatalogueItem {
  id: string;
  productName: string;
  productType: string;
  price: number;
  currencyType?: string;
  description: string;
  imageUrl?: string;
  userId: string;
}

const RequisitionPage: React.FC = () => {
  const [requisitions, setRequisitions] = useState<RequisitionData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Create Requisition form state
  const [title, setTitle] = useState('');
  const [shipTo, setShipTo] = useState('');
  const [deliverTo, setDeliverTo] = useState('');
  const [needByDate, setNeedByDate] = useState('');
  const [comments, setComments] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([]);

  // Modals state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSupplierId, setCatalogSupplierId] = useState('');
  const [catalogItems, setCatalogItems] = useState<CatalogueItem[]>([]);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const [showNonCatalogModal, setShowNonCatalogModal] = useState(false);
  const [nonCatDescription, setNonCatDescription] = useState('');
  const [nonCatProductName, setNonCatProductName] = useState('');
  const [nonCatQuantity, setNonCatQuantity] = useState<number | ''>('');
  const [nonCatUnitMeasure, setNonCatUnitMeasure] = useState('Each');
  const [nonCatPrice, setNonCatPrice] = useState<number | ''>('');
  const [nonCatCurrencyType, setNonCatCurrencyType] = useState<string>('');
  const [nonCatSupplierId, setNonCatSupplierId] = useState('');
  const [nonCatError, setNonCatError] = useState('');

  // Edit state
  const [editingRequisition, setEditingRequisition] = useState<RequisitionData | null>(null);
  const [viewingItemsReq, setViewingItemsReq] = useState<RequisitionData | null>(null);

  // Copy PO state
  const [copyingRequisition, setCopyingRequisition] = useState<RequisitionData | null>(null);
  const [sourcePoTitle, setSourcePoTitle] = useState<string>('');

  // Cancel PO state
  const [cancellingRequisition, setCancellingRequisition] = useState<RequisitionData | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [submittingCancellation, setSubmittingCancellation] = useState<boolean>(false);
  const [cancelModalError, setCancelModalError] = useState<string>('');

  const location = useLocation();
  const [highlightedReqId, setHighlightedReqId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequisitions();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetReqId = params.get('reqId') || (location.hash ? location.hash.replace('#req-', '') : null);
    if (targetReqId && requisitions.length > 0) {
      const found = requisitions.find(
        (r) =>
          r.id === targetReqId ||
          (r.requisitionId && r.requisitionId.toLowerCase() === targetReqId.toLowerCase())
      );
      if (found) {
        setHighlightedReqId(found.id);
        setViewingItemsReq(found);
        setTimeout(() => {
          const el = document.getElementById(`req-${found.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [location.search, location.hash, requisitions]);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/requisitions');
      setRequisitions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch requisitions');
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

  const getCatalogSupplierMismatchMsg = (reqSupId: string, currentModalSupId: string): string => {
    const reqSup = suppliers.find((s) => s.id === reqSupId);
    const catSup = suppliers.find((s) => s.id === currentModalSupId);

    const reqLabel = reqSup ? `${reqSup.name} (${reqSup.email})` : reqSupId;
    const catLabel = catSup ? `${catSup.name} (${catSup.email})` : (currentModalSupId ? currentModalSupId : 'None selected');

    return `The Supplier which was selected in Requisition form should match with Add Catalog page -> Select Supplier.\n\n• Requisition Form Supplier: ${reqLabel}\n• Add Catalog Page Supplier: ${catLabel}\n\nNote: All catalog items in a requisition must be procured from the same supplier ("${reqSup ? reqSup.name : reqLabel}"). Please select "${reqSup ? reqSup.name : reqLabel}" in Add Catalog page to add items.`;
  };

  const getNonCatSupplierMismatchMsg = (reqSupId: string, currentModalSupId: string): string => {
    const reqSup = suppliers.find((s) => s.id === reqSupId);
    const nonCatSup = suppliers.find((s) => s.id === currentModalSupId);

    const reqLabel = reqSup ? `${reqSup.name} (${reqSup.email})` : reqSupId;
    const nonCatLabel = nonCatSup ? `${nonCatSup.name} (${nonCatSup.email})` : (currentModalSupId ? currentModalSupId : 'None selected');

    return `The Supplier which was selected in Requisition form should match with Add Non-Catalog page -> Select Supplier.\n\n• Requisition Form Supplier: ${reqLabel}\n• Add Non-Catalog Page Supplier: ${nonCatLabel}\n\nNote: All non-catalog items in a requisition must be procured from the same supplier ("${reqSup ? reqSup.name : reqLabel}"). Please select "${reqSup ? reqSup.name : reqLabel}" in Add Non-Catalog page to create items.`;
  };

  const handleOpenCatalogModal = () => {
    setShowCatalogModal(true);
    setCatalogError('');
    const activeSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');

    const initialSupId = activeSupId || (suppliers.length > 0 ? suppliers[0].id : '');
    setCatalogSupplierId(initialSupId);
    if (initialSupId) {
      loadCatalogForSupplier(initialSupId);
    } else {
      setCatalogItems([]);
    }
  };

  const handleCatalogSupplierChange = (newSupId: string) => {
    setCatalogSupplierId(newSupId);
    const activeSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');

    if (activeSupId && newSupId !== activeSupId) {
      setCatalogError(getCatalogSupplierMismatchMsg(activeSupId, newSupId));
    } else {
      setCatalogError('');
    }

    if (newSupId) {
      loadCatalogForSupplier(newSupId);
    } else {
      setCatalogItems([]);
    }
  };

  const loadCatalogForSupplier = async (supId: string) => {
    try {
      setCatalogLoading(true);
      const res = await api.get(`/api/requisitions/suppliers/${supId}/catalogs`);
      setCatalogItems(res.data);
    } catch (err) {
      console.error('Failed to fetch supplier catalog', err);
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleToggleCatalogSelection = (catId: string) => {
    if (selectedCatalogIds.includes(catId)) {
      setSelectedCatalogIds(selectedCatalogIds.filter((id) => id !== catId));
    } else {
      setSelectedCatalogIds([...selectedCatalogIds, catId]);
    }
  };

  const handleAddSelectedCatalogs = () => {
    const activeSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');

    if (activeSupId && catalogSupplierId !== activeSupId) {
      setCatalogError(getCatalogSupplierMismatchMsg(activeSupId, catalogSupplierId));
      return;
    }

    const selectedSupplierObj = suppliers.find((s) => s.id === catalogSupplierId);
    const selectedCats = catalogItems.filter((c) => selectedCatalogIds.includes(c.id));

    const newReqItems: RequisitionItem[] = selectedCats.map((cat) => ({
      itemType: 'CATALOG',
      catalogueId: cat.id,
      productName: cat.productName,
      fullDescription: cat.description,
      quantity: '',
      unitMeasure: 'Each',
      price: cat.price,
      currencyType: cat.currencyType || 'USD',
      supplierId: catalogSupplierId,
      supplierName: selectedSupplierObj?.name,
    }));

    if (copyingRequisition) {
      setCopyingRequisition({
        ...copyingRequisition,
        items: [...(copyingRequisition.items || []), ...newReqItems],
        supplierId: copyingRequisition.supplierId || catalogSupplierId,
      });
    } else if (editingRequisition) {
      setEditingRequisition({
        ...editingRequisition,
        items: [...(editingRequisition.items || []), ...newReqItems],
        supplierId: editingRequisition.supplierId || catalogSupplierId,
      });
    } else {
      setItems([...items, ...newReqItems]);
      if (!selectedSupplierId && catalogSupplierId) {
        setSelectedSupplierId(catalogSupplierId);
      }
    }

    setShowCatalogModal(false);
    setSelectedCatalogIds([]);
    setCatalogError('');
  };

  const handleCreateNonCatalogItem = () => {
    const activeSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');

    if (activeSupId && nonCatSupplierId !== activeSupId) {
      setNonCatError(getNonCatSupplierMismatchMsg(activeSupId, nonCatSupplierId));
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
    if (nonCatQuantity === '' || isNaN(Number(nonCatQuantity)) || Number(nonCatQuantity) <= 0) {
      alert('Quantity is required and must be greater than 0');
      return;
    }
    if (!nonCatUnitMeasure.trim()) {
      alert('Unit Measure is required');
      return;
    }
    if (nonCatPrice === '' || isNaN(Number(nonCatPrice))) {
      alert('Price is required');
      return;
    }
    if (Number(nonCatPrice) < 0) {
      alert('Price cannot be negative');
      return;
    }
    if (!nonCatCurrencyType.trim()) {
      alert('Currency Type is required');
      return;
    }

    const supObj = suppliers.find((s) => s.id === nonCatSupplierId);

    const newItem: RequisitionItem = {
      itemType: 'NON_CATALOG',
      productName: nonCatProductName.trim(),
      fullDescription: nonCatDescription.trim(),
      quantity: Number(nonCatQuantity),
      unitMeasure: nonCatUnitMeasure.trim(),
      price: Number(nonCatPrice),
      currencyType: nonCatCurrencyType.trim().toUpperCase(),
      supplierId: nonCatSupplierId || undefined,
      supplierName: supObj?.name,
    };

    if (copyingRequisition) {
      setCopyingRequisition({
        ...copyingRequisition,
        items: [...(copyingRequisition.items || []), newItem],
        supplierId: copyingRequisition.supplierId || nonCatSupplierId,
      });
    } else if (editingRequisition) {
      setEditingRequisition({
        ...editingRequisition,
        items: [...(editingRequisition.items || []), newItem],
        supplierId: editingRequisition.supplierId || nonCatSupplierId,
      });
    } else {
      setItems([...items, newItem]);
      if (!selectedSupplierId && nonCatSupplierId) {
        setSelectedSupplierId(nonCatSupplierId);
      }
    }

    // Reset non-catalog form & close modal
    setNonCatProductName('');
    setNonCatDescription('');
    setNonCatQuantity('');
    setNonCatUnitMeasure('Each');
    setNonCatPrice('');
    setNonCatCurrencyType('');
    setNonCatSupplierId('');
    setNonCatError('');
    setShowNonCatalogModal(false);
  };

  const handleOpenNonCatalogModal = () => {
    const initialSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');
    setNonCatSupplierId(initialSupId);
    setNonCatError('');
    setNonCatProductName('');
    setNonCatDescription('');
    setNonCatQuantity('');
    setNonCatUnitMeasure('Each');
    setNonCatPrice('');
    setNonCatCurrencyType('');
    setShowNonCatalogModal(true);
  };

  const handleNonCatSupplierChange = (newSupId: string) => {
    setNonCatSupplierId(newSupId);
    const activeSupId = copyingRequisition
      ? (copyingRequisition.supplierId || '')
      : editingRequisition
        ? (editingRequisition.supplierId || '')
        : (selectedSupplierId || '');

    if (activeSupId && newSupId !== activeSupId) {
      setNonCatError(getNonCatSupplierMismatchMsg(activeSupId, newSupId));
    } else {
      setNonCatError('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, qty: number | '') => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: qty };
    setItems(updated);
  };

  const handleUpdateEditingItemQuantity = (index: number, qty: number | '') => {
    if (!editingRequisition) return;
    const updatedItems = [...(editingRequisition.items || [])];
    updatedItems[index] = { ...updatedItems[index], quantity: qty };
    setEditingRequisition({ ...editingRequisition, items: updatedItems });
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], price: Math.max(0, price) };
    setItems(updated);
  };

  const handleUpdateEditingItemPrice = (index: number, price: number) => {
    if (!editingRequisition) return;
    const updatedItems = [...(editingRequisition.items || [])];
    updatedItems[index] = { ...updatedItems[index], price: Math.max(0, price) };
    setEditingRequisition({ ...editingRequisition, items: updatedItems });
  };

  const handleRemoveEditingItem = (index: number) => {
    if (!editingRequisition) return;
    const updatedItems = (editingRequisition.items || []).filter((_, i) => i !== index);
    setEditingRequisition({ ...editingRequisition, items: updatedItems });
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!shipTo.trim()) {
      setError('Ship To is required');
      return;
    }
    if (!deliverTo.trim()) {
      setError('Deliver To is required');
      return;
    }
    if (!needByDate) {
      setError('Need By Date is required');
      return;
    }

    if (items.some((i) => i.quantity === '' || isNaN(Number(i.quantity)) || Number(i.quantity) <= 0)) {
      setError('Please enter a valid quantity (> 0) for all items');
      return;
    }

    if (selectedSupplierId && items.some((i) => i.supplierId && i.supplierId !== selectedSupplierId)) {
      setError('The Supplier which was selected in Requisition form should match with item Supplier.');
      return;
    }

    try {
      const payload = {
        title,
        shipTo,
        deliverTo,
        needByDate,
        comments,
        supplierId: selectedSupplierId || (items.find((i) => i.supplierId)?.supplierId || null),
        items: items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
        })),
      };

      await api.post('/api/requisitions', payload);
      setSuccess('Requisition created successfully!');

      // Reset form
      setTitle('');
      setShipTo('');
      setDeliverTo('');
      setNeedByDate('');
      setComments('');
      setSelectedSupplierId('');
      setItems([]);

      fetchRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create requisition');
    }
  };

  const handleDeleteRequisition = async (id: string, status?: string) => {
    if (status === 'PO' || status === 'Accepted' || status === 'PO Accepted') {
      setError('Cannot delete a requisition that has already been converted to Purchase Order (PO).');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this requisition?')) return;
    try {
      await api.delete(`/api/requisitions/${id}`);
      setSuccess('Requisition deleted successfully!');
      fetchRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete requisition');
    }
  };

  const handleStartEdit = (req: RequisitionData) => {
    if (req.status === 'Accepted' || req.status === 'PO Accepted') {
      setError('Cannot edit a Purchase Order that has already been accepted by the supplier.');
      return;
    }
    setEditingRequisition(JSON.parse(JSON.stringify(req)));
  };

  const handleUpdateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequisition) return;

    if (editingRequisition.items && editingRequisition.items.some((i) => i.quantity === '' || isNaN(Number(i.quantity)) || Number(i.quantity) <= 0)) {
      setError('Please enter a valid quantity (> 0) for all items');
      return;
    }

    if (editingRequisition.supplierId && (editingRequisition.items || []).some((i) => i.supplierId && i.supplierId !== editingRequisition.supplierId)) {
      setError('The Supplier which was selected in Requisition form should match with item Supplier.');
      return;
    }

    try {
      const payload = {
        title: editingRequisition.title,
        shipTo: editingRequisition.shipTo,
        deliverTo: editingRequisition.deliverTo,
        needByDate: editingRequisition.needByDate,
        comments: editingRequisition.comments,
        supplierId: editingRequisition.supplierId,
        items: (editingRequisition.items || []).map((i) => ({
          ...i,
          quantity: Number(i.quantity),
        })),
      };

      await api.put(`/api/requisitions/${editingRequisition.id}`, payload);
      setSuccess('Requisition updated successfully!');
      setEditingRequisition(null);
      fetchRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update requisition');
    }
  };

  const handleConvertToPo = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/requisitions/${id}/po`);
      setSuccess('Requisition converted to Purchase Order successfully!');
      fetchRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to convert to Purchase Order');
    }
  };

  const handleStartCopyPo = (req: RequisitionData) => {
    setError('');
    setSuccess('');
    const cloned: RequisitionData = JSON.parse(JSON.stringify(req));
    setCopyingRequisition(cloned);
    setSourcePoTitle(req.title || '');
  };

  const handleRemoveCopyItem = (index: number) => {
    if (!copyingRequisition) return;
    const updated = (copyingRequisition.items || []).filter((_, idx) => idx !== index);
    setCopyingRequisition({ ...copyingRequisition, items: updated });
  };

  const handleUpdateCopyItemQuantity = (index: number, val: number | '') => {
    if (!copyingRequisition) return;
    const updated = [...(copyingRequisition.items || [])];
    updated[index].quantity = val;
    setCopyingRequisition({ ...copyingRequisition, items: updated });
  };

  const handleUpdateCopyItemPrice = (index: number, val: number) => {
    if (!copyingRequisition) return;
    const updated = [...(copyingRequisition.items || [])];
    updated[index].price = val;
    setCopyingRequisition({ ...copyingRequisition, items: updated });
  };

  const handleSubmitCopyPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyingRequisition) return;
    setError('');
    setSuccess('');

    if (copyingRequisition.items && copyingRequisition.items.some((i) => i.quantity === '' || isNaN(Number(i.quantity)) || Number(i.quantity) <= 0)) {
      setError('Please enter a valid quantity (> 0) for all items');
      return;
    }

    if (copyingRequisition.supplierId && (copyingRequisition.items || []).some((i) => i.supplierId && i.supplierId !== copyingRequisition.supplierId)) {
      setError('The Supplier which was selected in Requisition form should match with item Supplier.');
      return;
    }

    const trimmedTitle = (copyingRequisition.title || '').trim();
    const trimmedSourceTitle = (sourcePoTitle || '').trim();
    let finalTitle = trimmedTitle;
    if (!trimmedTitle || trimmedTitle.toLowerCase() === trimmedSourceTitle.toLowerCase()) {
      finalTitle = `copy of ${trimmedSourceTitle || 'Purchase Order'}`;
    }

    try {
      const payload = {
        title: finalTitle,
        shipTo: copyingRequisition.shipTo,
        deliverTo: copyingRequisition.deliverTo,
        needByDate: copyingRequisition.needByDate,
        comments: copyingRequisition.comments,
        supplierId: copyingRequisition.supplierId,
        items: (copyingRequisition.items || []).map((i) => ({
          ...i,
          quantity: Number(i.quantity),
        })),
      };

      const res = await api.post(`/api/requisitions/${copyingRequisition.id}/copy`, payload);
      setSuccess(`New Purchase Order created successfully: ${res.data.requisitionId || res.data.title}!`);
      setCopyingRequisition(null);
      setSourcePoTitle('');
      fetchRequisitions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to copy Purchase Order');
    }
  };

  const handleOpenCancelModal = (req: RequisitionData) => {
    setCancellingRequisition(req);
    setCancellationReason('');
    setCancelModalError('');
  };

  const handleSubmitCancelPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRequisition) return;

    const trimmed = cancellationReason.trim();
    if (!trimmed) {
      setCancelModalError('Reason for Cancellation is required.');
      return;
    }

    try {
      setSubmittingCancellation(true);
      setCancelModalError('');
      await api.put(`/api/requisitions/${cancellingRequisition.id}/cancel`, {
        cancellationReason: trimmed,
      });

      setSuccess(`Purchase Order ${cancellingRequisition.requisitionId || cancellingRequisition.title} cancelled successfully.`);
      setCancellingRequisition(null);
      setCancellationReason('');
      fetchRequisitions();
    } catch (err: any) {
      setCancelModalError(err.response?.data?.message || 'Failed to cancel Purchase Order');
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Cancelled') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Cancelled</span>;
    }
    if (status === 'Accepted' || status === 'PO Accepted') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>PO Accepted</span>;
    }
    if (status === 'Declined') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Declined</span>;
    }
    if (status === 'PO') {
      return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>PO</span>;
    }
    return <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>PR</span>;
  };

  return (
    <div className="feed-container">
      <LeftNavigation activePage="requisition" />

      <main className="feed-center-column" style={{ flex: 1, maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* SECTION 1: CREATE REQUISITION */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Requisition</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Fill in details to submit a new purchase requisition</p>

          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          <form onSubmit={handleSubmitRequisition}>
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter requisition title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Select Supplier</label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={selectedSupplierId}
                  onChange={(e) => {
                    const newSupId = e.target.value;
                    setSelectedSupplierId(newSupId);
                    if (newSupId && items.some((item) => item.supplierId && item.supplierId !== newSupId)) {
                      setError('The Supplier which was selected in Requisition form should match with item Supplier. Please ensure all items belong to the selected supplier.');
                    } else {
                      setError('');
                    }
                  }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.email})
                    </option>
                  ))}
                </select>
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

            <div className="form-row">
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

              <div className="form-group half-width">
                <label className="form-label">Comments</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Additional notes or instructions"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </div>

            {/* ACTION BUTTONS FOR ADDING ITEMS */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleOpenCatalogModal}
              >
                ➕ Add Catalog
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleOpenNonCatalogModal}
              >
                ➕ Add Non-Catalog
              </button>
            </div>

            {/* ATTACHED ITEMS TABLE */}
            {items.length > 0 && (
              <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Requisition Items ({items.length})</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Type</th>
                      <th style={{ padding: '0.5rem' }}>Product Name</th>
                      <th style={{ padding: '0.5rem' }}>Quantity</th>
                      <th style={{ padding: '0.5rem' }}>Unit</th>
                      <th style={{ padding: '0.5rem' }}>Price</th>
                      <th style={{ padding: '0.5rem' }}>Supplier</th>
                      <th style={{ padding: '0.5rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '3px', background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)' }}>
                            {item.itemType}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>{item.productName}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(idx, e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                        <td style={{ padding: '0.5rem' }}>
                          {item.itemType === 'NON_CATALOG' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{item.currencyType ? `${item.currencyType} ` : '$'}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                style={{ width: '90px', padding: '0.25rem 0.5rem' }}
                                value={item.price}
                                onChange={(e) => handleUpdateItemPrice(idx, Number(e.target.value))}
                              />
                            </div>
                          ) : (
                            `${item.currencyType ? `${item.currencyType} ` : '$'}${item.price}`
                          )}
                        </td>
                        <td style={{ padding: '0.5rem' }}>{item.supplierName || 'N/A'}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Requisition
            </button>
          </form>
        </div>

        {/* SECTION 2: LIST REQUISITIONS */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>List Requisitions</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Manage your submitted purchase requisitions</p>

          {loading ? (
            <div>Loading requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No requisitions found. Create one above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {requisitions.map((req) => (
                <div
                  key={req.id}
                  id={`req-${req.id}`}
                  style={{
                    background: req.id === highlightedReqId ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                    border: req.id === highlightedReqId ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: req.id === highlightedReqId ? '0 0 20px rgba(59, 130, 246, 0.35)' : 'var(--shadow-sm)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Requisition Header with Requisition ID, Title & Status */}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Requisition Id: {req.requisitionId || (req.status === 'PO' ? 'PO' : 'PR')}
                        </span>
                        {req.id === highlightedReqId && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--accent-gradient)', color: '#fff' }}>
                            Selected Purchase Order
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--text-primary)' }}>
                        {req.title}
                      </h3>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  {/* Requisition Record Fields Grid in a Single Row: a) Ship To b) Deliver To c) Need By Date d) Supplier e) Comments */}
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
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Ship To</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{req.shipTo}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Deliver To</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{req.deliverTo}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Need By Date</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{req.needByDate}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Supplier</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{req.supplierName || 'Not Assigned'}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Comments</span>
                      <div style={{ color: 'var(--text-primary)' }}>{req.comments || '-'}</div>
                    </div>
                  </div>

                  {req.status === 'Cancelled' && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        color: '#ef4444',
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#dc2626' }}>
                        Reason for Cancellation:
                      </strong>
                      <span>{req.cancellationReason || 'No reason provided'}</span>
                    </div>
                  )}

                  {/* Actions available just below each Submitted Requisition in a single horizontal row with uniform button width: a) Purchase Order b) Edit c) Delete d) View Items e) Copy PO f) Cancel Purchase Order */}
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
                    {/* a) Purchase Order */}
                    {req.status === 'PR' && (
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
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                        onClick={() => handleConvertToPo(req.id)}
                      >
                        Purchase Order
                      </button>
                    )}

                    {/* b) Edit - Light Blue Color (Disabled once PO accepted by supplier or cancelled with dull/dim appearance) */}
                    <button
                      className="btn"
                      disabled={req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled'}
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
                        cursor: (req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        opacity: (req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 0.45 : 1,
                        filter: (req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 'saturate(70%) brightness(0.85)' : 'none',
                      }}
                      onClick={() => !(req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') && handleStartEdit(req)}
                      title={
                        req.status === 'Cancelled'
                          ? 'Cannot edit: Purchase Order has been cancelled'
                          : (req.status === 'Accepted' || req.status === 'PO Accepted')
                            ? 'Cannot edit: Purchase Order has already been accepted by the supplier'
                            : 'Edit Requisition'
                      }
                    >
                      Edit
                    </button>

                    {/* c) Delete (Disabled once converted to PO or accepted by supplier or cancelled with dull/dim appearance) */}
                    <button
                      className="btn"
                      disabled={req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled'}
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
                        cursor: (req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        opacity: (req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 0.45 : 1,
                        filter: (req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') ? 'saturate(70%) brightness(0.85)' : 'none',
                      }}
                      onClick={() => !(req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted' || req.status === 'Cancelled') && handleDeleteRequisition(req.id, req.status)}
                      title={
                        req.status === 'Cancelled'
                          ? 'Cannot delete: Purchase Order has been cancelled'
                          : (req.status === 'PO' || req.status === 'Accepted' || req.status === 'PO Accepted')
                            ? 'Cannot delete: Requisition has already been converted to Purchase Order (PO)'
                            : 'Delete Requisition'
                      }
                    >
                      Delete
                    </button>

                    {/* d) View Items - Light Blue Color */}
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
                      onClick={() => setViewingItemsReq(req)}
                    >
                      View Items ({req.items?.length || 0})
                    </button>

                    {/* e) Copy PO - Royal Purple / Violet Color */}
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
                        background: '#8b5cf6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                      onClick={() => handleStartCopyPo(req)}
                      title="Copy this Purchase Order to generate a new PO"
                    >
                      Copy PO
                    </button>

                    {/* f) Cancel Purchase Order */}
                    <button
                      className="btn"
                      disabled={req.status === 'Cancelled' || req.status === 'PR'}
                      style={{
                        width: '180px',
                        minWidth: '180px',
                        height: '38px',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (req.status === 'Cancelled' || req.status === 'PR') ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        opacity: (req.status === 'Cancelled' || req.status === 'PR') ? 0.45 : 1,
                        filter: (req.status === 'Cancelled' || req.status === 'PR') ? 'saturate(70%) brightness(0.85)' : 'none',
                      }}
                      onClick={() => req.status !== 'Cancelled' && req.status !== 'PR' && handleOpenCancelModal(req)}
                      title={
                        req.status === 'Cancelled'
                          ? 'Purchase Order has already been cancelled'
                          : req.status === 'PR'
                            ? 'Cannot cancel: Requisition has not been converted to Purchase Order yet'
                            : 'Cancel Purchase Order'
                      }
                    >
                      {req.status === 'Cancelled' ? 'Cancelled' : 'Cancel Purchase Order'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: ADD CATALOG */}
      {showCatalogModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Browse Supplier Catalog</h3>

            {catalogError && (
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
                <div style={{ flex: 1, whiteSpace: 'pre-line' }}>{catalogError}</div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Supplier</label>
              <select
                className="form-input"
                style={{
                  appearance: 'auto',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: catalogError ? '#ef4444' : undefined,
                }}
                value={catalogSupplierId}
                onChange={(e) => handleCatalogSupplierChange(e.target.value)}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.email})
                  </option>
                ))}
              </select>
            </div>

            {catalogLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>Loading available catalogs...</div>
            ) : catalogItems.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {catalogSupplierId ? 'No catalog items available for this supplier.' : 'Please select a supplier.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {catalogItems.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCatalogIds.includes(cat.id)}
                      onChange={() => handleToggleCatalogSelection(cat.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{cat.productName} (${cat.price})</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type: {cat.productType}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cat.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCatalogModal(false);
                  setSelectedCatalogIds([]);
                  setCatalogError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedCatalogIds.length === 0 || (!!(editingRequisition ? editingRequisition.supplierId : selectedSupplierId) && catalogSupplierId !== (editingRequisition ? editingRequisition.supplierId : selectedSupplierId))}
                onClick={handleAddSelectedCatalogs}
              >
                Add Selected ({selectedCatalogIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NON-CATALOG ITEM */}
      {showNonCatalogModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Create Non-Catalog Item</h3>

            {nonCatError && (
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
                <div style={{ flex: 1, whiteSpace: 'pre-line' }}>{nonCatError}</div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter product name"
                value={nonCatProductName}
                onChange={(e) => setNonCatProductName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Full Description *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter detailed description of the non-catalog item"
                value={nonCatDescription}
                onChange={(e) => setNonCatDescription(e.target.value)}
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
                  required
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

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Supplier</label>
              <select
                className="form-input"
                style={{
                  appearance: 'auto',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: nonCatError ? '#ef4444' : undefined,
                }}
                value={nonCatSupplierId}
                onChange={(e) => handleNonCatSupplierChange(e.target.value)}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setNonCatProductName('');
                  setNonCatDescription('');
                  setNonCatQuantity('');
                  setNonCatUnitMeasure('Each');
                  setNonCatPrice('');
                  setNonCatCurrencyType('');
                  setNonCatSupplierId('');
                  setNonCatError('');
                  setShowNonCatalogModal(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!(copyingRequisition ? copyingRequisition.supplierId : editingRequisition ? editingRequisition.supplierId : selectedSupplierId) && nonCatSupplierId !== (copyingRequisition ? copyingRequisition.supplierId : editingRequisition ? editingRequisition.supplierId : selectedSupplierId)}
                onClick={handleCreateNonCatalogItem}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT REQUISITION */}
      {editingRequisition && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Edit Requisition</h3>

            <form onSubmit={handleUpdateRequisition}>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRequisition.title}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Select Supplier</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={editingRequisition.supplierId || ''}
                    onChange={(e) => {
                      const newSupId = e.target.value;
                      setEditingRequisition({ ...editingRequisition, supplierId: newSupId });
                      if (newSupId && (editingRequisition.items || []).some((item) => item.supplierId && item.supplierId !== newSupId)) {
                        setError('The Supplier which was selected in Requisition form should match with item Supplier. Please ensure all items belong to the selected supplier.');
                      } else {
                        setError('');
                      }
                    }}
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.email})
                      </option>
                    ))}
                  </select>
                </div>
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

              {/* LINE ITEMS SECTION */}
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Requisition Line Items ({editingRequisition.items?.length || 0})</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={handleOpenCatalogModal}
                    >
                      ➕ Add Catalog
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={handleOpenNonCatalogModal}
                    >
                      ➕ Add Non-Catalog
                    </button>
                  </div>
                </div>

                {editingRequisition.items && editingRequisition.items.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Type</th>
                          <th style={{ padding: '0.5rem' }}>Product Name</th>
                          <th style={{ padding: '0.5rem' }}>Quantity</th>
                          <th style={{ padding: '0.5rem' }}>Unit</th>
                          <th style={{ padding: '0.5rem' }}>Price</th>
                          <th style={{ padding: '0.5rem' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingRequisition.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '3px', background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)' }}>
                                {item.itemType}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 500 }}>{item.productName}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ width: '70px', padding: '0.25rem 0.4rem' }}
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleUpdateEditingItemQuantity(idx, e.target.value === '' ? '' : Number(e.target.value))}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                            <td style={{ padding: '0.5rem' }}>
                              {item.itemType === 'NON_CATALOG' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <span>{item.currencyType ? `${item.currencyType} ` : '$'}</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    style={{ width: '80px', padding: '0.25rem 0.4rem' }}
                                    value={item.price}
                                    onChange={(e) => handleUpdateEditingItemPrice(idx, Number(e.target.value))}
                                  />
                                </div>
                              ) : (
                                `${item.currencyType ? `${item.currencyType} ` : '$'}${item.price}`
                              )}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveEditingItem(idx)}
                                style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center' }}>
                    No items in this requisition. Add items using the buttons above.
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

      {/* MODAL: COPY PURCHASE ORDER */}
      {copyingRequisition && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '780px', padding: '2rem', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#8b5cf6' }}>📋</span> Copy Purchase Order
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Modify details to create a new PO, or click Submit to generate with title "copy of {sourcePoTitle}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCopyingRequisition(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCopyPo}>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">
                    Title *
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                      (Leave unchanged to auto-format as "copy of...")
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={copyingRequisition.title}
                    onChange={(e) => setCopyingRequisition({ ...copyingRequisition, title: e.target.value })}
                    placeholder={`e.g. copy of ${sourcePoTitle}`}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Select Supplier *</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={copyingRequisition.supplierId || ''}
                    onChange={(e) => {
                      const newSupId = e.target.value;
                      setCopyingRequisition({ ...copyingRequisition, supplierId: newSupId });
                      if (newSupId && (copyingRequisition.items || []).some((item) => item.supplierId && item.supplierId !== newSupId)) {
                        setError('The Supplier which was selected in Requisition form should match with item Supplier.');
                      } else {
                        setError('');
                      }
                    }}
                    required
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Ship To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={copyingRequisition.shipTo}
                    onChange={(e) => setCopyingRequisition({ ...copyingRequisition, shipTo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Deliver To *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={copyingRequisition.deliverTo}
                    onChange={(e) => setCopyingRequisition({ ...copyingRequisition, deliverTo: e.target.value })}
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
                    value={copyingRequisition.needByDate}
                    onChange={(e) => setCopyingRequisition({ ...copyingRequisition, needByDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Comments</label>
                  <input
                    type="text"
                    className="form-input"
                    value={copyingRequisition.comments || ''}
                    onChange={(e) => setCopyingRequisition({ ...copyingRequisition, comments: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              {/* LINE ITEMS SECTION */}
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                    Purchase Order Items ({copyingRequisition.items?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={handleOpenCatalogModal}
                    >
                      ➕ Add Catalog
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={handleOpenNonCatalogModal}
                    >
                      ➕ Add Non-Catalog
                    </button>
                  </div>
                </div>

                {copyingRequisition.items && copyingRequisition.items.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Type</th>
                          <th style={{ padding: '0.5rem' }}>Product Name</th>
                          <th style={{ padding: '0.5rem' }}>Quantity</th>
                          <th style={{ padding: '0.5rem' }}>Unit</th>
                          <th style={{ padding: '0.5rem' }}>Price</th>
                          <th style={{ padding: '0.5rem' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {copyingRequisition.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '3px', background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)' }}>
                                {item.itemType}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 500 }}>{item.productName}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ width: '70px', padding: '0.25rem 0.4rem' }}
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleUpdateCopyItemQuantity(idx, e.target.value === '' ? '' : Number(e.target.value))}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                            <td style={{ padding: '0.5rem' }}>
                              {item.itemType === 'NON_CATALOG' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <span>{item.currencyType ? `${item.currencyType} ` : '$'}</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    style={{ width: '80px', padding: '0.25rem 0.4rem' }}
                                    value={item.price}
                                    onChange={(e) => handleUpdateCopyItemPrice(idx, Number(e.target.value))}
                                  />
                                </div>
                              ) : (
                                `${item.currencyType ? `${item.currencyType} ` : '$'}${item.price}`
                              )}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveCopyItem(idx)}
                                style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center' }}>
                    No items in this purchase order. Add items using the buttons above.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCopyingRequisition(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL PURCHASE ORDER */}
      {cancellingRequisition && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '560px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
              Cancel Purchase Order
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Are you sure you want to cancel Purchase Order{' '}
              <strong>{cancellingRequisition.requisitionId || cancellingRequisition.title}</strong>? Once cancelled, the supplier will be notified and will not be able to generate invoices for this PO.
            </p>

            {cancelModalError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{cancelModalError}</div>}

            <form onSubmit={handleSubmitCancelPo}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Reason for Cancellation *
                </label>
                <textarea
                  className="form-input"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Provide the reason for cancelling this Purchase Order (required, max 500 characters)..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  maxLength={500}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem', fontSize: '0.75rem', color: cancellationReason.length >= 480 ? '#ef4444' : 'var(--text-muted)' }}>
                  {cancellationReason.length} / 500 characters
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCancellingRequisition(null);
                    setCancellationReason('');
                    setCancelModalError('');
                  }}
                  disabled={submittingCancellation}
                >
                  Keep Purchase Order
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: submittingCancellation ? 'not-allowed' : 'pointer',
                    opacity: submittingCancellation ? 0.7 : 1,
                  }}
                  disabled={submittingCancellation}
                >
                  {submittingCancellation ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEMS */}
      {viewingItemsReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
                  {viewingItemsReq.requisitionId ? `Purchase Order: ${viewingItemsReq.requisitionId}` : `Requisition: ${viewingItemsReq.title}`}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {viewingItemsReq.title}
                </div>
              </div>
              <div>{getStatusBadge(viewingItemsReq.status)}</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Supplier: {viewingItemsReq.supplierName || 'Not Assigned'}
            </p>

            {viewingItemsReq.status === 'Cancelled' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#ef4444' }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#dc2626' }}>Reason for Cancellation:</strong>
                <span>{viewingItemsReq.cancellationReason || 'No reason provided'}</span>
              </div>
            )}

            {viewingItemsReq.supplierComment && (
              <div style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-primary)', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.2rem' }}>
                  Supplier Response Comments / Reason
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{viewingItemsReq.supplierComment}"
                </span>
              </div>
            )}

            {viewingItemsReq.items && viewingItemsReq.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                    <th style={{ padding: '0.5rem' }}>Product Name</th>
                    <th style={{ padding: '0.5rem' }}>Description</th>
                    <th style={{ padding: '0.5rem' }}>Qty</th>
                    <th style={{ padding: '0.5rem' }}>Unit</th>
                    <th style={{ padding: '0.5rem' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingItemsReq.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '3px', background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)' }}>
                          {item.itemType}
                        </span>
                      </td>
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
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No items attached to this requisition.</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingItemsReq(null)}
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

export default RequisitionPage;
