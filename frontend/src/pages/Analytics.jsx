import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { Filter, Calendar, AlertTriangle, TrendingUp, BarChart3, PieChart, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { generateExcelReport } from '../utils/reportGenerator';
import { generateComprehensivePDFReport } from '../utils/comprehensiveReportGenerator';

const Analytics = () => {
  const { user } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
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

  useEffect(() => {
    const loadData = async () => {
      await fetchTasks();
      await fetchTeams();
      await fetchUsers();
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  // Recalculate analytics data whenever filtered tasks change
  useEffect(() => {
    if (filteredTasks.length >= 0) {
      processAnalyticsData(filteredTasks);
    }
  }, [filteredTasks]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      const allTasks = response.data.tasks;
      setTasks(allTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const processAnalyticsData = useCallback((taskList) => {
    const now = new Date();
    const overdueTasks = taskList.filter(task =>
      task.due_date && new Date(task.due_date) < now && task.status !== 'done'
    );

    const completedTasks = taskList.filter(task => task.status === 'done');
    const inProgressTasks = taskList.filter(task => task.status === 'in_progress');

    // Status distribution
    const statusCounts = taskList.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
      color: getStatusChartColor(status),
    }));

    // Priority distribution
    const priorityCounts = taskList.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count,
    }));

    // Overdue by priority
    const overdueByPriority = overdueTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const overduePriorityData = Object.entries(overdueByPriority).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count,
    }));

    // Completion trend (last 30 days)
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
        date: date.toLocaleDateString(),
        created: dayTasks.length,
        completed: dayCompleted.length,
      });
    }

    // User performance
    const userStats = taskList.reduce((acc, task) => {
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
      } else {
        // Unassigned tasks
        if (!acc['unassigned']) {
          acc['unassigned'] = {
            name: 'Unassigned',
            total: 0,
            completed: 0,
            overdue: 0,
          };
        }
        acc['unassigned'].total++;
        if (task.status === 'done') acc['unassigned'].completed++;
        if (task.due_date && new Date(task.due_date) < now && task.status !== 'done') {
          acc['unassigned'].overdue++;
        }
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

    // Team distribution
    const teamCounts = taskList.reduce((acc, task) => {
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
    });
  }, []);

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Team filter
    if (filters.team) {
      filtered = filtered.filter(task => task.team_id?._id === filters.team);
    }

    // User filter
    if (filters.user) {
      if (filters.user === 'unassigned') {
        filtered = filtered.filter(task => !task.assigned_to || task.assigned_to.length === 0);
      } else {
        filtered = filtered.filter(task => task.assigned_to && task.assigned_to.some(user => user._id === filters.user));
      }
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

    setFilteredTasks(filtered);
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444',
    };
    return colors[priority] || colors.medium;
  };

  const exportAnalyticsToCSV = () => {
    const csvData = filteredTasks.map(task => ({
      Title: task.title,
      Description: task.description,
      Status: task.status,
      Priority: task.priority,
      Assigned_To: task.assigned_to?.full_name || 'Unassigned',
      Created_At: new Date(task.created_at).toLocaleDateString(),
      Due_Date: task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date',
      Is_Overdue: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' ? 'Yes' : 'No',
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    try {
      generateExcelReport(filteredTasks, analyticsData, filters);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Error generating Excel report. Please try again.');
    }
  };

  const handleExportPDF = () => {
    try {
      generateComprehensivePDFReport(filteredTasks, analyticsData, filters, user, reportPeriod);
      setShowReportOptions(false);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const generateAnalyticsPDF = async () => {
    // This function is deprecated - use handleExportPDF instead
    handleExportPDF();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background}`}>
        <div className="flex">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentColorScheme.primary}`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="flex">
        <Navbar />
        <div id="analytics-content" className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Analytics Dashboard</h1>
                <p className={`${currentTheme.textSecondary} mt-2`}>Advanced task analytics and filtering</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportExcel}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2 shadow-md transition-all"
                  title="Export comprehensive Excel report with multiple sheets"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Export Excel</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowReportOptions(!showReportOptions)}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2 shadow-md transition-all"
                    title="Export PDF report with charts and tables"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Export PDF</span>
                    <CalendarIcon className="w-4 h-4" />
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
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className={`w-5 h-5 ${currentTheme.textSecondary}`} />
                <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Filters</h2>
              </div>
              <button
                onClick={() => setFilters({
                  status: '',
                  priority: '',
                  team: '',
                  user: '',
                  dateRange: 'all',
                  customStartDate: '',
                  customEndDate: '',
                })}
                className="btn bg-gray-600 text-white hover:bg-gray-700 text-sm px-4 py-2"
              >
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

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

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>Team</label>
                <select
                  value={filters.team}
                  onChange={(e) => setFilters({...filters, team: e.target.value})}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>User</label>
                <select
                  value={filters.user}
                  onChange={(e) => setFilters({...filters, user: e.target.value})}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${currentTheme.border} focus:ring-blue-500`}
                >
                  <option value="">All Users</option>
                  <option value="unassigned">Unassigned</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => setFilters({...filters, customStartDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Total Tasks</p>
                  <p className={`text-3xl font-bold ${currentTheme.text} mt-2`}>{analyticsData.totalTasks}</p>
                </div>
                <BarChart3 className={`w-12 h-12 ${currentColorScheme.primaryText}`} />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Overdue Tasks</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{analyticsData.overdueTasks}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>Completed Tasks</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{analyticsData.completedTasks}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${currentTheme.textSecondary} text-sm`}>In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{analyticsData.inProgressTasks}</p>
                </div>
                <Calendar className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Tasks by Team - Numerical Stats */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8`}>
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
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
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

          {/* Filtered Tasks Table - Shows prominently BEFORE charts */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md mb-8`}>
            <div className={`p-6 border-b ${currentTheme.border}`}>
              <h2 className={`text-xl font-semibold ${currentTheme.text}`}>
                {filters.status || filters.priority || filters.team || filters.user || filters.dateRange !== 'all' 
                  ? `Filtered Tasks (${filteredTasks.length})` 
                  : `All Tasks (${filteredTasks.length})`}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme.surfaceSecondary}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Task</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Priority</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Assigned To</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Due Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Overdue</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {filteredTasks.map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                    return (
                      <tr key={task._id} className={isOverdue ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${currentTheme.text}`}>{task.title}</div>
                          <div className={`text-sm ${currentTheme.textMuted} truncate max-w-xs`}>{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusChartColor(task.status) === '#6b7280' ? 'bg-gray-100 text-gray-800' : getStatusChartColor(task.status) === '#3b82f6' ? 'bg-blue-100 text-blue-800' : getStatusChartColor(task.status) === '#f59e0b' ? 'bg-yellow-100 text-yellow-800' : getStatusChartColor(task.status) === '#10b981' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`} style={{ backgroundColor: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}>
                            {task.priority}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.textSecondary}`}>
                          {task.assigned_to && task.assigned_to.length > 0
                            ? task.assigned_to.map(user => user.full_name).join(', ')
                            : 'Unassigned'
                          }
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.textSecondary}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOverdue && (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Status Distribution */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Distribution */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Overdue Tasks Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Overdue by Priority */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <h3 className="text-lg font-semibold mb-4 text-red-600">Overdue Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.overdueByPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Completion Trend */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Task Completion Trend (30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="completed" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Performance */}
        <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8`}>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>User Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.assigneePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" name="Total Tasks" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by Team */}
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-8`}>
            <h3 className={`text-lg font-semibold mb-4 ${currentTheme.text}`}>Tasks by Team</h3>
            {analyticsData.teamDistribution && analyticsData.teamDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.teamDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" name="Tasks">
                    {analyticsData.teamDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-center py-8 ${currentTheme.textSecondary}`}>No team data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;