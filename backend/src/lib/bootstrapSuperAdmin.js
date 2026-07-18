import { prisma } from "./prisma.js";

const BOOTSTRAP_SUPERADMIN_EMAIL = "aniket.k@surplustovalue.com";

export async function bootstrapSuperAdmin() {
  await prisma.user.upsert({
    where: { email: BOOTSTRAP_SUPERADMIN_EMAIL },
    update: { isSuperAdmin: true },
    create: {
      email: BOOTSTRAP_SUPERADMIN_EMAIL,
      isSuperAdmin: true,
    },
  });

  console.log(`Bootstrapped superadmin: ${BOOTSTRAP_SUPERADMIN_EMAIL}`);
}
