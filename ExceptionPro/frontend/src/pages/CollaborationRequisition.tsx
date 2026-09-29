import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface Supplier {
  id: string;
  email: string;
  name: string;
  accountType: string;
}

interface CollaborationItem {
  id?: string;
  itemType: string;
  productName: string;
  fullDescription: string;
  quantity: number;
  unitMeasure: string;
  price: number;
}

interface SupplierProposal {
  id: string;
  supplierId: string;
  supplierEmail: string;
  supplierName: string;
  proposalText: string;
  evaluationStatus: string;
  createdAt: string;
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
  acceptedCount?: number;
  items: CollaborationItem[];
  proposals: SupplierProposal[];
}

const CollaborationRequisitionPage: React.FC = () => {
  const [requisitions, setRequisitions] = useState<CollaborationRequisitionData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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
  const [nonCatQuantity, setNonCatQuantity] = useState<number>(1);
  const [nonCatUnitMeasure, setNonCatUnitMeasure] = useState('Each');
  const [nonCatPrice, setNonCatPrice] = useState<number>(0);
  const [modalSelectedSupplierIds, setModalSelectedSupplierIds] = useState<string[]>([]);

  // Edit Requisition / Details / Accepted Suppliers State
  const [editingRequisition, setEditingRequisition] = useState<CollaborationRequisitionData | null>(null);
  const [viewingReq, setViewingReq] = useState<CollaborationRequisitionData | null>(null);
  const [selectedAcceptedSuppliersReq, setSelectedAcceptedSuppliersReq] = useState<CollaborationRequisitionData | null>(null);
  const [hoveredAcceptedReqId, setHoveredAcceptedReqId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollaborationRequisitions();
    fetchSuppliers();
  }, []);

  const fetchCollaborationRequisitions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/collaboration-requisitions');
      setRequisitions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch collaboration requisitions');
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

  const handleToggleSupplierSelectionInModal = (supplierId: string) => {
    if (modalSelectedSupplierIds.includes(supplierId)) {
      setModalSelectedSupplierIds(modalSelectedSupplierIds.filter((id) => id !== supplierId));
    } else {
      setModalSelectedSupplierIds([...modalSelectedSupplierIds, supplierId]);
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
    setNonCatQuantity(1);
    setNonCatUnitMeasure('Each');
    setNonCatPrice(0);
    if (context === 'CREATE') {
      setModalSelectedSupplierIds([...selectedSupplierIds]);
    } else if (editingRequisition) {
      setModalSelectedSupplierIds(editingRequisition.suppliers?.map((s) => s.id) || []);
    } else {
      setModalSelectedSupplierIds([]);
    }
    setShowNonCatalogModal(true);
  };

  const openEditItemModal = (context: 'CREATE' | 'EDIT_REQ', index: number) => {
    setEditingContext(context);
    setEditingItemIndex(index);

    let targetItem: CollaborationItem | null = null;
    if (context === 'CREATE') {
      targetItem = items[index];
      setModalSelectedSupplierIds([...selectedSupplierIds]);
    } else if (editingRequisition && editingRequisition.items) {
      targetItem = editingRequisition.items[index];
      setModalSelectedSupplierIds(editingRequisition.suppliers?.map((s) => s.id) || []);
    }

    if (targetItem) {
      setNonCatProductName(targetItem.productName || '');
      setNonCatDescription(targetItem.fullDescription || '');
      setNonCatQuantity(targetItem.quantity ?? 1);
      setNonCatUnitMeasure(targetItem.unitMeasure || 'Each');
      setNonCatPrice(targetItem.price ?? 0);
    }
    setShowNonCatalogModal(true);
  };

  const handleSaveItemModal = () => {
    if (!nonCatProductName.trim()) {
      alert('Product Name is required');
      return;
    }
    if (!nonCatDescription.trim()) {
      alert('Full Description is required');
      return;
    }
    if (nonCatQuantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    if (nonCatPrice < 0) {
      alert('Price cannot be negative');
      return;
    }

    const itemToSave: CollaborationItem = {
      itemType: 'NON_CATALOG',
      productName: nonCatProductName.trim(),
      fullDescription: nonCatDescription.trim(),
      quantity: Number(nonCatQuantity),
      unitMeasure: nonCatUnitMeasure.trim(),
      price: Number(nonCatPrice),
    };

    if (editingContext === 'CREATE') {
      if (editingItemIndex === null) {
        setItems([...items, itemToSave]);
      } else {
        const updated = [...items];
        updated[editingItemIndex] = itemToSave;
        setItems(updated);
      }
      const mergedSupplierIds = Array.from(new Set([...selectedSupplierIds, ...modalSelectedSupplierIds]));
      setSelectedSupplierIds(mergedSupplierIds);
    } else if (editingContext === 'EDIT_REQ' && editingRequisition) {
      const currentItems = [...(editingRequisition.items || [])];
      if (editingItemIndex === null) {
        currentItems.push(itemToSave);
      } else {
        currentItems[editingItemIndex] = itemToSave;
      }
      const currentSupplierIds = editingRequisition.suppliers?.map((s) => s.id) || [];
      const mergedSupplierIds = Array.from(new Set([...currentSupplierIds, ...modalSelectedSupplierIds]));
      const newSuppliersList = suppliers.filter((s) => mergedSupplierIds.includes(s.id));

      setEditingRequisition({
        ...editingRequisition,
        items: currentItems,
        suppliers: newSuppliersList,
      });
    }

    setNonCatProductName('');
    setNonCatDescription('');
    setNonCatQuantity(1);
    setNonCatUnitMeasure('Each');
    setNonCatPrice(0);
    setModalSelectedSupplierIds([]);
    setEditingItemIndex(null);
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

  const renderStatusColumn = (req: CollaborationRequisitionData) => {
    const acceptedCount = req.acceptedCount || (req.acceptedSuppliers ? req.acceptedSuppliers.length : 0);
    if (acceptedCount > 0) {
      const isHovered = hoveredAcceptedReqId === req.id;
      return (
        <div
          style={{ position: 'relative', display: 'inline-block' }}
          onMouseEnter={() => setHoveredAcceptedReqId(req.id)}
          onMouseLeave={() => setHoveredAcceptedReqId(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedAcceptedSuppliersReq(req)}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.85rem'
            }}
            title="Hover or click to view accepted suppliers"
          >
            Accepted({acceptedCount})
          </button>

          {isHovered && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '0.4rem',
                background: 'var(--bg-secondary, #1e293b)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                minWidth: '250px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                Accepted Suppliers ({acceptedCount})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {req.acceptedSuppliers && req.acceptedSuppliers.length > 0 ? (
                  req.acceptedSuppliers.map((sup) => (
                    <div key={sup.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{sup.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sup.email}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supplier details unavailable</span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (req.status === 'Accepted') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Accepted</span>;
    }
    if (req.status === 'Declined') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Declined</span>;
    }
    return <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Collaborating</span>;
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
                            <span>$</span>
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
                  {requisitions.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{req.title}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.shipTo}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.deliverTo}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.needByDate}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.comments || '-'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{renderStatusColumn(req)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => setEditingRequisition(req)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => handleDeleteRequisition(req.id)}
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => setViewingReq(req)}
                          >
                            View Details ({req.proposals?.length || 0} Proposals)
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

      {/* MODAL: ACCEPTED SUPPLIERS HYPERLINK POPUP */}
      {selectedAcceptedSuppliersReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '550px', padding: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem', color: '#10b981' }}>
              Accepted Suppliers for "{selectedAcceptedSuppliersReq.title}"
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              The following suppliers have accepted this collaboration requisition request:
            </p>

            {selectedAcceptedSuppliersReq.acceptedSuppliers && selectedAcceptedSuppliersReq.acceptedSuppliers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {selectedAcceptedSuppliersReq.acceptedSuppliers.map((sup) => (
                  <div key={sup.id} style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{sup.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sup.email}</div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Accepted
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No accepted suppliers data available.</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                  value={nonCatQuantity}
                  onChange={(e) => setNonCatQuantity(Number(e.target.value))}
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

            <div className="form-group">
              <label className="form-label">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={nonCatPrice}
                onChange={(e) => setNonCatPrice(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selection of Multiple Supplier *</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select one or more suppliers to send this collaboration requisition request to:</p>
              {suppliers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registered suppliers available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowNonCatalogModal(false);
                  setEditingItemIndex(null);
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
                                <span>$</span>
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
                      <td style={{ padding: '0.5rem' }}>${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>No items attached.</div>
            )}

            {/* Supplier Proposals Received & Evaluation Buttons */}
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Supplier Proposals Received ({viewingReq.proposals?.length || 0})
            </h4>
            {viewingReq.proposals && viewingReq.proposals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {viewingReq.proposals.map((prop) => {
                  const isAccepted = prop.evaluationStatus === 'Accepted';
                  return (
                    <div key={prop.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <strong style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>{prop.supplierName}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({prop.supplierEmail})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge" style={{
                            background: isAccepted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isAccepted ? '#10b981' : '#f59e0b',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}>
                            {isAccepted ? 'Accepted' : 'Need to Evaluate'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(prop.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: '0.5rem 0 0.85rem 0', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {prop.proposalText}
                      </p>

                      {/* Buyer Evaluation Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.82rem',
                            background: isAccepted ? '#10b981' : 'transparent',
                            color: isAccepted ? '#fff' : '#10b981',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleEvaluateProposal(prop.id, 'Accepted')}
                        >
                          ✓ Accept Proposal
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.82rem',
                            background: !isAccepted ? '#f59e0b' : 'transparent',
                            color: !isAccepted ? '#fff' : '#f59e0b',
                            border: '1px solid #f59e0b',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleEvaluateProposal(prop.id, 'Need to Evaluate')}
                        >
                          Need to Evaluate
                        </button>
                      </div>
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

    </div>
  );
};

export default CollaborationRequisitionPage;
