import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Heart, Share2, DollarSign, BarChart3, PieChart, Activity, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Analytics() {
  const [period, setPeriod] = useState('7d');

  const periods = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '1y', label: '1Y' },
  ];

  const socialMetrics = [
    { label: 'Total Reach', value: '128.4K', change: '+24.5%', up: true, icon: Eye },
    { label: 'Engagements', value: '45.2K', change: '+18.2%', up: true, icon: Heart },
    { label: 'Shares', value: '8.7K', change: '+32.1%', up: true, icon: Share2 },
    { label: 'Followers', value: '166.4K', change: '+15.3%', up: true, icon: Users },
  ];

  const businessMetrics = [
    { label: 'Revenue', value: '$24.5K', change: '+12.8%', up: true, icon: DollarSign },
    { label: 'New Leads', value: '48', change: '+28.4%', up: true, icon: TrendingUp },
    { label: 'Conversion', value: '12.4%', change: '+3.2%', up: true, icon: BarChart3 },
    { label: 'Team Productivity', value: '87.2%', change: '+5.1%', up: true, icon: Activity },
  ];

  const platformBreakdown = [
    { platform: 'Facebook', percentage: 35, color: '#1877f2', reach: '45K', engagement: '4.2%' },
    { platform: 'Instagram', percentage: 28, color: '#e1306c', reach: '36K', engagement: '5.1%' },
    { platform: 'X / Twitter', percentage: 20, color: '#1da1f2', reach: '26K', engagement: '3.8%' },
    { platform: 'LinkedIn', percentage: 12, color: '#0a66c2', reach: '15K', engagement: '2.9%' },
    { platform: 'YouTube', percentage: 5, color: '#ff0000', reach: '6K', engagement: '6.7%' },
  ];

  const topPosts = [
    { content: 'Product launch announcement 🚀', reach: '45.2K', engagement: '3.2K', platform: 'facebook', performance: 98 },
    { content: 'Tutorial: Maximize your social ROI', reach: '24.1K', engagement: '2.8K', platform: 'youtube', performance: 94 },
    { content: 'Behind the scenes at Nexus HQ', reach: '18.7K', engagement: '1.5K', platform: 'instagram', performance: 87 },
    { content: 'Weekly analytics thread 🧵', reach: '12.4K', engagement: '890', platform: 'twitter', performance: 82 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">Analytics</h1>
          <p className="text-nexus-500 text-sm mt-1">Deep insights into your business</p>
        </div>
        <div className="flex gap-1 bg-nexus-800 rounded-xl p-1">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.id ? 'bg-primary text-white' : 'text-nexus-400 hover:text-nexus-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Social Metrics */}
      <div>
        <h2 className="text-lg font-bold text-nexus-100 mb-4">Social Media Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {socialMetrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <metric.icon className="w-5 h-5 text-primary" />
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${metric.up ? 'text-accent-green' : 'text-accent-red'}`}>
                  {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-black">{metric.value}</div>
              <div className="text-xs text-nexus-500 mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h2 className="text-lg font-bold text-nexus-100 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {businessMetrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <metric.icon className="w-5 h-5 text-accent-cyan" />
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${metric.up ? 'text-accent-green' : 'text-accent-red'}`}>
                  {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-black">{metric.value}</div>
              <div className="text-xs text-nexus-500 mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <div className="card">
          <div className="p-5 border-b border-nexus-700">
            <h3 className="font-bold text-nexus-100">Platform Breakdown</h3>
          </div>
          <div className="p-5 space-y-4">
            {platformBreakdown.map((platform, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: platform.color }}>
                      <i className={`fab fa-${platform.platform === 'X / Twitter' ? 'x-twitter' : platform.platform.toLowerCase()}`} />
                    </div>
                    <span className="text-sm font-medium text-nexus-200">{platform.platform}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-nexus-100">{platform.percentage}%</div>
                    <div className="text-xs text-nexus-500">{platform.reach} reach</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-nexus-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${platform.percentage}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="card">
          <div className="p-5 border-b border-nexus-700">
            <h3 className="font-bold text-nexus-100">Top Performing Posts</h3>
          </div>
          <div className="divide-y divide-nexus-700/50">
            {topPosts.map((post, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="text-2xl font-black text-nexus-700">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-nexus-200 truncate">{post.content}</p>
                  <div className="flex items-center gap-3 text-xs text-nexus-500 mt-1">
                    <span>{post.reach} reach</span>
                    <span>{post.engagement} engagement</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-nexus-700 flex items-center justify-center relative">
                  <svg className="w-12 h-12 -rotate-90 absolute">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-nexus-700" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" 
                      strokeDasharray={`${post.performance * 1.26} 126`}
                      className="text-primary"
                    />
                  </svg>
                  <span className="text-xs font-bold text-nexus-100">{post.performance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Attribution */}
      <div className="card">
        <div className="p-5 border-b border-nexus-700">
          <h3 className="font-bold text-nexus-100">Revenue Attribution by Platform</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-5 gap-4">
            {[
              { platform: 'Facebook', revenue: '$8,500', deals: 12, color: '#1877f2' },
              { platform: 'Instagram', revenue: '$6,800', deals: 8, color: '#e1306c' },
              { platform: 'LinkedIn', revenue: '$3,200', deals: 5, color: '#0a66c2' },
              { platform: 'X / Twitter', revenue: '$4,200', deals: 6, color: '#1da1f2' },
              { platform: 'Email', revenue: '$2,100', deals: 4, color: '#ea4335' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 rounded-xl bg-nexus-700/30"
              >
                <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                  <i className={`fab fa-${item.platform === 'X / Twitter' ? 'x-twitter' : item.platform.toLowerCase()}`} />
                </div>
                <div className="text-lg font-bold text-nexus-100">{item.revenue}</div>
                <div className="text-xs text-nexus-500">{item.deals} deals</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
