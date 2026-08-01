/**
 * Migrates legacy ProductCondition "SCRAP" values to "SURPLUS".
 * Prisma rejects SCRAP because it is not in the ProductCondition enum,
 * which breaks product browse/list queries.
 *
 * Usage: node scripts/migrateScrapToSurplus.js
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const countResult = await prisma.$runCommandRaw({
    count: "products",
    query: { condition: "SCRAP" },
  });
  const matched = countResult.n ?? 0;
  console.log(`Found ${matched} product(s) with condition SCRAP`);

  if (matched === 0) {
    return;
  }

  const result = await prisma.$runCommandRaw({
    update: "products",
    updates: [
      {
        q: { condition: "SCRAP" },
        u: { $set: { condition: "SURPLUS" } },
        multi: true,
      },
    ],
  });

  console.log(
    `Updated ${result.nModified ?? result.n ?? 0} product(s) SCRAP → SURPLUS`,
  );
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
