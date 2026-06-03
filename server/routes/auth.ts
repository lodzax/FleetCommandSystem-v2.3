import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'Suspended') {
      res.status(403).json({ error: 'Account has been suspended' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { password: _, ...safeUser } = user;
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({ success: true, user: safeUser, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify-password', async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      res.status(400).json({ error: 'userId and password are required' });
      return;
    }

    const [rows]: any[] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      res.json({ valid: false });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    res.json({ valid });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    const userRole = role || 'Driver';

    const [existing]: any[] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `usr-${Date.now()}`;
    const memberSince = new Date().toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    await pool.query(
      `INSERT INTO users (id, name, email, role, status, memberSince, password) VALUES (?,?,?,?,?,?,?)`,
      [id, name, email, userRole, 'Pending', memberSince, hashedPassword]
    );

    res.json({ success: true, message: 'Registration submitted. Pending admin approval.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
