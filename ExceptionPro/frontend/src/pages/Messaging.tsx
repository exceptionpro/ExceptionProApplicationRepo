import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeftNavigation from '../components/LeftNavigation';

export interface ConversationSummary {
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerAccountType?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface DirectMessageItem {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverEmail: string;
  receiverName: string;
  receiverAvatar?: string;
  messageText: string;
  createdAt: string;
  read: boolean;
}

export interface SelectedPartner {
  email: string;
  name: string;
  avatar?: string;
  accountType?: string;
  id?: string;
}

const POPULAR_GIFS = [
  { title: 'Thumbs Up 👍', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { title: 'Deal / Handshake 🤝', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { title: 'Applause 👏', url: 'https://media.giphy.com/media/l3q2XhfQ8C6yCjac8/giphy.gif' },
  { title: 'High Five 🙌', url: 'https://media.giphy.com/media/26tknCqiYwe7XMJwI/giphy.gif' },
  { title: 'Cheers 🎉', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { title: 'Great Job 💯', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { title: 'Thank You 🙏', url: 'https://media.giphy.com/media/d31w24psGYeekCXY/giphy.gif' },
  { title: 'Mind Blown 🤯', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { title: 'Welcome 👋', url: 'https://media.giphy.com/media/l0FF56CEyyeEB7wMg/giphy.gif' },
  { title: 'Rocket Success 🚀', url: 'https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif' },
  { title: 'Agreement ✅', url: 'https://media.giphy.com/media/13G7rg64OGEh3CY1T3/giphy.gif' },
  { title: 'Looking Forward 💼', url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif' }
];

const EMOJI_CATEGORIES = [
  {
    name: 'Reactions',
    emojis: ['😀', '😂', '😍', '😎', '🥳', '😮', '😢', '😡', '🤔', '👍', '👎', '👏', '🙌', '🤝', '🙏']
  },
  {
    name: 'Business',
    emojis: ['💼', '📊', '📈', '📝', '📌', '💡', '🚀', '⭐', '💯', '✅', '❌', '🔒', '🌐', '📦', '💰']
  },
  {
    name: 'Symbols',
    emojis: ['🎉', '🔥', '❤️', '💙', '✨', '⚡', '🏆', '🎯', '⏳', '📞', '📧', '💬', '🔔', '🏷️', '⚙️']
  }
];

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // Keyboard Popovers
  const [showGifKeyboard, setShowGifKeyboard] = useState(false);
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [gifSearch, setGifSearch] = useState('');

  // Hidden File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getMediaUrl = (url?: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/messages/conversations');
      const data: ConversationSummary[] = res.data || [];
      setConversations(data);

      // Auto-select first conversation if none selected
      if (!selectedPartner && data.length > 0) {
        const first = data[0];
        setSelectedPartner({
          email: first.partnerEmail,
          name: first.partnerName,
          avatar: first.partnerAvatar,
          accountType: first.partnerAccountType,
          id: first.partnerId
        });
        fetchThread(first.partnerEmail);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchThread = async (partnerEmailOrId: string) => {
    if (!user || !partnerEmailOrId) return;
    try {
      const res = await api.get(`/api/messages/conversation?email=${encodeURIComponent(partnerEmailOrId)}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error fetching conversation thread:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const interval = setInterval(() => {
      fetchConversations();
      if (selectedPartner) {
        fetchThread(selectedPartner.email);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user, selectedPartner?.email]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedPartner({
      email: conv.partnerEmail,
      name: conv.partnerName,
      avatar: conv.partnerAvatar,
      accountType: conv.partnerAccountType,
      id: conv.partnerId
    });
    fetchThread(conv.partnerEmail);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !messageInput.trim() || sending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      await api.post('/api/messages/send', {
        receiverEmail: selectedPartner.email,
        messageText: textToSend
      });
      fetchThread(selectedPartner.email);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPartner || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setSending(true);
    try {
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.fileUrl;
      await api.post('/api/messages/send', {
        receiverEmail: selectedPartner.email,
        messageText: `📷 [image](${fileUrl})`
      });
      fetchThread(selectedPartner.email);
      fetchConversations();
    } catch (err) {
      console.error('Failed to attach image:', err);
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPartner || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setSending(true);
    try {
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.fileUrl;
      await api.post('/api/messages/send', {
        receiverEmail: selectedPartner.email,
        messageText: `📎 [file: ${file.name}](${fileUrl})`
      });
      fetchThread(selectedPartner.email);
      fetchConversations();
    } catch (err) {
      console.error('Failed to attach file:', err);
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleSelectGif = async (gifUrl: string) => {
    if (!selectedPartner) return;
    setShowGifKeyboard(false);
    setSending(true);
    try {
      await api.post('/api/messages/send', {
        receiverEmail: selectedPartner.email,
        messageText: `GIF: ${gifUrl}`
      });
      fetchThread(selectedPartner.email);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send GIF:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith('📷 [image](') && text.endsWith(')')) {
      const url = text.substring(11, text.length - 1);
      return (
        <div>
          <img
            src={getMediaUrl(url)}
            alt="attached"
            style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
          />
        </div>
      );
    }

    if (text.startsWith('GIF: ')) {
      const gifUrl = text.substring(5).trim();
      return (
        <div>
          <img
            src={gifUrl}
            alt="GIF"
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
          />
        </div>
      );
    }

    if (text.startsWith('📎 [file: ') && text.includes('](') && text.endsWith(')')) {
      const fileName = text.substring(10, text.indexOf(']('));
      const fileUrl = text.substring(text.indexOf('](') + 2, text.length - 1);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
          <span>📄</span>
          <a
            href={getMediaUrl(fileUrl)}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 500 }}
          >
            {fileName}
          </a>
        </div>
      );
    }

    return text;
  };

  // Filter conversations in real time based on search input
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      c.partnerName.toLowerCase().includes(query) ||
      c.partnerEmail.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="main-layout" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <LeftNavigation activePage="home" />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        {/* Page Header */}
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem' }}>Messaging & Chats</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Connect and communicate directly with your business partners and suppliers.
            </p>
          </div>
        </div>

        {/* Messaging Layout Container */}
        <div className="glass-card messaging-page-container" style={{ display: 'flex', height: '680px', padding: 0, overflow: 'hidden' }}>
          {/* Left Panel: Search Bar & Conversations List */}
          <div className="messaging-page-sidebar" style={{ width: '340px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            {/* Search Box */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search messages by name, email or content..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const avatarUrl = getMediaUrl(conv.partnerAvatar);
                  const isSelected = selectedPartner?.email === conv.partnerEmail;

                  return (
                    <div
                      key={conv.partnerId || conv.partnerEmail}
                      className={`messaging-conversation-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={conv.partnerName}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {(conv.partnerName || conv.partnerEmail).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: conv.unreadCount > 0 ? 700 : 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.partnerName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unreadCount > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
                            {conv.lastMessage}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="messaging-item-unread-badge">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem', fontSize: '0.85rem' }}>
                  {searchFilter.trim() ? 'No messages match your search filter.' : 'No active conversations found.'}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Thread */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
            {selectedPartner ? (
              <>
                {/* Thread Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--glass-bg)' }}>
                  {selectedPartner.avatar ? (
                    <img
                      src={getMediaUrl(selectedPartner.avatar)}
                      alt={selectedPartner.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(selectedPartner.name || selectedPartner.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedPartner.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedPartner.email}</span>
                  </div>
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,*/*"
                  style={{ display: 'none' }}
                  onChange={handleDocumentFileChange}
                />

                {/* Messages List */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                  {messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMine = msg.senderEmail.toLowerCase() === user?.email.toLowerCase();
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMine ? 'flex-end' : 'flex-start',
                            marginBottom: '1rem'
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '75%',
                              padding: '0.65rem 1rem',
                              borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                              background: isMine ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-tertiary, #f1f5f9)',
                              color: isMine ? '#ffffff' : 'var(--text-primary, #0f172a)',
                              fontSize: '0.9rem',
                              lineHeight: '1.45',
                              wordBreak: 'break-word',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            {renderMessageContent(msg.messageText)}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem', fontSize: '0.9rem' }}>
                      No messages yet.<br />Send a message to start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Toolbar & Form */}
                <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--glass-bg)', position: 'relative' }}>
                  {/* GIF Popover */}
                  {showGifKeyboard && (
                    <div className="messaging-keyboard-popover" style={{ bottom: '80px', left: '1.5rem' }}>
                      <div className="messaging-keyboard-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>🎬 GIF Keyboard</span>
                          <button type="button" onClick={() => setShowGifKeyboard(false)} className="messaging-close-btn">✕</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Search GIF samples..."
                          value={gifSearch}
                          onChange={(e) => setGifSearch(e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.78rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                      <div className="messaging-gif-grid">
                        {POPULAR_GIFS.filter(g => !gifSearch.trim() || g.title.toLowerCase().includes(gifSearch.toLowerCase())).map((gif) => (
                          <div key={gif.title} className="messaging-gif-item" onClick={() => handleSelectGif(gif.url)} title={`Click to send "${gif.title}"`}>
                            <img src={gif.url} alt={gif.title} />
                            <span className="messaging-gif-title">{gif.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emoji Popover */}
                  {showEmojiKeyboard && (
                    <div className="messaging-keyboard-popover" style={{ bottom: '80px', left: '1.5rem' }}>
                      <div className="messaging-keyboard-header">
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                          {EMOJI_CATEGORIES.map((cat, idx) => (
                            <span
                              key={cat.name}
                              onClick={() => setActiveEmojiTab(idx)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: activeEmojiTab === idx ? 700 : 400,
                                color: activeEmojiTab === idx ? 'var(--accent-primary)' : 'var(--text-muted)',
                                borderBottom: activeEmojiTab === idx ? '2px solid var(--accent-primary)' : 'none',
                                paddingBottom: '2px'
                              }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                        <button type="button" onClick={() => setShowEmojiKeyboard(false)} className="messaging-close-btn">✕</button>
                      </div>
                      <div className="messaging-emoji-grid">
                        {EMOJI_CATEGORIES[activeEmojiTab].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="messaging-emoji-item"
                            onClick={() => setMessageInput((prev) => prev + emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Write a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />

                    {/* Toolbar Action Icons */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="messaging-toolbar-btn"
                        title="Attach Image"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="messaging-toolbar-btn"
                        title="Attach Document/File"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="messaging-toolbar-btn messaging-gif-badge-btn"
                        title="GIF Keyboard"
                        onClick={() => {
                          setShowGifKeyboard(!showGifKeyboard);
                          setShowEmojiKeyboard(false);
                        }}
                      >
                        GIF
                      </button>

                      <button
                        type="button"
                        className="messaging-toolbar-btn"
                        title="Emoji Picker"
                        onClick={() => {
                          setShowEmojiKeyboard(!showEmojiKeyboard);
                          setShowGifKeyboard(false);
                        }}
                      >
                        😀
                      </button>

                      <button
                        type="submit"
                        disabled={!messageInput.trim() || sending}
                        className="nav-btn"
                        style={{ padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.88rem' }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>💬</span>
                <p style={{ margin: 0 }}>Select a conversation from the left menu to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messaging;
