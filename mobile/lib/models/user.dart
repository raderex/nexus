
class User {
  final String id;
  final String username;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String role;
  final String? avatar;

  User({ required this.id, required this.username, this.firstName,
    this.lastName, this.email, required this.role, this.avatar });

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'] ?? '', username: j['username'] ?? '',
    firstName: j['first_name'], lastName: j['last_name'],
    email: j['email'], role: j['role'] ?? 'viewer', avatar: j['avatar'],
  );

  String get fullName => [firstName, lastName].where((s) => s != null && s.isNotEmpty).join(' ').isNotEmpty
    ? [firstName, lastName].where((s) => s != null && s.isNotEmpty).join(' ')
    : username;

  String get initials => fullName.split(' ').map((n) => n.isNotEmpty ? n[0].toUpperCase() : '').take(2).join();
}
