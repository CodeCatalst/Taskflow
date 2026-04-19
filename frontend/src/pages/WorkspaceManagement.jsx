import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import axios from '../api/axios';
import { 
  Building2, 
  Users, 
  CheckSquare, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Power,
  PowerOff,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  Menu
} from 'lucide-react';

export default function WorkspaceManagement() {
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const confirmModal = useConfirmModal();
  const isDark = theme === 'dark';
  
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMMUNITY',
    ownerEmail: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    type: 'COMMUNITY'
  });

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const showSuccess = (message) => {
    setModalMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const showError = (message) => {
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/workspaces');
      setWorkspaces(response.data);
    } catch (error) {
      showError('Failed to fetch workspaces: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Please enter a workspace name');
      return;
    }

    try {
      setProcessing(true);
      
      const response = await axios.post('/workspaces', formData);
      
      setShowCreateModal(false);
      setFormData({ name: '', type: 'COMMUNITY', ownerEmail: '' });
      showSuccess('Workspace created successfully!');
      fetchWorkspaces();
    } catch (error) {
      showError('Failed to create workspace: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editData.name.trim()) {
      showError('Please enter a workspace name');
      return;
    }

    try {
      setProcessing(true);
      
      const response = await axios.put(`/workspaces/${selectedWorkspace._id}`, editData);
      
      setShowEditModal(false);
      setSelectedWorkspace(null);
      showSuccess('Workspace updated successfully!');
      fetchWorkspaces();
    } catch (error) {
      showError('Failed to update workspace: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (workspace) => {
    setSelectedWorkspace(workspace);
    setDeleteConfirmText('');
    setShowDeletePrompt(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showError('Please type "DELETE" to confirm');
      return;
    }

    try {
      setProcessing(true);
      setShowDeletePrompt(false);
      
      const response = await axios.delete(`/workspaces/${selectedWorkspace._id}`);
      
      const deleted = response.data.deleted || {};
      showSuccess(`Workspace deleted successfully!\n\nDeleted:\n• ${deleted.users || 0} users\n• ${deleted.tasks || 0} tasks\n• ${deleted.teams || 0} teams`);
      fetchWorkspaces();
    } catch (error) {
      showError('Failed to delete workspace: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
      setSelectedWorkspace(null);
      setDeleteConfirmText('');
    }
  };

  const handleToggleStatus = async (workspace) => {
    const action = workspace.isActive ? 'deactivate' : 'activate';
    const confirmed = await confirmModal.show({
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Workspace`,
      message: `Are you sure you want to ${action} workspace "${workspace.name}"? Users in this workspace will ${action === 'deactivate' ? 'lose access until it is reactivated' : 'regain access'}.`,
      confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
      variant: action === 'deactivate' ? 'warning' : 'info'
    });

    if (!confirmed) return;

    try {
      setProcessing(true);
      
      const response = await axios.patch(`/workspaces/${workspace._id}/toggle-status`);
      
      showSuccess(`Workspace ${action}d successfully!`);
      fetchWorkspaces();
    } catch (error) {
      showError(`Failed to ${action} workspace: ` + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setEditData({
      name: workspace.name,
      type: workspace.type
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'}`}>
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileSidebar}
              className={`lg:hidden ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Building2 className="w-8 h-8 text-purple-600" />
                Workspace Management
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage all workspaces in the system
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Create Workspace
          </button>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <div
              key={workspace._id}
              className={`rounded-xl p-6 ${
                isDark ? 'bg-[#1a1f2e] border border-gray-800' : 'bg-white border border-gray-200'
              } hover:shadow-xl transition-shadow`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {workspace.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workspace.type === 'CORE'
                        ? 'bg-purple-900/30 text-purple-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {workspace.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workspace.isActive
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {workspace.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={`grid grid-cols-3 gap-4 mb-4 p-4 rounded-lg ${
                isDark ? 'bg-[#0f1419]' : 'bg-gray-50'
              }`}>
                <div className="text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {workspace.stats?.userCount || 0}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Users</p>
                </div>
                <div className="text-center">
                  <CheckSquare className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {workspace.stats?.taskCount || 0}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Tasks</p>
                </div>
                <div className="text-center">
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {workspace.stats?.teamCount || 0}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Teams</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(workspace)}
                  disabled={processing}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  } disabled:opacity-50`}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleToggleStatus(workspace)}
                  disabled={processing}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    workspace.isActive
                      ? isDark
                        ? 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-400'
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                      : isDark
                        ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                        : 'bg-green-100 hover:bg-green-200 text-green-600'
                  } disabled:opacity-50`}
                  title={workspace.isActive ? 'Deactivate' : 'Activate'}
                >
                  {workspace.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleDelete(workspace)}
                  disabled={processing}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                      : 'bg-red-100 hover:bg-red-200 text-red-600'
                  } disabled:opacity-50`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {workspaces.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No workspaces found. Create one to get started!
              </p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl p-6 w-full max-w-md ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Create Workspace
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={processing}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f1419] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="e.g., Acme Corporation"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f1419] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  >
                    <option value="COMMUNITY">COMMUNITY (Free - Limited)</option>
                    <option value="CORE">CORE (Enterprise - Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Owner Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f1419] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={processing}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Workspace'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl p-6 w-full max-w-md ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Edit Workspace
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={processing}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f1419] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type *
                  </label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f1419] border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  >
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="CORE">CORE</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={processing}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Workspace'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`rounded-xl p-6 w-full max-w-md ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} animate-scale-in`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Success!
              </h3>
            </div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-line`}>
              {modalMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 w-full max-w-md ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Error
              </h3>
            </div>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {modalMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeletePrompt && selectedWorkspace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 w-full max-w-md ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delete Workspace
              </h3>
            </div>

            <div className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="mb-4">
                ⚠️ You are about to delete workspace <strong>"{selectedWorkspace.name}"</strong>
              </p>
              <p className="mb-4">
                This will permanently delete ALL data:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>All users in this workspace</li>
                <li>All tasks in this workspace</li>
                <li>All teams in this workspace</li>
              </ul>
              <p className="text-red-500 font-semibold mb-4">
                This action CANNOT be undone!
              </p>
              <p className="mb-2">
                Type <strong className="text-red-500">DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-[#0f1419] border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Type DELETE here"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeletePrompt(false);
                  setSelectedWorkspace(null);
                  setDeleteConfirmText('');
                }}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={processing || deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Workspace'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal (for toggle status) */}
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
}
