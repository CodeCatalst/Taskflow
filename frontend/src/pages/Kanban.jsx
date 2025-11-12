import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Plus, X, Edit2, Trash2, Clock, Users, UserCheck, Target, AlertTriangle, Calendar, User, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Kanban = () => {
  const { user, socket } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [filters, setFilters] = useState({
    team: '',
    assigned_to: '',
    showMyTasksOnly: false,
    status: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    team_id: '',
    assigned_to: [],
  });
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100', borderColor: 'border-gray-500', accentColor: 'bg-gray-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100', borderColor: 'border-blue-500', accentColor: 'bg-blue-500' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100', borderColor: 'border-yellow-500', accentColor: 'bg-yellow-500' },
    { id: 'done', title: 'Done', color: 'bg-green-100', borderColor: 'border-green-500', accentColor: 'bg-green-500' },
  ];

  useEffect(() => {
    fetchTasks();
    if (['admin', 'hr', 'team_lead'].includes(user?.role)) {
      fetchUsers();
      fetchTeams();
    }

    // Check if we should open create modal
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }

    // Socket listeners
    if (socket) {
      socket.on('task:created', (task) => {
        setTasks((prev) => [task, ...prev]);
      });

      socket.on('task:updated', (task) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === task._id ? task : t))
        );
      });

      return () => {
        socket.off('task:created');
        socket.off('task:updated');
      };
    }
  }, [socket]);

  // Real-time synchronization
  useRealtimeSync({
    onTaskCreated: () => {
      fetchTasks();
    },
    onTaskUpdated: () => {
      fetchTasks();
    },
    onTaskDeleted: () => {
      fetchTasks();
    },
    onStatusChanged: () => {
      fetchTasks();
    },
  });

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      if (error.response?.status === 403) {
        // No permission to view all users
      } else {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams);
    } catch (error) {
      if (error.response?.status === 403) {
        // No permission to view teams
      } else {
        console.error('Error fetching teams:', error);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        team_id: '',
        assigned_to: [],
      });
      setSelectedTeamMembers([]);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
    );

    try {
      const response = await api.patch(`/tasks/${taskId}`, updates);
      const updatedTask = response.data.task;
      
      // Update with server response
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? updatedTask : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.response?.data?.message || 'Failed to update task');
      // Revert on error
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to allow the drag image to be created
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the column (not entering a child element)
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await handleUpdateTask(draggedTask._id, { status: newStatus });
      setDraggedTask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      setDraggedTask(null);
    }
  };

  const handleTeamChange = (teamId) => {
    const selectedTeam = teams.find(team => team._id === teamId);
    let members = selectedTeam ? selectedTeam.members : [];
    
    // Ensure team lead is always included in the assignable members
    if (selectedTeam && user?.role === 'team_lead') {
      const teamLeadAlreadyIncluded = members.some(member => member._id === user?.id);
      if (!teamLeadAlreadyIncluded && selectedTeam.lead_id?._id === user?.id) {
        // Add the team lead to the members list
        members = [
          ...members,
          {
            _id: user.id,
            full_name: user.full_name || user.username || user.email,
            role: user.role,
            email: user.email
          }
        ];
      }
    }
    
    setSelectedTeamMembers(members);
    setFormData({ ...formData, team_id: teamId, assigned_to: [] });
  };

  const handleMemberToggle = (memberId) => {
    const currentAssigned = formData.assigned_to;
    const isSelected = currentAssigned.includes(memberId);

    if (isSelected) {
      setFormData({
        ...formData,
        assigned_to: currentAssigned.filter(id => id !== memberId)
      });
    } else {
      setFormData({
        ...formData,
        assigned_to: [...currentAssigned, memberId]
      });
    }
  };

  const getTasksByStatus = (status) => {
    let filtered = tasks.filter(task => task.status === status);
    if (filters.team) {
      filtered = filtered.filter((t) => t.team_id && (t.team_id._id === filters.team || t.team_id === filters.team));
    }
    if (filters.assigned_to) {
      filtered = filtered.filter((t) => t.assigned_to && t.assigned_to.some(u => (u._id || u) === filters.assigned_to));
    }
    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters.dueDateFrom) {
      filtered = filtered.filter((t) => t.due_date && new Date(t.due_date) >= new Date(filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter((t) => t.due_date && new Date(t.due_date) <= new Date(filters.dueDateTo));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (filters.showMyTasksOnly) {
      filtered = filtered.filter((t) => {
        if (!t.assigned_to) return false;
        const assignedIds = Array.isArray(t.assigned_to) 
          ? t.assigned_to.map(u => typeof u === 'object' ? u._id : u)
          : [typeof t.assigned_to === 'object' ? t.assigned_to._id : t.assigned_to];
        const isAssignedToUser = assignedIds.includes(user?.id);
        if (user?.role === 'member') {
          const belongsToUserTeam = user.team_id && t.team_id && 
            (t.team_id._id === user.team_id || t.team_id === user.team_id);
          return isAssignedToUser && belongsToUserTeam;
        }
        return isAssignedToUser;
      });
    }
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    return filtered;
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

  const canEditTask = (task) => {
    if (['admin', 'hr', 'team_lead'].includes(user?.role)) return true;
    return task.created_by._id === user?.id || (task.assigned_to && task.assigned_to.some(u => u._id === user?.id));
  };

  const canDeleteTask = (task) => {
    return ['admin', 'hr', 'team_lead'].includes(user?.role);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background}`}>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-12 ${currentColorScheme.primary} rounded-full animate-pulse`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                ></div>
              ))}
            </div>
            <p className={`${currentTheme.text} font-medium`}>Loading Kanban board...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="kanban-page">
      <Navbar />
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 ${currentTheme.background}`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Kanban Board</h1>
                <p className={`${currentTheme.textSecondary} mt-2`}>Visual task management with drag & drop</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`btn ${currentColorScheme.primary} text-white ${currentColorScheme.primaryHover} flex items-center justify-center space-x-2 w-full sm:w-auto`}
                data-testid="create-task-btn"
              >
                <Plus className="w-5 h-5" />
                <span>Create Task</span>
              </button>
            </div>

            {/* Responsive Filters */}
            <div className={`${currentTheme.surface} rounded-lg shadow-md p-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* My Tasks Toggle */}
                <button
                  onClick={() => setFilters({ ...filters, showMyTasksOnly: !filters.showMyTasksOnly })}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 border-2 ${
                    filters.showMyTasksOnly
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600 shadow-md hover:shadow-lg hover:scale-105'
                      : `${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-sm">{filters.showMyTasksOnly ? '👤 My Tasks Only' : '👥 All Tasks'}</span>
                </button>
                
                {/* Advanced Filters for HR/Admin */}
                {['admin', 'hr'].includes(user?.role) && (
                  <>
                    <select
                      value={filters.team}
                      onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.team 
                          ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 focus:ring-orange-500' 
                          : `${currentTheme.border} focus:ring-blue-500`
                      } ${currentTheme.surface} ${currentTheme.text}`}
                    >
                      <option value="">👥 All Teams</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>🏢 {team.name}</option>
                      ))}
                    </select>
                    <select
                      value={filters.assigned_to}
                      onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.assigned_to 
                          ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 focus:ring-blue-500' 
                          : `${currentTheme.border} focus:ring-blue-500`
                      } ${currentTheme.surface} ${currentTheme.text}`}
                    >
                      <option value="">👤 All Users</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>👨‍💼 {u.full_name}</option>
                      ))}
                    </select>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.status 
                          ? filters.status === 'done' 
                            ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                            : filters.status === 'in_progress'
                            ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : filters.status === 'review'
                            ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20'
                          : currentTheme.border
                      } focus:ring-blue-500 ${currentTheme.surface} ${currentTheme.text}`}
                    >
                      <option value="">🌐 All Statuses</option>
                      <option value="todo">⏳ To Do</option>
                      <option value="in_progress">⚡ In Progress</option>
                      <option value="review">👀 Review</option>
                      <option value="done">✅ Done</option>
                    </select>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.priority 
                          ? filters.priority === 'urgent' 
                            ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                            : filters.priority === 'high'
                            ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                            : filters.priority === 'medium'
                            ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                          : currentTheme.border
                      } focus:ring-orange-500 ${currentTheme.surface} ${currentTheme.text}`}
                    >
                      <option value="">🎯 All Priorities</option>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                    <input
                      type="date"
                      value={filters.dueDateFrom}
                      onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.dueDateFrom 
                          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 focus:ring-green-500' 
                          : `${currentTheme.border} focus:ring-green-500`
                      } ${currentTheme.surface} ${currentTheme.text}`}
                      placeholder="Due Date From"
                    />
                    <input
                      type="date"
                      value={filters.dueDateTo}
                      onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                      className={`px-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                        filters.dueDateTo 
                          ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:ring-red-500' 
                          : `${currentTheme.border} focus:ring-red-500`
                      } ${currentTheme.surface} ${currentTheme.text}`}
                      placeholder="Due Date To"
                    />
                    <div className="relative sm:col-span-2 lg:col-span-1">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        filters.search ? 'text-indigo-500' : currentTheme.textMuted
                      }`} />
                      <input
                        type="text"
                        placeholder="🔍 Search tasks..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg font-medium transition-all focus:ring-2 ${
                          filters.search 
                            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 focus:ring-indigo-500' 
                            : `${currentTheme.border} focus:ring-indigo-500`
                        } ${currentTheme.surface} ${currentTheme.text}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex flex-col"
              >
                <div className={`${currentTheme.surface} rounded-lg p-4 mb-4 border-t-4 ${column.borderColor} shadow-sm`}>
                  <h3 className={`font-semibold ${currentTheme.text} flex items-center justify-between`}>
                    <span className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${column.accentColor}`}></div>
                      <span>{column.title}</span>
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full ${currentTheme.surfaceSecondary} ${currentTheme.textSecondary}`}>
                      {getTasksByStatus(column.id).length}
                    </span>
                  </h3>
                </div>

                <div 
                  className={`space-y-3 min-h-[500px] flex-1 p-4 rounded-lg transition-all border-2 ${
                    dragOverColumn === column.id 
                      ? `${column.color} ${column.borderColor} border-dashed shadow-lg` 
                      : `border-transparent ${currentTheme.surfaceSecondary}`
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {getTasksByStatus(column.id).map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`${currentTheme.surface} rounded-lg shadow-sm border-l-4 ${column.borderColor} p-4 cursor-move hover:shadow-lg transition-all ${currentTheme.border} ${
                        draggedTask?._id === task._id ? 'opacity-50' : 'opacity-100'
                      }`}
                      data-testid="kanban-task-card"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className={`w-2 h-2 rounded-full ${column.accentColor} flex-shrink-0`}></div>
                          <h4 className={`font-medium ${currentTheme.text}`}>{task.title}</h4>
                        </div>
                        <div className="flex space-x-1">
                          {canEditTask(task) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit - could open modal or inline edit
                              }}
                              className={`p-1 ${currentColorScheme.primaryText} hover:${currentColorScheme.primaryHover}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDeleteTask(task) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task._id);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className={`text-sm ${currentTheme.textSecondary} mb-3 line-clamp-2`}>{task.description}</p>

                      <div className="flex items-center justify-between mb-3 gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          <select
                            value={task.priority}
                            onChange={async (e) => {
                              const newPriority = e.target.value;
                              try {
                                await handleUpdateTask(task._id, { priority: newPriority });
                              } catch (err) {
                                alert('Failed to update priority');
                              }
                            }}
                            className="input text-xs px-1 py-0 rounded-full"
                            style={{ minWidth: 70 }}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </span>
                        <input
                          type="date"
                          value={task.due_date ? task.due_date.slice(0, 10) : ''}
                          onChange={async (e) => {
                            const newDate = e.target.value;
                            try {
                              await handleUpdateTask(task._id, { due_date: newDate });
                            } catch (err) {
                              alert('Failed to update due date');
                            }
                          }}
                          className="input text-xs px-1 py-0 rounded-full"
                          style={{ minWidth: 110 }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        {task.due_date && (
                          <div className={`flex items-center text-xs ${currentTheme.textMuted}`}>
                            <Clock className="w-3 h-3 mr-1" />
                            <span className={new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <div className={`flex items-center text-xs ${currentTheme.textSecondary} mb-2`}>
                          <Users className="w-3 h-3 mr-1" />
                          <div className="flex flex-wrap gap-1">
                            {task.assigned_to.slice(0, 3).map((user) => (
                              <span key={user._id} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                                {user.full_name.split(' ')[0]}
                              </span>
                            ))}
                            {task.assigned_to.length > 3 && (
                              <span className={`${currentTheme.textMuted}`}>+{task.assigned_to.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {task.team_id && (
                        <div className={`text-xs ${currentTheme.textMuted}`}>
                          🏢 {task.team_id.name}
                        </div>
                      )}

                      {/* Inline status update dropdown */}
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={task.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              await handleUpdateTask(task._id, { status: newStatus });
                            } catch (err) {
                              alert('Failed to update status');
                            }
                          }}
                          className={`input text-xs px-2 py-1 rounded-full font-semibold border-2 ${
                            task.status === 'todo' ? 'bg-gray-100 border-gray-400 text-gray-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 border-blue-400 text-blue-800' :
                            task.status === 'review' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
                            task.status === 'done' ? 'bg-green-100 border-green-400 text-green-800' :
                            'bg-gray-200 border-gray-300 text-gray-700'
                          } transition-colors`}
                          style={{ minWidth: 110 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="todo" className="bg-gray-100 text-gray-800">To Do</option>
                          <option value="in_progress" className="bg-blue-100 text-blue-800">In Progress</option>
                          <option value="review" className="bg-yellow-100 text-yellow-800">Review</option>
                          <option value="done" className="bg-green-100 text-green-800">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {getTasksByStatus(column.id).length === 0 && (
                    <div className={`text-center py-12 ${currentTheme.textMuted}`}>
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">
                        {dragOverColumn === column.id 
                          ? 'Drop here to move task' 
                          : `No tasks in ${column.title.toLowerCase()}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-task-modal">
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Task</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTeamMembers([]);
                }}
                className={`${currentTheme.textMuted} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                  data-testid="task-title-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="4"
                  data-testid="task-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                    data-testid="task-priority-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                    data-testid="task-status-select"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                  data-testid="task-due-date-input"
                  required
                />
              </div>

              {['admin', 'hr', 'team_lead'].includes(user?.role) && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                      Select Team
                    </label>
                    <select
                      value={formData.team_id}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="input"
                      data-testid="task-team-select"
                    >
                      <option value="">No Team</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.team_id && selectedTeamMembers.length > 0 && (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                        Assign Team Members
                      </label>
                      <div className={`space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 ${currentTheme.border}`}>
                        {selectedTeamMembers.map((member) => (
                          <label key={member._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.assigned_to.includes(member._id)}
                              onChange={() => handleMemberToggle(member._id)}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {member.full_name} ({member.role})
                              {member._id === user?.id && <span className="text-blue-600 font-medium"> (You)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTeamMembers([]);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className={`btn ${currentColorScheme.primary} text-white ${currentColorScheme.primaryHover}`} data-testid="submit-create-task">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;