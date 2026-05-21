import 'package:flutter/material.dart';
import 'dashboard/dashboard_screen.dart';
import 'hrm/hrm_screen.dart';
import 'crm/crm_screen.dart';
import 'pm/pm_screen.dart';
import 'tracking/tracking_screen.dart';
import 'social/social_screen.dart';
import 'ats/ats_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _idx = 0;
  final _screens = const [
    DashboardScreen(), CRMScreen(), HRMScreen(),
    ATSScreen(), PMScreen(), TrackingScreen(), SocialScreen(),
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
    body: IndexedStack(index: _idx, children: _screens),
    bottomNavigationBar: NavigationBar(
      selectedIndex: _idx,
      onDestinationSelected: (i) => setState(() => _idx = i),
      labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
      destinations: const [
        NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Home'),
        NavigationDestination(icon: Icon(Icons.handshake_outlined), selectedIcon: Icon(Icons.handshake), label: 'CRM'),
        NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'HR'),
        NavigationDestination(icon: Icon(Icons.work_outline), selectedIcon: Icon(Icons.work), label: 'Recruit'),
        NavigationDestination(icon: Icon(Icons.task_outlined), selectedIcon: Icon(Icons.task), label: 'Projects'),
        NavigationDestination(icon: Icon(Icons.timer_outlined), selectedIcon: Icon(Icons.timer), label: 'Time'),
        NavigationDestination(icon: Icon(Icons.phone_iphone_outlined), selectedIcon: Icon(Icons.phone_iphone), label: 'Social'),
      ],
    ),
  );
}
