import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, AtSign, Star, Reply, Archive, Trash2, Search, Filter, ChevronLeft, Send } from 'lucide-react';

export default function Inbox() {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const channels = [
    { id: 'all', name: 'All Messages', icon: Mail, count: 24 },
    { id: 'facebook', name: 'Facebook', icon: () => <i className="fab fa-facebook-f" />, count: 5, color: '#1877f2' },
    { id: 'twitter', name: 'X / Twitter', icon: () => <i className="fab fa-x-twitter" />, count: 8, color: '#1da1f2' },
    { id: 'instagram', name: 'Instagram', icon: () => <i className="fab fa-instagram" />, count: 7, color: '#e1306c' },
    { id: 'linkedin', name: 'LinkedIn', icon: () => <i className="fab fa-linkedin-in" />, count: 2, color: '#0a66c2' },
    { id: 'email', name: 'Gmail', icon: () => <i className="fas fa-envelope" />, count: 2, color: '#ea4335' },
  ];

  const messages = [
    { id: 1, sender: 'Sarah Mitchell', avatar: 'SM', platform: 'facebook', preview: 'Hey! I saw your latest product update. Would love to discuss a potential partnership...', time: '2 min ago', unread: true, sentiment: 'positive' },
    { id: 2, sender: 'Emily Parker', avatar: 'EP', platform: 'instagram', preview: 'Your content strategy is amazing! Can you share what tools you use for scheduling?', time: '12 min ago', unread: true, sentiment: 'positive' },
    { id: 3, sender: 'James Davidson', avatar: 'JD', platform: 'twitter', preview: 'Just signed up for the beta. The unified inbox feature is exactly what we needed!', time: '1 hour ago', unread: false, sentiment: 'positive' },
    { id: 4, sender: 'Support Ticket #2841', avatar: 'ST', platform: 'email', preview: 'Issue with invoice generation - getting 500 error when trying to create new invoice', time: '2 hours ago', unread: true, sentiment: 'negative' },
    { id: 5, sender: 'Michael Kim', avatar: 'MK', platform: 'linkedin', preview: 'Great post on data-driven marketing. Would love to connect and explore collaboration.', time: '3 hours ago', unread: false, sentiment: 'positive' },
    { id: 6, sender: 'Amanda Liu', avatar: 'AL', platform: 'email', preview: 'Q2 budget review meeting scheduled for tomorrow at 2 PM. Please prepare your reports.', time: '5 hours ago', unread: false, sentiment: 'neutral' },
  ];

  const filteredMessages = selectedChannel === 'all' 
    ? messages 
    : messages.filter(m => m.platform === selectedChannel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">Unified Inbox</h1>
          <p className="text-nexus-500 text-sm mt-1">All messages in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-nexus-400">{messages.filter(m => m.unread).length} unread</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Channels */}
        <div className="lg:col-span-1 space-y-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-500" />
            <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2.5 bg-nexus-800 border border-nexus-700 rounded-xl text-sm" />
          </div>
          {channels.map(channel => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedChannel === channel.id
                    ? 'bg-primary/20 text-primary-light border border-primary/20'
                    : 'text-nexus-400 hover:bg-nexus-700/50'
                }`}
              >
                {typeof Icon === 'function' ? (
                  <span style={{ color: channel.color }}><Icon /></span>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="flex-1 text-left">{channel.name}</span>
                {channel.count > 0 && (
                  <span className="text-xs bg-nexus-700 text-nexus-400 px-2 py-0.5 rounded-full">{channel.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Message List */}
        <div className="lg:col-span-3">
          {selectedMessage ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="p-4 border-b border-nexus-700 flex items-center gap-3">
                <button onClick={() => setSelectedMessage(null)} className="p-2 rounded-lg hover:bg-nexus-700/50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center text-white font-bold text-sm">
                  {selectedMessage.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-nexus-100">{selectedMessage.sender}</div>
                  <div className="text-xs text-nexus-500">{selectedMessage.time}</div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-nexus-700/50"><Star className="w-4 h-4 text-nexus-500" /></button>
                  <button className="p-2 rounded-lg hover:bg-nexus-700/50"><Archive className="w-4 h-4 text-nexus-500" /></button>
                  <button className="p-2 rounded-lg hover:bg-nexus-700/50"><Trash2 className="w-4 h-4 text-nexus-500" /></button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-nexus-200 leading-relaxed">{selectedMessage.preview}</p>
              </div>
              <div className="p-4 border-t border-nexus-700">
                <div className="flex gap-3">
                  <input type="text" placeholder="Type your reply..." className="flex-1 input-field" />
                  <button className="btn-primary px-4"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-primary/30 ${
                    msg.unread ? 'bg-nexus-700/30 border-nexus-700/50' : 'bg-nexus-800/50 border-nexus-700/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-nexus-100 text-sm">{msg.sender}</span>
                          {msg.unread && <span className="w-2 h-2 rounded-full bg-primary" />}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            msg.sentiment === 'positive' ? 'bg-accent-green/20 text-accent-green' :
                            msg.sentiment === 'negative' ? 'bg-accent-red/20 text-accent-red' :
                            'bg-nexus-600 text-nexus-400'
                          }`}>{msg.sentiment}</span>
                        </div>
                        <span className="text-xs text-nexus-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-nexus-400 line-clamp-2">{msg.preview}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
