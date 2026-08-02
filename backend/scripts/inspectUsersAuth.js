/**
 * Inspect users by auth identity fields (read-only).
 * Usage: node scripts/inspectUsersAuth.js
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      firebaseUid: true,
      googleId: true,
      isSuperAdmin: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total users: ${users.length}\n`);

  for (const u of users) {
    console.log(
      JSON.stringify({
        id: u.id,
        email: u.email,
        phone: u.phone,
        firebaseUid: u.firebaseUid ? "yes" : null,
        googleId: u.googleId ? "yes" : null,
        isSuperAdmin: u.isSuperAdmin,
        name: u.name,
        role: u.role,
      }),
    );
  }

  const withEmail = users.filter((u) => u.email);
  const withPhone = users.filter((u) => u.phone || u.firebaseUid);
  const emailOnly = users.filter(
    (u) => u.email && !u.phone && !u.firebaseUid && !u.isSuperAdmin,
  );
  const emailAnyNonAdmin = users.filter((u) => u.email && !u.isSuperAdmin);
  const superAdmins = users.filter((u) => u.isSuperAdmin);

  console.log("\n--- counts ---");
  console.log("with email:", withEmail.length);
  console.log("with phone/firebase:", withPhone.length);
  console.log("email-only non-admin (no phone/firebase):", emailOnly.length);
  console.log("any email non-admin:", emailAnyNonAdmin.length);
  console.log("superadmins:", superAdmins.length);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
