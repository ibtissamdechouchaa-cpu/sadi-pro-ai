import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const orgCount = await prisma.organization.count();
    const profileCount = await prisma.profile.count();
    const docCount = await prisma.document.count();
    console.log(`Organizations: ${orgCount}`);
    console.log(`Profiles: ${profileCount}`);
    console.log(`Documents: ${docCount}`);
    console.log("✅ Database connection OK");
  } catch (e: any) {
    console.error("❌ Connection failed:", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
