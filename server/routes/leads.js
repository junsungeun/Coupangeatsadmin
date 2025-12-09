const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. (jpg, jpeg, png, pdf만 가능)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Validation rules
const consultValidation = [
  body('name').trim().notEmpty().withMessage('이름을 입력해주세요.'),
  body('store_name').trim().notEmpty().withMessage('매장명을 입력해주세요.'),
  body('phone').trim().notEmpty().withMessage('연락처를 입력해주세요.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('올바른 이메일 형식이 아닙니다.')
];

const directJoinValidation = [
  body('name').trim().notEmpty().withMessage('이름을 입력해주세요.'),
  body('store_name').trim().notEmpty().withMessage('매장명을 입력해주세요.'),
  body('phone').trim().notEmpty().withMessage('연락처를 입력해주세요.'),
  body('email').isEmail().withMessage('올바른 이메일 형식이 아닙니다.'),
  body('user_id').trim().notEmpty().withMessage('아이디를 입력해주세요.'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다.')
];

// POST /api/leads/consult - Submit consultation inquiry
router.post('/consult', consultValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, store_name, phone, email, store_link } = req.body;

    const result = await dbRun(
      `INSERT INTO leads (type, name, store_name, phone, email, store_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['consult', name, store_name, phone, email || null, store_link || null, '신규']
    );

    res.status(201).json({
      success: true,
      message: '문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
      leadId: result.lastID
    });
  } catch (error) {
    console.error('Consult submission error:', error);
    res.status(500).json({ error: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

// POST /api/leads/direct-join - Submit direct join application
router.post('/direct-join',
  upload.fields([
    { name: 'biz_registration', maxCount: 1 },
    { name: 'mailorder_cert', maxCount: 1 },
    { name: 'bank_copy', maxCount: 1 }
  ]),
  directJoinValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, store_name, phone, email, user_id, password } = req.body;
      const files = req.files;

      // Check required files
      if (!files.biz_registration || !files.mailorder_cert || !files.bank_copy) {
        return res.status(400).json({
          error: '필수 서류(사업자등록증, 통신판매신고증, 통장사본)를 모두 첨부해주세요.'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Get file URLs
      const bizRegUrl = `/uploads/${files.biz_registration[0].filename}`;
      const mailorderUrl = `/uploads/${files.mailorder_cert[0].filename}`;
      const bankCopyUrl = `/uploads/${files.bank_copy[0].filename}`;

      const result = await dbRun(
        `INSERT INTO leads (
          type, name, store_name, phone, email,
          biz_registration_url, mailorder_cert_url, bank_copy_url,
          user_id, password_hash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'direct_join', name, store_name, phone, email,
          bizRegUrl, mailorderUrl, bankCopyUrl,
          user_id, passwordHash, '신규'
        ]
      );

      res.status(201).json({
        success: true,
        message: '입점 신청이 접수되었습니다. 서류 검토 후 연락드리겠습니다.',
        leadId: result.lastID
      });
    } catch (error) {
      console.error('Direct join submission error:', error);
      res.status(500).json({ error: '입점 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
  }
);

// ===== Admin Routes (Protected) =====

// GET /api/leads/stats - Get lead statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [total, consults, directJoins, todayLeads, statusCounts] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM leads'),
      dbGet("SELECT COUNT(*) as count FROM leads WHERE type = 'consult'"),
      dbGet("SELECT COUNT(*) as count FROM leads WHERE type = 'direct_join'"),
      dbGet('SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = ?', [today]),
      dbAll('SELECT status, COUNT(*) as count FROM leads GROUP BY status')
    ]);

    res.json({
      total: total.count,
      consults: consults.count,
      directJoins: directJoins.count,
      today: todayLeads.count,
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

// GET /api/leads - Get all leads with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      type,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR store_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      sql += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    // Count total for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await dbGet(countSql, params);

    // Add sorting and pagination
    const allowedSortColumns = ['created_at', 'name', 'store_name', 'status', 'type'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortColumn} ${order}`;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const leads = await dbAll(sql, params);

    res.json({
      leads,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: '리드 목록 조회 중 오류가 발생했습니다.' });
  }
});

// GET /api/leads/recent - Get recent leads
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const leads = await dbAll(
      'SELECT id, type, name, store_name, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5'
    );
    res.json(leads);
  } catch (error) {
    console.error('Recent leads error:', error);
    res.status(500).json({ error: '최근 리드 조회 중 오류가 발생했습니다.' });
  }
});

// GET /api/leads/export - Export leads as CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { type, status, search, startDate, endDate } = req.query;

    let sql = 'SELECT id, type, name, store_name, phone, email, store_link, status, business_type, created_at FROM leads WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR store_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      sql += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';

    const leads = await dbAll(sql, params);

    // Generate CSV
    const headers = ['ID', '타입', '이름', '매장명', '연락처', '이메일', '매장링크', '상태', '업종', '생성일'];
    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
      const row = [
        lead.id,
        lead.type === 'consult' ? '문의' : '바로입점',
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.store_name || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.store_link || '').replace(/"/g, '""')}"`,
        lead.status,
        lead.business_type || '',
        lead.created_at
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // Add BOM for Excel compatibility
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'CSV 내보내기 중 오류가 발생했습니다.' });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [req.params.id]);

    if (!lead) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    // Don't send password_hash to client
    delete lead.password_hash;

    // Get activity logs
    const logs = await dbAll(
      `SELECT al.*, au.name as admin_name
       FROM activity_logs al
       LEFT JOIN admin_users au ON al.admin_id = au.id
       WHERE al.lead_id = ?
       ORDER BY al.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...lead, activityLogs: logs });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: '리드 조회 중 오류가 발생했습니다.' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, business_type, memo } = req.body;
    const leadId = req.params.id;

    // Get current lead
    const currentLead = await dbGet('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!currentLead) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    // Update lead
    await dbRun(
      `UPDATE leads SET status = ?, business_type = ?, memo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status || currentLead.status, business_type || currentLead.business_type, memo, leadId]
    );

    // Log status change
    if (status && status !== currentLead.status) {
      await dbRun(
        `INSERT INTO activity_logs (lead_id, admin_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
        [leadId, req.user.id, 'status_change', currentLead.status, status]
      );
    }

    // Log memo update
    if (memo !== undefined && memo !== currentLead.memo) {
      await dbRun(
        `INSERT INTO activity_logs (lead_id, admin_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
        [leadId, req.user.id, 'memo_update', currentLead.memo || '', memo || '']
      );
    }

    const updatedLead = await dbGet('SELECT * FROM leads WHERE id = ?', [leadId]);
    delete updatedLead.password_hash;

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: '리드 수정 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM leads WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '리드가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: '리드 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
