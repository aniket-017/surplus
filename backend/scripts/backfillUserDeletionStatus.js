/**
 * Backfill missing user.is_deleted values to false for legacy user documents.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const result = await prisma.$runCommandRaw({
    update: "users",
    updates: [
      {
        q: {
          $or: [{ is_deleted: { $exists: false } }, { is_deleted: null }],
        },
        u: { $set: { is_deleted: false } },
        multi: true,
      },
    ],
  });

  console.log("Mongo update result:", JSON.stringify(result));
} finally {
  await prisma.$disconnect();
}