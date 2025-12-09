const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const { initDatabase, dbRun, dbGet } = require('../config/database');

const seedAdmin = async () => {
  try {
    await initDatabase();

    // Check if admin already exists
    const existingAdmin = await dbGet('SELECT id FROM admin_users WHERE email = ?', ['admin@coupangeats.com']);

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create default admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await dbRun(
      'INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
      ['admin@coupangeats.com', passwordHash, '관리자']
    );

    console.log('Default admin created:');
    console.log('  Email: admin@coupangeats.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Please change the password after first login!');

    // Create some sample leads for testing
    const sampleLeads = [
      {
        type: 'consult',
        name: '김철수',
        store_name: '행복한 꽃집',
        phone: '010-1234-5678',
        email: 'flower@example.com',
        store_link: 'https://instagram.com/happyflower',
        status: '신규'
      },
      {
        type: 'consult',
        name: '이영희',
        store_name: '맛있는 케이크',
        phone: '010-2345-6789',
        email: 'cake@example.com',
        status: '연락완료'
      },
      {
        type: 'direct_join',
        name: '박민수',
        store_name: '정성 반찬',
        phone: '010-3456-7890',
        email: 'banchan@example.com',
        status: '상담중',
        business_type: '반찬'
      }
    ];

    for (const lead of sampleLeads) {
      await dbRun(
        `INSERT INTO leads (type, name, store_name, phone, email, store_link, status, business_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lead.type, lead.name, lead.store_name, lead.phone, lead.email, lead.store_link || null, lead.status, lead.business_type || null]
      );
    }

    console.log('Sample leads created');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
