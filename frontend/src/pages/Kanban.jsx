import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import {
  Plus, X, Search, Settings, UserPlus, Calendar as CalendarIcon,
  MoreHorizontal, MessageSquare, Menu
} from 'lucide-react';

const Kanban = () => {
  const { user, socket } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmModal = useConfirmModal();
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
    { id: 'todo', title: 'Todo', dotColor: 'bg-slate-500', count: 0 },
    { id: 'in_progress', title: 'In Progress', dotColor: 'bg-[#136dec] animate-pulse', count: 0, hasTopBorder: true },
    { id: 'review', title: 'Review', dotColor: 'bg-purple-500', count: 0 },
    { id: 'done', title: 'Done', dotColor: 'bg-green-500', count: 0 },
  ];

  useEffect(() => {
    fetchTasks();
    if (['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) {
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

  useRealtimeSync({
    onTaskCreated: () => fetchTasks(),
    onTaskUpdated: () => fetchTasks(),
    onTaskDeleted: () => fetchTasks(),
    onStatusChanged: () => fetchTasks(),
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
      if (error.response?.status !== 403) {
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
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
    );

    try {
      const response = await api.patch(`/tasks/${taskId}`, updates);
      const updatedTask = response.data.task;

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? updatedTask : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error.response?.data?.message || 'Failed to update task');
      fetchTasks();
    }
  };

  const handleDeleteTask = (taskId) => {
    confirmModal.show({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone and will remove all associated data.',
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${taskId}`);
          fetchTasks();
        } catch (error) {
          console.error('Error deleting task:', error);
          alert(error.response?.data?.message || 'Failed to delete task');
        }
      },
    });
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
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
    return filtered;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Low' },
      medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Med' },
      high: { bg: 'bg-red-400/10', text: 'text-red-400', label: 'High' },
      urgent: { bg: 'bg-red-600/10', text: 'text-red-600', label: 'Urgent' },
    };
    return badges[priority] || badges.medium;
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const canEditTask = (task) => {
    if (['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) return true;
    return task.created_by._id === user?.id || (task.assigned_to && task.assigned_to.some(u => u._id === user?.id));
  };

  const canDeleteTask = (task) => {
    return ['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role);
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
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      {/* Unified Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-full w-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} overflow-hidden`}>
        {/* Header Section */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} shrink-0`}>
          {/* Top Row: Title and Actions */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileSidebar}
                className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors flex-shrink-0`}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-base sm:text-xl font-bold leading-tight truncate`}>Kanban Board</h2>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs mt-0.5 sm:mt-1 hidden sm:block`}>Visual task workflow with drag & drop</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/settings')}
                className={`hidden sm:flex items-center justify-center rounded h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} ${theme === 'dark' ? 'hover:border-[#5a6472]' : 'hover:border-gray-300'} transition-colors`}
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => navigate('/teams')}
                className={`hidden lg:flex items-center justify-center rounded h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} ${theme === 'dark' ? 'hover:border-[#5a6472]' : 'hover:border-gray-300'} transition-colors`}
              >
                <UserPlus size={20} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center rounded h-9 px-3 sm:px-4 bg-[#136dec] text-white gap-2 text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-900/20"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Create Task</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 pb-3 sm:pb-4 overflow-x-auto scrollbar-thin">
            <div className={`relative flex items-center h-9 w-full sm:w-64 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} focus-within:border-[#136dec]/50 transition-colors flex-shrink-0`}>
              <Search className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ml-3 flex-shrink-0`} size={18} />
              <input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={`w-full bg-transparent border-none text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} placeholder-[#6b7280] focus:ring-0 px-2 h-full`}
                placeholder="Search tasks..."
              />
            </div>
            <div className="hidden sm:block w-px h-6 bg-[#3e454f] mx-2"></div>

            <div className="flex gap-2 flex-nowrap">
              {filters.showMyTasksOnly && (
                <button
                  onClick={() => setFilters({ ...filters, showMyTasksOnly: false })}
                  className="flex h-7 items-center gap-1.5 sm:gap-2 rounded-full bg-[#136dec]/20 border border-[#136dec]/30 px-2.5 sm:px-3 text-[#136dec] hover:bg-[#136dec]/30 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <span className="text-xs font-medium">My Tasks</span>
                  <X size={14} />
                </button>
              )}
              {!filters.showMyTasksOnly && (
                <button
                  onClick={() => setFilters({ ...filters, showMyTasksOnly: true })}
                  className={`flex h-7 items-center gap-1.5 sm:gap-2 rounded-full ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} px-2.5 sm:px-3 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} ${theme === 'dark' ? 'hover:border-[#5a6472]' : 'hover:border-gray-300'} transition-colors whitespace-nowrap flex-shrink-0`}
                >
                  <span className="text-xs font-medium">My Tasks</span>
                </button>
              )}
              {filters.priority && (
                <button
                  onClick={() => setFilters({ ...filters, priority: '' })}
                  className="flex h-7 items-center gap-1.5 sm:gap-2 rounded-full bg-orange-500/20 border border-orange-500/30 px-2.5 sm:px-3 text-orange-400 hover:bg-orange-500/30 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <span className="text-xs font-medium">{filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}</span>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Kanban Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-6">
          {/* Mobile hint */}
          <div className="lg:hidden mb-2 flex items-center gap-2 text-xs text-[#9da8b9]">
            <span>← Swipe to see more columns →</span>
          </div>

          <div className="flex h-full gap-3 sm:gap-4 pb-4" style={{ minWidth: 'max-content' }}>
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              const isDragOver = dragOverColumn === column.id;

              return (
                <div
                  key={column.id}
                  className={`flex flex-col w-[280px] sm:w-[320px] lg:w-1/4 lg:min-w-[280px] ${theme === 'dark' ? 'bg-[#1c2128]' : 'bg-white'} rounded-xl h-full border transition-all duration-200 ${isDragOver ? 'border-[#136dec] bg-[#136dec]/5 scale-[1.02]' : `${theme === 'dark' ? 'border-[#3e454f]/50' : 'border-gray-200'}`
                    }`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${theme === 'dark' ? 'border-[#3e454f]/50' : 'border-gray-200'} relative overflow-hidden ${column.hasTopBorder ? 'border-t-2 border-t-[#136dec]' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${column.dotColor} flex-shrink-0`}></div>
                      <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{column.title}</h3>
                      <span className={`${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} font-medium flex-shrink-0`}>
                        {columnTasks.length}
                      </span>
                    </div>
                    <MoreHorizontal className="text-[#6b7280] hover:text-white cursor-pointer flex-shrink-0" size={18} />
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 scrollbar-thin scrollbar-thumb-[#3e454f] scrollbar-track-transparent">
                    {columnTasks.map((task) => {
                      const priorityBadge = getPriorityBadge(task.priority);
                      const isDone = task.status === 'done';

                      return (
                        <div
                          key={task._id}
                          draggable={canEditTask(task)}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`group ${theme === 'dark' ? 'bg-gradient-to-br from-[#282f39] to-[#242a35]' : 'bg-gradient-to-br from-gray-50 to-white'} p-3 sm:p-4 rounded-lg border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} hover:border-[#136dec]/50 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${isDone ? 'opacity-70 hover:opacity-100' : ''
                            }`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[11px] font-mono text-[#6b7280] ${isDone ? 'line-through' : ''}`}>
                              {task._id.substring(0, 8).toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-bold ${priorityBadge.text} ${priorityBadge.bg} px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                              {priorityBadge.label}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 leading-snug group-hover:text-[#136dec] transition-colors ${isDone ? 'line-through decoration-slate-600' : ''
                            }`}>
                            {task.title}
                          </p>
                          <div className={`flex items-center justify-between border-t ${theme === 'dark' ? 'border-[#3e454f]/50' : 'border-gray-200'} pt-2 mt-auto`}>
                            <div className="flex -space-x-2">
                              {task.assigned_to && task.assigned_to.length > 0 ? (
                                task.assigned_to.slice(0, 2).map((assignee, idx) => (
                                  <div
                                    key={assignee._id || idx}
                                    className={`size-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[8px] text-white font-bold ring-2 ring-[#282f39] ${isDone ? 'grayscale' : ''
                                      }`}
                                    title={assignee.full_name}
                                  >
                                    {getUserInitials(assignee.full_name)}
                                  </div>
                                ))
                              ) : (
                                <div className="size-5 rounded-full bg-[#3e454f] flex items-center justify-center text-[8px] text-[#6b7280] font-bold">
                                  ?
                                </div>
                              )}
                              {task.assigned_to && task.assigned_to.length > 2 && (
                                <div className="size-5 rounded-full bg-[#3e454f] flex items-center justify-center text-[8px] text-white font-bold ring-2 ring-[#282f39]">
                                  +{task.assigned_to.length - 2}
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 ${isDone ? 'text-green-500' : task.due_date && new Date(task.due_date) < new Date() ? 'text-red-400' : task.due_date && new Date(task.due_date) < new Date(Date.now() + 86400000) ? 'text-[#136dec]' : 'text-[#6b7280]'}`}>
                              <CalendarIcon size={14} />
                              <span className="text-[11px]">
                                {task.due_date
                                  ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : 'No date'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, status: column.id });
                      setShowCreateModal(true);
                    }}
                    className={`p-2 mx-2 mb-2 flex items-center gap-2 text-[#6b7280] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'} rounded transition-colors text-sm font-medium`}
                  >
                    <Plus size={18} />
                    <span>Add Task</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Due Date *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                />
              </div>

              {['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role) && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Select Team</label>
                    <select
                      value={formData.team_id}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
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
                      <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Assign Team Members</label>
                      <div className={`space-y-2 max-h-40 overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded-lg p-3 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
                        {selectedTeamMembers.map((member) => (
                          <label key={member._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.assigned_to.includes(member._id)}
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

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTeamMembers([]);
                  }}
                  className={`px-6 py-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded ${theme === 'dark' ? 'hover:bg-[#3a4454]' : 'hover:bg-gray-300'} transition-colors`}
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedTask.title}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className={`${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{selectedTask.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleUpdateTask(selectedTask._id, { status: e.target.value });
                      setSelectedTask({ ...selectedTask, status: e.target.value });
                    }}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Priority</label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const badge = getPriorityBadge(selectedTask.priority);
                      return (
                        <span className={`inline-block px-3 py-1 rounded text-sm ${badge.bg} ${badge.text} font-medium`}>
                          {badge.label}
                        </span>
                      );
                    })()}
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
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedTask.assigned_to.map((user) => (
                            <span key={user._id} className="inline-block bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20">
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
              </div>

              {canDeleteTask(selectedTask) && (
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                  <button
                    onClick={() => {
                      handleDeleteTask(selectedTask._id);
                      setSelectedTask(null);
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    Delete Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default Kanban;
