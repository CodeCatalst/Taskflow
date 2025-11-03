import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Filter, Calendar as CalendarIcon } from 'lucide-react';

const localizer = momentLocalizer(moment);

const Calendar = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    showMyTasksOnly: false,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    transformTasksToEvents();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const eventStyleGetter = (event) => {
    const task = event.resource;
    let backgroundColor = '#3174ad';
    switch (task.priority) {
      case 'urgent':
        backgroundColor = '#dc2626';
        break;
      case 'high':
        backgroundColor = '#f97316';
        break;
      case 'medium':
        backgroundColor = '#eab308';
        break;
      case 'low':
        backgroundColor = '#22c55e';
        break;
    }
    if (task.status === 'done') {
      backgroundColor = '#9ca3af';
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
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
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.text}`}>
                <CalendarIcon className="inline w-8 h-8 mr-2 mb-1" />
                Calendar View
              </h1>
              <p className={`${currentTheme.textSecondary} mt-2`}>
                Visualize your tasks by due date
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/tasks?create=true'}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Task</span>
            </button>
          </div>
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-4 mb-6`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  <Filter className="inline w-4 h-4 mr-1" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
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
                  className={`w-full px-4 py-2 rounded-md font-medium ${
                    filters.showMyTasksOnly
                      ? 'bg-blue-600 text-white'
                      : `${currentTheme.surface} border ${currentTheme.border}`
                  }`}
                >
                  {filters.showMyTasksOnly ? 'My Tasks Only' : 'All Tasks'}
                </button>
              </div>
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Summary
                </label>
                <div className={`text-sm ${currentTheme.textSecondary}`}>
                  {events.length} task{events.length !== 1 ? 's' : ''} with due dates
                </div>
              </div>
            </div>
          </div>
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-4 mb-6`}>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className={currentTheme.textSecondary}>Urgent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className={currentTheme.textSecondary}>High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className={currentTheme.textSecondary}>Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className={currentTheme.textSecondary}>Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className={currentTheme.textSecondary}>Completed</span>
              </div>
            </div>
          </div>
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-6 calendar-container`}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
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
          {showDetailModal && selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${currentTheme.surface} rounded-lg p-8 max-w-2xl w-full mx-4`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${currentTheme.text}`}>
                    {selectedTask.title}
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <p className={currentTheme.textSecondary}>{selectedTask.description}</p>
                  <div className="flex gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm bg-${selectedTask.priority}-100`}>
                      {selectedTask.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div>
                    <strong>Due:</strong> {new Date(selectedTask.due_date).toLocaleDateString()}
                  </div>
                  {selectedTask.assigned_to && (
                    <div>
                      <strong>Assigned to:</strong> {selectedTask.assigned_to.map(u => u.full_name).join(', ')}
                    </div>
                  )}
                  <button
                    onClick={() => window.location.href = `/tasks`}
                    className="btn btn-primary w-full mt-4"
                  >
                    View in Tasks
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        .calendar-container .rbc-header {
          padding: 10px;
          font-weight: 600;
        }
        .calendar-container .rbc-today {
          background-color: ${currentTheme === 'light' ? '#e0f2fe' : '#1e40af'};
        }
        .calendar-container .rbc-off-range-bg {
          background: ${currentTheme === 'light' ? '#f3f4f6' : '#1f2937'};
        }
      `}</style>
    </div>
  );
};

export default Calendar;
