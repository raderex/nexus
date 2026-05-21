
import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class CRMScreen extends StatefulWidget {
  const CRMScreen({super.key});

  @override
  State<CRMScreen> createState() => _CRMScreenState();
}

class _CRMScreenState extends State<CRMScreen> with SingleTickerProviderStateMixin {
  late TabController _tc;
  List _contacts = [];
  List _deals = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _tc = TabController(length: 2, vsync: this); _load(); }

  @override
  void dispose() { _tc.dispose(); super.dispose(); }

  Future<void> _load() async {
    try {
      final results = await Future.wait([ApiService.getContacts(), ApiService.getDeals()]);
      if (mounted) setState(() {
        _contacts = results[0].data['results'] ?? results[0].data ?? [];
        _deals = results[1].data['results'] ?? results[1].data ?? [];
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('CRM'),
      bottom: TabBar(controller: _tc, tabs: const [Tab(text: 'Contacts'), Tab(text: 'Deals')]),
    ),
    body: _loading ? const Center(child: CircularProgressIndicator())
      : TabBarView(controller: _tc, children: [_buildContacts(), _buildDeals()]),
    floatingActionButton: FloatingActionButton(onPressed: () {}, child: const Icon(Icons.add)),
  );

  Widget _buildContacts() => ListView.builder(
    padding: const EdgeInsets.all(16),
    itemCount: _contacts.length,
    itemBuilder: (_, i) {
      final c = _contacts[i];
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(child: Text((c['first_name'] ?? '?')[0].toUpperCase())),
          title: Text('\${c['first_name'] ?? ''} \${c['last_name'] ?? ''}'.trim(), style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('\${c['company'] ?? ''}\${c['email'] != null ? ' • \${c['email']}' : ''}'),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: Colors.indigo.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Text(c['type'] ?? '—', style: const TextStyle(fontSize: 11, color: Colors.indigo, fontWeight: FontWeight.w500)),
          ),
        ),
      );
    },
  );

  Widget _buildDeals() => ListView.builder(
    padding: const EdgeInsets.all(16),
    itemCount: _deals.length,
    itemBuilder: (_, i) {
      final d = _deals[i];
      final statusColor = d['status'] == 'won' ? Colors.green : d['status'] == 'lost' ? Colors.red : Colors.blue;
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          title: Text(d['title'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Stage: \${d['stage'] ?? '—'} • \${d['probability'] ?? 0}%'),
          trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('\${d['currency'] ?? ''} \${d['value'] ?? 0}', style: TextStyle(fontWeight: FontWeight.bold, color: statusColor)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Text(d['status'] ?? '—', style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w500)),
            ),
          ]),
        ),
      );
    },
  );
}
