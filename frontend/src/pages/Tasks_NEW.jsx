import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Plus, X, Edit2, Trash2, MessageSquare, Search, ChevronDown, MoreHorizontal, CheckSquare, LayoutDashboard, Users, BarChart3, Menu, Bell, HelpCircle, Download, Grid3x3 } from 'lucide-react';

const Tasks = () => {
  const { user, socket } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    if (['admin', 'hr', 'team_lead'].includes(user?.role)) return true;
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
      <div className="bg-[#111418] text-white font-['Inter'] h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#282f39] border-t-[#136dec]"></div>
          </div>
          <p className="text-white font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111418] text-white font-['Inter'] overflow-hidden flex flex-col h-screen">
      {/* Top Navigation */}
      <header className="flex flex-none items-center justify-between whitespace-nowrap border-b border-solid border-[#282f39] bg-[#111418] px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-white">
            <div className="size-8 rounded bg-[#136dec] flex items-center justify-center">
              <CheckSquare className="text-white" size={20} />
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-tight">TaskFlow</h2>
          </div>
          <label className="hidden md:flex flex-col min-w-[320px] h-9">
            <div className="flex w-full flex-1 items-stretch rounded bg-[#1c2027] border border-[#282f39] group focus-within:border-[#136dec] transition-colors">
              <div className="text-[#9da8b9] flex items-center justify-center pl-3">
                <Search size={20} />
              </div>
              <input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded bg-transparent text-white focus:outline-none placeholder:text-[#9da8b9] px-3 text-sm font-normal leading-normal border-none focus:ring-0"
                placeholder="Search tasks, projects, or people..."
              />
            </div>
          </label>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <div className="flex gap-1">
            <button className="flex items-center justify-center size-9 rounded-full hover:bg-[#1c2027] text-[#9da8b9] hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <button className="flex items-center justify-center size-9 rounded-full hover:bg-[#1c2027] text-[#9da8b9] hover:text-white transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full size-8 flex items-center justify-center text-[10px] text-white font-bold cursor-pointer ring-2 ring-[#282f39]">
            {getUserInitials(user?.full_name || user?.email)}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#111418] border-r border-[#282f39] flex-col hidden md:flex shrink-0 transition-all duration-300`}>
          <div className="flex flex-col gap-1 p-4">
            {!sidebarCollapsed && (
              <div className="px-3 py-2">
                <p className="text-[#9da8b9] text-xs font-bold uppercase tracking-wider">Main</p>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 rounded text-[#9da8b9] hover:bg-[#1c2027] hover:text-white transition-colors group"
            >
              <LayoutDashboard size={20} className="group-hover:text-[#136dec]" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-3 px-3 py-2 rounded bg-[#136dec]/10 text-[#136dec] transition-colors"
            >
              <CheckSquare size={20} className="fill-current" />
              {!sidebarCollapsed && <span className="text-sm font-medium">My Tasks</span>}
            </button>
            <button
              onClick={() => navigate('/teams')}
              className="flex items-center gap-3 px-3 py-2 rounded text-[#9da8b9] hover:bg-[#1c2027] hover:text-white transition-colors group"
            >
              <Users size={20} className="group-hover:text-[#136dec]" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Team Tasks</span>}
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-3 px-3 py-2 rounded text-[#9da8b9] hover:bg-[#1c2027] hover:text-white transition-colors group"
            >
              <BarChart3 size={20} className="group-hover:text-[#136dec]" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Reports</span>}
            </button>
          </div>
          {!sidebarCollapsed && user?.team_id && (
            <div className="mt-auto p-4 border-t border-[#282f39]">
              <div className="px-3 py-2">
                <p className="text-[#9da8b9] text-xs font-bold uppercase tracking-wider mb-2">Workspace</p>
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <div className="size-6 rounded bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px]">
                    {getUserInitials(user?.team_id?.name || 'Team')}
                  </div>
                  <span className="truncate">{user?.team_id?.name || 'My Team'}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-3 text-[#9da8b9] hover:text-white border-t border-[#282f39] flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#111418] overflow-hidden">
          {/* Page Header */}
          <div className="flex flex-col border-b border-[#282f39] bg-[#111418] shrink-0">
            <div className="px-6 pt-6 pb-2">
              <h1 className="text-white text-2xl font-bold leading-tight">My Tasks</h1>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-3">
              <div className="flex flex-1 items-center gap-3 overflow-x-auto">
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#9da8b9] group-focus-within:text-white">
                    <Search size={18} />
                  </span>
                  <input
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="bg-[#1c2027] border border-[#282f39] text-white text-sm rounded h-8 pl-8 pr-3 w-40 md:w-64 focus:ring-1 focus:ring-[#136dec] focus:border-[#136dec] placeholder:text-[#58606e]"
                    placeholder="Filter by name..."
                  />
                </div>
                <div className="h-6 w-px bg-[#282f39] mx-1"></div>

                <div className="flex gap-2">
                  <button className="flex h-7 items-center gap-1.5 rounded-full border border-[#282f39] bg-[#1c2027] px-3 hover:border-[#4b5563] transition-colors">
                    <span className="text-[#9da8b9] text-xs font-medium">Status:</span>
                    <span className="text-white text-xs font-medium">{filters.status ? getStatusLabel(filters.status) : 'All'}</span>
                    <ChevronDown size={16} className="text-[#9da8b9]" />
                  </button>
                  <button className="flex h-7 items-center gap-1.5 rounded-full border border-[#282f39] bg-[#1c2027] px-3 hover:border-[#4b5563] transition-colors">
                    <span className="text-[#9da8b9] text-xs font-medium">Priority:</span>
                    <span className="text-white text-xs font-medium">{filters.priority ? getPriorityLabel(filters.priority) : 'All'}</span>
                    <ChevronDown size={16} className="text-[#9da8b9]" />
                  </button>
                  <button className="flex h-7 items-center gap-1.5 rounded-full border border-dotted border-[#4b5563] px-3 hover:bg-[#1c2027] transition-colors">
                    <Plus size={16} className="text-[#9da8b9]" />
                    <span className="text-[#9da8b9] text-xs font-medium">Add Filter</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="p-1.5 text-[#9da8b9] hover:text-white rounded hover:bg-[#1c2027]" title="Customize Columns">
                  <Grid3x3 size={20} />
                </button>
                <button className="p-1.5 text-[#9da8b9] hover:text-white rounded hover:bg-[#1c2027]" title="Export">
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 h-9 bg-[#136dec] hover:bg-blue-600 text-white text-sm font-semibold px-4 rounded transition-colors shadow-lg shadow-blue-900/20"
                >
                  <Plus size={20} />
                  <span>New Task</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Grid / Table */}
          <div className="flex-1 overflow-auto bg-[#111418] relative w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1c2027] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 pl-6 pr-3 w-10 border-b border-[#282f39]">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-[#4b5563] bg-transparent text-[#136dec] focus:ring-offset-0 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-96 cursor-pointer hover:text-white group">
                    <div className="flex items-center gap-1">
                      Task Name
                      <ChevronDown size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-32 hidden sm:table-cell">ID</th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-32">Priority</th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-36">Status</th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-40 hidden md:table-cell">Assignee</th>
                  <th className="py-3 px-3 border-b border-[#282f39] text-xs font-semibold text-[#9da8b9] uppercase tracking-wider w-32 hidden lg:table-cell">Due Date</th>
                  <th className="py-3 px-3 border-b border-[#282f39] w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282f39]">
                {filteredTasks.map((task, index) => (
                  <tr
                    key={task._id}
                    className={`group hover:bg-[#161b22] transition-colors cursor-pointer ${index % 2 === 1 ? 'bg-[#1c2027]/30' : ''}`}
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
                        <span className="text-sm font-medium text-white group-hover:text-[#136dec]">
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell">
                      <span className="text-xs text-[#9da8b9] font-mono">
                        {task._id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
                        <span className="text-xs text-[#d1d5db]">{getPriorityLabel(task.priority)}</span>
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
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      {task.assigned_to && task.assigned_to.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {getUserInitials(task.assigned_to[0].full_name)}
                          </div>
                          <span className="text-xs text-[#d1d5db]">
                            {task.assigned_to[0].full_name}
                            {task.assigned_to.length > 1 && ` +${task.assigned_to.length - 1}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9da8b9]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 hidden lg:table-cell">
                      <span className={`text-xs ${task.due_date && new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-[#9da8b9]'}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditTask(task) && (
                          <button
                            onClick={() => openEditModal(task)}
                            className="text-[#9da8b9] hover:text-white p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDeleteTask(task) && (
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-[#9da8b9] hover:text-red-400 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button className="text-[#9da8b9] hover:text-white p-1">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#9da8b9] text-lg">No tasks found. Create your first task!</p>
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          <div className="flex flex-none items-center justify-between border-t border-[#282f39] bg-[#1c2027] px-6 py-3 text-xs text-[#9da8b9] shrink-0">
            <div className="flex items-center gap-4">
              <span>1-{filteredTasks.length} of {tasks.length} tasks</span>
              <div className="hidden sm:flex items-center gap-2">
                <span>Rows per page:</span>
                <select className="bg-transparent border-none text-white text-xs font-medium focus:ring-0 p-0 pr-6 cursor-pointer">
                  <option>50</option>
                  <option>100</option>
                  <option>200</option>
                </select>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2027] rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#282f39]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#9da8b9] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Due Date *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  required
                />
              </div>

              {['admin', 'hr', 'team_lead'].includes(user?.role) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Select Team</label>
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
                      className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
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
                      <label className="block text-sm font-medium text-white mb-2">Assign Team Members</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-[#282f39] rounded-lg p-3 bg-[#111418]">
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
                              className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec]"
                            />
                            <span className="text-sm text-white">
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

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-[#282f39] text-white rounded hover:bg-[#3a4454] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2027] rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#282f39]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Task</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="text-[#9da8b9] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
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
                <label className="block text-sm font-medium text-white mb-2">Due Date *</label>
                <input
                  type="date"
                  value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                  required
                />
              </div>

              {['admin', 'hr', 'team_lead'].includes(user?.role) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Select Team</label>
                    <select
                      value={editingTask.team_id || ''}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
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
                      <label className="block text-sm font-medium text-white mb-2">Assign Team Members</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-[#282f39] rounded-lg p-3 bg-[#111418]">
                        {selectedTeamMembers.map((member) => (
                          <label key={member._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editingTask.assigned_to.includes(member._id)}
                              onChange={() => handleMemberToggle(member._id)}
                              className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec]"
                            />
                            <span className="text-sm text-white">
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

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="px-6 py-2 bg-[#282f39] text-white rounded hover:bg-[#3a4454] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c2027] rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#282f39]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedTask.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#9da8b9] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[#d1d5db]">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  {canEditTask(selectedTask) ? (
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateTask(selectedTask._id, { status: e.target.value })}
                      className="w-full px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
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
                  <label className="block text-sm font-medium text-white mb-2">Priority</label>
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${getPriorityDot(selectedTask.priority)}`}></div>
                    <span className="text-[#d1d5db]">{getPriorityLabel(selectedTask.priority)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#9da8b9]">
                      <span className="font-medium">Created by:</span> {selectedTask.created_by?.full_name || 'Unknown'}
                    </p>
                    {selectedTask.team_id && (
                      <p className="text-sm text-[#9da8b9]">
                        <span className="font-medium">Team:</span> {selectedTask.team_id.name}
                      </p>
                    )}
                  </div>
                  <div>
                    {selectedTask.assigned_to && selectedTask.assigned_to.length > 0 && (
                      <div className="text-sm text-[#9da8b9]">
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
                    <p className="text-sm text-[#9da8b9]">
                      <span className="font-medium">Created:</span> {new Date(selectedTask.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {selectedTask.due_date && (
                      <p className="text-sm text-[#9da8b9]">
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
                    <p className="text-sm text-[#9da8b9]">
                      <span className="font-medium">Last updated:</span> {new Date(selectedTask.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#282f39] pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments
                </h3>

                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className="bg-[#111418] rounded-lg p-4 border border-[#282f39]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-white">{comment.author_id?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-[#9da8b9]">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#d1d5db]">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-[#9da8b9] text-sm">No comments yet</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
