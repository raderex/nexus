import 'package:flutter/material.dart';
class SocialScreen extends StatelessWidget {
  const SocialScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Social & CMS')),
    body: const Center(child: Text('Social & CMS — API wired, UI in progress', style: TextStyle(color: Colors.grey))),
  );
}
