import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import Sidebar from '../components/Sidebar';
import { Plus, X, Calendar as CalendarIcon, Filter, Settings, Menu } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    showMyTasksOnly: false,
  });
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    transformTasksToEvents();
  }, [tasks, filters]);

  useRealtimeSync({
    onTaskCreated: () => fetchTasks(),
    onTaskUpdated: () => fetchTasks(),
    onTaskDeleted: () => fetchTasks(),
  });

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
    }
  };

  const transformTasksToEvents = () => {
    let filtered = [...tasks];
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters.showMyTasksOnly) {
      filtered = filtered.filter((t) => {
        if (!t.assigned_to) return false;
        const assignedIds = Array.isArray(t.assigned_to) 
          ? t.assigned_to.map(u => typeof u === 'object' ? u._id : u)
          : [typeof t.assigned_to === 'object' ? t.assigned_to._id : t.assigned_to];
        return assignedIds.includes(user?.id);
      });
    }
    const calendarEvents = filtered
      .filter(task => task.due_date)
      .map(task => ({
        id: task._id,
        title: task.title,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        resource: task,
        allDay: true,
      }));
    setEvents(calendarEvents);
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#6b7280',
      in_progress: '#136dec',
      review: '#eab308',
      done: '#22c55e',
      archived: '#ef4444',
    };
    return colors[status] || colors.todo;
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#dc2626',
    };
    return colors[priority] || colors.medium;
  };

  const eventStyleGetter = (event) => {
    const task = event.resource;
    const backgroundColor = getStatusColor(task.status);
    const borderColor = getPriorityBadgeColor(task.priority);
    
    return {
      style: {
        backgroundColor,
        borderRadius: '0.125rem',
        opacity: 0.95,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        display: 'block',
        fontWeight: '600',
        fontSize: '0.75rem',
        padding: '2px 6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource);
    setShowDetailModal(true);
  };

  const handleSelectSlot = (slotInfo) => {
    window.location.href = `/tasks?create=true&date=${slotInfo.start.toISOString()}`;
  };

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full w-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} overflow-hidden`}>
        {/* Header Section */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} shrink-0`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileSidebar}
                className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-bold leading-tight`}>Calendar View</h2>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs mt-1`}>Visualize tasks by due date</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className={`flex items-center justify-center rounded h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} ${theme === 'dark' ? 'hover:border-[#5a6472]' : 'hover:border-gray-300'} transition-colors`}
                title="Toggle Legend"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => window.location.href = '/tasks?create=true'}
                className="flex items-center justify-center rounded h-9 px-4 bg-[#136dec] text-white gap-2 text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-900/20"
              >
                <Plus size={20} />
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4 px-6 pb-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-fit">
              <Filter size={16} className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Filters:</span>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <button
              onClick={() => setFilters({ ...filters, showMyTasksOnly: !filters.showMyTasksOnly })}
              className={`h-9 px-4 rounded text-sm font-medium transition-colors ${
                filters.showMyTasksOnly
                  ? 'bg-[#136dec] text-white border-[#136dec]'
                  : `${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`
              } border`}
            >
              {filters.showMyTasksOnly ? 'My Tasks Only' : 'All Tasks'}
            </button>

            <div className={`ml-auto text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{events.length}</span> task{events.length !== 1 ? 's' : ''} with due dates
            </div>
          </div>
        </header>

        {/* Calendar Area */}
        <div className="flex-1 overflow-auto p-6">
          {showLegend && (
            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-4 mb-6`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Legend</h3>
                <button
                  onClick={() => setShowLegend(false)}
                  className={`${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Status (Background)</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#6b7280] rounded"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>To Do</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#136dec] rounded"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#eab308] rounded"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#22c55e] rounded"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Done</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Priority (Border)</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded border-2 border-[#10b981]`}></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded border-2 border-[#f59e0b]`}></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded border-2 border-[#f97316]`}></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded border-2 border-[#dc2626]`}></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Urgent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-4 calendar-container`}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700, minHeight: 500 }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              popup
              tooltipAccessor={(event) => `${event.title} - ${event.resource.priority}`}
            />
          </div>
        </div>
      </main>

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedTask.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className={`${theme === 'dark' ? 'text-[#d1d5db]' : 'text-gray-700'}`}>{selectedTask.description || 'No description'}</p>
              </div>

              <div className="flex gap-3">
                <span className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase ${
                  selectedTask.status === 'todo' ? 'bg-slate-500/20 text-slate-300' :
                  selectedTask.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  selectedTask.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
                <span className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase ${
                  selectedTask.priority === 'low' ? 'bg-green-500/20 text-green-400' :
                  selectedTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>

              <div className={`space-y-3 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} pt-4`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-1`}>
                      <span className="font-medium">Due Date:</span>
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <CalendarIcon size={14} />
                      {new Date(selectedTask.due_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedTask.created_by && (
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-1`}>
                        <span className="font-medium">Created by:</span>
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedTask.created_by.full_name || 'Unknown'}</p>
                    </div>
                  )}
                </div>

                {selectedTask.assigned_to && selectedTask.assigned_to.length > 0 && (
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-2`}>
                      <span className="font-medium">Assigned to:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assigned_to.map((assignee) => (
                        <span key={assignee._id} className="inline-block bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20">
                          {assignee.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.team_id && (
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-1`}>
                      <span className="font-medium">Team:</span>
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedTask.team_id.name}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => window.location.href = `/tasks`}
                className="w-full px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
              >
                View in Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .calendar-container .rbc-calendar {
          font-family: 'Inter', sans-serif;
          color: ${theme === 'dark' ? '#fff' : '#111827'};
        }
        .calendar-container .rbc-header {
          padding: 12px;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${theme === 'dark' ? '#1c2027' : '#f9fafb'};
          color: ${theme === 'dark' ? '#9da8b9' : '#6b7280'};
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-today {
          background-color: ${theme === 'dark' ? '#136dec20' : '#136dec10'};
        }
        .calendar-container .rbc-off-range-bg {
          background: ${theme === 'dark' ? '#0e1217' : '#f9fafb'};
        }
        .calendar-container .rbc-date-cell {
          color: ${theme === 'dark' ? '#d1d5db' : '#374151'};
          padding: 4px;
        }
        .calendar-container .rbc-off-range {
          color: ${theme === 'dark' ? '#4b5563' : '#9ca3af'};
        }
        .calendar-container .rbc-month-view {
          background: ${theme === 'dark' ? '#1c2027' : '#ffffff'};
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-day-bg {
          background: ${theme === 'dark' ? '#1c2027' : '#ffffff'};
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-event {
          transition: all 0.2s ease;
        }
        .calendar-container .rbc-event:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .calendar-container .rbc-toolbar {
          color: ${theme === 'dark' ? '#fff' : '#111827'};
          margin-bottom: 20px;
          padding: 12px;
          background: ${theme === 'dark' ? '#111418' : '#f9fafb'};
          border-radius: 0.125rem;
        }
        .calendar-container .rbc-toolbar button {
          color: ${theme === 'dark' ? '#9da8b9' : '#6b7280'};
          background: ${theme === 'dark' ? '#282f39' : '#ffffff'};
          border: 1px solid ${theme === 'dark' ? '#3e454f' : '#d1d5db'};
          border-radius: 0.125rem;
          padding: 6px 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .calendar-container .rbc-toolbar button:hover {
          background: ${theme === 'dark' ? '#3a4454' : '#f3f4f6'};
          color: ${theme === 'dark' ? '#fff' : '#111827'};
        }
        .calendar-container .rbc-toolbar button.rbc-active {
          background: #136dec;
          color: white;
          border-color: #136dec;
        }
        .calendar-container .rbc-agenda-view {
          background: ${theme === 'dark' ? '#1c2027' : '#ffffff'};
        }
        .calendar-container .rbc-agenda-view table {
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-agenda-table tbody > tr > td {
          color: ${theme === 'dark' ? '#d1d5db' : '#374151'};
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-agenda-date-cell,
        .calendar-container .rbc-agenda-time-cell {
          color: ${theme === 'dark' ? '#9da8b9' : '#6b7280'};
        }
        .calendar-container .rbc-time-view {
          background: ${theme === 'dark' ? '#1c2027' : '#ffffff'};
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-time-header-content {
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-time-content {
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-time-slot {
          border-color: ${theme === 'dark' ? '#282f39' : '#e5e7eb'};
        }
        .calendar-container .rbc-current-time-indicator {
          background-color: #136dec;
        }
      `}} />
    </div>
  );
};

export default Calendar;
