import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@skillmap.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@skillmap.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Admin user created: admin@skillmap.com / admin123");
  } else {
    console.log("Admin user already exists.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
