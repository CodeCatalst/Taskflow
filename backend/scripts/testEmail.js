import { sendCredentialEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const testCredentialEmail = async () => {
  
  
  
  
  
  
  
  
  

  // Test data
  const testUser = {
    fullName: 'Test User',
    email: process.env.EMAIL_USER, // Send to yourself for testing
    password: 'TestPassword123'
  };

  
  

  try {
    const result = await sendCredentialEmail(
      testUser.fullName,
      testUser.email,
      testUser.password
    );

    if (result.success) {
      
      
      
      
      
      
      
      
      
      
      
      
    } else {
      
      
      
      
      
      
      
      
    }
  } catch (error) {
    
  }

  process.exit(0);
};

// Run the test
testCredentialEmail();
