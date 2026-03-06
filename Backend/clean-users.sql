-- Clean All Users Script
-- WARNING: This will delete ALL users and their related data!
-- Run this script in your database management tool (like pgAdmin, DBeaver, or psql)

-- Start transaction
BEGIN;

-- Delete in correct order to respect foreign key constraints
-- 1. Delete audit logs
DELETE FROM "AuditLog";

-- 2. Delete notifications  
DELETE FROM "Notification";

-- 3. Delete verification requests
DELETE FROM "VerificationRequest";

-- 4. Delete messages and conversations
DELETE FROM "Message";
DELETE FROM "Conversation";

-- 5. Delete connections
DELETE FROM "Connection";

-- 6. Delete post reviews and posts
DELETE FROM "PostReview";
DELETE FROM "Post";

-- 7. Delete education and experience
DELETE FROM "Education";
DELETE FROM "Experience";

-- 8. Delete reports
DELETE FROM "Report";

-- 9. Delete material ratings and materials
DELETE FROM "MaterialRating";
DELETE FROM "Material";

-- 10. Delete badges
DELETE FROM "Badge";

-- 11. Delete reviews and requests
DELETE FROM "Review";
DELETE FROM "Request";

-- 12. Delete profile tables
DELETE FROM "StudentProfile";
DELETE FROM "InstitutionProfile";
DELETE FROM "TrainerProfile";

-- 13. Finally, delete all users
DELETE FROM "User";

-- Show results
SELECT 
  'Users' as table_name, 
  COUNT(*) as remaining_records 
FROM "User"
UNION ALL
SELECT 
  'TrainerProfile' as table_name, 
  COUNT(*) as remaining_records 
FROM "TrainerProfile"
UNION ALL
SELECT 
  'InstitutionProfile' as table_name, 
  COUNT(*) as remaining_records 
FROM "InstitutionProfile"
UNION ALL
SELECT 
  'Posts' as table_name, 
  COUNT(*) as remaining_records 
FROM "Post";

-- Commit the transaction
COMMIT;

-- Success message
SELECT 'All users and related data have been successfully deleted!' as result;