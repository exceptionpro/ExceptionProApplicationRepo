import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface RequisitionItem {
  id?: string;
  itemType: 'CATALOG' | 'NON_CATALOG';
  catalogueId?: string;
  productName: string;
  fullDescription: string;
  quantity: number;
  unitMeasure: string;
  price: number;
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

  const [showNonCatalogModal, setShowNonCatalogModal] = useState(false);
  const [nonCatDescription, setNonCatDescription] = useState('');
  const [nonCatProductName, setNonCatProductName] = useState('');
  const [nonCatQuantity, setNonCatQuantity] = useState<number>(1);
  const [nonCatUnitMeasure, setNonCatUnitMeasure] = useState('Each');
  const [nonCatPrice, setNonCatPrice] = useState<number>(0);
  const [nonCatSupplierId, setNonCatSupplierId] = useState('');

  // Edit state
  const [editingRequisition, setEditingRequisition] = useState<RequisitionData | null>(null);
  const [viewingItemsReq, setViewingItemsReq] = useState<RequisitionData | null>(null);

  useEffect(() => {
    fetchRequisitions();
    fetchSuppliers();
  }, []);

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
    } catch (err: any) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  const handleOpenCatalogModal = () => {
    setShowCatalogModal(true);
    const initialSupId = selectedSupplierId || (suppliers.length > 0 ? suppliers[0].id : '');
    setCatalogSupplierId(initialSupId);
    if (initialSupId) {
      loadCatalogForSupplier(initialSupId);
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
    const selectedSupplierObj = suppliers.find((s) => s.id === catalogSupplierId);
    const selectedCats = catalogItems.filter((c) => selectedCatalogIds.includes(c.id));
    
    const newReqItems: RequisitionItem[] = selectedCats.map((cat) => ({
      itemType: 'CATALOG',
      catalogueId: cat.id,
      productName: cat.productName,
      fullDescription: cat.description,
      quantity: 1,
      unitMeasure: 'Each',
      price: cat.price,
      supplierId: catalogSupplierId,
      supplierName: selectedSupplierObj?.name,
    }));

    if (editingRequisition) {
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
  };

  const handleCreateNonCatalogItem = () => {
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

    const supObj = suppliers.find((s) => s.id === nonCatSupplierId);

    const newItem: RequisitionItem = {
      itemType: 'NON_CATALOG',
      productName: nonCatProductName,
      fullDescription: nonCatDescription,
      quantity: Number(nonCatQuantity),
      unitMeasure: nonCatUnitMeasure,
      price: Number(nonCatPrice),
      supplierId: nonCatSupplierId || undefined,
      supplierName: supObj?.name,
    };

    if (editingRequisition) {
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
    setNonCatQuantity(1);
    setNonCatUnitMeasure('Each');
    setNonCatPrice(0);
    setNonCatSupplierId('');
    setShowNonCatalogModal(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: Math.max(1, qty) };
    setItems(updated);
  };

  const handleUpdateEditingItemQuantity = (index: number, qty: number) => {
    if (!editingRequisition) return;
    const updatedItems = [...(editingRequisition.items || [])];
    updatedItems[index] = { ...updatedItems[index], quantity: Math.max(1, qty) };
    setEditingRequisition({ ...editingRequisition, items: updatedItems });
  };

  const handleOpenNonCatalogModal = () => {
    const initialSupId = editingRequisition
      ? (editingRequisition.supplierId || '')
      : (selectedSupplierId || '');
    setNonCatSupplierId(initialSupId);
    setShowNonCatalogModal(true);
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

    try {
      const payload = {
        title,
        shipTo,
        deliverTo,
        needByDate,
        comments,
        supplierId: selectedSupplierId || (items.find((i) => i.supplierId)?.supplierId || null),
        items,
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

  const handleDeleteRequisition = async (id: string) => {
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
    setEditingRequisition(JSON.parse(JSON.stringify(req)));
  };

  const handleUpdateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequisition) return;

    try {
      const payload = {
        title: editingRequisition.title,
        shipTo: editingRequisition.shipTo,
        deliverTo: editingRequisition.deliverTo,
        needByDate: editingRequisition.needByDate,
        comments: editingRequisition.comments,
        supplierId: editingRequisition.supplierId,
        items: editingRequisition.items,
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

  const getStatusBadge = (status: string) => {
    if (status === 'Accepted') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Accepted</span>;
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
                <label className="form-label">Supplier Selection</label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
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
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                        <td style={{ padding: '0.5rem' }}>
                          {item.itemType === 'NON_CATALOG' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>$</span>
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
                            `$${item.price}`
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
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Requisition Id: {req.requisitionId || (req.status === 'PO' ? 'PO' : 'PR')}
                      </span>
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

                  {/* Actions available just below each Submitted Requisition in a single horizontal row with uniform button width: a) Purchase Order b) Edit c) Delete d) View Items */}
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

                    {/* b) Edit - Light Blue Color */}
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
                      onClick={() => handleStartEdit(req)}
                    >
                      Edit
                    </button>

                    {/* c) Delete */}
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
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                      onClick={() => handleDeleteRequisition(req.id)}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: ADD CATALOG */}
      {showCatalogModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Browse Supplier Catalog</h3>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Supplier</label>
              <select
                className="form-input"
                style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                value={catalogSupplierId}
                onChange={(e) => {
                  setCatalogSupplierId(e.target.value);
                  loadCatalogForSupplier(e.target.value);
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
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedCatalogIds.length === 0}
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
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Create Non-Catalog Item</h3>

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

            <div className="form-row">
              <div className="form-group half-width">
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

              <div className="form-group half-width">
                <label className="form-label">Selection of Supplier</label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={nonCatSupplierId}
                  onChange={(e) => setNonCatSupplierId(e.target.value)}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNonCatalogModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
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
                  <label className="form-label">Supplier Selection</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    value={editingRequisition.supplierId || ''}
                    onChange={(e) => setEditingRequisition({ ...editingRequisition, supplierId: e.target.value })}
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
                                value={item.quantity}
                                onChange={(e) => handleUpdateEditingItemQuantity(idx, Number(e.target.value))}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>{item.unitMeasure}</td>
                            <td style={{ padding: '0.5rem' }}>
                              {item.itemType === 'NON_CATALOG' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <span>$</span>
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
                                `$${item.price}`
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

      {/* MODAL: VIEW ITEMS */}
      {viewingItemsReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Items for "{viewingItemsReq.title}"</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Supplier: {viewingItemsReq.supplierName || 'Not Assigned'}
            </p>

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
                      <td style={{ padding: '0.5rem' }}>${item.price}</td>
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
