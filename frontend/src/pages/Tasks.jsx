import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { Plus, X, Edit2, Trash2, MessageSquare, Clock, UserCheck } from 'lucide-react';

const Tasks = () => {
  const { user, socket } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    showMyTasksOnly: false,
    team: '', // Advanced
    assigned_to: '', // Advanced
    dueDateFrom: '', // Advanced
    dueDateTo: '', // Advanced
    search: '', // Advanced
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

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  // Memoize filtered tasks to prevent unnecessary recalculations
  const applyFilters = useCallback(() => {
    let filtered = [...tasks];
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters.team) {
      filtered = filtered.filter((t) => t.team_id && (t.team_id._id === filters.team || t.team_id === filters.team));
    }
    if (filters.assigned_to) {
      filtered = filtered.filter((t) => t.assigned_to && t.assigned_to.some(u => (u._id || u) === filters.assigned_to));
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
    // Filter to show only tasks assigned to current user
    if (filters.showMyTasksOnly) {
      filtered = filtered.filter((t) => {
        if (!t.assigned_to) return false;
        const assignedIds = Array.isArray(t.assigned_to) 
          ? t.assigned_to.map(u => typeof u === 'object' ? u._id : u)
          : [typeof t.assigned_to === 'object' ? t.assigned_to._id : t.assigned_to];
        const isAssignedToUser = assignedIds.includes(user?.id);
        // For members, also check if task belongs to their team
        if (user?.role === 'member') {
          const belongsToUserTeam = user.team_id && t.team_id && 
            (t.team_id._id === user.team_id || t.team_id === user.team_id);
          return isAssignedToUser && belongsToUserTeam;
        }
        return isAssignedToUser;
      });
    }
    setFilteredTasks(filtered);
  }, [tasks, filters, user?.id, user?.role, user?.team_id]);

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
      // Use different endpoint based on role
      const endpoint = user?.role === 'team_lead' ? '/users/team-members' : '/users';
      const response = await api.get(endpoint);
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
      console.error('Error fetching teams:', error);
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
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    // Optimistic update - update UI immediately
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

      if (selectedTask?._id === taskId) {
        setSelectedTask(updatedTask);
      }
      if (editingTask?._id === taskId) {
        setEditingTask(updatedTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.response?.data?.message || 'Failed to update task');
      // Revert on error
      fetchTasks();
    }
  };

  const openEditModal = (task) => {
    setEditingTask({
      ...task,
      assigned_to: task.assigned_to ? (Array.isArray(task.assigned_to) ? task.assigned_to.map(u => u._id) : [task.assigned_to._id]) : [],
      team_id: task.team_id?._id || task.team_id || '',
    });
    setSelectedTeamMembers(task.team_id?.members || []);
    setShowEditModal(true);
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        due_date: editingTask.due_date,
        team_id: editingTask.team_id,
        assigned_to: editingTask.assigned_to,
      };

      await api.patch(`/tasks/${editingTask._id}`, updates);
      setShowEditModal(false);
      setEditingTask(null);
      setSelectedTeamMembers([]);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.response?.data?.message || 'Failed to update task');
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
    setEditingTask({ ...editingTask, team_id: teamId, assigned_to: [] });
  };

  const handleMemberToggle = (memberId) => {
    const currentAssigned = editingTask.assigned_to || [];
    const isSelected = currentAssigned.includes(memberId);

    if (isSelected) {
      setEditingTask({
        ...editingTask,
        assigned_to: currentAssigned.filter(id => id !== memberId)
      });
    } else {
      setEditingTask({
        ...editingTask,
        assigned_to: [...currentAssigned, memberId]
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const viewTaskDetails = async (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    
    // Fetch comments
    try {
      const response = await api.get(`/comments/${task._id}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/comments/${selectedTask._id}/comments`, {
        content: newComment,
      });
      setNewComment('');
      
      // Refresh comments
      const response = await api.get(`/comments/${selectedTask._id}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
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

  const canEditTask = (task) => {
    if (['admin', 'hr', 'team_lead'].includes(user?.role)) return true;
    return task.created_by._id === user?.id || task.assigned_to?._id === user?.id;
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
            <div className="relative">
              <div className="animate-spin-fast rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse h-8 w-8 bg-blue-600 rounded-full opacity-30"></div>
              </div>
            </div>
            <p className={`${currentTheme.text} font-medium`}>Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`} data-testid="tasks-page">
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Tasks</h1>
            <p className={`${currentTheme.textSecondary} mt-2`}>Manage and track your tasks</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
            data-testid="create-task-btn"
          >
            <Plus className="w-5 h-5" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
                data-testid="filter-status"
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
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input"
                data-testid="filter-priority"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Assignment
              </label>
              <button
                onClick={() => setFilters({ ...filters, showMyTasksOnly: !filters.showMyTasksOnly })}
                className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                  filters.showMyTasksOnly
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : `${currentTheme.surface} border-2 ${currentTheme.border} ${currentTheme.text} hover:bg-gray-50 dark:hover:bg-gray-700`
                }`}
                data-testid="filter-my-tasks"
              >
                <UserCheck className="w-4 h-4" />
                <span>{filters.showMyTasksOnly ? 'My Tasks Only' : 'All Tasks'}</span>
              </button>
            </div>
            {/* Advanced Filters for HR/Admin */}
            {['admin', 'hr'].includes(user?.role) && (
              <>
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Team
                  </label>
                  <select
                    value={filters.team}
                    onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                    className="input"
                  >
                    <option value="">All Teams</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Assigned User
                  </label>
                  <select
                    value={filters.assigned_to}
                    onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
                    className="input"
                  >
                    <option value="">All Users</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Due Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dueDateFrom}
                    onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Due Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dueDateTo}
                    onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="input"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className={`${currentTheme.surface} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${getStatusBorderColor(task.status)}`}
              onClick={() => viewTaskDetails(task)}
              data-testid="task-card"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2 flex-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusAccentColor(task.status)} flex-shrink-0`}></div>
                  <h3 className={`font-semibold text-lg ${currentTheme.text}`}>{task.title}</h3>
                </div>
                <div className="flex space-x-2">
                  {canEditTask(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid="edit-task-btn"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDeleteTask(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      data-testid="delete-task-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={`text-sm ${currentTheme.textSecondary} mb-4 line-clamp-2`}>{task.description}</div>

              <div className="flex flex-wrap gap-2 mb-4">
                {/* Enhanced inline status update dropdown */}
                <select
                  value={task.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      await api.patch(`/tasks/${task._id}`, { status: newStatus });
                      setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
                    } catch (err) {
                      alert('Failed to update status');
                    }
                  }}
                  className={`input text-xs px-2 py-1 rounded-full font-semibold border-2 ${
                    task.status === 'todo' ? 'bg-gray-100 border-gray-400 text-gray-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 border-blue-400 text-blue-800' :
                    task.status === 'review' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
                    task.status === 'done' ? 'bg-green-100 border-green-400 text-green-800' :
                    task.status === 'archived' ? 'bg-red-100 border-red-400 text-red-800' :
                    'bg-gray-200 border-gray-300 text-gray-700'
                  } transition-colors`}
                  style={{ minWidth: 110 }}
                  data-testid="inline-status-select"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="todo" className="bg-gray-100 text-gray-800">To Do</option>
                  <option value="in_progress" className="bg-blue-100 text-blue-800">In Progress</option>
                  <option value="review" className="bg-yellow-100 text-yellow-800">Review</option>
                  <option value="done" className="bg-green-100 text-green-800">Done</option>
                  <option value="archived" className="bg-red-100 text-red-800">Archived</option>
                </select>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {task.assigned_to && task.assigned_to.length > 0 && (
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    <span className="font-medium">👥 Assigned:</span> {task.assigned_to.map(u => u.full_name).join(', ')}
                  </div>
                )}

                {task.team_id && (
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    <span className="font-medium">🏢 Team:</span> {task.team_id.name}
                  </div>
                )}

                {task.due_date && (
                  <div className={`flex items-center text-sm ${currentTheme.textMuted}`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span className={`font-medium ${new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-orange-600'}`}>
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className={`text-xs ${currentTheme.textMuted}`}>
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className={`${currentTheme.textMuted} text-lg`}>No tasks found. Create your first task!</p>
          </div>
        )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="edit-task-modal">
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Edit Task</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="input"
                  required
                  data-testid="edit-task-title-input"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Description
                </label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="input"
                  rows="4"
                  data-testid="edit-task-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="input"
                    data-testid="edit-task-priority-select"
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
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="input"
                    data-testid="edit-task-status-select"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="input"
                  data-testid="edit-task-due-date-input"
                />
              </div>

              {['admin', 'hr', 'team_lead'].includes(user?.role) && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                      Select Team
                    </label>
                    <select
                      value={editingTask.team_id || ''}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="input"
                      data-testid="edit-task-team-select"
                    >
                      <option value="">No Team</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editingTask.team_id && selectedTeamMembers.length > 0 && (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                        Assign Team Members
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                        {selectedTeamMembers.map((member) => (
                          <label key={member._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editingTask.assigned_to.includes(member._id)}
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
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="submit-edit-task">
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-task-modal">
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
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
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                  data-testid="task-due-date-input"
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
                      onChange={(e) => {
                        const teamId = e.target.value;
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
                      }}
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
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                        {selectedTeamMembers.map((member) => (
                          <label key={member._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.assigned_to.includes(member._id)}
                              onChange={() => {
                                const currentAssigned = formData.assigned_to;
                                const isSelected = currentAssigned.includes(member._id);

                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    assigned_to: currentAssigned.filter(id => id !== member._id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    assigned_to: [...currentAssigned, member._id]
                                  });
                                }
                              }}
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
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="submit-create-task">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="task-detail-modal">
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{selectedTask.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className={`${currentTheme.textSecondary}`}>{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Status
                  </label>
                  {canEditTask(selectedTask) ? (
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateTask(selectedTask._id, { status: e.target.value })}
                      className="input"
                      data-testid="update-task-status"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                      <option value="archived">Archived</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Priority
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      <span className="font-medium">👤 Created by:</span> {selectedTask.created_by?.full_name || 'Unknown'}
                    </p>
                    {selectedTask.team_id && (
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        <span className="font-medium">🏢 Team:</span> {selectedTask.team_id.name}
                      </p>
                    )}
                  </div>
                  <div>
                    {selectedTask.assigned_to && selectedTask.assigned_to.length > 0 && (
                      <div className={`text-sm ${currentTheme.textSecondary}`}>
                        <span className="font-medium">👥 Assigned to:</span>
                        <div className="mt-1">
                          {selectedTask.assigned_to.map((user, index) => (
                            <span key={user._id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                              {user.full_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      <span className="font-medium">📅 Created:</span> {new Date(selectedTask.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {selectedTask.due_date && (
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        <span className="font-medium">⏰ Due:</span>
                        <span className={`font-medium ${new Date(selectedTask.due_date) < new Date() ? 'text-red-600' : 'text-orange-600'}`}>
                          {new Date(selectedTask.due_date).toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedTask.updated_at !== selectedTask.created_at && (
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      <span className="font-medium">🔄 Last updated:</span> {new Date(selectedTask.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className={`${currentTheme.border} border-t pt-6`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${currentTheme.text}`}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments
                </h3>

                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className={`${currentTheme.surfaceSecondary} rounded-lg p-4`} data-testid="comment-item">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-medium text-sm ${currentTheme.text}`}>{comment.author_id?.full_name || 'Unknown'}</span>
                        <span className={`text-xs ${currentTheme.textMuted}`}>
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className={`${currentTheme.textMuted} text-sm`}>No comments yet</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="input flex-1"
                    data-testid="comment-input"
                  />
                  <button type="submit" className="btn btn-primary" data-testid="submit-comment">
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
