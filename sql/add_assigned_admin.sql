-- 담당자 선택 기능을 위한 스키마 변경
-- Supabase SQL Editor에서 실행하세요

-- 1. admin_users 테이블에 name 컬럼 추가 (이미 있으면 스킵)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'name'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN name VARCHAR(100);
  END IF;
END $$;

-- 2. leads 테이블에 assigned_admin_id 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_admin_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. 기존 admin_users에 name이 없는 경우 email에서 추출하여 설정
UPDATE admin_users
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '';

-- 4. leads 테이블에 인덱스 추가 (담당자별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_leads_assigned_admin_id ON leads(assigned_admin_id);

-- 5. 확인용 쿼리
SELECT 'admin_users 테이블:' as info;
SELECT id, email, name, created_at FROM admin_users ORDER BY created_at DESC;

SELECT 'leads 테이블 구조:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
