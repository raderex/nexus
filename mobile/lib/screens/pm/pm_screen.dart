import 'package:flutter/material.dart';
class PMScreen extends StatelessWidget {
  const PMScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Projects')),
    body: const Center(child: Text('Projects — API wired, UI in progress', style: TextStyle(color: Colors.grey))),
  );
}
