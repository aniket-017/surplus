/**
 * Backfill missing product.listing_status to ACTIVE via Mongo raw update.
 * Existing docs without the field are excluded by listingStatus filters.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.$runCommandRaw({
  update: "products",
  updates: [
    {
      q: {
        $or: [
          { listing_status: { $exists: false } },
          { listing_status: null },
        ],
      },
      u: { $set: { listing_status: "ACTIVE" } },
      multi: true,
    },
  ],
});

console.log("Mongo update result:", JSON.stringify(result));

const active = await prisma.product.findMany({
  where: { listingStatus: "ACTIVE" },
  select: { title: true, listingStatus: true },
});
console.log(`ACTIVE products now: ${active.length}`);
active.forEach((p) => console.log("-", p.title));

await prisma.$disconnect();
