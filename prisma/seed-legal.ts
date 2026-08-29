import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

export async function seedLegalData(prisma: PrismaClient) {
  console.log("🌱 Seeding legal data...");

  // ==========================================
  // 1. LEGAL SOURCES
  // ==========================================
  console.log("📋 Seeding legal sources...");

  const legalSources = [
    {
      name: "Journal Officiel Algérien",
      nameAr: "الجريدة الرسمية الجزائرية",
      url: "https://www.joradp.dz",
      sourceType: "OFFICIAL_JOURNAL",
      priority: 1,
      reliability: 5,
    },
    {
      name: "Portail du Droit Algérien",
      nameAr: "بوابة القانون الجزائري",
      url: "https://www.mjustice.dz",
      sourceType: "LEGAL_PORTAL",
      priority: 2,
      reliability: 5,
    },
    {
      name: "Site de l'Amirat",
      nameAr: "موقع الأمانة العامة للحكومة",
      url: "https://www.mprimat.gov.dz",
      sourceType: "MINISTRY",
      priority: 3,
      reliability: 5,
    },
    {
      name: "ISO",
      nameAr: "المنظمة الدولية للمعايير",
      url: "https://www.iso.org",
      sourceType: "ISO",
      priority: 5,
      reliability: 5,
    },
  ];

  for (const source of legalSources) {
    await prisma.legalSource.upsert({
      where: { name: source.name },
      update: source,
      create: source,
    });
    console.log(`  ✅ Source: ${source.name}`);
  }

  // ==========================================
  // 2. LEGAL REFERENCES - LAWS
  // ==========================================
  console.log("📜 Seeding legal references (laws)...");

  const laws = [
    {
      referenceNumber: "88-09",
      referenceType: "law",
      title: "Loi n° 88-09 du 25 juin 1988 relative aux archives nationales",
      titleAr: "القانون رقم 88-09 المؤرخ في 25 يونيو 1988 المتعلق بالأرشيف الوطني",
      titleFr: "Loi n° 88-09 du 25 juin 1988 relative aux archives nationales",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel n° 25",
      officialGazetteNumber: "25",
      issuingAuthority: "Présidence de la République",
      keywords: ["أرشيف", "أرشيف وطني", "وثائق", "archivage", "archives"],
      retentionRules: {
        minYears: 10,
        maxYears: 100,
        documentTypes: ["administrative", "financial", "legal"],
      },
      description:
        "Loi organique réglementant la gestion des archives nationales, la classification des documents, les délais de conservation et les conditions d'accès.",
    },
    {
      referenceNumber: "18-07",
      referenceType: "law",
      title:
        "Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
      titleAr: "القانون رقم 18-07 المتعلق بالحماية العامة لبيانات شخصية طبيعة",
      titleFr:
        "Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
      domain: "PERSONAL_DATA",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel n° 34",
      issuingAuthority: "Présidence de la République",
      keywords: [
        "حماية البيانات",
        "خصوصية",
        "بيانات شخصية",
        "protection des données",
      ],
      retentionRules: {
        minYears: 2,
        maxYears: 10,
        documentTypes: ["personal_data", "consent", "processing_log"],
      },
      description:
        "Loi relative à la protection des personnes physiques dans le traitement des données à caractère personnel.",
    },
    {
      referenceNumber: "15-04",
      referenceType: "law",
      title:
        "Loi n° 15-04 du 30 décembre 2015 relative à la signature électronique et à la certification",
      titleAr: "القانون رقم 15-04 المتعلق بالتوقيع الإلكتروني والتوثيق",
      titleFr:
        "Loi n° 15-04 du 30 décembre 2015 relative à la signature électronique et à la certification",
      domain: "E_SIGNATURE",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: [
        "توقيع إلكتروني",
        "توثيق",
        "شهادة رقمية",
        "signature électronique",
      ],
      description:
        "Loi réglementant la signature électronique et les services de certification.",
    },
    {
      referenceNumber: "09-04",
      referenceType: "law",
      title:
        "Loi n° 09-04 du 25 août 2009 relative à la répression des infractions liées aux technologies de l'information et de la communication",
      titleAr:
        "القانون رقم 09-04 المؤرخ في 5 أغسطس 2009 المتعلق بمكافحة جرائم تكنولوجيا المعلومات",
      titleFr:
        "Loi n° 09-04 du 25 août 2009 relative à la répression des infractions liées aux technologies de l'information et de la communication",
      domain: "CYBERSECURITY",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: [
        "جريمة إلكترونية",
        "أمن المعلومات",
        "تكنولوجيا المعلومات",
        "cybersécurité",
      ],
      description:
        "Loi relative à la répression des infractions liées aux technologies de l'information et de la communication.",
    },
    {
      referenceNumber: "18-05",
      referenceType: "law",
      title: "Loi n° 18-05 du 10 juin 2018 relative au commerce électronique",
      titleAr: "القانون رقم 18-05 المتعلق بالتجارة الإلكترونية",
      titleFr:
        "Loi n° 18-05 du 10 juin 2018 relative au commerce électronique",
      domain: "E_COMMERCE",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: ["تجارة إلكترونية", "تجارة رقمية", "commerce électronique"],
      description:
        "Loi relative au commerce électronique et aux transactions numériques.",
    },
    {
      referenceNumber: "98-04",
      referenceType: "law",
      title:
        "Loi n° 98-04 du 15 juin 1998 relative à la protection du patrimoine culturel",
      titleAr:
        "القانون 98-04 المؤرخ في 15 يونيو 1998 المتعلق بحماية التراث الثقافي",
      titleFr:
        "Loi n° 98-04 du 15 juin 1998 relative à la protection du patrimoine culturel",
      domain: "CULTURAL_HERITAGE",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: ["تراث ثقافي", "تراث تاريخي", "patrimoine culturel"],
      description:
        "Loi relative à la protection du patrimoine culturel algérien.",
    },
    {
      referenceNumber: "90-30",
      referenceType: "law",
      title:
        "Loi n° 90-30 du 1er décembre 1990 relative aux biens nationaux",
      titleAr:
        "القانون 90-30 المؤرخ في 1 ديسمبر 1990 المتعلق بالمجالس الوطنية",
      titleFr:
        "Loi n° 90-30 du 1er décembre 1990 relative aux biens nationaux",
      domain: "PUBLIC_PROPERTY",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: ["ممتلكات الدولة", "حقوق ملكية", "biens nationaux"],
      description:
        "Loi relative aux biens nationaux et à la gestion du patrimoine public.",
    },
    {
      referenceNumber: "18-04",
      referenceType: "law",
      title:
        "Loi n° 18-04 du 10 juin 2018 relative aux communications électroniques",
      titleAr: "القانون رقم 18-04 المتعلق بالاتصالات الإلكترونية",
      titleFr:
        "Loi n° 18-04 du 10 juin 2018 relative aux communications électroniques",
      domain: "OTHER",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      keywords: [
        "اتصالات إلكترونية",
        "communicating",
        "communications électroniques",
      ],
      description:
        "Loi relative aux communications électroniques et aux télécommunications.",
    },
  ];

  for (const law of laws) {
    await prisma.legalReference.upsert({
      where: { referenceNumber: law.referenceNumber },
      update: law,
      create: law,
    });
    console.log(`  ✅ Law: ${law.referenceNumber} - ${law.title}`);
  }

  // ==========================================
  // 3. LEGAL REFERENCES - CIRCULARS
  // ==========================================
  console.log("📜 Seeding legal references (circulars)...");

  const circulars = [
    {
      referenceNumber: "Circulaire 2",
      referenceType: "circular",
      title: "Circulaire n° 2 relative aux procédures d'archivage",
      titleAr: "المنشور رقم 2 المتعلق بإجراءات الأرشيف",
      titleFr: "Circulaire n° 2 relative aux procédures d'archivage",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: ["أرشيف", "إجراءات", "archivage", "procédures"],
      description:
        "Circulaire définissant les procédures d'archivage des documents administratifs.",
    },
    {
      referenceNumber: "Circulaire 22",
      referenceType: "circular",
      title:
        "Circulaire n° 22 du 16 juillet 2001 relative aux listes générales des documents d'archives",
      titleAr:
        "المنشور رقم 22 المؤرخ في 16 يوليو 2001 المتعلق بالقوائم الشاملة للوثائق الأرشيفية",
      titleFr:
        "Circulaire n° 22 du 16 juillet 2001 relative aux listes générales des documents d'archives",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: [
        "قوائم أرشيفية",
        "وثائق",
        "listes d'archives",
        "documents",
      ],
      description:
        "Circulaire relative à l'établissement des listes générales des documents d'archives.",
    },
    {
      referenceNumber: "Circulaire 23",
      referenceType: "circular",
      title:
        "Circulaire n° 23 du 1er juillet 2003 relative à la fiche de diagnostic d'archives",
      titleAr:
        "المنشور رقم 23 المؤرخ في 1 يوليو 2003 المتعلق ببطاقة تشخيص الأرشيف",
      titleFr:
        "Circulaire n° 23 du 1er juillet 2003 relative à la fiche de diagnostic d'archives",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: ["تشخيص", "بطاقة", "diagnostic", "fiche"],
      description:
        "Circulaire relative à l'utilisation de la fiche de diagnostic pour l'évaluation des archives.",
    },
    {
      referenceNumber: "Circulaire 26",
      referenceType: "circular",
      title:
        "Circulaire n° 26 de juillet 2007 relative à la communication avec les archives",
      titleAr:
        "المنشور رقم 26 المؤرخ في يوليو 2007 المتعلق بالتواصل مع الأرشيف",
      titleFr:
        "Circulaire n° 26 de juillet 2007 relative à la communication avec les archives",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: ["تواصل", "أرشيف", "communication", "archives"],
      description:
        "Circulaire relative aux modalités de communication des documents d'archives.",
    },
    {
      referenceNumber: "Circulaire 29",
      referenceType: "circular",
      title:
        "Circulaire n° 29 du 27 octobre 2008 relative à l'agrément des sociétés d'archives privées",
      titleAr:
        "المنشور رقم 29 المؤرخ في 27 أكتوبر 2008 المتعلق باعتماد شركات الأرشيف الخاصة",
      titleFr:
        "Circulaire n° 29 du 27 octobre 2008 relative à l'agrément des sociétés d'archives privées",
      domain: "ARCHIVES",
      status: "UNVERIFIED",
      isGlobal: true,
      organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: ["اعتماد", "شركات خاصة", "agrément", "sociétés privées"],
      description:
        "Circulaire relative aux conditions d'agrément des sociétés privées d'archivage.",
    },
  ];

  for (const circular of circulars) {
    await prisma.legalReference.upsert({
      where: { referenceNumber: circular.referenceNumber },
      update: circular,
      create: circular,
    });
    console.log(
      `  ✅ Circular: ${circular.referenceNumber} - ${circular.title}`
    );
  }

  // ==========================================
  // 4. LEGAL REFERENCES - INTERNATIONAL STANDARDS
  // ==========================================
  console.log(
    "📜 Seeding legal references (international standards)..."
  );

  const internationalStandards = [
    {
      referenceNumber: "ISO 15489-1",
      referenceType: "international_standard",
      title:
        "ISO 15489-1:2016 Information and documentation — Records management",
      titleAr: "ISO 15489-1:2016 إدارة المعلومات والتوثيق — إدارة السجلات",
      titleFr:
        "ISO 15489-1:2016 Information et documentation — Gestion des archives",
      domain: "DOCUMENT_MANAGEMENT",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["إدارة سجلات", "records management", "ISO 15489"],
      description:
        "International standard for records management principles and responsibilities.",
    },
    {
      referenceNumber: "ISO 16175",
      referenceType: "international_standard",
      title:
        "ISO 16175:2010 Information and documentation — Guidelines and functional requirements for records in electronic office environments",
      titleAr:
        "ISO 16175:2010 إدارة المعلومات والتوثيق — إرشادات ومتطلبات وظيفية للسجلات في بيئات المكتب الإلكترونية",
      titleFr:
        "ISO 16175:2010 Information et documentation — Lignes directrices et exigences fonctionnelles pour les archives dans les environnements de bureau électroniques",
      domain: "DOCUMENT_MANAGEMENT",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "سجلات إلكترونية",
        "بيئة مكتبية",
        "electronic records",
        "office environments",
      ],
      description:
        "Guidelines and functional requirements for records in electronic office environments.",
    },
    {
      referenceNumber: "ISO 23081",
      referenceType: "international_standard",
      title:
        "ISO 23081-1:2004 Information and documentation — Records management processes — Metadata",
      titleAr:
        "ISO 23081-1:2004 إدارة المعلومات والتوثيق — عمليات إدارة السجلات — البيانات الوصفية",
      titleFr:
        "ISO 23081-1:2004 Information et documentation — Processus de gestion des archives — Métadonnées",
      domain: "DOCUMENT_MANAGEMENT",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "بيانات وصفية",
        "metadata",
        "إدارة سجلات",
        "records management",
      ],
      description:
        "Records management processes — Metadata for records.",
    },
    {
      referenceNumber: "ISO 30301",
      referenceType: "international_standard",
      title:
        "ISO 30301:2011 Information and documentation — Management systems for records",
      titleAr:
        "ISO 30301:2011 إدارة المعلومات والتوثيق — أنظمة إدارة السجلات",
      titleFr:
        "ISO 30301:2011 Information et documentation — Systèmes de management pour les archives",
      domain: "DOCUMENT_MANAGEMENT",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "نظام إدارة",
        "إدارة سجلات",
        "management system",
        "records management",
      ],
      description:
        "Management systems for records — Requirements.",
    },
    {
      referenceNumber: "ISO/IEC 27001",
      referenceType: "international_standard",
      title:
        "ISO/IEC 27001:2022 Information security, cybersecurity and privacy protection",
      titleAr:
        "ISO/IEC 27001:2022 أمن المعلومات والأمن السيبراني وحماية الخصوصية",
      titleFr:
        "ISO/IEC 27001:2022 Sécurité de l'information, cybersécurité et protection de la vie privée",
      domain: "CYBERSECURITY",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "أمن المعلومات",
        "أمن سيبراني",
        "information security",
        "cybersecurity",
      ],
      description:
        "Information security, cybersecurity and privacy protection — Requirements.",
    },
    {
      referenceNumber: "ISO/IEC 27002",
      referenceType: "international_standard",
      title: "ISO/IEC 27002:2022 Information security controls",
      titleAr: "ISO/IEC 27002:2022 ضوابط أمن المعلومات",
      titleFr:
        "ISO/IEC 27002:2022 Contrôles de la sécurité de l'information",
      domain: "CYBERSECURITY",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "ضوابط أمنية",
        "security controls",
        "أمن المعلومات",
        "information security",
      ],
      description:
        "Information security controls — Guidance.",
    },
    {
      referenceNumber: "ISO/IEC 27701",
      referenceType: "international_standard",
      title:
        "ISO/IEC 27701:2019 Privacy information management",
      titleAr: "ISO/IEC 27701:2019 إدارة معلومات الخصوصية",
      titleFr:
        "ISO/IEC 27701:2019 Gestion des informations de confidentialité",
      domain: "PERSONAL_DATA",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      jurisdiction: "International",
      officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: [
        "إدارة الخصوصية",
        "حماية البيانات",
        "privacy management",
        "data protection",
      ],
      description:
        "Privacy information management — Requirements and guidance.",
    },
  ];

  for (const standard of internationalStandards) {
    await prisma.legalReference.upsert({
      where: { referenceNumber: standard.referenceNumber },
      update: standard,
      create: standard,
    });
    console.log(
      `  ✅ Standard: ${standard.referenceNumber} - ${standard.title}`
    );
  }

  // ==========================================
  // 5. LEGAL REFERENCES - FOREIGN REGULATION (GDPR)
  // ==========================================
  console.log("📜 Seeding legal references (foreign regulations)...");

  const foreignRegulations = [
    {
      referenceNumber: "GDPR",
      referenceType: "international_standard",
      title: "General Data Protection Regulation (EU) 2016/679",
      titleAr: "لائحة حماية البيانات العامة (الاتحاد الأوروبي) 2016/679",
      titleFr:
        "Règlement général sur la protection des données (UE) 2016/679",
      jurisdiction: "European Union",
      domain: "PERSONAL_DATA",
      status: "ACTIVE",
      isGlobal: true,
      organizationId: null,
      officialSource: "Official Journal of the European Union",
      issuingAuthority: "European Parliament and Council",
      keywords: ["حماية البيانات", "خصوصية", "GDPR", "RGPD"],
      description:
        "European Union regulation on the protection of natural persons with regard to the processing of personal data.",
    },
  ];

  for (const regulation of foreignRegulations) {
    await prisma.legalReference.upsert({
      where: { referenceNumber: regulation.referenceNumber },
      update: regulation,
      create: regulation,
    });
    console.log(
      `  ✅ Regulation: ${regulation.referenceNumber} - ${regulation.title}`
    );
  }

  // ==========================================
  // 6. LEGAL HOLD RECORDS (empty for now)
  // ==========================================
  console.log("🔒 Seeding legal hold records (empty)...");
  console.log("  ⏭️  No legal hold records to seed");

  // ==========================================
  // 7. COMPLIANCE FRAMEWORKS
  // ==========================================
  console.log("📊 Seeding compliance frameworks...");

  const frameworks = [
    {
      name: "ISO 15489 Records Management",
      nameAr: "إدارة السجلات ISO 15489",
      code: "ISO15489",
      type: "ISO",
      jurisdiction: "International",
      version: "2016",
      description:
        "International standard for records management principles and responsibilities",
    },
    {
      name: "ISO/IEC 27001 Information Security",
      nameAr: "أمن المعلومات ISO/IEC 27001",
      code: "ISO27001",
      type: "ISO",
      jurisdiction: "International",
      version: "2022",
      description: "Information security management systems requirements",
    },
    {
      name: "ISO/IEC 27701 Privacy",
      nameAr: "الخصوصية ISO/IEC 27701",
      code: "ISO27701",
      type: "ISO",
      jurisdiction: "International",
      version: "2019",
      description: "Privacy information management system",
    },
    {
      name: "Algerian Archives Law",
      nameAr: "قانون الأرشيف الجزائري",
      code: "DZ-ARCHIVES",
      type: "ALGERIAN_LAW",
      jurisdiction: "Algeria",
      version: "1988",
      description: "Algerian law governing national archives management",
    },
    {
      name: "Algerian Data Protection",
      nameAr: "حماية البيانات الشخصية الجزائرية",
      code: "DZ-DATAPROTECT",
      type: "ALGERIAN_LAW",
      jurisdiction: "Algeria",
      version: "2018",
      description: "Algerian law on personal data protection",
    },
  ];

  const createdFrameworks: Record<string, string> = {};

  for (const framework of frameworks) {
    const upserted = await prisma.complianceFramework.upsert({
      where: { code: framework.code },
      update: framework,
      create: framework,
    });
    createdFrameworks[framework.code] = upserted.id;
    console.log(
      `  ✅ Framework: ${framework.code} - ${framework.name}`
    );
  }

  // ==========================================
  // 8. COMPLIANCE REQUIREMENTS - ISO 15489
  // ==========================================
  console.log(
    "📋 Seeding compliance requirements (ISO 15489)..."
  );

  const iso15489Requirements = [
    {
      code: "RM-01",
      title: "Records Management Policy",
      titleAr: "سياسة إدارة السجلات",
      description:
        "Organization shall establish and maintain a records management policy",
      category: "GOVERNANCE",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Document and maintain a formal records management policy",
    },
    {
      code: "RM-02",
      title: "Records Responsibility",
      titleAr: "مسؤولية إدارة السجلات",
      description: "Define roles and responsibilities for records management",
      category: "GOVERNANCE",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "DOCUMENT",
      implementationGuidance:
        "Create roles and responsibility matrix for records management",
    },
    {
      code: "RM-03",
      title: "Records Inventory",
      titleAr: "جرد السجلات",
      description: "Maintain an inventory of records systems",
      category: "IDENTIFICATION",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Develop and maintain a comprehensive records inventory",
    },
    {
      code: "RM-04",
      title: "Classification Scheme",
      titleAr: "مخطط التصنيف",
      description: "Establish classification system for records",
      category: "IDENTIFICATION",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Implement a standardized classification scheme for all records",
    },
    {
      code: "RM-05",
      title: "Records Capture",
      titleAr: "التقاط السجلات",
      description: "Records shall be captured at the point of creation",
      category: "CAPTURE",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Ensure records are captured at the point of creation or receipt",
    },
    {
      code: "RM-06",
      title: "Access Controls",
      titleAr: "ضوابط الوصول",
      description: "Access to records shall be controlled and managed",
      category: "SECURITY",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement role-based access controls for records management systems",
    },
    {
      code: "RM-07",
      title: "Retention Schedule",
      titleAr: "جدول الاحتفاظ",
      description: "Establish and maintain retention schedules",
      category: "RETENTION",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Develop and maintain retention schedules for all record types",
    },
    {
      code: "RM-08",
      title: "Disposition Authority",
      titleAr: "صلاحية الإتلاف",
      description: "Disposition of records must be authorized",
      category: "DISPOSITION",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Establish authorization process for records disposition",
    },
    {
      code: "RM-09",
      title: "Audit Trail",
      titleAr: "سجل التدقيق",
      description:
        "Maintain audit trails for records management activities",
      category: "AUDIT",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "AUDIT_LOG",
      implementationGuidance:
        "Implement comprehensive audit trail logging for all records activities",
    },
    {
      code: "RM-10",
      title: "Disaster Recovery",
      titleAr: "التعافي من الكوارث",
      description: "Ensure records are protected against disasters",
      category: "SECURITY",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement disaster recovery procedures for records protection",
    },
  ];

  const iso15489FrameworkId = createdFrameworks["ISO15489"];

  for (const req of iso15489Requirements) {
    await prisma.complianceRequirement.upsert({
      where: {
        code_frameworkId: {
          code: req.code,
          frameworkId: iso15489FrameworkId,
        },
      },
      update: {
        ...req,
        frameworkId: iso15489FrameworkId,
      },
      create: {
        ...req,
        frameworkId: iso15489FrameworkId,
      },
    });
    console.log(`  ✅ Requirement: ${req.code} - ${req.title}`);
  }

  // ==========================================
  // 9. COMPLIANCE REQUIREMENTS - ISO 27001
  // ==========================================
  console.log(
    "📋 Seeding compliance requirements (ISO 27001)..."
  );

  const iso27001Requirements = [
    {
      code: "IS-01",
      title: "Information Security Policy",
      titleAr: "سياسة أمن المعلومات",
      description:
        "Organization shall establish an information security policy",
      category: "GOVERNANCE",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Document and maintain a formal information security policy",
    },
    {
      code: "IS-02",
      title: "Risk Assessment",
      titleAr: "تقييم المخاطر",
      description:
        "Conduct regular risk assessments for information assets",
      category: "GOVERNANCE",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "DOCUMENT",
      implementationGuidance:
        "Implement risk assessment methodology and conduct regular assessments",
    },
    {
      code: "IS-03",
      title: "Access Control",
      titleAr: "ضوابط الوصول",
      description:
        "Implement access control policies and procedures",
      category: "ACCESS",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement role-based access control with principle of least privilege",
    },
    {
      code: "IS-04",
      title: "Cryptography",
      titleAr: "التشفير",
      description:
        "Implement cryptographic controls for data protection",
      category: "CRYPTOGRAPHY",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement encryption for data at rest and in transit",
    },
    {
      code: "IS-05",
      title: "Physical Security",
      titleAr: "الأمن المادي",
      description:
        "Implement physical security controls for facilities",
      category: "PHYSICAL",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement physical access controls and environmental protections",
    },
    {
      code: "IS-06",
      title: "Operations Security",
      titleAr: "أمن العمليات",
      description:
        "Implement operational security procedures",
      category: "OPERATIONS",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "DOCUMENT",
      implementationGuidance:
        "Develop and maintain operational security procedures and guidelines",
    },
    {
      code: "IS-07",
      title: "Backup and Recovery",
      titleAr: "النسخ الاحتياطي والتعافي",
      description:
        "Implement backup and recovery procedures",
      category: "CONTINUITY",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement regular backup procedures and test recovery processes",
    },
  ];

  const iso27001FrameworkId = createdFrameworks["ISO27001"];

  for (const req of iso27001Requirements) {
    await prisma.complianceRequirement.upsert({
      where: {
        code_frameworkId: {
          code: req.code,
          frameworkId: iso27001FrameworkId,
        },
      },
      update: {
        ...req,
        frameworkId: iso27001FrameworkId,
      },
      create: {
        ...req,
        frameworkId: iso27001FrameworkId,
      },
    });
    console.log(`  ✅ Requirement: ${req.code} - ${req.title}`);
  }

  // ==========================================
  // 10. COMPLIANCE REQUIREMENTS - DZ-ARCHIVES
  // ==========================================
  console.log(
    "📋 Seeding compliance requirements (DZ-ARCHIVES)..."
  );

  const dzArchivesRequirements = [
    {
      code: "DZA-01",
      title: "Archives Management Policy",
      titleAr: "سياسة إدارة الأرشيف",
      description:
        "Establish archives management policy compliant with Law 88-09",
      category: "GOVERNANCE",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Develop archives management policy aligned with Law 88-09 requirements",
    },
    {
      code: "DZA-02",
      title: "Document Classification",
      titleAr: "تصنيف الوثائق",
      description:
        "Classify documents according to national archives standards",
      category: "IDENTIFICATION",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Implement document classification per national archives guidelines",
    },
    {
      code: "DZA-03",
      title: "Retention Periods",
      titleAr: "فترات الاحتفاظ",
      description:
        "Apply retention periods as defined by Law 88-09",
      category: "RETENTION",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Configure retention schedules per Law 88-09 requirements",
    },
    {
      code: "DZA-04",
      title: "Access to Archives",
      titleAr: "الوصول إلى الأرشيف",
      description:
        "Control access to archived documents",
      category: "SECURITY",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement access controls for archived documents",
    },
    {
      code: "DZA-05",
      title: "Archives Preservation",
      titleAr: "حفظ الأرشيف",
      description:
        "Ensure proper preservation of archived documents",
      category: "SECURITY",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement preservation measures for long-term document retention",
    },
  ];

  const dzArchivesFrameworkId = createdFrameworks["DZ-ARCHIVES"];

  for (const req of dzArchivesRequirements) {
    await prisma.complianceRequirement.upsert({
      where: {
        code_frameworkId: {
          code: req.code,
          frameworkId: dzArchivesFrameworkId,
        },
      },
      update: {
        ...req,
        frameworkId: dzArchivesFrameworkId,
      },
      create: {
        ...req,
        frameworkId: dzArchivesFrameworkId,
      },
    });
    console.log(`  ✅ Requirement: ${req.code} - ${req.title}`);
  }

  // ==========================================
  // 11. COMPLIANCE REQUIREMENTS - DZ-DATAPROTECT
  // ==========================================
  console.log(
    "📋 Seeding compliance requirements (DZ-DATAPROTECT)..."
  );

  const dzDataProtectRequirements = [
    {
      code: "DZP-01",
      title: "Data Protection Policy",
      titleAr: "سياسة حماية البيانات",
      description:
        "Establish data protection policy compliant with Law 18-07",
      category: "GOVERNANCE",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "POLICY",
      implementationGuidance:
        "Develop data protection policy aligned with Law 18-07 requirements",
    },
    {
      code: "DZP-02",
      title: "Data Processing Consent",
      titleAr: "موافقة معالجة البيانات",
      description:
        "Obtain consent for personal data processing",
      category: "CONSENT",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "DOCUMENT",
      implementationGuidance:
        "Implement consent mechanisms for personal data processing",
    },
    {
      code: "DZP-03",
      title: "Data Subject Rights",
      titleAr: "حقوق أصحاب البيانات",
      description:
        "Implement data subject rights (access, rectification, erasure)",
      category: "RIGHTS",
      severity: "HIGH",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement procedures for data subject rights fulfillment",
    },
    {
      code: "DZP-04",
      title: "Data Security Measures",
      titleAr: "تدابير أمن البيانات",
      description:
        "Implement security measures for personal data protection",
      category: "SECURITY",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "SYSTEM_CONFIG",
      implementationGuidance:
        "Implement technical and organizational security measures",
    },
    {
      code: "DZP-05",
      title: "Data Breach Notification",
      titleAr: "إخطار خرق البيانات",
      description:
        "Notify authorities of personal data breaches",
      category: "BREACH",
      severity: "CRITICAL",
      mandatory: true,
      evidenceType: "DOCUMENT",
      implementationGuidance:
        "Establish breach notification procedures per Law 18-07",
    },
  ];

  const dzDataProtectFrameworkId =
    createdFrameworks["DZ-DATAPROTECT"];

  for (const req of dzDataProtectRequirements) {
    await prisma.complianceRequirement.upsert({
      where: {
        code_frameworkId: {
          code: req.code,
          frameworkId: dzDataProtectFrameworkId,
        },
      },
      update: {
        ...req,
        frameworkId: dzDataProtectFrameworkId,
      },
      create: {
        ...req,
        frameworkId: dzDataProtectFrameworkId,
      },
    });
    console.log(`  ✅ Requirement: ${req.code} - ${req.title}`);
  }

  console.log("🎉 Legal data seeding completed!");
}

if (require.main === module) {
  import("@prisma/client").then(({ PrismaClient }) => {
    const prisma = new PrismaClient();
    seedLegalData(prisma).then(() => prisma.$disconnect());
  });
}
