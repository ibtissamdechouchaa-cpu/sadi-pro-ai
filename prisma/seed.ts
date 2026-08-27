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
      title: "Loi n° 15-04 du 1 février 2015 relative à la signature et la certification électroniques",
      date: new Date("2015-02-01"),
      subject: "Signature et certification électroniques",
      description: "Régit la signature électronique, la certification et l'authentification des documents. Fondement du système Electronic Signature SADI PRO.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["legal", "contract", "electronic"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Loi 15-05",
      referenceType: "law",
      title: "Loi n° 15-05 du 16 février 2015 relative à la cybercriminalité liée aux TIC",
      date: new Date("2015-02-16"),
      subject: "Cybercriminalité et TIC",
      description: "Complète la lutte contre la cybercriminalité, protège les systèmes et données numériques. Utilisée pour la sécurité des archives numériques SADI PRO.",
      retentionRules: { minYears: 10, maxYears: 15, documentTypes: ["security", "digital", "compliance"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Loi 09-04",
      referenceType: "law",
      title: "Loi n° 09-04 du 5 août 2009 relative à la lutte contre la criminalité liée aux TIC",
      date: new Date("2009-08-05"),
      subject: "Criminalité TIC",
      description: "Première loi algérienne contre la criminalité informatique. Fondation de la sécurité des systèmes d'archivage.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["security", "digital"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Loi 18-05",
      referenceType: "law",
      title: "Loi n° 18-05 du 10 mai 2018 relative au commerce électronique",
      date: new Date("2018-05-10"),
      subject: "Commerce électronique",
      description: "Encadre les transactions et documents du commerce électronique. Référence pour les documents et contrats électroniques SADI PRO.",
      retentionRules: { minYears: 10, maxYears: 15, documentTypes: ["financial", "contract", "electronic"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "secure" },
      status: "active",
    },
    {
      referenceNumber: "Loi 98-04",
      referenceType: "law",
      title: "Loi n° 98-04 du 15 juin 1998 relative à la protection du patrimoine culturel",
      date: new Date("1998-06-15"),
      subject: "Patrimoine culturel",
      description: "Protège le patrimoine culturel et historique. Fondement pour le traitement des documents à valeur historique et patrimoniale en Permanent Archive.",
      retentionRules: { minYears: 50, maxYears: 100, documentTypes: ["heritage", "historical", "cultural"] },
      accessRules: { public: false, restrictedTo: ["admin", "manager"] },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Loi 90-30",
      referenceType: "law",
      title: "Loi n° 90-30 du 1 décembre 1990 relative aux domaines nationaux",
      date: new Date("1990-12-01"),
      subject: "Domaines nationaux",
      description: "Régit la protection des biens et domaines nationaux. Fondement pour la conservation des documents prouvant les droits et propriétés de l'État.",
      retentionRules: { minYears: 20, maxYears: 50, documentTypes: ["administrative", "property", "legal"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
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
      title: "Circulaire n° 22 du 16 juillet 2001 relative aux listes exhaustives des documents d'archives",
      date: new Date("2001-07-16"),
      subject: "Listes exhaustives des archives",
      description: "Établit les listes exhaustives des documents d'archives à constituer par les organismes publics.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["inventory", "archive"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 23",
      referenceType: "circular",
      title: "Circulaire n° 23 du 1 juillet 2003 relative à l'application de la fiche diagnostic des archives",
      date: new Date("2003-07-01"),
      subject: "Fiche diagnostic des archives",
      description: "Instaure la fiche diagnostic pour l'évaluation de l'état des archives et des locaux de conservation.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["diagnostic", "evaluation"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 26",
      referenceType: "circular",
      title: "Circulaire n° 26 de juillet 2007 relative à la communication des archives",
      date: new Date("2007-07-01"),
      subject: "Communication des archives",
      description: "Réglemente la communication et la consultation des archives, notamment les délais et conditions d'accès.",
      retentionRules: { minYears: 50, maxYears: 100, documentTypes: ["access", "communication"] },
      accessRules: { public: false, restrictedTo: ["admin", "heritage"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "heritage" },
      status: "active",
    },
    {
      referenceNumber: "Circulaire 29",
      referenceType: "circular",
      title: "Circulaire n° 29 du 27 octobre 2008 relative à l'agrément des entreprises privées d'archivage",
      date: new Date("2008-10-27"),
      subject: "Agrément entreprises privées d'archivage",
      description: "Définit les conditions d'agrément et de contrôle des prestataires privés d'archivage.",
      retentionRules: { minYears: 3, maxYears: 5, documentTypes: ["accreditation", "private"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: false, location: "central" },
      status: "active",
    },
    // DÉCISIONS — Spec §22 exact dates
    {
      referenceNumber: "Décision 10/06/1991",
      referenceType: "decision",
      title: "Décision du 10 juin 1991 relative à l'organisation des archives nationales",
      date: new Date("1991-06-10"),
      subject: "Organisation des archives nationales",
      description: "Décision fondatrice organisant les archives nationales et les modalités de collecte et conservation.",
      retentionRules: { minYears: 10, maxYears: 30, documentTypes: ["archive", "official"] },
      accessRules: { public: false, restrictedTo: ["admin"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Arrêté interministériel 20/02/2012",
      referenceType: "decision",
      title: "Arrêté interministériel du 20 février 2012 fixant les durées de conservation des documents administratifs",
      date: new Date("2012-02-20"),
      subject: "Durées de conservation",
      description: "Fixe les durées de conservation et les sorts finaux des documents administratifs courants.",
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["administrative"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Arrêté interministériel 07/10/2014",
      referenceType: "decision",
      title: "Arrêté interministériel du 7 octobre 2014 relatif à la numérisation et archivage électronique",
      date: new Date("2014-10-07"),
      subject: "Numérisation et archivage électronique",
      description: "Définit les normes de numérisation, de certification et d'archivage électronique opposable.",
      retentionRules: { minYears: 10, maxYears: 20, documentTypes: ["digital", "electronic"] },
      accessRules: { public: false, restrictedTo: ["admin", "IT"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "digital" },
      status: "active",
    },
    {
      referenceNumber: "Arrêté interministériel 08/05/2016",
      referenceType: "decision",
      title: "Arrêté interministériel du 8 mai 2016 relatif aux tableaux de gestion des archives",
      date: new Date("2016-05-08"),
      subject: "Tableaux de gestion",
      description: "Instaure les tableaux de gestion par secteur et les règles de tri et d'élimination.",
      retentionRules: { minYears: 5, maxYears: 15, documentTypes: ["procedure", "management"] },
      accessRules: { public: true },
      disposalRules: { requiresApproval: true, approvalRole: "manager" },
      archiveRules: { mandatory: true, location: "central" },
      status: "active",
    },
    {
      referenceNumber: "Arrêté interministériel 15/03/2023",
      referenceType: "decision",
      title: "Arrêté interministériel du 15 mars 2023 actualisant les durées de conservation et le versement aux archives historiques",
      date: new Date("2023-03-15"),
      subject: "Actualisation durées et versement",
      description: "Actualise les durées et précise les modalités de versement aux archives historiques pour le Permanent Archive.",
      retentionRules: { minYears: 10, maxYears: 50, documentTypes: ["heritage", "permanent"] },
      accessRules: { public: false, restrictedTo: ["admin", "heritage"] },
      disposalRules: { requiresApproval: true, approvalRole: "admin" },
      archiveRules: { mandatory: true, location: "heritage" },
      status: "active",
    },
  ];

  await prisma.legalReference.deleteMany({});
  for (const ref of legalRefs) {
    await prisma.legalReference.create({
      data: {
        ...ref,
        organizationId: null,
      },
    });
  }

  console.log("Seeded: 1 org, 3 users, 10 docs, 5 activities, 3 jobs, 3 notifications, 3 collections, 3 retention policies, 18 legal references");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
