import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { socialAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';
import {
  Eye, Radio, Heart, MessageCircle, Repeat, BarChart3, Sparkles, Calendar, Rocket,
  Globe, Bird, Camera, Briefcase, Play, Music, Plus, Send, X, Edit, Trash2,
  Hash, MessageSquare, Target, DollarSign, Check, Image, Clock,
} from 'lucide-react';

const TABS = [
  { key: 'Compose', label: 'Compose' },
  { key: 'Posts', label: 'Posts' },
  { key: 'Inbox', label: 'Inbox' },
  { key: 'Campaigns', label: 'Campaigns' },
  { key: 'Accounts', label: 'Accounts' },
];

const PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
const PLATFORM_ICONS = {
  facebook: Globe,
  twitter: Bird,
  instagram: Camera,
  linkedin: Briefcase,
  youtube: Play,
  tiktok: Music,
};
const TONES = ['professional', 'casual', 'promotional', 'inspirational', 'educational'];

function CrudModal({ open, onClose, title, children, onSubmit, loading, edit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : edit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Social() {
  const [tab, setTab] = useState('Compose');
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState(['instagram', 'twitter']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [tone, setTone] = useState('professional');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [campaignModal, setCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({ name: '', objective: '', platforms: [], start_date: '', end_date: '', budget: '', currency: 'USD' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const pageSize = 20;

  const { data: accounts } = useApi(socialAPI.accounts, [], { initial: { results: [] } });
  const { data: posts, refetch: refetchPosts } = useApi(() => socialAPI.posts({ status: filter === 'all' ? undefined : filter, page: postsPage, page_size: pageSize }), [filter, postsPage], { initial: { results: [] } });
  const { data: messages, refetch: refetchMessages } = useApi(() => socialAPI.messages({}), [], { initial: { results: [] } });
  const { data: campaigns, refetch: refetchCampaigns } = useApi(() => socialAPI.campaigns({ page: campaignsPage, page_size: pageSize }), [campaignsPage], { initial: { results: [] } });
  const { data: analyticsData } = useApi(socialAPI.analyticsSummary, [], { initial: {} });
  const { data: accountOverview } = useApi(socialAPI.accountOverview, [], { initial: {} });

  const { mutate: createPost, loading: creatingPost } = useMutation(socialAPI.createPost);
  const { mutate: schedulePost } = useMutation(socialAPI.schedulePost);
  const { mutate: updatePost } = useMutation(socialAPI.updatePost);
  const { mutate: deletePost } = useMutation(socialAPI.deletePost);
  const { mutate: markRead } = useMutation(socialAPI.markRead);
  const { mutate: markAllRead } = useMutation(socialAPI.markAllRead);
  const { mutate: replyMessage } = useMutation(socialAPI.reply);
  const { mutate: createCampaign, loading: savingCampaign } = useMutation(socialAPI.createCampaign);
  const { mutate: updateCampaign } = useMutation(socialAPI.updateCampaign);
  const { mutate: activateCampaign } = useMutation(socialAPI.activateCampaign);

  const accountList = accounts?.results || accounts || [];
  const postList = posts?.results || posts || [];
  const messageList = messages?.results || messages || [];
  const campaignList = campaigns?.results || campaigns || [];
  const unread = messageList.filter(m => !m.is_read).length;

  const togglePlatform = (p) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await socialAPI.generateAI({ prompt: aiPrompt, tone, platforms, include_hashtags: true });
      setAiResult(res.data);
      setContent(res.data.content || '');
      setSuggestedHashtags(res.data.hashtags || []);
    } catch {
      toast.error('Failed to generate content');
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePublish() {
    if (!content.trim() || platforms.length === 0) return;
    try {
      if (scheduledAt) {
        await schedulePost({ content, platforms, scheduled_at: scheduledAt });
        toast.success('Post scheduled');
      } else {
        await createPost({ content, platforms, status: 'published' });
        toast.success('Post published');
      }
      setContent('');
      setScheduledAt('');
      setAiResult(null);
      refetchPosts();
    } catch {
      toast.error('Failed to publish post');
    }
  }

  async function handleHashtagSuggest() {
    try {
      const res = await socialAPI.suggestHashtags({ topic: content.split(' ')[0], platform: platforms[0] || 'instagram' });
      setSuggestedHashtags(res.data.suggestions || []);
    } catch {
      toast.error('Failed to suggest hashtags');
    }
  }

  function openCreateCampaign() {
    setEditingCampaign(null);
    setCampaignForm({ name: '', objective: '', platforms: [], start_date: '', end_date: '', budget: '', currency: 'USD' });
    setCampaignModal(true);
  }

  function openEditCampaign(c) {
    setEditingCampaign(c);
    setCampaignForm({
      name: c.name || '',
      objective: c.objective || '',
      platforms: c.platforms || [],
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      budget: c.budget?.toString() || '',
      currency: c.currency || 'USD',
    });
    setCampaignModal(true);
  }

  async function handleCampaignSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...campaignForm, budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null };
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, payload);
        toast.success('Campaign updated');
      } else {
        await createCampaign(payload);
        toast.success('Campaign created');
      }
      setCampaignModal(false);
      refetchCampaigns();
    } catch {
      toast.error('Failed to save campaign');
    }
  }

  function toggleCampaignPlatform(p) {
    setCampaignForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }));
  }

  async function handleDeletePost(id) {
    setDeleteLoading(true);
    try {
      await deletePost(id);
      toast.success('Post deleted');
      setDeleteConfirm(null);
      refetchPosts();
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleMarkRead(id) {
    await markRead(id);
    refetchMessages();
  }

  async function handleMarkAllRead() {
    await markAllRead();
    refetchMessages();
    toast.success('All messages marked as read');
  }

  async function handleReply(msgId) {
    if (!replyText.trim()) return;
    try {
      await replyMessage(msgId, { content: replyText });
      toast.success('Reply sent');
      setReplyId(null);
      setReplyText('');
      refetchMessages();
    } catch {
      toast.error('Failed to send reply');
    }
  }

  async function handleActivateCampaign(id) {
    try {
      await activateCampaign(id);
      toast.success('Campaign activated');
      refetchCampaigns();
    } catch {
      toast.error('Failed to activate campaign');
    }
  }

  const analyticsMetrics = [
    { label: 'Impressions', value: fmt.shortNum(analyticsData?.total_impressions), icon: <Eye size={20} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Reach', value: fmt.shortNum(analyticsData?.total_reach), icon: <Radio size={20} />, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Likes', value: fmt.shortNum(analyticsData?.total_likes), icon: <Heart size={20} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Comments', value: fmt.shortNum(analyticsData?.total_comments), icon: <MessageCircle size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Shares', value: fmt.shortNum(analyticsData?.total_shares), icon: <Repeat size={20} />, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { label: 'Eng. Rate', value: `${(analyticsData?.avg_engagement_rate || 0).toFixed(1)}%`, icon: <BarChart3 size={20} />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  ];

  const postColumns = [
    {
      label: 'Content',
      key: 'content',
      className: 'max-w-xs',
      render: (row) => (
        <div>
          <p className="truncate">{row.content}</p>
          <div className="flex gap-1 mt-1">
            {(row.platforms || []).map(p => {
              const Icon = PLATFORM_ICONS[p];
              return Icon ? <Icon key={p} size={12} className="text-gray-400" /> : null;
            })}
            {row.ai_generated && <Sparkles key="ai" size={12} className="text-indigo-400" />}
          </div>
        </div>
      ),
    },
    { label: 'Status', key: 'status', render: (row) => <span className={badge(row.status)}>{row.status}</span> },
    { label: 'Author', key: 'author_name' },
    {
      label: 'Date',
      key: 'created_at',
      render: (row) => <span className="text-xs">{row.scheduled_at ? fmt.datetime(row.scheduled_at) : fmt.timeAgo(row.created_at)}</span>,
    },
    {
      label: '',
      key: 'actions',
      render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => setDeleteConfirm(row)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Social Media & CMS"
      subtitle={`${accountList.filter(a => a.is_connected).length} connected · ${fmt.shortNum(accountOverview?.total_followers)} followers`}
      icon={<Radio size={20} />}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <button className="btn-primary" onClick={() => setTab('Compose')}>
          <Plus size={16} className="mr-1" /> Create Post
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {analyticsMetrics.map(m => (
          <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} color={m.color} bg={m.bg} />
        ))}
      </div>

      {tab === 'Compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-indigo-700 dark:text-indigo-300 text-sm">AI Content Generator</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input className="input flex-1 text-sm" placeholder="Describe what you want to post about…"
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAIGenerate()} />
                <select className="input text-sm w-40" value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={handleAIGenerate} disabled={aiLoading}
                  className="btn-primary text-sm whitespace-nowrap">
                  {aiLoading ? <><Clock size={14} className="mr-1" /> Generating…</> : <><Sparkles size={14} className="mr-1" /> Generate</>}
                </button>
              </div>
              {aiResult && (
                <div className="space-y-2">
                  {Object.entries(aiResult.platform_variants || {}).slice(0, 2).map(([platform, text]) => {
                    const Icon = PLATFORM_ICONS[platform];
                    return (
                      <div key={platform} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                        <div className="text-xs font-semibold text-indigo-600 mb-1 capitalize flex items-center gap-1">
                          {Icon && <Icon size={12} />} {platform} variant
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">{text}</div>
                        <button onClick={() => setContent(text)}
                          className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Use this →</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Publish to</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => {
                  const Icon = PLATFORM_ICONS[p];
                  return (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        platforms.includes(p)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                      }`}>
                      {Icon && <Icon size={14} />} {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <textarea
                className="input w-full text-sm resize-none"
                rows={6}
                placeholder="Write your post content here, or use AI to generate it…"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-400">{content.length} characters</span>
                <button onClick={handleHashtagSuggest} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  <Hash size={12} /> Suggest Hashtags
                </button>
              </div>
            </div>

            {suggestedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map(tag => (
                  <button key={tag} onClick={() => setContent(c => c + ' ' + tag)}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-center">
              <input type="datetime-local" className="input text-sm flex-1"
                value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              <button onClick={handlePublish} disabled={!content.trim() || platforms.length === 0 || creatingPost}
                className="btn-primary">
                {scheduledAt ? <><Calendar size={16} className="mr-1" /> Schedule</> : <><Rocket size={16} className="mr-1" /> Publish Now</>}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Preview</div>
            {platforms.slice(0, 2).map(p => {
              const Icon = PLATFORM_ICONS[p];
              return (
                <div key={p} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {Icon && <Icon size={18} className="text-gray-600 dark:text-gray-400" />}
                    <span className="font-medium text-sm capitalize">{p}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg h-24 flex items-center justify-center text-xs text-gray-400 mb-2">
                    <Image size={24} className="text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {content || <span className="text-gray-400 italic">Your post content will appear here…</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Posts' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['all', 'published', 'scheduled', 'draft'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPostsPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                  filter === f
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>{f}</button>
            ))}
          </div>
          <DataTable
            columns={postColumns}
            data={postList}
            emptyMessage="No posts yet. Create one with AI!"
          />
          <Pagination
            count={posts?.count || 0}
            page={postsPage}
            pageSize={pageSize}
            onPageChange={setPostsPage}
          />
        </div>
      )}

      {tab === 'Inbox' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={16} /> Unified Inbox
              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{unread} unread</span>
            </h2>
            <button onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {messageList.map(msg => (
              <div key={msg.id}
                className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!msg.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <div onClick={() => !msg.is_read && handleMarkRead(msg.id)}
                  className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-medium text-indigo-600 flex-shrink-0">
                  {fmt.initials(msg.sender_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{msg.sender_name}</span>
                      {(() => {
                        const Icon = PLATFORM_ICONS[msg.platform];
                        return Icon ? <Icon size={12} className="text-gray-400" /> : null;
                      })()}
                      <span className={badge(msg.message_type)}>{msg.message_type}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{fmt.timeAgo(msg.received_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                  {replyId === msg.id ? (
                    <div className="mt-2 flex gap-2">
                      <input className="input text-sm flex-1" placeholder="Type your reply…"
                        value={replyText} onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)} />
                      <button onClick={() => handleReply(msg.id)} disabled={!replyText.trim()}
                        className="btn-primary text-sm px-3"><Send size={14} /></button>
                      <button onClick={() => { setReplyId(null); setReplyText(''); }}
                        className="btn-secondary text-sm px-3"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyId(msg.id)}
                      className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Reply</button>
                  )}
                </div>
                {!msg.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
              </div>
            ))}
            {messageList.length === 0 && (
              <div className="p-8 text-center text-gray-400">No messages</div>
            )}
          </div>
        </div>
      )}

      {tab === 'Campaigns' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={openCreateCampaign}>
              <Plus size={16} className="mr-1" /> New Campaign
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignList.map(c => {
              const Icon = PLATFORM_ICONS[c.platforms?.[0]];
              return (
                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                    <span className={badge(c.status)}>{c.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Target size={12} /> {c.objective}
                    {Icon && <Icon size={12} className="ml-1" />}
                    <span className="ml-1">{(c.platforms || []).join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {fmt.dateShort(c.start_date)} – {fmt.dateShort(c.end_date)}
                    </span>
                    {c.budget && <span className="flex items-center gap-1"><DollarSign size={12} /> {fmt.currency(c.budget, c.currency)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{c.post_count || 0} posts</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditCampaign(c)} className="p-1 text-gray-400 hover:text-indigo-500 transition-colors">
                        <Edit size={14} />
                      </button>
                      {c.status !== 'active' && (
                        <button onClick={() => handleActivateCampaign(c.id)} className="p-1 text-gray-400 hover:text-green-500 transition-colors">
                          <Play size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {campaignList.length === 0 && (
              <div className="col-span-3 p-8 text-center text-gray-400">No campaigns yet</div>
            )}
          </div>
          <Pagination
            count={campaigns?.count || 0}
            page={campaignsPage}
            pageSize={pageSize}
            onPageChange={setCampaignsPage}
          />
        </div>
      )}

      {tab === 'Accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(platform => {
            const acc = accountList.find(a => a.platform === platform);
            const Icon = PLATFORM_ICONS[platform];
            return (
              <div key={platform} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 ${acc?.is_connected ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {Icon && <Icon size={24} className="text-gray-600 dark:text-gray-400" />}
                  <div>
                    <div className="font-semibold capitalize text-gray-900 dark:text-white">{platform}</div>
                    {acc && <div className="text-xs text-gray-500">{acc.account_name}</div>}
                  </div>
                  <div className="ml-auto">
                    {acc?.is_connected
                      ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check size={12} /> Connected</span>
                      : <span className="text-xs text-gray-400">Not connected</span>}
                  </div>
                </div>
                {acc?.is_connected ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Followers</span>
                      <span className="font-medium text-gray-900 dark:text-white">{fmt.shortNum(acc.follower_count)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Last synced</span>
                      <span className="text-gray-600">{acc.last_synced ? fmt.timeAgo(acc.last_synced) : 'Never'}</span>
                    </div>
                  </div>
                ) : (
                  <button className="btn-secondary text-xs w-full mt-2">Connect {platform}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CrudModal
        open={campaignModal}
        onClose={() => setCampaignModal(false)}
        title={editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
        onSubmit={handleCampaignSubmit}
        loading={savingCampaign}
        edit={!!editingCampaign}
      >
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Campaign Name</label>
          <input className="input w-full text-sm" placeholder="Summer Sale 2025"
            value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Objective</label>
          <select className="input w-full text-sm" value={campaignForm.objective}
            onChange={e => setCampaignForm(p => ({ ...p, objective: e.target.value }))} required>
            <option value="">Select objective</option>
            <option value="awareness">Awareness</option>
            <option value="engagement">Engagement</option>
            <option value="traffic">Traffic</option>
            <option value="conversions">Conversions</option>
            <option value="sales">Sales</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const PIcon = PLATFORM_ICONS[p];
              return (
                <button key={p} type="button" onClick={() => toggleCampaignPlatform(p)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    campaignForm.platforms.includes(p)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}>
                  {PIcon && <PIcon size={12} />} {p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Start Date</label>
            <input type="date" className="input w-full text-sm"
              value={campaignForm.start_date} onChange={e => setCampaignForm(p => ({ ...p, start_date: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">End Date</label>
            <input type="date" className="input w-full text-sm"
              value={campaignForm.end_date} onChange={e => setCampaignForm(p => ({ ...p, end_date: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Budget</label>
            <input type="number" min="0" step="0.01" className="input w-full text-sm"
              value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Currency</label>
            <select className="input w-full text-sm" value={campaignForm.currency}
              onChange={e => setCampaignForm(p => ({ ...p, currency: e.target.value }))}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </CrudModal>

      <ConfirmDelete
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeletePost(deleteConfirm?.id)}
        loading={deleteLoading}
        title="Delete this post?"
      />
    </ModulePage>
  );
}
