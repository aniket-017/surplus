/**
 * Purge legacy email-login users (and their listings/messages).
 *
 * Targets users who have an email and no phone/firebaseUid auth,
 * excluding superadmins. Phone-login users are left alone.
 *
 * Usage:
 *   node scripts/purgeEmailLoginUsers.js           # dry-run
 *   node scripts/purgeEmailLoginUsers.js --execute  # delete
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { deleteProductImages as deleteProductImagesFromS3 } from "../src/lib/s3.js";

const EXECUTE = process.argv.includes("--execute");

async function deleteConversationsByIds(conversationIds) {
  if (!conversationIds.length) return 0;

  await prisma.message.deleteMany({
    where: { conversationId: { in: conversationIds } },
  });
  const result = await prisma.conversation.deleteMany({
    where: { id: { in: conversationIds } },
  });
  return result.count;
}

async function deleteProductWithRelations(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return null;

  const conversations = await prisma.conversation.findMany({
    where: { productId },
    select: { id: true },
  });
  await deleteConversationsByIds(conversations.map((c) => c.id));
  await prisma.savedListing.deleteMany({ where: { productId } });
  await prisma.listingReport.deleteMany({ where: { productId } });
  await deleteProductImagesFromS3(product.images);
  await prisma.product.delete({ where: { id: productId } });
  return product;
}

async function findEmailLoginUsers() {
  // Email/Google-era accounts: have email, no Firebase phone identity.
  // Superadmins are always excluded.
  // Filter in JS: Mongo docs may omit is_super_admin / phone / firebase_uid.
  const candidates = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      firebaseUid: true,
      name: true,
      googleId: true,
      role: true,
      isSuperAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return candidates.filter(
    (u) =>
      !u.isSuperAdmin &&
      typeof u.email === "string" &&
      u.email.trim().length > 0 &&
      !u.phone &&
      !u.firebaseUid,
  );
}

async function summarizeUser(userId) {
  const [products, buyerConvos, sellerConvos, saved, pushTokens] =
    await Promise.all([
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.conversation.count({ where: { buyerId: userId } }),
      prisma.conversation.count({ where: { sellerId: userId } }),
      prisma.savedListing.count({ where: { userId } }),
      prisma.pushToken.count({ where: { userId } }),
    ]);

  return {
    products,
    conversations: buyerConvos + sellerConvos,
    saved,
    pushTokens,
  };
}

async function purgeUser(user) {
  const products = await prisma.product.findMany({
    where: { sellerId: user.id },
    select: { id: true },
  });

  for (const product of products) {
    await deleteProductWithRelations(product.id);
  }

  // Remaining chats where this user is buyer/seller (e.g. on others' listings)
  const remainingConversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    select: { id: true },
  });
  await deleteConversationsByIds(remainingConversations.map((c) => c.id));

  // Orphan messages sent by this user (should already be gone)
  await prisma.message.deleteMany({ where: { senderId: user.id } });
  await prisma.savedListing.deleteMany({ where: { userId: user.id } });
  await prisma.pushToken.deleteMany({ where: { userId: user.id } });

  if (user.email) {
    await prisma.otp.deleteMany({ where: { email: user.email } });
  }

  await prisma.user.delete({ where: { id: user.id } });
}

async function main() {
  console.log(EXECUTE ? "MODE: EXECUTE (will delete)" : "MODE: DRY-RUN (no deletes)");
  console.log("");

  const users = await findEmailLoginUsers();
  console.log(`Found ${users.length} email-login user(s) to purge (superadmins excluded)\n`);

  if (users.length === 0) {
    return;
  }

  let totals = {
    users: users.length,
    products: 0,
    conversations: 0,
    saved: 0,
    pushTokens: 0,
  };

  for (const user of users) {
    const stats = await summarizeUser(user.id);
    totals.products += stats.products;
    totals.conversations += stats.conversations;
    totals.saved += stats.saved;
    totals.pushTokens += stats.pushTokens;

    console.log(
      `- ${user.email}` +
        (user.name ? ` (${user.name})` : "") +
        (user.googleId ? " [google]" : "") +
        ` | products=${stats.products} convos=${stats.conversations}` +
        ` saved=${stats.saved} push=${stats.pushTokens}`,
    );
  }

  console.log("\nTotals:");
  console.log(`  users:         ${totals.users}`);
  console.log(`  products:      ${totals.products}`);
  console.log(`  conversations: ${totals.conversations}`);
  console.log(`  saved:         ${totals.saved}`);
  console.log(`  push tokens:   ${totals.pushTokens}`);

  if (!EXECUTE) {
    console.log("\nDry-run only. Re-run with --execute to delete.");
    return;
  }

  console.log("\nDeleting...");
  for (const user of users) {
    process.stdout.write(`  ${user.email} ... `);
    await purgeUser(user);
    console.log("done");
  }

  console.log("\nPurge complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
