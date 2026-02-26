import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Filter, Calendar, AlertTriangle, TrendingUp, BarChart3, Target, User, Users, Clock, Download, FileSpreadsheet, FileText, X, ChevronDown, Menu } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { generateExcelReport } from '../utils/reportGenerator';
import { generateComprehensivePDFReport } from '../utils/comprehensiveReportGenerator';

const Analytics = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    team: '',
    user: '',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
  });
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('all');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    weeklyProgress: [],
    hourlyDistribution: [],
    taskAgeDistribution: [],
    completionRateByTeam: [],
    priorityTrend: [],
    statusTransitions: [],
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchTasks();
      await fetchTeams();
      if (['admin', 'hr'].includes(user?.role)) {
        await fetchUsers();
      }
    };
    loadData();
  }, [user?.role]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  useEffect(() => {
    if (filteredTasks.length >= 0) {
      processAnalyticsData(filteredTasks);
    }
  }, [filteredTasks]);

  useRealtimeSync({
    onTaskCreated: () => fetchTasks(),
    onTaskUpdated: () => fetchTasks(),
    onTaskDeleted: () => fetchTasks(),
  });

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      if (error.response?.status !== 403) {
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      if (error.response?.status !== 403) {
      }
    }
  };

  const processAnalyticsData = useCallback((taskList) => {
    const now = new Date();
    const overdueTasks = taskList.filter(task =>
      task.due_date && new Date(task.due_date) < now && task.status !== 'done'
    );
    const completedTasks = taskList.filter(task => task.status === 'done');
    const inProgressTasks = taskList.filter(task => task.status === 'in_progress');

    const statusCounts = taskList.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
      color: getStatusChartColor(status),
    }));

    const priorityCounts = taskList.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count,
    }));

    const overdueByPriority = overdueTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const overduePriorityData = Object.entries(overdueByPriority).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count,
    }));

    // 30-day completion trend
    const completionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTasks = taskList.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate.toDateString() === date.toDateString();
      });
      const dayCompleted = dayTasks.filter(t => t.status === 'done');
      completionTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: dayTasks.length,
        completed: dayCompleted.length,
      });
    }

    // Weekly progress (last 8 weeks)
    const weeklyProgress = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekTasks = taskList.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(t => t.status === 'done').length;
      const weekInProgress = weekTasks.filter(t => t.status === 'in_progress').length;
      const weekTodo = weekTasks.filter(t => t.status === 'todo').length;
      
      weeklyProgress.push({
        week: `W${i === 0 ? 'Now' : i}`,
        completed: weekCompleted,
        inProgress: weekInProgress,
        todo: weekTodo,
        total: weekTasks.length,
      });
    }

    // Hourly distribution (when tasks are created)
    const hourlyDistribution = Array(24).fill(0).map((_, hour) => ({
      hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      count: 0,
    }));
    
    taskList.forEach(task => {
      const hour = new Date(task.created_at).getHours();
      hourlyDistribution[hour].count++;
    });

    // Task age distribution (how long tasks remain open)
    const taskAgeDistribution = [
      { range: '0-1 days', count: 0 },
      { range: '1-3 days', count: 0 },
      { range: '3-7 days', count: 0 },
      { range: '7-14 days', count: 0 },
      { range: '14-30 days', count: 0 },
      { range: '30+ days', count: 0 },
    ];
    
    taskList.forEach(task => {
      if (task.status !== 'done') {
        const age = Math.floor((now - new Date(task.created_at)) / (1000 * 60 * 60 * 24));
        if (age <= 1) taskAgeDistribution[0].count++;
        else if (age <= 3) taskAgeDistribution[1].count++;
        else if (age <= 7) taskAgeDistribution[2].count++;
        else if (age <= 14) taskAgeDistribution[3].count++;
        else if (age <= 30) taskAgeDistribution[4].count++;
        else taskAgeDistribution[5].count++;
      }
    });

    // Priority trend over time (last 12 weeks)
    const priorityTrend = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekTasks = taskList.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      priorityTrend.push({
        week: `W${12 - i}`,
        low: weekTasks.filter(t => t.priority === 'low').length,
        medium: weekTasks.filter(t => t.priority === 'medium').length,
        high: weekTasks.filter(t => t.priority === 'high').length,
        urgent: weekTasks.filter(t => t.priority === 'urgent').length,
      });
    }

    const userStats = taskList.reduce((acc, task) => {
      if (task.assigned_to && task.assigned_to.length > 0) {
        task.assigned_to.forEach(user => {
          const userId = user._id;
          const userName = user.full_name;
          if (!acc[userId]) {
            acc[userId] = { name: userName, total: 0, completed: 0, overdue: 0 };
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

    const teamCounts = taskList.reduce((acc, task) => {
      const teamName = task.team_id?.name || 'Unassigned';
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {});

    const teamDistribution = Object.entries(teamCounts)
      .map(([team, count]) => ({ name: team, value: count }))
      .sort((a, b) => b.value - a.value);

    // Completion rate by team
    const completionRateByTeam = Object.entries(
      taskList.reduce((acc, task) => {
        const teamName = task.team_id?.name || 'Unassigned';
        if (!acc[teamName]) {
          acc[teamName] = { total: 0, completed: 0 };
        }
        acc[teamName].total++;
        if (task.status === 'done') acc[teamName].completed++;
        return acc;
      }, {})
    ).map(([team, stats]) => ({
      team,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      completed: stats.completed,
      total: stats.total,
    })).sort((a, b) => b.rate - a.rate);

    setAnalyticsData({
      totalTasks: taskList.length,
      overdueTasks: overdueTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      statusDistribution,
      priorityDistribution,
      teamDistribution,
      overdueByPriority: overduePriorityData,
      completionTrend,
      assigneePerformance,
      weeklyProgress,
      hourlyDistribution,
      taskAgeDistribution,
      completionRateByTeam,
      priorityTrend,
    });
  }, []);

  const applyFilters = () => {
    let filtered = [...tasks];
    if (user?.role === 'member') {
      filtered = filtered.filter(task => {
        const isAssignedToUser = task.assigned_to && task.assigned_to.some(assignedUser => 
          assignedUser._id === user.id || assignedUser === user.id
        );
        const belongsToUserTeam = user.team_id && task.team_id && 
          (task.team_id._id === user.team_id || task.team_id === user.team_id);
        return isAssignedToUser && belongsToUserTeam;
      });
    }
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.team) {
      filtered = filtered.filter(task => task.team_id?._id === filters.team);
    }
    if (filters.user) {
      if (filters.user === 'unassigned') {
        filtered = filtered.filter(task => !task.assigned_to || task.assigned_to.length === 0);
      } else {
        filtered = filtered.filter(task => task.assigned_to && task.assigned_to.some(u => u._id === filters.user));
      }
    }
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
      }
      if (startDate && filters.dateRange !== 'custom') {
        filtered = filtered.filter(task => new Date(task.created_at) >= startDate);
      }
    }
    setFilteredTasks(filtered);
  };

  const getStatusChartColor = (status) => {
    const colors = {
      todo: '#6b7280',
      in_progress: '#136dec',
      review: '#eab308',
      done: '#22c55e',
      archived: '#ef4444',
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444',
    };
    return colors[priority] || colors.medium;
  };

  const handleExportExcel = () => {
    try {
      generateExcelReport(filteredTasks, analyticsData, filters);
    } catch (error) {
      alert('Error generating Excel report. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      generateComprehensivePDFReport(filteredTasks, analyticsData, filters, user, reportPeriod);
      setShowReportOptions(false);
    } catch (error) {
      alert('Error generating PDF report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-['Inter'] h-screen flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-4 h-12 bg-[#136dec] rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full w-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} overflow-hidden`}>
        {/* Header Section */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} shrink-0`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileSidebar}
                className={`lg:hidden flex-shrink-0 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-base sm:text-lg md:text-xl font-bold leading-tight truncate`}>Analytics & Reports</h2>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2`}>
                  {user?.role === 'member' 
                    ? 'View your personal task statistics' 
                    : user?.role === 'team_lead'
                    ? 'Overview of your team performance'
                    : 'Track team performance, task velocity, and operational metrics'}
                </p>
              </div>
            </div>
            {['admin', 'hr'].includes(user?.role) && (
              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center rounded h-9 px-3 sm:px-4 bg-green-600 text-white gap-2 text-sm font-bold hover:bg-green-700 transition-colors"
                  title="Export comprehensive Excel report"
                >
                  <FileSpreadsheet size={18} />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowReportOptions(!showReportOptions)}
                    className="flex items-center justify-center rounded h-9 px-3 sm:px-4 bg-red-600 text-white gap-2 text-sm font-bold hover:bg-red-700 transition-colors"
                    title="Export PDF report"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">PDF</span>
                    <ChevronDown size={16} className="hidden sm:block" />
                  </button>
                  {showReportOptions && (
                    <div className={`absolute right-0 mt-2 w-56 rounded ${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} shadow-lg z-10`}>
                      <div className="py-1">
                        <div className={`px-4 py-2 text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Report Period</div>
                        <button
                          onClick={() => { setReportPeriod('daily'); handleExportPDF(); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          Daily Report (Today)
                        </button>
                        <button
                          onClick={() => { setReportPeriod('weekly'); handleExportPDF(); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          Weekly Report (Last 7 Days)
                        </button>
                        <button
                          onClick={() => { setReportPeriod('monthly'); handleExportPDF(); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          Monthly Report (This Month)
                        </button>
                        <button
                          onClick={() => { setReportPeriod('all'); handleExportPDF(); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          Complete Report (All Time)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 sm:hover:bg-[#282f39]/30 sm:px-2 sm:py-1 sm:rounded transition-colors lg:pointer-events-none"
              >
                <Filter size={14} className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} />
                <span className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Filters</span>
                <ChevronDown 
                  size={16} 
                  className={`lg:hidden transition-transform ${showFilters ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}
                />
              </button>
              {showFilters && (
                <button
                  onClick={() => setFilters({ status: '', priority: '', team: '', user: '', dateRange: 'all', customStartDate: '', customEndDate: '' })}
                  className="text-[10px] sm:text-xs text-[#136dec] hover:text-blue-400 font-medium"
                >
                  Reset All
                </button>
              )}
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[500px] lg:opacity-100'}`}>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {user?.role !== 'member' && (
                <>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom</option>
                  </select>

                  <select
                    value={filters.team}
                    onChange={(e) => setFilters({...filters, team: e.target.value})}
                    className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="">All Teams</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>

                  <select
                    value={filters.user}
                    onChange={(e) => setFilters({...filters, user: e.target.value})}
                    className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="">All Users</option>
                    <option value="unassigned">Unassigned</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.full_name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {filters.dateRange === 'custom' && showFilters && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3 lg:block lg:grid">
                <input
                  type="date"
                  value={filters.customStartDate}
                  onChange={(e) => setFilters({...filters, customStartDate: e.target.value})}
                  className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                />
                <input
                  type="date"
                  value={filters.customEndDate}
                  onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                  className={`h-9 px-2 sm:px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-4`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs uppercase tracking-wider font-medium`}>Total Tasks</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mt-1 sm:mt-2`}>{analyticsData.totalTasks}</p>
                </div>
                <BarChart3 className="text-[#136dec] hidden sm:block" size={40} />
              </div>
            </div>

            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-4`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs uppercase tracking-wider font-medium`}>Overdue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500 mt-1 sm:mt-2">{analyticsData.overdueTasks}</p>
                </div>
                <AlertTriangle className="text-red-500 hidden sm:block" size={40} />
              </div>
            </div>

            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-4`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs uppercase tracking-wider font-medium`}>Completed</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-1 sm:mt-2">{analyticsData.completedTasks}</p>
                </div>
                <TrendingUp className="text-green-500 hidden sm:block" size={40} />
              </div>
            </div>

            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-4`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs uppercase tracking-wider font-medium`}>In Progress</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-500 mt-1 sm:mt-2">{analyticsData.inProgressTasks}</p>
                </div>
                <Clock className="text-yellow-500 hidden sm:block" size={40} />
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          {user?.role !== 'member' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Status Distribution */}
              <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Task Status Distribution</h3>
                <div style={{ width: '100%', minWidth: '200px' }}>
                  <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => window.innerWidth < 640 ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius="55%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                      {analyticsData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Distribution */}
              <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Task Priority Distribution</h3>
                <div style={{ width: '100%', minWidth: '200px' }}>
                  <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <BarChart data={analyticsData.priorityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                    <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                    <Bar dataKey="value" fill="#136dec" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Charts - Admin/HR Only */}
          {['admin', 'hr'].includes(user?.role) && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Overdue by Priority */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className="text-xs sm:text-sm font-bold text-red-500 uppercase tracking-wider mb-3 sm:mb-4">Overdue Tasks by Priority</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                      <BarChart data={analyticsData.overdueByPriority}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                {/* Completion Trend */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Completion Trend (30 Days)</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                      <AreaChart data={analyticsData.completionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                        <XAxis dataKey="date" stroke="#9da8b9" tick={{ fontSize: 7 }} angle={-60} textAnchor="end" height={50} />
                        <YAxis stroke="#9da8b9" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Area type="monotone" dataKey="created" stackId="1" stroke="#136dec" fill="#136dec" />
                      <Area type="monotone" dataKey="completed" stackId="2" stroke="#22c55e" fill="#22c55e" />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* User Performance */}
              <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6 mb-4 sm:mb-6`}>
                <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>User Performance</h3>
                <div style={{ width: '100%', minWidth: '200px' }}>
                  <ResponsiveContainer width="100%" aspect={1.5} minWidth={200}>
                  <BarChart data={analyticsData.assigneePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                    <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 7 }} angle={-60} textAnchor="end" height={70} />
                    <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                    <Bar dataKey="total" fill="#136dec" name="Total Tasks" />
                    <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                    <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>

              {/* Team Distribution */}
              <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6 mb-4 sm:mb-6`}>
                <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Tasks by Team</h3>
                {analyticsData.teamDistribution && analyticsData.teamDistribution.length > 0 ? (
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.5} minWidth={200}>
                    <BarChart data={analyticsData.teamDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="name" stroke="#9da8b9" tick={{ fontSize: 7 }} angle={-60} textAnchor="end" height={80} interval={0} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Bar dataKey="value" fill="#22c55e" name="Tasks">
                        {analyticsData.teamDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 50%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <p className={`text-center py-8 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm`}>No team data available</p>
                )}
              </div>

              {/* NEW CHARTS START HERE */}
              
              {/* Weekly Progress Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Weekly Progress (Last 8 Weeks)</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <LineChart data={analyticsData.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="week" stroke="#9da8b9" tick={{ fontSize: 9 }} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
                      <Line type="monotone" dataKey="inProgress" stroke="#136dec" strokeWidth={2} name="In Progress" />
                      <Line type="monotone" dataKey="todo" stroke="#6b7280" strokeWidth={2} name="To Do" />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                {/* Hourly Distribution */}
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Task Creation by Hour</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <BarChart data={analyticsData.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="hour" stroke="#9da8b9" tick={{ fontSize: 6 }} angle={-60} textAnchor="end" height={55} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Bar dataKey="count" fill="#f59e0b" name="Tasks Created" />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Task Age Distribution & Priority Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Open Task Age Distribution</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <BarChart data={analyticsData.taskAgeDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis type="number" stroke="#9da8b9" tick={{ fontSize: 9 }} />
                      <YAxis dataKey="range" type="category" stroke="#9da8b9" tick={{ fontSize: 8 }} width={60} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Bar dataKey="count" fill="#8b5cf6" name="Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-3 sm:p-6`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3 sm:mb-4`}>Priority Trend (12 Weeks)</h3>
                  <div style={{ width: '100%', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" aspect={1.8} minWidth={200}>
                    <AreaChart data={analyticsData.priorityTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                      <XAxis dataKey="week" stroke="#9da8b9" tick={{ fontSize: 8 }} />
                      <YAxis stroke="#9da8b9" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.5rem' }} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Area type="monotone" dataKey="urgent" stackId="1" stroke="#ef4444" fill="#ef4444" name="Urgent" />
                      <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" name="High" />
                      <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Medium" />
                      <Area type="monotone" dataKey="low" stackId="1" stroke="#10b981" fill="#10b981" name="Low" />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Team Completion Rate */}
              <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-6 mb-6`}>
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-4`}>Team Completion Rate</h3>
                <ResponsiveContainer width="100%" height={350} minWidth={200} minHeight={350}>
                  <BarChart data={analyticsData.completionRateByTeam}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282f39" />
                    <XAxis dataKey="team" stroke="#9da8b9" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#9da8b9" tick={{ fontSize: 11 }} label={{ value: 'Completion Rate %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c2027', border: '1px solid #282f39', borderRadius: '0.125rem' }}
                      formatter={(value, name, props) => {
                        if (name === 'rate') return [`${value}%`, 'Completion Rate'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="rate" fill="#06b6d4" name="Completion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Tasks Table */}
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} overflow-hidden`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                {filters.status || filters.priority || filters.team || filters.user || filters.dateRange !== 'all' 
                  ? `Filtered Tasks (${filteredTasks.length})` 
                  : `All Tasks (${filteredTasks.length})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Task</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Status</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Priority</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider hidden lg:table-cell`}>Assigned</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Due Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'}`}>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                        No tasks found matching the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.slice(0, 50).map((task) => {
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                      return (
                        <tr key={task._id} className={`${isOverdue ? 'bg-red-900/10' : ''} ${theme === 'dark' ? 'hover:bg-[#282f39]/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{task.title}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} truncate max-w-xs`}>{task.description}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                              task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              task.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded`} style={{ 
                              backgroundColor: getPriorityColor(task.priority) + '20', 
                              color: getPriorityColor(task.priority) 
                            }}>
                              {task.priority}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} hidden lg:table-cell`}>
                            {task.assigned_to && task.assigned_to.length > 0
                              ? task.assigned_to.map(u => u.full_name).join(', ')
                              : 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`text-sm flex items-center gap-2 ${isOverdue ? 'text-red-400' : `${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}`}>
                              {isOverdue && <AlertTriangle size={16} />}
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
