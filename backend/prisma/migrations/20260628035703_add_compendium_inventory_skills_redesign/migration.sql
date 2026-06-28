/*
  Warnings:

  - You are about to drop the column `bonus` on the `CharacterSkill` table. All the data in the column will be lost.
  - You are about to drop the column `trained` on the `CharacterSkill` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "AbilityCompendium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'habilidade',
    "trilha" TEXT,
    "nex" TEXT,
    "actionType" TEXT NOT NULL,
    "peCost" INTEGER NOT NULL DEFAULT 0,
    "usesPerScene" INTEGER,
    "requiresConcentration" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'official',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RitualCompendium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effectDescription" TEXT,
    "element" TEXT NOT NULL,
    "circle" INTEGER NOT NULL,
    "executionTime" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "resistance" TEXT,
    "peCost" INTEGER NOT NULL,
    "nex" TEXT,
    "components" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'official',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InventoryLocation_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "esquiva" INTEGER NOT NULL DEFAULT 0,
    "bloqueio" INTEGER NOT NULL DEFAULT 0,
    "fortitude" INTEGER NOT NULL DEFAULT 0,
    "reflexos" INTEGER NOT NULL DEFAULT 0,
    "vontade" INTEGER NOT NULL DEFAULT 0,
    "deslocamento" REAL NOT NULL DEFAULT 9,
    "espacosInventario" INTEGER NOT NULL DEFAULT 5,
    "limitePE" INTEGER NOT NULL DEFAULT 1,
    "reducaoDano" INTEGER NOT NULL DEFAULT 0,
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
INSERT INTO "new_Character" ("approvedAt", "approvedById", "attrAgilidade", "attrForca", "attrIntelecto", "attrPresenca", "attrVigor", "bloqueio", "conditions", "createdAt", "createdById", "defesa", "description", "deslocamento", "espacosInventario", "esquiva", "fortitude", "groupId", "historyFull", "historySummary", "id", "isApproved", "isRevealed", "name", "nex", "origem", "peCurrent", "peMax", "pvCurrent", "pvMax", "reflexos", "sanCurrent", "sanMax", "tokenImage", "trilha", "updatedAt", "vontade") SELECT "approvedAt", "approvedById", "attrAgilidade", "attrForca", "attrIntelecto", "attrPresenca", "attrVigor", coalesce("bloqueio", 0) AS "bloqueio", "conditions", "createdAt", "createdById", "defesa", "description", "deslocamento", "espacosInventario", coalesce("esquiva", 0) AS "esquiva", "fortitude", "groupId", "historyFull", "historySummary", "id", "isApproved", "isRevealed", "name", "nex", "origem", "peCurrent", "peMax", "pvCurrent", "pvMax", "reflexos", "sanCurrent", "sanMax", "tokenImage", "trilha", "updatedAt", "vontade" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE TABLE "new_CharacterAbility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "peCost" INTEGER DEFAULT 0,
    "type" TEXT NOT NULL,
    "element" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "compendiumAbilityId" TEXT,
    "compendiumRitualId" TEXT,
    "nameOverride" TEXT,
    "descriptionOverride" TEXT,
    "peCostOverride" INTEGER,
    "currentUses" INTEGER,
    "notes" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" TEXT,
    "usesPerScene" INTEGER,
    "trilha" TEXT,
    "nex" TEXT,
    CONSTRAINT "CharacterAbility_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterAbility_compendiumAbilityId_fkey" FOREIGN KEY ("compendiumAbilityId") REFERENCES "AbilityCompendium" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CharacterAbility_compendiumRitualId_fkey" FOREIGN KEY ("compendiumRitualId") REFERENCES "RitualCompendium" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CharacterAbility" ("characterId", "description", "element", "id", "isActive", "name", "peCost", "type") SELECT "characterId", "description", "element", "id", "isActive", "name", "peCost", "type" FROM "CharacterAbility";
DROP TABLE "CharacterAbility";
ALTER TABLE "new_CharacterAbility" RENAME TO "CharacterAbility";
CREATE INDEX "CharacterAbility_characterId_idx" ON "CharacterAbility"("characterId");
CREATE INDEX "CharacterAbility_compendiumAbilityId_idx" ON "CharacterAbility"("compendiumAbilityId");
CREATE INDEX "CharacterAbility_compendiumRitualId_idx" ON "CharacterAbility"("compendiumRitualId");
CREATE TABLE "new_CharacterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "training" TEXT NOT NULL DEFAULT 'destreinado',
    "otherBonus" INTEGER NOT NULL DEFAULT 0,
    "isTrained" BOOLEAN NOT NULL DEFAULT false,
    "hasSpecialization" BOOLEAN NOT NULL DEFAULT false,
    "specializationName" TEXT,
    "bonusModifier" INTEGER NOT NULL DEFAULT 0,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CharacterSkill" ("attribute", "characterId", "id", "name") SELECT "attribute", "characterId", "id", "name" FROM "CharacterSkill";
DROP TABLE "CharacterSkill";
ALTER TABLE "new_CharacterSkill" RENAME TO "CharacterSkill";
CREATE INDEX "CharacterSkill_characterId_idx" ON "CharacterSkill"("characterId");
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "category" TEXT,
    "spaces" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL DEFAULT 0,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL DEFAULT 'equipado',
    "locationCustomName" TEXT,
    "weaponType" TEXT,
    "weaponGrip" TEXT,
    "damage" TEXT,
    "damageType" TEXT,
    "criticalMargin" INTEGER,
    "criticalMult" INTEGER,
    "weaponRange" INTEGER,
    "weaponProperties" TEXT,
    "protectionType" TEXT,
    "defenseBonus" INTEGER,
    "damageReduction" INTEGER,
    "wDamage" TEXT,
    "wDamageType" TEXT,
    "wRange" TEXT,
    "wCritical" TEXT,
    "wProperties" TEXT,
    "wCurrentAmmo" INTEGER,
    "wMaxAmmo" INTEGER,
    "wAmmoType" TEXT,
    "wTestAttribute" TEXT,
    "wTestSkill" TEXT,
    "wExtraDamageOnCrit" TEXT,
    "pArmorType" TEXT,
    "pDefenseBonus" INTEGER,
    "pAgilityPenalty" INTEGER,
    "pDiscreetPenalty" INTEGER,
    "pProperties" TEXT,
    "cEffect" TEXT,
    "cDiceNotation" TEXT,
    "cUsesPerItem" INTEGER,
    "cCurrentUses" INTEGER,
    "aAmmoType" TEXT,
    "aQuantity" INTEGER,
    CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("category", "characterId", "description", "id", "name", "quantity", "weight") SELECT "category", "characterId", "description", "id", "name", "quantity", "weight" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE INDEX "InventoryItem_characterId_idx" ON "InventoryItem"("characterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "InventoryLocation_characterId_idx" ON "InventoryLocation"("characterId");
