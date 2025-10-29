// ==================== scripts/createAdmin.js ====================
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  try {
    console.log('\n=== Create Admin Account ===\n');
    
    // Interactive with default values
    const username = await question('Enter username [jaiyeola]: ') || 'jaiyeola';
    const email = await question('Enter email [jaiyeolawety705@gmail.com]: ') || 'jaiyeolawety705@gmail.com';
    const password = await question('Enter password [jaiyeolaeva]: ') || 'jaiyeolaeva';
    
    console.log('Creating admin with:');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log('Password: ********\n');
    
    const admin = await Admin.create({ username, email, password });
    
    console.log('\n✓ Admin account created successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`ID: ${admin.id}\n`);
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to create admin account:', error.message);
    rl.close();
    process.exit(1);
  }
})();
