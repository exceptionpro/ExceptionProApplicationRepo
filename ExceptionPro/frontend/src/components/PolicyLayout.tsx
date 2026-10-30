import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LegalDocument } from '../data/legalDocuments';

interface PolicyLayoutProps {
  document: LegalDocument;
}

const POLICY_LINKS = [
  { path: '/terms-and-conditions', label: 'Terms and Conditions' },
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/code-of-conduct', label: 'Code of Conduct' },
  { path: '/disclaimer', label: 'Disclaimer' }
];

const PolicyLayout: React.FC<PolicyLayoutProps> = ({ document }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="policy-page-wrapper">
      <div className="policy-container">
        {/* Navigation Breadcrumb & Quick Actions */}
        <div className="policy-top-bar">
          <button
            type="button"
            className="policy-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>

          <div className="policy-actions">
            <button
              type="button"
              className="policy-action-btn"
              onClick={handlePrint}
              title="Print or Save as PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print Document</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher for all 4 Legal Documents */}
        <nav className="policy-nav-tabs" aria-label="Legal document tabs">
          {POLICY_LINKS.map((link) => {
            const isActive = location.pathname === link.path ||
              (link.path === '/terms-and-conditions' && location.pathname === '/terms') ||
              (link.path === '/privacy-policy' && location.pathname === '/privacy');
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`policy-nav-tab ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Document Card */}
        <article className="policy-card" id={`policy-${document.id}`}>
          {/* Header Banner */}
          <header className="policy-header">
            <div className="policy-badge">{document.badge}</div>
            <h1 className="policy-title">{document.title}</h1>
            <div className="policy-meta">
              <span className="policy-meta-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Effective / Last Updated: {document.lastUpdated}
              </span>
              <span className="policy-meta-dot">•</span>
              <span className="policy-meta-item">ExceptionPro Platform</span>
            </div>
          </header>

          <hr className="policy-divider" />

          {/* Table of Contents Quick Links */}
          {document.sections.length > 0 && (
            <div className="policy-toc">
              <div className="policy-toc-title">Table of Contents</div>
              <div className="policy-toc-grid">
                {document.sections.map((sec, idx) => (
                  <a
                    key={idx}
                    href={`#section-${sec.number || idx}`}
                    className="policy-toc-link"
                  >
                    <span className="toc-num">{sec.number ? `${sec.number}.` : ''}</span>
                    <span className="toc-title">{sec.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Document Content */}
          <div className="policy-body">
            {/* Introductory Text */}
            {document.intro.length > 0 && (
              <div className="policy-intro">
                {document.intro.map((p, idx) => (
                  <p key={idx} className="policy-paragraph policy-intro-p">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Document Sections */}
            {document.sections.map((section, idx) => {
              const secId = `section-${section.number || idx}`;
              return (
                <section key={idx} id={secId} className="policy-section">
                  <h2 className="policy-section-heading">
                    {section.number && <span className="section-number">{section.number}. </span>}
                    {section.title}
                  </h2>
                  <div className="policy-section-content">
                    {section.content.map((paragraph, pIdx) => {
                      const isBullet = paragraph.startsWith('•') || paragraph.startsWith('-');
                      if (isBullet) {
                        return (
                          <div key={pIdx} className="policy-bullet-item">
                            <span className="policy-bullet-icon">•</span>
                            <span className="policy-bullet-text">{paragraph.replace(/^[•-]\s*/, '')}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={pIdx} className="policy-paragraph">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Official Contact Info Box */}
            {document.contactInfo && (
              <div className="policy-contact-box">
                <h3 className="policy-contact-title">Contact & Organization Details</h3>
                <div className="policy-contact-grid">
                  {document.contactInfo.entity && (
                    <div className="contact-row">
                      <span className="contact-label">Entity Name:</span>
                      <span className="contact-value">{document.contactInfo.entity}</span>
                    </div>
                  )}
                  {document.contactInfo.email && (
                    <div className="contact-row">
                      <span className="contact-label">Support Email:</span>
                      <a href={`mailto:${document.contactInfo.email}`} className="contact-link">
                        {document.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {document.contactInfo.address && (
                    <div className="contact-row">
                      <span className="contact-label">Address:</span>
                      <span className="contact-value">{document.contactInfo.address}</span>
                    </div>
                  )}
                  {document.contactInfo.website && (
                    <div className="contact-row">
                      <span className="contact-label">Website:</span>
                      <span className="contact-value">{document.contactInfo.website}</span>
                    </div>
                  )}
                </div>

                {document.contactInfo.notice && (
                  <div className="policy-notice-box">
                    <p className="policy-notice-text">{document.contactInfo.notice}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default PolicyLayout;
