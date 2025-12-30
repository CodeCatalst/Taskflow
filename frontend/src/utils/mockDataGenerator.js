/**
 * Mock Data Generator for Screenshots
 * Generates realistic, visually appealing data for screenshot capture
 */

// User profiles with diverse names and roles
export const mockUsers = [
  { _id: '1', full_name: 'Sarah Chen', email: 'sarah.chen@taskflow.io', role: 'admin', avatar: '👩‍💼' },
  { _id: '2', full_name: 'Marcus Johnson', email: 'marcus.j@taskflow.io', role: 'hr', avatar: '👨‍💻' },
  { _id: '3', full_name: 'Emma Rodriguez', email: 'emma.r@taskflow.io', role: 'team_lead', avatar: '👩‍🎨' },
  { _id: '4', full_name: 'James Kim', email: 'james.kim@taskflow.io', role: 'member', avatar: '👨‍🔬' },
  { _id: '5', full_name: 'Olivia Patel', email: 'olivia.p@taskflow.io', role: 'member', avatar: '👩‍🚀' },
  { _id: '6', full_name: 'David Martinez', email: 'david.m@taskflow.io', role: 'team_lead', avatar: '👨‍🎓' },
  { _id: '7', full_name: 'Sophia Anderson', email: 'sophia.a@taskflow.io', role: 'member', avatar: '👩‍🔧' },
  { _id: '8', full_name: 'Michael Brown', email: 'michael.b@taskflow.io', role: 'member', avatar: '👨‍🎤' },
];

// Teams with realistic names
export const mockTeams = [
  {
    _id: 'team1',
    name: 'Product Engineering',
    description: 'Building the future of task management',
    lead_id: mockUsers[2],
    hr_id: mockUsers[1],
    members: [mockUsers[2], mockUsers[4], mockUsers[7]],
    priority: 1,
    pinned: true,
  },
  {
    _id: 'team2',
    name: 'Design & UX',
    description: 'Crafting delightful user experiences',
    lead_id: mockUsers[5],
    hr_id: mockUsers[1],
    members: [mockUsers[5], mockUsers[6]],
    priority: 2,
    pinned: false,
  },
  {
    _id: 'team3',
    name: 'Marketing & Growth',
    description: 'Accelerating our market presence',
    lead_id: mockUsers[3],
    hr_id: mockUsers[1],
    members: [mockUsers[3]],
    priority: 3,
    pinned: false,
  },
];

