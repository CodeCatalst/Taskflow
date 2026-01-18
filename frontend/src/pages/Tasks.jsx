import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import { Plus, X, Edit2, Trash2, MessageSquare, Search, ChevronDown, MoreHorizontal, CheckSquare, BarChart3, Bell, HelpCircle, Download, Grid3x3, Filter, Menu } from 'lucide-react';
import { ResponsivePageLayout, ResponsiveModal, ResponsiveCard, ResponsiveGrid } from '../components/layouts';
import TaskCard from '../components/TaskCard';

const Tasks = () => {
  const { user, socket } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    showMyTasksOnly: false,
    team: '',
    assigned_to: '',
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

  useEffect(() => {
    fetchTasks();
    if (['admin', 'hr', 'team_lead'].includes(user?.role)) {
      fetchUsers();
      fetchTeams();
    }

    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }

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

  useRealtimeSync({
    onTaskCreated: () => fetchTasks(),
    onTaskUpdated: () => fetchTasks(),
    onTaskDeleted: () => fetchTasks(),
    onCommentAdded: () => fetchTasks(),
  });

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
      const endpoint = user?.role === 'team_lead' ? '/users/team-members' : '/users';
      const response = await api.get(endpoint);
      setUsers(response.data.users);
    } catch (error) {
      if (error.response?.status !== 403) {
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
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
    );

    try {
      const response = await api.patch(`/tasks/${taskId}`, updates);
      const updatedTask = response.data.task;

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
      fetchTasks();
    }
  };

  const openEditModal = (task) => {
    const taskTeam = teams.find(t => t._id === (task.team_id?._id || task.team_id));
    let members = taskTeam ? taskTeam.members : [];

    if (taskTeam && user?.role === 'team_lead') {
      const teamLeadAlreadyIncluded = members.some(member => member._id === user?.id);
      if (!teamLeadAlreadyIncluded && taskTeam.lead_id?._id === user?.id) {
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
    setEditingTask({
      ...task,
      assigned_to: task.assigned_to ? (Array.isArray(task.assigned_to) ? task.assigned_to.map(u => u._id || u) : [task.assigned_to._id || task.assigned_to]) : [],
      team_id: task.team_id?._id || task.team_id || '',
    });
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

    if (selectedTeam && user?.role === 'team_lead') {
      const teamLeadAlreadyIncluded = members.some(member => member._id === user?.id);
      if (!teamLeadAlreadyIncluded && selectedTeam.lead_id?._id === user?.id) {
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
    const memberIds = members.map(m => m._id);
    const currentAssigned = editingTask.assigned_to || [];
    const validAssignments = currentAssigned.filter(id => memberIds.includes(id));

    setEditingTask({
      ...editingTask,
      team_id: teamId,
      assigned_to: validAssignments
    });
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

      const response = await api.get(`/comments/${selectedTask._id}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      todo: 'bg-[#282f39] text-[#9da8b9] border-[#4b5563]/30',
      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      archived: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return badges[status] || badges.todo;
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
      archived: 'Archived',
    };
    return labels[status] || 'Unknown';
  };

  const getPriorityDot = (priority) => {
    const dots = {
      low: 'bg-slate-500',
      medium: 'bg-orange-400',
      high: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      urgent: 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)]',
    };
    return dots[priority] || dots.medium;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return labels[priority] || 'Medium';
  };

  const canEditTask = (task) => {
    if (['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) return true;
    return task.created_by._id === user?.id || task.assigned_to?._id === user?.id;
  };

  const canDeleteTask = (task) => {
    if (['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) return true;
    return task.created_by._id === user?.id;
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-gray-50 text-gray-900'} font-['Inter']`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} border-t-[#136dec]`}></div>
          </div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ResponsivePageLayout
        title="Tasks"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 h-9 bg-[#136dec] hover:bg-blue-600 text-white text-sm font-semibold px-4 rounded transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:inline">New</span>
          </button>
        }
      >
        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search tasks..."
                className={`w-full pl-10 pr-4 py-2.5 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39] text-white placeholder:text-[#58606e]' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              />
            </div>
            <button
              onClick={() => setShowFilterDrawer(true)}
              className={`lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg hover:border-[#136dec] transition-colors`}
            >
              <Filter size={18} />
              <span>Filters</span>
              {(filters.status || filters.priority || filters.team || filters.assigned_to) && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#136dec] text-white text-xs rounded-full">
                  {[filters.status, filters.priority, filters.team, filters.assigned_to].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`px-3 py-1.5 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
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
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className={`px-3 py-1.5 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {['admin', 'hr', 'team_lead'].includes(user?.role) && teams.length > 0 && (
              <select
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                className={`px-3 py-1.5 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            )}

            {(filters.status || filters.priority || filters.team || filters.assigned_to) && (
              <button
                onClick={() => setFilters({ ...filters, status: '', priority: '', team: '', assigned_to: '' })}
                className={`px-3 py-1.5 text-sm ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile Card Grid (< 1024px) */}
        <div className="lg:hidden">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-lg`}>No tasks found. Create your first task!</p>
            </div>
          ) : (
            <ResponsiveGrid cols={{ base: 1, sm: 1, md: 2 }} gap="md">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onView={() => viewTaskDetails(task)}
                  onEdit={() => openEditModal(task)}
                  onDelete={() => handleDeleteTask(task._id)}
                  onStatusChange={(status) => handleUpdateTask(task._id, { status })}
                  canEdit={canEditTask(task)}
                  canDelete={canDeleteTask(task)}
                  getUserInitials={getUserInitials}
                />
              ))}
            </ResponsiveGrid>
          )}
        </div>

        {/* Desktop Table (>= 1024px) */}
        <div className="hidden lg:block">
          <div className={`overflow-x-auto ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} rounded-lg border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <table className="w-full text-left border-collapse">
              <thead className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-gray-100'}`}>
                <tr>
                  <th className={`py-3 pl-6 pr-3 w-10 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-[#4b5563] bg-transparent text-[#136dec] focus:ring-offset-0 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} uppercase tracking-wider cursor-pointer group`}>
                    <div className="flex items-center gap-1">
                      Task
                      <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-32`}>Priority</th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-36`}>Status</th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-40`}>Assignee</th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} text-xs font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider w-32`}>Due Date</th>
                  <th className={`py-3 px-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} w-16`}></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'}`}>
                {filteredTasks.map((task, index) => (
                  <tr
                    key={task._id}
                    className={`group transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-[#161b22]' : 'hover:bg-gray-100'} ${index % 2 === 1 ? (theme === 'dark' ? 'bg-[#1c2027]/30' : 'bg-gray-50') : ''}`}
                    onClick={() => viewTaskDetails(task)}
                  >
                    <td className="py-2.5 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="size-4 rounded border-[#4b5563] bg-transparent text-[#136dec] focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} group-hover:text-[#136dec] line-clamp-2`}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{getPriorityLabel(task.priority)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(task.status)} bg-transparent focus:ring-0 focus:outline-none cursor-pointer`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      {task.assigned_to && task.assigned_to.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {getUserInitials(task.assigned_to[0].full_name)}
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>
                            {task.assigned_to[0].full_name}
                            {task.assigned_to.length > 1 && ` +${task.assigned_to.length - 1}`}
                          </span>
                        </div>
                      ) : (
                        <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs ${task.due_date && new Date(task.due_date) < new Date() ? 'text-red-400' : (theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600')}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditTask(task) && (
                          <button
                            onClick={() => openEditModal(task)}
                            className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-900'} p-1`}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDeleteTask(task) && (
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'} hover:text-red-400 p-1`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-900'} p-1`}>
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-lg`}>No tasks found. Create your first task!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className={`mt-4 flex items-center justify-between text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
          <span>{filteredTasks.length} of {tasks.length} tasks</span>
        </div>
      </ResponsivePageLayout>

      {/* Mobile Filter Drawer */}
      {showFilterDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setShowFilterDrawer(false)}
          />
          <div className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] ${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-out animate-slideInRight`}>
            <div className="flex flex-col h-full">
              <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {['admin', 'hr', 'team_lead'].includes(user?.role) && teams.length > 0 && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Team</label>
                    <select
                      value={filters.team}
                      onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                      className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                    >
                      <option value="">All Teams</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {['admin', 'hr', 'team_lead'].includes(user?.role) && users.length > 0 && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Assigned To</label>
                    <select
                      value={filters.assigned_to}
                      onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
                      className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                    >
                      <option value="">All Users</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Due Date From</label>
                  <input
                    type="date"
                    value={filters.dueDateFrom}
                    onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Due Date To</label>
                  <input
                    type="date"
                    value={filters.dueDateTo}
                    onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  />
                </div>
              </div>

              <div className={`p-4 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} space-y-2`}>
                <button
                  onClick={() => {
                    setFilters({ ...filters, status: '', priority: '', team: '', assigned_to: '', dueDateFrom: '', dueDateTo: '' });
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#282f39] text-white hover:bg-[#3a4454]' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} rounded transition-colors`}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-full px-4 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Task Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="large"
      >
        <form onSubmit={handleCreateTask} className="space-y-3 sm:space-y-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all`}
              required
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all resize-none`}
              rows="3"
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all`}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Due Date *</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all`}
              required
            />
          </div>

          {['admin', 'hr', 'team_lead'].includes(user?.role) && (
            <>
              <div>
                <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Select Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => {
                    const teamId = e.target.value;
                    const selectedTeam = teams.find(team => team._id === teamId);
                    let members = selectedTeam ? selectedTeam.members : [];

                    if (selectedTeam && user?.role === 'team_lead') {
                      const teamLeadAlreadyIncluded = members.some(member => member._id === user?.id);
                      if (!teamLeadAlreadyIncluded && selectedTeam.lead_id?._id === user?.id) {
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
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:ring-2 focus:ring-[#136dec] focus:border-transparent transition-all`}
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
                  <label className={`block text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>Assign Team Members</label>
                  <div className={`space-y-2 max-h-40 overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-300 bg-gray-50'} rounded-lg p-2.5 sm:p-3`}>
                    {selectedTeamMembers.map((member) => (
                      <label key={member._id} className={`flex items-center space-x-2.5 min-h-[44px] sm:min-h-0 cursor-pointer ${theme === 'dark' ? 'hover:bg-[#1c2027]' : 'hover:bg-gray-100'} rounded px-2 py-1 transition-colors`}>
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
                          className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec] w-4 h-4"
                        />
                        <span className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {member.full_name} <span className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>({member.role})</span>
                          {member._id === user?.id && <span className="text-[#136dec] font-medium"> (You)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </form>
        <div className={`flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 mt-4 sm:mt-6 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 sm:py-2 ${theme === 'dark' ? 'bg-[#282f39] hover:bg-[#3a4454] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} text-sm font-medium rounded-lg transition-all active:scale-95`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleCreateTask}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 sm:py-2 bg-gradient-to-r from-[#136dec] to-blue-600 hover:from-blue-600 hover:to-[#136dec] text-white text-sm rounded-lg transition-all font-semibold shadow-lg shadow-blue-900/30 active:scale-95"
          >
            Create Task
          </button>
        </div>
      </ResponsiveModal>

      {/* Edit Task Modal */}
      <ResponsiveModal
        isOpen={showEditModal && editingTask}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        title="Edit Task"
        size="large"
      >
        {editingTask && (
          <form onSubmit={handleEditTask} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Title *</label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Description</label>
              <textarea
                value={editingTask.description}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                rows="4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                >
                  <option value="low" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Low</option>
                  <option value="medium" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Medium</option>
                  <option value="high" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>High</option>
                  <option value="urgent" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Urgent</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                >
                  <option value="todo" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>To Do</option>
                  <option value="in_progress" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>In Progress</option>
                  <option value="review" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Review</option>
                  <option value="done" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Done</option>
                  <option value="archived" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Due Date *</label>
              <input
                type="date"
                value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                required
              />
            </div>

            {['admin', 'hr', 'team_lead'].includes(user?.role) && (
              <>
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Select Team</label>
                  <select
                    value={editingTask.team_id || ''}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="" className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>No Team</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id} className={theme === 'dark' ? 'bg-[#111418] text-white' : 'bg-white text-gray-900'}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingTask.team_id && selectedTeamMembers.length > 0 && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Assign Team Members</label>
                    <div className={`space-y-2 max-h-40 overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-300 bg-gray-50'} rounded-lg p-3`}>
                      {selectedTeamMembers.map((member) => (
                        <label key={member._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingTask.assigned_to.includes(member._id)}
                            onChange={() => handleMemberToggle(member._id)}
                            className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec]"
                          />
                          <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {member.full_name} ({member.role})
                            {member._id === user?.id && <span className="text-[#136dec] font-medium"> (You)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </form>
        )}
        <div className={`flex justify-end space-x-4 pt-4 mt-6 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={() => {
              setShowEditModal(false);
              setEditingTask(null);
            }}
            className={`px-6 py-2 ${theme === 'dark' ? 'bg-[#282f39] hover:bg-[#3a4454] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} rounded transition-colors`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleEditTask}
            className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
          >
            Update Task
          </button>
        </div>
      </ResponsiveModal>

      {/* Task Detail Modal */}
      <ResponsiveModal
        isOpen={showDetailModal && selectedTask}
        onClose={() => setShowDetailModal(false)}
        title={selectedTask?.title || 'Task Details'}
        size="large"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <p className={`${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Status</label>
                {canEditTask(selectedTask) ? (
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTask(selectedTask._id, { status: e.target.value })}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded text-sm ${getStatusBadge(selectedTask.status)}`}>
                    {getStatusLabel(selectedTask.status)}
                  </span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Priority</label>
                <div className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${getPriorityDot(selectedTask.priority)}`}></div>
                  <span className={`${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{getPriorityLabel(selectedTask.priority)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                    <span className="font-medium">Created by:</span> {selectedTask.created_by?.full_name || 'Unknown'}
                  </p>
                  {selectedTask.team_id && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      <span className="font-medium">Team:</span> {selectedTask.team_id.name}
                    </p>
                  )}
                </div>
                <div>
                  {selectedTask.assigned_to && selectedTask.assigned_to.length > 0 && (
                    <div className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      <span className="font-medium">Assigned to:</span>
                      <div className="mt-1">
                        {selectedTask.assigned_to.map((user) => (
                          <span key={user._id} className="inline-block bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded mr-1 mb-1 border border-blue-500/20">
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
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                    <span className="font-medium">Created:</span> {new Date(selectedTask.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  {selectedTask.due_date && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      <span className="font-medium">Due:</span>
                      <span className={`font-medium ml-1 ${new Date(selectedTask.due_date) < new Date() ? 'text-red-400' : 'text-orange-400'}`}>
                        {new Date(selectedTask.due_date).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {selectedTask.updated_at !== selectedTask.created_at && (
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                    <span className="font-medium">Last updated:</span> {new Date(selectedTask.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className={`border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} pt-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Comments
              </h3>

              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className={`rounded-lg p-4 border ${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{comment.author_id?.full_name || 'Unknown'}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm`}>No comments yet</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={`flex-1 px-4 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </>
  );
};

export default Tasks;
