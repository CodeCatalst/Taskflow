import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api';

async function reproduce() {
    try {
        console.log('1. Authenticating...');
        // Login to get token
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@demo.com',
                password: 'password123'
            });
            token = loginRes.data.accessToken;
            console.log('   Login successful.');
        } catch (e) {
            console.log('   Login failed. Trying registration backend might be fresh.');
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

        console.log('2. Creating a base task...');
        let taskId;
        try {
            const taskRes = await axios.post(`${API_URL}/tasks`, {
                title: 'Task to Update',
                description: 'Initial description',
                priority: 'medium',
                status: 'todo',
                due_date: new Date().toISOString(),
                // Valid creation (we fixed this)
                team_id: undefined
            }, { headers: { Authorization: `Bearer ${token}` } });
            taskId = taskRes.data.task._id;
            console.log('   Task created:', taskId);
        } catch (error) {
            console.error('   Failed to create base task:', error.response?.data || error.message);
            return;
        }

        console.log('3. Attempting UPDATE with empty team_id string...');
        try {
            // Simulate frontend sending empty string on update
            await axios.patch(`${API_URL}/tasks/${taskId}`, {
                title: 'Updated Title',
                team_id: '' // THIS MIGHT BREAK IT
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('   Task updated successfully (Unexpected if bug exists)');
        } catch (error) {
            console.log('   Task UPDATE failed (Expected if bug exists):');
            console.log('   Status:', error.response?.status);
            console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
        }

        console.log('4. Attempting DELETE...');
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            console.log('   Task deleted successfully');
        } catch (error) {
            console.log('   Task DELETE failed:');
            console.log('   Status:', error.response?.status);
            console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
        }

    } catch (err) {
        console.error('Reproduction script error:', err.message);
    }
}

reproduce();
