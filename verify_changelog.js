import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@example.com';
const PASSWORD = 'password123';

async function verifyChangelog() {
    try {
        console.log('🔹 1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Logged in.');

        // 2. Create a Task
        console.log('🔹 2. Creating Task...');
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'Changelog Test Task',
            description: 'Initial Description',
            priority: 'medium',
            status: 'todo'
        }, config);
        const taskId = taskRes.data.task._id;
        console.log(`✅ Task Created: ${taskId}`);

        // 3. Update the Task (Change all monitored fields)
        console.log('🔹 3. Updating Task (Title, Status, Priority, Description)...');
        await axios.patch(`${API_URL}/tasks/${taskId}`, {
            title: 'Updated Task Title',
            description: 'Updated Description',
            status: 'in_progress',
            priority: 'high'
        }, config);
        console.log('✅ Task Updated.');

        // 4. Check Changelog
        console.log('🔹 4. Fetching Changelog...');
        // Wait briefly for async log write (though it is awaited in backend)
        await new Promise(r => setTimeout(r, 1000));

        // We need to be admin to fetch changelog. Assuming user is admin.
        const logRes = await axios.get(`${API_URL}/changelog?target_type=task&search=Updated Task Title`, config);
        const logs = logRes.data.logs;

        if (logs.length > 0) {
            const updateLog = logs[0];
            console.log('✅ Changelog Entry Found!');
            console.log('Event Type:', updateLog.event_type);
            console.log('Changes:', JSON.stringify(updateLog.changes, null, 2));

            // Verify fields
            const changes = updateLog.changes;
            if (
                changes.title && changes.title.old === 'Changelog Test Task' &&
                changes.status && changes.status.old === 'todo' && changes.status.new === 'in_progress' &&
                changes.priority && changes.priority.new === 'high' &&
                changes.description && changes.description.old === 'Initial Description'
            ) {
                console.log('✅ SUCCESS: All field changes recorded correctly.');
            } else {
                console.log('❌ FAILURE: Some field changes are missing or incorrect.');
            }
        } else {
            console.log('❌ FAILURE: No changelog entry found for this update.');
        }

        // Cleaning up
        // await axios.delete(`${API_URL}/tasks/${taskId}`, config);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

verifyChangelog();
