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
  originalQuantity?: number;
  unitMeasure: string;
  price: number;
  originalPrice?: number;
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
  supplierModified?: boolean;
  buyerModificationStatus?: string;
  buyerComment?: string;
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

const RequestNotificationPage: React.FC = () => {
  const [requests, setRequests] = useState<RequisitionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [viewingReq, setViewingReq] = useState<RequisitionData | null>(null);

  // Editable items state for Supplier when viewing/approving a PO
  const [editableItems, setEditableItems] = useState<RequisitionItem[]>([]);

  // Supplier Response Comment Modal State
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    reqId: string;
    reqTitle: string;
    type: 'Accept' | 'Decline';
    comment: string;
    modalError?: string;
  }>({
    open: false,
    reqId: '',
    reqTitle: '',
    type: 'Accept',
    comment: '',
    modalError: '',
  });
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  useEffect(() => {
    fetchSupplierRequests();
  }, []);

  const fetchSupplierRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/requisitions/requests');
      setRequests(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch request notifications');
    } finally {
      setLoading(false);
    }
  };

  const cloneItemsForEdit = (items: RequisitionItem[] = []): RequisitionItem[] => {
    return items.map((it) => ({
      ...it,
      originalQuantity: it.originalQuantity !== undefined && it.originalQuantity !== null ? it.originalQuantity : it.quantity,
      originalPrice: it.originalPrice !== undefined && it.originalPrice !== null ? it.originalPrice : it.price,
    }));
  };

  const handleOpenViewReq = (req: RequisitionData) => {
    setViewingReq(req);
    setEditableItems(cloneItemsForEdit(req.items || []));
  };

  const openActionModal = (req: RequisitionData, type: 'Accept' | 'Decline', preserveEditedItems: boolean = false) => {
    if (!preserveEditedItems || editableItems.length === 0 || (viewingReq && viewingReq.id !== req.id)) {
      setEditableItems(cloneItemsForEdit(req.items || []));
    }
    setActionModal({
      open: true,
      reqId: req.id,
      reqTitle: req.title,
      type,
      comment: '',
      modalError: '',
    });
  };

  const handleItemQuantityChange = (idx: number, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setEditableItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: isNaN(num) ? 0 : num,
      };
      return next;
    });
  };

  const handleItemPriceChange = (idx: number, val: string) => {
    const num = val === '' ? 0 : parseFloat(val);
    setEditableItems((prev) => {
      const next = [...prev];
      // a) Catalog items cannot have Price modified by Supplier
      if (next[idx].itemType === 'CATALOG') {
        return prev;
      }
      next[idx] = {
        ...next[idx],
        price: isNaN(num) ? 0 : num,
      };
      return next;
    });
  };

  const isAnyEditableItemModified = (itemsList: RequisitionItem[]): boolean => {
    return itemsList.some((it) => {
      const origQty = it.originalQuantity !== undefined ? Number(it.originalQuantity) : Number(it.quantity);
      const currQty = Number(it.quantity);
      const qtyChanged = origQty !== currQty;
      const origPrice = it.originalPrice !== undefined ? Number(it.originalPrice) : Number(it.price);
      const currPrice = Number(it.price);
      const priceChanged = it.itemType !== 'CATALOG' && Math.abs(origPrice - currPrice) > 0.0001;
      return qtyChanged || priceChanged;
    });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.reqId) return;
    if (!actionModal.comment || !actionModal.comment.trim()) {
      setActionModal((prev) => ({
        ...prev,
        modalError: 'Comments are mandatory when accepting or declining a purchase request.',
      }));
      return;
    }

    if (actionModal.type === 'Accept') {
      for (const it of editableItems) {
        if (!it.quantity || Number(it.quantity) <= 0) {
          setActionModal((prev) => ({
            ...prev,
            modalError: `Quantity must be greater than 0 for item "${it.productName}".`,
          }));
          return;
        }
        if (it.itemType !== 'CATALOG' && (it.price === undefined || it.price === null || Number(it.price) < 0)) {
          setActionModal((prev) => ({
            ...prev,
            modalError: `Price must be 0 or greater for Non-Catalog item "${it.productName}".`,
          }));
          return;
        }
      }
    }

    setError('');
    setSuccess('');
    setSubmittingAction(true);

    try {
      const endpoint = `/api/requisitions/${actionModal.reqId}/${actionModal.type.toLowerCase()}`;
      const payload =
        actionModal.type === 'Accept'
          ? {
            comments: actionModal.comment.trim(),
            items: editableItems.map((it) => ({
              ...it,
              quantity: Number(it.quantity),
              price: it.itemType === 'CATALOG' ? Number(it.originalPrice ?? it.price) : Number(it.price),
            })),
          }
          : { comments: actionModal.comment.trim() };

      const modified = actionModal.type === 'Accept' && isAnyEditableItemModified(editableItems);
      await api.put(endpoint, payload);
      setSuccess(
        actionModal.type === 'Accept'
          ? modified
            ? 'Purchase Order approved with modifications! Awaiting Buyer confirmation before creating Invoice.'
            : 'Purchase Order approved! Proceed Invoice.'
          : 'Purchase Order declined successfully!'
      );
      setActionModal({ open: false, reqId: '', reqTitle: '', type: 'Accept', comment: '', modalError: '' });
      if (viewingReq && viewingReq.id === actionModal.reqId) {
        setViewingReq(null);
      }
      fetchSupplierRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || `Failed to ${actionModal.type.toLowerCase()} requisition`;
      setActionModal((prev) => ({ ...prev, modalError: msg }));
      setError(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (req: RequisitionData) => {
    const { status, supplierModified, buyerModificationStatus } = req;
    if (status === 'Cancelled') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Cancelled</span>;
    }
    if (status === 'Accepted' || status === 'PO Accepted') {
      if (supplierModified && buyerModificationStatus === 'PENDING_BUYER_APPROVAL') {
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Modified - Pending Buyer Approval</span>;
      }
      if (supplierModified && buyerModificationStatus === 'DECLINED') {
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Modification Declined by Buyer</span>;
      }
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Accepted</span>;
    }
    if (status === 'Declined') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Declined</span>;
    }
    return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Submitted</span>;
  };

  const isProceedInvoiceReady = (req: RequisitionData): boolean => {
    const isAccepted = req.status === 'Accepted' || req.status === 'PO Accepted';
    if (!isAccepted) return false;
    if (!req.supplierModified) return true;
    return req.buyerModificationStatus === 'APPROVED' || req.buyerModificationStatus === 'PROCEED_INVOICE';
  };

  const renderPurchaseOrderStatusSection = (req: RequisitionData) => {
    const isAccepted = req.status === 'Accepted' || req.status === 'PO Accepted';
    const isDeclined = req.status === 'Declined';
    const proceedInvoice = isProceedInvoiceReady(req);

    return (
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderLeft: proceedInvoice
            ? '4px solid #10b981'
            : req.supplierModified && req.buyerModificationStatus === 'DECLINED'
              ? '4px solid #ef4444'
              : req.supplierModified && req.buyerModificationStatus === 'PENDING_BUYER_APPROVAL'
                ? '4px solid #f59e0b'
                : '4px solid var(--accent-primary)',
          borderRadius: '8px',
          padding: '0.9rem 1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--accent-primary)',
            }}
          >
            Purchase Order Status
          </span>

          {proceedInvoice && (
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              Proceed Invoice
            </span>
          )}

          {isAccepted && req.supplierModified && req.buyerModificationStatus === 'PENDING_BUYER_APPROVAL' && (
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              Awaiting Buyer Confirmation for Modified PO (Invoice Blocked)
            </span>
          )}

          {isAccepted && req.supplierModified && req.buyerModificationStatus === 'DECLINED' && (
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.18)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              Modification Declined by Buyer (Invoice Blocked)
            </span>
          )}
        </div>

        {/* Supplier Message */}
        {req.supplierComment ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: isDeclined ? '#ef4444' : '#10b981' }}>
              {isDeclined
                ? 'Supplier Declined Message: '
                : req.supplierModified
                  ? 'Supplier Approved Message (With Modification): '
                  : 'Supplier Approved Message: '}
            </strong>
            <span>"{req.supplierComment}"</span>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No Supplier approval/decline message recorded yet.
          </div>
        )}

        {/* Default Proceed Invoice message on Supplier Side when approved without modification */}
        {isAccepted && !req.supplierModified && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: '#10b981' }}>Buyer Status Message: </strong>
            <span style={{ fontWeight: 600, color: '#10b981' }}>Proceed Invoice</span>
          </div>
        )}

        {/* Buyer Approved or Declined Message on Modified PO */}
        {req.supplierModified && req.buyerComment && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: req.buyerModificationStatus === 'DECLINED' ? '#ef4444' : '#10b981' }}>
              {req.buyerModificationStatus === 'DECLINED'
                ? 'Buyer Declined Modification Message: '
                : 'Buyer Approved Modification Message: '}
            </strong>
            <span>"{req.buyerComment}"</span>
            {req.buyerModificationStatus === 'APPROVED' && (
              <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: '#10b981' }}>
                — Proceed Invoice
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      <LeftNavigation activePage="request-notification" />

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Purchase Requests</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Review purchase requisition requests submitted by Buyers</p>

          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          {loading ? (
            <div>Loading purchase requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No incoming requisition requests at this time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {requests.map((req) => (
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
                  {/* Record Top / Header */}
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Purchase Order {req.requisitionId ? `(${req.requisitionId})` : ''}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.1rem 0 0 0', color: 'var(--text-primary)' }}>{req.title}</h3>
                    </div>
                    <div>{getStatusBadge(req)}</div>
                  </div>

                  {/* Request Notification Record Fields Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Buyer Details</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.buyerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.buyerEmail}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Ship To</span>
                      <div style={{ color: 'var(--text-primary)' }}>{req.shipTo}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Deliver To</span>
                      <div style={{ color: 'var(--text-primary)' }}>{req.deliverTo}</div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.2rem' }}>Need By Date</span>
                      <div style={{ color: 'var(--text-primary)' }}>{req.needByDate}</div>
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

                  {/* g) Purchase Order Status Section */}
                  {renderPurchaseOrderStatusSection(req)}

                  {/* Action Buttons available just below each Request Notification Record */}
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
                    {req.status !== 'Accepted' && req.status !== 'PO Accepted' && req.status !== 'Declined' && (
                      <>
                        <button
                          className="btn"
                          disabled={req.status === 'Cancelled'}
                          style={{
                            width: '140px',
                            minWidth: '140px',
                            height: '38px',
                            display: 'inline-flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: req.status === 'Cancelled' ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                            opacity: req.status === 'Cancelled' ? 0.45 : 1,
                            filter: req.status === 'Cancelled' ? 'saturate(70%) brightness(0.85)' : 'none',
                          }}
                          onClick={() => req.status !== 'Cancelled' && openActionModal(req, 'Accept', false)}
                          title={req.status === 'Cancelled' ? 'Cannot accept: Purchase Order has been cancelled' : 'Accept / Approve Purchase Order'}
                        >
                          Accept
                        </button>
                        <button
                          className="btn"
                          disabled={req.status === 'Cancelled'}
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
                            cursor: req.status === 'Cancelled' ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                            opacity: req.status === 'Cancelled' ? 0.45 : 1,
                            filter: req.status === 'Cancelled' ? 'saturate(70%) brightness(0.85)' : 'none',
                          }}
                          onClick={() => req.status !== 'Cancelled' && openActionModal(req, 'Decline', false)}
                          title={req.status === 'Cancelled' ? 'Cannot decline: Purchase Order has been cancelled' : 'Decline'}
                        >
                          Decline
                        </button>
                      </>
                    )}
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
                      onClick={() => handleOpenViewReq(req)}
                    >
                      View Requisition
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: VIEW REQUISITION WITH CATALOG & NON-CATALOG ITEM DETAILS */}
      {viewingReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '92%', maxWidth: '820px', padding: '2rem', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>
                  View Requisition {viewingReq.requisitionId ? `(${viewingReq.requisitionId})` : ''}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Title: <strong style={{ color: 'var(--text-primary)' }}>{viewingReq.title}</strong>
                </p>
              </div>
              <div>
                {getStatusBadge(viewingReq)}
              </div>
            </div>

            {viewingReq.status === 'Cancelled' && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  color: '#ef4444',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>
                    Purchase Order Cancelled by Buyer
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <strong style={{ color: '#dc2626' }}>Reason for Cancellation: </strong>
                  {viewingReq.cancellationReason || 'No reason specified'}
                </div>
              </div>
            )}

            {/* Requisition Header & Buyer Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Buyer Name & Email</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingReq.buyerName}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewingReq.buyerEmail}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Ship To</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewingReq.shipTo}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Deliver To</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewingReq.deliverTo}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Need By Date</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewingReq.needByDate}</span>
              </div>
              {viewingReq.comments && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Comments / Instructions</span>
                  <span style={{ color: 'var(--text-primary)' }}>{viewingReq.comments}</span>
                </div>
              )}
            </div>

            {/* Purchase Order Status inside Modal */}
            <div style={{ marginBottom: '1.25rem' }}>
              {renderPurchaseOrderStatusSection(viewingReq)}
            </div>

            {/* Catalog & Non-Catalog Item Details Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                Catalog & Non-Catalog Item Details ({editableItems.length || 0})
              </h4>
              {viewingReq.status === 'PO' && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  💡 Catalog Item: Modify Quantity only • Non-Catalog Item: Modify Quantity & Price
                </span>
              )}
            </div>

            {editableItems.length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem' }}>Type</th>
                      <th style={{ padding: '0.6rem' }}>Product Name</th>
                      <th style={{ padding: '0.6rem' }}>Full Description</th>
                      <th style={{ padding: '0.6rem' }}>Quantity</th>
                      <th style={{ padding: '0.6rem' }}>Unit</th>
                      <th style={{ padding: '0.6rem' }}>Price</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableItems.map((item, idx) => {
                      const canEdit = viewingReq.status === 'PO';
                      const itemTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                      const origQty = item.originalQuantity !== undefined ? item.originalQuantity : item.quantity;
                      const origPrice = item.originalPrice !== undefined ? item.originalPrice : item.price;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)', color: item.itemType === 'CATALOG' ? '#2563eb' : '#7c3aed' }}>
                              {item.itemType}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>{item.fullDescription}</td>
                          <td style={{ padding: '0.6rem' }}>
                            {canEdit ? (
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ width: '85px', padding: '0.3rem 0.5rem' }}
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                              />
                            ) : (
                              <div>
                                <span>{item.quantity}</span>
                                {viewingReq.supplierModified && origQty !== item.quantity && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    (Orig: {origQty})
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem' }}>{item.unitMeasure}</td>
                          <td style={{ padding: '0.6rem' }}>
                            {canEdit && item.itemType === 'NON_CATALOG' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>{item.currencyType ? `${item.currencyType}` : '$'}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-input"
                                  style={{ width: '100px', padding: '0.3rem 0.5rem' }}
                                  value={item.price}
                                  onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                />
                              </div>
                            ) : (
                              <div>
                                <span>{item.currencyType ? `${item.currencyType} ` : '$'}{Number(item.price || 0).toFixed(2)}</span>
                                {canEdit && item.itemType === 'CATALOG' && (
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    (Catalog Price Read-only)
                                  </span>
                                )}
                                {!canEdit && viewingReq.supplierModified && Number(origPrice) !== Number(item.price) && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    (Orig: {item.currencyType ? `${item.currencyType} ` : '$'}{Number(origPrice || 0).toFixed(2)})
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>
                            {item.currencyType ? `${item.currencyType} ` : '$'}{itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)', background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td colSpan={6} style={{ padding: '0.75rem', textAlign: 'right' }}>Requisition Total Amount:</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-primary)', fontSize: '1rem' }}>
                        ${editableItems.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.price) || 0)), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                No catalog items attached to this requisition.
              </div>
            )}

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {viewingReq.status !== 'Accepted' && viewingReq.status !== 'PO Accepted' && viewingReq.status !== 'Declined' && (
                <>
                  <button
                    type="button"
                    className="btn"
                    disabled={viewingReq.status === 'Cancelled'}
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: viewingReq.status === 'Cancelled' ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: viewingReq.status === 'Cancelled' ? 0.45 : 1,
                      filter: viewingReq.status === 'Cancelled' ? 'saturate(70%) brightness(0.85)' : 'none',
                    }}
                    onClick={() => viewingReq.status !== 'Cancelled' && openActionModal(viewingReq, 'Accept', true)}
                    title={viewingReq.status === 'Cancelled' ? 'Cannot accept: Purchase Order has been cancelled' : 'Accept / Approve Request'}
                  >
                    Accept Request
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={viewingReq.status === 'Cancelled'}
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: viewingReq.status === 'Cancelled' ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: viewingReq.status === 'Cancelled' ? 0.45 : 1,
                      filter: viewingReq.status === 'Cancelled' ? 'saturate(70%) brightness(0.85)' : 'none',
                    }}
                    onClick={() => viewingReq.status !== 'Cancelled' && openActionModal(viewingReq, 'Decline', true)}
                    title={viewingReq.status === 'Cancelled' ? 'Cannot decline: Purchase Order has been cancelled' : 'Decline Request'}
                  >
                    Decline Request
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', width: 'auto', margin: 0 }}
                onClick={() => setViewingReq(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPPLIER COMMENTS & ITEM MODIFICATION POPUP FOR ACCEPT / DECLINE */}
      {actionModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="glass-card" style={{ width: '92%', maxWidth: '720px', padding: '2rem', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: actionModal.type === 'Accept' ? '#10b981' : '#ef4444' }}>
              {actionModal.type === 'Accept' ? 'Approve / Accept Purchase Order' : 'Decline Purchase Order'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Purchase Order: <strong style={{ color: 'var(--text-primary)' }}>{actionModal.reqTitle}</strong>
            </p>

            {actionModal.modalError && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {actionModal.modalError}
              </div>
            )}

            {/* a) & b) Allow Supplier to modify Quantity (for Catalog) or Quantity & Price (for Non-Catalog) when Approving */}
            {actionModal.type === 'Accept' && editableItems.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Purchase Order Items (Modify if required before Approving)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Catalog: Quantity only • Non-Catalog: Quantity & Price
                  </span>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Type</th>
                        <th style={{ padding: '0.5rem' }}>Product</th>
                        <th style={{ padding: '0.5rem' }}>Orig Qty</th>
                        <th style={{ padding: '0.5rem' }}>Quantity *</th>
                        <th style={{ padding: '0.5rem' }}>Orig Price</th>
                        <th style={{ padding: '0.5rem' }}>Price *</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableItems.map((it, idx) => {
                        const isCatalog = it.itemType === 'CATALOG';
                        const lineTotal = (Number(it.quantity) || 0) * (Number(it.price) || 0);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600, background: isCatalog ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)', color: isCatalog ? '#2563eb' : '#7c3aed' }}>
                                {it.itemType}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{it.productName}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{it.originalQuantity ?? it.quantity}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ width: '75px', padding: '0.25rem 0.4rem', fontSize: '0.82rem' }}
                                value={it.quantity === 0 ? '' : it.quantity}
                                onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                              {it.currencyType ? `${it.currencyType} ` : '$'}{Number(it.originalPrice ?? it.price ?? 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              {isCatalog ? (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }} title="Catalog item price cannot be modified">
                                  {it.currencyType ? `${it.currencyType} ` : '$'}{Number(it.price || 0).toFixed(2)} (Read-only)
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-input"
                                  style={{ width: '90px', padding: '0.25rem 0.4rem', fontSize: '0.82rem' }}
                                  value={it.price}
                                  onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                />
                              )}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                              {it.currencyType ? `${it.currencyType} ` : '$'}{lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isAnyEditableItemModified(editableItems) ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                    ⚠️ You have modified Quantity / Price. Buyer confirmation will be required before you can create an Invoice for this Purchase Order.
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ No modifications made to Quantity or Price. Status will default to "Proceed Invoice" without needing Buyer confirmation.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Supplier Comments / Reason * <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 400 }}>(Mandatory)</span>
              </label>
              <textarea
                className="form-input"
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                }}
                maxLength={400}
                placeholder={`Provide mandatory comments or reason for ${actionModal.type.toLowerCase()}ing... *`}
                value={actionModal.comment}
                onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value, modalError: '' })}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: actionModal.comment.length >= 380 ? '#ef4444' : 'var(--text-muted)', marginTop: '0.35rem' }}>
                {actionModal.comment.length} / 400 characters
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', width: 'auto', margin: 0 }}
                onClick={() => setActionModal({ ...actionModal, open: false, modalError: '' })}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem',
                  background: actionModal.type === 'Accept' ? '#10b981' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onClick={handleConfirmAction}
                disabled={submittingAction}
              >
                {submittingAction ? 'Submitting...' : actionModal.type === 'Accept' ? 'Approve Purchase Order' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequestNotificationPage;
