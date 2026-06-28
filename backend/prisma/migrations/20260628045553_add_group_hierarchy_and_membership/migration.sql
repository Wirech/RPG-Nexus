-- CreateTable
CREATE TABLE "CharacterGroupMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterGroupMembership_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CharacterGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CharacterGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CharacterGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CharacterGroup" ("color", "createdAt", "description", "id", "name", "order", "updatedAt") SELECT "color", "createdAt", "description", "id", "name", "order", "updatedAt" FROM "CharacterGroup";
DROP TABLE "CharacterGroup";
ALTER TABLE "new_CharacterGroup" RENAME TO "CharacterGroup";
CREATE INDEX "CharacterGroup_parentId_idx" ON "CharacterGroup"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CharacterGroupMembership_characterId_idx" ON "CharacterGroupMembership"("characterId");

-- CreateIndex
CREATE INDEX "CharacterGroupMembership_groupId_idx" ON "CharacterGroupMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterGroupMembership_characterId_groupId_key" ON "CharacterGroupMembership"("characterId", "groupId");
