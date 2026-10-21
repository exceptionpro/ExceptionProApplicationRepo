import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

interface CatalogueItem {
  id: string;
  productName: string;
  productType: string;
  price: number;
  currencyType?: string;
  description: string;
  imageUrl: string | null;
  userId: string;
  createdAt: string;
}

const Catalogue: React.FC = () => {
  const { user } = useAuth();

  // Redirect if not Supplier or Buyer and Supplier
  if (user && (!user.accountType || !user.accountType.toLowerCase().includes('supplier'))) {
    return <Navigate to="/feed" replace />;
  }

  // Catalogue List State
  const [catalogues, setCatalogues] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('');
  const [price, setPrice] = useState('');
  const [currencyType, setCurrencyType] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all catalogues for this user
  const fetchCatalogues = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/catalogue');
      setCatalogues(response.data || []);
    } catch (err: any) {
      console.error('Error fetching catalogues:', err);
      setError(err.response?.data?.message || 'Failed to fetch catalogues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogues();
  }, []);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setImageUploading(true);
    setError(null);
    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrl(response.data.fileUrl);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  // Clear Form State
  const resetForm = () => {
    setEditingId(null);
    setProductName('');
    setProductType('');
    setPrice('');
    setCurrencyType('');
    setDescription('');
    setImageUrl(null);
    setImageUploading(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create or Update Catalogue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    if (!currencyType.trim()) {
      setError('Currency Type is required');
      return;
    }

    const payload = {
      productName,
      productType,
      price: priceNum,
      currencyType: currencyType.trim(),
      description,
      imageUrl,
    };

    try {
      if (editingId) {
        // Edit mode
        await api.put(`/api/catalogue/${editingId}`, payload);
        setSuccess('Product updated successfully!');
      } else {
        // Create mode
        await api.post('/api/catalogue', payload);
        setSuccess('Product added to catalogue successfully!');
      }
      resetForm();
      fetchCatalogues();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving catalogue:', err);
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  // Delete Catalogue Item
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/catalogue/${id}`);
      setSuccess('Product deleted successfully!');
      fetchCatalogues();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting catalogue:', err);
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Populate form for editing
  const handleStartEdit = (item: CatalogueItem) => {
    setEditingId(item.id);
    setProductName(item.productName);
    setProductType(item.productType);
    setPrice(item.price.toString());
    setCurrencyType(item.currencyType || '');
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setImageUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      <LeftNavigation activePage="catalogue" />

      {/* Center/Main Catalog Content */}
      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECTION: CREATE CATALOGUE */}
          <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none', padding: '2rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {editingId ? 'Edit Catalogue' : 'Create Catalogue'}
            </h2>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
              {editingId ? 'Modify details of your existing product' : 'Add a new product to your public catalogues'}
            </p>

            {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Product Type *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter product type (e.g. Hardware, Service)"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <label className="form-label">Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label className="form-label">Currency Type *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. USD, EUR, INR"
                        value={currencyType}
                        onChange={(e) => setCurrencyType(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Upload Product Image (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-input"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {imageUploading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploading image...</span>}
                </div>
              </div>

              <div className="form-group" style={{ width: '100%' }}>
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Describe your product details, specifications, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {imageUrl && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label">Image Preview</label>
                  <img
                    src={getMediaUrl(imageUrl)}
                    alt="Preview"
                    style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="nav-btn" style={{ width: 'auto', padding: '0.65rem 1.5rem', background: 'var(--accent-gradient)' }}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '0.65rem 1.5rem', margin: 0 }} onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* SECTION: LIST CATALOGUES */}
          <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none', padding: '2rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              List Catalogues
            </h2>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
              All products currently available in your business portfolio
            </p>

            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading catalog items...</p>
            ) : catalogues.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No products found in your catalogue. Add some products using the form above.</p>
            ) : (
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1rem'
                }}
              >
                {catalogues.map((item) => (
                  <div 
                    key={item.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '0.75rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      border: '1px solid var(--border-color)',
                      margin: 0,
                      maxWidth: 'none',
                      borderRadius: '12px'
                    }}
                  >
                    {/* Top image */}
                    <div style={{ width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      {item.imageUrl ? (
                        <img 
                          src={getMediaUrl(item.imageUrl)} 
                          alt={item.productName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '2.5rem' }}>📦</div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.productName}>
                        {item.productName}
                      </h4>
                      <span className="badge badge-hybrid" style={{ fontSize: '0.65rem', alignSelf: 'flex-start', padding: '0.15rem 0.4rem' }}>
                        {item.productType}
                      </span>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {item.currencyType ? `${item.currencyType} ` : '$'}{item.price.toFixed(2)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '48px', lineHeight: '16px' }} title={item.description}>
                        {item.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="nav-btn" 
                        style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', margin: 0, borderRadius: '6px' }}
                        onClick={() => handleStartEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', margin: 0, color: 'var(--error)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
  );
};

export default Catalogue;
