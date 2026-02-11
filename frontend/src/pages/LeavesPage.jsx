import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import api from '../api/axios';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import { Briefcase, Plus, Calendar, CheckCircle, XCircle, Clock, Menu, X, UserPlus } from 'lucide-react';

export default function LeavesPage() {
  const { user } = useAuth();
  const { theme, currentTheme, currentColorScheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [hrNotes, setHrNotes] = useState('');
  const [showBulkLeaveModal, setShowBulkLeaveModal] = useState(false);
  const [showLeaveTypes, setShowLeaveTypes] = useState(true);
  const [selectedUserBalance, setSelectedUserBalance] = useState([]);
  const [users, setUsers] = useState([]);
  const [bulkLeaveForm, setBulkLeaveForm] = useState({
    userId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    timePeriod: 'full_day',
    reason: ''
  });
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    days: 1,
    reason: ''
  });
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: '',
    code: '',
    annualQuota: 10,
    carryForward: false,
    maxCarryForward: 0,
    color: '#3b82f6',
    description: '',
    updateExistingBalances: false
  });

  const isAdmin = user && (user.role === 'admin' || user.role === 'hr');

  const handleApproveReject = async (id, status, reason = '', notes = '') => {
    setError('');
    setSuccess('');
    try {
      const response = await api.patch(`/hr/leaves/${id}/status`, {
        status,
        rejectionReason: reason,
        hrNotes: notes
      });

      if (response.data.success) {
        setSuccess(`Leave request ${status} successfully!`);
        await fetchData();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      setError(error.response?.data?.message || 'Failed to update leave status');
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedRequest) return;
    
    setError('');
    setSuccess('');
    try {
      const response = await api.patch(`/hr/leaves/${selectedRequest._id}/notes`, {
        hrNotes
      });

      if (response.data.success) {
        await fetchData();
        setShowNotesModal(false);
        setSelectedRequest(null);
        setHrNotes('');
        setSuccess('Notes updated successfully!');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      setError(error.response?.data?.message || 'Failed to update notes');
    }
  };

  const openNotesModal = (request) => {
    setSelectedRequest(request);
    setHrNotes(request.hrNotes || '');
    setShowNotesModal(true);
  };

  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleRejectSubmit = async () => {
    if (rejectionReason.trim()) {
      await handleApproveReject(rejectingRequestId, 'rejected', rejectionReason);
      setShowRejectModal(false);
      setRejectingRequestId(null);
      setRejectionReason('');
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // Always fetch personal balance for the current user
      const [requestsRes, balancesRes, typesRes] = await Promise.all([
        api.get('/hr/leaves'),
        api.get('/hr/leaves/balance'), // Get only current user's balances
        api.get('/hr/leave-types')
      ]);

      setLeaveRequests(requestsRes.data.requests || []);
      setLeaveBalances(balancesRes.data.balances || []);
      setLeaveTypes(typesRes.data.leaveTypes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load leave data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserBalance = async (userId) => {
    try {
      const response = await api.get(`/hr/leaves/balance/${userId}`);
      setSelectedUserBalance(response.data.balances || []);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setSelectedUserBalance([]);
    }
  };

  const handleBulkLeaveSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const days = calculateDays(bulkLeaveForm.startDate, bulkLeaveForm.endDate);
      // Adjust days based on time period
      const adjustedDays = bulkLeaveForm.timePeriod === 'full_day' ? days : days * 0.5;
      
      // Create leave request for the selected user and mark attendance
      await api.post('/hr/leaves/bulk', {
        ...bulkLeaveForm,
        days: adjustedDays,
        status: 'approved' // Auto-approve since HR is marking it
      });
      
      setShowBulkLeaveModal(false);
      setBulkLeaveForm({
        userId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        timePeriod: 'full_day',
        reason: ''
      });
      setSuccess('Leave marked successfully and attendance updated for the employee!');
      await fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to mark leave');
    }
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const days = calculateDays(formData.startDate, formData.endDate);
      await api.post('/hr/leaves', { ...formData, days });
      setShowModal(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', days: 1, reason: '' });
      setSuccess('Leave request submitted successfully!');
      await fetchData();
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleCreateLeaveType = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingLeaveType) {
        // Update existing leave type
        const response = await api.put(`/hr/leave-types/${editingLeaveType._id}`, leaveTypeForm);
        const updatedCount = response.data.updatedBalancesCount || 0;
        if (updatedCount > 0) {
          setSuccess(`Leave type updated successfully! ${updatedCount} user balance(s) updated.`);
        } else {
          setSuccess('Leave type updated successfully!');
        }
      } else {
        // Create new leave type
        await api.post('/hr/leave-types', leaveTypeForm);
        setSuccess('Leave type created successfully! All users have been assigned this leave balance.');
      }
      
      setShowLeaveTypeModal(false);
      setEditingLeaveType(null);
      setLeaveTypeForm({
        name: '',
        code: '',
        annualQuota: 10,
        carryForward: false,
        maxCarryForward: 0,
        color: '#3b82f6',
        description: '',
        updateExistingBalances: false
      });
      fetchData();
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${editingLeaveType ? 'update' : 'create'} leave type`);
    }
  };

  const handleEditLeaveType = (leaveType) => {
    setEditingLeaveType(leaveType);
    setLeaveTypeForm({
      name: leaveType.name,
      code: leaveType.code,
      annualQuota: leaveType.annualQuota,
      carryForward: leaveType.carryForward || false,
      maxCarryForward: leaveType.maxCarryForward || 0,
      color: leaveType.color || '#3b82f6',
      description: leaveType.description || '',
      updateExistingBalances: false
    });
    setShowLeaveTypeModal(true);
  };

  const handleCloseLeaveTypeModal = () => {
    setShowLeaveTypeModal(false);
    setEditingLeaveType(null);
    setLeaveTypeForm({
      name: '',
      code: '',
      annualQuota: 10,
      carryForward: false,
      maxCarryForward: 0,
      color: '#3b82f6',
      description: '',
      updateExistingBalances: false
    });
  };


  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <ResponsivePageLayout
        title="Leave Management"
        subtitle={`${leaveRequests.length} request${leaveRequests.length !== 1 ? 's' : ''} • ${leaveTypes.length} leave type${leaveTypes.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowBulkLeaveModal(true)}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Mark Leave</span>
                  <span className="sm:hidden">Mark</span>
                </button>
                <button
                  onClick={() => setShowLeaveTypeModal(true)}
                  className="px-3 sm:px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Manage Leave Types</span>
                  <span className="sm:hidden">Types</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-3 sm:px-4 py-2 bg-[#136dec] text-white hover:bg-blue-600 flex items-center gap-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Apply Leave</span>
            </button>
          </div>
        }
      >
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-xs text-red-300 underline hover:text-red-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-400">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-300 hover:text-green-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`text-center ${currentTheme.textSecondary}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading leave data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Leave Balance Cards */}
              {isAdmin && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Leave Types & Balances</h3>
                  <button
                    onClick={() => setShowLeaveTypes(!showLeaveTypes)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      showLeaveTypes
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : `${currentTheme.surfaceSecondary} ${currentTheme.text} hover:${currentTheme.hover}`
                    }`}
                  >
                    {showLeaveTypes ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Hide Types</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Show Types</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              {(!isAdmin || showLeaveTypes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {leaveBalances.length === 0 ? (
                  <div className={`col-span-full ${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border} text-center`}>
                    <p className={`${currentTheme.textSecondary} text-sm`}>
                      No leave balances found. Contact HR to set up your leave entitlements.
                    </p>
                  </div>
                ) : (
                  leaveBalances.map((balance) => (
                    <div key={balance._id} className={`${currentTheme.surface} rounded-lg p-4 border ${currentTheme.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-semibold ${currentTheme.text}`}>
                          {balance.leaveTypeId?.name}
                        </h3>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: balance.leaveTypeId?.color }}
                        ></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`${currentTheme.textSecondary}`}>Annual Quota:</span>
                          <span className={`font-medium ${currentTheme.textSecondary}`}>{balance.leaveTypeId?.annualQuota}</span>
                        </div>
                        {balance.carriedForward > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className={`${currentTheme.textSecondary}`}>Carried Forward:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">+{balance.carriedForward}</span>
                          </div>
                        )}
                        <div className={`flex justify-between text-sm ${balance.carriedForward > 0 ? 'pt-2 border-t ' + currentTheme.border : ''}`}>
                          <span className={`${currentTheme.textSecondary}`}>Total Quota:</span>
                          <span className={`font-semibold ${currentTheme.text}`}>{balance.totalQuota}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${currentTheme.textSecondary}`}>Used:</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">{balance.used}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${currentTheme.textSecondary}`}>Pending:</span>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">{balance.pending}</span>
                        </div>
                        <div className={`flex justify-between text-sm pt-2 border-t ${currentTheme.border}`}>
                          <span className={`${currentTheme.textSecondary}`}>Available:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{balance.available}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              )}

          {/* Leave Requests Table */}
          <div className={`${currentTheme.surface} rounded-lg border ${currentTheme.border} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${currentTheme.border}`}>
              <h2 className={`text-lg font-semibold ${currentTheme.text}`}>
                {isAdmin ? 'All Leave Requests' : 'My Leave Requests'}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme.surfaceSecondary}`}>
                  <tr>
                    {isAdmin && <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Employee</th>}
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Leave Type</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Start Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>End Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Days</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Requested On</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className={`px-6 py-8 text-center`}>
                        <div className={`${currentTheme.textSecondary}`}>
                          <p className="text-sm mb-2">No leave requests found</p>
                          <p className="text-xs">Click "Apply Leave" to create your first leave request</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((request) => (
                      <tr key={request._id} className={`${currentTheme.hover}`}>
                        {isAdmin && (
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                            {request.userId?.full_name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: request.leaveTypeId?.color }}
                            ></div>
                            <span className={`text-sm ${currentTheme.text}`}>
                              {request.leaveTypeId?.name}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {new Date(request.startDate).toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {request.days}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(request.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className={`text-xs ${currentTheme.textSecondary}`}>
                              {new Date(request.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailsModal(request)}
                              className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                              View Details
                            </button>
                            {isAdmin && request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveReject(request._id, 'approved')}
                                  className="px-3 py-1 bg-green-600 dark:bg-green-500 text-white text-xs rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingRequestId(request._id);
                                    setRejectionReason('');
                                    setShowRejectModal(true);
                                  }}
                                  className="px-3 py-1 bg-red-600 dark:bg-red-500 text-white text-xs rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => openNotesModal(request)}
                                className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white text-xs rounded hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                              >
                                {request.hrNotes ? 'Edit Notes' : 'Add Notes'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
      </ResponsivePageLayout>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowModal(false)}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-md w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Apply for Leave</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {leaveTypes.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-400 mb-2">No leave types available</p>
                    <p className="text-xs text-yellow-300">
                      {isAdmin 
                        ? 'Please create leave types first by clicking "Manage Leave Types" button.'
                        : 'Please contact your HR or Admin to set up leave types.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                        Leave Type *
                      </label>
                      <select
                        value={formData.leaveTypeId}
                        onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                        className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                        required
                      >
                        <option value="">Select leave type</option>
                        {leaveTypes.map(type => {
                          const balance = leaveBalances.find(b => b.leaveTypeId?._id === type._id);
                          return (
                            <option key={type._id} value={type._id}>
                              {type.name} ({type.code}) - 
                              {balance 
                                ? ` Available: ${balance.available} days (Total: ${balance.totalQuota})`
                                : ` ${type.annualQuota} days/year`
                              }
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {/* Show selected leave type balance details */}
                    {formData.leaveTypeId && (() => {
                      const selectedBalance = leaveBalances.find(b => b.leaveTypeId?._id === formData.leaveTypeId);
                      if (selectedBalance) {
                        return (
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg p-3 border ${currentTheme.border}`}>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className={`${currentTheme.textSecondary}`}>Total:</span>
                                <span className={`ml-2 font-semibold ${currentTheme.text}`}>{selectedBalance.totalQuota}</span>
                              </div>
                              <div>
                                <span className={`${currentTheme.textSecondary}`}>Used:</span>
                                <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{selectedBalance.used}</span>
                              </div>
                              <div>
                                <span className={`${currentTheme.textSecondary}`}>Pending:</span>
                                <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">{selectedBalance.pending}</span>
                              </div>
                              <div>
                                <span className={`${currentTheme.textSecondary}`}>Available:</span>
                                <span className="ml-2 font-bold text-green-600 dark:text-green-400">{selectedBalance.available}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    rows="3"
                    required
                  />
                </div>
                  </>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} hover:${currentTheme.text} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={leaveTypes.length === 0}
                    className="px-4 py-2 bg-[#136dec] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leave Type Management Modal */}
      {showLeaveTypeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowLeaveTypeModal(false)}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>
                  {editingLeaveType ? 'Edit Leave Type' : 'Manage Leave Types'}
                </h3>
                <button
                  onClick={handleCloseLeaveTypeModal}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Existing Leave Types List */}
              {!editingLeaveType && leaveTypes.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold ${currentTheme.text} mb-3`}>Existing Leave Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {leaveTypes.map((type) => {
                      // Find the corresponding balance for this leave type
                      const balance = leaveBalances.find(b => b.leaveTypeId?._id === type._id);
                      
                      return (
                        <div
                          key={type._id}
                          className={`${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded-lg p-3 flex items-center justify-between hover:border-blue-500/50 transition-colors`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: type.color }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className={`text-sm font-semibold ${currentTheme.text} truncate`}>
                                  {type.name}
                                </h5>
                                <span className={`text-xs px-2 py-0.5 rounded ${currentTheme.surfaceSecondary} ${currentTheme.textSecondary} border ${currentTheme.border}`}>
                                  {type.code}
                                </span>
                              </div>
                              <p className={`text-xs ${currentTheme.textSecondary} mt-0.5`}>
                                Quota: {type.annualQuota} days/year
                                {type.carryForward && ` • CF: ${type.maxCarryForward}`}
                              </p>
                              {balance && (
                                <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                                  <span className={`${currentTheme.textSecondary}`}>
                                    Your balance:
                                  </span>
                                  {balance.carriedForward > 0 && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      CF: +{balance.carriedForward}
                                    </span>
                                  )}
                                  <span className={`${currentTheme.textSecondary}`}>
                                    Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{balance.totalQuota}</span>
                                  </span>
                                  <span className={`${currentTheme.textSecondary}`}>
                                    Used: <span className="font-semibold text-red-600 dark:text-red-400">{balance.used}</span>
                                  </span>
                                  <span className={`${currentTheme.textSecondary}`}>
                                    Left: <span className="font-semibold text-green-600 dark:text-green-400">{balance.available}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditLeaveType(type)}
                            className="ml-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`mt-4 pt-4 border-t ${currentTheme.border}`}>
                    <p className={`text-sm font-semibold ${currentTheme.text} mb-2`}>Create New Leave Type</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateLeaveType} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Leave Type Name *
                    </label>
                    <input
                      type="text"
                      value={leaveTypeForm.name}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, name: e.target.value })}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                      placeholder="e.g., Annual Leave"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Code (2-4 chars) *
                    </label>
                    <input
                      type="text"
                      value={leaveTypeForm.code}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, code: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text} ${editingLeaveType ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g., AL"
                      maxLength={4}
                      readOnly={editingLeaveType}
                      required
                    />
                    {editingLeaveType && (
                      <p className="text-xs text-yellow-500 mt-1">Code cannot be changed after creation</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Annual Quota (days) *
                    </label>
                    <input
                      type="number"
                      value={leaveTypeForm.annualQuota}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, annualQuota: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                      min="1"
                      max="365"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Base allocation per year (excluding carry forward)
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={leaveTypeForm.color}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, color: e.target.value })}
                      className={`w-full h-10 px-3 py-1 border ${currentTheme.border} rounded-lg ${currentTheme.surface}`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="carryForward"
                    checked={leaveTypeForm.carryForward}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, carryForward: e.target.checked })}
                    className="rounded border-gray-500 text-[#136dec] focus:ring-[#136dec]"
                  />
                  <label htmlFor="carryForward" className={`text-sm ${currentTheme.text}`}>
                    Allow carry forward to next year
                  </label>
                </div>

                {leaveTypeForm.carryForward && (
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Max Carry Forward (days)
                    </label>
                    <input
                      type="number"
                      value={leaveTypeForm.maxCarryForward}
                      onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, maxCarryForward: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                      min="0"
                      max={leaveTypeForm.annualQuota}
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Description
                  </label>
                  <textarea
                    value={leaveTypeForm.description}
                    onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, description: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    rows="3"
                    placeholder="Brief description of this leave type..."
                  />
                </div>

                {!editingLeaveType && (
                  <div className={`bg-blue-500/10 border border-blue-500/30 rounded-lg p-3`}>
                    <p className="text-xs text-blue-400">
                      <strong>Note:</strong> This will create leave balances for all existing users in the workspace with the specified annual quota.
                    </p>
                  </div>
                )}

                {editingLeaveType && (
                  <><div className={`bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3`}>
                    <p className="text-xs text-yellow-400 mb-2">
                      <strong>Warning:</strong> Changing the annual quota will not automatically update existing user balances unless you enable the option below.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="updateExistingBalances"
                        checked={leaveTypeForm.updateExistingBalances}
                        onChange={(e) => setLeaveTypeForm({ ...leaveTypeForm, updateExistingBalances: e.target.checked })}
                        className="rounded border-gray-500 text-[#136dec] focus:ring-[#136dec]"
                      />
                      <label htmlFor="updateExistingBalances" className={`text-xs ${currentTheme.text}`}>
                        Update existing user balances with the new annual quota (recommended when adjusting company-wide leave policies)
                      </label>
                    </div>
                  </div></>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseLeaveTypeModal}
                    className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingLeaveType ? 'Update Leave Type' : 'Create Leave Type'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDetailsModal(false)}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-2xl w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Leave Request Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee Info */}
                {isAdmin && (
                  <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                    <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Employee</h4>
                    <p className={`text-sm ${currentTheme.text}`}>{selectedRequest.userId?.full_name}</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>{selectedRequest.userId?.email}</p>
                  </div>
                )}

                {/* Leave Type */}
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                  <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Leave Type</h4>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedRequest.leaveTypeId?.color }}
                    ></div>
                    <span className={`text-sm ${currentTheme.text}`}>{selectedRequest.leaveTypeId?.name}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                  <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Duration</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs ${currentTheme.textSecondary} mb-1`}>Start Date</p>
                      <p className={`text-sm ${currentTheme.text}`}>{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${currentTheme.textSecondary} mb-1`}>End Date</p>
                      <p className={`text-sm ${currentTheme.text}`}>{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${currentTheme.textSecondary} mb-1`}>Total Days</p>
                      <p className={`text-sm font-bold ${currentTheme.text}`}>{selectedRequest.days}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                  <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Reason</h4>
                  <p className={`text-sm ${currentTheme.text} whitespace-pre-wrap`}>{selectedRequest.reason}</p>
                </div>

                {/* Status */}
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                  <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Status</h4>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                  {selectedRequest.approvedBy && (
                    <p className={`text-xs ${currentTheme.textSecondary} mt-2`}>
                      {selectedRequest.status === 'approved' ? 'Approved' : 'Processed'} by {selectedRequest.approvedBy.full_name}
                    </p>
                  )}
                  {selectedRequest.approvedAt && (
                    <p className={`text-xs ${currentTheme.textSecondary}`}>
                      on {new Date(selectedRequest.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Rejection Reason */}
                {selectedRequest.rejectionReason && (
                  <div className={`p-4 rounded-lg bg-red-500/10 border border-red-500/30`}>
                    <h4 className="text-sm font-bold text-red-400 mb-2">Rejection Reason</h4>
                    <p className="text-sm text-red-300 whitespace-pre-wrap">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {/* HR Notes */}
                {selectedRequest.hrNotes && (
                  <div className={`p-4 rounded-lg bg-purple-500/10 border border-purple-500/30`}>
                    <h4 className="text-sm font-bold text-purple-400 mb-2">HR Notes</h4>
                    <p className="text-sm text-purple-300 whitespace-pre-wrap">{selectedRequest.hrNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HR Notes Modal */}
      {showNotesModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowNotesModal(false)}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-md w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>HR Notes</h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Notes (Visible to Employee)
                  </label>
                  <textarea
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    rows="5"
                    placeholder="Add notes or comments for the employee..."
                  />
                  <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>
                    These notes will be visible to the employee and can be used to provide additional context or instructions.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateNotes}
                    className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700`}
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Leave Marking Modal */}
      {showBulkLeaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => {
              setShowBulkLeaveModal(false);
              setSelectedUserBalance([]);
            }}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-2xl w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Mark Leave for Employee</h3>
                <button
                  onClick={() => {
                    setShowBulkLeaveModal(false);
                    setSelectedUserBalance([]);
                    setBulkLeaveForm({
                      userId: '',
                      leaveTypeId: '',
                      startDate: '',
                      endDate: '',
                      timePeriod: 'full_day',
                      reason: ''
                    });
                  }}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBulkLeaveSubmit} className="space-y-4">
                {/* Select Employee */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Select Employee *
                  </label>
                  <select
                    value={bulkLeaveForm.userId}
                    onChange={(e) => {
                      setBulkLeaveForm({ ...bulkLeaveForm, userId: e.target.value });
                      if (e.target.value) {
                        fetchUserBalance(e.target.value);
                      } else {
                        setSelectedUserBalance([]);
                      }
                    }}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    required
                  >
                    <option value="">-- Select Employee --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.full_name} ({u.email}) - {u.department || 'No Department'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Leave Type *
                  </label>
                  <select
                    value={bulkLeaveForm.leaveTypeId}
                    onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, leaveTypeId: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    required
                  >
                    <option value="">-- Select Leave Type --</option>
                    {leaveTypes.map((type) => {
                      const balance = selectedUserBalance.find(b => b.leaveTypeId?._id === type._id);
                      return (
                        <option key={type._id} value={type._id}>
                          {type.name} ({type.code})
                          {balance ? ` - Available: ${balance.available}/${balance.totalQuota} days` : ` - ${type.annualQuota} days/year`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Show selected employee's leave type balance */}
                {bulkLeaveForm.userId && bulkLeaveForm.leaveTypeId && (() => {
                  const selectedBalance = selectedUserBalance.find(b => b.leaveTypeId?._id === bulkLeaveForm.leaveTypeId);
                  if (selectedBalance) {
                    return (
                      <div className={`${currentTheme.surfaceSecondary} rounded-lg p-3 border ${currentTheme.border}`}>
                        <h4 className={`text-sm font-semibold ${currentTheme.text} mb-2`}>Employee Leave Balance</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className={`${currentTheme.textSecondary}`}>Total:</span>
                            <span className={`ml-2 font-semibold ${currentTheme.text}`}>{selectedBalance.totalQuota}</span>
                          </div>
                          <div>
                            <span className={`${currentTheme.textSecondary}`}>Used:</span>
                            <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{selectedBalance.used}</span>
                          </div>
                          <div>
                            <span className={`${currentTheme.textSecondary}`}>Pending:</span>
                            <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">{selectedBalance.pending}</span>
                          </div>
                          <div>
                            <span className={`${currentTheme.textSecondary}`}>Available:</span>
                            <span className="ml-2 font-bold text-green-600 dark:text-green-400">{selectedBalance.available}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={bulkLeaveForm.startDate}
                      onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, startDate: e.target.value })}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={bulkLeaveForm.endDate}
                      onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, endDate: e.target.value })}
                      min={bulkLeaveForm.startDate}
                      className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                      required
                    />
                  </div>
                </div>

                {/* Time Period Selection */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Time Period *
                  </label>
                  <select
                    value={bulkLeaveForm.timePeriod}
                    onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, timePeriod: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    required
                  >
                    <option value="full_day">Full Day</option>
                    <option value="half_day">Half Day</option>
                  </select>
                  <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>
                    Select full day or half day leave for the entire period
                  </p>
                </div>

                {/* Display calculated days */}
                {bulkLeaveForm.startDate && bulkLeaveForm.endDate && (
                  <div className={`p-3 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium ${currentTheme.text}`}>Leave Duration:</span>
                      <span className={`text-lg font-bold ${currentTheme.text}`}>
                        {bulkLeaveForm.timePeriod === 'full_day' 
                          ? calculateDays(bulkLeaveForm.startDate, bulkLeaveForm.endDate) 
                          : (calculateDays(bulkLeaveForm.startDate, bulkLeaveForm.endDate) * 0.5).toFixed(1)} days
                      </span>
                    </div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>
                      {calculateDays(bulkLeaveForm.startDate, bulkLeaveForm.endDate)} calendar days × {bulkLeaveForm.timePeriod === 'full_day' ? 'Full Day' : 'Half Day (0.5)'}
                    </div>
                    <div className={`text-xs ${currentColorScheme.info.replace('bg-', 'text-').replace('-500', '-600')} mt-2 flex items-start gap-1`}>
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Attendance will be automatically marked as "Leave" for selected dates</span>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Reason *
                  </label>
                  <textarea
                    value={bulkLeaveForm.reason}
                    onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, reason: e.target.value })}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    rows="3"
                    placeholder="Enter reason for leave..."
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkLeaveModal(false);
                      setSelectedUserBalance([]);
                      setBulkLeaveForm({
                        userId: '',
                        leaveTypeId: '',
                        startDate: '',
                        endDate: '',
                        timePeriod: 'full_day',
                        reason: ''
                      });
                    }}
                    className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700`}
                  >
                    Mark Leave
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Leave Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowRejectModal(false)}></div>

            <div className={`relative ${currentTheme.surface} rounded-lg max-w-md w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Reject Leave Request</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={`w-full px-3 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    rows="3"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    disabled={!rejectionReason.trim()}
                    className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
