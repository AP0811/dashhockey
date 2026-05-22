import { db } from './src/lib/db.ts';

const users = await db.user.findMany({ 
  select: { username: true, email: true, passwordHash: true }
});

console.log(JSON.stringify(users, null, 2));
process.exit(0);
