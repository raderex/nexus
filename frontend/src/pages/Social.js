
import React, { useState, useRef } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { socialAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

const PLATFORMS = ['facebook','twitter','instagram','linkedin','youtube','tiktok'];
const PLATFORM_ICONS = { facebook:'🔵', twitter:'🐦', instagram:'📸', linkedin:'💼', youtube:'▶️', tiktok:'🎵' };
const TONES = ['professional','casual','promotional','inspirational','educational'];

export default function Social() {
  const [tab, setTab] = useState('Compose');
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState(['instagram','twitter']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [tone, setTone] = useState('professional');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);

  const { data: accounts } = useApi(socialAPI.accounts, [], { initial: { results: [] } });
  const { data: posts, refetch: refetchPosts } = useApi(() => socialAPI.posts({}), [], { initial: { results: [] } });
  const { data: messages, refetch: refetchMessages } = useApi(() => socialAPI.messages({}), [], { initial: { results: [] } });
  const { data: campaigns, refetch: refetchCampaigns } = useApi(() => socialAPI.campaigns({}), [], { initial: { results: [] } });
  const { data: analyticsData } = useApi(socialAPI.analyticsSummary, [], { initial: {} });
  const { data: accountOverview } = useApi(socialAPI.accountOverview, [], { initial: {} });

  const { mutate: createPost } = useMutation(socialAPI.createPost);
  const { mutate: schedulePost } = useMutation(socialAPI.schedulePost);
  const { mutate: markRead } = useMutation(socialAPI.markRead);
  const { mutate: markAllRead } = useMutation(socialAPI.markAllRead);
  const { mutate: replyMessage } = useMutation(socialAPI.reply);

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
    } finally { setAiLoading(false); }
  }

  async function handlePublish() {
    if (!content.trim() || platforms.length === 0) return;
    if (scheduledAt) {
      await schedulePost({ content, platforms, scheduled_at: scheduledAt });
    } else {
      await createPost({ content, platforms, status: 'published' });
    }
    setContent(''); setScheduledAt(''); setAiResult(null);
    refetchPosts();
  }

  async function handleHashtagSuggest() {
    const res = await socialAPI.suggestHashtags({ topic: content.split(' ')[0], platform: platforms[0] || 'instagram' });
    setSuggestedHashtags(res.data.suggestions || []);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Media & CMS</h1>
          <p className="text-sm text-gray-500 mt-1">
            {accountList.filter(a => a.is_connected).length} connected · {fmt.shortNum(accountOverview?.total_followers)} followers
          </p>
        </div>
        <button className="btn-primary" onClick={() => setTab('Compose')}>+ Create Post</button>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Impressions', value: fmt.shortNum(analyticsData?.total_impressions), icon: '👁' },
          { label: 'Reach', value: fmt.shortNum(analyticsData?.total_reach), icon: '📡' },
          { label: 'Likes', value: fmt.shortNum(analyticsData?.total_likes), icon: '❤️' },
          { label: 'Comments', value: fmt.shortNum(analyticsData?.total_comments), icon: '💬' },
          { label: 'Shares', value: fmt.shortNum(analyticsData?.total_shares), icon: '🔁' },
          { label: 'Eng. Rate', value: `${(analyticsData?.avg_engagement_rate || 0).toFixed(1)}%`, icon: '📊' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['Compose','Posts','Inbox','Campaigns','Accounts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
              tab === t ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'Inbox' && unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Compose ── */}
      {tab === 'Compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* AI Generator */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
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
                  {aiLoading ? '⏳ Generating…' : '✨ Generate'}
                </button>
              </div>
              {aiResult && (
                <div className="space-y-2">
                  {Object.entries(aiResult.platform_variants || {}).slice(0,2).map(([platform, text]) => (
                    <div key={platform} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                      <div className="text-xs font-semibold text-indigo-600 mb-1 capitalize">{PLATFORM_ICONS[platform]} {platform} variant</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">{text}</div>
                      <button onClick={() => setContent(text)}
                        className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Use this →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Publish to</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      platforms.includes(p)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'}`}>
                    <span>{PLATFORM_ICONS[p]}</span> {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
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
                <button onClick={handleHashtagSuggest} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"># Suggest Hashtags</button>
              </div>
            </div>

            {/* Hashtags */}
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

            {/* Schedule + Publish */}
            <div className="flex gap-3 items-center">
              <input type="datetime-local" className="input text-sm flex-1"
                value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              <button onClick={handlePublish} disabled={!content.trim() || platforms.length === 0}
                className="btn-primary">
                {scheduledAt ? '📅 Schedule' : '🚀 Publish Now'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase">Preview</div>
            {platforms.slice(0,2).map(p => (
              <div key={p} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{PLATFORM_ICONS[p]}</span>
                  <span className="font-medium text-sm capitalize">{p}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg h-24 flex items-center justify-center text-xs text-gray-400 mb-2">📷 Media</div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {content || <span className="text-gray-400 italic">Your post content will appear here…</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts ── */}
      {tab === 'Posts' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['all','published','scheduled','draft'].map(f => (
              <button key={f} className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 capitalize hover:bg-gray-50 dark:hover:bg-gray-700/50">{f}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postList.map(post => (
              <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-1 flex-wrap">
                    {(post.platforms || []).map(p => <span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
                  </div>
                  <span className={badge(post.status)}>{post.status}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">{post.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>by {post.author_name}</span>
                  <span>{post.scheduled_at ? fmt.datetime(post.scheduled_at) : fmt.timeAgo(post.created_at)}</span>
                </div>
                {post.ai_generated && <div className="mt-2 text-xs text-indigo-500">✨ AI generated</div>}
              </div>
            ))}
            {postList.length === 0 && <div className="col-span-3 p-8 text-center text-gray-400">No posts yet. Create one with AI!</div>}
          </div>
        </div>
      )}

      {/* ── Inbox ── */}
      {tab === 'Inbox' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Unified Inbox <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{unread} unread</span></h2>
            <button onClick={async () => { await markAllRead(); refetchMessages(); }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {messageList.map(msg => (
              <div key={msg.id} onClick={async () => { await markRead(msg.id); refetchMessages(); }}
                className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!msg.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-medium text-indigo-600 flex-shrink-0">
                  {fmt.initials(msg.sender_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{msg.sender_name}</span>
                      <span className="text-xs">{PLATFORM_ICONS[msg.platform] || '💬'}</span>
                      <span className={badge(msg.message_type)}>{msg.message_type}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{fmt.timeAgo(msg.received_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                </div>
                {!msg.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"/>}
              </div>
            ))}
            {messageList.length === 0 && <div className="p-8 text-center text-gray-400">No messages</div>}
          </div>
        </div>
      )}

      {/* ── Campaigns ── */}
      {tab === 'Campaigns' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary">+ New Campaign</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignList.map(c => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                  <span className={badge(c.status)}>{c.status}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{c.objective} · {(c.platforms||[]).join(', ')}</div>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>📅 {fmt.dateShort(c.start_date)} – {fmt.dateShort(c.end_date)}</span>
                  {c.budget && <span>💰 {fmt.currency(c.budget, c.currency)}</span>}
                </div>
                <div className="text-xs text-gray-400">{c.post_count || 0} posts in campaign</div>
              </div>
            ))}
            {campaignList.length === 0 && <div className="col-span-3 p-8 text-center text-gray-400">No campaigns yet</div>}
          </div>
        </div>
      )}

      {/* ── Accounts ── */}
      {tab === 'Accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map(platform => {
            const acc = accountList.find(a => a.platform === platform);
            return (
              <div key={platform} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 ${acc?.is_connected ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{PLATFORM_ICONS[platform]}</span>
                  <div>
                    <div className="font-semibold capitalize text-gray-900 dark:text-white">{platform}</div>
                    {acc && <div className="text-xs text-gray-500">{acc.account_name}</div>}
                  </div>
                  <div className="ml-auto">
                    {acc?.is_connected
                      ? <span className="text-xs text-green-600 font-medium">● Connected</span>
                      : <span className="text-xs text-gray-400">○ Not connected</span>}
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
    </div>
  );
}
