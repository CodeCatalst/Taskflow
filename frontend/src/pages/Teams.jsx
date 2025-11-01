import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { Plus, X, Users, UserPlus, UserMinus, Trash2, Pin, GripVertical } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Teams = () => {
  const { user } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
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
  const [draggedTeam, setDraggedTeam] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchTeams();
      // Only fetch users for admin and HR (team leads don't need all users)
      if (['admin', 'hr'].includes(user?.role)) {
        fetchUsers();
      }
    }
  }, [user?.id, user?.role]);

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
      await api.post(`/teams/${selectedTeam._id}/members`, {
        userId: selectedUserId,
      });
      setShowAddMemberModal(false);
      setSelectedUserId('');
      fetchTeams();
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      fetchTeams();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? All members will be unassigned from this team.`)) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}`);
      fetchTeams();
      alert('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.message || 'Failed to delete team');
    }
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
      <div className={`min-h-screen ${currentTheme.background}`}>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-6">
            <div className="loading-bar-container">
              <div className={`loading-bar ${currentColorScheme.primary}`}></div>
            </div>
            <p className={`${currentTheme.text} font-medium`}>Loading teams...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!['admin', 'hr', 'team_lead'].includes(user?.role)) {
    return (
      <div className={`min-h-screen ${currentTheme.background}`}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`text-xl ${currentTheme.textSecondary}`}>You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`} data-testid="teams-page">
      <div className="flex">
        <Navbar />
        <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>
              {user?.role === 'team_lead' ? 'My Team' : 'Teams'}
            </h1>
            <p className={`${currentTheme.textSecondary} mt-2`}>
              {user?.role === 'team_lead' 
                ? 'Manage your team and members' 
                : 'Manage your teams and members'}
            </p>
          </div>
          {['admin', 'hr'].includes(user?.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`btn ${currentColorScheme.primary} text-white ${currentColorScheme.primaryHover} flex items-center space-x-2`}
              data-testid="create-team-btn"
            >
              <Plus className="w-5 h-5" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <div className={`${currentTheme.surface} rounded-lg shadow-md p-12 text-center`}>
            <Users className={`w-16 h-16 mx-auto ${currentTheme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${currentTheme.text} mb-2`}>
              {user?.role === 'team_lead' ? 'No Team Assigned' : 'No Teams Yet'}
            </h3>
            <p className={`${currentTheme.textSecondary}`}>
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
              draggable={['admin', 'hr'].includes(user?.role)}
              onDragStart={(e) => handleDragStart(e, team)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, team)}
              className={`${currentTheme.surface} rounded-lg shadow-md p-6 relative ${
                draggedTeam?._id === team._id ? 'opacity-50' : ''
              } ${['admin', 'hr'].includes(user?.role) ? 'cursor-move' : ''}`}
              data-testid="team-card"
            >
              {/* Pin Indicator */}
              {team.pinned && (
                <div className="absolute top-2 left-2">
                  <Pin className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              {/* Drag Handle for Admin/HR */}
              {['admin', 'hr'].includes(user?.role) && (
                <div className="absolute top-2 right-2">
                  <GripVertical className={`w-5 h-5 ${currentTheme.textMuted}`} />
                </div>
              )}

              <div className="flex items-center justify-between mb-4 mt-4">
                <h3 className={`text-xl font-semibold ${currentTheme.text}`}>{team.name}</h3>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  {['admin', 'hr'].includes(user?.role) && (
                    <>
                      <button
                        onClick={() => handleTogglePin(team._id)}
                        className={`${
                          team.pinned ? 'text-yellow-500' : currentTheme.textSecondary
                        } hover:text-yellow-600 p-1 transition-colors`}
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
                  <span className={`font-medium ${currentTheme.text}`}>HR:</span>
                  <span className={`${currentTheme.textSecondary} ml-2`}>{team.hr_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className={`font-medium ${currentTheme.text}`}>Team Lead:</span>
                  <span className={`${currentTheme.textSecondary} ml-2`}>{team.lead_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className={`font-medium ${currentTheme.text}`}>Members:</span>
                  <span className={`${currentTheme.textSecondary} ml-2`}>{team.members?.length || 0}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className={`text-sm font-medium ${currentTheme.text} mb-2`}>Team Members</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <div
                        key={member._id}
                        className={`flex justify-between items-center ${currentTheme.surfaceSecondary} rounded p-2`}
                        data-testid="team-member"
                      >
                        <span className={`text-sm ${currentTheme.text}`}>{member.full_name}</span>
                        {['admin', 'hr'].includes(user?.role) && (
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
                    <p className={`text-sm ${currentTheme.textMuted}`}>No members yet</p>
                  )}
                </div>
              </div>

              {['admin', 'hr'].includes(user?.role) && (
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowAddMemberModal(true);
                  }}
                  className="w-full mt-4 btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2"
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
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-md w-full mx-4`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Create New Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`${currentTheme.textMuted} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
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
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
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
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
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
          <div className={`${currentTheme.surface} rounded-lg p-8 max-w-md w-full mx-4`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Add Member to {selectedTeam.name}</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className={`${currentTheme.textMuted} hover:${currentTheme.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
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

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="submit-add-member">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;