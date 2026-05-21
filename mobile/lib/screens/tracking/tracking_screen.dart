import 'package:flutter/material.dart';
class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Time Tracking')),
    body: const Center(child: Text('Time Tracking — API wired, UI in progress', style: TextStyle(color: Colors.grey))),
  );
}
