import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, DollarSign, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Search } from 'lucide-react';

export default function HRM() {
  const [tab, setTab] = useState('employees');

  const employees = [
    { name: 'John Doe', role: 'Super Admin', dept: 'Management', salary: '$8,500/mo', status: 'active', attendance: 'present', hours: '8.5h' },
    { name: 'Sarah Mitchell', role: 'Content Manager', dept: 'Marketing', salary: '$5,200/mo', status: 'active', attendance: 'present', hours: '7.5h' },
    { name: 'Mike Kim', role: 'Social Analyst', dept: 'Analytics', salary: '$4,800/mo', status: 'active', attendance: 'late', hours: '6.0h' },
    { name: 'Emily Parker', role: 'Community Manager', dept: 'Marketing', salary: '$4,500/mo', status: 'active', attendance: 'present', hours: '8.0h' },
    { name: 'Amanda Liu', role: 'Marketing Lead', dept: 'Marketing', salary: '$6,200/mo', status: 'active', attendance: 'on_leave', hours: '0h' },
  ];

  const departments = [
    { name: 'Management', employees: 1, manager: 'John Doe', budget: '$102K/yr' },
    { name: 'Marketing', employees: 3, manager: 'Amanda Liu', budget: '$195K/yr' },
    { name: 'Analytics', employees: 1, manager: 'Mike Kim', budget: '$58K/yr' },
    { name: 'Engineering', employees: 4, manager: 'TBD', budget: '$320K/yr' },
    { name: 'Sales', employees: 2, manager: 'TBD', budget: '$144K/yr' },
  ];

  const payrolls = [
    { employee: 'John Doe', period: 'May 2026', base: '$8,500', bonus: '$500', deductions: '$850', tax: '$1,700', net: '$6,450', status: 'paid' },
    { employee: 'Sarah Mitchell', period: 'May 2026', base: '$5,200', bonus: '$200', deductions: '$520', tax: '$1,040', net: '$3,840', status: 'paid' },
    { employee: 'Mike Kim', period: 'May 2026', base: '$4,800', bonus: '$0', deductions: '$480', tax: '$960', net: '$3,360', status: 'approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-nexus-100">HRM</h1>
          <p className="text-nexus-500 text-sm mt-1">Human Resource Management</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Employee</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <Users className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-black">12</div>
          <div className="text-xs text-nexus-500">Total Employees</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <Building2 className="w-5 h-5 text-accent-cyan mb-2" />
          <div className="text-2xl font-black">5</div>
          <div className="text-xs text-nexus-500">Departments</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <DollarSign className="w-5 h-5 text-accent-green mb-2" />
          <div className="text-2xl font-black">$68.2K</div>
          <div className="text-xs text-nexus-500">Monthly Payroll</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card">
          <Clock className="w-5 h-5 text-accent-orange mb-2" />
          <div className="text-2xl font-black">94.2%</div>
          <div className="text-xs text-nexus-500">Attendance Rate</div>
        </motion.div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['employees', 'departments', 'payroll', 'attendance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-primary text-white' : 'text-nexus-400 hover:text-nexus-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="card">
          <div className="p-4 border-b border-nexus-700 flex items-center gap-3">
            <Search className="w-4 h-4 text-nexus-500" />
            <input type="text" placeholder="Search employees..." className="flex-1 bg-transparent border-none outline-none text-sm" />
          </div>
          <div className="divide-y divide-nexus-700/50">
            {employees.map((emp, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-nexus-700/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center text-white font-bold text-xs">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-nexus-100 text-sm">{emp.name}</div>
                  <div className="text-xs text-nexus-500">{emp.role} • {emp.dept}</div>
                </div>
                <div className="text-sm text-nexus-400">{emp.salary}</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    emp.attendance === 'present' ? 'bg-accent-green' :
                    emp.attendance === 'late' ? 'bg-accent-orange' :
                    emp.attendance === 'on_leave' ? 'bg-accent-red' : 'bg-nexus-500'
                  }`} />
                  <span className="text-xs text-nexus-400">{emp.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'departments' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-nexus-100">{dept.name}</h3>
                <span className="text-xs bg-nexus-700/50 text-nexus-400 px-2 py-1 rounded-full">{dept.employees} people</span>
              </div>
              <div className="text-sm text-nexus-400 mb-1">Manager: {dept.manager}</div>
              <div className="text-sm text-nexus-400">Budget: {dept.budget}</div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'payroll' && (
        <div className="card">
          <div className="p-5 border-b border-nexus-700">
            <h3 className="font-bold text-nexus-100">Payroll — May 2026</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-nexus-500 uppercase">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Base Salary</th>
                  <th className="p-4">Bonus</th>
                  <th className="p-4">Deductions</th>
                  <th className="p-4">Tax</th>
                  <th className="p-4">Net Pay</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => (
                  <tr key={i} className="border-t border-nexus-700/50">
                    <td className="p-4 text-nexus-200 font-medium">{p.employee}</td>
                    <td className="p-4 text-nexus-400">{p.base}</td>
                    <td className="p-4 text-accent-green">{p.bonus}</td>
                    <td className="p-4 text-accent-red">-{p.deductions}</td>
                    <td className="p-4 text-accent-red">-{p.tax}</td>
                    <td className="p-4 text-nexus-100 font-bold">{p.net}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.status === 'paid' ? 'bg-accent-green/20 text-accent-green' : 'bg-primary/20 text-primary-light'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card p-8 text-center text-nexus-400">
          Attendance calendar with check-in/check-out, late tracking, and leave management.
        </div>
      )}
    </div>
  );
}
