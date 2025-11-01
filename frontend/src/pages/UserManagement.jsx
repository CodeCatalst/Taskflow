import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

export default function UserManagement() {
  const { user } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
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
        <div className="flex-1 py-8">
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

        {/* Create User Button */}
        <div className="mb-6">
          <button
            onClick={openCreateModal}
            className={`${currentColorScheme.primary} ${currentColorScheme.primaryHover} text-white px-4 py-2 rounded-lg flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New User
          </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
