const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helper functions
const db = {
  // INSERT and return the inserted row
  async insert(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // SELECT single row
  async getOne(table, conditions = {}) {
    let query = supabase.from(table).select('*');

    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // SELECT by ID
  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // SELECT multiple rows with filters
  async getMany(table, options = {}) {
    const {
      filters = {},
      search = null,
      searchColumns = [],
      orderBy = 'created_at',
      orderDirection = 'desc',
      limit = null,
      offset = 0
    } = options;

    let query = supabase.from(table).select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query = query.eq(key, value);
      }
    });

    // Apply search (OR across multiple columns)
    if (search && searchColumns.length > 0) {
      const searchPattern = `%${search}%`;
      const orConditions = searchColumns.map(col => `${col}.ilike.${searchPattern}`).join(',');
      query = query.or(orConditions);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  // UPDATE
  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // DELETE
  async delete(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // COUNT with filters
  async count(table, filters = {}) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query = query.eq(key, value);
      }
    });

    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  // COUNT today's records
  async countToday(table) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (error) throw error;
    return count;
  },

  // Get status counts (for dashboard)
  async getStatusCounts(table, statusColumn = 'status') {
    const { data, error } = await supabase
      .from(table)
      .select(statusColumn);

    if (error) throw error;

    // Count manually since Supabase doesn't have GROUP BY in JS client easily
    const counts = {};
    data.forEach(row => {
      const status = row[statusColumn];
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  },

  // Raw query using RPC (for complex queries)
  async rpc(functionName, params = {}) {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
  }
};

module.exports = { supabase, db };
