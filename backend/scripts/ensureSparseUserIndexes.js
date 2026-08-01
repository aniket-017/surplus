/**
 * MongoDB unique indexes treat null as a value, so optional unique fields
 * need sparse indexes. Prisma cannot declare sparse indexes, so we create them here.
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
    sparse: true,
  },
  {
    key: { phone: 1 },
    name: "users_phone_sparse_key",
    unique: true,
    sparse: true,
  },
  {
    key: { firebase_uid: 1 },
    name: "users_firebase_uid_sparse_key",
    unique: true,
    sparse: true,
  },
];

async function dropConflictingIndexes() {
  const result = await prisma.$runCommandRaw({ listIndexes: "users" });
  const existing = result.cursor?.firstBatch ?? [];

  for (const index of existing) {
    if (
      index.name === "users_email_key" ||
      index.name === "users_phone_key" ||
      index.name === "users_firebase_uid_key"
    ) {
      console.log(`Dropping non-sparse index ${index.name}`);
      await prisma.$runCommandRaw({
        dropIndexes: "users",
        index: index.name,
      });
    }
  }
}

async function ensureSparseIndexes() {
  await dropConflictingIndexes();

  for (const index of INDEXES) {
    try {
      await prisma.$runCommandRaw({
        createIndexes: "users",
        indexes: [index],
      });
      console.log(`Ensured sparse unique index ${index.name}`);
    } catch (error) {
      if (String(error.message || error).includes("already exists")) {
        console.log(`Index ${index.name} already exists`);
        continue;
      }
      throw error;
    }
  }
}

ensureSparseIndexes()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Sparse user indexes ready");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
