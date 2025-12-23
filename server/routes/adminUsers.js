const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/admin-users/public - Get admin users for landing page dropdown (public, no auth required)
// Only returns id and name - no sensitive info
router.get('/public', async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter out any admins without a name
    const filteredAdmins = (admins || []).filter(admin => admin.name);

    res.json(filteredAdmins);
  } catch (error) {
    console.error('Get public admin users error:', error);
    res.status(500).json({ error: '담당자 목록을 불러오는데 실패했습니다.' });
  }
});

module.exports = router;
