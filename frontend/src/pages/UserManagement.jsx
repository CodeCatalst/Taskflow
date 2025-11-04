import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { Upload, Download, FileJson, FileSpreadsheet, X } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]); // For bulk delete
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'member',
    team_id: ''
  });

  // Check if user has permission
  const hasPermission = user && (user.role === 'admin' || user.role === 'hr');

  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
      fetchTeams();
    }
  }, [hasPermission]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If changing role to admin, automatically clear team assignment
    if (name === 'role' && value === 'admin') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        team_id: '' // Clear team for admin users
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'member',
      team_id: ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      team_id: user.team_id?._id || ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'create') {
        await api.post('/users', formData);
        setSuccess('User created successfully');
      } else {
        const updateData = { ...formData };
        delete updateData.password; // Don't send password in update
        await api.put(`/users/${selectedUser._id}`, updateData);
        setSuccess('User updated successfully');
      }
      
      await fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalMode} user`);
    }
  };

  const handleDelete = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setSuccess('User deleted successfully');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select users to delete');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)?`)) {
      return;
    }

    try {
      const response = await api.post('/users/bulk-delete', { userIds: selectedUserIds });
      setSuccess(response.data.message);
      setSelectedUserIds([]);
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete users');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteAll = async () => {
    // Filter out current user from deletion
    const allUserIds = users.filter(usr => usr._id !== user.id).map(usr => usr._id);
    
    if (allUserIds.length === 0) {
      setError('No users available to delete');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm(`⚠️ WARNING: This will delete ALL ${allUserIds.length} user(s) except yourself. Are you absolutely sure?`)) {
      return;
    }

    // Double confirmation
    if (!window.confirm(`This action CANNOT be undone. Type 'YES' to confirm deletion of all users.`)) {
      return;
    }

    try {
      const response = await api.post('/users/bulk-delete', { userIds: allUserIds });
      setSuccess(response.data.message);
      setSelectedUserIds([]);
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete all users');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.filter(usr => usr._id !== user.id).length) {
      // Deselect all
      setSelectedUserIds([]);
    } else {
      // Select all except current user
      setSelectedUserIds(users.filter(usr => usr._id !== user.id).map(usr => usr._id));
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    const newPassword = prompt(`Enter new password for ${userEmail}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword });
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Bulk import functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JSON or Excel file.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setBulkImportFile(file);
      setError('');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      setError('Please select a file to import');
      return;
    }

    setBulkImportLoading(true);
    setError('');
    setBulkImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkImportFile);

      // Determine endpoint based on file type
      const isExcel = bulkImportFile.type.includes('spreadsheet') || bulkImportFile.type.includes('excel');
      const endpoint = isExcel ? '/users/bulk-import/excel' : '/users/bulk-import/json';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setBulkImportResults(response.data);
      setSuccess(`Successfully imported ${response.data.successful.length} users`);
      
      // Refresh users list
      await fetchUsers();
      
      // Keep modal open to show results
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import users');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const downloadTemplate = async (format) => {
    try {
      const endpoint = format === 'json' ? '/users/bulk-import/template-json' : '/users/bulk-import/template';
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_import_template.${format === 'json' ? 'json' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
      setTimeout(() => setError(''), 3000);
    }
  };

  const closeBulkImportModal = () => {
    setShowBulkImportModal(false);
    setBulkImportFile(null);
    setBulkImportResults(null);
    setError('');
    setSuccess('');
  };

  if (!hasPermission) {
    return (
      <div className={`min-h-screen ${currentTheme.background}`}>
        <div className="flex">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className={`${currentTheme.surface} p-8 rounded-lg shadow-md`}>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className={`${currentTheme.textSecondary}`}>You don't have permission to access user management.</p>
              <p className={`${currentTheme.textMuted} mt-2`}>Only Admin and HR can manage users.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      hr: 'bg-blue-100 text-blue-800',
      team_lead: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.member;
  };

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${currentTheme.text}`}>User Management</h1>
              <p className={`${currentTheme.textSecondary} mt-2`}>Manage all users in the system</p>
            </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={openCreateModal}
            className={`${currentColorScheme.primary} ${currentColorScheme.primaryHover} text-white px-4 py-2 rounded-lg flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New User
          </button>

          <button
            onClick={() => setShowBulkImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>

          <button
            onClick={() => downloadTemplate('excel')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Download Excel Template
          </button>

          <button
            onClick={() => downloadTemplate('json')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FileJson className="w-5 h-5" />
            Download JSON Template
          </button>

          {/* Bulk Delete Actions - Only for Admin */}
          {user.role === 'admin' && (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={selectedUserIds.length === 0}
                className={`${
                  selectedUserIds.length > 0
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white px-4 py-2 rounded-lg flex items-center gap-2`}
                title="Delete selected users"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected ({selectedUserIds.length})
              </button>

              <button
                onClick={handleDeleteAll}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                title="Delete all users except yourself"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Delete All Users
              </button>
            </>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-6">
              <div className={`animate-spin-fast rounded-full h-16 w-16 border-4 border-gray-200 ${currentColorScheme.primary} border-t-4`}></div>
              <p className={`mt-2 ${currentTheme.textSecondary} font-medium`}>Loading users...</p>
            </div>
          </div>
        ) : (
          <div className={`${currentTheme.surface} shadow-md rounded-lg overflow-hidden`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${currentTheme.surfaceSecondary}`}>
                <tr>
                  {user.role === 'admin' && (
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length > 0 && selectedUserIds.length === users.filter(usr => usr._id !== user.id).length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        title="Select/Deselect All"
                      />
                    </th>
                  )}
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Email
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Team
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Created
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme.border}`}>
                {users.map((usr) => (
                  <tr key={usr._id} className={`${currentTheme.hover}`}>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usr._id !== user.id ? (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(usr._id)}
                            onChange={() => toggleSelectUser(usr._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${currentTheme.text}`}>{usr.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${currentTheme.textSecondary}`}>{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(usr.role)}`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${currentTheme.textSecondary}`}>
                        {usr.team_id?.name || 'No Team'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${currentTheme.textSecondary}`}>
                        {new Date(usr.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(usr)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Edit User"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(usr._id, usr.email)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                        title="Reset Password"
                      >
                        Reset Pwd
                      </button>
                      {user.role === 'admin' && usr._id !== user.id && (
                        <button
                          onClick={() => handleDelete(usr._id, usr.email)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className={`text-center py-12 ${currentTheme.textMuted}`}>
                No users found. Create your first user!
              </div>
            )}
          </div>
        )}

        {/* Create/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.surface} rounded-lg p-8 max-w-md w-full mx-4`}>
              <h2 className={`text-2xl font-bold mb-6 ${currentTheme.text}`}>
                {modalMode === 'create' ? 'Create New User' : 'Edit User'}
              </h2>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    />
                  </div>

                  {modalMode === 'create' && (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                      />
                      <p className={`text-xs ${currentTheme.textMuted} mt-1`}>Minimum 6 characters</p>
                    </div>
                  )}

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                    >
                      <option value="member">Member</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                      Team (Optional)
                    </label>
                    {formData.role === 'admin' ? (
                      <div className={`w-full px-3 py-2 ${currentTheme.surfaceSecondary} ${currentTheme.textMuted} border ${currentTheme.border} rounded-lg`}>
                        Admin users don't need team assignment
                      </div>
                    ) : (
                      <select
                        name="team_id"
                        value={formData.team_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.focus}`}
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 ${currentColorScheme.primary} ${currentColorScheme.primaryHover} text-white py-2 px-4 rounded-lg`}
                  >
                    {modalMode === 'create' ? 'Create User' : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 ${currentTheme.surfaceSecondary} ${currentTheme.hover} ${currentTheme.text} py-2 px-4 rounded-lg`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${currentTheme.surface} rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Bulk Import Users</h2>
                  <button
                    onClick={closeBulkImportModal}
                    className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
                    {success}
                  </div>
                )}

                {!bulkImportResults ? (
                  <>
                    <div className="mb-6">
                      <h3 className={`text-lg font-semibold ${currentTheme.text} mb-3`}>Instructions</h3>
                      <div className={`${currentTheme.surfaceSecondary} p-4 rounded-lg space-y-2 text-sm`}>
                        <p className={currentTheme.textSecondary}>1. Download a template (Excel or JSON)</p>
                        <p className={currentTheme.textSecondary}>2. Fill in user details (full_name, email, password, role, team)</p>
                        <p className={currentTheme.textSecondary}>3. Valid roles: admin, hr, team_lead, member</p>
                        <p className={currentTheme.textSecondary}>4. Teams will be auto-created if they don't exist</p>
                        <p className={currentTheme.textSecondary}>5. Upload the completed file</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                        Select File (Excel or JSON)
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.json"
                        onChange={handleFileSelect}
                        className={`w-full p-3 border rounded-lg ${currentTheme.border} ${currentTheme.background}`}
                      />
                      {bulkImportFile && (
                        <p className={`mt-2 text-sm ${currentTheme.textSecondary}`}>
                          Selected: {bulkImportFile.name}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBulkImport}
                        disabled={!bulkImportFile || bulkImportLoading}
                        className={`flex-1 ${
                          bulkImportFile && !bulkImportLoading
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        } text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2`}
                      >
                        {bulkImportLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Import Users
                          </>
                        )}
                      </button>
                      <button
                        onClick={closeBulkImportModal}
                        className={`px-6 ${currentTheme.surfaceSecondary} ${currentTheme.hover} ${currentTheme.text} py-3 rounded-lg font-medium`}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Total</p>
                          <p className="text-2xl font-bold text-blue-700">{bulkImportResults.total}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Successful</p>
                          <p className="text-2xl font-bold text-green-700">{bulkImportResults.successful.length}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-red-600 font-medium">Failed</p>
                          <p className="text-2xl font-bold text-red-700">{bulkImportResults.failed.length}</p>
                        </div>
                      </div>

                      {/* Teams Created */}
                      {bulkImportResults.teamsCreated.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-700 mb-2">Teams Auto-Created ({bulkImportResults.teamsCreated.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {bulkImportResults.teamsCreated.map((team, idx) => (
                              <span key={idx} className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {team.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Successful Imports */}
                      {bulkImportResults.successful.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">✅ Successfully Imported</h4>
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg max-h-48 overflow-y-auto`}>
                            <table className="min-w-full text-sm">
                              <thead className="sticky top-0 bg-green-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">Row</th>
                                  <th className="px-3 py-2 text-left">Email</th>
                                  <th className="px-3 py-2 text-left">Name</th>
                                  <th className="px-3 py-2 text-left">Role</th>
                                  <th className="px-3 py-2 text-left">Team</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bulkImportResults.successful.map((item, idx) => (
                                  <tr key={idx} className="border-t border-gray-200">
                                    <td className="px-3 py-2">{item.row}</td>
                                    <td className="px-3 py-2">{item.email}</td>
                                    <td className="px-3 py-2">{item.full_name}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(item.role)}`}>
                                        {item.role}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">{item.team}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Failed Imports */}
                      {bulkImportResults.failed.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">❌ Failed to Import</h4>
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg max-h-48 overflow-y-auto`}>
                            <table className="min-w-full text-sm">
                              <thead className="sticky top-0 bg-red-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">Row</th>
                                  <th className="px-3 py-2 text-left">Email</th>
                                  <th className="px-3 py-2 text-left">Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bulkImportResults.failed.map((item, idx) => (
                                  <tr key={idx} className="border-t border-gray-200">
                                    <td className="px-3 py-2">{item.row}</td>
                                    <td className="px-3 py-2">{item.email}</td>
                                    <td className="px-3 py-2 text-red-600">{item.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => {
                          setBulkImportResults(null);
                          setBulkImportFile(null);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
                      >
                        Import More Users
                      </button>
                      <button
                        onClick={closeBulkImportModal}
                        className={`px-6 ${currentTheme.surfaceSecondary} ${currentTheme.hover} ${currentTheme.text} py-3 rounded-lg font-medium`}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
