-- Add owner session tracking to rooms.
ALTER TABLE "Room" ADD COLUMN "ownerSessionId" TEXT;

CREATE UNIQUE INDEX "Room_ownerSessionId_key" ON "Room"("ownerSessionId");

ALTER TABLE "Room"
ADD CONSTRAINT "Room_ownerSessionId_fkey"
FOREIGN KEY ("ownerSessionId") REFERENCES "DeveloperSession"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
