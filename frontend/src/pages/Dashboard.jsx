import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useRealtimeSync from '../hooks/useRealtimeSync';
import api from '../api/axios';
import Avatar from '../components/Avatar';
import Sidebar from '../components/Sidebar';
import { 
  Plus, Users, CheckSquare, TrendingUp, Clock, FileSpreadsheet, FileText, 
  AlertTriangle, Calendar, Filter, X, Download, Smartphone, Search,
  Bell, HelpCircle, Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateExcelReport } from '../utils/reportGenerator';
import { generateComprehensivePDFReport } from '../utils/comprehensiveReportGenerator';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // All existing state management (PRESERVED)
  const [stats, setStats] = useState({
    totalTasks: 0,
    myTasks: 0,
    inProgress: 0,
    completed: 0,
    overdueTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    status: '',
    priority: '',
  });
  const [detailedStats, setDetailedStats] = useState({
    statusBreakdown: {},
    priorityBreakdown: {},
    completionRate: 0,
    totalCompleted: 0,
    totalTasks: 0,
  });
  const [analyticsData, setAnalyticsData] = useState({
    totalTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    statusDistribution: [],
    priorityDistribution: [],
    teamDistribution: [],
    overdueByPriority: [],
    completionTrend: [],
    assigneePerformance: [],
  });
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    progressOverTime: [],
    priorityDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('all');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const exportDropdownRef = useRef(null);
  
  // ==== ALL EXISTING BUSINESS LOGIC PRESERVED BELOW ====
  
  const fetchTeams = useCallback(async () => {
    if (!['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) {
      return;
    }
    
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch (error) {
      if (error.response?.status === 403) {
        // No permission
      } else if (error.response?.status === 401) {
        console.error('Authentication required');
      } else {
        console.error('Error fetching teams:', error);
      }
    }
  }, [user?.role]);

  // PWA Install Handler (PRESERVED)
  useEffect(() => {
    const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        document.referrer.includes('android-app://');
    
    if (wasInstalled || isStandalone) {
      setIsInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa-installed')) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled || localStorage.getItem('pwa-installed') === 'true') {
      alert('✅ TaskFlow is Already Installed!');
      return;
    }
    
    if (!deferredPrompt) {
      alert('Install functionality not available. Please check your browser settings.');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
        setTimeout(() => {
          alert('🎉 TaskFlow has been installed!');
        }, 1000);
      }

      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  // Fetch notifications count
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
    }
  }, [user, fetchNotificationCount]);

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowReportOptions(false);
      }
    };

    if (showReportOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReportOptions]);

  // Real-time sync (PRESERVED)
  useRealtimeSync({
    onTaskCreated: () => {
      fetchDashboardData();
    },
    onTaskUpdated: () => {
      fetchDashboardData();
    },
    onTaskDeleted: () => {
      fetchDashboardData();
    },
    onTeamCreated: () => {
      fetchTeams();
    },
    onTeamUpdated: () => {
      fetchTeams();
    },
    onTeamDeleted: () => {
      fetchTeams();
    },
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksResponse, teamsData] = await Promise.all([
        api.get('/tasks'),
        fetchTeams(),
      ]);

      const tasks = tasksResponse.data.tasks || [];
      setAllTasks(tasks);

      // Calculate stats
      const now = new Date();
      const myTasks = tasks.filter(t => 
        t.assigned_to && t.assigned_to.some(u => u._id === user._id)
      );
      const inProgress = tasks.filter(t => t.status === 'in_progress');
      const completed = tasks.filter(t => t.status === 'done');
      const overdue = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'done'
      );

      setStats({
        totalTasks: tasks.length,
        myTasks: myTasks.length,
        inProgress: inProgress.length,
        completed: completed.length,
        overdueTasks: overdue.length,
      });

      setOverdueTasks(overdue.slice(0, 5));
      setRecentTasks(tasks.slice(0, 10));

      // Calculate analytics data
      const statusCounts = {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
      };

      const priorityCounts = {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length,
      };

      const statusDistribution = Object.entries(statusCounts).map(([key, value]) => ({
        name: key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value,
      }));

      const priorityDistribution = Object.entries(priorityCounts).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
      }));

      // Team distribution
      const teamCounts = tasks.reduce((acc, task) => {
        const teamName = task.team_id?.name || 'Unassigned';
        acc[teamName] = (acc[teamName] || 0) + 1;
        return acc;
      }, {});

      const teamDistribution = Object.entries(teamCounts)
        .map(([team, count]) => ({ name: team, value: count }))
        .sort((a, b) => b.value - a.value);

      // Assignee performance
      const userStats = tasks.reduce((acc, task) => {
        if (task.assigned_to && task.assigned_to.length > 0) {
          task.assigned_to.forEach(assignee => {
            const userId = assignee._id;
            const userName = assignee.full_name;

            if (!acc[userId]) {
              acc[userId] = {
                name: userName,
                total: 0,
                completed: 0,
                overdue: 0,
              };
            }

            acc[userId].total++;
            if (task.status === 'done') acc[userId].completed++;
            if (task.due_date && new Date(task.due_date) < now && task.status !== 'done') {
              acc[userId].overdue++;
            }
          });
        }
        return acc;
      }, {});

      const assigneePerformance = Object.values(userStats).map(stat => ({
        name: stat.name,
        total: stat.total,
        completed: stat.completed,
        overdue: stat.overdue,
        completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      }));

      setAnalyticsData({
        totalTasks: tasks.length,
        overdueTasks: overdue.length,
        completedTasks: completed.length,
        inProgressTasks: inProgress.length,
        statusDistribution,
        priorityDistribution,
        teamDistribution,
        assigneePerformance,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [user, fetchTeams]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Filter and search tasks
  const getFilteredTasks = useCallback(() => {
    let filtered = [...recentTasks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.team_id?.name?.toLowerCase().includes(query) ||
        task.assigned_to?.some(user => user.full_name?.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(task => new Date(task.created_at) >= startDate);
      }
    }

    return filtered;
  }, [recentTasks, searchQuery, filters]);

  // Generate reports (PRESERVED)
  const handleGenerateReport = async (format) => {
    try {
      if (format === 'excel') {
        const blob = await generateExcelReport(allTasks, analyticsData, filters);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        await generateComprehensivePDFReport(allTasks, analyticsData, filters, user);
      }
      setShowReportOptions(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'text-gray-400 bg-gray-400',
      in_progress: 'text-blue-400 bg-blue-400',
      review: 'text-yellow-400 bg-yellow-400',
      done: 'text-green-400 bg-green-400',
    };
    return colors[status] || colors.todo;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec] mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      {/* Unified Sidebar */}
      <Sidebar />

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl p-4 max-w-md w-full mx-4`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Smartphone className="w-8 h-8 text-[#136dec]" />
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                Install TaskFlow App
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-3`}>
                Get quick access and work offline by installing TaskFlow on your device
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-[#136dec] hover:bg-[#1258c4] text-white text-xs font-bold px-4 py-2 rounded transition-colors"
                >
                  Install Now
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className={`px-4 py-2 text-xs font-medium ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallBanner(false)}
              className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 border-b ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-200 bg-white'} shrink-0 z-20`}>
          <div className="flex items-center gap-4">
            <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-bold leading-tight tracking-tight`}>Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative w-80 hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
              </div>
              <input
                className={`block w-full rounded-[0.125rem] ${theme === 'dark' ? 'bg-[#1c2027] text-white placeholder-[#9da8b9]' : 'bg-gray-100 text-gray-900 placeholder-gray-400'} border-0 py-2 pl-10 pr-3 focus:ring-1 focus:ring-[#136dec] sm:text-sm`}
                placeholder="Search tasks, projects, or people..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="w-4 h-4 text-[#9da8b9] hover:text-white" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-4 border-l ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} pl-6`}>
              <button 
                onClick={() => navigate('/notifications')}
                className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors relative`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className={`absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ${theme === 'dark' ? 'ring-[#111418]' : 'ring-white'}`}></span>
                )}
              </button>
              <button 
                onClick={() => navigate('/')}
                className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                title="Help & Documentation"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* KPI Ribbon */}
        <div className={`${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-white border-gray-200'} border-b px-6 py-4 shrink-0`}>
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>{stats.totalTasks}</span>
              <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium uppercase text-xs tracking-wide`}>Total Tasks</span>
            </div>
            <div className={`h-8 w-px ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'}`}></div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>{stats.myTasks}</span>
              <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium uppercase text-xs tracking-wide`}>Assigned to Me</span>
            </div>
            <div className={`h-8 w-px ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'}`}></div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-400 tracking-tight">{stats.overdueTasks}</span>
              <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium uppercase text-xs tracking-wide`}>Overdue</span>
            </div>
            <div className={`h-8 w-px ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'}`}></div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#136dec] tracking-tight">
                {stats.totalTasks > 0 ? Math.round((stats.inProgress / stats.totalTasks) * 100) : 0}%
              </span>
              <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium uppercase text-xs tracking-wide`}>Team Capacity</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Last updated: Just now</span>
              <Link
                to="/tasks"
                className="flex items-center gap-2 bg-[#136dec] hover:bg-[#1258c4] text-white text-xs font-bold px-3 py-2 rounded-[0.125rem] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Analytics Charts Section */}
          {user?.role !== 'member' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-bold leading-tight`}>Performance Overview</h3>
                <Link
                  to="/analytics"
                  className="text-xs text-[#136dec] hover:text-blue-400 font-medium"
                >
                  View Detailed Analytics →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Status Distribution Pie Chart */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-4`}>
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3`}>Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name.toLowerCase().includes('done') ? '#22c55e' :
                            entry.name.toLowerCase().includes('progress') ? '#136dec' :
                            entry.name.toLowerCase().includes('review') ? '#a855f7' :
                            entry.name.toLowerCase().includes('todo') ? '#eab308' :
                            '#6b7280'
                          } />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution Bar Chart */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-4`}>
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3`}>Priority Breakdown</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analyticsData.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39' }} />
                      <Bar dataKey="value" fill="#136dec" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Team Performance */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-4`}>
                  <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3`}>Team Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analyticsData.teamDistribution.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39' }} />
                      <Bar dataKey="value" fill="#22c55e">
                        {analyticsData.teamDistribution.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 50%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-6 h-full">
            {/* LEFT: Main Task Table */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-bold leading-tight`}>Active Task Queue</h3>
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => {
                      setShowFilters(!showFilters);
                      setShowReportOptions(false); // Close export dropdown when opening filters
                    }}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-[0.125rem] transition-colors ${showFilters ? 'bg-[#136dec] text-white' : ''}`}
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => {
                        setShowReportOptions(!showReportOptions);
                        setShowFilters(false); // Close filters when opening export dropdown
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-[0.125rem] transition-colors`}
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>

                    {/* Report Options Dropdown */}
                    {showReportOptions && (
                      <div className={`absolute right-0 top-full mt-2 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-[0.125rem] shadow-lg p-2 z-50 min-w-[200px]`}>
                        <button
                          onClick={() => handleGenerateReport('excel')}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${theme === 'dark' ? 'text-white hover:bg-[#282f39]' : 'text-gray-900 hover:bg-gray-100'} rounded-[0.125rem] transition-colors`}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Export as Excel
                        </button>
                        <button
                          onClick={() => handleGenerateReport('pdf')}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${theme === 'dark' ? 'text-white hover:bg-[#282f39]' : 'text-gray-900 hover:bg-gray-100'} rounded-[0.125rem] transition-colors`}
                        >
                          <FileText className="w-4 h-4" />
                          Export as PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-[0.125rem] p-4 mb-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filter Tasks</h4>
                    <button
                      onClick={() => {
                        setFilters({ dateRange: 'all', customStartDate: '', customEndDate: '', status: '', priority: '' });
                        setSearchQuery('');
                      }}
                      className="text-xs text-[#136dec] hover:text-blue-400 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      <option value="">All Statuses</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                      className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="h-9 px-4 bg-[#136dec] text-white text-sm font-medium rounded hover:bg-[#1258c4] transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Table Container */}
              <div className={`border ${theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'} rounded-[0.125rem] overflow-hidden flex flex-col`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${theme === 'dark' ? 'bg-[#181b21] border-[#282f39]' : 'bg-gray-50 border-gray-200'} border-b`}>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-8`}>
                          <input
                            className={`form-checkbox rounded-[0.125rem] ${theme === 'dark' ? 'border-[#282f39] bg-[#282f39]' : 'border-gray-300 bg-gray-100'} text-[#136dec] focus:ring-0 focus:ring-offset-0 h-3 w-3`}
                            type="checkbox"
                          />
                        </th>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-5/12`}>
                          Task Name
                        </th>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-2/12`}>
                          Priority
                        </th>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-2/12`}>
                          Due Date
                        </th>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-2/12`}>
                          Status
                        </th>
                        <th className={`px-4 py-3 text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-1/12 text-right`}>
                          Owner
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'} text-sm`}>
                      {getFilteredTasks().length === 0 ? (
                        <tr>
                          <td colSpan="6" className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                            {searchQuery || filters.status || filters.priority || filters.dateRange !== 'all'
                              ? 'No tasks match your filters. Try adjusting your search or filters.'
                              : 'No tasks found. Create your first task to get started!'}
                          </td>
                        </tr>
                      ) : (
                        getFilteredTasks().slice(0, 5).map((task) => (
                        <tr
                          key={task._id}
                          className={`group ${theme === 'dark' ? 'hover:bg-[#232830]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                          onClick={() => navigate(`/tasks`)}
                        >
                          <td className="px-4 py-3">
                            <input
                              className={`form-checkbox rounded-[0.125rem] ${theme === 'dark' ? 'border-[#282f39] bg-[#282f39] group-hover:border-[#9da8b9]' : 'border-gray-300 bg-gray-100 group-hover:border-gray-400'} text-[#136dec] focus:ring-0 focus:ring-offset-0 h-3 w-3`}
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>{task.title}</span>
                              <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                                Project: {task.team_id?.name || 'No Team'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-[0.125rem] text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-mono text-xs`}>
                            {formatDate(task.due_date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${getStatusColor(task.status).split(' ')[0]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status).split(' ')[1]}`}></span>
                              {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {task.assigned_to && task.assigned_to.length > 0 && (
                              <Avatar user={task.assigned_to[0]} size="sm" className="ml-auto" />
                            )}
                          </td>
                        </tr>
                      ))
                      )}

                      {recentTasks.length === 0 && !searchQuery && filters.status === '' && filters.priority === '' && filters.dateRange === 'all' && (
                        <tr>
                          <td colSpan="6" className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                            No tasks found. Create your first task to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={`p-3 border-t ${theme === 'dark' ? 'border-[#282f39] bg-[#181b21] text-[#9da8b9]' : 'border-gray-200 bg-gray-50 text-gray-600'} flex justify-between items-center text-xs`}>
                  <span>Showing {Math.min(5, recentTasks.length)} of {stats.totalTasks} tasks</span>
                  <div className="flex gap-2">
                    <button className={`${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} disabled:opacity-50`} disabled>
                      Previous
                    </button>
                    <span className={theme === 'dark' ? 'text-[#282f39]' : 'text-gray-300'}>|</span>
                    <Link to="/tasks" className={theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}>
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Widgets */}
            <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
              {/* Overdue Tasks Widget */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm font-bold uppercase tracking-wider`}>Attention Needed</h3>
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-[0.125rem] overflow-hidden`}>
                  <div className={`flex flex-col divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'}`}>
                    {overdueTasks.slice(0, 2).map((task) => (
                      <div
                        key={task._id}
                        className={`p-3 ${theme === 'dark' ? 'hover:bg-[#232830]' : 'hover:bg-gray-50'} transition-colors cursor-pointer border-l-2 border-transparent hover:border-red-500`}
                        onClick={() => navigate('/tasks')}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium line-clamp-1`}>{task.title}</p>
                          <span className="text-xs text-red-400 font-mono whitespace-nowrap">
                            {Math.abs(Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)))}d ago
                          </span>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-2`}>
                          {task.team_id?.name || 'No Team'} • {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </p>
                        {task.assigned_to && task.assigned_to.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Avatar user={task.assigned_to[0]} size="xs" />
                            <span className={`text-[10px] ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                              Assigned to {task.assigned_to[0].full_name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {overdueTasks.length === 0 && (
                      <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                        No overdue tasks! 🎉
                      </div>
                    )}
                  </div>
                  {overdueTasks.length > 2 && (
                    <Link
                      to="/tasks"
                      className={`block ${theme === 'dark' ? 'bg-[#181b21] text-[#9da8b9] hover:text-white border-[#282f39]' : 'bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200'} p-2 text-center text-xs transition-colors border-t`}
                    >
                      View all {overdueTasks.length} overdue
                    </Link>
                  )}
                </div>
              </div>

              {/* Team Load Widget */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm font-bold uppercase tracking-wider`}>Team Load</h3>
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-[0.125rem] p-4`}>
                  <div className="flex flex-col gap-4">
                    {analyticsData.assigneePerformance.slice(0, 3).map((member) => (
                      <div key={member.name} className="flex items-center gap-3">
                        <div className="bg-[#136dec]/20 flex items-center justify-center rounded-full size-8 text-[#136dec] text-sm font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-end mb-1">
                            <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium truncate`}>{member.name}</span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{member.total} tasks</span>
                          </div>
                          <div className={`h-1.5 w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                            <div
                              className={`h-full rounded-full ${
                                member.completionRate >= 80 ? 'bg-[#136dec]' :
                                member.completionRate >= 50 ? 'bg-green-500' : 'bg-orange-400'
                              }`}
                              style={{ width: `${member.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {analyticsData.assigneePerformance.length === 0 && (
                      <p className={`text-sm text-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} py-4`}>
                        No team members with assigned tasks
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Log Widget */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm font-bold uppercase tracking-wider`}>Live Activity</h3>
                </div>
                <div className="relative pl-2 space-y-4">
                  <div className={`absolute left-2 top-2 bottom-0 w-px ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'}`}></div>
                  {recentTasks.slice(0, 3).map((task, index) => (
                    <div key={task._id} className="relative pl-6">
                      <div className={`absolute left-0 top-1.5 size-4 rounded-full ${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-white border-gray-200'} border flex items-center justify-center`}>
                        <div className={`size-1.5 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' : 
                          task.status === 'in_progress' ? 'bg-[#136dec]' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                        <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>
                          {task.assigned_to?.[0]?.full_name || 'Someone'}
                        </span>{' '}
                        {task.status === 'done' ? 'completed' : 'updated'}{' '}
                        <span className="text-[#136dec] hover:underline cursor-pointer">
                          {task.title}
                        </span>
                      </p>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-0.5`}>
                        {new Date(task.created_at || Date.now()).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  ))}

                  {recentTasks.length === 0 && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-center py-4`}>
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
