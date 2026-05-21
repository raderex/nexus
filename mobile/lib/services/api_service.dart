
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_URL', defaultValue: 'http://10.0.2.2:8000/api',
  );

  static final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  static const _storage = FlutterSecureStorage();

  static void init() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final token = await _storage.read(key: 'access_token');
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(error.requestOptions);
            return handler.resolve(response);
          }
        }
        return handler.next(error);
      },
    ));
  }

  static Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.read(key: 'refresh_token');
      if (refresh == null) return false;
      final resp = await Dio().post('$baseUrl/auth/token/refresh/', data: {'refresh': refresh});
      await _storage.write(key: 'access_token', value: resp.data['access']);
      return true;
    } catch (_) { return false; }
  }

  static Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
  }

  static Future<void> clearTokens() async {
    await _storage.deleteAll();
  }

  static Future<Response> get(String path, {Map<String, dynamic>? params}) =>
    _dio.get(path, queryParameters: params);

  static Future<Response> post(String path, {dynamic data}) =>
    _dio.post(path, data: data);

  static Future<Response> patch(String path, {dynamic data}) =>
    _dio.patch(path, data: data);

  static Future<Response> delete(String path) => _dio.delete(path);

  // ── Auth ──────────────────────────────────────────────────────────────────
  static Future<Response> login(String username, String password) =>
    _dio.post('/auth/token/', data: {'username': username, 'password': password});

  static Future<Response> getMe() => get('/users/me/');

  // ── Dashboard ─────────────────────────────────────────────────────────────
  static Future<Response> dashboardStats(String orgId) =>
    get('/organizations/$orgId/dashboard_stats/');

  // ── HRM ───────────────────────────────────────────────────────────────────
  static Future<Response> getEmployees({Map<String, dynamic>? params}) =>
    get('/hrm/employees/', params: params);

  static Future<Response> getAttendanceSummary() => get('/hrm/attendances/today_summary/');

  static Future<Response> getLeaveRequests({Map<String, dynamic>? params}) =>
    get('/hrm/leave-requests/', params: params);

  static Future<Response> approveLeave(String id) =>
    post('/hrm/leave-requests/$id/approve/');

  static Future<Response> rejectLeave(String id, String comment) =>
    post('/hrm/leave-requests/$id/reject/', data: {'comment': comment});

  // ── CRM ───────────────────────────────────────────────────────────────────
  static Future<Response> getContacts({Map<String, dynamic>? params}) =>
    get('/crm/contacts/', params: params);

  static Future<Response> getDeals({Map<String, dynamic>? params}) =>
    get('/crm/deals/', params: params);

  // ── PM ────────────────────────────────────────────────────────────────────
  static Future<Response> getProjects({Map<String, dynamic>? params}) =>
    get('/pm/projects/', params: params);

  static Future<Response> getTasks({Map<String, dynamic>? params}) =>
    get('/pm/tasks/', params: params);

  static Future<Response> updateTaskStatus(String id, String status) =>
    post('/pm/tasks/$id/update_status/', data: {'status': status});

  // ── Time Tracking ─────────────────────────────────────────────────────────
  static Future<Response> startTimer({String? taskId, String? projectId, String? description}) =>
    post('/tracking/time-logs/start_timer/', data: {
      if (taskId != null) 'task': taskId,
      if (projectId != null) 'project': projectId,
      if (description != null) 'description': description,
      'source': 'mobile',
    });

  static Future<Response> stopTimer(String id) =>
    post('/tracking/time-logs/$id/stop_timer/');

  static Future<Response> getRunningTimer() => get('/tracking/time-logs/running/');
  static Future<Response> getTimeSummary() => get('/tracking/time-logs/my_summary/');

  // ── Social ────────────────────────────────────────────────────────────────
  static Future<Response> getSocialAccounts() => get('/social/accounts/');

  static Future<Response> getPosts({Map<String, dynamic>? params}) =>
    get('/social/posts/', params: params);

  static Future<Response> createPost(Map<String, dynamic> data) =>
    post('/social/posts/', data: data);

  static Future<Response> getMessages({Map<String, dynamic>? params}) =>
    get('/social/messages/', params: params);

  static Future<Response> getUnreadCount() => get('/social/messages/unread_count/');

  static Future<Response> generateAIPost(String prompt, String tone, List<String> platforms) =>
    post('/social/posts/generate_ai/', data: {
      'prompt': prompt, 'tone': tone, 'platforms': platforms, 'include_hashtags': true,
    });

  // ── ATS ───────────────────────────────────────────────────────────────────
  static Future<Response> getJobs({Map<String, dynamic>? params}) =>
    get('/ats/jobs/', params: params);

  static Future<Response> getApplicants({Map<String, dynamic>? params}) =>
    get('/ats/applicants/', params: params);
}
