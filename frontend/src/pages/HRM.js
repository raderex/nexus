import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { hrmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '@kaushalparajuli/react-crud-ui';
import { Users, Building2, DollarSign, Clock, Search, Plus } from 'lucide-react';

export default function HRM() {
  const [tab, setTab] = useState('employees');
  const [search, setSearch] = useState('');

  const { data: employeesData } = useApi(() => hrmAPI.employees({ search }), [search], { initial: { results: [] } });
  const { data: departmentsData } = useApi(() => hrmAPI.departments({}), [], { initial: { results: [] } });
  const { data: payrollsData } = useApi(() => hrmAPI.payrolls({}), [], { initial: { results: [] } });

  const employees = employeesData?.results || employeesData || [];
  const departments = departmentsData?.results || departmentsData || [];
  const payrolls = payrollsData?.results || payrollsData || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HRM</h1>
          <p className="text-gray-500 text-sm mt-1">Human Resource Management</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Employee</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <div className="text-2xl font-bold">{employees.length}</div>
            <div className="text-xs text-gray-500">Total Employees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <div className="text-2xl font-bold">{departments.length}</div>
            <div className="text-xs text-gray-500">Departments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div className="text-2xl font-bold">Payroll</div>
            <div className="text-xs text-gray-500">Monthly Payroll</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div className="text-2xl font-bold">94.2%</div>
            <div className="text-xs text-gray-500">Attendance Rate</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800">
        {['employees', 'departments', 'payroll', 'attendance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 ${
              tab === t ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {employees.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No employees found.</div>
            ) : employees.map((emp, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {emp.user?.first_name?.[0] || emp.user?.username?.[0] || 'E'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{emp.user?.first_name} {emp.user?.last_name}</div>
                  <div className="text-xs text-gray-500">{emp.job_title} • {emp.department?.name || 'N/A'}</div>
                </div>
                <div className="text-sm text-gray-500">{fmt.currency(emp.salary)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'departments' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                </div>
                <div className="text-sm text-gray-500 mb-1">Manager: {dept.manager?.username || 'None'}</div>
                <div className="text-sm text-gray-500">Budget: {fmt.currency(dept.budget)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'payroll' && (
        <Card>
          <CardHeader>
             <CardTitle>Payroll</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Base Salary</th>
                  <th className="p-4 font-medium">Bonus</th>
                  <th className="p-4 font-medium">Deductions</th>
                  <th className="p-4 font-medium">Net Pay</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {payrolls.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No payrolls found.</td></tr>
                ) : payrolls.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-900 dark:text-gray-100 font-medium">{p.employee?.user?.username}</td>
                    <td className="p-4 text-gray-500">{fmt.currency(p.base_salary)}</td>
                    <td className="p-4 text-green-600 dark:text-green-400">{fmt.currency(p.bonus)}</td>
                    <td className="p-4 text-red-600 dark:text-red-400">-{fmt.currency(p.deductions)}</td>
                    <td className="p-4 text-gray-900 dark:text-white font-bold">{fmt.currency(p.net_pay)}</td>
                    <td className="p-4">
                      {badge(p.status, { paid:'green', pending:'yellow', processing:'blue' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'attendance' && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Attendance calendar tracking is currently under development.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
