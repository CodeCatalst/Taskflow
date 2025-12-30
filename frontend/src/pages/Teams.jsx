import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Plus, X, Users, UserPlus, UserMinus, Trash2, Pin, GripVertical } from 'lucide-react';

const Teams = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const confirmModal = useConfirmModal();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hr_id: '',
    lead_id: '',
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]); // For multi-select
  const [isMultiSelect, setIsMultiSelect] = useState(false); // Toggle multi-select mode
  const [draggedTeam, setDraggedTeam] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchTeams();
      // Only fetch users for admin, HR and community_admin (team leads don't need all users)
      if (['admin', 'hr', 'community_admin'].includes(user?.role)) {
        fetchUsers();
      }
    }
  }, [user?.id, user?.role]);

  // Real-time synchronization
  useRealtimeSync({
    onTeamCreated: () => {
      if (user?.id) fetchTeams();
    },
    onTeamUpdated: () => {
      if (user?.id) fetchTeams();
    },
    onTeamDeleted: () => {
      if (user?.id) fetchTeams();
    },
    onUserUpdated: () => {
      if (['admin', 'hr', 'community_admin'].includes(user?.role)) fetchUsers();
    },
  });

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      let fetchedTeams = response.data.teams;
      
      // Filter teams for team leads - show only their team(s)
      if (user?.role === 'team_lead') {
        fetchedTeams = fetchedTeams.filter(team => 
          team.lead_id?._id === user?.id || team.lead_id === user?.id
        );
      }
      
      setTeams(fetchedTeams);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', formData);
      setShowCreateModal(false);
      setFormData({ name: '', hr_id: '', lead_id: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    try {
      if (isMultiSelect && selectedUserIds.length > 0) {
        // Bulk add members
        const response = await api.post(`/teams/${selectedTeam._id}/members/bulk`, {
          userIds: selectedUserIds,
        });
        
        const { results } = response.data;
        let message = `Added ${results.added.length} member(s)`;
        if (results.skipped.length > 0) {
          message += `, skipped ${results.skipped.length} (already members)`;
        }
        if (results.failed.length > 0) {
          message += `, failed ${results.failed.length}`;
        }
        
        alert(message);
      } else if (selectedUserId) {
        // Single add member
        await api.post(`/teams/${selectedTeam._id}/members`, {
          userId: selectedUserId,
        });
      }
      
      setShowAddMemberModal(false);
      setSelectedUserId('');
      setSelectedUserIds([]);
      setIsMultiSelect(false);
      fetchTeams();
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    const availableUsers = users.filter((u) => !selectedTeam?.members?.some((m) => m._id === u._id));
    
    if (selectedUserIds.length === availableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(availableUsers.map(u => u._id));
    }
  };

  const handleRemoveMember = (teamId, userId) => {
    confirmModal.show({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the team? They will no longer have access to team resources.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${teamId}/members/${userId}`);
          fetchTeams();
        } catch (error) {
          console.error('Error removing member:', error);
          alert(error.response?.data?.message || 'Failed to remove member');
        }
      },
    });
  };

  const handleDeleteTeam = (teamId, teamName) => {
    confirmModal.show({
      title: 'Delete Team',
      message: `Are you sure you want to delete team "${teamName}"? All members will be unassigned from this team and this action cannot be undone.`,
      confirmText: 'Delete Team',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${teamId}`);
          fetchTeams();
          alert('Team deleted successfully');
        } catch (error) {
          console.error('Error deleting team:', error);
          alert(error.response?.data?.message || 'Failed to delete team');
        }
      },
    });
  };

  const handleTogglePin = async (teamId) => {
    try {
      await api.patch(`/teams/${teamId}/pin`);
      fetchTeams();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert(error.response?.data?.message || 'Failed to toggle pin');
    }
  };

  const handleDragStart = (e, team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetTeam) => {
    e.preventDefault();
    
    if (!draggedTeam || draggedTeam._id === targetTeam._id) {
      setDraggedTeam(null);
      return;
    }

    // Reorder teams array
    const updatedTeams = [...teams];
    const draggedIndex = updatedTeams.findIndex(t => t._id === draggedTeam._id);
    const targetIndex = updatedTeams.findIndex(t => t._id === targetTeam._id);

    updatedTeams.splice(draggedIndex, 1);
    updatedTeams.splice(targetIndex, 0, draggedTeam);

    // Update local state immediately for smooth UX
    setTeams(updatedTeams);

    // Send new order to backend
    try {
      const teamOrder = updatedTeams.map((team, index) => ({
        id: team._id,
        priority: updatedTeams.length - index
      }));
      
      await api.post('/teams/reorder', { teamOrder });
    } catch (error) {
      console.error('Error reordering teams:', error);
      // Revert on error
      fetchTeams();
    }

    setDraggedTeam(null);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="loading-bar-container">
                <div className="loading-bar bg-[#136dec]"></div>
              </div>
              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading teams...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className={`text-xl ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`} data-testid="teams-page">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {user?.role === 'team_lead' ? 'My Team' : 'Teams'}
            </h1>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-2`}>
              {user?.role === 'team_lead' 
                ? 'Manage your team and members' 
                : 'Manage your teams and members'}
            </p>
          </div>
          {['admin', 'hr', 'community_admin'].includes(user?.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#136dec] text-white rounded-[0.125rem] hover:bg-[#1158c7] transition-colors flex items-center space-x-2"
              data-testid="create-team-btn"
            >
              <Plus className="w-5 h-5" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <div className={`rounded-[0.125rem] shadow-md p-12 text-center border ${
            theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
          }`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {user?.role === 'team_lead' ? 'No Team Assigned' : 'No Teams Yet'}
            </h3>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              {user?.role === 'team_lead' 
                ? 'You are not currently assigned as a team lead. Please contact an administrator.'
                : 'Get started by creating your first team.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
            <div
              key={team._id}
              draggable={['admin', 'hr', 'community_admin'].includes(user?.role)}
              onDragStart={(e) => handleDragStart(e, team)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, team)}
              className={`rounded-[0.125rem] shadow-md p-6 relative border transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#1c2027] border-[#282f39] hover:border-[#3e454f]' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${draggedTeam?._id === team._id ? 'opacity-50' : ''} ${['admin', 'hr', 'community_admin'].includes(user?.role) ? 'cursor-move' : ''}`}
              data-testid="team-card"
            >
              {/* Pin Indicator */}
              {team.pinned && (
                <div className="absolute top-2 left-2">
                  <Pin className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              {/* Drag Handle for Admin/HR/Community Admin */}
              {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                <div className="absolute top-2 right-2">
                  <GripVertical className={`w-5 h-5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                </div>
              )}

              <div className="flex items-center justify-between mb-4 mt-4">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{team.name}</h3>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-[#136dec]" />
                  {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                    <>
                      <button
                        onClick={() => handleTogglePin(team._id)}
                        className={`hover:text-yellow-600 p-1 transition-colors ${
                          team.pinned ? 'text-yellow-500' : theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'
                        }`}
                        title={team.pinned ? 'Unpin Team' : 'Pin Team'}
                        data-testid="pin-team-btn"
                      >
                        <Pin className={`w-5 h-5 ${team.pinned ? 'fill-yellow-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team._id, team.name)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Team"
                        data-testid="delete-team-btn"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>HR:</span>
                  <span className={`ml-2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{team.hr_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Team Lead:</span>
                  <span className={`ml-2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{team.lead_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Members:</span>
                  <span className={`ml-2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{team.members?.length || 0}</span>
                </div>
              </div>

              <div className={`border-t pt-4 ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                <h4 className="text-sm font-medium text-white mb-2">Team Members</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <div
                        key={member._id}
                        className={`flex justify-between items-center rounded-[0.125rem] p-2 border ${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-white border-gray-200'}`}
                        data-testid="team-member"
                      >
                        <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{member.full_name}</span>
                        {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                          <button
                            onClick={() => handleRemoveMember(team._id, member._id)}
                            className="text-red-600 hover:text-red-800"
                            data-testid="remove-member-btn"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#9da8b9]">No members yet</p>
                  )}
                </div>
              </div>

              {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowAddMemberModal(true);
                  }}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-[0.125rem] hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  data-testid="add-member-btn"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          ))}
        </div>
        )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-team-modal">
          <div className="bg-[#1c2027] rounded-[0.125rem] p-8 max-w-md w-full mx-4 border border-[#282f39]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#9da8b9] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  data-testid="team-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  HR *
                </label>
                <select
                  value={formData.hr_id}
                  onChange={(e) => setFormData({ ...formData, hr_id: e.target.value })}
                  className="input"
                  required
                  data-testid="team-hr-select"
                >
                  <option value="">Select HR</option>
                  {users
                    .filter((u) => u.role === 'hr' || u.role === 'admin')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Team Lead *
                </label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  className="input"
                  required
                  data-testid="team-lead-select"
                >
                  <option value="">Select Team Lead</option>
                  {users
                    .filter((u) => u.role === 'team_lead' || u.role === 'admin')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="submit-create-team">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="add-member-modal">
          <div className="bg-[#1c2027] rounded-[0.125rem] p-8 max-w-2xl w-full mx-4 border border-[#282f39]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add Member to {selectedTeam.name}</h2>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setIsMultiSelect(false);
                  setSelectedUserIds([]);
                  setSelectedUserId('');
                }}
                className="text-[#9da8b9] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Toggle Multi-Select Mode */}
              <div className="flex items-center justify-between p-3 bg-[#136dec]/10 rounded-[0.125rem] border border-[#136dec]/20">
                <span className="text-sm font-medium text-white">
                  {isMultiSelect ? 'Multi-Select Mode' : 'Single Select Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiSelect(!isMultiSelect);
                    setSelectedUserId('');
                    setSelectedUserIds([]);
                  }}
                  className={`px-4 py-2 rounded-[0.125rem] text-sm font-medium transition-colors ${
                    isMultiSelect 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-[#282f39] text-white hover:bg-[#3e454f]'
                  }`}
                >
                  {isMultiSelect ? 'Switch to Single Select' : 'Switch to Multi-Select'}
                </button>
              </div>

              {isMultiSelect ? (
                /* Multi-Select UI */
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-white">
                      Select Users ({selectedUserIds.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-sm text-[#136dec] hover:text-[#1158c7]"
                    >
                      {selectedUserIds.length === users.filter((u) => !selectedTeam.members?.some((m) => m._id === u._id)).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="border border-[#282f39] rounded-[0.125rem] max-h-96 overflow-y-auto">
                    {users
                      .filter((u) => !selectedTeam.members?.some((m) => m._id === u._id))
                      .map((u) => (
                        <label
                          key={u._id}
                          className="flex items-center p-3 hover:bg-[#282f39] cursor-pointer border-b border-[#282f39] last:border-b-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u._id)}
                            onChange={() => toggleUserSelection(u._id)}
                            className="w-4 h-4 text-[#136dec] rounded focus:ring-[#136dec] mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">{u.full_name}</div>
                            <div className="text-sm text-[#9da8b9]">
                              {u.email} • <span className="capitalize">{u.role}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    {users.filter((u) => !selectedTeam.members?.some((m) => m._id === u._id)).length === 0 && (
                      <div className="p-6 text-center text-[#9da8b9]">
                        No available users to add
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Single Select UI */
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select User *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="input"
                    required
                    data-testid="select-user-input"
                  >
                    <option value="">Select a user</option>
                    {users
                      .filter((u) => !selectedTeam.members?.some((m) => m._id === u._id))
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setIsMultiSelect(false);
                    setSelectedUserIds([]);
                    setSelectedUserId('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  data-testid="submit-add-member"
                  disabled={isMultiSelect ? selectedUserIds.length === 0 : !selectedUserId}
                >
                  {isMultiSelect 
                    ? `Add ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? 's' : ''}`
                    : 'Add Member'}
                </button>
              </div>
            </form>
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

export default Teams;