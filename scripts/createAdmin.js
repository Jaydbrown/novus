// ==================== scripts/createAdmin.js ====================
const Admin = require('../models/Admin');

(async () => {
  try {
    console.log('\n=== Create Admin Account ===\n');
    
    // Your credentials
    const username = 'jaiyeola';
    const email = 'jaiyeolawety705@gmail.com';
    const password = 'jaiyeolaeva';
    
    console.log('Creating admin with:');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log('Password: ********\n');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin) {
      console.log('⚠️  Admin already exists! Updating password...\n');
      
      // Update existing admin
      await Admin.updatePassword(existingAdmin.id, password);
      console.log('✓ Admin password updated successfully!');
      console.log(`Username: ${username}`);
      console.log(`Email: ${email}`);
      console.log(`ID: ${existingAdmin.id}\n`);
    } else {
      // Create new admin (password will be hashed by the model)
      const admin = await Admin.create({ username, email, password });
      
      console.log('✓ Admin account created successfully!');
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
      console.log(`ID: ${admin.id}\n`);
    }
    
    console.log('You can now login with:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to create admin account:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
})();
