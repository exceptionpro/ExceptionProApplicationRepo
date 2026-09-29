import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeftNavigation from '../components/LeftNavigation';

export interface CommentData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  commentText: string;
  dateCreated: string;
  numLikes: number;
  likedByCurrentUser: boolean;
  replies: CommentData[];
}

export interface PostData {
  id: string;
  userId: string;
  userEmail?: string;
  userName: string;
  profilePicture: string;
  accountType: string;
  postDescription: string;
  attachedMedia: string[];
  mediaThumbnails?: string[];
  dateCreated: string;
  lastUpdated: string;
  visibility: string;
  numLikes: number;
  numComments: number;
  numShares: number;
  numViews: number;
  status: string;
  comments: CommentData[];
  likedByCurrentUser: boolean;
  savedByCurrentUser: boolean;
  reportedByCurrentUser: boolean;
  likedByUserNames?: string[];
}

export interface SuggestedUserItem {
  profile: {
    id: string;
    email: string;
    accountType: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    legalName?: string;
    city?: string;
    state?: string;
    country?: string;
    profilePicture?: string;
  };
  relationshipStatus: string;
  requestId?: string | null;
}

interface ImagePreviewItemProps {
  file: File;
  onRemove: () => void;
}

const ImagePreviewItem: React.FC<ImagePreviewItemProps> = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) return null;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm'].includes(ext);
  const isDoc = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  return (
    <div style={{ position: 'relative', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', overflow: 'hidden', height: '100px' }}>
      {isVideo ? (
        <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
      ) : isDoc ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center', background: 'var(--bg-tertiary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
        </div>
      ) : (
        <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <button
        type="button"
        onClick={onRemove}
        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        &times;
      </button>
    </div>
  );
};

// @ts-ignore
import { renderAsync } from 'docx-preview';

interface DocxPreviewProps {
  url: string;
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ url }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadDocx = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch file');
        const buffer = await res.arrayBuffer();
        if (active && containerRef.current) {
          containerRef.current.innerHTML = '';
          await renderAsync(buffer, containerRef.current, undefined, {
            className: 'docx-rendered',
            inWrapper: false,
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error('Docx render error', err);
          setError('Failed to load docx preview.');
          setLoading(false);
        }
      }
    };

    loadDocx();
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#f3f4f6', position: 'relative' }}>
      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading DOCX preview...</div>}
      {error && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>}
      <div ref={containerRef} style={{ padding: '10px' }} />
    </div>
  );
};

// @ts-ignore
import * as XLSX from 'xlsx';

interface XlsxPreviewProps {
  url: string;
}

const XlsxPreview: React.FC<XlsxPreviewProps> = ({ url }) => {
  const [html, setHtml] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadXlsx = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch file');
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Read the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to HTML
        const sheetHtml = XLSX.utils.sheet_to_html(worksheet);

        if (active) {
          setHtml(sheetHtml);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error('Xlsx render error', err);
          setError('Failed to load excel preview.');
          setLoading(false);
        }
      }
    };

    loadXlsx();
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#fff', position: 'relative', padding: '10px' }}>
      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Excel preview...</div>}
      {error && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflow: 'auto', maxHeight: '100%' }}>
          <style>{`
            .xlsx-preview-table table {
              border-collapse: collapse;
              width: 100%;
              border: 1px solid #ddd;
              font-family: inherit;
            }
            .xlsx-preview-table td {
              border: 1px solid #ddd;
              padding: 6px 10px;
              white-space: nowrap;
              color: var(--text-primary);
            }
            .xlsx-preview-table tr:first-child td {
              background-color: var(--bg-tertiary);
              font-weight: 600;
            }
          `}</style>
          <div
            dangerouslySetInnerHTML={{ __html: html }}
            className="xlsx-preview-table"
          />
        </div>
      )}
    </div>
  );
};

// @ts-ignore
import JSZip from 'jszip';

interface PptxPreviewProps {
  url: string;
}

