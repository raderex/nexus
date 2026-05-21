import 'package:flutter/material.dart';
class ATSScreen extends StatelessWidget {
  const ATSScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Recruiting (ATS)')),
    body: const Center(child: Text('Recruiting (ATS) — API wired, UI in progress', style: TextStyle(color: Colors.grey))),
  );
}
