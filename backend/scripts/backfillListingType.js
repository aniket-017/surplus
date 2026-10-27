/**
 * Backfill missing product.listing_type to PRODUCT via Mongo raw update.
 * Docs created before services existed lack the field and would be excluded
 * by listingType filters. The server also runs this on startup.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { backfillMissingListingType } from "../src/lib/product.js";

const modified = await backfillMissingListingType();
console.log(`Backfilled listing_type on ${modified} products`);

const [products, services] = await Promise.all([
  prisma.product.count({ where: { listingType: "PRODUCT" } }),
  prisma.product.count({ where: { listingType: "SERVICE" } }),
]);
console.log(`PRODUCT listings: ${products}`);
console.log(`SERVICE listings: ${services}`);

await prisma.$disconnect();
