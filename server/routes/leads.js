const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { supabase, db } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads (memory storage for Vercel serverless)
const storage = multer.memoryStorage();

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

    const result = await db.insert('leads', {
      type: 'consult',
      name,
      store_name,
      phone,
      email: email || null,
      store_link: store_link || null,
      status: '신규'
    });

    res.status(201).json({
      success: true,
      message: '문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
      leadId: result.id
    });
  } catch (error) {
    console.error('Consult submission error:', error);
    res.status(500).json({
      error: '문의 접수 중 오류가 발생했습니다.',
      details: error.message,
      code: error.code
    });
  }
});

// POST /api/leads/direct-join - Submit direct join application (receives file URLs from frontend)
router.post('/direct-join', directJoinValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, store_name, phone, email, user_id, password,
      biz_registration_url, mailorder_cert_url, bank_copy_url
    } = req.body;

    // Check required file URL - only biz_registration is required
    if (!biz_registration_url) {
      return res.status(400).json({
        error: '사업자등록증을 첨부해주세요.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.insert('leads', {
      type: 'direct_join',
      name,
      store_name,
      phone,
      email,
      biz_registration_url,
      mailorder_cert_url: mailorder_cert_url || null,
      bank_copy_url: bank_copy_url || null,
      user_id,
      password_hash: passwordHash,
      status: '신규'
    });

    res.status(201).json({
      success: true,
      message: '입점 신청이 접수되었습니다. 서류 검토 후 연락드리겠습니다.',
      leadId: result.id
    });
  } catch (error) {
    console.error('Direct join submission error:', error);
    res.status(500).json({
      error: '입점 신청 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// ===== Admin Routes (Protected) =====

// GET /api/leads/stats - Get lead statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [total, consults, directJoins, todayLeads, statusCounts] = await Promise.all([
      db.count('leads'),
      db.count('leads', { type: 'consult' }),
      db.count('leads', { type: 'direct_join' }),
      db.countToday('leads'),
      db.getStatusCounts('leads', 'status')
    ]);

    res.json({
      total,
      consults,
      directJoins,
      today: todayLeads,
      byStatus: statusCounts
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
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase.from('leads').select('*', { count: 'exact' });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,store_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    // Apply sorting
    const allowedSortColumns = ['created_at', 'name', 'store_name', 'status', 'type'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: leads, error, count } = await query;

    if (error) throw error;

    res.json({
      leads,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
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
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, type, name, store_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
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

    let query = supabase
      .from('leads')
      .select('id, type, name, store_name, phone, email, store_link, status, business_type, created_at');

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,store_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: leads, error } = await query;

    if (error) throw error;

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
    const lead = await db.getById('leads', req.params.id);

    if (!lead) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    // Don't send password_hash to client
    delete lead.password_hash;

    // Get activity logs
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select(`
        *,
        admin_users (name)
      `)
      .eq('lead_id', req.params.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Activity logs error:', logsError);
    }

    const activityLogs = (logs || []).map(log => ({
      ...log,
      admin_name: log.admin_users?.name || '관리자'
    }));

    res.json({ ...lead, activityLogs });
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
    const currentLead = await db.getById('leads', leadId);
    if (!currentLead) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    // Update lead
    const updatedLead = await db.update('leads', leadId, {
      status: status || currentLead.status,
      business_type: business_type !== undefined ? business_type : currentLead.business_type,
      memo: memo !== undefined ? memo : currentLead.memo
    });

    // Log status change
    if (status && status !== currentLead.status) {
      await db.insert('activity_logs', {
        lead_id: leadId,
        admin_id: req.user.id,
        action: 'status_change',
        old_value: currentLead.status,
        new_value: status
      });
    }

    // Log memo update
    if (memo !== undefined && memo !== currentLead.memo) {
      await db.insert('activity_logs', {
        lead_id: leadId,
        admin_id: req.user.id,
        action: 'memo_update',
        old_value: currentLead.memo || '',
        new_value: memo || ''
      });
    }

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
    const lead = await db.getById('leads', req.params.id);

    if (!lead) {
      return res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
    }

    await db.delete('leads', req.params.id);

    res.json({ success: true, message: '리드가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: '리드 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
