const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { supabase, db } = require('../config/supabase');
const { authenticateToken, generateToken } = require('../middleware/auth');

// POST /api/admin/login - Admin login
router.post('/login', [
  body('email').isEmail().withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin user
    const admin = await db.getOne('admin_users', { email });

    if (!admin) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Generate token
    const token = generateToken(admin);

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// GET /api/admin/me - Get current admin user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, name, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !admin) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

// POST /api/admin/register - Register new admin (protected - only existing admins can create)
router.post('/register', authenticateToken, [
  body('email').isEmail().withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다.'),
  body('name').trim().notEmpty().withMessage('이름을 입력해주세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if email already exists
    const existing = await db.getOne('admin_users', { email });
    if (existing) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin
    const result = await db.insert('admin_users', {
      email,
      password_hash: passwordHash,
      name
    });

    res.status(201).json({
      success: true,
      message: '관리자 계정이 생성되었습니다.',
      userId: result.id
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '관리자 등록 중 오류가 발생했습니다.' });
  }
});

// PUT /api/admin/password - Change password
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요.'),
  body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 6자 이상이어야 합니다.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current admin
    const admin = await db.getById('admin_users', req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.update('admin_users', req.user.id, {
      password_hash: newPasswordHash
    });

    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
});

// GET /api/admin/users - Get all admin users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(admins);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '관리자 목록 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
