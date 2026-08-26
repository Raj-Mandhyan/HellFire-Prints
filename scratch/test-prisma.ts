import prisma from '../lib/prisma';

async function main() {
  console.log('Testing App Prisma Client connection...');
  try {
    const userCount = await prisma.user.count();
    console.log('Successfully connected! User count:', userCount);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
