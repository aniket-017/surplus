import { prisma } from "./prisma.js";

const BOOTSTRAP_SUPERADMIN_EMAIL = "aniket.k@surplustovalue.com";

export async function bootstrapSuperAdmin() {
  const existing = await prisma.user.findFirst({
    where: { email: BOOTSTRAP_SUPERADMIN_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isSuperAdmin: true },
    });
  } else {
    await prisma.user.create({
      data: {
        email: BOOTSTRAP_SUPERADMIN_EMAIL,
        isSuperAdmin: true,
      },
    });
  }

  console.log(`Bootstrapped superadmin: ${BOOTSTRAP_SUPERADMIN_EMAIL}`);
}
