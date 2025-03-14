require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { ROLES } = require('./config/roles');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to the database
mongoose
  .connect(process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
    
    if (existingSuperAdmin) {
      console.log('\nA Super Admin already exists in the database:');
      console.log(`Name: ${existingSuperAdmin.name}`);
      console.log(`Email: ${existingSuperAdmin.email}`);
      
      const recreate = await askQuestion('\nDo you want to create another Super Admin? (y/n): ');
      
      if (recreate.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    // Get Super Admin details
    console.log('\nCreate new Super Admin:');
    const name = await askQuestion('Name: ');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Password (min 6 characters): ');
    
    if (password.length < 6) {
      console.log('Password must be at least 6 characters long.');
      return;
    }
    
    // Create the Super Admin
    const superAdmin = await User.create({
      name,
      email,
      password,
      role: ROLES.SUPER_ADMIN,
      points: 9999,
      isActive: true
    });
    
    console.log('\nSuper Admin created successfully:');
    console.log(`Name: ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('\nYou can now log in with these credentials.');
    
  } catch (error) {
    console.error('Error creating Super Admin:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
};

createSuperAdmin();
