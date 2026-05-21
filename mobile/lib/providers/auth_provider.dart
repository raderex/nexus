
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  Map<String, dynamic>? _org;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  Map<String, dynamic>? get org => _org;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String? get error => _error;

  Future<bool> login(String username, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final res = await ApiService.login(username, password);
      await ApiService.saveTokens(res.data['access'], res.data['refresh']);
      final meRes = await ApiService.getMe();
      _user = User.fromJson(meRes.data);
      _loading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = 'Invalid username or password';
      _loading = false; notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearTokens();
    _user = null; _org = null; notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    try {
      final res = await ApiService.getMe();
      _user = User.fromJson(res.data);
      notifyListeners();
    } catch (_) {}
  }
}
