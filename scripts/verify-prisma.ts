import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Count organizations
    const orgCount = await prisma.organization.count();
    console.log(`✅ Organizations: ${orgCount}`);

    // Count profiles
    const profileCount = await prisma.profile.count();
    console.log(`✅ Profiles: ${profileCount}`);

    // Count departments
    const deptCount = await prisma.department.count();
    console.log(`✅ Departments: ${deptCount}`);

    // Count legal references
    const refCount = await prisma.legalReference.count();
    console.log(`✅ Legal references: ${refCount}`);

    // Count retention policies
    const policyCount = await prisma.retentionPolicy.count();
    console.log(`✅ Retention policies: ${policyCount}`);

    console.log("\n✅ All verification checks passed!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();