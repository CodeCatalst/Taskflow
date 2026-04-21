import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import {
  Mail, Plus, Calendar, Users, Clock, MoreVertical,
  Play, Pause, Trash2, Edit, Eye, Search, Filter,
  CheckCircle, XCircle, AlertCircle, Send
} from 'lucide-react';

export default function ScheduledCampaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { currentTheme } = useTheme();
  const confirmModal = useConfirmModal();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [currentWorkspace, currentPage, statusFilter, searchQuery]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await api.get(`/api/hr/scheduled-campaigns?${params}`);
      setCampaigns(response.data.campaigns || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/hr/scheduled-campaigns/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCancelCampaign = async (campaignId, title) => {
    const confirmed = await confirmModal.show({
      title: 'Cancel Campaign',
      message: `Are you sure you want to cancel "${title}"? This action cannot be undone.`,
      confirmText: 'Cancel Campaign',
      cancelText: 'Keep Scheduled',
      variant: 'warning'
    });

    if (confirmed) {
      try {
        await api.post(`/api/hr/scheduled-campaigns/${campaignId}/cancel`);
        fetchCampaigns();
        fetchStats();
      } catch (error) {
        alert('Failed to cancel campaign');
      }
    }
  };

  const handleDeleteCampaign = async (campaignId, title) => {
    const confirmed = await confirmModal.show({
      title: 'Delete Campaign',
      message: `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/api/hr/scheduled-campaigns/${campaignId}`);
        fetchCampaigns();
        fetchStats();
      } catch (error) {
        alert('Failed to delete campaign');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'sent': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <ResponsivePageLayout title="Scheduled Campaigns" subtitle="Manage automated email campaigns">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className={currentTheme.textSecondary}>Loading campaigns...</p>
          </div>
        </div>
      </ResponsivePageLayout>
    );
  }

  return (
    <ResponsivePageLayout
      title="Scheduled Campaigns"
      subtitle="Create and manage automated email campaigns"
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600">{stats.total}</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Total Campaigns</p>
                </div>
              </div>
            </div>

            <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-yellow-600">{stats.scheduled}</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Scheduled</p>
                </div>
              </div>
            </div>

            <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-green-600">{stats.sent}</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Sent</p>
                </div>
              </div>
            </div>

            <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-600">{stats.totalRecipients}</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Total Recipients</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="processing">Processing</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/create-campaign')}
              className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className={`w-16 h-16 mx-auto mb-4 ${currentTheme.textSecondary}`} />
              <h3 className={`text-lg font-bold ${currentTheme.text} mb-2`}>No campaigns found</h3>
              <p className={`text-sm ${currentTheme.textSecondary} mb-6`}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first automated email campaign'}
              </p>
              <button
                onClick={() => navigate('/create-campaign')}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${currentTheme.border}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textSecondary}`}>
                        Campaign
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textSecondary}`}>
                        Recipients
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textSecondary}`}>
                        Schedule
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textSecondary}`}>
                        Status
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${currentTheme.textSecondary}`}>
                        Results
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {campaigns.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className={`font-bold ${currentTheme.text} mb-1`}>{campaign.title}</div>
                            <div className={`text-sm ${currentTheme.textSecondary} truncate max-w-xs`}>
                              {campaign.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created {new Date(campaign.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{campaign.totalRecipients}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{formatDateTime(campaign.scheduledDate)}</div>
                            <div className={`text-xs ${currentTheme.textSecondary}`}>
                              {campaign.scheduleType === 'recurring' ? 'Recurring' : 'One-time'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {campaign.sentAt ? (
                              <div>
                                <div className="text-green-600 font-medium">{campaign.sentCount} sent</div>
                                {campaign.failedCount > 0 && (
                                  <div className="text-red-600 text-xs">{campaign.failedCount} failed</div>
                                )}
                              </div>
                            ) : (
                              <span className={currentTheme.textSecondary}>Not sent yet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {campaign.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handleCancelCampaign(campaign._id, campaign.title)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Cancel campaign"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/edit-campaign/${campaign._id}`)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                  title="Edit campaign"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(campaign.status === 'scheduled' || campaign.status === 'cancelled' || campaign.status === 'failed') && (
                              <button
                                onClick={() => handleDeleteCampaign(campaign._id, campaign.title)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Delete campaign"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal {...confirmModal.config} />
    </ResponsivePageLayout>
  );
}