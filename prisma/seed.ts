import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Nvd@245203", 10);

  await prisma.user.upsert({
    where: { email: "admin@hsklearning.com" },
    update: {},
    create: {
      name: "Admin HSK",
      email: "admin@hsklearning.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
