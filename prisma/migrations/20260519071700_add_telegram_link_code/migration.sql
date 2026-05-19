-- Align existing Telegram settings fields and add one-time link code fields.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegramLinkCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegramLinkExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mileageTrackInterval" INTEGER NOT NULL DEFAULT 7;

CREATE UNIQUE INDEX IF NOT EXISTS "users_telegramChatId_key" ON "users"("telegramChatId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegramLinkCode_key" ON "users"("telegramLinkCode");
