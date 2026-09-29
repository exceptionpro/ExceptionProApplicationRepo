import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const MessagingWidget: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
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

  const hasAutoOpened = useRef(false);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/messages/conversations');
      const data: ConversationSummary[] = res.data || [];
      setConversations(data);

      // Auto-open unread message thread for recipient upon login
      if (!hasAutoOpened.current && data.length > 0) {
        const unread = data.find((c) => c.unreadCount > 0);
        if (unread) {
          hasAutoOpened.current = true;
          setIsCollapsed(false);
          setSelectedPartner({
            email: unread.partnerEmail,
            name: unread.partnerName,
            avatar: unread.partnerAvatar,
            accountType: unread.partnerAccountType,
            id: unread.partnerId
          });
          fetchThread(unread.partnerEmail);
        }
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

  // Listen to openChatWithUser event from profile or other components
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      const detail = event.detail;
      if (detail && detail.email) {
        setSelectedPartner({
          email: detail.email,
          name: detail.name || detail.email,
          avatar: detail.avatar || '',
          accountType: detail.accountType || '',
          id: detail.id || ''
        });
        setIsCollapsed(false);
        fetchThread(detail.email);
        fetchConversations();
      }
    };

    window.addEventListener('openChatWithUser', handleOpenChat);
    return () => window.removeEventListener('openChatWithUser', handleOpenChat);
  }, []);

  // Poll for messages every 4 seconds when user is logged in
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

  // Scroll to bottom when messages update
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

  if (!user) return null;

  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // State for GIF and Emoji Keyboards
  const [showGifKeyboard, setShowGifKeyboard] = useState(false);
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [gifSearch, setGifSearch] = useState('');

  // Hidden File Input Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const renderMessageContent = (text: string) => {
    if (text.startsWith('📷 [image](') && text.endsWith(')')) {
      const url = text.substring(11, text.length - 1);
      return (
        <div>
          <img
            src={getMediaUrl(url)}
            alt="attached"
            style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
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
            style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
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

  return (
    <div className="messaging-widget-container" id="messaging-widget" data-testid="messaging-widget">
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

      {/* Widget Header (LinkedIn style) */}
      <div
        className="messaging-widget-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Messaging</span>
          {totalUnread > 0 && (
            <span className="messaging-unread-badge">{totalUnread}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="messaging-toggle-btn"
            title={isCollapsed ? 'Expand Messaging' : 'Collapse Messaging'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded Widget Body */}
      {!isCollapsed && (
        <div className="messaging-widget-body">
          {selectedPartner ? (
            /* Active Thread View */
            <div className="messaging-thread-view">
              {/* Thread Header */}
              <div className="messaging-thread-header">
                <button
                  type="button"
                  className="messaging-back-btn"
                  onClick={() => setSelectedPartner(null)}
                  title="Back to conversations list"
                >
                  ←
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                  {selectedPartner.avatar ? (
                    <img
                      src={getMediaUrl(selectedPartner.avatar)}
                      alt={selectedPartner.name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(selectedPartner.name || selectedPartner.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                      {selectedPartner.name}
                    </div>
                    {selectedPartner.accountType && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedPartner.accountType}</div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="messaging-close-btn"
                  onClick={() => setSelectedPartner(null)}
                  title="Close active chat"
                >
                  ✕
                </button>
              </div>

              {/* Message List (Last 90 days) */}
              <div className="messaging-thread-messages">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.senderEmail.toLowerCase() === user.email.toLowerCase();
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                          marginBottom: '0.65rem'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '82%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: isMine ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-tertiary, #f1f5f9)',
                            color: isMine ? '#ffffff' : 'var(--text-primary, #0f172a)',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {renderMessageContent(msg.messageText)}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem', fontSize: '0.85rem' }}>
                    No messages yet in the last 90 days.<br />Say hello to start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form & LinkedIn Style Toolbar */}
              <form onSubmit={handleSendMessage} className="messaging-thread-input-container">
                {/* GIF Keyboard Popover */}
                {showGifKeyboard && (
                  <div className="messaging-keyboard-popover">
                    <div className="messaging-keyboard-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>🎬 GIF Keyboard (Select Sample)</span>
                        <button type="button" onClick={() => setShowGifKeyboard(false)} className="messaging-close-btn">✕</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search GIF samples (e.g. thumbs, deal, applause, thanks)..."
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

                {/* Emoji Keyboard Popover */}
                {showEmojiKeyboard && (
                  <div className="messaging-keyboard-popover">
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
                          title={`Click to add ${emoji} to message`}
                          onClick={() => {
                            setMessageInput((prev) => prev + emoji);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Write a message..."
                  className="messaging-thread-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />

                {/* Toolbar options: Attach Image, Attach File, GIF Keyboard, Emoji Keyboard */}
                <div className="messaging-toolbar">
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {/* a) Attach Image Icon */}
                    <button
                      type="button"
                      className="messaging-toolbar-btn"
                      title={`Attach an Image to User Conversion with ${selectedPartner.name}`}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </button>

                    {/* b) Attach File Icon */}
                    <button
                      type="button"
                      className="messaging-toolbar-btn"
                      title={`Attach a File to your Conversion with ${selectedPartner.name}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    {/* c) GIF Icon */}
                    <button
                      type="button"
                      className="messaging-toolbar-btn messaging-gif-badge-btn"
                      title="Open GIF Keyboard"
                      onClick={() => {
                        setShowGifKeyboard(!showGifKeyboard);
                        setShowEmojiKeyboard(false);
                      }}
                    >
                      GIF
                    </button>

                    {/* d) Emoji Icon */}
                    <button
                      type="button"
                      className="messaging-toolbar-btn"
                      title="Open Emoji Keyboard"
                      onClick={() => {
                        setShowEmojiKeyboard(!showEmojiKeyboard);
                        setShowGifKeyboard(false);
                      }}
                    >
                      😀
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="messaging-send-btn"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Conversations List View */
            <div className="messaging-conversations-list">
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  const avatarUrl = getMediaUrl(conv.partnerAvatar);
                  return (
                    <div
                      key={conv.partnerId || conv.partnerEmail}
                      className="messaging-conversation-item"
                      onClick={() => handleSelectConversation(conv)}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={conv.partnerName}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {(conv.partnerName || conv.partnerEmail).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: conv.unreadCount > 0 ? 700 : 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.partnerName}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.78rem', color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unreadCount > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
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
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>
                  No active conversations in the last 90 days.<br />Visit any profile and click <strong>Message</strong> to start chatting!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingWidget;
