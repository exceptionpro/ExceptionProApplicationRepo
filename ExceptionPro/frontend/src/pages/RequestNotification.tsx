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

  // Supplier Response Comment Modal State
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    reqId: string;
    reqTitle: string;
    type: 'Accept' | 'Decline';
    comment: string;
  }>({
    open: false,
    reqId: '',
    reqTitle: '',
    type: 'Accept',
    comment: '',
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

  const openActionModal = (req: RequisitionData, type: 'Accept' | 'Decline') => {
    setActionModal({
      open: true,
      reqId: req.id,
      reqTitle: req.title,
      type,
      comment: '',
    });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.reqId) return;
    if (!actionModal.comment || !actionModal.comment.trim()) {
      setError('Comments are mandatory when accepting or declining a purchase request.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmittingAction(true);

    try {
      const endpoint = `/api/requisitions/${actionModal.reqId}/${actionModal.type.toLowerCase()}`;
      await api.put(endpoint, { comments: actionModal.comment });
      setSuccess(`Requisition request ${actionModal.type === 'Accept' ? 'accepted' : 'declined'} successfully!`);
      setActionModal({ open: false, reqId: '', reqTitle: '', type: 'Accept', comment: '' });
      if (viewingReq && viewingReq.id === actionModal.reqId) {
        setViewingReq(null);
      }
      fetchSupplierRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${actionModal.type.toLowerCase()} requisition`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Accepted') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Accepted</span>;
    }
    if (status === 'Declined') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Declined</span>;
    }
    return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Submitted</span>;
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
                    <div>{getStatusBadge(req.status)}</div>
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
                    {req.status !== 'Accepted' && req.status !== 'Declined' && (
                      <>
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
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                          }}
                          onClick={() => openActionModal(req, 'Accept')}
                        >
                          Accept
                        </button>
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
                          onClick={() => openActionModal(req, 'Decline')}
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
                      onClick={() => setViewingReq(req)}
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

      {/* MODAL: VIEW REQUISITION WITH CATALOG ITEM DETAILS */}
      {viewingReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '750px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>View Requisition</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Title: <strong style={{ color: 'var(--text-primary)' }}>{viewingReq.title}</strong></p>
              </div>
              <div>
                {getStatusBadge(viewingReq.status)}
              </div>
            </div>

            {/* Requisition Header & Buyer Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
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

            {/* Catalog Item Details Table */}
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Catalog & Non-Catalog Item Details ({viewingReq.items?.length || 0})
            </h4>

            {viewingReq.items && viewingReq.items.length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem' }}>Type</th>
                      <th style={{ padding: '0.6rem' }}>Product Name</th>
                      <th style={{ padding: '0.6rem' }}>Full Description</th>
                      <th style={{ padding: '0.6rem' }}>Qty</th>
                      <th style={{ padding: '0.6rem' }}>Unit</th>
                      <th style={{ padding: '0.6rem' }}>Price</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingReq.items.map((item, idx) => {
                      const itemTotal = (item.quantity || 0) * (item.price || 0);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600, background: item.itemType === 'CATALOG' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)', color: item.itemType === 'CATALOG' ? '#2563eb' : '#7c3aed' }}>
                              {item.itemType}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>{item.fullDescription}</td>
                          <td style={{ padding: '0.6rem' }}>{item.quantity}</td>
                          <td style={{ padding: '0.6rem' }}>{item.unitMeasure}</td>
                          <td style={{ padding: '0.6rem' }}>${Number(item.price || 0).toFixed(2)}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>${itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)', background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td colSpan={6} style={{ padding: '0.75rem', textAlign: 'right' }}>Requisition Total Amount:</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-primary)', fontSize: '1rem' }}>
                        ${viewingReq.items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2)}
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
              {viewingReq.status !== 'Accepted' && viewingReq.status !== 'Declined' && (
                <>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => openActionModal(viewingReq, 'Accept')}
                  >
                    Accept Request
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => openActionModal(viewingReq, 'Decline')}
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

      {/* MODAL: SUPPLIER COMMENTS / REASON POPUP FOR ACCEPT / DECLINE */}
      {actionModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '550px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: actionModal.type === 'Accept' ? '#10b981' : '#ef4444' }}>
              {actionModal.type === 'Accept' ? 'Accept Requisition Request' : 'Decline Requisition Request'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Requisition: <strong style={{ color: 'var(--text-primary)' }}>{actionModal.reqTitle}</strong>
              <br />
              Please provide your comments or reason (up to 400 characters). This will be sent to the Buyer's Notifications tab.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Supplier Comments / Reason * <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 400 }}>(Mandatory)</span>
              </label>
              <textarea
                className="form-input"
                style={{
                  width: '100%',
                  height: '110px',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                }}
                maxLength={400}
                placeholder={`Provide mandatory comments or reason for ${actionModal.type.toLowerCase()}ing... *`}
                value={actionModal.comment}
                onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
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
                onClick={() => setActionModal({ ...actionModal, open: false })}
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
                {submittingAction ? 'Submitting...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequestNotificationPage;
