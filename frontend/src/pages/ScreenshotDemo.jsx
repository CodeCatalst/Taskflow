import React, { useState, useEffect } from 'react';
import { Camera, Download, Eye, EyeOff, Info } from 'lucide-react';
import { getMockDataBundle } from '../utils/mockDataGenerator';

/**
 * Screenshot Demo Page
 * 
 * This page helps you capture high-quality screenshots with mock data
 * for marketing materials, documentation, and the landing page.
 * 
 * Instructions:
 * 1. Select a view type from the dropdown
 * 2. Toggle "Hide UI Controls" to remove screenshot helpers
 * 3. Use browser's screenshot tool or F12 DevTools
 * 4. For full-page screenshots, use browser extensions like:
 *    - GoFullPage (Chrome)
 *    - Awesome Screenshot
 *    - Firefox's built-in screenshot tool (Shift+F2, then "screenshot --fullpage")
 */
const ScreenshotDemo = () => {
  const [viewType, setViewType] = useState('dashboard');
  const [hideControls, setHideControls] = useState(false);
  const [mockData, setMockData] = useState(null);

  useEffect(() => {
    // Load mock data
    const data = getMockDataBundle();
    setMockData(data);
  }, []);

  if (!mockData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading mock data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20">
      {/* Control Panel - Hidden when capturing */}
      {!hideControls && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-2xl max-w-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Screenshot Helper</h3>
          </div>

          <div className="space-y-3">
            {/* View Type Selector */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">View Type</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dashboard">📊 Dashboard</option>
                <option value="kanban">📋 Kanban Board</option>
                <option value="tasks">✓ Task List</option>
                <option value="analytics">📈 Analytics</option>
                <option value="calendar">📅 Calendar</option>
                <option value="teams">👥 Teams</option>
              </select>
            </div>

            {/* Hide Controls Toggle */}
            <button
              onClick={() => setHideControls(true)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <EyeOff className="w-4 h-4" />
              <span>Hide Controls (Take Screenshot)</span>
            </button>

            {/* Instructions */}
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-start space-x-2 text-xs text-slate-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-2">To capture:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Chrome: Use GoFullPage extension</li>
                    <li>Firefox: Shift+F2, type "screenshot"</li>
                    <li>DevTools: Cmd/Ctrl+Shift+P → "Capture screenshot"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Controls Button (when hidden) */}
      {hideControls && (
        <button
          onClick={() => setHideControls(false)}
          className="fixed top-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl transition-colors"
          title="Show controls"
        >
          <Eye className="w-5 h-5" />
        </button>
      )}

      {/* Demo Content Area */}
      <div className="container mx-auto px-6 py-8">
        {viewType === 'dashboard' && <DashboardDemo data={mockData} />}
        {viewType === 'kanban' && <KanbanDemo data={mockData} />}
        {viewType === 'tasks' && <TasksDemo data={mockData} />}
        {viewType === 'analytics' && <AnalyticsDemo data={mockData} />}
        {viewType === 'calendar' && <CalendarDemo data={mockData} />}
        {viewType === 'teams' && <TeamsDemo data={mockData} />}
      </div>
    </div>
  );
};

// Demo Components with Mock Data

const DashboardDemo = ({ data }) => {
  const statusCounts = {
    todo: data.tasks.filter(t => t.status === 'todo').length,
    in_progress: data.tasks.filter(t => t.status === 'in_progress').length,
    done: data.tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {data.users[0].full_name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-white">{data.tasks.length}</div>
          <div className="text-xs text-green-400 mt-1">↑ 12% from last week</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-1">In Progress</div>
          <div className="text-3xl font-bold text-blue-400">{statusCounts.in_progress}</div>
          <div className="text-xs text-slate-500 mt-1">{data.users.length} team members</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-400">{statusCounts.done}</div>
          <div className="text-xs text-green-400 mt-1">↑ 25% completion rate</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="text-sm text-slate-400 mb-1">Teams</div>
          <div className="text-3xl font-bold text-purple-400">{data.teams.length}</div>
          <div className="text-xs text-slate-500 mt-1">Active workspaces</div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {data.tasks.slice(0, 5).map(task => (
            <div key={task._id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">{task.title}</h3>
                <div className="flex items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-slate-500">{task.team_id.name}</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                {task.assigned_to.slice(0, 3).map((user, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-900">
                    {user.full_name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KanbanDemo = ({ data }) => {
  const columns = [
    { id: 'todo', title: 'To Do', color: 'slate' },
    { id: 'in_progress', title: 'In Progress', color: 'blue' },
    { id: 'in_review', title: 'In Review', color: 'yellow' },
    { id: 'done', title: 'Done', color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Kanban Board</h1>
      
      <div className="grid grid-cols-4 gap-4">
        {columns.map(column => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-white font-semibold">{column.title}</h3>
              <span className="text-sm text-slate-400">
                {data.tasks.filter(t => t.status === column.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {data.tasks.filter(t => t.status === column.id).map(task => (
                <div key={task._id} className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors cursor-pointer">
                  <h4 className="text-white font-medium mb-2">{task.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                    <div className="flex -space-x-1">
                      {task.assigned_to.slice(0, 2).map((user, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs border-2 border-slate-900">
                          {user.full_name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TasksDemo = ({ data }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-white">Tasks</h1>
    <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Team</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Assigned</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.tasks.map(task => (
            <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4 text-white font-medium">{task.title}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-300">{task.team_id.name}</td>
              <td className="px-6 py-4">
                <div className="flex -space-x-1">
                  {task.assigned_to.slice(0, 2).map((user, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs border-2 border-slate-900">
                      {user.full_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AnalyticsDemo = ({ data }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-white">Analytics</h1>
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Status Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.analytics.statusDistribution).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" 
                  style={{ width: `${(count / data.tasks.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Priority Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.analytics.priorityDistribution).map(([priority, count]) => (
            <div key={priority}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400 capitalize">{priority}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    priority === 'urgent' ? 'bg-red-500' :
                    priority === 'high' ? 'bg-orange-500' :
                    priority === 'medium' ? 'bg-yellow-500' :
                    'bg-slate-500'
                  }`}
                  style={{ width: `${(count / data.tasks.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CalendarDemo = ({ data }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-white">Calendar</h1>
    <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-slate-400 text-sm font-medium py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-800/30 rounded-lg p-2 hover:bg-slate-800/50 transition-colors">
            <div className="text-slate-300 text-sm">{i + 1}</div>
            {i % 5 === 0 && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TeamsDemo = ({ data }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-white">Teams</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.teams.map(team => (
        <div key={team._id} className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-2">{team.name}</h3>
          <p className="text-slate-400 text-sm mb-4">{team.description}</p>
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Team Lead</div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm">
                {team.lead_id.full_name.charAt(0)}
              </div>
              <span className="text-white text-sm">{team.lead_id.full_name}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-2">{team.members.length} Members</div>
            <div className="flex -space-x-2">
              {team.members.map((member, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs border-2 border-slate-900">
                  {member.full_name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ScreenshotDemo;
