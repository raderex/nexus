
import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class HRMScreen extends StatefulWidget {
  const HRMScreen({super.key});

  @override
  State<HRMScreen> createState() => _HRMScreenState();
}

class _HRMScreenState extends State<HRMScreen> with SingleTickerProviderStateMixin {
  late TabController _tc;
  List _employees = [];
  List _leaveRequests = [];
  Map _attendanceSummary = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tc = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() { _tc.dispose(); super.dispose(); }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.getEmployees(),
        ApiService.getLeaveRequests(params: {'status': 'pending'}),
        ApiService.getAttendanceSummary(),
      ]);
      if (mounted) setState(() {
        _employees = results[0].data['results'] ?? results[0].data ?? [];
        _leaveRequests = results[1].data['results'] ?? results[1].data ?? [];
        _attendanceSummary = results[2].data ?? {};
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HR Management'),
        bottom: TabBar(controller: _tc, tabs: const [
          Tab(text: 'Employees'), Tab(text: 'Leave'), Tab(text: 'Attendance'),
        ]),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : TabBarView(controller: _tc, children: [
            _buildEmployees(),
            _buildLeaveRequests(),
            _buildAttendance(),
          ]),
    );
  }

  Widget _buildEmployees() => ListView.separated(
    padding: const EdgeInsets.all(16),
    itemCount: _employees.length,
    separatorBuilder: (_, __) => const SizedBox(height: 8),
    itemBuilder: (_, i) {
      final emp = _employees[i];
      final name = '\${emp['user']?['first_name'] ?? ''} \${emp['user']?['last_name'] ?? ''}'.trim();
      final initials = name.split(' ').map((n) => n.isNotEmpty ? n[0].toUpperCase() : '').take(2).join();
      return Card(
        child: ListTile(
          leading: CircleAvatar(child: Text(initials.isEmpty ? '?' : initials)),
          title: Text(name.isEmpty ? emp['employee_code'] ?? '?' : name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('\${emp['job_title'] ?? ''} • \${emp['department_name'] ?? 'No dept'}'),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: emp['is_active'] == true ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(emp['is_active'] == true ? 'Active' : 'Inactive',
              style: TextStyle(fontSize: 11, color: emp['is_active'] == true ? Colors.green : Colors.grey, fontWeight: FontWeight.w500)),
          ),
        ),
      );
    },
  );

  Widget _buildLeaveRequests() => ListView.separated(
    padding: const EdgeInsets.all(16),
    itemCount: _leaveRequests.length,
    separatorBuilder: (_, __) => const SizedBox(height: 8),
    itemBuilder: (_, i) {
      final lr = _leaveRequests[i];
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(lr['employee_name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.bold))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: Text(lr['status'] ?? 'pending', style: const TextStyle(fontSize: 11, color: Colors.orange, fontWeight: FontWeight.w500)),
              ),
            ]),
            const SizedBox(height: 4),
            Text('\${lr['leave_type_name'] ?? ''} • \${lr['days']} days', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            Text('\${lr['start_date'] ?? ''} — \${lr['end_date'] ?? ''}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            if ((lr['reason'] ?? '').isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(lr['reason'], style: const TextStyle(fontSize: 13)),
            ],
            if (lr['status'] == 'pending') ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: OutlinedButton(
                  onPressed: () async { await ApiService.rejectLeave(lr['id'], ''); _load(); },
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Reject'),
                )),
                const SizedBox(width: 8),
                Expanded(child: FilledButton(
                  onPressed: () async { await ApiService.approveLeave(lr['id']); _load(); },
                  child: const Text('Approve'),
                )),
              ]),
            ],
          ]),
        ),
      );
    },
  );

  Widget _buildAttendance() => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            const Text('Today's Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _attStat('Present', _attendanceSummary['present'] ?? 0, Colors.green),
              _attStat('Absent', _attendanceSummary['absent'] ?? 0, Colors.red),
              _attStat('Late', _attendanceSummary['late'] ?? 0, Colors.orange),
              _attStat('On Leave', _attendanceSummary['on_leave'] ?? 0, Colors.blue),
            ]),
          ]),
        ),
      ),
    ],
  );

  Widget _attStat(String label, dynamic value, Color color) => Column(children: [
    Text('\$value', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
    Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
  ]);
}
