import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
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
  AlertCircle,
  Menu
} from 'lucide-react';

const ChangeLog = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const navigate = useNavigate();
  const confirmModal = useConfirmModal();
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

  const handleClearOldLogs = () => {
    confirmModal.show({
      title: 'Clear Old Logs',
      message: 'Are you sure you want to delete all audit logs older than 90 days? This action cannot be undone and may affect historical reporting.',
      confirmText: 'Delete Old Logs',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const response = await api.delete('/changelog/clear?days=90');
          alert(response.data.message);
          fetchLogs();
          fetchStats();
        } catch (error) {
          console.error('Error clearing logs:', error);
          alert('Failed to clear logs');
        }
      },
    });
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
    if (eventType.includes('login')) return 'bg-blue-500/10 text-blue-400 border-2 border-blue-500/30';
    if (eventType.includes('logout')) return 'bg-gray-500/10 text-gray-400 border-2 border-gray-500/30';
    if (eventType.includes('created')) return 'bg-green-500/10 text-green-400 border-2 border-green-500/30';
    if (eventType.includes('updated')) return 'bg-yellow-500/10 text-yellow-400 border-2 border-yellow-500/30';
    if (eventType.includes('deleted')) return 'bg-red-500/10 text-red-400 border-2 border-red-500/30';
    if (eventType.includes('automation')) return 'bg-purple-500/10 text-purple-400 border-2 border-purple-500/30';
    if (eventType.includes('report')) return 'bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/30';
    if (eventType.includes('task')) return 'bg-teal-500/10 text-teal-400 border-2 border-teal-500/30';
    if (eventType.includes('team')) return 'bg-orange-500/10 text-orange-400 border-2 border-orange-500/30';
    if (eventType.includes('notification')) return 'bg-pink-500/10 text-pink-400 border-2 border-pink-500/30';
    if (eventType.includes('comment')) return 'bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/30';
    return 'bg-gray-500/10 text-gray-400 border-2 border-gray-500/30';
  };

  const getTargetTypeColor = (targetType) => {
    switch (targetType?.toLowerCase()) {
      case 'task':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/30';
      case 'user':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'team':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'report':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'comment':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
      case 'notification':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/30';
      case 'automation':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  const getTargetTypeIcon = (targetType) => {
    switch (targetType?.toLowerCase()) {
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
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />
      <div className={`flex-1 overflow-auto ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-[0.125rem] flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-300 mb-1">Error</h3>
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMobileSidebar}
                  className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  aria-label="Toggle menu"
                >
                  <Menu size={24} />
                </button>
                <Activity className="w-8 h-8 text-[#136dec]" />
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Change Log</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchLogs}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-[0.125rem] transition-colors ${theme === 'dark' ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                    } border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center space-x-2 px-4 py-2 rounded-[0.125rem] bg-[#136dec] hover:bg-[#136dec]/90 text-white transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-[0.125rem] transition-colors ${theme === 'dark' ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                    } border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              Track all system events, user activities, and changes across the platform
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className={`rounded-[0.125rem] p-6 border shadow-sm ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Total Events</p>
                    <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-[#136dec] opacity-50" />
                </div>
              </div>

              <div className={`rounded-[0.125rem] p-6 border shadow-sm ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Event Types</p>
                    <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.by_event_type.length}</p>
                  </div>
                  <Target className="w-10 h-10 text-[#136dec] opacity-50" />
                </div>
              </div>

              <div className={`rounded-[0.125rem] p-6 border shadow-sm ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Active Users</p>
                    <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.top_users.length}</p>
                  </div>
                  <User className="w-10 h-10 text-[#136dec] opacity-50" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className={`rounded-[0.125rem] p-6 mb-6 border-2 shadow-lg ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  <Filter className="w-5 h-5 text-blue-500" />
                  <span>Advanced Filters</span>
                </h3>
                {(filters.event_type || filters.target_type || filters.search || filters.start_date || filters.end_date) && (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium">
                    Filters Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span>Event Type</span>
                  </label>
                  <select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-purple-500 focus:outline-none ${filters.event_type
                      ? 'border-purple-500/30 bg-purple-500/10'
                      : theme === 'dark'
                        ? 'border-[#282f39] bg-[#1c2027]'
                        : 'border-gray-200 bg-white'
                      } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
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
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Target className="w-4 h-4 text-orange-500" />
                    <span>Target Type</span>
                  </label>
                  <select
                    value={filters.target_type}
                    onChange={(e) => handleFilterChange('target_type', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-orange-500 focus:outline-none ${filters.target_type
                      ? 'border-orange-500/30 bg-orange-500/10'
                      : theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'
                      } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
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
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>Search</span>
                  </label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${filters.search ? 'text-blue-500' : theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'
                      }`} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search logs..."
                      className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${filters.search
                        ? 'border-blue-500/30 bg-blue-500/10'
                        : theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'
                        } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-green-500 focus:outline-none ${filters.start_date
                      ? 'border-green-500/30 bg-green-500/10'
                      : theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'
                      } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-red-500 focus:outline-none ${filters.end_date
                      ? 'border-red-500/30 bg-red-500/10'
                      : theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'
                      } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>Items per page</span>
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 rounded-[0.125rem] font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none ${theme === 'dark' ? 'border-[#282f39] bg-[#1c2027] text-white' : 'border-gray-200 bg-white text-gray-900'
                      }`}
                  >
                    <option value="25">📄 25 items</option>
                    <option value="50">📋 50 items</option>
                    <option value="100">📚 100 items</option>
                    <option value="200">📦 200 items</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#282f39]">
                <div className="flex items-center space-x-2">
                  {filters.event_type && (
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium">
                      Event: {filters.event_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {filters.target_type && (
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium">
                      Type: {filters.target_type}
                    </span>
                  )}
                  {filters.search && (
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                      Search: "{filters.search}"
                    </span>
                  )}
                  {(filters.start_date || filters.end_date) && (
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
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
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-[0.125rem] border-2 ${theme === 'dark' ? 'border-[#282f39] bg-[#1c2027] hover:bg-[#282f39] text-white' : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-900'} font-semibold transition-all`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                  <button
                    onClick={handleClearOldLogs}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-[0.125rem] font-semibold transition-all hover:opacity-90"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Old Logs (90+ days)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-[0.125rem] border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 text-[#136dec] animate-spin mx-auto mb-4" />
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Loading change logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className={`w-12 h-12 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mx-auto mb-4`} />
                  <p className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No logs found</p>
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Try adjusting your filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className={`border-b ${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Timestamp</span>
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                        Event Type
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>User</span>
                        </div>
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                        Description
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                        Target
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'}`}>
                    {logs.map((log) => (
                      <tr key={log._id} className={`${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold ${getEventColor(log.event_type)} shadow-sm`}>
                            <span className="text-base">{getEventIcon(log.event_type)}</span>
                            <span className="uppercase tracking-wide">{log.event_type.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          <div>
                            <div className="font-medium">{log.user_name || 'System'}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{log.user_email || 'N/A'}</div>
                            {log.user_role && (
                              <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${log.user_role === 'admin'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : log.user_role === 'manager'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-green-500/10 text-green-400 border border-green-500/30'
                                }`}>
                                {log.user_role === 'admin' ? '👑' : log.user_role === 'manager' ? '⭐' : '👤'} {log.user_role.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} max-w-md`}>
                          {log.description}
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className={`mt-2 p-2 rounded text-xs font-mono border ${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-100 border-gray-200'}`}>
                              {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="flex gap-2">
                                  <span className={`font-semibold capitalize ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>{field.replace('_', ' ')}:</span>
                                  <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                                    {change.old !== undefined ? String(change.old) : 'null'}
                                  </span>
                                  <span className={theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}>→</span>
                                  <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                                    {change.new !== undefined ? String(change.new) : 'null'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {log.target_type ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[0.125rem] text-xs font-semibold ${getTargetTypeColor(log.target_type)}`}>
                                <span>{getTargetTypeIcon(log.target_type)}</span>
                                <span className="uppercase">{log.target_type}</span>
                              </span>
                              <div className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-mono`}>
                                {log.target_name || log.target_id || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs`}>N/A</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-mono`}>
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
              <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} flex items-center justify-between`}>
                <div className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Showing page {page} of {totalPages} ({total.toLocaleString()} total events)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-[0.125rem] ${theme === 'dark' ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`p-2 rounded-[0.125rem] ${theme === 'dark' ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default ChangeLog;
