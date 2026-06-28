-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "linkedCharacterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    CONSTRAINT "User_linkedCharacterId_fkey" FOREIGN KEY ("linkedCharacterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    CONSTRAINT "AccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResourcePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourcePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourcePermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenImage" TEXT,
    "description" TEXT,
    "historySummary" TEXT,
    "historyFull" TEXT,
    "nex" TEXT,
    "trilha" TEXT,
    "pvCurrent" INTEGER NOT NULL DEFAULT 0,
    "pvMax" INTEGER NOT NULL DEFAULT 0,
    "sanCurrent" INTEGER NOT NULL DEFAULT 0,
    "sanMax" INTEGER NOT NULL DEFAULT 0,
    "peCurrent" INTEGER NOT NULL DEFAULT 0,
    "peMax" INTEGER NOT NULL DEFAULT 0,
    "attrForca" INTEGER DEFAULT 1,
    "attrAgilidade" INTEGER DEFAULT 1,
    "attrIntelecto" INTEGER DEFAULT 1,
    "attrPresenca" INTEGER DEFAULT 1,
    "attrVigor" INTEGER DEFAULT 1,
    "conditions" TEXT DEFAULT '[]',
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CharacterGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterAbility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "peCost" INTEGER DEFAULT 0,
    "type" TEXT NOT NULL,
    "element" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CharacterAbility_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "category" TEXT,
    "weight" REAL,
    CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tokenImage" TEXT,
    "description" TEXT,
    "lore" TEXT,
    "threatLevel" TEXT,
    "pvMax" INTEGER NOT NULL DEFAULT 0,
    "sanMax" INTEGER,
    "attrForca" TEXT DEFAULT 'd4',
    "attrAgilidade" TEXT DEFAULT 'd4',
    "attrIntelecto" TEXT DEFAULT 'd4',
    "attrPresenca" TEXT DEFAULT 'd4',
    "attrVigor" TEXT DEFAULT 'd4',
    "resistances" TEXT DEFAULT '[]',
    "immunities" TEXT DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonsterAttack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monsterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "damage" TEXT NOT NULL,
    "damageType" TEXT,
    "description" TEXT,
    "reach" TEXT,
    CONSTRAINT "MonsterAttack_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonsterAbility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monsterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    CONSTRAINT "MonsterAbility_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EnvironmentImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "environmentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EnvironmentImage_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvironmentPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "environmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "linkedNpcId" TEXT,
    CONSTRAINT "EnvironmentPoint_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT,
    "tags" TEXT DEFAULT '[]',
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DocumentImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    CONSTRAINT "DocumentImage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CombatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "roundCurrent" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CombatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "combatSessionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "characterId" TEXT,
    "monsterId" TEXT,
    "customName" TEXT,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "pvCurrent" INTEGER NOT NULL DEFAULT 0,
    "pvMax" INTEGER NOT NULL DEFAULT 0,
    "sanCurrent" INTEGER NOT NULL DEFAULT 0,
    "sanMax" INTEGER NOT NULL DEFAULT 0,
    "peCurrent" INTEGER NOT NULL DEFAULT 0,
    "peMax" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CombatParticipant_combatSessionId_fkey" FOREIGN KEY ("combatSessionId") REFERENCES "CombatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CombatParticipant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CombatParticipant_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CombatEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "combatSessionId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "sourceId" TEXT,
    "sourceName" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "value" INTEGER,
    "description" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CombatEvent_combatSessionId_fkey" FOREIGN KEY ("combatSessionId") REFERENCES "CombatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "sessionNumber" INTEGER,
    "sessionDate" DATETIME,
    "content" TEXT,
    "tags" TEXT DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "action" TEXT NOT NULL,
    "fieldChanged" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "context" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_userId_key" ON "AccessRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePermission_userId_resourceType_resourceId_key" ON "ResourcePermission"("userId", "resourceType", "resourceId");
