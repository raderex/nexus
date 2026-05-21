import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, MessageSquare, Image, Plus } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState(15);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const posts = {
    3: [{ type: 'social', platforms: ['fb', 'tw'], time: '9:00 AM' }],
    5: [{ type: 'social', platforms: ['ig'], time: '6:00 PM' }],
    8: [{ type: 'social', platforms: ['fb', 'li'], time: '3:00 PM' }],
    12: [{ type: 'social', platforms: ['fb', 'tw', 'ig', 'li'], time: '9:00 AM' }, { type: 'email', time: '10:00 AM' }],
    15: [{ type: 'social', platforms: ['yt'], time: '12:00 PM' }],
    18: [{ type: 'social', platforms: ['fb', 'tw'], time: '6:00 PM' }],
    20: [{ type: 'social', platforms: ['ig', 'tt'], time: '9:00 AM' }],
    22: [{ type: 'email', time: '8:00 AM' }],
    25: [{ type: 'social', platforms: ['fb', 'tw', 'ig', 'li', 'yt'], time: '9:00 AM' }, { type: 'social', platforms: ['fb'], time: '6:00 PM' }],
    28: [{ type: 'social', platforms: ['li'], time: '3:00 PM' }],
    30: [{ type: 'social', platforms: ['ig'], time: '6:00 PM' }],
  };

  const selectedPosts = posts[selectedDate] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">Content Calendar</h1>
          <p className="text-nexus-500 text-sm mt-1">Plan and visualize your content strategy</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-nexus-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-lg hover:bg-nexus-700/50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-nexus-100">{monthNames[month]} {year}</h2>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-lg hover:bg-nexus-700/50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-semibold">Month</button>
              <button className="px-3 py-1.5 rounded-lg bg-nexus-700/50 text-nexus-400 text-xs font-semibold">Week</button>
              <button className="px-3 py-1.5 rounded-lg bg-nexus-700/50 text-nexus-400 text-xs font-semibold">Day</button>
            </div>
          </div>

          <div className="p-5">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-nexus-500 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = posts[day] || [];
                const isSelected = day === selectedDate;
                const isToday = day === 15; // Mock today

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-br from-primary to-accent-pink text-white shadow-lg scale-105' 
                        : isToday
                        ? 'bg-primary/20 text-primary-light border border-primary/30'
                        : 'hover:bg-nexus-700/50 text-nexus-300'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayPosts.length === 1 ? (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-pink'}`} />
                        ) : (
                          <div className={`h-1 rounded-full ${isSelected ? 'bg-white/80' : 'bg-accent-pink'} ${dayPosts.length > 2 ? 'w-4' : 'w-2.5'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Detail */}
        <div className="card">
          <div className="p-5 border-b border-nexus-700">
            <h3 className="font-bold text-nexus-100">
              {monthNames[month]} {selectedDate}, {year}
            </h3>
            <p className="text-xs text-nexus-500 mt-1">{selectedPosts.length} scheduled posts</p>
          </div>
          <div className="p-4 space-y-3">
            {selectedPosts.length === 0 ? (
              <div className="text-center py-8 text-nexus-500">
                <CalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No posts scheduled</p>
                <button className="mt-3 text-primary text-sm font-medium">Schedule one now</button>
              </div>
            ) : (
              selectedPosts.map((post, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-nexus-700/30 border border-nexus-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {post.type === 'social' ? (
                        <div className="flex -space-x-1">
                          {post.platforms.map((p, j) => (
                            <div key={j} className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-nexus-800 ${
                              p === 'fb' ? 'bg-[#1877f2]' : p === 'tw' ? 'bg-[#1da1f2]' : p === 'ig' ? 'bg-[#e1306c]' : p === 'li' ? 'bg-[#0a66c2]' : p === 'yt' ? 'bg-[#ff0000]' : p === 'tt' ? 'bg-black' : 'bg-nexus-600'
                            }`}>
                              <i className={`fab fa-${p === 'fb' ? 'facebook-f' : p === 'tw' ? 'x-twitter' : p === 'ig' ? 'instagram' : p === 'li' ? 'linkedin-in' : p === 'yt' ? 'youtube' : 'tiktok'}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#ea4335] flex items-center justify-center text-white text-[10px]">
                          <i className="fas fa-envelope" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-nexus-300 capitalize">{post.type}</span>
                    </div>
                    <span className="text-xs text-nexus-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.time}
                    </span>
                  </div>
                  <p className="text-sm text-nexus-400">
                    {post.type === 'social' 
                      ? `Cross-platform post to ${post.platforms.length} channels`
                      : 'Weekly newsletter dispatch'
                    }
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
