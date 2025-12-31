import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function reproduce() {
    try {
        console.log('1. Creating a new "member" user...');
        const memberEmail = `member_${Date.now()}@test.com`;
        const password = 'password123';

        let token;
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                full_name: 'Member User',
                email: memberEmail,
                password: password
            });
            token = regRes.data.accessToken;
            console.log('   Member registered:', memberEmail);
        } catch (e) {
            console.error('   Registration failed:', e.message);
            return;
        }

        console.log('2. Creating a task as this member...');
        let taskId;
        try {
            const taskRes = await axios.post(`${API_URL}/tasks`, {
                title: 'My Task',
                description: 'Can I delete this?',
                priority: 'low',
                due_date: new Date().toISOString()
            }, { headers: { Authorization: `Bearer ${token}` } });
            taskId = taskRes.data.task._id;
            console.log('   Task created:', taskId);
        } catch (e) {
            console.error('   Task creation failed:', e.message);
            return;
        }

        console.log('3. Attempting DELETE as the creator (member)...');
        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('   SUCCESS: Task deleted!');
        } catch (error) {
            console.log('   FAILURE: Task DELETE failed.');
            console.log('   Status:', error.response?.status); // Expecting 403 if my hypothesis is correct
            console.log('   Message:', error.response?.data?.message);
        }

    } catch (err) {
        console.error('Script error:', err.message);
    }
}

reproduce();
