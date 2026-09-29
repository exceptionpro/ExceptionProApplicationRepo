import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CommentItem, PostAttachments } from './SocialFeed';
import type { PostData } from './SocialFeed';
import api from '../services/api';
import LeftNavigation from '../components/LeftNavigation';

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'China', 'Singapore', 'United Arab Emirates'
];

interface ProfileData {
  id: string;
  email: string;
  accountType: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  organizationName?: string;
  legalName?: string;
  streetAddress?: string;
  city?: string;
  pincode?: string;
  state?: string;
  country?: string;
  coverPhoto?: string;
  profilePicture?: string;
  about?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [about, setAbout] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Edit form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  const [organizationName, setOrganizationName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  // Password Manager states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Post Feed States
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);

  // Edit/Comments States matching SocialFeed
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingComments, setEditingComments] = useState<{ [commentId: string]: string }>({});
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [activeEmojiPostId, setActiveEmojiPostId] = useState<string | null>(null);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

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

  // Post Creation States
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [visibility, setVisibility] = useState('PUBLIC');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business Partner Feature States
  const [activeTab, setActiveTab] = useState<'profile' | 'partners'>(() => {
    if (location.state && (location.state as any).activeTab) {
      return (location.state as any).activeTab;
    }
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'partners') {
      return 'partners';
    }
    return 'profile';
  });
  const [partnerTab, setPartnerTab] = useState<'search' | 'my-partners' | 'incoming' | 'outgoing'>('search');
  const [recommendationTitle, setRecommendationTitle] = useState('People you may know');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerSuccess, setPartnerSuccess] = useState<string | null>(null);

  const [myPartners, setMyPartners] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [isOtherProfile, setIsOtherProfile] = useState(false);
  const [otherUserRelationship, setOtherUserRelationship] = useState<string | null>(null);
  const [otherUserRequestId, setOtherUserRequestId] = useState<string | null>(null);

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
        setPostError(errorMessage);
      } else {
        setPostError(null);
      }

      setSelectedFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 10) {
          setPostError('Maximum of 10 attachments are allowed per post.');
          return combined.slice(0, 10);
        }
        return combined;
      });

      e.target.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && selectedFiles.length === 0) {
      setPostError('Please add some text or attach media.');
      return;
    }

    setPublishing(true);
    setPostError(null);
    setPublishSuccess(null);

    try {
      const attachedMedia: string[] = [];
      const mediaThumbnails: string[] = [];

      for (const file of selectedFiles) {
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

      await api.post('/api/posts', {
        postDescription: description,
        attachedMedia,
        mediaThumbnails,
        visibility
      });

      setDescription('');
      setSelectedFiles([]);
      setPublishSuccess('Post published successfully!');
      setTimeout(() => setPublishSuccess(null), 3000);
      fetchPosts();
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setPostError(backendMessage || 'Failed to publish post. Please try again.');
    } finally {
      setPublishing(false);
    }
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

  const generateVideoThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      const cleanup = () => { URL.revokeObjectURL(url); };
      video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration || 1); };
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => { cleanup(); resolve(blob); }, 'image/jpeg', 0.85);
          } else { cleanup(); resolve(null); }
        } catch (e) { cleanup(); resolve(null); }
      };
      video.onerror = () => { cleanup(); resolve(null); };
    });
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
        setPostError(errorMessage);
      } else {
        setPostError(null);
      }

      setEditingPost(prev => {
        if (!prev) return null;
        const combined = [...prev.newFiles, ...validFiles];
        if (prev.attachedMedia.length + combined.length > 10) {
          setPostError('Maximum of 10 attachments are allowed per post.');
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
      setPostError('Please add some text or attach media.');
      return;
    }

    setSavingEditPost(true);
    setPostError(null);

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
      fetchPosts();
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setPostError(backendMessage || 'Failed to update post. Please try again.');
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
              numLikes: liked ? p.numLikes + 1 : Math.max(0, p.numLikes - 1),
            };
          }
          return p;
        })
      );

      await api.post(`/api/posts/${postId}/like`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to toggle like', err);
      fetchPosts();
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await api.post(`/api/posts/${postId}/share`);
      const shareUrl = `${window.location.origin}/feed#post-${postId}`;
      navigator.clipboard.writeText(shareUrl);

      setShareNotification('Share link copied to clipboard!');
      setTimeout(() => setShareNotification(null), 3000);

      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, numShares: p.numShares + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to record share', err);
    }
  };

  const handleSavePost = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/save`);
      const isSaved = response.data.saved;
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, savedByCurrentUser: isSaved } : p
        )
      );
      setShareNotification(isSaved ? 'Post saved successfully!' : 'Post removed from saved list.');
      setTimeout(() => setShareNotification(null), 3000);
    } catch (err) {
      console.error('Failed to toggle save post', err);
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
        handleView(postId);
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
      fetchPosts();
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
      fetchPosts();
    } catch (err) {
      console.error('Failed to add reply', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post(`/api/posts/comments/${commentId}/like`);
      fetchPosts();
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
      fetchPosts();
    } catch (err) {
      console.error('Failed to edit comment', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/posts/comments/${commentId}`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete comment', err);
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

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts');
      const allPosts: PostData[] = response.data;
      // Filter strictly by current user email or name matching
      const userPosts = allPosts.filter(p => p.userEmail === user?.email || p.userName.toLowerCase() === user?.email?.toLowerCase() || p.userId === user?.email);
      // Sort reverse-chronologically (newest first)
      userPosts.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      setPosts(userPosts);
      setPostsLoading(false);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
      setPostsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/me');
      const data = response.data;
      setProfile(data);
      setIsOtherProfile(false);
      initializeForm(data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to fetch user profile details.');
      setLoading(false);
    }
  };

  const fetchOtherUserProfile = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/users/profile?email=${encodeURIComponent(email)}`);
      const data = response.data;
      setProfile(data.profile);
      setIsOtherProfile(true);
      setOtherUserRelationship(data.relationshipStatus);
      setOtherUserRequestId(data.requestId);
      initializeForm(data.profile);
      setLoading(false);
      fetchOtherUserPosts(email);
    } catch (err: any) {
      setError('Failed to fetch user profile details.');
      setLoading(false);
    }
  };

  const fetchOtherUserPosts = async (email: string) => {
    try {
      const response = await api.get('/api/posts');
      const allPosts: PostData[] = response.data;
      const userPosts = allPosts.filter(p => p.userEmail === email || p.userName.toLowerCase() === email.toLowerCase() || p.userId === email);
      userPosts.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      setPosts(userPosts);
      setPostsLoading(false);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
      setPostsLoading(false);
    }
  };

  const handleSendRequestFromProfile = async (receiverId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.post('/api/partners/request', { receiverId });
      setPartnerSuccess('Business Partner Request sent successfully!');
      if (profile && profile.email) {
        fetchOtherUserProfile(profile.email);
      }
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleAcceptRequestFromProfile = async (requestId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.put(`/api/partners/requests/${requestId}/accept`);
      setPartnerSuccess('Request accepted! You are now partners.');
      if (profile && profile.email) {
        fetchOtherUserProfile(profile.email);
      }
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  const handleDeclineRequestFromProfile = async (requestId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.put(`/api/partners/requests/${requestId}/decline`);
      setPartnerSuccess('Request declined.');
      if (profile && profile.email) {
        fetchOtherUserProfile(profile.email);
      }
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to decline request.');
    }
  };

  const handleCancelOrRemoveFromProfile = async (requestId: string, actionMsg: string) => {
    if (!window.confirm(`Are you sure you want to ${actionMsg}?`)) return;
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.delete(`/api/partners/requests/${requestId}`);
      setPartnerSuccess(`Partnership/Request removed successfully.`);
      if (profile && profile.email) {
        fetchOtherUserProfile(profile.email);
      }
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to remove partnership/request.');
    }
  };

  const initializeForm = (data: ProfileData) => {
    setCoverPhoto(data.coverPhoto || '');
    setProfilePicture(data.profilePicture || '');
    setAbout(data.about || '');
    if (data.accountType === 'Individual') {
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setDob(data.dob || '');
      setGender(data.gender || 'Male');
    } else {
      setOrganizationName(data.organizationName || '');
      setLegalName(data.legalName || '');
      setStreetAddress(data.streetAddress || '');
      setCity(data.city || '');
      setPincode(data.pincode || '');
      setState(data.state || '');
      setCountry(data.country || 'India');
    }
  };

  const fetchMyPartners = async () => {
    try {
      const res = await api.get('/api/partners');
      setMyPartners(res.data);
    } catch (err: any) {
      console.error('Failed to fetch partners', err);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const res = await api.get('/api/partners/requests/incoming');
      setIncomingRequests(res.data);
    } catch (err: any) {
      console.error('Failed to fetch incoming requests', err);
    }
  };

  const fetchOutgoingRequests = async () => {
    try {
      const res = await api.get('/api/partners/requests/outgoing');
      setOutgoingRequests(res.data);
    } catch (err: any) {
      console.error('Failed to fetch outgoing requests', err);
    }
  };

  const handleSearchUsers = async () => {
    setSearching(true);
    setPartnerError(null);
    try {
      const res = await api.get('/api/users/recommendations');
      setSearchResults(res.data.users || []);
      setRecommendationTitle(res.data.title || 'People you may know');
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to fetch recommendations.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.post('/api/partners/request', { receiverId });
      setPartnerSuccess('Business Partner Request sent successfully!');
      handleSearchUsers();
      fetchOutgoingRequests();
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.put(`/api/partners/requests/${requestId}/accept`);
      setPartnerSuccess('Request accepted! You are now partners.');
      fetchIncomingRequests();
      fetchMyPartners();
      handleSearchUsers();
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.put(`/api/partners/requests/${requestId}/decline`);
      setPartnerSuccess('Request declined.');
      fetchIncomingRequests();
      handleSearchUsers();
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to decline request.');
    }
  };

  const handleCancelOrRemove = async (requestId: string, actionMsg: string) => {
    if (!window.confirm(`Are you sure you want to ${actionMsg}?`)) return;
    setPartnerError(null);
    setPartnerSuccess(null);
    try {
      await api.delete(`/api/partners/requests/${requestId}`);
      setPartnerSuccess(`Partnership/Request removed successfully.`);
      fetchOutgoingRequests();
      fetchIncomingRequests();
      fetchMyPartners();
      handleSearchUsers();
      setTimeout(() => setPartnerSuccess(null), 3000);
    } catch (err: any) {
      setPartnerError(err.response?.data?.message || 'Failed to delete request.');
    }
  };

  useEffect(() => {
    fetchMyPartners();
    fetchIncomingRequests();
    fetchOutgoingRequests();
    handleSearchUsers();
  }, []);

  useEffect(() => {
    let nextTab: 'profile' | 'partners' = 'profile';
    if (location.state && (location.state as any).activeTab) {
      nextTab = (location.state as any).activeTab;
    } else {
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'partners') {
        nextTab = 'partners';
      }
    }
    setActiveTab(nextTab);

    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam && emailParam !== user?.email) {
      fetchOtherUserProfile(emailParam);
    } else {
      fetchProfile();
      fetchPosts();
    }
  }, [location, user]);

  const handleEditToggle = () => {
    if (isEditing && profile) {
      initializeForm(profile); // rollback values on cancel
    }
    setIsEditing(!isEditing);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload: any = {};

    if (profile?.accountType === 'Individual') {
      if (!firstName || !lastName || !dob || !gender) {
        setError('Please fill in all personal details.');
        return;
      }
      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.dob = dob;
      payload.gender = gender;
    } else {
      if (!organizationName || !legalName || !streetAddress || !city || !pincode || !state || !country) {
        setError('Please fill in all organization details.');
        return;
      }
      payload.organizationName = organizationName;
      payload.legalName = legalName;
      payload.streetAddress = streetAddress;
      payload.city = city;
      payload.pincode = pincode;
      payload.state = state;
      payload.country = country;
    }

    payload.coverPhoto = coverPhoto;
    payload.profilePicture = profilePicture;
    payload.about = about;

    try {
      await api.put('/api/users/me', payload);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      setError('Failed to update user profile. Check fields validations.');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      await api.put('/api/users/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to update password. Check current password.';
      setPasswordError(errMsg);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'profile') => {
    if (!profile) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      setError(null);
      setSuccess(null);
      try {
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const fileUrl = uploadRes.data.fileUrl;
        
        let updatedCover = coverPhoto;
        let updatedProfile = profilePicture;
        
        if (type === 'cover') {
          updatedCover = fileUrl;
          setCoverPhoto(fileUrl);
        } else {
          updatedProfile = fileUrl;
          setProfilePicture(fileUrl);
        }
        
        // Save immediately
        const payload: any = {};
        if (profile?.accountType === 'Individual') {
          payload.firstName = firstName || profile.firstName || '';
          payload.lastName = lastName || profile.lastName || '';
          payload.dob = dob || profile.dob || '';
          payload.gender = gender || profile.gender || 'Male';
        } else {
          payload.organizationName = organizationName || profile.organizationName || '';
          payload.legalName = legalName || profile.legalName || '';
          payload.streetAddress = streetAddress || profile.streetAddress || '';
          payload.city = city || profile.city || '';
          payload.pincode = pincode || profile.pincode || '';
          payload.state = state || profile.state || '';
          payload.country = country || profile.country || 'India';
        }
        payload.coverPhoto = updatedCover;
        payload.profilePicture = updatedProfile;
        
        await api.put('/api/users/me', payload);
        setSuccess(`${type === 'cover' ? 'Cover' : 'Profile'} photo updated successfully!`);
        fetchProfile();
      } catch (err: any) {
        setError(err.response?.data?.message || `Failed to upload ${type} photo.`);
      }
      e.target.value = '';
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!profile) return;
    setError(null);
    setSuccess(null);
    try {
      setCoverPhoto('');
      const payload: any = {};
      if (profile?.accountType === 'Individual') {
        payload.firstName = firstName || profile.firstName || '';
        payload.lastName = lastName || profile.lastName || '';
        payload.dob = dob || profile.dob || '';
        payload.gender = gender || profile.gender || 'Male';
      } else {
        payload.organizationName = organizationName || profile.organizationName || '';
        payload.legalName = legalName || profile.legalName || '';
        payload.streetAddress = streetAddress || profile.streetAddress || '';
        payload.city = city || profile.city || '';
        payload.pincode = pincode || profile.pincode || '';
        payload.state = state || profile.state || '';
        payload.country = country || profile.country || 'India';
      }
      payload.coverPhoto = '';
      payload.profilePicture = profilePicture;
      
      await api.put('/api/users/me', payload);
      setSuccess('Cover photo removed successfully!');
      fetchProfile();
    } catch (err: any) {
      setError('Failed to remove cover photo.');
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!profile) return;
    setError(null);
    setSuccess(null);
    try {
      setProfilePicture('');
      const payload: any = {};
      if (profile?.accountType === 'Individual') {
        payload.firstName = firstName || profile.firstName || '';
        payload.lastName = lastName || profile.lastName || '';
        payload.dob = dob || profile.dob || '';
        payload.gender = gender || profile.gender || 'Male';
      } else {
        payload.organizationName = organizationName || profile.organizationName || '';
        payload.legalName = legalName || profile.legalName || '';
        payload.streetAddress = streetAddress || profile.streetAddress || '';
        payload.city = city || profile.city || '';
        payload.pincode = pincode || profile.pincode || '';
        payload.state = state || profile.state || '';
        payload.country = country || profile.country || 'India';
      }
      payload.coverPhoto = coverPhoto;
      payload.profilePicture = '';
      
      await api.put('/api/users/me', payload);
      setSuccess('Profile photo removed successfully!');
      fetchProfile();
    } catch (err: any) {
      setError('Failed to remove profile photo.');
    }
  };

  const handleSaveAbout = async (newAboutText: string) => {
    if (!profile) return;
    setError(null);
    setSuccess(null);
    if (newAboutText.length > 2600) {
      setError('About section cannot exceed 2,600 characters.');
      return;
    }
    try {
      const payload: any = {};
      if (profile?.accountType === 'Individual') {
        payload.firstName = firstName || profile.firstName || '';
        payload.lastName = lastName || profile.lastName || '';
        payload.dob = dob || profile.dob || '';
        payload.gender = gender || profile.gender || 'Male';
      } else {
        payload.organizationName = organizationName || profile.organizationName || '';
        payload.legalName = legalName || profile.legalName || '';
        payload.streetAddress = streetAddress || profile.streetAddress || '';
        payload.city = city || profile.city || '';
        payload.pincode = pincode || profile.pincode || '';
        payload.state = state || profile.state || '';
        payload.country = country || profile.country || 'India';
      }
      payload.coverPhoto = coverPhoto;
      payload.profilePicture = profilePicture;
      payload.about = newAboutText;

      await api.put('/api/users/me', payload);
      setAbout(newAboutText);
      setSuccess('About section updated successfully!');
      setIsEditingAbout(false);
      fetchProfile();
    } catch (err: any) {
      setError('Failed to update About section.');
    }
  };

  const handleRemoveAbout = async () => {
    if (!profile) return;
    if (!window.confirm('Are you sure you want to remove your About section?')) return;
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {};
      if (profile?.accountType === 'Individual') {
        payload.firstName = firstName || profile.firstName || '';
        payload.lastName = lastName || profile.lastName || '';
        payload.dob = dob || profile.dob || '';
        payload.gender = gender || profile.gender || 'Male';
      } else {
        payload.organizationName = organizationName || profile.organizationName || '';
        payload.legalName = legalName || profile.legalName || '';
        payload.streetAddress = streetAddress || profile.streetAddress || '';
        payload.city = city || profile.city || '';
        payload.pincode = pincode || profile.pincode || '';
        payload.state = state || profile.state || '';
        payload.country = country || profile.country || 'India';
      }
      payload.coverPhoto = coverPhoto;
      payload.profilePicture = profilePicture;
      payload.about = '';

      await api.put('/api/users/me', payload);
      setAbout('');
      setSuccess('About section removed successfully!');
      setIsEditingAbout(false);
      fetchProfile();
    } catch (err: any) {
      setError('Failed to remove About section.');
    }
  };

  if (loading) {
    return <div className="main-content"><div className="glass-card text-center">Loading Profile...</div></div>;
  }

  if (!profile) {
    return <div className="main-content"><div className="glass-card text-center alert-error">{error || 'Profile not loaded.'}</div></div>;
  }

  return (
    <div className="feed-layout-container">
      {/* Left Sidebar */}
      <LeftNavigation activePage={activeTab === 'partners' || isOtherProfile ? 'partners' : 'profile'} />

      {/* Profile Details Column */}
      <div className="feed-center-column" style={{ maxWidth: '800px' }}>
        {activeTab === 'profile' ? (
          <>
            <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="card-title">{isOtherProfile ? 'User Profile' : 'My Profile'}</h2>
                  <p className="card-subtitle">{isOtherProfile ? 'Detailed information about this ExceptionPro member' : 'Manage your account information and preferences'}</p>
                </div>
                {!isOtherProfile ? (
                  <button type="button" className="nav-btn" onClick={handleEditToggle}>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {otherUserRelationship === 'NONE' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ margin: 0, padding: '0.5rem 1rem', width: 'auto' }}
                        onClick={() => handleSendRequestFromProfile(profile.id)}
                      >
                        Connect
                      </button>
                    )}
                    {otherUserRelationship === 'PENDING_SENT' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ margin: 0, padding: '0.5rem 1rem', width: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                        onClick={() => handleCancelOrRemoveFromProfile(otherUserRequestId!, 'cancel this request')}
                      >
                        ⏳ Sent (Cancel)
                      </button>
                    )}
                    {otherUserRelationship === 'PENDING_RECEIVED' && (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ margin: 0, padding: '0.5rem 1rem', width: 'auto', background: '#22c55e' }}
                          onClick={() => handleAcceptRequestFromProfile(otherUserRequestId!)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ margin: 0, padding: '0.5rem 1rem', width: 'auto', color: 'var(--error)' }}
                          onClick={() => handleDeclineRequestFromProfile(otherUserRequestId!)}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {otherUserRelationship === 'ACCEPTED' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ margin: 0, padding: '0.5rem 1rem', width: 'auto', color: 'var(--error)' }}
                        onClick={() => handleCancelOrRemoveFromProfile(otherUserRequestId!, 'remove this business partner')}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                )}
              </div>

              {error && <div className="alert-error">{error}</div>}
              {success && <div className="alert-success">{success}</div>}

              {/* Cover Photo and Profile Picture Section */}
              <div style={{ position: 'relative', marginBottom: '2.5rem', borderRadius: '12px', overflow: 'visible' }}>
                {/* 1st Section: Cover Photo Banner */}
                <div style={{
                  height: '200px',
                  background: coverPhoto ? `url(${getMediaUrl(coverPhoto)}) center/cover no-repeat` : 'var(--accent-gradient)',
                  position: 'relative',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {!coverPhoto && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600', fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      No Cover Photo Uploaded
                    </span>
                  )}
                  {!isOtherProfile && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                      <button
                        type="button"
                        className="nav-btn"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0 }}
                        onClick={() => coverPhotoInputRef.current?.click()}
                      >
                        {coverPhoto ? 'Edit Cover' : 'Browse Cover'}
                      </button>
                      {coverPhoto && (
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0, background: 'var(--error)' }}
                          onClick={handleRemoveCoverPhoto}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={coverPhotoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(e, 'cover')}
                  />
                </div>

                {/* 2nd Section: Profile Photo */}
                <div style={{
                  position: 'absolute',
                  bottom: '-40px',
                  left: '24px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '1rem',
                  zIndex: 5
                }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '4px solid var(--bg-primary)',
                    background: profilePicture ? `url(${getMediaUrl(profilePicture)}) center/cover no-repeat` : 'var(--bg-secondary)',
                    boxShadow: 'var(--shadow-md)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    overflow: 'hidden'
                  }}>
                    {!profilePicture && (profile.firstName || profile.organizationName || profile.email).charAt(0).toUpperCase()}
                  </div>
                  {!isOtherProfile && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        className="nav-btn"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', margin: 0 }}
                        onClick={() => profilePhotoInputRef.current?.click()}
                      >
                        {profilePicture ? 'Edit Photo' : 'Browse Photo'}
                      </button>
                      {profilePicture && (
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', margin: 0, background: 'var(--error)' }}
                          onClick={handleRemoveProfilePicture}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePhotoUpload(e, 'profile')}
                  />
                </div>

                {/* First Section Action Area: Message button Just Below Cover Image Right Side */}
                <div style={{
                  position: 'absolute',
                  bottom: '-38px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 10
                }}>
                  <button
                    type="button"
                    className="btn-primary"
                    id="profile-message-btn"
                    data-testid="profile-message-btn"
                    style={{
                      margin: 0,
                      padding: '0.45rem 1.1rem',
                      width: 'auto',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-sm)',
                      background: 'var(--accent-gradient)'
                    }}
                    onClick={() => {
                      const name = profile.accountType === 'Individual'
                        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email
                        : profile.organizationName || profile.email;
                      window.dispatchEvent(new CustomEvent('openChatWithUser', {
                        detail: {
                          email: profile.email,
                          name,
                          avatar: profilePicture,
                          accountType: profile.accountType,
                          id: profile.id
                        }
                      }));
                    }}
                  >
                    <span>💬</span> Message
                  </button>
                </div>
              </div>
              <div style={{ height: '40px' }}></div>

              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="form-label">Email Address</label>
                    <input type="text" className="form-input" value={profile.email} disabled style={{ opacity: 0.6 }} />
                  </div>

                  <div className="form-group half-width">
                    <label className="form-label">Account Classification</label>
                    <input type="text" className="form-input" value={profile.accountType} disabled style={{ opacity: 0.6 }} />
                  </div>
                </div>

                <div className="separator" style={{ margin: '1rem 0 1.5rem 0' }}>Profile Details</div>

                {/* Individual view/edit logic */}
                {profile.accountType === 'Individual' && (
                  <div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-input"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-input"
                          style={{ appearance: isEditing ? 'auto' : 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          disabled={!isEditing}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Corporate view/edit logic */}
                {profile.accountType !== 'Individual' && (
                  <div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">Organization Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">Legal Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-input"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">Pincode</label>
                        <input
                          type="text"
                          className="form-input"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          className="form-input"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">Country</label>
                        <select
                          className="form-input"
                          style={{ appearance: isEditing ? 'auto' : 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          disabled={!isEditing}
                        >
                          {countries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }}>Save Changes</button>
                )}
              </form>

              {/* About Section */}
              <div className="separator" style={{ margin: '2.5rem 0 1.5rem 0' }}>About</div>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', position: 'relative' }}>
                {isEditingAbout ? (
                  <div>
                    <textarea
                      className="form-input"
                      rows={5}
                      style={{
                        minHeight: '120px',
                        resize: 'vertical',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        padding: '0.75rem',
                        fontFamily: 'var(--font-family)',
                        width: '100%',
                        marginBottom: '0.5rem'
                      }}
                      placeholder="Write something about yourself (max 2,600 characters)..."
                      value={about}
                      onChange={(e) => setAbout(e.target.value.slice(0, 2600))}
                      maxLength={2600}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{about.length} / 2,600 characters</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: '6px' }}
                          onClick={() => handleSaveAbout(about)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                          onClick={() => {
                            setAbout(profile?.about || '');
                            setIsEditingAbout(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {about ? (
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                        {about}
                      </p>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        No about details added yet.
                      </p>
                    )}
                    
                    {!isOtherProfile && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0 }}
                          onClick={() => setIsEditingAbout(true)}
                        >
                          {about ? 'Edit About' : 'Add About'}
                        </button>
                        {about && (
                          <button
                            type="button"
                            className="nav-btn"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0, background: 'var(--error)' }}
                            onClick={handleRemoveAbout}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isOtherProfile && (
                <>
                  <div className="separator" style={{ margin: '2.5rem 0 1.5rem 0' }}>Password Manager</div>

                  {passwordError && <div className="alert-error">{passwordError}</div>}
                  {passwordSuccess && <div className="alert-success">{passwordSuccess}</div>}

                  <form onSubmit={handlePasswordUpdate}>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group half-width"></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group half-width">
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                      Update Password
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* My Posts Feed Header */}
            <div className="separator" style={{ margin: '2.5rem 0 1.5rem 0' }}>{isOtherProfile ? 'User Posts' : 'My Posts'}</div>

            {/* Post Creator Card */}
            {!isOtherProfile && (
              <div className="glass-card" style={{ padding: '1.5rem', maxWidth: 'none', marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create a Post</h3>
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
                      {selectedFiles.map((file, idx) => {
                        const ext = file.name.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                        const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);
                        const previewUrl = URL.createObjectURL(file);

                        return (
                          <div key={`new-pub-${idx}`} style={{ position: 'relative', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden', height: '120px' }}>
                            {isImage ? (
                              <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : isVideo ? (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontSize: '0.75rem' }}>
                                🎥 Video Preview
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.5rem' }}>📄</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', marginTop: '0.25rem' }}>{file.name}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary animate-pulse"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', margin: 0, padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
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
                        <option value="CONNECTIONS">👥 Connections</option>
                        <option value="ONLY_ME">🔒 Only Me</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: 'auto', margin: 0, padding: '0.5rem 1.5rem' }}
                      disabled={publishing}
                    >
                      {publishing ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {postError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{postError}</div>}
            {shareNotification && (
              <div className="alert-success" style={{ position: 'fixed', top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
                {shareNotification}
              </div>
            )}

            {postsLoading ? (
              <div className="glass-card text-center" style={{ padding: '2rem', maxWidth: 'none' }}>Loading your posts...</div>
            ) : posts.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '3rem', maxWidth: 'none' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No posts yet</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You haven't shared any updates yet. Share your first post in the Social Feed!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                {posts.map((post) => (
                  <div key={post.id} id={`post-${post.id}`} className="glass-card" style={{ padding: '1.5rem', maxWidth: 'none' }}>

                    {/* Post Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <img
                          src={post.profilePicture}
                          alt="avatar"
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{post.userName}</span>
                            <span className="badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              {post.accountType}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <span>{formatTime(post.dateCreated)}</span>
                            <span>•</span>
                            <span>🌍 {post.visibility}</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit & Delete Options */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

                    {/* Post Metrics Display */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span>👍 {post.numLikes} {post.numLikes === 1 ? 'like' : 'likes'}</span>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>💬 {post.numComments} {post.numComments === 1 ? 'comment' : 'comments'}</span>
                        <span>🔗 {post.numShares} {post.numShares === 1 ? 'share' : 'shares'}</span>
                        <span>👁️ {post.numViews} {post.numViews === 1 ? 'view' : 'views'}</span>
                      </div>
                    </div>

                    {/* Post Interaction Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0', borderBottom: expandedComments[post.id] ? '1px solid var(--border-color)' : 'none' }}>
                      <button
                        onClick={() => handleLike(post.id)}
                        style={{ background: 'none', border: 'none', color: post.likedByCurrentUser ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: post.likedByCurrentUser ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                      >
                        {post.likedByCurrentUser ? '❤️ Liked' : '🤍 Like'}
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        style={{ background: 'none', border: 'none', color: expandedComments[post.id] ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: expandedComments[post.id] ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                      >
                        💬 Comment
                      </button>
                      <button
                        onClick={() => handleShare(post.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                      >
                        🔗 Share
                      </button>
                      <button
                        onClick={() => handleSavePost(post.id)}
                        style={{ background: 'none', border: 'none', color: post.savedByCurrentUser ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: post.savedByCurrentUser ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                      >
                        {post.savedByCurrentUser ? 'Saved' : 'Save'}
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
          </>
        ) : (
          <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="card-title">Business Partners</h2>
                <p className="card-subtitle">Establish and manage your business partner relationships</p>
              </div>
            </div>

            {partnerError && <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{partnerError}</div>}
            {partnerSuccess && <div className="alert-success" style={{ marginBottom: '1.5rem' }}>{partnerSuccess}</div>}

            {/* Partners Sub-tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`nav-btn ${partnerTab === 'search' ? 'active' : ''}`}
                style={{ background: partnerTab === 'search' ? 'var(--accent-primary)' : 'transparent', color: partnerTab === 'search' ? '#fff' : 'var(--text-primary)', border: partnerTab === 'search' ? 'none' : '1px solid var(--border-color)', margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setPartnerTab('search')}
              >
                Directory
              </button>
              <button
                type="button"
                className={`nav-btn ${partnerTab === 'my-partners' ? 'active' : ''}`}
                style={{ background: partnerTab === 'my-partners' ? 'var(--accent-primary)' : 'transparent', color: partnerTab === 'my-partners' ? '#fff' : 'var(--text-primary)', border: partnerTab === 'my-partners' ? 'none' : '1px solid var(--border-color)', margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => { setPartnerTab('my-partners'); fetchMyPartners(); }}
              >
                My Partners ({myPartners.length})
              </button>
              <button
                type="button"
                className={`nav-btn ${partnerTab === 'incoming' ? 'active' : ''}`}
                style={{ background: partnerTab === 'incoming' ? 'var(--accent-primary)' : 'transparent', color: partnerTab === 'incoming' ? '#fff' : 'var(--text-primary)', border: partnerTab === 'incoming' ? 'none' : '1px solid var(--border-color)', margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => { setPartnerTab('incoming'); fetchIncomingRequests(); }}
              >
                Incoming Requests ({incomingRequests.length})
              </button>
              <button
                type="button"
                className={`nav-btn ${partnerTab === 'outgoing' ? 'active' : ''}`}
                style={{ background: partnerTab === 'outgoing' ? 'var(--accent-primary)' : 'transparent', color: partnerTab === 'outgoing' ? '#fff' : 'var(--text-primary)', border: partnerTab === 'outgoing' ? 'none' : '1px solid var(--border-color)', margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => { setPartnerTab('outgoing'); fetchOutgoingRequests(); }}
              >
                Outgoing Requests ({outgoingRequests.length})
              </button>
            </div>

            {/* TAB: DIRECTORY SEARCH */}
            {partnerTab === 'search' && (
              <div>
                <h3 className="section-title" style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  {recommendationTitle}
                </h3>

                {searching ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading recommendations...</p>
                ) : searchResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {searchResults.map((res) => {
                      const prof = res.profile;
                      const displayName = prof.accountType === 'Individual'
                        ? `${prof.firstName || ''} ${prof.lastName || ''}`
                        : (prof.organizationName || prof.email);

                      return (
                        <div key={prof.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', margin: 0 }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div
                                onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <h5
                                  onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                  style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                                >
                                  {displayName}
                                </h5>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prof.accountType}</span>
                              </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>📧 {prof.email}</p>

                            {prof.accountType !== 'Individual' && prof.city && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📍 {prof.city}, {prof.country}</p>
                            )}
                            {prof.accountType === 'Individual' && prof.gender && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>👤 {prof.gender}</p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="nav-btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0 }}
                              onClick={() => setSelectedUser(res)}
                            >
                              View details
                            </button>

                            {res.relationshipStatus === 'NONE' && (
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, width: 'auto' }}
                                onClick={() => handleSendRequest(prof.id)}
                              >
                                Connect
                              </button>
                            )}
                            {res.relationshipStatus === 'PENDING_SENT' && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                onClick={() => handleCancelOrRemove(res.requestId, 'cancel this request')}
                              >
                                ⏳ Sent (Cancel)
                              </button>
                            )}
                            {res.relationshipStatus === 'PENDING_RECEIVED' && (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', margin: 0, width: 'auto', background: '#22c55e' }}
                                  onClick={() => handleAcceptRequest(res.requestId)}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="nav-btn"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', margin: 0, background: '#ef4444', color: '#fff' }}
                                  onClick={() => handleDeclineRequest(res.requestId)}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                            {res.relationshipStatus === 'ACCEPTED' && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e' }}
                                onClick={() => handleCancelOrRemove(res.requestId, 'remove this business partner')}
                              >
                                🤝 Partner (Remove)
                              </button>
                            )}
                            {res.relationshipStatus === 'DECLINED_SENT' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Declined by recipient</span>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, width: '100%' }}
                                  onClick={() => handleSendRequest(prof.id)}
                                >
                                  Try again
                                </button>
                              </div>
                            )}
                            {res.relationshipStatus === 'DECLINED_RECEIVED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You declined this request</span>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, width: '100%' }}
                                  onClick={() => handleAcceptRequest(res.requestId)}
                                >
                                  Accept instead
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No recommendations found.</p>
                )}
              </div>
            )}

            {/* TAB: MY PARTNERS */}
            {partnerTab === 'my-partners' && (
              <div>
                {myPartners.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {myPartners.map((res) => {
                      const prof = res.profile;
                      const displayName = prof.accountType === 'Individual'
                        ? `${prof.firstName || ''} ${prof.lastName || ''}`
                        : (prof.organizationName || prof.email);

                      return (
                        <div key={prof.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', margin: 0 }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div
                                onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <h5
                                  onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                  style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                                >
                                  {displayName}
                                </h5>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prof.accountType}</span>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>📧 {prof.email}</p>
                            {prof.accountType !== 'Individual' && prof.city && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📍 {prof.city}, {prof.country}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="nav-btn"
                              style={{ flex: '1 1 0%', minWidth: '70px', padding: '0.4rem 0.6rem', fontSize: '0.75rem', margin: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}
                              onClick={() => setSelectedUser(res)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ flex: '1 1 0%', minWidth: '85px', padding: '0.4rem 0.6rem', fontSize: '0.75rem', margin: 0, width: 'auto', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', background: 'var(--accent-gradient)' }}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('openChatWithUser', {
                                  detail: {
                                    email: prof.email,
                                    name: displayName,
                                    avatar: prof.profilePicture,
                                    accountType: prof.accountType,
                                    id: prof.id
                                  }
                                }));
                              }}
                            >
                              💬 Message
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ flex: '1 1 0%', minWidth: '70px', padding: '0.4rem 0.6rem', fontSize: '0.75rem', margin: 0, color: 'var(--error, #ef4444)', border: '1px solid var(--border-color)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}
                              onClick={() => handleCancelOrRemove(res.requestId, 'remove this business partner')}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No business partners established yet.</p>
                )}
              </div>
            )}

            {/* TAB: INCOMING REQUESTS */}
            {partnerTab === 'incoming' && (
              <div>
                {incomingRequests.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {incomingRequests.map((res) => {
                      const prof = res.profile;
                      const displayName = prof.accountType === 'Individual'
                        ? `${prof.firstName || ''} ${prof.lastName || ''}`
                        : (prof.organizationName || prof.email);

                      return (
                        <div key={prof.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', margin: 0 }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div
                                onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <h5
                                  onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                  style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                                >
                                  {displayName}
                                </h5>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prof.accountType}</span>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>📧 {prof.email}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, width: 'auto', background: '#22c55e' }}
                              onClick={() => handleAcceptRequest(res.requestId)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="nav-btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0, background: '#ef4444', color: '#fff' }}
                              onClick={() => handleDeclineRequest(res.requestId)}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              className="nav-btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0 }}
                              onClick={() => setSelectedUser(res)}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No incoming partner requests.</p>
                )}
              </div>
            )}

            {/* TAB: OUTGOING REQUESTS */}
            {partnerTab === 'outgoing' && (
              <div>
                {outgoingRequests.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {outgoingRequests.map((res) => {
                      const prof = res.profile;
                      const displayName = prof.accountType === 'Individual'
                        ? `${prof.firstName || ''} ${prof.lastName || ''}`
                        : (prof.organizationName || prof.email);

                      return (
                        <div key={prof.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', margin: 0 }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <div
                                onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <h5
                                  onClick={() => navigate(`/profile?email=${encodeURIComponent(prof.email)}`)}
                                  style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                                >
                                  {displayName}
                                </h5>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prof.accountType}</span>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>📧 {prof.email}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0 }}
                              onClick={() => handleCancelOrRemove(res.requestId, 'cancel this request')}
                            >
                              Cancel Request
                            </button>
                            <button
                              type="button"
                              className="nav-btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', margin: 0 }}
                              onClick={() => setSelectedUser(res)}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No pending outgoing requests.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Post Modal inside Profile */}
        {editingPost && (
          <div className="modal-overlay" onClick={() => setEditingPost(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <button className="close-btn" onClick={() => setEditingPost(null)} style={{ top: '1.25rem', right: '1.25rem' }}>&times;</button>
              <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Edit Post</h3>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Update your post content and attachments.</p>

              <form onSubmit={handleSavePostEdit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-post-desc">Description</label>
                  <textarea
                    id="edit-post-desc"
                    className="form-input"
                    style={{ minHeight: '120px', resize: 'vertical', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}
                    value={editingPost.postDescription}
                    onChange={(e) => setEditingPost({ ...editingPost, postDescription: e.target.value })}
                    required
                  />
                </div>

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

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Current Media & Documents</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}

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
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                    Attach Media/Docs
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                  <button type="button" className="btn-secondary" style={{ margin: 0, padding: '0.75rem' }} onClick={() => setEditingPost(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ margin: 0, padding: '0.75rem' }} disabled={savingEditPost}>{savingEditPost ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selected User Profile View Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <button className="close-btn" onClick={() => setSelectedUser(null)} style={{ top: '1.25rem', right: '1.25rem' }}>&times;</button>
              <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>User Profile</h3>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Detailed information about this registered user.</p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {(selectedUser.profile.firstName || selectedUser.profile.organizationName || selectedUser.profile.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
                    {selectedUser.profile.accountType === 'Individual'
                      ? `${selectedUser.profile.firstName || ''} ${selectedUser.profile.lastName || ''}`
                      : selectedUser.profile.organizationName}
                  </h4>
                  <span className="badge badge-individual" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', textTransform: 'capitalize', marginTop: '0.25rem', display: 'inline-block' }}>
                    {selectedUser.profile.accountType}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Email:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.email}</span>
                </div>
                {selectedUser.profile.accountType === 'Individual' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>Date of Birth:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.dob || 'Not specified'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>Gender:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.gender || 'Not specified'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>Legal Name:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.legalName || 'Not specified'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>Street Address:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.streetAddress || 'Not specified'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>City / Pincode:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.city || 'Not specified'} / {selectedUser.profile.pincode || 'Not specified'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>State / Country:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedUser.profile.state || 'Not specified'}, {selectedUser.profile.country || 'Not specified'}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Relationship Status:</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    {selectedUser.relationshipStatus === 'NONE' && 'None'}
                    {selectedUser.relationshipStatus === 'PENDING_SENT' && 'Request Sent (Pending)'}
                    {selectedUser.relationshipStatus === 'PENDING_RECEIVED' && 'Request Received (Pending Approval)'}
                    {selectedUser.relationshipStatus === 'ACCEPTED' && 'Business Partner (Connected)'}
                    {selectedUser.relationshipStatus === 'DECLINED_SENT' && 'Declined by recipient'}
                    {selectedUser.relationshipStatus === 'DECLINED_RECEIVED' && 'Declined by you'}
                  </span>
                </div>
              </div>

              <button type="button" className="btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem' }} onClick={() => setSelectedUser(null)}>
                Close Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
