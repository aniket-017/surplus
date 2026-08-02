/**
 * MongoDB unique indexes treat null as a value, so optional unique fields
 * need partial indexes that only cover real string values.
 * Prisma cannot declare these, so we create them here.
 *
 * Usage: node scripts/ensureSparseUserIndexes.js
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const INDEXES = [
  {
    key: { email: 1 },
    name: "users_email_sparse_key",
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  },
  {
    key: { phone: 1 },
    name: "users_phone_sparse_key",
    unique: true,
    partialFilterExpression: { phone: { $type: "string" } },
  },
  {
    key: { firebase_uid: 1 },
    name: "users_firebase_uid_sparse_key",
    unique: true,
    partialFilterExpression: { firebase_uid: { $type: "string" } },
  },
];

const INDEX_NAMES_TO_RECREATE = new Set(INDEXES.map((index) => index.name));

const LEGACY_INDEX_NAMES = new Set([
  "users_email_key",
  "users_phone_key",
  "users_firebase_uid_key",
]);

function indexMatchesDesired(existing, desired) {
  const existingPartial = existing.partialFilterExpression;
  const desiredPartial = desired.partialFilterExpression;

  if (!existing.unique || existing.sparse) return false;
  if (!existingPartial || !desiredPartial) return false;

  return JSON.stringify(existingPartial) === JSON.stringify(desiredPartial);
}

async function dropConflictingIndexes() {
  const result = await prisma.$runCommandRaw({ listIndexes: "users" });
  const existing = result.cursor?.firstBatch ?? [];
  const desiredByName = new Map(INDEXES.map((index) => [index.name, index]));

  for (const index of existing) {
    if (LEGACY_INDEX_NAMES.has(index.name)) {
      console.log(`Dropping legacy non-partial index ${index.name}`);
      await prisma.$runCommandRaw({
        dropIndexes: "users",
        index: index.name,
      });
      continue;
    }

    if (!INDEX_NAMES_TO_RECREATE.has(index.name)) continue;

    const desired = desiredByName.get(index.name);
    if (desired && indexMatchesDesired(index, desired)) {
      console.log(`Index ${index.name} already uses partial filter`);
      continue;
    }

    console.log(`Dropping outdated index ${index.name}`);
    await prisma.$runCommandRaw({
      dropIndexes: "users",
      index: index.name,
    });
  }
}

async function ensurePartialUniqueIndexes() {
  await dropConflictingIndexes();

  const result = await prisma.$runCommandRaw({ listIndexes: "users" });
  const existingNames = new Set(
    (result.cursor?.firstBatch ?? []).map((index) => index.name)
  );

  for (const index of INDEXES) {
    if (existingNames.has(index.name)) {
      console.log(`Index ${index.name} already exists`);
      continue;
    }

    try {
      await prisma.$runCommandRaw({
        createIndexes: "users",
        indexes: [index],
      });
      console.log(`Ensured partial unique index ${index.name}`);
    } catch (error) {
      if (String(error.message || error).includes("already exists")) {
        console.log(`Index ${index.name} already exists`);
        continue;
      }
      throw error;
    }
  }
}

ensurePartialUniqueIndexes()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Partial unique user indexes ready");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
