import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import NotificationPrompt from '../components/NotificationPrompt';
import useRealtimeSync from '../hooks/useRealtimeSync';
import api from '../api/axios';
import { Plus, Users, CheckSquare, TrendingUp, Clock, FileSpreadsheet, FileText, AlertTriangle, Calendar, Filter, X, Download, Smartphone, X as CloseIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateExcelReport } from '../utils/reportGenerator';
import { generateComprehensivePDFReport } from '../utils/comprehensiveReportGenerator';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
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
  const [reportPeriod, setReportPeriod] = useState('all'); // 'daily', 'weekly', 'monthly', 'all'
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Memoized functions must be defined before useEffect hooks that use them
  const fetchTeams = useCallback(async () => {
    // Only fetch teams if user has permission
    if (!['admin', 'hr', 'team_lead'].includes(user?.role)) {
      return;
    }
    
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch (error) {
      if (error.response?.status === 403) {
        // No permission to view teams - silent handling
      } else if (error.response?.status === 401) {
        console.error('Authentication required. Please log in again.');
      } else {
        console.error('Error fetching teams:', error);
      }
    }
  }, [user?.role]);

  // PWA Install Handler with persistent state
  useEffect(() => {
    // Check if app was previously installed (localStorage flag)
    const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
    
    // Check if app is currently running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true || // iOS Safari
                        document.referrer.includes('android-app://'); // Android TWA
    
    if (wasInstalled || isStandalone) {
      setIsInstalled(true);
      setShowInstallBanner(false);
      // Ensure the flag is set
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Only show install banner if not already installed
      if (!localStorage.getItem('pwa-installed')) {
        setShowInstallBanner(true);
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      // Persist installation state
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
    // Check if already installed
    if (isInstalled || localStorage.getItem('pwa-installed') === 'true') {
      alert('✅ TaskFlow is Already Installed!\n\nThe app has been installed on your device.\n\nYou can:\n• Find it on your home screen/desktop\n• Launch it like a native app\n• Access it offline\n\n🎉 You\'re all set!');
      return;
    }
    
    if (!deferredPrompt) {
      // If no install prompt available, show comprehensive instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isEdge = /Edg/.test(navigator.userAgent);
      
      let instructions = '';
      
      if (isIOS || isSafari) {
        instructions = `📱 Install TaskFlow on iOS/Safari:\n\n` +
          `1. Tap the Share button (□↑) at the bottom of Safari\n` +
          `2. Scroll down and tap "Add to Home Screen"\n` +
          `3. Tap "Add" in the top right to confirm\n\n` +
          `The TaskFlow icon will appear on your home screen!`;
      } else if (isChrome || isEdge) {
        instructions = `💻 Install TaskFlow on Chrome/Edge:\n\n` +
          `Option 1:\n` +
          `• Look for the install icon (⊕) in the address bar\n` +
          `• Click it to install TaskFlow\n\n` +
          `Option 2:\n` +
          `• Open browser Menu (⋮)\n` +
          `• Click "Install TaskFlow" or "Install app"\n\n` +
          `Note: If you don't see these options, the PWA might not be fully ready yet.`;
      } else {
        instructions = `⚠️ Browser Not Supported\n\n` +
          `Your browser doesn't support PWA installation.\n\n` +
          `Please use one of these browsers:\n` +
          `✅ Google Chrome\n` +
          `✅ Microsoft Edge\n` +
          `✅ Opera\n` +
          `✅ Samsung Internet\n\n` +
          `Firefox has limited PWA support.`;
      }
      
      alert(instructions);
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // Mark as installed
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
        // Show success message
        setTimeout(() => {
          alert('🎉 TaskFlow has been installed!\n\nYou can now access it from your home screen or desktop.\n\nLook for the TaskFlow icon on your device.');
        }, 1000);
      }

      // Clear the deferredPrompt for next time
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error during installation:', error);
      alert('❌ Installation Error\n\nSomething went wrong. Please try:\n1. Refreshing the page\n2. Using Chrome or Edge browser\n3. Checking browser console for errors');
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allTasks];

    // For members, only show tasks assigned to them AND under their team
    if (user?.role === 'member') {
      filtered = filtered.filter(task => {
        // Check if task is assigned to the member
        const isAssignedToUser = task.assigned_to && task.assigned_to.some(assignedUser => 
          assignedUser._id === user.id || assignedUser === user.id
        );
        
        // Check if task belongs to member's team
        const belongsToUserTeam = user.team_id && task.team_id && 
          (task.team_id._id === user.team_id || task.team_id === user.team_id);
        
        // Task must be both assigned to user AND in their team
        return isAssignedToUser && belongsToUserTeam;
      });
    }

    // Date range filter
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
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            startDate = new Date(filters.customStartDate);
            const endDate = new Date(filters.customEndDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(task => {
              const taskDate = new Date(task.created_at);
              return taskDate >= startDate && taskDate <= endDate;
            });
          }
          break;
        default:
          break;
      }

      if (startDate && filters.dateRange !== 'custom') {
        filtered = filtered.filter(task => new Date(task.created_at) >= startDate);
      }
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    setFilteredTasks(filtered);
    updateDetailedStats(filtered);
  }, [allTasks, filters, user?.id, user?.role, user?.team_id]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const tasksResponse = await api.get('/tasks');
      const tasks = tasksResponse.data.tasks || [];
      
      setAllTasks(tasks);

      const myTasks = tasks.filter(
        (t) => (t.assigned_to && Array.isArray(t.assigned_to) && t.assigned_to.some(u => u && u._id === user.id)) || (t.created_by && t.created_by._id === user.id)
      );
      const inProgress = tasks.filter((t) => t.status === 'in_progress');
      const completed = tasks.filter((t) => t.status === 'done');
      const overdue = tasks.filter(task =>
        task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
      );

      setStats({
        totalTasks: tasks.length,
        myTasks: myTasks.length,
        inProgress: inProgress.length,
        completed: completed.length,
        overdueTasks: overdue.length,
      });

      setOverdueTasks(overdue.slice(0, 5));

      // Prepare chart data
      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: getStatusChartColor(status),
      }));

      const priorityCounts = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority.toUpperCase(),
        value: count,
      }));

      // Mock progress over time data (last 7 days)
      const progressOverTime = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayTasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.toDateString() === date.toDateString();
        });
        progressOverTime.push({
          date: date.toLocaleDateString(),
          created: dayTasks.length,
          completed: dayTasks.filter(t => t.status === 'done').length,
        });
      }

      setChartData({
        statusDistribution,
        priorityDistribution,
        progressOverTime,
      });

      // Prepare analytics data for reports
      const now = new Date();
      const userStats = tasks.reduce((acc, task) => {
        if (task.assigned_to && task.assigned_to.length > 0) {
          task.assigned_to.forEach(user => {
            const userId = user._id;
            const userName = user.full_name;

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

      // Calculate team distribution
      const teamCounts = tasks.reduce((acc, task) => {
        const teamName = task.team_id?.name || 'Unassigned';
        acc[teamName] = (acc[teamName] || 0) + 1;
        return acc;
      }, {});

      const teamDistribution = Object.entries(teamCounts)
        .map(([team, count]) => ({
          name: team,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);

      setAnalyticsData({
        totalTasks: tasks.length,
        overdueTasks: overdue.length,
        completedTasks: completed.length,
        inProgressTasks: inProgress.length,
        statusDistribution,
        priorityDistribution,
        teamDistribution,
        overdueByPriority: [],
        completionTrend: progressOverTime,
        assigneePerformance,
      });

      setRecentTasks(tasks.slice(0, 5));
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        // Token might be expired, the axios interceptor will handle redirect
      } else {
        console.error('Error fetching dashboard data:', error);
      }
      setLoading(false);
    }
  }, [user.id]);

  // useEffect hooks
  useEffect(() => {
    fetchDashboardData();
    fetchTeams();
  }, [fetchDashboardData, fetchTeams]);

  useEffect(() => {
    if (allTasks.length > 0) {
      applyFilters();
    }
  }, [allTasks, filters, applyFilters]);

  // Real-time synchronization
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

  const updateDetailedStats = (tasks) => {
    // Status breakdown
    const statusBreakdown = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      archived: tasks.filter(t => t.status === 'archived').length,
    };

    // Priority breakdown
    const priorityBreakdown = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    // Completion rate
    const totalCompleted = statusBreakdown.done;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    setDetailedStats({
      statusBreakdown,
      priorityBreakdown,
      completionRate,
      totalCompleted,
      totalTasks,
    });
  };

  const getTeamTaskCounts = () => {
    // Count tasks per team
    const taskCounts = filteredTasks.reduce((acc, task) => {
      const teamId = task.team_id?._id || 'unassigned';
      acc[teamId] = (acc[teamId] || 0) + 1;
      return acc;
    }, {});

    // Create array with all teams (including those with 0 tasks)
    const teamStats = teams.map(team => ({
      id: team._id,
      name: team.name,
      count: taskCounts[team._id] || 0,
    }));

    // Add unassigned tasks if any
    if (taskCounts['unassigned']) {
      teamStats.push({
        id: 'unassigned',
        name: 'Unassigned',
        count: taskCounts['unassigned'],
      });
    }

    // Sort by count descending
    return teamStats.sort((a, b) => b.count - a.count);
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.todo;
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      todo: 'border-gray-500',
      in_progress: 'border-blue-500',
      review: 'border-yellow-500',
      done: 'border-green-500',
      archived: 'border-red-500',
    };
    return colors[status] || colors.todo;
  };

  const getStatusAccentColor = (status) => {
    const colors = {
      todo: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      review: 'bg-yellow-500',
      done: 'bg-green-500',
      archived: 'bg-red-500',
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusChartColor = (status) => {
    const colors = {
      todo: '#6b7280',
      in_progress: '#3b82f6',
      review: '#f59e0b',
      done: '#10b981',
      archived: '#ef4444',
    };
    return colors[status] || colors.todo;
  };

  const handleExportExcel = () => {
    try {
      generateExcelReport(allTasks, analyticsData, {});
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Error generating Excel report. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      generateComprehensivePDFReport(allTasks, analyticsData, {}, user, reportPeriod);
      setShowReportOptions(false);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="loading-dots">
                <div className="loading-dot bg-blue-600"></div>
                <div className="loading-dot bg-blue-600"></div>
                <div className="loading-dot bg-blue-600"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} transition-colors`} data-testid="dashboard">
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${currentTheme.text} transition-colors`}>Welcome back, {user?.full_name}!</h1>
            <p className={`${currentTheme.textSecondary} mt-2 transition-colors`}>Here's what's happening with your tasks today.</p>
          </div>

          {/* Notification Prompt */}
          <NotificationPrompt />

          {/* PWA Install Banner */}
          {showInstallBanner && !isInstalled && (
            <div className={`${currentTheme.surface} border-2 ${currentColorScheme.primary.replace('bg-', 'border-')} rounded-lg shadow-lg p-6 mb-8 relative animate-fade-in`}>
              <button
                onClick={() => setShowInstallBanner(false)}
                className={`absolute top-4 right-4 ${currentTheme.textSecondary} hover:${currentTheme.text} transition-colors`}
                aria-label="Close banner"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
              
              <div className="flex items-start space-x-4">
                <div className={`${currentColorScheme.primary} p-3 rounded-lg`}>
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${currentTheme.text} mb-2`}>
                    Install TaskFlow App
                  </h3>
                  <p className={`${currentTheme.textSecondary} mb-4`}>
                    Get the full app experience! Install TaskFlow on your device for:
                  </p>
                  
                  <ul className={`${currentTheme.textSecondary} space-y-2 mb-4 ml-4`}>
                    <li className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-500" />
                      <span>Quick access from your home screen</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-500" />
                      <span>Works offline with cached data</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-500" />
                      <span>Faster loading and better performance</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-500" />
                      <span>Native app-like experience</span>
                    </li>
                  </ul>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleInstallClick}
                      className={`${currentColorScheme.primary} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg`}
                    >
                      <Download className="w-5 h-5" />
                      <span>Install Now</span>
                    </button>
                    
                    <button
                      onClick={() => setShowInstallBanner(false)}
                      className={`${currentTheme.surface} ${currentTheme.border} border ${currentTheme.text} px-6 py-3 rounded-lg font-semibold hover:opacity-80 transition-all`}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Already Installed Message */}
          {isInstalled && (
            <div className={`${currentTheme.surface} border-2 border-green-500 rounded-lg shadow-lg p-4 mb-8 flex items-center space-x-3`}>
              <CheckSquare className="w-6 h-6 text-green-500" />
              <div>
                <p className={`font-semibold ${currentTheme.text}`}>
                  TaskFlow App Installed!
                </p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  You're using the installed version. Enjoy the full app experience!
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Total Tasks</p>
                  <p className={`text-3xl font-bold ${currentTheme.text} mt-2`} data-testid="stat-total-tasks">{stats.totalTasks}</p>
                </div>
                <CheckSquare className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>My Tasks</p>
                  <p className={`text-3xl font-bold ${currentTheme.text} mt-2`} data-testid="stat-my-tasks">{stats.myTasks}</p>
                </div>
                <Users className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>In Progress</p>
                  <p className={`text-3xl font-bold ${currentTheme.text} mt-2`} data-testid="stat-in-progress">{stats.inProgress}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Completed</p>
                  <p className={`text-3xl font-bold ${currentTheme.text} mt-2`} data-testid="stat-completed">{stats.completed}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Overdue Tasks</p>
                  <p className="text-3xl font-bold text-red-600 mt-2" data-testid="stat-overdue">{stats.overdueTasks}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Link
                to="/tasks"
                className="btn btn-primary flex items-center space-x-2"
                data-testid="view-tasks-button"
              >
                <CheckSquare className="w-5 h-5" />
                <span>View All Tasks</span>
              </Link>
              <Link
                to="/tasks?create=true"
                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
                data-testid="create-task-button"
              >
                <Plus className="w-5 h-5" />
                <span>Create Task</span>
              </Link>
              {['admin', 'hr'].includes(user?.role) && (
                <Link
                  to="/teams"
                  className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
                  data-testid="manage-teams-button"
                >
                  <Users className="w-5 h-5" />
                  <span>Manage Teams</span>
                </Link>
              )}
              
              {/* PWA Install Button - Always Visible */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className={`btn ${deferredPrompt ? currentColorScheme.primary : 'bg-gray-400'} text-white hover:opacity-90 flex items-center space-x-2`}
                  data-testid="install-app-button"
                  title={deferredPrompt ? 'Install TaskFlow as an app' : 'Click for installation instructions'}
                >
                  <Download className="w-5 h-5" />
                  <span>{deferredPrompt ? 'Install App' : 'Install Instructions'}</span>
                </button>
              )}
              
              {/* Installed Indicator */}
              {isInstalled && (
                <div className="btn bg-green-600 text-white flex items-center space-x-2 cursor-default">
                  <CheckSquare className="w-5 h-5" />
                  <span>App Installed ✓</span>
                </div>
              )}
              {/* Export buttons - Only visible to admin and hr */}
              {['admin', 'hr'].includes(user?.role) && (
                <>
                  <button
                    onClick={handleExportExcel}
                    className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2 shadow-md transition-all"
                    data-testid="export-excel-button"
                    title="Export comprehensive Excel report with multiple sheets"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span>Export Excel</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowReportOptions(!showReportOptions)}
                      className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2 shadow-md transition-all"
                      data-testid="generate-pdf-button"
                      title="Export PDF report with charts and tables"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Export PDF</span>
                      <Calendar className="w-4 h-4" />
                    </button>
                    
                    {showReportOptions && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Report Period</div>
                          <button
                            onClick={() => { setReportPeriod('daily'); handleExportPDF(); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            role="menuitem"
                          >
                            📅 Daily Report (Today)
                          </button>
                          <button
                            onClick={() => { setReportPeriod('weekly'); handleExportPDF(); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            role="menuitem"
                          >
                            📊 Weekly Report (Last 7 Days)
                          </button>
                          <button
                            onClick={() => { setReportPeriod('monthly'); handleExportPDF(); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            role="menuitem"
                          >
                            📈 Monthly Report (This Month)
                          </button>
                          <button
                            onClick={() => { setReportPeriod('all'); handleExportPDF(); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            role="menuitem"
                          >
                            📑 Complete Report (All Time)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8 transition-colors`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className={`w-5 h-5 ${currentTheme.textSecondary}`} />
                <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Filters</h2>
              </div>
              <button
                onClick={() => setFilters({
                  dateRange: 'all',
                  customStartDate: '',
                  customEndDate: '',
                  status: '',
                  priority: '',
                })}
                className="btn bg-gray-600 text-white hover:bg-gray-700 text-sm px-4 py-2 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'member' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
              {/* Date Range filter - Hidden for members */}
              {user?.role !== 'member' && (
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                >
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Start Date</label>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => setFilters({...filters, customStartDate: e.target.value})}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>End Date</label>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Task Status Breakdown */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Task Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className={currentTheme.text}>To Do</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.statusBreakdown.todo || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className={currentTheme.text}>In Progress</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.statusBreakdown.in_progress || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className={currentTheme.text}>Review</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.statusBreakdown.review || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className={currentTheme.text}>Completed</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.statusBreakdown.done || 0}</span>
                </div>
              </div>
            </div>

            {/* Priority Levels Breakdown */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
              <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Priority Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className={currentTheme.text}>Urgent</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.priorityBreakdown.urgent || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className={currentTheme.text}>High</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.priorityBreakdown.high || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className={currentTheme.text}>Medium</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.priorityBreakdown.medium || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className={currentTheme.text}>Low</span>
                  </div>
                  <span className={`text-2xl font-bold ${currentTheme.text}`}>{detailedStats.priorityBreakdown.low || 0}</span>
                </div>
              </div>
            </div>

            {/* Completion Rate Card */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors flex flex-col justify-center items-center text-center`}>
              <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Completion Rate</h3>
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-green-500"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - detailedStats.completionRate / 100)}`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <span className={`absolute text-3xl font-bold ${currentTheme.text}`}>
                  {detailedStats.completionRate}%
                </span>
              </div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                <span className="font-semibold text-green-600">{detailedStats.totalCompleted}</span> of{' '}
                <span className="font-semibold">{detailedStats.totalTasks}</span> tasks completed
              </p>
            </div>
          </div>

          {/* Tasks by Team - Numerical Stats - Only for admin and hr */}
          {['admin', 'hr'].includes(user?.role) && (
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8 transition-colors`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Tasks by Team</h3>
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {getTeamTaskCounts().map((team) => (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      team.count > 0 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${team.count > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`${currentTheme.text} text-sm font-medium truncate`} title={team.name}>
                        {team.name}
                      </span>
                    </div>
                    <span className={`text-xl font-bold ml-2 flex-shrink-0 ${team.count > 0 ? 'text-green-600 dark:text-green-400' : currentTheme.textMuted}`}>
                      {team.count}
                    </span>
                  </div>
                ))}
                {teams.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className={currentTheme.textSecondary}>No teams found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts Section - Hidden for members, minimal for team leads */}
          {user?.role !== 'member' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Task Status Distribution */}
                <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
                  <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
                  <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Priority Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tasks by Team - Only for admin and hr */}
                {['admin', 'hr'].includes(user?.role) && (
                  <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 transition-colors`}>
                    <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Tasks by Team</h3>
                    {analyticsData.teamDistribution && analyticsData.teamDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.teamDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" name="Tasks" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className={`text-center py-8 ${currentTheme.textSecondary}`}>No team data available</p>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Over Time - Only for admin and hr */}
              {['admin', 'hr'].includes(user?.role) && (
                <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8 transition-colors`}>
                  <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Progress Over Time (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.progressOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
                      <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Overdue Tasks Section */}
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-6 mb-8 transition-colors">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Overdue Tasks ({overdueTasks.length})</h2>
              </div>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div key={task._id} className={`${currentTheme.surface} rounded-lg p-4 border-2 border-red-300 dark:border-red-700 transition-colors`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${currentTheme.text}`}>{task.title}</h3>
                        <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>{task.description}</p>
                        <div className="flex items-center space-x-2 mt-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.assigned_to && (
                            <span className="text-xs text-gray-500">Assigned to: {task.assigned_to.full_name}</span>
                          )}
                          <span className="text-xs text-red-600 font-medium">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tasks */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md transition-colors`}>
            <div className={`p-6 border-b ${currentTheme.border}`}>
              <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Recent Tasks</h2>
            </div>
            <div className={`divide-y ${currentTheme.border}`}>
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <div key={task._id} className={`p-6 ${currentTheme.hover} transition-colors border-l-4 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-400' : getStatusBorderColor(task.status)}`} data-testid="task-item">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusAccentColor(task.status)} flex-shrink-0`}></div>
                            <h3 className={`font-semibold ${currentTheme.text}`}>{task.title}</h3>
                            {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>{task.description}</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assigned_to && task.assigned_to.length > 0 && (
                              <span className={`text-xs ${currentTheme.textMuted}`}>Assigned to: {task.assigned_to.map(u => u.full_name).join(', ')}</span>
                            )}
                            {task.due_date && (
                              <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : currentTheme.textMuted}`}>
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`p-8 text-center ${currentTheme.textMuted}`}>
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;