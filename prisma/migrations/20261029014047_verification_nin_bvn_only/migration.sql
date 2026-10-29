-- Verification is strictly NIN + BVN via VerifyMe — drop the unused
-- face/CAC checks and rename bankCheck to bvnCheck for accuracy.
ALTER TABLE "verification_submissions" DROP COLUMN "faceCheck";
ALTER TABLE "verification_submissions" DROP COLUMN "cacCheck";
ALTER TABLE "verification_submissions" RENAME COLUMN "bankCheck" TO "bvnCheck";
