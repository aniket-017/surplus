import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const raw = await prisma.product.findRaw({
  filter: {},
  options: { projection: { title: 1, listing_status: 1, listingStatus: 1 } },
});
console.log(JSON.stringify(raw, null, 2));

const byEquals = await prisma.product.findMany({
  where: { listingStatus: { equals: "ACTIVE" } },
  select: { title: true, listingStatus: true },
});
console.log("equals ACTIVE", byEquals.length);

const byIn = await prisma.product.findMany({
  where: { listingStatus: { in: ["ACTIVE"] } },
  select: { title: true, listingStatus: true },
});
console.log("in ACTIVE", byIn.length);

const sold = await prisma.product.findMany({
  where: { listingStatus: "SOLD" },
  select: { title: true, listingStatus: true },
});
console.log("SOLD", sold.length, sold.map((p) => p.title));

const deleted = await prisma.product.findMany({
  where: { listingStatus: "DELETED" },
  select: { title: true, listingStatus: true },
});
console.log("DELETED", deleted.length, deleted.map((p) => p.title));

await prisma.$disconnect();