// Generate tasks with variety of statuses, priorities, and dates
export const generateMockTasks = () => {
  const now = new Date();
  const tasks = [
    {
      _id: 'task1',
      title: 'Implement real-time collaboration features',
      description: 'Add WebSocket support for live cursor tracking and presence indicators',
      status: 'in_progress',
      priority: 'high',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[4], mockUsers[7]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task2',
      title: 'Design mobile app navigation',
      description: 'Create intuitive bottom navigation for iOS and Android',
      status: 'todo',
      priority: 'urgent',
      created_by: mockUsers[2],
      assigned_to: [mockUsers[5], mockUsers[6]],
      team_id: mockTeams[1],
      due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task3',
      title: 'Optimize database queries',
      description: 'Reduce API response time by implementing proper indexing',
      status: 'done',
      priority: 'high',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[4]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task4',
      title: 'Launch Q1 marketing campaign',
      description: 'Coordinate social media, email, and content marketing initiatives',
      status: 'in_progress',
      priority: 'medium',
      created_by: mockUsers[1],
      assigned_to: [mockUsers[3]],
      team_id: mockTeams[2],
      due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task5',
      title: 'User research for dashboard redesign',
      description: 'Conduct interviews with 15 users to gather feedback',
      status: 'in_progress',
      priority: 'medium',
      created_by: mockUsers[2],
      assigned_to: [mockUsers[5]],
      team_id: mockTeams[1],
      due_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task6',
      title: 'Fix critical authentication bug',
      description: 'Session timeout causing unexpected logouts',
      status: 'done',
      priority: 'urgent',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[4], mockUsers[7]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task7',
      title: 'Write API documentation',
      description: 'Document all REST endpoints with examples',
      status: 'todo',
      priority: 'low',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[4]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task8',
      title: 'Prepare investor pitch deck',
      description: 'Update slides with latest metrics and product screenshots',
      status: 'in_review',
      priority: 'high',
      created_by: mockUsers[1],
      assigned_to: [mockUsers[3], mockUsers[5]],
      team_id: mockTeams[2],
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task9',
      title: 'Implement dark mode',
      description: 'Add theme toggle and persist user preference',
      status: 'done',
      priority: 'medium',
      created_by: mockUsers[2],
      assigned_to: [mockUsers[6]],
      team_id: mockTeams[1],
      due_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task10',
      title: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status: 'todo',
      priority: 'high',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[4]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task11',
      title: 'Create onboarding tutorial',
      description: 'Interactive walkthrough for new users',
      status: 'in_progress',
      priority: 'medium',
      created_by: mockUsers[2],
      assigned_to: [mockUsers[5], mockUsers[6]],
      team_id: mockTeams[1],
      due_date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task12',
      title: 'Email notification preferences',
      description: 'Allow users to customize notification frequency',
      status: 'todo',
      priority: 'low',
      created_by: mockUsers[0],
      assigned_to: [mockUsers[7]],
      team_id: mockTeams[0],
      due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return tasks;
};

// Generate notifications
export const generateMockNotifications = () => {
  const now = new Date();
  return [
    {
      _id: 'notif1',
      type: 'task_assigned',
      message: 'Sarah Chen assigned you to "Implement real-time collaboration features"',
      read: false,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      task_id: 'task1',
    },
    {
      _id: 'notif2',
      type: 'task_due_soon',
      message: 'Task "Design mobile app navigation" is due tomorrow',
      read: false,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      task_id: 'task2',
    },
    {
      _id: 'notif3',
      type: 'task_completed',
      message: 'Olivia Patel completed "Optimize database queries"',
      read: true,
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      task_id: 'task3',
    },
    {
      _id: 'notif4',
      type: 'comment',
      message: 'James Kim commented on "Launch Q1 marketing campaign"',
      read: true,
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      task_id: 'task4',
    },
  ];
};

// Generate comments for tasks
export const generateMockComments = () => {
  const now = new Date();
  return [
    {
      _id: 'comment1',
      task_id: 'task1',
      user_id: mockUsers[4],
      text: 'Working on the WebSocket integration. Should have a prototype ready by EOD.',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'comment2',
      task_id: 'task1',
      user_id: mockUsers[0],
      text: 'Great! Make sure to test with multiple concurrent connections.',
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'comment3',
      task_id: 'task2',
      user_id: mockUsers[5],
      text: 'Initial wireframes are ready for review. Focusing on thumb-friendly navigation.',
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'comment4',
      task_id: 'task4',
      user_id: mockUsers[3],
      text: 'Scheduled social media posts for the next 2 weeks. Email campaign draft is in progress.',
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

// Generate analytics data
export const generateMockAnalytics = () => {
  return {
    totalTasks: 12,
    completedTasks: 3,
    inProgressTasks: 5,
    overdueTasks: 1,
    statusDistribution: {
      todo: 3,
      in_progress: 5,
      in_review: 1,
      done: 3,
    },
    priorityDistribution: {
      low: 2,
      medium: 4,
      high: 4,
      urgent: 2,
    },
    teamDistribution: {
      'Product Engineering': 6,
      'Design & UX': 4,
      'Marketing & Growth': 2,
    },
    completionTrend: [
      { date: '2025-12-23', completed: 1 },
      { date: '2025-12-24', completed: 0 },
      { date: '2025-12-25', completed: 1 },
      { date: '2025-12-26', completed: 0 },
      { date: '2025-12-27', completed: 0 },
      { date: '2025-12-28', completed: 1 },
      { date: '2025-12-29', completed: 0 },
      { date: '2025-12-30', completed: 0 },
    ],
  };
};

// Export all mock data as a bundle
export const getMockDataBundle = () => ({
  users: mockUsers,
  teams: mockTeams,
  tasks: generateMockTasks(),
  notifications: generateMockNotifications(),
  comments: generateMockComments(),
  analytics: generateMockAnalytics(),
});

export default {
  mockUsers,
  mockTeams,
  generateMockTasks,
  generateMockNotifications,
  generateMockComments,
  generateMockAnalytics,
  getMockDataBundle,
};
