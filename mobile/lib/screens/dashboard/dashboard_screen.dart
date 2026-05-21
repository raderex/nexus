
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  @override
  void initState() { super.initState(); _loadStats(); }

  Future<void> _loadStats() async {
    try {
      final orgRes = await ApiService.get('/organizations/');
      final orgs = orgRes.data['results'] ?? orgRes.data ?? [];
      if (orgs.isNotEmpty) {
        final orgId = orgs[0]['id'];
        final statsRes = await ApiService.dashboardStats(orgId);
        if (mounted) setState(() { _stats = statsRes.data ?? {}; _loading = false; });
      } else { setState(() => _loading = false); }
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final scheme = Theme.of(context).colorScheme;

    final cards = [
      {'label': 'Employees', 'value': _stats['total_employees']?.toString() ?? '—', 'icon': Icons.people, 'color': Colors.indigo},
      {'label': 'Projects', 'value': _stats['total_projects']?.toString() ?? '—', 'icon': Icons.task, 'color': Colors.blue},
      {'label': 'Open Deals', 'value': _stats['total_deals']?.toString() ?? '—', 'icon': Icons.handshake, 'color': Colors.green},
      {'label': 'Open Tasks', 'value': _stats['open_tasks']?.toString() ?? '—', 'icon': Icons.check_circle, 'color': Colors.purple},
      {'label': 'Contacts', 'value': _stats['total_contacts']?.toString() ?? '—', 'icon': Icons.contacts, 'color': Colors.orange},
      {'label': 'Messages', 'value': _stats['unread_messages']?.toString() ?? '—', 'icon': Icons.message, 'color': Colors.pink},
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Hi, \${user?.firstName ?? user?.username ?? ''} 👋', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          Text('Welcome back', style: TextStyle(fontSize: 12, color: scheme.onSurface.withOpacity(0.6))),
        ]),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () { setState(() => _loading = true); _loadStats(); }),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Overview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.4,
                  ),
                  itemCount: cards.length,
                  itemBuilder: (_, i) {
                    final card = cards[i];
                    final color = card['color'] as MaterialColor;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: Icon(card['icon'] as IconData, color: color, size: 20),
                          ),
                          const Spacer(),
                          Text(card['value'] as String, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                          Text(card['label'] as String, style: TextStyle(fontSize: 12, color: scheme.onSurface.withOpacity(0.6))),
                        ]),
                      ),
                    );
                  },
                ),
              ],
            ),
      ),
    );
  }
}
