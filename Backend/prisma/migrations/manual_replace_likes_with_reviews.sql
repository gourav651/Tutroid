-- Manual migration to replace PostLike with PostReview

-- Step 1: Create PostReview table
CREATE TABLE IF NOT EXISTS "PostReview" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostReview_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes for PostReview
CREATE UNIQUE INDEX IF NOT EXISTS "PostReview_postId_userId_key" ON "PostReview"("postId", "userId");
CREATE INDEX IF NOT EXISTS "PostReview_postId_idx" ON "PostReview"("postId");
CREATE INDEX IF NOT EXISTS "PostReview_userId_idx" ON "PostReview"("userId");
CREATE INDEX IF NOT EXISTS "PostReview_rating_idx" ON "PostReview"("rating");

-- Step 3: Add foreign keys for PostReview
ALTER TABLE "PostReview" ADD CONSTRAINT "PostReview_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostReview" ADD CONSTRAINT "PostReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Update Post table - add new columns
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- Step 5: Create index on averageRating
CREATE INDEX IF NOT EXISTS "Post_averageRating_idx" ON "Post"("averageRating");

-- Step 6: Drop old columns from Post (if they exist)
ALTER TABLE "Post" DROP COLUMN IF EXISTS "likes";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "comments";

-- Step 7: Drop PostLike table (if it exists)
DROP TABLE IF EXISTS "PostLike" CASCADE;
