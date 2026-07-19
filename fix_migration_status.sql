-- Fix migration status in _prisma_migrations table
-- Run this in Supabase SQL Editor

-- 1. Check current status
SELECT migration_name, finished_at, rolled_back_at, logs 
FROM _prisma_migrations 
WHERE migration_name = '20260719150000_move_protocolo_to_payment';

-- 2. Mark as successfully applied (if it shows as failed)
UPDATE _prisma_migrations 
SET 
    finished_at = NOW(),
    rolled_back_at = NULL,
    logs = 'Manually marked as applied - SQL executed via Supabase SQL Editor'
WHERE migration_name = '20260719150000_move_protocolo_to_payment'
  AND (finished_at IS NULL OR rolled_back_at IS NOT NULL);

-- 3. Verify
SELECT migration_name, finished_at, rolled_back_at, logs 
FROM _prisma_migrations 
WHERE migration_name = '20260719150000_move_protocolo_to_payment';