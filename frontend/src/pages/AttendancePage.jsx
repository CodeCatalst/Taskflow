import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import api from '../api/axios';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit2, Save, X, Menu, Search, UserPlus } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const { theme, currentTheme, currentColorScheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markAttendanceSearch, setMarkAttendanceSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [markFormData, setMarkFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
    notes: ''
  });

  const isAdmin = user && (user.role === 'admin' || user.role === 'hr');

  // Filter attendance records based on search query
  const filteredAttendance = useMemo(() => {
    if (!searchQuery.trim()) return attendance;
    
    const query = searchQuery.toLowerCase();
    return attendance.filter(record => {
      const employeeName = record.userId?.full_name?.toLowerCase() || '';
      const date = new Date(record.date).toLocaleDateString().toLowerCase();
      const status = record.status.toLowerCase();
      
      return employeeName.includes(query) || 
             date.includes(query) || 
             status.includes(query);
    });
  }, [attendance, searchQuery]);

  // Filter users for mark attendance modal
  const filteredUsers = useMemo(() => {
    if (!markAttendanceSearch.trim()) return users;
    
    const query = markAttendanceSearch.toLowerCase();
    return users.filter(u => {
      const name = u.full_name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [users, markAttendanceSearch]);

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
    checkTodayAttendance();
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentMonth, currentYear]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/attendance', {
        params: { month: currentMonth, year: currentYear }
      });
      setAttendance(response.data.records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/hr/attendance/summary', {
        params: { month: currentMonth, year: currentYear }
      });
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date();
      const response = await api.get('/hr/attendance', {
        params: { 
          month: today.getMonth() + 1, 
          year: today.getFullYear() 
        }
      });
      const todayRecord = response.data.records.find(r => 
        new Date(r.date).toDateString() === today.toDateString() && 
        r.userId._id === user._id
      );
      setCheckedIn(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/hr/attendance/checkin');
      setCheckedIn(true);
      fetchAttendance();
      fetchSummary();
      alert('Checked in successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/hr/attendance/checkout');
      setCheckedIn(false);
      fetchAttendance();
      fetchSummary();
      alert('Checked out successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check out');
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/attendance/mark', markFormData);
      setShowMarkModal(false);
      setMarkFormData({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '',
        checkOut: '',
        notes: ''
      });
      setMarkAttendanceSearch('');
      fetchAttendance();
      fetchSummary();
      alert('Attendance marked successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleEditAttendance = async (id) => {
    try {
      await api.put(`/hr/attendance/${id}`, editData);
      setEditMode(null);
      setEditData({});
      fetchAttendance();
      alert('Attendance updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update attendance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      half_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      holiday: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: <CheckCircle className="w-4 h-4" />,
      absent: <XCircle className="w-4 h-4" />,
      half_day: <AlertCircle className="w-4 h-4" />,
      leave: <Calendar className="w-4 h-4" />,
      holiday: <Calendar className="w-4 h-4" />
    };
    return icons[status] || null;
  };

  return (
    <ResponsivePageLayout
      title="Attendance Tracking"
      actions={
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowMarkModal(true)}
              className={`px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 rounded-lg`}
            >
              <UserPlus className="w-5 h-5" />
              Mark Attendance
            </button>
          )}
          {!isAdmin && (
            checkedIn ? (
              <button
                onClick={handleCheckOut}
                className={`px-4 py-2 ${currentTheme.primary} text-white ${currentTheme.primaryHover} flex items-center gap-2`}
              >
                <XCircle className="w-5 h-5" />
                Check Out
              </button>
            ) : (
              <button
                onClick={handleCheckIn}
                className={`px-4 py-2 ${currentTheme.primary} text-white ${currentTheme.primaryHover} flex items-center gap-2`}
              >
                <CheckCircle className="w-5 h-5" />
                Check In
              </button>
            )
          )}
        </div>
      }
    >
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Present</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.present}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Absent</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.absent}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Half Day</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.halfDay}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>

              <div className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Leave</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.leave}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Total Hours</p>
                    <p className="text-2xl font-bold text-purple-600">{summary.totalHours.toFixed(1)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className={`${currentTheme.surface} rounded-lg p-4 mb-6 border ${currentTheme.border}`}>
            {isAdmin && (
              <div className="mb-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search by employee name, date, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text} placeholder:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className={`text-sm font-medium ${currentTheme.text}`}>Month:</label>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className={`px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>

              <label className={`text-sm font-medium ${currentTheme.text}`}>Year:</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className={`px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className={`${currentTheme.surface} rounded-lg border ${currentTheme.border} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme.surfaceSecondary}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Date</th>
                    {isAdmin && <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Employee</th>}
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Check In</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Check Out</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Hours</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Status</th>
                    {isAdmin && <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Actions</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className={`px-6 py-4 text-center ${currentTheme.textSecondary}`}>
                        Loading...
                      </td>
                    </tr>
                  ) : filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className={`px-6 py-4 text-center ${currentTheme.textSecondary}`}>
                        {searchQuery ? 'No matching attendance records found' : 'No attendance records found'}
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => (
                      <tr key={record._id} className={`${currentTheme.hover}`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                            {record.userId?.full_name}
                          </td>
                        )}
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {record.workingHours.toFixed(2)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {editMode === record._id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditAttendance(record._id)}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditMode(null)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditMode(record._id);
                                  setEditData({ 
                                    status: record.status,
                                    checkIn: record.checkIn,
                                    checkOut: record.checkOut,
                                    notes: record.notes || ''
                                  });
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.surface} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 ${currentTheme.surface} border-b ${currentTheme.border} px-6 py-4 flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${currentTheme.text}`}>Mark Attendance</h2>
              <button
                onClick={() => {
                  setShowMarkModal(false);
                  setMarkAttendanceSearch('');
                  setMarkFormData({
                    userId: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'present',
                    checkIn: '',
                    checkOut: '',
                    notes: ''
                  });
                }}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleMarkAttendance} className="p-6 space-y-4">
              {/* Search and Select Employee */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Select Employee
                </label>
                <div className="relative mb-3">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={markAttendanceSearch}
                    onChange={(e) => setMarkAttendanceSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                  />
                </div>
                <select
                  value={markFormData.userId}
                  onChange={(e) => setMarkFormData({ ...markFormData, userId: e.target.value })}
                  className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                  required
                  size="5"
                >
                  <option value="">-- Select Employee --</option>
                  {filteredUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Date
                </label>
                <input
                  type="date"
                  value={markFormData.date}
                  onChange={(e) => setMarkFormData({ ...markFormData, date: e.target.value })}
                  className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Status
                </label>
                <select
                  value={markFormData.status}
                  onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
                  className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              {/* Check In Time (optional) */}
              {markFormData.status === 'present' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                      Check In Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={markFormData.checkIn}
                      onChange={(e) => setMarkFormData({ ...markFormData, checkIn: e.target.value })}
                      className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                      Check Out Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={markFormData.checkOut}
                      onChange={(e) => setMarkFormData({ ...markFormData, checkOut: e.target.value })}
                      className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={markFormData.notes}
                  onChange={(e) => setMarkFormData({ ...markFormData, notes: e.target.value })}
                  className={`w-full px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                  rows="3"
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkModal(false);
                    setMarkAttendanceSearch('');
                    setMarkFormData({
                      userId: '',
                      date: new Date().toISOString().split('T')[0],
                      status: 'present',
                      checkIn: '',
                      checkOut: '',
                      notes: ''
                    });
                  }}
                  className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ResponsivePageLayout>
  );
}
