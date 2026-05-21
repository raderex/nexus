import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Phone, MapPin, Briefcase, Star, TrendingUp, Clock, CheckCircle, MoreHorizontal, Search, Filter } from 'lucide-react';

export default function Team() {
  const [view, setView] = useState('grid');

  const teamMembers = [
    { name: 'John Doe', role: 'Super Admin', dept: 'Management', email: 'john@nexus.app', phone: '+1 555-0100', location: 'New York', status: 'online', productivity: 92, tasks: 24, hours: '8.5h', rating: 5, color: 'from-primary to-accent-pink' },
    { name: 'Sarah Mitchell', role: 'Content Manager', dept: 'Marketing', email: 'sarah@nexus.app', phone: '+1 555-0101', location: 'Los Angeles', status: 'online', productivity: 88, tasks: 18, hours: '7.5h', rating: 4, color: 'from-accent-cyan to-primary' },
    { name: 'Mike Kim', role: 'Social Analyst', dept: 'Analytics', email: 'mike@nexus.app', phone: '+1 555-0102', location: 'Chicago', status: 'away', productivity: 75, tasks: 12, hours: '6.0h', rating: 3, color: 'from-accent-green to-accent-cyan' },
    { name: 'Emily Parker', role: 'Community Manager', dept: 'Marketing', email: 'emily@nexus.app', phone: '+1 555-0103', location: 'Austin', status: 'online', productivity: 90, tasks: 21, hours: '8.0h', rating: 5, color: 'from-accent-pink to-accent-orange' },
    { name: 'Amanda Liu', role: 'Marketing Lead', dept: 'Marketing', email: 'amanda@nexus.app', phone: '+1 555-0104', location: 'Seattle', status: 'offline', productivity: 0, tasks: 0, hours: '0h', rating: 4, color: 'from-accent-orange to-accent-pink' },
    { name: 'David Chen', role: 'Senior Developer', dept: 'Engineering', email: 'david@nexus.app', phone: '+1 555-0105', location: 'San Francisco', status: 'online', productivity: 95, tasks: 15, hours: '9.0h', rating: 5, color: 'from-primary to-accent-cyan' },
  ];

  const departments = [
    { name: 'Management', members: 1, color: 'bg-primary' },
    { name: 'Marketing', members: 3, color: 'bg-accent-pink' },
    { name: 'Analytics', members: 1, color: 'bg-accent-cyan' },
    { name: 'Engineering', members: 1, color: 'bg-accent-green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">Team</h1>
          <p className="text-nexus-500 text-sm mt-1">Manage your team and permissions</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className={`w-3 h-3 rounded-full ${dept.color} mb-2`} />
            <div className="text-2xl font-black">{dept.members}</div>
            <div className="text-xs text-nexus-500">{dept.name}</div>
          </motion.div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-nexus-800 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'grid' ? 'bg-primary text-white' : 'text-nexus-400'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'list' ? 'bg-primary text-white' : 'text-nexus-400'
            }`}
          >
            List
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-500" />
            <input type="text" placeholder="Search team..." className="pl-10 pr-4 py-2 bg-nexus-800 border border-nexus-700 rounded-xl text-sm" />
          </div>
          <button className="btn-secondary text-sm flex items-center gap-1"><Filter className="w-3 h-3" /> Filter</button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-nexus-100">{member.name}</div>
                    <div className="text-xs text-nexus-500">{member.role}</div>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  member.status === 'online' ? 'bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  member.status === 'away' ? 'bg-accent-orange' :
                  'bg-nexus-600'
                }`} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-nexus-400">
                  <Briefcase className="w-3 h-3" /> {member.dept}
                </div>
                <div className="flex items-center gap-2 text-xs text-nexus-400">
                  <Mail className="w-3 h-3" /> {member.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-nexus-400">
                  <MapPin className="w-3 h-3" /> {member.location}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-nexus-700/30">
                  <div className="text-sm font-bold text-nexus-100">{member.tasks}</div>
                  <div className="text-[10px] text-nexus-500">Tasks</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-nexus-700/30">
                  <div className="text-sm font-bold text-nexus-100">{member.hours}</div>
                  <div className="text-[10px] text-nexus-500">Hours</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-nexus-700/30">
                  <div className={`text-sm font-bold ${member.productivity >= 85 ? 'text-accent-green' : member.productivity >= 70 ? 'text-accent-orange' : 'text-accent-red'}`}>
                    {member.productivity}%
                  </div>
                  <div className="text-[10px] text-nexus-500">Productivity</div>
                </div>
              </div>

              <div className="w-full h-1.5 bg-nexus-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent-pink"
                  style={{ width: `${member.productivity}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-nexus-500 uppercase">
                  <th className="p-4">Member</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tasks</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Productivity</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, i) => (
                  <tr key={i} className="border-t border-nexus-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-sm`}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-nexus-100">{member.name}</div>
                          <div className="text-xs text-nexus-500">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-nexus-400">{member.dept}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.status === 'online' ? 'bg-accent-green/20 text-accent-green' :
                        member.status === 'away' ? 'bg-accent-orange/20 text-accent-orange' :
                        'bg-nexus-600 text-nexus-400'
                      }`}>{member.status}</span>
                    </td>
                    <td className="p-4 text-nexus-100 font-semibold">{member.tasks}</td>
                    <td className="p-4 text-nexus-400">{member.hours}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-nexus-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${member.productivity >= 85 ? 'bg-accent-green' : member.productivity >= 70 ? 'bg-accent-orange' : 'bg-accent-red'}`} style={{ width: `${member.productivity}%` }} />
                        </div>
                        <span className="text-xs text-nexus-400">{member.productivity}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button className="p-2 rounded-lg hover:bg-nexus-700/50"><MoreHorizontal className="w-4 h-4 text-nexus-500" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
