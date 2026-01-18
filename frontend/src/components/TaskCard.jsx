import { useTheme } from '../context/ThemeContext';
import { Edit2, Trash2, Calendar, User, Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * TaskCard - Advanced mobile-first card view for tasks
 * 
 * Features:
 * - Smooth animations and transitions
 * - Touch-friendly interactions (≥44px targets)
 * - Advanced visual design with gradients and shadows
 * - Interactive status dropdown
 * - Polished hover effects
 */
const TaskCard = ({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = false,
  canDelete = false,
  getUserInitials
}) => {
  const { theme } = useTheme();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      medium: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
      high: 'bg-red-500/10 text-red-300 border-red-500/20',
      urgent: 'bg-red-600/15 text-red-300 border-red-600/30 shadow-lg shadow-red-900/20'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityDot = (priority) => {
    const dots = {
      low: 'bg-slate-400',
      medium: 'bg-orange-400',
      high: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
      urgent: 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-pulse'
    };
    return dots[priority] || dots.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      in_progress: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      review: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      done: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return colors[status] || colors.todo;
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
      archived: 'Archived'
    };
    return labels[status] || 'Unknown';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    return labels[priority] || 'Medium';
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const daysUntilDue = task.due_date
    ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleStatusChange = (newStatus) => {
    onStatusChange(newStatus);
    setShowStatusMenu(false);
  };

  return (
    <div
      className={`relative ${theme === 'dark'
          ? 'bg-gradient-to-br from-[#1c2027] to-[#181c23] border-[#282f39] hover:border-[#3a4454]'
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
        } border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 group`}
    >
      {/* Priority Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${task.priority === 'urgent' ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' :
          task.priority === 'high' ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500' :
            task.priority === 'medium' ? 'bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400' :
              'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400'
        }`}></div>

      <div className="p-5" onClick={onView}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 cursor-pointer">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 line-clamp-2 group-hover:text-[#136dec] transition-colors duration-200`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} line-clamp-2 leading-relaxed`}>
                {task.description}
              </p>
            )}
          </div>

          {/* Priority Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getPriorityColor(task.priority)} backdrop-blur-sm transition-all duration-200 hover:scale-105`}>
            <div className={`size-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
            <span className="text-xs font-semibold whitespace-nowrap">{getPriorityLabel(task.priority)}</span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Status Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${getStatusColor(task.status)} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span className="text-xs font-semibold">{getStatusLabel(task.status)}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStatusMenu && (
              <div className={`absolute top-full left-0 right-0 mt-2 ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-lg shadow-2xl overflow-hidden z-10 animate-slideUp`}>
                {['todo', 'in_progress', 'review', 'done', 'archived'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${task.status === status
                        ? 'bg-[#136dec] text-white font-semibold'
                        : `${theme === 'dark' ? 'text-[#9da8b9] hover:bg-[#282f39] hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                      }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isOverdue
                ? 'bg-red-500/10 text-red-300 border-red-500/30 animate-pulse'
                : daysUntilDue <= 3
                  ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                  : `${theme === 'dark' ? 'bg-[#282f39] text-[#9da8b9] border-[#3a4454]' : 'bg-gray-100 text-gray-600 border-gray-200'}`
              } transition-all duration-200`}>
              <Calendar size={14} className="flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Assignee Section */}
        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-4 border transition-all duration-200 ${theme === 'dark' ? 'bg-[#282f39]/30 border-[#282f39] hover:bg-[#282f39]/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
            <User size={16} className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'} flex-shrink-0`} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`size-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 flex items-center justify-center text-xs text-white font-bold shadow-lg ring-2 ${theme === 'dark' ? 'ring-[#282f39]' : 'ring-white'}`}>
                {getUserInitials(task.assigned_to[0].full_name)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                  {task.assigned_to[0].full_name}
                </span>
                {task.assigned_to.length > 1 && (
                  <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                    +{task.assigned_to.length - 1} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg mb-4 animate-pulse">
            <Clock size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400">
              Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-2 pt-4 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <button
              onClick={onEdit}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#136dec] to-blue-600 hover:from-blue-600 hover:to-[#136dec] text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2.5 ${theme === 'dark' ? 'bg-[#282f39] hover:bg-red-600 text-[#9da8b9] hover:text-white' : 'bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white'} rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Trash2 size={16} />
            </button>
          )}
          {!canEdit && !canDelete && (
            <button
              onClick={onView}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 ${theme === 'dark' ? 'bg-[#282f39] hover:bg-[#3a4454] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span>View Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
