import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import api from '../api/axios';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import { Calendar as CalendarIcon, Clock, User, Menu, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function HRCalendar({ embedded = false }) {
  const { user } = useAuth();
  const { theme, currentTheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const year = currentDate.getFullYear();

      const [calendarResponse, attendanceResponse] = await Promise.all([
        api.get('/hr/calendar', { params: { month, year } }),
        api.get('/hr/attendance')
      ]);

      // Process attendance data to count by date
      const attendanceByDate = {};
      attendanceResponse.data.records.forEach(record => {
        const dateKey = record.date;
        if (!attendanceByDate[dateKey]) {
          attendanceByDate[dateKey] = { present: 0, absent: 0, half_day: 0, leave: 0, holiday: 0 };
        }
        attendanceByDate[dateKey][record.status]++;
      });
      setAttendanceData(attendanceByDate);

      // Transform data into calendar events
      transformDataToEvents(attendanceByDate, calendarResponse.data.events);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const transformDataToEvents = (attendanceData, events) => {
    const calendarEvents = [];

    // Create separate events for each attendance type
    Object.entries(attendanceData).forEach(([dateString, counts]) => {
      const date = new Date(dateString);

      // Create separate event for each attendance type
      if (counts.present > 0) {
        calendarEvents.push({
          id: `present-${dateString}`,
          title: `Present: ${counts.present}`,
          start: date,
          end: date,
          resource: { type: 'present', data: { count: counts.present, total: counts } },
          allDay: true,
        });
      }

      if (counts.absent > 0) {
        calendarEvents.push({
          id: `absent-${dateString}`,
          title: `Absent: ${counts.absent}`,
          start: date,
          end: date,
          resource: { type: 'absent', data: { count: counts.absent, total: counts } },
          allDay: true,
        });
      }

      if (counts.half_day > 0) {
        calendarEvents.push({
          id: `half_day-${dateString}`,
          title: `Half Day: ${counts.half_day}`,
          start: date,
          end: date,
          resource: { type: 'half_day', data: { count: counts.half_day, total: counts } },
          allDay: true,
        });
      }

      if (counts.leave > 0) {
        calendarEvents.push({
          id: `leave-${dateString}`,
          title: `Leave: ${counts.leave}`,
          start: date,
          end: date,
          resource: { type: 'leave', data: { count: counts.leave, total: counts } },
          allDay: true,
        });
      }
    });

    // Add holiday events
    events.forEach(event => {
      if (event.type === 'holiday') {
        calendarEvents.push({
          id: `holiday-${event.date}`,
          title: event.name || 'Holiday',
          start: new Date(event.date),
          end: new Date(event.date),
          resource: { type: 'holiday', data: event },
          allDay: true,
        });
      }
    });

    setCalendarEvents(calendarEvents);
  };

  const getStatusColor = (event) => {
    if (event.resource.type === 'holiday') {
      return '#9333ea'; // Purple for holidays
    }

    // Individual attendance types
    switch (event.resource.type) {
      case 'present':
        return '#22c55e'; // Green for present
      case 'absent':
        return '#dc2626'; // Red for absent
      case 'half_day':
        return '#eab308'; // Yellow for half day
      case 'leave':
        return '#3b82f6'; // Blue for leave
      default:
        return '#6b7280'; // Gray for unknown
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = getStatusColor(event);

    return {
      style: {
        backgroundColor,
        borderRadius: '0.125rem',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: '600',
        fontSize: '0.75rem',
        padding: '2px 6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const calendarContent = (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-4 h-12 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
          </div>
          <p className={`ml-4 ${currentTheme.textSecondary} font-medium`}>Loading calendar...</p>
        </div>
      ) : (
        <div className={`${currentTheme.surface} rounded-lg border ${currentTheme.border} p-4`}>
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: embedded ? 500 : 700, minHeight: embedded ? 400 : 500 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            views={['month']}
            defaultView="month"
            popup={false}
            tooltipAccessor={(event) => event.title}
          />
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border ${currentTheme.border}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{selectedEvent.title}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>Date:</p>
                <p className={`text-sm ${currentTheme.text} flex items-center gap-2`}>
                  <CalendarIcon size={14} />
                  {selectedEvent.start.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {(selectedEvent.resource.type === 'present' || selectedEvent.resource.type === 'absent' || selectedEvent.resource.type === 'half_day' || selectedEvent.resource.type === 'leave') && (
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary} mb-2`}>Attendance Details:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedEvent.resource.type === 'present' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {selectedEvent.resource.type === 'absent' && <XCircle className="w-4 h-4 text-red-500" />}
                      {selectedEvent.resource.type === 'half_day' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      {selectedEvent.resource.type === 'leave' && <CalendarIcon className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm ${currentTheme.text}`}>
                        {selectedEvent.resource.type === 'present' && `Present: ${selectedEvent.resource.data.count}`}
                        {selectedEvent.resource.type === 'absent' && `Absent: ${selectedEvent.resource.data.count}`}
                        {selectedEvent.resource.type === 'half_day' && `Half Day: ${selectedEvent.resource.data.count}`}
                        {selectedEvent.resource.type === 'leave' && `Leave: ${selectedEvent.resource.data.count}`}
                      </span>
                    </div>
                    <div className={`text-xs ${currentTheme.textSecondary} mt-2`}>
                      <p>Total attendance for this day:</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {selectedEvent.resource.data.total.present > 0 && (
                          <span>Present: {selectedEvent.resource.data.total.present}</span>
                        )}
                        {selectedEvent.resource.data.total.absent > 0 && (
                          <span>Absent: {selectedEvent.resource.data.total.absent}</span>
                        )}
                        {selectedEvent.resource.data.total.half_day > 0 && (
                          <span>Half Day: {selectedEvent.resource.data.total.half_day}</span>
                        )}
                        {selectedEvent.resource.data.total.leave > 0 && (
                          <span>Leave: {selectedEvent.resource.data.total.leave}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.resource.type === 'holiday' && (
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>Holiday:</p>
                  <p className={`text-sm ${currentTheme.text}`}>{selectedEvent.resource.data.name || 'Holiday'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .calendar-container .rbc-calendar {
          font-family: 'Inter', sans-serif;
          color: ${theme === 'dark' ? '#ffffff' : '#111827'};
        }
        .calendar-container .rbc-header {
          padding: 12px;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${theme === 'dark' ? '#1c2027' : '#f9fafb'};
          color: ${theme === 'dark' ? '#d1d5db' : '#374151'};
          border-color: ${theme === 'dark' ? '#374151' : '#d1d5db'};
        }
        .calendar-container .rbc-today {
          background-color: ${theme === 'dark' ? '#1e293b' : '#dbeafe'};
        }
        .calendar-container .rbc-off-range-bg {
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
        }
        .calendar-container .rbc-date-cell {
          color: ${theme === 'dark' ? '#e2e8f0' : '#1e293b'};
          padding: 4px;
        }
        .calendar-container .rbc-off-range {
          color: ${theme === 'dark' ? '#64748b' : '#94a3b8'};
        }
        .calendar-container .rbc-month-view {
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          border-color: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .calendar-container .rbc-day-bg {
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          border-color: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .calendar-container .rbc-event {
          transition: all 0.2s ease;
          border-radius: 4px;
          font-weight: 500;
        }
        .calendar-container .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .calendar-container .rbc-toolbar {
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 20px;
          padding: 12px;
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
          border-radius: 0.375rem;
          border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .calendar-container .rbc-toolbar button {
          color: ${theme === 'dark' ? '#cbd5e1' : '#475569'};
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          border: 1px solid ${theme === 'dark' ? '#475569' : '#cbd5e1'};
          border-radius: 0.25rem;
          padding: 6px 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .calendar-container .rbc-toolbar button:hover {
          background: ${theme === 'dark' ? '#334155' : '#f1f5f9'};
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
        }
        .calendar-container .rbc-toolbar button.rbc-active {
          background: ${theme === 'dark' ? '#3b82f6' : '#2563eb'};
          color: white;
          border-color: ${theme === 'dark' ? '#3b82f6' : '#2563eb'};
        }
      `}} />
    </>
  );

  if (embedded) {
    return calendarContent;
  }

  return (
    <ResponsivePageLayout
      title="HR Calendar"
      subtitle="View attendance and holiday information"
    >
      {calendarContent}
    </ResponsivePageLayout>
  );
}
