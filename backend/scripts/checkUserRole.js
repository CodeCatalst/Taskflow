import mongoose from 'mongoose';
import User from '../models/User.js';
import Team from '../models/Team.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUserRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    

    // Get all users with their roles
    const users = await User.find({}).select('full_name email role team_id').populate('team_id', 'name');

    if (users.length === 0) {
      
      
      process.exit(0);
    }

    
    
    
    // Count by role
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    
    Object.entries(roleCounts).forEach(([role, count]) => {
      const emoji = {
        admin: '👑',
        hr: '👔',
        team_lead: '👨‍💼',
        member: '👤'
      }[role] || '❓';
      
    });

    
    

    users.forEach((user, index) => {
      const emoji = {
        admin: '👑',
        hr: '👔',
        team_lead: '👨‍💼',
        member: '👤'
      }[user.role] || '❓';

      
      
      
      
      
    });

    
    
    
    // Check if there's at least one admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount === 0) {
      
      
    } else {
      
    }

    // Provide login suggestions
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0) {
      
      
      
      adminUsers.forEach(admin => {
        
        
        
      });
    }

    
    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
};

checkUserRole();
