import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { 
  Activity, 
  Download, 
  Filter, 
  Search, 
  RefreshCw, 
  Trash2, 
  Calendar,
  User,
  Target,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const ChangeLog = () => {
  const { currentTheme, currentColorScheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    event_type: '',
    target_type: '',
    search: '',
    start_date: '',
    end_date: '',
    limit: 50
  });
  const [showFilters, setShowFilters] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (user) {
      fetchLogs();
      fetchStats();
      fetchEventTypes();
    }
  }, [page, filters, user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters
      });

      const response = await api.get(`/changelog?${params}`);
      
      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching change logs:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (error.response?.status === 404) {
        setError('⚠️ Changelog routes not found. Please restart the backend server! See RESTART_BACKEND.md for instructions.');
      } else if (error.response?.data?.message) {
        setError(`Error: ${error.response.data.message}`);
      } else {
        setError(`Failed to fetch change logs: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/changelog/stats?${params}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats if error
      setStats({
        total: 0,
        by_event_type: [],
        top_users: []
      });
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await api.get('/changelog/event-types');
      setEventTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
      // Set default event types
      setEventTypes([
        'user_login',
        'user_logout',
        'user_created',
        'user_updated',
        'user_deleted',
        'task_created',
        'task_updated',
        'task_deleted',
        'team_created',
        'team_updated',
        'team_deleted'
      ]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/changelog/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `changelog-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Are you sure you want to delete logs older than 90 days?')) {
      return;
    }

    try {
      const response = await api.delete('/changelog/clear?days=90');
      alert(response.data.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Failed to clear logs');
    }
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes('login') || eventType.includes('logout')) return '🔐';
    if (eventType.includes('task')) return '✅';
    if (eventType.includes('user')) return '👤';
    if (eventType.includes('team')) return '👥';
    if (eventType.includes('report')) return '📊';
    if (eventType.includes('automation')) return '🤖';
    if (eventType.includes('notification')) return '🔔';
    if (eventType.includes('comment')) return '💬';
    if (eventType.includes('bulk')) return '📦';
    return '⚙️';
  };

  const getEventColor = (eventType) => {
    if (eventType.includes('login')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-700';
    if (eventType.includes('logout')) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600';
    if (eventType.includes('created')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-2 border-green-400 dark:border-green-700';
    if (eventType.includes('updated')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-2 border-yellow-400 dark:border-yellow-700';
    if (eventType.includes('deleted')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-2 border-red-400 dark:border-red-700';
    if (eventType.includes('automation')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-2 border-purple-400 dark:border-purple-700';
    if (eventType.includes('report')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-2 border-indigo-400 dark:border-indigo-700';
    if (eventType.includes('task')) return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-2 border-teal-400 dark:border-teal-700';
    if (eventType.includes('team')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-2 border-orange-400 dark:border-orange-700';
    if (eventType.includes('notification')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-2 border-pink-400 dark:border-pink-700';
    if (eventType.includes('comment')) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-2 border-cyan-400 dark:border-cyan-700';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600';
  };

  const getTargetTypeColor = (targetType) => {
    switch(targetType?.toLowerCase()) {
      case 'task':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-700';
      case 'user':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      case 'team':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700';
      case 'report':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700';
      case 'comment':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700';
      case 'notification':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200 dark:border-pink-700';
      case 'automation':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
    }
  };

  const getTargetTypeIcon = (targetType) => {
    switch(targetType?.toLowerCase()) {
      case 'task': return '✅';
      case 'user': return '👤';
      case 'team': return '👥';
      case 'report': return '📊';
      case 'comment': return '💬';
      case 'notification': return '🔔';
      case 'automation': return '⚙️';
      default: return '📌';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen">
      <Navbar />
      <div className={`flex-1 overflow-auto ${currentTheme.background}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Activity className={`w-8 h-8 ${currentColorScheme.primaryText}`} />
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Change Log</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchLogs}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme.hover} ${currentTheme.text} transition-colors`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentColorScheme.primary} text-white transition-colors hover:opacity-90 disabled:opacity-50`}
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme.hover} ${currentTheme.text} transition-colors`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>
            <p className={`${currentTheme.textSecondary}`}>
              Track all system events, user activities, and changes across the platform
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className={`${currentTheme.surface} rounded-xl p-6 border ${currentTheme.border} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>Total Events</p>
                    <p className={`text-3xl font-bold ${currentTheme.text}`}>{stats.total.toLocaleString()}</p>
                  </div>
                  <TrendingUp className={`w-10 h-10 ${currentColorScheme.primaryText} opacity-50`} />
                </div>
              </div>
              
              <div className={`${currentTheme.surface} rounded-xl p-6 border ${currentTheme.border} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>Event Types</p>
                    <p className={`text-3xl font-bold ${currentTheme.text}`}>{stats.by_event_type.length}</p>
                  </div>
                  <Target className={`w-10 h-10 ${currentColorScheme.primaryText} opacity-50`} />
                </div>
              </div>
              
              <div className={`${currentTheme.surface} rounded-xl p-6 border ${currentTheme.border} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>Active Users</p>
                    <p className={`text-3xl font-bold ${currentTheme.text}`}>{stats.top_users.length}</p>
                  </div>
                  <User className={`w-10 h-10 ${currentColorScheme.primaryText} opacity-50`} />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className={`${currentTheme.surface} rounded-xl p-6 mb-6 border-2 ${currentTheme.border} shadow-lg`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${currentTheme.text} flex items-center space-x-2`}>
                  <Filter className="w-5 h-5 text-blue-500" />
                  <span>Advanced Filters</span>
                </h3>
                {(filters.event_type || filters.target_type || filters.search || filters.start_date || filters.end_date) && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
                    Filters Active
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span>Event Type</span>
                  </label>
                  <select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 ${
                      filters.event_type 
                        ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                        : currentTheme.border
                    } rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">🌐 All Events</option>
                    {eventTypes.map(type => {
                      const emoji = type.includes('created') ? '✨' : 
                                   type.includes('updated') ? '📝' : 
                                   type.includes('deleted') ? '🗑️' : 
                                   type.includes('login') ? '🔓' : 
                                   type.includes('logout') ? '🔒' : '📌';
                      return (
                        <option key={type} value={type}>
                          {emoji} {type.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <Target className="w-4 h-4 text-orange-500" />
                    <span>Target Type</span>
                  </label>
                  <select
                    value={filters.target_type}
                    onChange={(e) => handleFilterChange('target_type', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 ${
                      filters.target_type 
                        ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' 
                        : currentTheme.border
                    } rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-orange-500`}
                  >
                    <option value="">🎯 All Types</option>
                    <option value="task">✅ Task</option>
                    <option value="user">👤 User</option>
                    <option value="team">👥 Team</option>
                    <option value="report">📊 Report</option>
                    <option value="comment">💬 Comment</option>
                    <option value="notification">🔔 Notification</option>
                    <option value="automation">⚙️ Automation</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>Search</span>
                  </label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      filters.search ? 'text-blue-500' : currentTheme.textMuted
                    }`} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search logs..."
                      className={`w-full pl-10 pr-3 py-2.5 border-2 ${
                        filters.search 
                          ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                          : currentTheme.border
                      } rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 ${
                      filters.start_date 
                        ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                        : currentTheme.border
                    } rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 ${
                      filters.end_date 
                        ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                        : currentTheme.border
                    } rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${currentTheme.text} mb-2 flex items-center space-x-2`}>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>Items per page</span>
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text} font-medium transition-all focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="25">📄 25 items</option>
                    <option value="50">📋 50 items</option>
                    <option value="100">📚 100 items</option>
                    <option value="200">📦 200 items</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center pt-4 border-t ${currentTheme.border}">
                <div className="flex items-center space-x-2">
                  {filters.event_type && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs font-medium">
                      Event: {filters.event_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {filters.target_type && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs font-medium">
                      Type: {filters.target_type}
                    </span>
                  )}
                  {filters.search && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                      Search: "{filters.search}"
                    </span>
                  )}
                  {(filters.start_date || filters.end_date) && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                      📅 Date Range
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setFilters({
                      event_type: '',
                      target_type: '',
                      search: '',
                      start_date: '',
                      end_date: '',
                      limit: 50
                    });
                    setPage(1);
                  }}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 ${currentTheme.hover} ${currentTheme.text} font-semibold transition-all hover:scale-105`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
                <button
                  onClick={handleClearOldLogs}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Old Logs (90+ days)</span>
                </button>
              </div>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className={`${currentTheme.surface} rounded-xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className={`w-8 h-8 ${currentColorScheme.primaryText} animate-spin mx-auto mb-4`} />
                  <p className={currentTheme.textSecondary}>Loading change logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className={`w-12 h-12 ${currentTheme.textMuted} mx-auto mb-4`} />
                  <p className={`text-lg ${currentTheme.text} mb-2`}>No logs found</p>
                  <p className={currentTheme.textSecondary}>Try adjusting your filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className={`${currentTheme.surfaceSecondary} border-b ${currentTheme.border}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Timestamp</span>
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        Event Type
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>User</span>
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        Description
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        Target
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${currentTheme.text} uppercase tracking-wider`}>
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log._id} className={`${currentTheme.hover} transition-colors`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.textSecondary}`}>
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold ${getEventColor(log.event_type)} shadow-sm`}>
                            <span className="text-base">{getEventIcon(log.event_type)}</span>
                            <span className="uppercase tracking-wide">{log.event_type.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${currentTheme.text}`}>
                          <div>
                            <div className="font-medium">{log.user_name || 'System'}</div>
                            <div className={`text-xs ${currentTheme.textSecondary}`}>{log.user_email || 'N/A'}</div>
                            {log.user_role && (
                              <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                log.user_role === 'admin' 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700' 
                                  : log.user_role === 'manager'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-700'
                              }`}>
                                {log.user_role === 'admin' ? '👑' : log.user_role === 'manager' ? '⭐' : '👤'} {log.user_role.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm ${currentTheme.text} max-w-md`}>
                          {log.description}
                        </td>
                        <td className={`px-6 py-4 text-sm ${currentTheme.text}`}>
                          {log.target_type ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getTargetTypeColor(log.target_type)}`}>
                                <span>{getTargetTypeIcon(log.target_type)}</span>
                                <span className="uppercase">{log.target_type}</span>
                              </span>
                              <div className={`text-xs ${currentTheme.textSecondary} font-mono`}>
                                {log.target_name || log.target_id || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className={`${currentTheme.textSecondary} text-xs`}>N/A</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.textSecondary} font-mono`}>
                          {log.user_ip || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${currentTheme.border} flex items-center justify-between`}>
                <div className={`text-sm ${currentTheme.textSecondary}`}>
                  Showing page {page} of {totalPages} ({total.toLocaleString()} total events)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.text} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className={`px-4 py-2 ${currentTheme.text}`}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.text} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeLog;
