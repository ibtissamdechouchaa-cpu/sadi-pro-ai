import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

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
      id: randomUUID(),
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
      id: randomUUID(),
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
      id: randomUUID(),
      email: "charlie@sadi-demo.com",
      fullName: "Charlie Tazi",
      avatarColor: "#10b981",
      role: "viewer",
      organizationId: org.id,
      passwordHash,
    },
  });

  const hr = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "HR" } },
    update: { color: "#8b5cf6" },
    create: { organizationId: org.id, name: "HR", color: "#8b5cf6" },
  });

  const engineering = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Engineering" } },
    update: { color: "#3b82f6" },
    create: { organizationId: org.id, name: "Engineering", color: "#3b82f6" },
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

  const legalRefs = [
    // LOIS FONDAMENTALES
    {
      referenceNumber: "Loi 88-09",
      referenceType: "law",
      title: "Loi n° 88-09 relative aux Archives",
      date: new Date("1988-07-25"),
      subject: "Archives publiques et privées",
      description: "Loi fondamentale régissant l'organisation, la gestion et la conservation des archives publiques et privées en Algérie.",
      retentionRules: { minYears: 10, maxYears: 50, documentTypes: ["archive", "contract", "official"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Loi 18-07",
      referenceType: "law",
      title: "Loi n° 18-07 relative à la cybersécurité et la protection des données à caractère personnel",
      date: new Date("2018-10-18"),
      subject: "Cybersécurité et protection des données personnelles",
      description: "Loi régissant la cybersécurité, la protection des données personnelles et la transformation numérique.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["personal_data", "digital", "compliance"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Loi 15-04",
      referenceType: "law",
      title: "Loi n° 15-04 relative à l'archéologie, à l'histoire et aux monuments historiques",
      date: new Date("2015-04-15"),
      subject: "Protection du patrimoine archéologique et historique",
      description: "Loi régissant la protection du patrimoine archéologique, historique et des monuments historiques.",
      retentionRules: { minYears: 50, maxYears: 100, documentTypes: ["heritage", "archaeological"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "heritage" },
      status: "active",
    },
    {
      referenceNumber: "Loi 15-05",
      referenceType: "law",
      title: "Loi n° 15-05 relative à l'organisation territoriale et au développement local",
      date: new Date("2015-04-15"),
      subject: "Organisation territoriale et développement local",
      description: "Loi régissant l'organisation territoriale, la décentralisation et le développement local.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["administrative", "local"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: false },
      archiveRules: { mandatory: true, location: "territorial" },
      status: "active",
    },
    {
      referenceNumber: "Loi 09-04",
      referenceType: "law",
      title: "Loi n° 09-04 relative à la décentralisation et à la participation citoyenne",
      date: new Date("2009-04-09"),
      subject: "Décentralisation et participation citoyenne",
      description: "Loi relative à la décentralisation et à la participation citoyenne.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["administrative", "decisions"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: false },
      archiveRules: { mandatory: true, location: "territorial" },
      status: "active",
    },
    {
      referenceNumber: "Loi 18-05",
      referenceType: "law",
      title: "Loi n° 18-05 relative à la protection et la promotion des langues et cultures nationales",
      date: new Date("2018-10-18"),
      subject: "Protection des langues et cultures nationales",
      description: "Loi relative à la protection et la promotion des langues et cultures nationales.",
      retentionRules: { minYears: 20, maxYears: 50, documentTypes: ["cultural", "linguistic"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "heritage" },
      status: "active",
    },
    {
      referenceNumber: "Loi 98-04",
      referenceType: "law",
      title: "Loi n° 98-04 relative à la statistique et à l'information statistique",
      date: new Date("1998-12-28"),
      subject: "Statistique et information statistique",
      description: "Loi relative à l'organisation de la statistique et de l'information statistique en Algérie.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["statistical", "data"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Loi 90-30",
      referenceType: "law",
      title: "Loi n° 90-30 relative à la réglementation des changes et des mouvements de capitaux",
      date: new Date("1990-12-28"),
      subject: "Réglementation des changes et mouvements de capitaux",
      description: "Loi relative à la réglementation des changes et des mouvements de capitaux.",
      retentionRules: { minYears: 10, maxYears: 15, documentTypes: ["financial", "exchange"] },
      accessRules: { public: false, restrictedTo: ["admin", "finance"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    // CIRCULAIRES
    {
      referenceNumber: "Circulaire 2",
      referenceType: "circular",
      title: "Circulaire n° 2 relative aux procédures d'archivage et de désaisissement",
      date: new Date("2002-01-01"),
      subject: "Procédures d'archivage et de désaisissement",
      description: "Circulaire détaillant les procédures d'archivage, de classement et de désaisissement des documents administratifs.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["procedure", "administrative"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 22",
      referenceType: "circular",
      title: "Circulaire n° 22 relative à la sécurité de l'information et à la protection des données",
      date: new Date("2010-01-01"),
      subject: "Sécurité de l'information et protection des données",
      description: "Circulaire définissant les mesures de sécurité de l'information et les procédures de protection des données.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["security", "data"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 23",
      referenceType: "circular",
      title: "Circulaire n° 23 relative à la dématérialisation des documents administratifs",
      date: new Date("2011-01-01"),
      subject: "Dématérialisation des documents administratifs",
      description: "Circulaire fixant les règles de dématérialisation, de numérisation et d'archivage électronique.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["digital", "electronic"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "digital" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 26",
      referenceType: "circular",
      title: "Circulaire n° 26 relative à la gestion des documents à valeur historique",
      date: new Date("2015-01-01"),
      subject: "Gestion des documents à valeur historique",
      description: "Circulaire définissant les critères d'identification et de gestion des documents à valeur historique.",
      retentionRules: { minYears: 50, maxYears: 100, documentTypes: ["historical", "heritage"] },
      accessRules: { public: false, restrictedTo: ["admin", "heritage"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "heritage" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 29",
      referenceType: "circular",
      title: "Circulaire n° 29 relative aux procédures de désaisissement et destruction des documents",
      date: new Date("2018-01-01"),
      subject: "Procédures de désaisissement et destruction",
      description: "Circulaire détaillant les procédures de désaisissement et de destruction des documents arrivés en fin de rétention.",
      retentionRules: { minYears: 3, maxYears: 5, documentTypes: ["disposal", "destruction"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: false, location: "central" },
      status: "active",
    },
    // DÉCISIONS
    {
      referenceNumber: "Décision DG/2024/001",
      referenceType: "decision",
      title: "Décision du Directeur Général n° 2024/001 relative aux normes d'archivage numérique",
      date: new Date("2024-01-15"),
      subject: "Normes d'archivage numérique",
      description: "Décision fixant les normes techniques pour l'archivage numérique, y compris les formats et métadonnées.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["digital", "technical"] },
      accessRules: { public: false, restrictedTo: ["admin", "IT"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "digital" },
      status: "active",
    },
    {
      referenceNumber: "Décision DG/2024/002",
      referenceType: "decision",
      title: "Décision du Directeur Général n° 2024/002 relative aux procédures d'audit d'archivage",
      date: new Date("2024-02-01"),
      subject: "Procédures d'audit d'archivage",
      description: "Décision définissant les procédures d'audit et de contrôle qualité pour les systèmes d'archivage.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["audit", "procedure"] },
      accessRules: { public: false, restrictedTo: ["admin", "audit"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Décision DG/2024/003",
      referenceType: "decision",
      title: "Décision du Directeur Général n° 2024/003 relative à la classification des documents sensibles",
      date: new Date("2024-03-01"),
      subject: "Classification des documents sensibles",
      description: "Décision fixant les critères de classification des documents sensibles et les procédures de protection.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["confidential", "sensitive"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Décision DG/2024/004",
      referenceType: "decision",
      title: "Décision du Directeur Général n° 2024/004 relative aux protocoles de numérisation",
      date: new Date("2024-04-01"),
      subject: "Protocoles de numérisation",
      description: "Décision définissant les protocoles techniques de numérisation des documents papier.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["digitization", "technical"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "digital" },
      status: "active",
    },
    {
      referenceNumber: "Décision DG/2024/005",
      referenceType: "decision",
      title: "Décision du Directeur Général n° 2024/005 relative aux obligations de formation en archivage",
      date: new Date("2024-05-01"),
      subject: "Obligations de formation en archivage",
      description: "Décision imposant des obligations de formation continue pour le personnel chargé des archives.",
      retentionRules: { minYears: 3, maxYears: 5, documentTypes: ["training", "personnel"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: false },
      archiveRules: { mandatory: false, location: "central" },
      status: "active",
    },
  ];

  for (const ref of legalRefs) {
    try {
      await prisma.legalReference.create({
        data: {
          ...ref,
          organizationId: null,
        },
      });
    } catch (e) {
      // Skip if duplicate
    }
  }

  console.log("Seeded: 1 org, 3 users, 10 docs, 5 activities, 3 jobs, 3 notifications, 3 collections, 3 retention policies, 18 legal references");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
