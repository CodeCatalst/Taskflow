/**
 * Test Script: Multi-Workspace Login
 * 
 * This script helps create test users with multiple workspaces
 * Run: node backend/scripts/create-multi-workspace-test-user.js
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createMultiWorkspaceTestUser() {
  try {
    console.log('🧪 Creating multi-workspace test user...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create or find test workspaces
    let workspace1 = await Workspace.findOne({ name: 'Engineering CORE' });
    if (!workspace1) {
      workspace1 = new Workspace({
        name: 'Engineering CORE',
        type: 'CORE',
        isActive: true,
        settings: {
          enableEmailNotifications: true,
          features: {
            bulkUserImport: true,
            auditLogs: true,
            advancedAutomation: true
          }
        }
      });
      await workspace1.save();
      console.log('✅ Created workspace: Engineering CORE');
    }

    let workspace2 = await Workspace.findOne({ name: 'Marketing Hub' });
    if (!workspace2) {
      workspace2 = new Workspace({
        name: 'Marketing Hub',
        type: 'COMMUNITY',
        isActive: true,
        settings: {
          enableEmailNotifications: true
        },
        limits: {
          maxUsers: 50,
          maxTasks: 500,
          maxTeams: 10
        }
      });
      await workspace2.save();
      console.log('✅ Created workspace: Marketing Hub');
    }

    let workspace3 = await Workspace.findOne({ name: 'Design Studio' });
    if (!workspace3) {
      workspace3 = new Workspace({
        name: 'Design Studio',
        type: 'CORE',
        isActive: true,
        settings: {
          enableEmailNotifications: true,
          features: {
            bulkUserImport: true,
            auditLogs: true,
            advancedAutomation: true
          }
        }
      });
      await workspace3.save();
      console.log('✅ Created workspace: Design Studio');
    }

    // Create test user email
    const testEmail = 'multiworkspace.test@taskflow.com';

    // Check if test user already exists
    let testUser = await User.findOne({ email: testEmail });

    if (testUser) {
      console.log('\n⚠️  Test user already exists. Updating workspaces...');
      
      // Update workspaces array
      testUser.workspaces = [
        {
          workspaceId: workspace1._id,
          role: 'admin',
          joinedAt: new Date(),
          isActive: true
        },
        {
          workspaceId: workspace2._id,
          role: 'hr',
          joinedAt: new Date(),
          isActive: true
        },
        {
          workspaceId: workspace3._id,
          role: 'member',
          joinedAt: new Date(),
          isActive: true
        }
      ];
      testUser.currentWorkspaceId = workspace1._id;
      testUser.workspaceId = workspace1._id;

      await testUser.save();
      console.log('✅ Updated existing test user with multiple workspaces');
    } else {
      // Create new test user
      testUser = new User({
        full_name: 'Multi Workspace Tester',
        email: testEmail,
        password_hash: 'Test@123', // Will be hashed by pre-save hook
        role: 'admin',
        workspaces: [
          {
            workspaceId: workspace1._id,
            role: 'admin',
            joinedAt: new Date(),
            isActive: true
          },
          {
            workspaceId: workspace2._id,
            role: 'hr',
            joinedAt: new Date(),
            isActive: true
          },
          {
            workspaceId: workspace3._id,
            role: 'member',
            joinedAt: new Date(),
            isActive: true
          }
        ],
        currentWorkspaceId: workspace1._id,
        workspaceId: workspace1._id,
        isEmailVerified: true
      });

      await testUser.save();
      console.log('✅ Created new test user with multiple workspaces');
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST USER CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('Email:    ', testEmail);
    console.log('Password: ', 'Test@123');
    console.log('\nWorkspaces:');
    console.log('1. Engineering CORE (CORE) - Role: admin');
    console.log('2. Marketing Hub (COMMUNITY) - Role: hr');
    console.log('3. Design Studio (CORE) - Role: member');
    console.log('='.repeat(60));
    console.log('\n📝 Login with these credentials to test multi-workspace selection!');
    console.log('   You should see a workspace selection screen after login.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run script
createMultiWorkspaceTestUser();
