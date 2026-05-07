import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.full_name}!</p>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Tasks</h3>
          <p>View and manage your tasks</p>
        </div>
        <div className="card">
          <h3>Teams</h3>
          <p>Collaborate with your team</p>
        </div>
        <div className="card">
          <h3>Calendar</h3>
          <p>View your schedule</p>
        </div>
        <div className="card">
          <h3>Analytics</h3>
          <p>View performance metrics</p>
        </div>
      </div>
    </div>
  );
}
