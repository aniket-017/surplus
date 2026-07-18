/**
 * One-time backfill of buyerUnreadCount / sellerUnreadCount on conversations.
 * Run: node src/scripts/backfillUnreadCounts.js
 */
import { prisma } from "../lib/prisma.js";
import { countUnreadFromMessages } from "../lib/conversations.js";

async function main() {
  const conversations = await prisma.conversation.findMany({
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      buyerLastReadAt: true,
      sellerLastReadAt: true,
      buyerUnreadCount: true,
      sellerUnreadCount: true,
    },
  });

  let updated = 0;

  for (const conversation of conversations) {
    const buyerUnread = await countUnreadFromMessages(conversation, conversation.buyerId);
    const sellerUnread = await countUnreadFromMessages(conversation, conversation.sellerId);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        buyerUnreadCount: buyerUnread,
        sellerUnreadCount: sellerUnread,
      },
    });
    updated += 1;
  }

  console.log(`Backfilled unread counts for ${updated} conversations`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
