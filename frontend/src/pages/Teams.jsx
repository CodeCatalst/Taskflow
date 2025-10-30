import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { Plus, X, Users, UserPlus, UserMinus } from 'lucide-react';

const Teams = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!['admin', 'hr', 'team_lead'].includes(user?.role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-xl text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="teams-page">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-2">Manage your teams and members</p>
          </div>
          {['admin', 'hr'].includes(user?.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center space-x-2"
              data-testid="create-team-btn"
            >
              <Plus className="w-5 h-5" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="team-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                <Users className="w-6 h-6 text-blue-600" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">HR:</span>
                  <span className="text-gray-600 ml-2">{team.hr_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Team Lead:</span>
                  <span className="text-gray-600 ml-2">{team.lead_id?.full_name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Members:</span>
                  <span className="text-gray-600 ml-2">{team.members?.length || 0}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex justify-between items-center bg-gray-50 rounded p-2"
                        data-testid="team-member"
                      >
                        <span className="text-sm">{member.full_name}</span>
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
                    <p className="text-sm text-gray-500">No members yet</p>
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

        {teams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No teams yet. Create your first team!</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-team-modal">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Member to {selectedTeam.name}</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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