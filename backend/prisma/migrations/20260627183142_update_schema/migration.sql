/*
  Warnings:

  - You are about to drop the column `linkedCharacterId` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "UserCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenImage" TEXT,
    "description" TEXT,
    "historySummary" TEXT,
    "historyFull" TEXT,
    "nex" TEXT,
    "trilha" TEXT,
    "origem" TEXT,
    "pvCurrent" INTEGER NOT NULL DEFAULT 0,
    "pvMax" INTEGER NOT NULL DEFAULT 0,
    "sanCurrent" INTEGER NOT NULL DEFAULT 0,
    "sanMax" INTEGER NOT NULL DEFAULT 0,
    "peCurrent" INTEGER NOT NULL DEFAULT 0,
    "peMax" INTEGER NOT NULL DEFAULT 0,
    "attrForca" INTEGER NOT NULL DEFAULT 1,
    "attrAgilidade" INTEGER NOT NULL DEFAULT 1,
    "attrIntelecto" INTEGER NOT NULL DEFAULT 1,
    "attrPresenca" INTEGER NOT NULL DEFAULT 1,
    "attrVigor" INTEGER NOT NULL DEFAULT 1,
    "defesa" INTEGER NOT NULL DEFAULT 10,
    "esquiva" INTEGER,
    "bloqueio" INTEGER,
    "fortitude" INTEGER NOT NULL DEFAULT 0,
    "reflexos" INTEGER NOT NULL DEFAULT 0,
    "vontade" INTEGER NOT NULL DEFAULT 0,
    "deslocamento" REAL NOT NULL DEFAULT 9,
    "espacosInventario" INTEGER NOT NULL DEFAULT 5,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "createdById" TEXT,
    "conditions" TEXT DEFAULT '[]',
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CharacterGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("attrAgilidade", "attrForca", "attrIntelecto", "attrPresenca", "attrVigor", "conditions", "createdAt", "description", "groupId", "historyFull", "historySummary", "id", "isRevealed", "name", "nex", "peCurrent", "peMax", "pvCurrent", "pvMax", "sanCurrent", "sanMax", "tokenImage", "trilha", "updatedAt") SELECT coalesce("attrAgilidade", 1) AS "attrAgilidade", coalesce("attrForca", 1) AS "attrForca", coalesce("attrIntelecto", 1) AS "attrIntelecto", coalesce("attrPresenca", 1) AS "attrPresenca", coalesce("attrVigor", 1) AS "attrVigor", "conditions", "createdAt", "description", "groupId", "historyFull", "historySummary", "id", "isRevealed", "name", "nex", "peCurrent", "peMax", "pvCurrent", "pvMax", "sanCurrent", "sanMax", "tokenImage", "trilha", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedById" TEXT
);
INSERT INTO "new_User" ("approvedAt", "approvedById", "createdAt", "id", "passwordHash", "role", "status", "username") SELECT "approvedAt", "approvedById", "createdAt", "id", "passwordHash", "role", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");
