const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.ittjtscnoqnqovnayvtg:Li%232q4ui%25d9ati39_o%21n@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Prisma 6543 (correct routing) Connected');
    await prisma.$disconnect();
  } catch(e) {
    console.error('Prisma Error:', e.message);
    process.exit(1);
  }
}
main();
