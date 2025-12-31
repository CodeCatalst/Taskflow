import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api';
// You might need to adjust these credentials or use an existing token if available
const TEST_USER = {
  email: 'test@example.com', // Replace with a valid user email if needed
  password: 'password123'
};

async function reproduce() {
  try {
    console.log('1. Authenticating...');
    // Login to get token
    // Note: If you don't have this user, you might need to register one or use an existing one
    // For reproduction, we assume we can login or we'll mock the token if we can't easily login via script without env setup
    
    // Attempting login
    let token;
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@demo.com', // Trying a likely default admin
            password: 'password123'
        });
        token = loginRes.data.accessToken;
        console.log('   Login successful.');
    } catch (e) {
        console.log('   Login failed with default admin. skipping to manual token or failing.');
        // If login fails, we might need to manually set a token or register. 
        // For now, let's try to register a temp user if login fails
        try {
             const regRes = await axios.post(`${API_URL}/auth/register`, {
                full_name: 'Reproduction User',
                email: `repro_${Date.now()}@test.com`,
                password: 'password123'
             });
             token = regRes.data.accessToken;
             console.log('   Registration successful.');
        } catch (regErr) {
            console.error('   Registration failed:', regErr.response?.data || regErr.message);
            return;
        }
    }

    console.log('2. Attempting to create task with empty team_id string...');
    
    const taskData = {
      title: 'Reproduction Task',
      description: 'Testing empty team_id',
      priority: 'medium',
      status: 'todo',
      due_date: new Date().toISOString(),
      team_id: '', // THIS IS THE CULPRIT
      assigned_to: []
    };

    try {
      const res = await axios.post(`${API_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   Task created successfully (Unexpected if bug exists):', res.data);
    } catch (error) {
      console.log('   Task creation failed (Expected if bug exists):');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (err) {
    console.error('Reproduction script error:', err.message);
  }
}

reproduce();
