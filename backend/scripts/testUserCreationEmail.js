// Quick test script to create a user and trigger email
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendCredentialEmail } from '../utils/emailService.js';

dotenv.config();

const testUserCreationEmail = async () => {
  
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    

    // Test data
    const testUser = {
      full_name: 'Test User Creation',
      email: process.env.EMAIL_USER, // Send to yourself
      password: 'TestPassword123!'
    };

    
    
    
    
    

    // Try to send email
    
    const emailResult = await sendCredentialEmail(
      testUser.full_name,
      testUser.email,
      testUser.password
    );

    
    if (emailResult.success) {
      
      
      
      
    } else {
      
      
      
      
      
      
      
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    
    
    process.exit(1);
  }
};

testUserCreationEmail();
