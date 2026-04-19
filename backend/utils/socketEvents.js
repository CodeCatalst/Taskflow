export const getWorkspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

export const emitWorkspaceEvent = (req, eventName, payload, workspaceId = null) => {
  const io = req.app.get('io');
  const resolvedWorkspaceId = workspaceId || req.context?.workspaceId;

  if (!io || !resolvedWorkspaceId) {
    return;
  }

  io.to(getWorkspaceRoom(resolvedWorkspaceId.toString())).emit(eventName, payload);
};

export const emitUserEvent = (req, userId, eventName, payload) => {
  const io = req.app.get('io');

  if (!io || !userId) {
    return;
  }

  io.to(userId.toString()).emit(eventName, payload);
};