const PptxPreview: React.FC<PptxPreviewProps> = ({ url }) => {
  const [slides, setSlides] = React.useState<Array<{ slideNumber: number; texts: string[] }>>([]);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadPptx = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch file');
        const buffer = await res.arrayBuffer();

        const zip = await JSZip.loadAsync(buffer);
        const slideFiles = Object.keys(zip.files).filter(path =>
          path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
        );

        if (slideFiles.length === 0) {
          throw new Error('No slides found in presentation.');
        }

        // Sort slides numerically: ppt/slides/slide1.xml, ppt/slides/slide2.xml, etc.
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.replace('ppt/slides/slide', '').replace('.xml', '')) || 0;
          const numB = parseInt(b.replace('ppt/slides/slide', '').replace('.xml', '')) || 0;
          return numA - numB;
        });

        const parsedSlides = [];
        for (const slidePath of slideFiles) {
          const xmlText = await zip.files[slidePath].async('string');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const textNodes = xmlDoc.getElementsByTagName('a:t');
          const texts = Array.from(textNodes).map(node => node.textContent || '').filter(t => t.trim().length > 0);
          parsedSlides.push({
            slideNumber: parsedSlides.length + 1,
            texts
          });
        }

        if (active) {
          setSlides(parsedSlides);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error('Pptx render error', err);
          setError('Failed to parse PowerPoint presentation.');
          setLoading(false);
        }
      }
    };

    loadPptx();
    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading presentation slides...</div>;
  }

  if (error || slides.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>{error || 'Failed to load slides preview.'}</div>;
  }

  const currentSlide = slides[activeSlide];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1e293b', color: '#fff', position: 'relative' }}>

      {/* Slide Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', overflow: 'auto', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '90%' }}>
          {currentSlide.texts.length > 0 ? (
            currentSlide.texts.map((text, idx) => {
              // Guess header vs body
              const isHeader = idx === 0 && text.length < 50;
              return (
                <div
                  key={idx}
                  style={{
                    fontSize: isHeader ? '1.4rem' : '0.95rem',
                    fontWeight: isHeader ? '700' : '400',
                    lineHeight: '1.6',
                    marginBottom: isHeader ? '1.5rem' : '0.75rem',
                    color: isHeader ? '#f8fafc' : '#cbd5e1'
                  }}
                >
                  {text}
                </div>
              );
            })
          ) : (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Empty Slide</div>
          )}
        </div>
      </div>

      {/* Slide Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: '#0f172a', borderTop: '1px solid #334155' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Slide {activeSlide + 1} of {slides.length}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={activeSlide === 0}
            onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
            style={{
              background: activeSlide === 0 ? '#1e293b' : '#3b82f6',
              color: activeSlide === 0 ? '#64748b' : '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: activeSlide === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={activeSlide === slides.length - 1}
            onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
            style={{
              background: activeSlide === slides.length - 1 ? '#1e293b' : '#3b82f6',
              color: activeSlide === slides.length - 1 ? '#64748b' : '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: activeSlide === slides.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export interface PostAttachmentsProps {
  attachedMedia: string[];
  mediaThumbnails?: string[];
  getMediaUrl: (url: string) => string;
}

export const PostAttachments: React.FC<PostAttachmentsProps> = ({ attachedMedia, mediaThumbnails, getMediaUrl }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Filter out any null, undefined, or empty values from attachments
  const cleanAttachedMedia = (attachedMedia || []).filter(url => url && url.trim() !== '');

  if (cleanAttachedMedia.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: -width, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: width, behavior: 'smooth' });
    }
  };

  // Classify media files
  const classifiedMedia = cleanAttachedMedia.map((url, index) => {
    const normalizedUrl = url.replace(/\\/g, '/');
    const cleanUrl = normalizedUrl.split('?')[0];
    const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const thumbnailUrl = mediaThumbnails && mediaThumbnails[index] ? getMediaUrl(mediaThumbnails[index]) : undefined;

    let type = 'DOC';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      type = 'IMAGE';
    } else if (['mp4', 'mov', 'avi', 'webm', 'ogg'].includes(extension)) {
      type = 'VIDEO';
    }

    return { url: normalizedUrl, filename, extension, type, thumbnailUrl };
  });

  const images = classifiedMedia.filter(m => m.type === 'IMAGE');
  const videos = classifiedMedia.filter(m => m.type === 'VIDEO');
  const docs = classifiedMedia.filter(m => m.type === 'DOC');

  console.log('PostAttachments rendering:', { cleanAttachedMedia, images, videos, docs });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
      {/* 1. Images Section */}
      {images.length > 0 && (
        <>
          {images.length === 1 ? (
            <div
              style={{
                width: '100%',
                maxHeight: '450px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={getMediaUrl(images[0].url)}
                alt="Post image"
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ) : (
            <div className="image-nav-container">
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={scrollLeft}
                className="nav-scroll-btn scroll-left"
              >
                &lt;
              </button>

              {/* Scrollable Container */}
              <div
                ref={scrollRef}
                className="horizontal-image-nav"
              >
                {images.map((img, idx) => (
                  <div key={idx} className="nav-image-card">
                    <img
                      src={getMediaUrl(img.url)}
                      alt={`Post image ${idx + 1}`}
                    />
                    <div className="nav-image-badge">
                      {idx + 1} / {images.length}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={scrollRight}
                className="nav-scroll-btn scroll-right"
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. Videos Section */}
      {videos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {videos.map((vid, idx) => (
            <div
              key={idx}
              style={{
                width: '100%',
                maxHeight: '450px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                background: '#000'
              }}
            >
              <video
                src={getMediaUrl(vid.url)}
                poster={vid.thumbnailUrl}
                controls
                style={{ width: '100%', maxHeight: '450px', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. Documents Section */}
      {docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {docs.map((doc, idx) => {
            const fileUrl = getMediaUrl(doc.url);
            const ext = doc.extension;
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            // PDF inline preview
            if (ext === 'pdf') {
              return (
                <div key={idx} style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff', position: 'relative' }}>
                  <iframe
                    src={fileUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={doc.filename}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>View Fullscreen</a>
                    <a href={fileUrl} download style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>Download</a>
                  </div>
                </div>
              );
            }

            // DOCX / DOC inline preview
            if (ext === 'docx' || ext === 'doc') {
              return (
                <div key={idx} style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff', position: 'relative' }}>
                  <DocxPreview url={fileUrl} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>View Original</a>
                    <a href={fileUrl} download style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>Download</a>
                  </div>
                </div>
              );
            }

            // XLSX / XLS inline preview
            if (ext === 'xlsx' || ext === 'xls') {
              return (
                <div key={idx} style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff', position: 'relative' }}>
                  <XlsxPreview url={fileUrl} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>View Original</a>
                    <a href={fileUrl} download style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>Download</a>
                  </div>
                </div>
              );
            }

            // PPTX / PPT inline preview
            if (ext === 'pptx' || ext === 'ppt') {
              return (
                <div key={idx} style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#1e293b', position: 'relative' }}>
                  <PptxPreview url={fileUrl} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>View Original</a>
                    <a href={fileUrl} download style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>Download</a>
                  </div>
                </div>
              );
            }

            // Fallback - Localhost simulator / cloud document viewer
            if (isLocalhost) {
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '420px', width: '100%', background: 'var(--bg-secondary)', padding: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative', width: '80%', height: '80%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', textAlign: 'left' }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Format: {ext.toUpperCase()} Document</div>
                      </div>
                    </div>

                    {/* Content Simulation */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>
                      <div style={{ width: '60px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                      <div style={{ width: '80px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                      <div style={{ width: '50px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                      <p style={{ marginTop: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Direct local preview simulator</p>
                      <span style={{ fontSize: '0.7rem' }}>Cloud viewers cannot fetch from localhost. For high-fidelity previews, please download or view in a new tab.</span>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, textDecoration: 'none', margin: 0, padding: '0.4rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: 'var(--accent-gradient)', color: '#fff', borderRadius: '6px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        View Document
                      </a>
                      <a
                        href={fileUrl}
                        download
                        style={{ flex: 1, textDecoration: 'none', margin: 0, padding: '0.4rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      >
                        Download File
                      </a>
                    </div>
                  </div>
                </div>
              );
            } else {
              const absoluteFileUrl = window.location.origin + fileUrl;
              const cloudViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(absoluteFileUrl)}&embedded=true`;
              return (
                <div key={idx} style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff', position: 'relative' }}>
                  <iframe
                    src={cloudViewerUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={doc.filename}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>View Original</a>
                    <a href={fileUrl} download style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none', boxShadow: 'var(--shadow-sm)' }}>Download</a>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export interface CommentItemProps {
  comment: CommentData;
  postId: string;
  user: any;
  editingCommentId: string | null;
  editingComments: { [commentId: string]: string };
  setEditingCommentId: (id: string | null) => void;
  setEditingComments: React.Dispatch<React.SetStateAction<{ [commentId: string]: string }>>;
  handleSaveEditComment: (e: React.FormEvent, commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleLikeComment: (commentId: string) => void;
  replyingCommentId: string | null;
  setReplyingCommentId: (id: string | null) => void;
  replyInputs: { [commentId: string]: string };
  setReplyInputs: React.Dispatch<React.SetStateAction<{ [commentId: string]: string }>>;
  handleAddReply: (e: React.FormEvent, postId: string, parentCommentId: string) => void;
  formatTime: (isoString: string) => string;
  onUserClick?: (email: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  user,
  editingCommentId,
  editingComments,
  setEditingCommentId,
  setEditingComments,
  handleSaveEditComment,
  handleDeleteComment,
  handleLikeComment,
  replyingCommentId,
  setReplyingCommentId,
  replyInputs,
  setReplyInputs,
  handleAddReply,
  formatTime,
  onUserClick
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const POPULAR_EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '👏', '😮', '😢'];

  const appendEmojiToEdit = (emoji: string) => {
    const current = editingComments[comment.id] || '';
    setEditingComments(prev => ({ ...prev, [comment.id]: current + emoji }));
  };

  const appendEmojiToReply = (emoji: string) => {
    const current = replyInputs[comment.id] || '';
    setReplyInputs(prev => ({ ...prev, [comment.id]: current + emoji }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Mini initial avatar */}
        <div
          onClick={() => onUserClick?.(comment.userEmail || comment.userName)}
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', flexShrink: 0, cursor: onUserClick ? 'pointer' : 'default' }}
        >
          {comment.userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                onClick={() => onUserClick?.(comment.userEmail || comment.userName)}
                style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', cursor: onUserClick ? 'pointer' : 'default' }}
              >
                {comment.userName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(comment.dateCreated)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Like Comment button */}
              <button
                onClick={() => handleLikeComment(comment.id)}
                style={{ background: 'none', border: 'none', color: comment.likedByCurrentUser ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.15rem' }}
              >
                {comment.likedByCurrentUser ? '❤️' : '🤍'} {comment.numLikes > 0 && comment.numLikes}
              </button>

              {/* Reply trigger button */}
              <button
                onClick={() => {
                  setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
              >
                Reply
              </button>

              {/* Edit / Delete options only for owner */}
              {user && user.email === comment.userEmail && (
                <>
                  <button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditingComments(prev => ({ ...prev, [comment.id]: comment.commentText }));
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {editingCommentId === comment.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem', width: '100%' }}>
              {/* Muted view of the existing comment as reference */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.8, fontStyle: 'italic', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
                {comment.commentText}
              </div>
              <form onSubmit={(e) => handleSaveEditComment(e, comment.id)} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editingComments[comment.id] || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setEditingComments(prev => ({ ...prev, [comment.id]: text }));
                  }}
                  className="form-input"
                  style={{ margin: 0, padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  required
                  autoFocus
                />

                {/* Emoji Trigger */}
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 0 }}>😀</button>

                <button type="submit" className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>Save</button>
                <button type="button" onClick={() => setEditingCommentId(null)} className="nav-btn" style={{ width: 'auto', margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>Cancel</button>
              </form>

              {showEmojiPicker && (
                <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-primary)', padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                  {POPULAR_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => appendEmojiToEdit(emoji)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.15rem' }}>{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{comment.commentText}</p>
          )}
        </div>
      </div>

      {/* Reply Input Box */}
      {replyingCommentId === comment.id && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginLeft: '2rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)' }}>
          <form onSubmit={(e) => handleAddReply(e, postId, comment.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
            <input
              type="text"
              placeholder={`Reply to ${comment.userName}...`}
              value={replyInputs[comment.id] || ''}
              onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
              className="form-input"
              style={{ margin: 0, padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              required
              autoFocus
            />

            {/* Emoji Trigger */}
            <button type="button" onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 0 }}>😀</button>

            <button type="submit" className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>Reply</button>
            <button type="button" onClick={() => setReplyingCommentId(null)} className="nav-btn" style={{ width: 'auto', margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>Cancel</button>
          </form>

          {showReplyEmojiPicker && (
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-primary)', padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              {POPULAR_EMOJIS.map(emoji => (
                <button key={emoji} type="button" onClick={() => appendEmojiToReply(emoji)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.15rem' }}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Nested Replies recursively */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              user={user}
              editingCommentId={editingCommentId}
              editingComments={editingComments}
              setEditingCommentId={setEditingCommentId}
              setEditingComments={setEditingComments}
              handleSaveEditComment={handleSaveEditComment}
              handleDeleteComment={handleDeleteComment}
              handleLikeComment={handleLikeComment}
              replyingCommentId={replyingCommentId}
              setReplyingCommentId={setReplyingCommentId}
              replyInputs={replyInputs}
              setReplyInputs={setReplyInputs}
              handleAddReply={handleAddReply}
              formatTime={formatTime}
              onUserClick={onUserClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUserClick = (email: string) => {
    if (!email) return;
    if (email === user?.email) {
      navigate('/profile');
    } else {
      navigate(`/profile?email=${encodeURIComponent(email)}`);
    }
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    // Normalize backslashes to forward slashes
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create post states
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments state (map of postId -> expanded boolean, and map of postId -> typing text)
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  // Comment Edit States
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingComments, setEditingComments] = useState<{ [commentId: string]: string }>({});

  // Edit post states
  interface EditingPostState {
    id: string;
    postDescription: string;
    attachedMedia: string[];
    mediaThumbnails: string[];
    visibility: string;
    newFiles: File[];
  }
  const [editingPost, setEditingPost] = useState<EditingPostState | null>(null);
  const [savingEditPost, setSavingEditPost] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Comment Reply States
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});

  // Emoji picker show/hide for post comments
  const [activeEmojiPostId, setActiveEmojiPostId] = useState<string | null>(null);

  // Share tooltip/alert notification state
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // Report modal states
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportComments, setReportComments] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Suggested Connections states
  const [suggestedConnections, setSuggestedConnections] = useState<SuggestedUserItem[]>([]);
  const [suggestedTitle, setSuggestedTitle] = useState('Suggested Connections');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await api.get('/api/users/recommendations');
      if (res.data) {
        setSuggestedTitle(res.data.title || 'Suggested Connections');
        setSuggestedConnections(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    try {
      setConnectingUserId(targetUserId);
      await api.post('/api/partners/request', { receiverId: targetUserId });
      setSuggestedConnections((prev) =>
        prev.map((item) =>
          item.profile.id === targetUserId
            ? { ...item, relationshipStatus: 'PENDING_SENT' }
            : item
        )
      );
    } catch (err: any) {
      console.error('Failed to send partner request', err);
    } finally {
      setConnectingUserId(null);
    }
  };

  const fetchFeed = async () => {
    try {
      const response = await api.get('/api/posts');
      setPosts(response.data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load social feed.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, []);

  const generateVideoThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration || 1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              cleanup();
              resolve(blob);
            }, 'image/jpeg', 0.85);
          } else {
            cleanup();
            resolve(null);
          }
        } catch (e) {
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const allowedVideoExtensions = ['mp4', 'mov', 'avi', 'webm'];
      const allowedDocExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

      let validFiles: File[] = [];
      let sizeError = false;
      let formatError = false;
      let errorMessage = '';

      for (const file of filesArray) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isImage = allowedImageExtensions.includes(ext);
        const isVideo = allowedVideoExtensions.includes(ext);
        const isDocument = allowedDocExtensions.includes(ext);

        if (!isImage && !isVideo && !isDocument) {
          formatError = true;
          errorMessage = 'Unsupported file format. Only JPG, JPEG, PNG, WEBP images, MP4, MOV, AVI, WEBM videos, and PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX documents are supported.';
          continue;
        }

        if (isImage && file.size > 20 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each image must be smaller than 20 MB.';
          continue;
        }

        if (isVideo && file.size > 200 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each video must be smaller than 200 MB.';
          continue;
        }

        if (isDocument && file.size > 25 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each document must be smaller than 25 MB.';
          continue;
        }

        validFiles.push(file);
      }

      if (formatError || sizeError) {
        setError(errorMessage);
      } else {
        setError(null);
      }

      setSelectedFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 10) {
          setError('Maximum of 10 attachments are allowed per post.');
          return combined.slice(0, 10);
        }
        return combined;
      });

      // Clear value to allow selecting the same file again if removed
      e.target.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && selectedFiles.length === 0) {
      setError('Please add some text or attach media before publishing.');
      return;
    }

    setPublishing(true);
    setError(null);
    setPublishSuccess(null);

    try {
      const attachedMedia: string[] = [];
      const mediaThumbnails: string[] = [];

      for (const file of selectedFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);

        if (isVideo) {
          // 1. Generate video thumbnail blob
          let thumbnailBlob: Blob | null = null;
          try {
            thumbnailBlob = await generateVideoThumbnail(file);
          } catch (err) {
            console.error('Failed to generate thumbnail', err);
          }

          let thumbnailUrl = '';
          if (thumbnailBlob) {
            // 2. Upload thumbnail blob
            const thumbFile = new File([thumbnailBlob], `thumb-${file.name}.jpg`, { type: 'image/jpeg' });
            const thumbFormData = new FormData();
            thumbFormData.append('file', thumbFile);
            const thumbUploadRes = await api.post('/api/upload', thumbFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            thumbnailUrl = thumbUploadRes.data.fileUrl;
          }

          // 3. Upload video file
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          attachedMedia.push(uploadRes.data.fileUrl);
          mediaThumbnails.push(thumbnailUrl);
        } else {
          // It's an image
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          attachedMedia.push(uploadRes.data.fileUrl);
          mediaThumbnails.push('');
        }
      }

      // 2. Create post
      await api.post('/api/posts', {
        postDescription: description,
        attachedMedia,
        mediaThumbnails,
        visibility
      });

      setPublishSuccess('Post published successfully!');
      setDescription('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFeed();
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to publish post. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleEditPostClick = (post: PostData) => {
    setEditingPost({
      id: post.id,
      postDescription: post.postDescription,
      attachedMedia: [...post.attachedMedia],
      mediaThumbnails: post.mediaThumbnails ? [...post.mediaThumbnails] : Array(post.attachedMedia.length).fill(''),
      visibility: post.visibility,
      newFiles: []
    });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && editingPost) {
      const filesArray = Array.from(e.target.files);
      const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const allowedVideoExtensions = ['mp4', 'mov', 'avi', 'webm'];
      const allowedDocExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

      let validFiles: File[] = [];
      let sizeError = false;
      let formatError = false;
      let errorMessage = '';

      for (const file of filesArray) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isImage = allowedImageExtensions.includes(ext);
        const isVideo = allowedVideoExtensions.includes(ext);
        const isDocument = allowedDocExtensions.includes(ext);

        if (!isImage && !isVideo && !isDocument) {
          formatError = true;
          errorMessage = 'Unsupported file format.';
          continue;
        }

        if (isImage && file.size > 20 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each image must be smaller than 20 MB.';
          continue;
        }

        if (isVideo && file.size > 200 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each video must be smaller than 200 MB.';
          continue;
        }

        if (isDocument && file.size > 25 * 1024 * 1024) {
          sizeError = true;
          errorMessage = 'Each document must be smaller than 25 MB.';
          continue;
        }

        validFiles.push(file);
      }

      if (formatError || sizeError) {
        setError(errorMessage);
      } else {
        setError(null);
      }

      setEditingPost(prev => {
        if (!prev) return null;
        const combined = [...prev.newFiles, ...validFiles];
        if (prev.attachedMedia.length + combined.length > 10) {
          setError('Maximum of 10 attachments are allowed per post.');
          return { ...prev, newFiles: combined.slice(0, 10 - prev.attachedMedia.length) };
        }
        return { ...prev, newFiles: combined };
      });

      e.target.value = '';
    }
  };

  const removeExistingMedia = (index: number) => {
    if (editingPost) {
      setEditingPost({
        ...editingPost,
        attachedMedia: editingPost.attachedMedia.filter((_, i) => i !== index),
        mediaThumbnails: editingPost.mediaThumbnails.filter((_, i) => i !== index)
      });
    }
  };

  const removeNewFile = (index: number) => {
    if (editingPost) {
      setEditingPost({
        ...editingPost,
        newFiles: editingPost.newFiles.filter((_, i) => i !== index)
      });
    }
  };

  const handleSavePostEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    if (!editingPost.postDescription.trim() && editingPost.attachedMedia.length === 0 && editingPost.newFiles.length === 0) {
      setError('Please add some text or attach media.');
      return;
    }

    setSavingEditPost(true);
    setError(null);

    try {
      const attachedMedia = [...editingPost.attachedMedia];
      const mediaThumbnails = [...editingPost.mediaThumbnails];

      for (const file of editingPost.newFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);

        if (isVideo) {
          let thumbnailUrl = '';
          try {
            const thumbnailBlob = await generateVideoThumbnail(file);
            if (thumbnailBlob) {
              const thumbFile = new File([thumbnailBlob], `thumb-${file.name}.jpg`, { type: 'image/jpeg' });
              const thumbFormData = new FormData();
              thumbFormData.append('file', thumbFile);
              const thumbUploadRes = await api.post('/api/upload', thumbFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              thumbnailUrl = thumbUploadRes.data.fileUrl;
            }
          } catch (err) {
            console.error('Failed to generate thumbnail', err);
          }

          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          attachedMedia.push(uploadRes.data.fileUrl);
          mediaThumbnails.push(thumbnailUrl);
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          attachedMedia.push(uploadRes.data.fileUrl);
          mediaThumbnails.push('');
        }
      }

      await api.put(`/api/posts/${editingPost.id}`, {
        postDescription: editingPost.postDescription,
        attachedMedia,
        mediaThumbnails,
        visibility: editingPost.visibility
      });

      setEditingPost(null);
      fetchFeed();
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to update post. Please try again.');
    } finally {
      setSavingEditPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            const liked = !p.likedByCurrentUser;
            return {
              ...p,
              likedByCurrentUser: liked,
              numLikes: liked ? p.numLikes + 1 : Math.max(0, p.numLikes - 1)
            };
          }
          return p;
        })
      );
      await api.post(`/api/posts/${postId}/like`);
      // Sync names from the backend
      fetchFeed();
    } catch (err) {
      console.error('Failed to toggle like', err);
      // Rollback on error
      fetchFeed();
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await api.post(`/api/posts/${postId}/share`);
      const shareUrl = `${window.location.origin}/feed#post-${postId}`;
      navigator.clipboard.writeText(shareUrl);

      setShareNotification('Share link copied to clipboard!');
      setTimeout(() => setShareNotification(null), 3000);

      // Increment shares locally
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, numShares: p.numShares + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to record share', err);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/save`);
      const isSaved = response.data.saved;
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { ...p, savedByCurrentUser: isSaved }
            : p
        )
      );
      setShareNotification(isSaved ? 'Post saved successfully!' : 'Post removed from saved list.');
      setTimeout(() => setShareNotification(null), 3000);
    } catch (err) {
      console.error('Failed to toggle save post', err);
    }
  };

  const handleReportClick = (postId: string, alreadyReported: boolean) => {
    if (alreadyReported) {
      alert('You have already reported this post.');
      return;
    }
    setReportingPostId(postId);
    setReportReason('SPAM');
    setReportComments('');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId) return;

    setSubmittingReport(true);
    try {
      await api.post(`/api/posts/${reportingPostId}/report`, {
        reason: reportReason,
        comments: reportComments,
      });

      // Update local state to mark post as reported by user
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === reportingPostId
            ? { ...p, reportedByCurrentUser: true }
            : p
        )
      );

      setReportingPostId(null);
      setShareNotification('Post reported successfully.');
      setTimeout(() => setShareNotification(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit report.';
      alert(msg);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleView = async (postId: string) => {
    try {
      await api.post(`/api/posts/${postId}/view`);
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, numViews: p.numViews + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to record view', err);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const willBeOpen = !prev[postId];
      if (willBeOpen) {
        handleView(postId); // Record a view when expanded/interacted
      }
      return { ...prev, [postId]: willBeOpen };
    });
  };

  const handleCommentTextChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      await api.post(`/api/posts/${postId}/comment`, { commentText });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      // Reload feed to retrieve updated comments structure
      fetchFeed();
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleAddReply = async (e: React.FormEvent, postId: string, parentCommentId: string) => {
    e.preventDefault();
    const commentText = replyInputs[parentCommentId];
    if (!commentText || !commentText.trim()) return;

    try {
      await api.post(`/api/posts/${postId}/comment`, { commentText, parentId: parentCommentId });
      setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
      setReplyingCommentId(null);
      fetchFeed();
    } catch (err) {
      console.error('Failed to add reply', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/api/posts/comments/${commentId}/like`);
      fetchFeed();
    } catch (err) {
      console.error('Failed to toggle comment like', err);
    }
  };

  const handleSaveEditComment = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    const commentText = editingComments[commentId];
    if (!commentText || !commentText.trim()) return;

    try {
      await api.put(`/api/posts/comments/${commentId}`, { commentText });
      setEditingCommentId(null);
      setEditingComments(prev => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      fetchFeed();
    } catch (err) {
      console.error('Failed to edit comment', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/posts/comments/${commentId}`);
      fetchFeed();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  const formatDescription = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return <span key={index} className="post-hashtag" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{part}</span>;
      }
      if (part.startsWith('@')) {
        return <span key={index} className="post-mention" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="feed-layout-container">
      {shareNotification && (
        <div className="alert-success" style={{ position: 'fixed', top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          {shareNotification}
        </div>
      )}

      {/* Left Sidebar */}
      <LeftNavigation activePage="home" />

      {/* Center Feed Column */}
      <main className="feed-center-column">
        {/* Post Creator Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create a Post</h3>
          {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {publishSuccess && <div className="alert-success" style={{ marginBottom: '1rem' }}>{publishSuccess}</div>}

          <form onSubmit={handlePublish}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <textarea
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.95rem', padding: '0.75rem' }}
                placeholder="What's on your mind? Promo, news, hashtag #sales, or mention @user..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {selectedFiles.map((file, idx) => (
                  <ImagePreviewItem
                    key={idx}
                    file={file}
                    onRemove={() => removeSelectedFile(idx)}
                  />
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="nav-btn"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.5rem 1rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  Attach Media
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {/* Visibility Selector */}
                <select
                  className="form-input"
                  style={{ width: 'auto', margin: 0, padding: '0.5rem 1.75rem 0.5rem 0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', appearance: 'auto', fontSize: '0.9rem' }}
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="PUBLIC">🌍 Public</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ margin: 0, padding: '0.5rem 1.5rem' }}
                disabled={publishing}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>

        {/* Feed Listing */}
        {loading ? (
          <div className="glass-card text-center" style={{ padding: '2rem' }}>Loading community feed...</div>
        ) : posts.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '3rem' }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No posts yet</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Be the first to share an announcement, media, or promotional update!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.map((post) => (
              <div key={post.id} id={`post-${post.id}`} className="glass-card" style={{ padding: '1.5rem' }}>

                {/* Post Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* User Profile Avatar */}
                    <img
                      src={post.profilePicture}
                      alt="avatar"
                      onClick={() => handleUserClick(post.userEmail || post.userName)}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          onClick={() => handleUserClick(post.userEmail || post.userName)}
                          style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          {post.userName}
                        </span>
                        <span className="badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                          {post.accountType}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <span>{formatTime(post.dateCreated)}</span>
                        <span>•</span>
                        <span>🌍 Public</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete options */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {user && (post.userEmail === user.email || post.userName.toLowerCase() === user.email.toLowerCase() || post.userId === user.email) && (
                      <button
                        onClick={() => handleEditPostClick(post)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' }}
                        title="Edit Post"
                        className="edit-post-btn"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                        </svg>
                      </button>
                    )}

                    {user && (post.userEmail === user.email || post.userName.toLowerCase() === user.email.toLowerCase() || post.userId === user.email) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' }}
                        title="Delete Post"
                        className="delete-post-btn"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Description */}
                {post.postDescription && (
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                    {formatDescription(post.postDescription)}
                  </p>
                )}

                {/* Post Media Attachments */}
                {post.attachedMedia && post.attachedMedia.length > 0 && (
                  <PostAttachments
                    attachedMedia={post.attachedMedia}
                    mediaThumbnails={post.mediaThumbnails}
                    getMediaUrl={getMediaUrl}
                  />
                )}

                {/* Feed Metrics / Engagement Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span
                      style={{ cursor: 'pointer' }}
                      title={post.likedByUserNames && post.likedByUserNames.length > 0 ? `Liked by: ${post.likedByUserNames.join(', ')}` : 'No likes yet'}
                    >
                      👍 {post.numLikes} {post.numLikes === 1 ? 'like' : 'likes'}
                    </span>
                    <span>•</span>
                    <span>💬 {post.numComments} {post.numComments === 1 ? 'comment' : 'comments'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>👁️ {post.numViews} {post.numViews === 1 ? 'view' : 'views'}</span>
                    <span>•</span>
                    <span>📤 {post.numShares} {post.numShares === 1 ? 'share' : 'shares'}</span>
                  </div>
                </div>

                {/* Users who liked the post */}
                {post.likedByUserNames && post.likedByUserNames.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0 0.75rem 0.25rem', marginTop: '-0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Liked by: </span>
                    <span style={{ color: 'var(--text-primary)' }}>{post.likedByUserNames.join(', ')}</span>
                  </div>
                )}

                {/* Engagement Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <button
                    onClick={() => handleLike(post.id)}
                    style={{ background: 'none', border: 'none', color: post.likedByCurrentUser ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: post.likedByCurrentUser ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={post.likedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Like
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    style={{ background: 'none', border: 'none', color: expandedComments[post.id] ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Comment
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share
                  </button>

                  <button
                    onClick={() => handleSave(post.id)}
                    style={{ background: 'none', border: 'none', color: post.savedByCurrentUser ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: post.savedByCurrentUser ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={post.savedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {post.savedByCurrentUser ? 'Saved' : 'Save'}
                  </button>

                  <button
                    onClick={() => handleReportClick(post.id, post.reportedByCurrentUser)}
                    style={{ background: 'none', border: 'none', color: post.reportedByCurrentUser ? 'var(--error)' : 'var(--text-secondary)', fontWeight: post.reportedByCurrentUser ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={post.reportedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                      <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    {post.reportedByCurrentUser ? 'Reported' : 'Report'}
                  </button>
                </div>

                {/* Expanded Comments Drawer */}
                {expandedComments[post.id] && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>

                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {post.comments.map((comment) => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={post.id}
                            user={user}
                            editingCommentId={editingCommentId}
                            editingComments={editingComments}
                            setEditingCommentId={setEditingCommentId}
                            setEditingComments={setEditingComments}
                            handleSaveEditComment={handleSaveEditComment}
                            handleDeleteComment={handleDeleteComment}
                            handleLikeComment={handleLikeComment}
                            replyingCommentId={replyingCommentId}
                            setReplyingCommentId={setReplyingCommentId}
                            replyInputs={replyInputs}
                            setReplyInputs={setReplyInputs}
                            handleAddReply={handleAddReply}
                            formatTime={formatTime}
                            onUserClick={handleUserClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>No comments yet. Start the conversation!</p>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, post.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ margin: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentTextChange(post.id, e.target.value)}
                      />

                      {/* Emoji Trigger */}
                      <button
                        type="button"
                        onClick={() => setActiveEmojiPostId(activeEmojiPostId === post.id ? null : post.id)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
                      >
                        😀
                      </button>

                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: 'auto', margin: 0, fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderRadius: '8px' }}
                      >
                        Comment
                      </button>
                    </form>

                    {activeEmojiPostId === post.id && (
                      <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {['😀', '😂', '❤️', '👍', '🎉', '🔥', '👏', '😮', '😢'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              const currentText = commentInputs[post.id] || '';
                              setCommentInputs(prev => ({ ...prev, [post.id]: currentText + emoji }));
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="feed-sidebar-right">
        {/* Suggested Connections */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{suggestedTitle}</h3>
          {loadingSuggestions ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading suggestions...</p>
          ) : suggestedConnections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {suggestedConnections.map((item) => {
                const prof = item.profile;
                const displayName = prof.accountType === 'Individual'
                  ? `${prof.firstName || ''} ${prof.lastName || ''}`.trim() || prof.email
                  : prof.organizationName || prof.email;
                const locationParts = [prof.city, prof.state, prof.country].filter(Boolean);
                const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Registered Member';
                const avatarUrl = prof.profilePicture ? getMediaUrl(prof.profilePicture) : '';
                const isConnecting = connectingUserId === prof.id;

                return (
                  <div key={prof.id} className="widget-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          onClick={() => handleUserClick(prof.email)}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          onClick={() => handleUserClick(prof.email)}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="widget-info" style={{ overflow: 'hidden' }}>
                        <span
                          className="widget-title"
                          onClick={() => handleUserClick(prof.email)}
                          style={{ cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                          {displayName}
                        </span>
                        <span className="widget-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {prof.accountType} • {locationStr}
                        </span>
                      </div>
                    </div>

                    {item.relationshipStatus === 'NONE' && (
                      <button
                        className="nav-btn"
                        disabled={isConnecting}
                        onClick={() => handleConnect(prof.id)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', margin: 0, flexShrink: 0 }}
                      >
                        {isConnecting ? '...' : 'Connect'}
                      </button>
                    )}
                    {item.relationshipStatus === 'PENDING_SENT' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        Pending
                      </span>
                    )}
                    {item.relationshipStatus === 'PENDING_RECEIVED' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        Request Received
                      </span>
                    )}
                    {item.relationshipStatus === 'ACCEPTED' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success, #10b981)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        Connected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No suggested connections available.</p>
          )}
        </div>

        {/* Community Stats */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Platform Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Registered Firms:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>1,240</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Partnerships:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>3,420</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Global Reach:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>11 Countries</strong>
            </div>
          </div>
        </div>
      </aside>
      {/* Report Modal */}
      {reportingPostId && (
        <div className="modal-overlay" onClick={() => setReportingPostId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button className="close-btn" onClick={() => setReportingPostId(null)} style={{ top: '1.25rem', right: '1.25rem' }}>&times;</button>
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Report Post</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Help us understand what's wrong with this post.</p>
            <form onSubmit={handleReportSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="report-reason">Reason</label>
                <select
                  id="report-reason"
                  className="form-input"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', appearance: 'auto', padding: '0.75rem' }}
                >
                  <option value="SPAM">Spam</option>
                  <option value="INAPPROPRIATE">Inappropriate Content</option>
                  <option value="HARASSMENT">Harassment or Abuse</option>
                  <option value="INTELLECTUAL_PROPERTY">Intellectual Property Violation</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="report-comments">Details (Optional)</label>
                <textarea
                  id="report-comments"
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}
                  placeholder="Provide additional details to help us review..."
                  value={reportComments}
                  onChange={(e) => setReportComments(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ margin: 0, padding: '0.75rem' }}
                  onClick={() => setReportingPostId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ margin: 0, padding: '0.75rem', background: 'var(--error)' }}
                  disabled={submittingReport}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button className="close-btn" onClick={() => setEditingPost(null)} style={{ top: '1.25rem', right: '1.25rem' }}>&times;</button>
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Edit Post</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Update your post content and attachments.</p>

            <form onSubmit={handleSavePostEdit}>
              {/* Textarea Description */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="edit-post-desc">Description</label>
                <textarea
                  id="edit-post-desc"
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}
                  placeholder="What's on your mind?"
                  value={editingPost.postDescription}
                  onChange={(e) => setEditingPost({ ...editingPost, postDescription: e.target.value })}
                  required
                />
              </div>

              {/* Visibility Selector */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="edit-post-visibility">Visibility</label>
                <select
                  id="edit-post-visibility"
                  className="form-input"
                  value={editingPost.visibility}
                  onChange={(e) => setEditingPost({ ...editingPost, visibility: e.target.value })}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', appearance: 'auto', padding: '0.75rem' }}
                >
                  <option value="PUBLIC">🌍 Public</option>
                  <option value="CONNECTIONS">👥 Connections</option>
                  <option value="ONLY_ME">🔒 Only Me</option>
                </select>
              </div>

              {/* Current Attachments List */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Current Media & Documents</label>

                {editingPost.attachedMedia.length === 0 && editingPost.newFiles.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>No attachments yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {/* Existing Attachments */}
                    {editingPost.attachedMedia.map((url, idx) => {
                      const ext = url.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                      const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);
                      const displayUrl = getMediaUrl(url);

                      return (
                        <div key={`existing-${idx}`} style={{ position: 'relative', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden', height: '110px' }}>
                          {isImage ? (
                            <img src={displayUrl} alt="existing img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : isVideo ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontSize: '0.75rem' }}>
                              🎥 Video
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', textAlign: 'center' }}>
                              <span>📄 Doc</span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{url.substring(url.lastIndexOf('/') + 1)}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingMedia(idx)}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                            title="Remove attachment"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}

                    {/* New Chosen Files */}
                    {editingPost.newFiles.map((file, idx) => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                      const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);
                      const previewUrl = URL.createObjectURL(file);

                      return (
                        <div key={`new-${idx}`} style={{ position: 'relative', borderRadius: '8px', border: '1px solid var(--accent-primary)', background: 'var(--bg-secondary)', overflow: 'hidden', height: '110px' }}>
                          {isImage ? (
                            <img src={previewUrl} alt="new img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : isVideo ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontSize: '0.75rem' }}>
                              🎥 New Video
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', textAlign: 'center' }}>
                              <span>📄 New Doc</span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{file.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                            title="Remove file"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Media Button */}
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditFileChange}
                  multiple
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.webm,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => editFileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Attach Media/Docs
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ margin: 0, padding: '0.75rem' }}
                  onClick={() => setEditingPost(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ margin: 0, padding: '0.75rem' }}
                  disabled={savingEditPost}
                >
                  {savingEditPost ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;

