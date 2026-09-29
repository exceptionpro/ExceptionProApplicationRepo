import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

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
  items: CollaborationItem[];
  proposals: SupplierProposal[];
}

const CollaborationRequestNotificationPage: React.FC = () => {
  const [requests, setRequests] = useState<CollaborationRequisitionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // Accept Modal State
  const [acceptModalReq, setAcceptModalReq] = useState<CollaborationRequisitionData | null>(null);
  const [acceptComments, setAcceptComments] = useState('');

  // Decline Modal State
  const [declineModalReq, setDeclineModalReq] = useState<CollaborationRequisitionData | null>(null);
  const [declineComments, setDeclineComments] = useState('');

  // Proposal Modal State
  const [proposalModalReq, setProposalModalReq] = useState<CollaborationRequisitionData | null>(null);
  const [proposalText, setProposalText] = useState('');

  // Details Modal State
  const [viewingReq, setViewingReq] = useState<CollaborationRequisitionData | null>(null);

  useEffect(() => {
    fetchSupplierCollaborationRequests();
  }, []);

  const fetchSupplierCollaborationRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/collaboration-requisitions/requests');
      setRequests(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch collaboration request notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAcceptModal = (req: CollaborationRequisitionData) => {
    setAcceptModalReq(req);
    setAcceptComments('');
    setModalError('');
  };

  const handleSubmitAccept = async () => {
    if (!acceptModalReq) return;
    if (!acceptComments.trim()) {
      setModalError('Comments are mandatory when accepting a collaboration request.');
      return;
    }

    setError('');
    setSuccess('');
    setModalError('');
    try {
      await api.put(`/api/collaboration-requisitions/${acceptModalReq.id}/accept`, {
        comments: acceptComments.trim(),
      });
      setSuccess('Collaboration Requisition request accepted successfully!');
      setAcceptModalReq(null);
      setAcceptComments('');
      fetchSupplierCollaborationRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept collaboration requisition';
      setModalError(msg);
      setError(msg);
    }
  };

  const handleOpenDeclineModal = (req: CollaborationRequisitionData) => {
    setDeclineModalReq(req);
    setDeclineComments('');
    setModalError('');
  };

  const handleSubmitDecline = async () => {
    if (!declineModalReq) return;
    if (!declineComments.trim()) {
      setModalError('Comments/reason are mandatory when declining a collaboration request.');
      return;
    }

    setError('');
    setSuccess('');
    setModalError('');
    try {
      await api.put(`/api/collaboration-requisitions/${declineModalReq.id}/decline`, {
        comments: declineComments.trim(),
      });
      setSuccess('Collaboration Requisition request declined!');
      setDeclineModalReq(null);
      setDeclineComments('');
      fetchSupplierCollaborationRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to decline collaboration requisition';
      setModalError(msg);
      setError(msg);
    }
  };

  const handleOpenProposalModal = (req: CollaborationRequisitionData) => {
    setProposalModalReq(req);
    setProposalText('');
    setModalError('');
  };

  const handleSendProposal = async () => {
    if (!proposalModalReq) return;
    if (!proposalText.trim()) {
      setModalError('Comments/proposal text are mandatory when submitting a proposal.');
      return;
    }

    setError('');
    setSuccess('');
    setModalError('');
    try {
      await api.post(`/api/collaboration-requisitions/${proposalModalReq.id}/proposal`, {
        proposalText: proposalText.trim(),
      });
      setSuccess('Supplier Proposal sent successfully to Buyer!');
      setProposalModalReq(null);
      setProposalText('');
      fetchSupplierCollaborationRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send supplier proposal';
      setModalError(msg);
      setError(msg);
    }
  };

  const getSupplierStatusBadge = (req: CollaborationRequisitionData) => {
    const hasAcceptedProposal = req.proposals && req.proposals.some((p) => p.evaluationStatus === 'Accepted');
    if (hasAcceptedProposal) {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Accepted</span>;
    }
    if (req.status === 'Declined') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Declined</span>;
    }
    return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Pending from Buyer</span>;
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      <LeftNavigation activePage="collaboration-request-notification" />

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Collaboration Requests</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Review collaboration requisition requests submitted by Buyers and submit proposals</p>

          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          {loading ? (
            <div>Loading collaboration requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No incoming collaboration requisition requests at this time.
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collaboration Request</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.1rem 0 0 0', color: 'var(--text-primary)' }}>{req.title}</h3>
                    </div>
                    <div>{getSupplierStatusBadge(req)}</div>
                  </div>

                  {/* Record Fields Grid */}
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

                  {/* Display existing proposals sent for this request */}
                  {req.proposals && req.proposals.length > 0 && (
                    <div style={{ background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem' }}>Proposals Sent:</strong>
                      {req.proposals.map((p) => (
                        <div key={p.id} style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          • "{p.proposalText}" — Status: <strong style={{ color: p.evaluationStatus === 'Accepted' ? '#10b981' : '#f59e0b' }}>{p.evaluationStatus || 'Need to Evaluate'}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({new Date(p.createdAt).toLocaleDateString()})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons: Accept, Decline, Proposal */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-color)',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      className="btn"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.85rem',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={() => handleOpenAcceptModal(req)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.85rem',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={() => handleOpenDeclineModal(req)}
                    >
                      Decline
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.85rem',
                        width: 'auto',
                        margin: 0,
                        fontWeight: 600,
                        background: 'var(--accent-glow)',
                        color: 'var(--accent-primary)',
                        borderColor: 'var(--accent-primary)',
                      }}
                      onClick={() => handleOpenProposalModal(req)}
                    >
                      Proposal
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.85rem',
                        width: 'auto',
                        margin: 0,
                        fontWeight: 600,
                      }}
                      onClick={() => setViewingReq(req)}
                    >
                      View Items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL: ACCEPT COLLABORATION REQUEST */}
      {acceptModalReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Accept Collaboration Request</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Accept collaboration request for "<strong>{acceptModalReq.title}</strong>" from Buyer {acceptModalReq.buyerName}.
            </p>

            {modalError && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{modalError}</div>}

            <div className="form-group">
              <label className="form-label">Accept Comments / Remarks *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Enter mandatory comments for accepting this collaboration request (will be sent to Buyer's Notifications)..."
                value={acceptComments}
                onChange={(e) => setAcceptComments(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAcceptModalReq(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={handleSubmitAccept}
              >
                Accept & Send Comments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECLINE COLLABORATION REQUEST */}
      {declineModalReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Decline Collaboration Request</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Decline collaboration request for "<strong>{declineModalReq.title}</strong>" from Buyer {declineModalReq.buyerName}.
            </p>

            {modalError && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{modalError}</div>}

            <div className="form-group">
              <label className="form-label">Decline Reason / Comments *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Enter mandatory reason/comments for declining this collaboration request (will be sent to Buyer's Notifications)..."
                value={declineComments}
                onChange={(e) => setDeclineComments(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeclineModalReq(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, padding: '0.5rem 1.25rem', cursor: 'pointer' }}
                onClick={handleSubmitDecline}
              >
                Decline & Send Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPPLIER PROPOSALS POPUP */}
      {proposalModalReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', padding: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Supplier Proposal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Send proposal comments for "<strong>{proposalModalReq.title}</strong>" to Buyer {proposalModalReq.buyerName}
            </p>

            {modalError && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{modalError}</div>}

            <div className="form-group">
              <label className="form-label">Proposal Comments / Content *</label>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Enter mandatory proposal comments, detailed proposal terms, pricing adjustments, delivery timeframe, etc."
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setProposalModalReq(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendProposal}
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ITEMS DETAILS */}
      {viewingReq && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Items for "{viewingReq.title}"</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Buyer: {viewingReq.buyerName} ({viewingReq.buyerEmail})
            </p>

            {viewingReq.items && viewingReq.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Product Name</th>
                    <th style={{ padding: '0.5rem' }}>Description</th>
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
              <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No items attached.</div>
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

export default CollaborationRequestNotificationPage;
