import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const org = await prisma.organization.upsert({
    where: { slug: "sadi-demo" },
    update: {},
    create: {
      name: "SADI PRO Demo",
      slug: "sadi-demo",
      industry: "Technology",
      country: "Morocco",
      maxUsers: 50,
      maxStorageBytes: BigInt(10737418240),
      maxDocuments: 50000,
    },
  });

  const alice = await prisma.profile.upsert({
    where: { email: "alice@sadi-demo.com" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "alice@sadi-demo.com",
      fullName: "Alice Ezzat",
      avatarColor: "#8b5cf6",
      role: "admin",
      organizationId: org.id,
      passwordHash,
    },
  });

  const bob = await prisma.profile.upsert({
    where: { email: "bob@sadi-demo.com" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "bob@sadi-demo.com",
      fullName: "Bob Alami",
      avatarColor: "#3b82f6",
      role: "manager",
      organizationId: org.id,
      passwordHash,
    },
  });

  const charlie = await prisma.profile.upsert({
    where: { email: "charlie@sadi-demo.com" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "charlie@sadi-demo.com",
      fullName: "Charlie Tazi",
      avatarColor: "#10b981",
      role: "viewer",
      organizationId: org.id,
      passwordHash,
    },
  });

  const hr = await prisma.department.create({
    data: { organizationId: org.id, name: "HR", color: "#8b5cf6" },
  });

  const engineering = await prisma.department.create({
    data: { organizationId: org.id, name: "Engineering", color: "#3b82f6" },
  });

  const now = new Date();
  const docData = [
    { title: "Employee Handbook 2024", type: "policy", departmentId: hr.id, classification: "confidential", status: "completed", pageCount: 45, tags: ["hr", "policy", "2024"], uploadedBy: alice.id },
    { title: "Technical Architecture Doc", type: "technical", departmentId: engineering.id, classification: "internal", status: "completed", pageCount: 32, tags: ["architecture", "technical"], uploadedBy: bob.id },
    { title: "Q4 Financial Report", type: "financial", classification: "confidential", status: "completed", pageCount: 18, tags: ["finance", "q4", "2024"], uploadedBy: alice.id },
    { title: "Brand Guidelines", type: "other", classification: "public", status: "completed", pageCount: 24, tags: ["brand", "design"], uploadedBy: charlie.id },
    { title: "API Documentation v2", type: "technical", departmentId: engineering.id, classification: "internal", status: "completed", pageCount: 56, tags: ["api", "docs", "v2"], uploadedBy: bob.id },
    { title: "Customer Onboarding SOP", type: "policy", departmentId: hr.id, classification: "internal", status: "completed", pageCount: 12, tags: ["onboarding", "sop"], uploadedBy: alice.id },
    { title: "Server Migration Plan", type: "technical", departmentId: engineering.id, classification: "secret", status: "processing", pageCount: 28, tags: ["migration", "infrastructure"], uploadedBy: bob.id },
    { title: "Annual Leave Policy", type: "policy", departmentId: hr.id, classification: "public", status: "completed", pageCount: 8, tags: ["leave", "policy"], uploadedBy: alice.id },
    { title: "Marketing Strategy 2024", type: "other", classification: "confidential", status: "draft", pageCount: 35, tags: ["marketing", "strategy"], uploadedBy: charlie.id },
    { title: "Security Audit Report", type: "technical", classification: "secret", status: "completed", pageCount: 42, tags: ["security", "audit"], uploadedBy: bob.id },
  ];

  const docs = [];
  for (let i = 0; i < docData.length; i++) {
    const d = docData[i];
    const daysAgo = 30 - i * 3;
    const doc = await prisma.document.create({
      data: {
        organizationId: org.id,
        title: d.title,
        type: d.type,
        departmentId: d.departmentId || null,
        classification: d.classification,
        status: d.status,
        pageCount: d.pageCount,
        tags: d.tags,
        uploadedBy: d.uploadedBy,
        uploadedAt: new Date(now.getTime() - daysAgo * 86400000),
        modifiedAt: new Date(now.getTime() - daysAgo * 86400000),
        fileSize: BigInt(d.pageCount * 50000),
      },
    });
    docs.push(doc);
  }

  const activities = [
    { userId: alice.id, userName: alice.fullName, action: "uploaded", resource: docs[0].title, icon: "Upload" },
    { userId: bob.id, userName: bob.fullName, action: "approved", resource: docs[1].title, icon: "CheckCircle" },
    { userId: charlie.id, userName: charlie.fullName, action: "commented on", resource: docs[2].title, icon: "MessageSquare" },
    { userId: alice.id, userName: alice.fullName, action: "modified", resource: docs[3].title, icon: "FileEdit" },
    { userId: bob.id, userName: bob.fullName, action: "shared", resource: docs[4].title, icon: "Share2" },
  ];

  for (const a of activities) {
    await prisma.activityEvent.create({
      data: {
        organizationId: org.id,
        userId: a.userId,
        userName: a.userName,
        action: a.action,
        resource: a.resource,
        icon: a.icon,
        createdAt: new Date(now.getTime() - Math.random() * 7 * 86400000),
      },
    });
  }

  const jobs = [
    { documentId: docs[6].id, documentName: docs[6].title, stage: "ocr", progress: 65 },
    { documentId: docs[8].id, documentName: docs[8].title, stage: "embedding", progress: 30 },
    { documentId: docs[2].id, documentName: docs[2].title, stage: "classification", progress: 100 },
  ];

  for (const j of jobs) {
    await prisma.processingJob.create({
      data: {
        organizationId: org.id,
        documentId: j.documentId,
        documentName: j.documentName,
        stage: j.stage,
        progress: j.progress,
      },
    });
  }

  const notifications = [
    { userId: alice.id, type: "info", title: "Document processed", message: "Your document has been fully indexed" },
    { userId: alice.id, type: "warning", title: "Retention review needed", message: "3 documents are expiring soon" },
    { userId: alice.id, type: "success", title: "Batch upload complete", message: "10 files uploaded successfully" },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        organizationId: org.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
      },
    });
  }

  await prisma.collection.createMany({
    data: [
      { organizationId: org.id, name: "HR Policies", description: "All HR-related policies and procedures" },
      { organizationId: org.id, name: "Technical Specs", isAiSuggested: true, description: "AI-suggested technical documents" },
      { organizationId: org.id, name: "Compliance Docs", description: "Documents required for compliance" },
    ],
  });

  await prisma.retentionPolicy.createMany({
    data: [
      { organizationId: org.id, name: "Financial Records", retentionYears: 7, documentType: "financial", jurisdiction: "Morocco", dispositionAction: "archive" },
      { organizationId: org.id, name: "HR Documents", retentionYears: 5, documentType: "policy", jurisdiction: "Morocco", dispositionAction: "delete" },
      { organizationId: org.id, name: "Technical Specs", retentionYears: 3, documentType: "technical", jurisdiction: "Morocco", dispositionAction: "delete" },
    ],
  });

  console.log("Seeded: 1 org, 3 users, 10 docs, 5 activities, 3 jobs, 3 notifications, 3 collections, 3 retention policies");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
