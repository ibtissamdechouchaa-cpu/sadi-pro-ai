import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedLegalData } from "./seed-legal.js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: "sadi-pro" },
    update: {},
    create: {
      name: "SADI PRO",
      slug: "sadi-pro",
      industry: "Technology",
      country: "DZ",
      defaultLanguage: "ar",
      timezone: "Africa/Algiers",
      planTier: "pro",
      subscriptionState: "active",
      maxUsers: 50,
      maxStorageBytes: 10737418240, // 10 GB
      maxDocuments: 10000,
    },
  });

  console.log("Organization created:", org.id);

  // Create admin user
  const adminHash = await hashPassword("admin123");
  const admin = await prisma.profile.upsert({
    where: { email: "admin@sadi-pro.com" },
    update: {},
    create: {
      id: "admin-user-id",
      organizationId: org.id,
      email: "admin@sadi-pro.com",
      fullName: "Admin User",
      role: "owner",
      passwordHash: adminHash,
      isActive: true,
      language: "ar",
    },
  });

  console.log("Admin user created:", admin.id);

  // Create default departments
  const dept1 = await prisma.department.upsert({
    where: { id: "dept-general" },
    update: {},
    create: {
      id: "dept-general",
      organizationId: org.id,
      name: "General",
      color: "#2563eb",
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { id: "dept-hr" },
    update: {},
    create: {
      id: "dept-hr",
      organizationId: org.id,
      name: "Human Resources",
      color: "#16a34a",
    },
  });

  const dept3 = await prisma.department.upsert({
    where: { id: "dept-finance" },
    update: {},
    create: {
      id: "dept-finance",
      organizationId: org.id,
      name: "Finance",
      color: "#ea580c",
    },
  });

  console.log("Departments created");

  // Create some legal references
  await prisma.legalReference.upsert({
    where: { id: "ref-loi-88-09" },
    update: {},
    create: {
      id: "ref-loi-88-09",
      referenceNumber: "Loi 88-09",
      referenceType: "law",
      title: "Loi sur les archives publiques",
      subject: "Archivage",
      description: "Définit les règles de conservation et d'élimination des archives publiques en Algérie",
      retentionRules: { defaultYears: 10, contract: 10, invoice: 7, hr: 5 },
      disposalRules: { action: "DELETE", approvalRequired: true },
      archiveRules: { afterYears: 10, storage: "permanent_archive" },
      status: "active",
    },
  });

  await prisma.legalReference.upsert({
    where: { id: "ref-circulaire-2020" },
    update: {},
    create: {
      id: "ref-circulaire-2020",
      referenceNumber: "Circulaire 2020-15",
      referenceType: "regulation",
      title: "Circulaire sur la gestion électronique des documents",
      subject: "Gestion électronique",
      description: "Normes pour la dématérialisation et la conservation numérique",
      retentionRules: { electronicDoc: 10, email: 3 },
      disposalRules: { action: "REVIEW", approvalRequired: true },
      archiveRules: { afterYears: 5, storage: "cold_storage" },
      status: "active",
    },
  });

  console.log("Legal references created");

  // Create default retention policies
  await prisma.retentionPolicy.upsert({
    where: { id: "ret-contract" },
    update: {},
    create: {
      id: "ret-contract",
      organizationId: org.id,
      name: "Contrats",
      documentType: "contract",
      retentionYears: 10,
      dispositionAction: "TRANSFER_TO_ARCHIVE",
      isActive: true,
    },
  });

  await prisma.retentionPolicy.upsert({
    where: { id: "ret-invoice" },
    update: {},
    create: {
      id: "ret-invoice",
      organizationId: org.id,
      name: "Factures",
      documentType: "invoice",
      retentionYears: 7,
      dispositionAction: "REVIEW",
      isActive: true,
    },
  });

  await prisma.retentionPolicy.upsert({
    where: { id: "ret-hr" },
    update: {},
    create: {
      id: "ret-hr",
      organizationId: org.id,
      name: "Ressources Humaines",
      documentType: "hr",
      retentionYears: 5,
      dispositionAction: "DELETE",
      isActive: true,
    },
  });

  console.log("Retention policies created");

  await seedLegalData(prisma);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });