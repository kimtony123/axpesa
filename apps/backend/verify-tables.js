const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres.ekhsfnqethzavutooenz:Akimani187@20@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres' } } });

async function verify() {
  try {
    await p.$connect();
    console.log('✅ Connected to Supabase!');
    
    const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📦 Tables in database:');
    tables.forEach(t => console.log('  -', t.table_name));
    
    await p.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await p.$disconnect();
    process.exit(1);
  }
}

verify();