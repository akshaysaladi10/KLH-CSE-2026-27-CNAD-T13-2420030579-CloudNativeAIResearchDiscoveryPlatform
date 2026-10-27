const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../../../shared/auth');

describe('Auth Service & Security Suite', () => {
  const JWT_SECRET = 'test-secret-key-12345';
  process.env.JWT_SECRET = JWT_SECRET;

  describe('JWT Token Generation & Verification Middleware', () => {
    it('should successfully verify a valid JWT token', (done) => {
      const payload = { id: 'user_123', email: 'researcher@test.edu', role: 'researcher' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeUndefined();
          expect(req.user).toBeDefined();
          expect(req.user.id).toBe('user_123');
          expect(req.user.email).toBe('researcher@test.edu');
          done();
        } catch (e) {
          done(e);
        }
      };

      verifyToken(req, res, next);
    });

    it('should reject request when no authorization header is provided', (done) => {
      const req = { headers: {} };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
          expect(err.message).toMatch(/No token provided/i);
          done();
        } catch (e) {
          done(e);
        }
      };

      verifyToken(req, res, next);
    });

    it('should reject malformed or invalid JWT token', (done) => {
      const req = { headers: { authorization: 'Bearer completely_invalid_jwt_signature' } };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
          expect(err.message).toMatch(/Invalid token/i);
          done();
        } catch (e) {
          done(e);
        }
      };

      verifyToken(req, res, next);
    });

    it('should reject expired JWT token', (done) => {
      const payload = {
        id: 'user_123',
        email: 'expired@test.edu',
        exp: Math.floor(Date.now() / 1000) - 10, // Expired 10 seconds ago
      };
      const token = jwt.sign(payload, JWT_SECRET);

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
          expect(err.message).toMatch(/expired/i);
          done();
        } catch (e) {
          done(e);
        }
      };

      verifyToken(req, res, next);
    });
  });

  describe('Role-Based Access Control Middleware', () => {
    it('should allow user with required role', (done) => {
      const req = { user: { id: 'u1', role: 'admin' } };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeUndefined();
          done();
        } catch (e) {
          done(e);
        }
      };

      requireRole('admin', 'superadmin')(req, res, next);
    });

    it('should deny user with insufficient role', (done) => {
      const req = { user: { id: 'u1', role: 'student' } };
      const res = {};
      const next = (err) => {
        try {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
          expect(err.message).toMatch(/Insufficient permissions/i);
          done();
        } catch (e) {
          done(e);
        }
      };

      requireRole('admin')(req, res, next);
    });
  });

  describe('Password Hashing Verification', () => {
    it('should securely hash password with bcrypt and verify match', async () => {
      const plainPassword = 'SecurePassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      expect(hash).not.toBe(plainPassword);
      const isMatch = await bcrypt.compare(plainPassword, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare('WrongPassword456!', hash);
      expect(isWrongMatch).toBe(false);
    });
  });
});
