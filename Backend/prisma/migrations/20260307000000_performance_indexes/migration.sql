-- Performance optimization indexes
-- Add composite indexes for better query performance

-- Request model optimizations
CREATE INDEX IF NOT EXISTS "Request_status_createdAt_idx" ON "Request"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Request_trainerId_status_idx" ON "Request"("trainerId", "status");
CREATE INDEX IF NOT EXISTS "Request_institutionId_status_idx" ON "Request"("institutionId", "status");

-- Notification model optimizations
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Message model optimizations
CREATE INDEX IF NOT EXISTS "Message_senderId_isRead_idx" ON "Message"("senderId", "isRead");

-- Post model optimizations
CREATE INDEX IF NOT EXISTS "Post_isActive_createdAt_idx" ON "Post"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_authorId_isActive_idx" ON "Post"("authorId", "isActive");