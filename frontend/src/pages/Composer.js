import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Calendar, Hash, AtSign, Sparkles, X, ChevronDown, Clock, Globe, Eye, AlertCircle } from 'lucide-react';

export default function Composer() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'twitter', 'instagram']);
  const [scheduleMode, setScheduleMode] = useState('now');
  const [aiAssist, setAiAssist] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook-f', color: '#1877f2', maxChars: 63206 },
    { id: 'twitter', name: 'X / Twitter', icon: 'fab fa-x-twitter', color: '#1da1f2', maxChars: 280 },
    { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#e1306c', maxChars: 2200 },
    { id: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin-in', color: '#0a66c2', maxChars: 3000 },
    { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', color: '#ff0000', maxChars: 5000 },
    { id: 'tiktok', name: 'TikTok', icon: 'fab fa-tiktok', color: '#000000', maxChars: 2200 },
  ];

  const bestTimes = [
    { time: '9:00 AM', engagement: '6.8%', recommended: true },
    { time: '12:00 PM', engagement: '5.2%', recommended: false },
    { time: '3:00 PM', engagement: '4.1%', recommended: false },
    { time: '6:00 PM', engagement: '8.9%', recommended: true },
    { time: '9:00 PM', engagement: '7.3%', recommended: true },
  ];

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">Post Composer</h1>
          <p className="text-nexus-500 text-sm mt-1">Write once, publish everywhere</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAiAssist(!aiAssist)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              aiAssist ? 'bg-accent-pink/20 text-accent-pink border border-accent-pink/30' : 'bg-nexus-700/50 text-nexus-400'
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Assist
          </button>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="card p-4">
        <div className="text-sm font-semibold text-nexus-400 mb-3">Select Platforms</div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedPlatforms.includes(platform.id)
                  ? 'text-white shadow-lg'
                  : 'bg-nexus-700/50 text-nexus-400 hover:bg-nexus-700'
              }`}
              style={selectedPlatforms.includes(platform.id) ? { backgroundColor: platform.color } : {}}
            >
              <i className={platform.icon} />
              {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Editor */}
      <div className="card">
        <div className="p-4 border-b border-nexus-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-nexus-400">
            <Globe className="w-4 h-4" />
            <span>Posting to {selectedPlatforms.length} platforms</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {selectedPlatforms.map(pid => {
              const p = platforms.find(pl => pl.id === pid);
              const remaining = p.maxChars - charCount;
              return (
                <span key={pid} className={`flex items-center gap-1 ${remaining < 0 ? 'text-accent-red' : 'text-nexus-500'}`}>
                  <i className={p.icon} style={{ color: p.color }} />
                  {remaining}
                </span>
              );
            })}
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's on your mind? Write once, publish everywhere..."
            className="w-full min-h-[200px] bg-transparent border-none outline-none text-nexus-100 text-lg resize-none placeholder-nexus-600"
          />

          {/* AI Suggestions */}
          {aiAssist && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-accent-pink/10 border border-accent-pink/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent-pink" />
                <span className="text-sm font-semibold text-accent-pink">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {[
                  'Add hashtags: #Nexus #SocialMedia #Launch #Innovation',
                  'Mention key influencers to boost reach',
                  'Include a call-to-action: "Link in bio"',
                  'Optimal length for max engagement: 150-200 chars',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setContent(prev => prev + ' ' + suggestion)}
                    className="block w-full text-left text-sm text-nexus-300 hover:text-accent-pink transition-colors py-1"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-t border-nexus-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl hover:bg-nexus-700/50 text-nexus-400 transition-all">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-nexus-700/50 text-nexus-400 transition-all">
              <Hash className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-nexus-700/50 text-nexus-400 transition-all">
              <AtSign className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-nexus-700/50 text-nexus-400 transition-all">
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${charCount > 280 ? 'text-accent-red' : 'text-nexus-500'}`}>
              {charCount} chars
            </span>
          </div>
        </div>
      </div>

      {/* Schedule & Publish */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setScheduleMode('now')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              scheduleMode === 'now' ? 'bg-primary text-white' : 'bg-nexus-700/50 text-nexus-400'
            }`}
          >
            Publish Now
          </button>
          <button
            onClick={() => setScheduleMode('later')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              scheduleMode === 'later' ? 'bg-primary text-white' : 'bg-nexus-700/50 text-nexus-400'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setScheduleMode('queue')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              scheduleMode === 'queue' ? 'bg-primary text-white' : 'bg-nexus-700/50 text-nexus-400'
            }`}
          >
            Add to Queue
          </button>
        </div>

        {scheduleMode === 'later' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-nexus-400 mb-1 block">Date</label>
                <input type="date" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-nexus-400 mb-1 block">Time</label>
                <input type="time" className="input-field" />
              </div>
            </div>

            {/* Best Time Recommendations */}
            <div className="p-4 rounded-xl bg-nexus-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-accent-green" />
                <span className="text-sm font-semibold text-nexus-200">Best Times to Post</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {bestTimes.map((bt, i) => (
                  <button
                    key={i}
                    className={`p-3 rounded-xl text-center transition-all ${
                      bt.recommended 
                        ? 'bg-accent-green/20 border border-accent-green/30 text-accent-green' 
                        : 'bg-nexus-700/50 text-nexus-400 hover:bg-nexus-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{bt.time}</div>
                    <div className="text-xs mt-1">{bt.engagement}</div>
                    {bt.recommended && (
                      <div className="text-[10px] mt-1 bg-accent-green/30 px-1.5 py-0.5 rounded-full">Best</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <button className="w-full mt-4 btn-primary py-3 flex items-center justify-center gap-2 text-base">
          <Send className="w-5 h-5" />
          {scheduleMode === 'now' ? 'Publish Now' : scheduleMode === 'later' ? 'Schedule Post' : 'Add to Queue'}
        </button>
      </div>

      {/* Preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-nexus-100">Preview</h3>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-nexus-500" />
            <span className="text-xs text-nexus-500">How it will look</span>
          </div>
        </div>
        <div className="space-y-4">
          {selectedPlatforms.map(pid => {
            const p = platforms.find(pl => pl.id === pid);
            return (
              <div key={pid} className="p-4 rounded-xl bg-nexus-700/30 border border-nexus-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                    <i className={p.icon} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-nexus-100">Nexus</div>
                    <div className="text-xs text-nexus-500">@nexusofficial • Just now</div>
                  </div>
                </div>
                <p className="text-sm text-nexus-200 leading-relaxed">
                  {content || 'Your post preview will appear here...'}
                </p>
                <div className="mt-3 aspect-video rounded-lg bg-nexus-700/50 flex items-center justify-center">
                  <Image className="w-8 h-8 text-nexus-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
