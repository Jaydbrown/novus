// ==================== Generate Password Hash ====================
const bcrypt = require('bcrypt');

const password = 'jaiyeolaeva';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n=== Password Hash Generated ===\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL Insert Statement ===\n');
  console.log(`INSERT INTO admins (username, email, password, role, created_at)
VALUES (
  'jaiyeola',
  'jaiyeolawety705@gmail.com',
  '${hash}',
  'admin',
  CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password;`);
  console.log('\n');
  
  process.exit(0);
});
