import bcrypt from 'bcryptjs';
import { db } from './src/lib/db.ts';

const user = await db.user.findUnique({ where: { username: 'admin' } });
console.log('User:', user?.username);

if (user) {
  const pwd1 = await bcrypt.compare('admin2026', user.passwordHash);
  const pwd2 = await bcrypt.compare('ChangeMe_Admin_2026!', user.passwordHash);
  console.log('admin2026 matches:', pwd1);
  console.log('ChangeMe_Admin_2026! matches:', pwd2);
}

process.exit(0);
