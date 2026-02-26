
// Get users of a specific workspace (System Admin only)
router.get('/:id/users', requireSystemAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const users = await User.find({ workspaceId: workspace._id })
      .select('-password_hash')
      .populate('team_id', 'name')
      .sort({ created_at: -1 });

    res.json({ 
      workspace: {
        id: workspace._id,
        name: workspace.name,
        type: workspace.type
      },
      users,
      count: users.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get tasks of a specific workspace (System Admin only)
router.get('/:id/tasks', requireSystemAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const tasks = await Task.find({ workspaceId: workspace._id })
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name')
      .sort({ created_at: -1 })
      .limit(100);

    res.json({ 
      workspace: {
        id: workspace._id,
        name: workspace.name,
        type: workspace.type
      },
      tasks,
      count: tasks.length,
      total: await Task.countDocuments({ workspaceId: workspace._id })
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get teams of a specific workspace (System Admin only)
router.get('/:id/teams', requireSystemAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const teams = await Team.find({ workspaceId: workspace._id })
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role')
      .sort({ created_at: -1 });

    res.json({ 
      workspace: {
        id: workspace._id,
        name: workspace.name,
        type: workspace.type
      },
      teams,
      count: teams.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

export default router;
