import { PrismaClient } from "@prisma/client";

async function upsertLegalRef(
  prisma: PrismaClient,
  data: {
    referenceNumber: string;
    referenceType: string;
    title: string;
    titleAr?: string;
    titleFr?: string;
    titleEn?: string;
    domain?: string;
    status?: string;
    isGlobal?: boolean;
    organizationId?: string | null;
    jurisdiction?: string;
    officialSource?: string;
    officialGazetteNumber?: string;
    issuingAuthority?: string;
    publicationDate?: Date;
    keywords?: string[];
    retentionRules?: Record<string, unknown>;
    summaryAr?: string;
    description?: string;
    sourceUrl?: string;
  }
) {
  const existing = await prisma.legalReference.findFirst({
    where: { referenceNumber: data.referenceNumber, referenceType: data.referenceType },
  });
  if (existing) {
    await prisma.legalReference.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  const created = await prisma.legalReference.create({ data: { ...data, organizationId: data.organizationId ?? null } });
  return created.id;
}

export async function seedLegalData(prisma: PrismaClient) {
  console.log("🌱 Seeding legal data...");

  // ==========================================
  // 1. LEGAL SOURCES
  // ==========================================
  console.log("📋 Seeding legal sources...");

  const legalSources = [
    { name: "Journal Officiel Algérien", nameAr: "الجريدة الرسمية الجزائرية", url: "https://www.joradp.dz", sourceType: "OFFICIAL_JOURNAL", priority: 1, reliability: 5 },
    { name: "Portail du Droit Algérien", nameAr: "بوابة القانون الجزائري", url: "https://www.mjustice.dz", sourceType: "LEGAL_PORTAL", priority: 2, reliability: 5 },
    { name: "Site de l'Amirat", nameAr: "موقع الأمانة العامة للحكومة", url: "https://www.mprimat.gov.dz", sourceType: "MINISTRY", priority: 3, reliability: 5 },
    { name: "ISO", nameAr: "المنظمة الدولية للمعايير", url: "https://www.iso.org", sourceType: "ISO", priority: 5, reliability: 5 },
  ];

  for (const source of legalSources) {
    const existing = await prisma.legalSource.findFirst({ where: { name: source.name } });
    if (!existing) {
      await prisma.legalSource.create({ data: source });
    }
    console.log(`  ✅ Source: ${source.name}`);
  }

  // ==========================================
  // 2. LAWS
  // ==========================================
  console.log("📜 Seeding laws...");

  const laws = [
    {
      referenceNumber: "88-09", referenceType: "law",
      title: "Loi n° 88-09 du 26 janvier 1988 relative aux archives nationales",
      titleAr: "القانون رقم 88-09 المؤرخ 26 جانفي 1988 المتعلق بالأرشيف الوطني",
      titleFr: "Loi n° 88-09 du 26 janvier 1988 relative aux archives nationales",
      titleEn: "Law No. 88-09 of January 26, 1988 on National Archives",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel n° 4", officialGazetteNumber: "4",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("1988-01-26"),
      keywords: ["أرشيف", "أرشيف وطني", "وثائق", "دورة حياة الوثيقة", "الحفظ", "التحويل", "الإقصاء", "archivage", "archives", "cycle de vie"],
      retentionRules: { minYears: 10, maxYears: 100, documentTypes: ["administrative", "financial", "legal", "historical"] },
      summaryAr: "تنظيم دورة حياة الوثيقة، الحفظ، التحويل والإقصاء. القانون الأساسي المنظم للأرشيف في الجزائر.",
      description: "Loi organique réglementant la gestion des archives nationales : cycle de vie des documents, conservation, transfert et élimination.",
    },
    {
      referenceNumber: "18-07", referenceType: "law",
      title: "Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
      titleAr: "القانون رقم 18-07 المؤرخ 10 جوان 2018 المتعلق بالحماية العامة لبيانات شخصية طبيعة",
      titleFr: "Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
      titleEn: "Law No. 18-07 of June 10, 2018 on Protection of Natural Persons in Processing of Personal Data",
      domain: "PERSONAL_DATA", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel n° 34",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2018-06-10"),
      keywords: ["حماية البيانات", "خصوصية", "بيانات شخصية", "protection des données", "données personnelles"],
      retentionRules: { minYears: 2, maxYears: 10, documentTypes: ["personal_data", "consent", "processing_log"] },
      summaryAr: "حماية بيانات الأشخاص الموجودة داخل الوثائق والصلاحيات. يحمي خصوصية الأفراد في التعامل مع المعلومات.",
      description: "Loi relative à la protection des personnes physiques dans le traitement des données à caractère personnel.",
    },
    {
      referenceNumber: "15-04", referenceType: "law",
      title: "Loi n° 15-04 du 1er février 2015 relative à la signature électronique et à la certification",
      titleAr: "القانون رقم 15-04 المؤرخ 1 فيفري 2015 المتعلق بالتوقيع والتصديق الإلكترونيين",
      titleFr: "Loi n° 15-04 du 1er février 2015 relative à la signature électronique et à la certification",
      titleEn: "Law No. 15-04 of February 1, 2015 on Electronic Signature and Certification",
      domain: "E_SIGNATURE", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2015-02-01"),
      keywords: ["توقيع إلكتروني", "تصديق إلكتروني", "توثيق", "شهادة رقمية", "signature électronique", "certification"],
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["electronic_signature", "certificate", "contract"] },
      summaryAr: "التوقيع الإلكتروني للوثائق والمصادقة عليها.",
      description: "Loi réglementant la signature électronique et les services de certification.",
    },
    {
      referenceNumber: "15-05", referenceType: "law",
      title: "Loi n° 15-05 du 16 février 2015 relative à la cybercriminalité et à la protection des systèmes d'information",
      titleAr: "القانون رقم 15-05 المؤرخ 16 فيفري 2015 المتعلق بالجرائم المرتبطة بتكنولوجيات الإعلام والاتصال",
      titleFr: "Loi n° 15-05 du 16 février 2015 relative à la cybercriminalité et à la protection des systèmes d'information",
      titleEn: "Law No. 15-05 of February 16, 2015 on Cybercrime and Protection of Information Systems",
      domain: "CYBERSECURITY", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2015-02-16"),
      keywords: ["جريمة إلكترونية", "أمن السيبراني", "حماية الأنظمة", "cybercriminalité", "protection des systèmes"],
      retentionRules: { minYears: 5, maxYears: 20, documentTypes: ["security_log", "incident_report", "audit_trail"] },
      summaryAr: "حماية النظام والوثائق الرقمية من الأفعال غير المشروعة. الجرائم المرتبطة بتكنولوجيات الإعلام والاتصال.",
      description: "Loi relative à la cybercriminalité et à la protection des systèmes d'information.",
    },
    {
      referenceNumber: "09-04", referenceType: "law",
      title: "Loi n° 09-04 du 5 août 2009 relative à la répression des infractions liées aux technologies de l'information et de la communication",
      titleAr: "القانون رقم 09-04 المؤرخ 5 أوت 2009 المتعلق بمكافحة جرائم تكنولوجيا المعلومات",
      titleFr: "Loi n° 09-04 du 5 août 2009 relative à la répression des infractions liées aux technologies de l'information et de la communication",
      titleEn: "Law No. 09-04 of August 5, 2009 on Repression of Offences Related to Information and Communication Technologies",
      domain: "CYBERSECURITY", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel n° 49",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2009-08-05"),
      keywords: ["جريمة إلكترونية", "أمن المعلومات", "تكنولوجيا المعلومات", "cybersécurité", "sécurité informatique"],
      retentionRules: { minYears: 5, maxYears: 20, documentTypes: ["security_log", "incident_report"] },
      summaryAr: "الأمن وحماية الأنظمة والبيانات. القانون الجزائري الأول لمكافحة الجرائم المعلوماتية.",
      description: "Loi relative à la répression des infractions liées aux technologies de l'information et de la communication.",
    },
    {
      referenceNumber: "18-05", referenceType: "law",
      title: "Loi n° 18-05 du 10 mai 2018 relative au commerce électronique",
      titleAr: "القانون رقم 18-05 المؤرخ 10 ماي 2018 المتعلق بالتجارة الإلكترونية",
      titleFr: "Loi n° 18-05 du 10 mai 2018 relative au commerce électronique",
      titleEn: "Law No. 18-05 of May 10, 2018 on Electronic Commerce",
      domain: "E_COMMERCE", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2018-05-10"),
      keywords: ["تجارة إلكترونية", "تجارة رقمية", "معاملات إلكترونية", "commerce électronique", "transactions numériques"],
      retentionRules: { minYears: 5, maxYears: 10, documentTypes: ["contract", "invoice", "transaction"] },
      summaryAr: "الوثائق والمعاملات الإلكترونية في المؤسسات التجارية.",
      description: "Loi relative au commerce électronique et aux transactions numériques.",
    },
    {
      referenceNumber: "98-04", referenceType: "law",
      title: "Loi n° 98-04 du 15 juin 1998 relative à la protection du patrimoine culturel",
      titleAr: "القانون 98-04 المؤرخ 15 يونيو 1998 المتعلق بحماية التراث الثقافي",
      titleFr: "Loi n° 98-04 du 15 juin 1998 relative à la protection du patrimoine culturel",
      titleEn: "Law No. 98-04 of June 15, 1998 on Protection of Cultural Heritage",
      domain: "CULTURAL_HERITAGE", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("1998-06-15"),
      keywords: ["تراث ثقافي", "تراث تاريخي", "حماية التراث", "patrimoine culturel", "patrimoine historique"],
      retentionRules: { minYears: 50, maxYears: 100, documentTypes: ["heritage", "cultural", "historical"] },
      summaryAr: "حماية التراث الثقافي والتاريخي. الأساس لمعالجة الوثائق ذات القيمة التاريخية والتراثية.",
      description: "Loi relative à la protection du patrimoine culturel algérien.",
    },
    {
      referenceNumber: "90-30", referenceType: "law",
      title: "Loi n° 90-30 du 1er décembre 1990 relative aux biens nationaux",
      titleAr: "القانون 90-30 المؤرخ 1 ديسمبر 1990 المتعلق بالممتلكات الوطنية",
      titleFr: "Loi n° 90-30 du 1er décembre 1990 relative aux biens nationaux",
      titleEn: "Law No. 90-30 of December 1, 1990 on National Property",
      domain: "PUBLIC_PROPERTY", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("1990-12-01"),
      keywords: ["ممتلكات الدولة", "حقوق ملكية", "أموال عمومية", "biens nationaux", "patrimoine public"],
      retentionRules: { minYears: 10, maxYears: 50, documentTypes: ["property", "ownership", "administrative"] },
      summaryAr: "حماية الممتلكات والمجالس الوطنية. الأساس للحفاظ على الوثائق المثبتة لحقوق وممتلكات الدولة.",
      description: "Loi relative aux biens nationaux et à la gestion du patrimoine public.",
    },
    {
      referenceNumber: "18-04", referenceType: "law",
      title: "Loi n° 18-04 du 10 juin 2018 relative aux communications électroniques",
      titleAr: "القانون رقم 18-04 المؤرخ 10 جوان 2018 المتعلق بالاتصالات الإلكترونية",
      titleFr: "Loi n° 18-04 du 10 juin 2018 relative aux communications électroniques",
      titleEn: "Law No. 18-04 of June 10, 2018 on Electronic Communications",
      domain: "OTHER", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Présidence de la République",
      publicationDate: new Date("2018-06-10"),
      keywords: ["اتصالات إلكترونية", "اتصالات رقمية", "telecom", "communications électroniques", "télécommunications"],
      retentionRules: { minYears: 2, maxYears: 5, documentTypes: ["communication", "telecom"] },
      summaryAr: "ينظم الاتصالات الإلكترونية والاتصالات الرقمية.",
      description: "Loi relative aux communications électroniques et aux télécommunications.",
    },
  ];

  for (const law of laws) {
    await upsertLegalRef(prisma, law);
    console.log(`  ✅ Law: ${law.referenceNumber}`);
  }

  // ==========================================
  // 3. CIRCULARS
  // ==========================================
  console.log("📜 Seeding circulars...");

  const circulars = [
    {
      referenceNumber: "Circulaire 2", referenceType: "circular",
      title: "Circulaire n° 2 relative aux procédures d'archivage",
      titleAr: "المنشور رقم 2 المتعلق بإجراءات الأرشيف",
      titleFr: "Circulaire n° 2 relative aux procédures d'archivage",
      titleEn: "Circular No. 2 on Archiving Procedures",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      keywords: ["أرشيف", "إجراءات", "archivage", "procédures"],
      description: "Circulaire définissant les procédures d'archivage des documents administratifs.",
    },
    {
      referenceNumber: "Circulaire 22", referenceType: "circular",
      title: "Circulaire n° 22 du 16 juillet 2001 relative aux listes générales des documents d'archives",
      titleAr: "المنشور رقم 22 المؤرخ في 16 يوليو 2001 المتعلق بالقوائم الشاملة للوثائق الأرشيفية",
      titleFr: "Circulaire n° 22 du 16 juillet 2001 relative aux listes générales des documents d'archives",
      titleEn: "Circular No. 22 of July 16, 2001 on General Lists of Archive Documents",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      publicationDate: new Date("2001-07-16"),
      keywords: ["قوائم أرشيفية", "وثائق", "listes d'archives", "documents"],
      description: "Circulaire relative à l'établissement des listes générales des documents d'archives.",
    },
    {
      referenceNumber: "Circulaire 23", referenceType: "circular",
      title: "Circulaire n° 23 du 1er juillet 2003 relative à la fiche de diagnostic d'archives",
      titleAr: "المنشور رقم 23 المؤرخ في 1 يوليو 2003 المتعلق ببطاقة تشخيص الأرشيف",
      titleFr: "Circulaire n° 23 du 1er juillet 2003 relative à la fiche de diagnostic d'archives",
      titleEn: "Circular No. 23 of July 1, 2003 on Archive Diagnostic Sheet",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      publicationDate: new Date("2003-07-01"),
      keywords: ["تشخيص", "بطاقة", "diagnostic", "fiche"],
      description: "Circulaire relative à la fiche de diagnostic pour l'évaluation des archives.",
    },
    {
      referenceNumber: "Circulaire 26", referenceType: "circular",
      title: "Circulaire n° 26 du 7 juillet 2007 relative à l'organisation des services d'archives",
      titleAr: "المنشور رقم 26 المؤرخ في 7 جويلية 2007 المتعلق بتنظيم خدمات الأرشيف",
      titleFr: "Circulaire n° 26 du 7 juillet 2007 relative à l'organisation des services d'archives",
      titleEn: "Circular No. 26 of July 7, 2007 on Organization of Archive Services",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      publicationDate: new Date("2007-07-07"),
      keywords: ["تنظيم", "خدمات أرشيف", "organisation", "services d'archives"],
      description: "Circulaire relative à l'organisation et au fonctionnement des services d'archives.",
    },
    {
      referenceNumber: "Circulaire 29", referenceType: "circular",
      title: "Circulaire n° 29 du 27 octobre 2008 relative à la gestion électronique des documents",
      titleAr: "المنشور رقم 29 المؤرخ في 27 أكتوبر 2008 المتعلق بال�� efficient إلكتروني للوثائق",
      titleFr: "Circulaire n° 29 du 27 octobre 2008 relative à la gestion électronique des documents",
      titleEn: "Circular No. 29 of October 27, 2008 on Electronic Document Management",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      officialSource: "Journal Officiel",
      issuingAuthority: "Ministère de la Communication",
      publicationDate: new Date("2008-10-27"),
      keywords: ["إدارة إلكترونية", "وثائق رقمية", "GED", "gestion électronique", "documents électroniques"],
      description: "Circulaire relative à la gestion électronique des documents et à la dématérialisation.",
    },
  ];

  for (const circular of circulars) {
    await upsertLegalRef(prisma, circular);
    console.log(`  ✅ Circular: ${circular.referenceNumber}`);
  }

  // ==========================================
  // 4. INTERNATIONAL STANDARDS
  // ==========================================
  console.log("📜 Seeding international standards...");

  const standards = [
    {
      referenceNumber: "ISO 15489-1", referenceType: "international_standard",
      title: "ISO 15489-1:2016 Information and documentation — Records management",
      titleAr: "ISO 15489-1:2016 إدارة المعلومات والتوثيق — إدارة السجلات",
      titleFr: "ISO 15489-1:2016 Information et documentation — Gestion des archives",
      titleEn: "ISO 15489-1:2016 Information and documentation — Records management",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["إدارة سجلات", "records management", "ISO 15489"],
      description: "International standard for records management principles and responsibilities.",
    },
    {
      referenceNumber: "ISO 16175", referenceType: "international_standard",
      title: "ISO 16175:2010 Guidelines and functional requirements for records in electronic office environments",
      titleAr: "ISO 16175:2010 إرشادات ومتطلبات وظيفية للسجلات في بيئات المكتب الإلكترونية",
      titleFr: "ISO 16175:2010 Lignes directrices et exigences fonctionnelles pour les archives dans les environnements de bureau électroniques",
      titleEn: "ISO 16175:2010 Guidelines and functional requirements for records in electronic office environments",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["سجلات إلكترونية", "بيئة مكتبية", "electronic records", "office environments"],
      description: "Guidelines and functional requirements for records in electronic office environments.",
    },
    {
      referenceNumber: "ISO 23081", referenceType: "international_standard",
      title: "ISO 23081-1:2004 Records management processes — Metadata for records",
      titleAr: "ISO 23081-1:2004 عمليات إدارة السجلات — البيانات الوصفية للسجلات",
      titleFr: "ISO 23081-1:2004 Processus de gestion des archives — Métadonnées pour les archives",
      titleEn: "ISO 23081-1:2004 Records management processes — Metadata for records",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["بيانات وصفية", "metadata", "إدارة سجلات", "records management"],
      description: "Records management processes — Metadata for records.",
    },
    {
      referenceNumber: "ISO 30301", referenceType: "international_standard",
      title: "ISO 30301:2019 Management systems for records",
      titleAr: "ISO 30301:2019 أنظمة إدارة السجلات",
      titleFr: "ISO 30301:2019 Systèmes de management pour les archives",
      titleEn: "ISO 30301:2019 Management systems for records",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["نظام إدارة", "إدارة سجلات", "management system", "records management"],
      description: "Management systems for records — Requirements.",
    },
    {
      referenceNumber: "ISO 14721", referenceType: "international_standard",
      title: "ISO 14721:2012 Open archival information system (OAIS) — Reference model",
      titleAr: "ISO 14721:2012 نظام الأرشيف المفتوح للمعلومات (OAIS) — نموذج مرجعي",
      titleFr: "ISO 14721:2012 Système d'archivage ouvert pour l'information (OAIS) — Modèle de référence",
      titleEn: "ISO 14721:2012 Open archival information system (OAIS) — Reference model",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["OAIS", "نظام أرشيف مفتوح", "نموذج مرجعي", "open archival", "reference model"],
      description: "Reference model for an open archival information system (OAIS) for long-term preservation of digital information.",
    },
    {
      referenceNumber: "ISO 13008", referenceType: "international_standard",
      title: "ISO 13008:2012 Information and documentation — Records management principles and requirements for digital recording media",
      titleAr: "ISO 13008:2012 إدارة المعلومات والتوثيق — مبادئ ومتطلبات إدارة السجلات لوسائط التسجيل الرقمية",
      titleFr: "ISO 13008:2012 Information et documentation — Principes et exigences de gestion des archives pour les supports d'enregistrement numériques",
      titleEn: "ISO 13008:2012 Information and documentation — Records management principles and requirements for digital recording media",
      domain: "ARCHIVES", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["وسائط رقمية", "تسجيل رقمي", "digital recording", "media management"],
      description: "Records management principles and requirements for digital recording media.",
    },
    {
      referenceNumber: "ISO/TR 13028", referenceType: "international_standard",
      title: "ISO/TR 13028:2010 Information and documentation — Implementation guidance for the migration of traditional records to digital records",
      titleAr: "ISO/TR 13028:2010 إرشادات لتطبيق الترحيل من السجلات التقليدية إلى السجلات الرقمية",
      titleFr: "ISO/TR 13028:2010 Information et documentation — Lignes directrices pour la migration des archives traditionnelles vers les archives numériques",
      titleEn: "ISO/TR 13028:2010 Implementation guidance for the migration of traditional records to digital records",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["ترحيل", "سجلات رقمية", "ترحيل سجلات", "migration", "digital records"],
      description: "Implementation guidance for the migration of traditional records to digital records.",
    },
    {
      referenceNumber: "ISO 14641", referenceType: "international_standard",
      title: "ISO 14641-1:2018 Electronic document management — Design and operation of an information system for the long-term preservation of electronic documents",
      titleAr: "ISO 14641-1:2018 إدارة المستندات الإلكترونية — تصميم وتشغيل نظام معلومات للحفاظ طويل الأمد على المستندات الإلكترونية",
      titleFr: "ISO 14641-1:2018 Gestion électronique des documents — Conception et exploitation d'un système d'information pour la conservation à long terme de documents électroniques",
      titleEn: "ISO 14641-1:2018 Electronic document management — Design and operation of an information system for the long-term preservation of electronic documents",
      domain: "DOCUMENT_MANAGEMENT", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["إدارة مستندات إلكترونية", "حفظ طويل الأمد", "electronic document management", "long-term preservation"],
      description: "Design and operation of an information system for the long-term preservation of electronic documents.",
    },
    {
      referenceNumber: "ISO/IEC 27001", referenceType: "international_standard",
      title: "ISO/IEC 27001:2022 Information security, cybersecurity and privacy protection",
      titleAr: "ISO/IEC 27001:2022 أمن المعلومات والأمن السيبراني وحماية الخصوصية",
      titleFr: "ISO/IEC 27001:2022 Sécurité de l'information, cybersécurité et protection de la vie privée",
      titleEn: "ISO/IEC 27001:2022 Information security, cybersecurity and privacy protection",
      domain: "CYBERSECURITY", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["أمن المعلومات", "أمن سيبراني", "information security", "cybersecurity"],
      description: "Information security, cybersecurity and privacy protection — Requirements.",
    },
    {
      referenceNumber: "ISO/IEC 27002", referenceType: "international_standard",
      title: "ISO/IEC 27002:2022 Information security controls",
      titleAr: "ISO/IEC 27002:2022 ضوابط أمن المعلومات",
      titleFr: "ISO/IEC 27002:2022 Contrôles de la sécurité de l'information",
      titleEn: "ISO/IEC 27002:2022 Information security controls",
      domain: "CYBERSECURITY", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["ضوابط أمنية", "security controls", "أمن المعلومات", "information security"],
      description: "Information security controls — Guidance.",
    },
    {
      referenceNumber: "ISO/IEC 27701", referenceType: "international_standard",
      title: "ISO/IEC 27701:2019 Privacy information management",
      titleAr: "ISO/IEC 27701:2019 إدارة معلومات الخصوصية",
      titleFr: "ISO/IEC 27701:2019 Gestion des informations de confidentialité",
      titleEn: "ISO/IEC 27701:2019 Privacy information management",
      domain: "PERSONAL_DATA", status: "ACTIVE", isGlobal: true, organizationId: null,
      jurisdiction: "International", officialSource: "ISO",
      issuingAuthority: "International Organization for Standardization",
      keywords: ["إدارة الخصوصية", "حماية البيانات", "privacy management", "data protection"],
      description: "Privacy information management — Requirements and guidance.",
    },
  ];

  for (const std of standards) {
    await upsertLegalRef(prisma, std);
    console.log(`  ✅ Standard: ${std.referenceNumber}`);
  }

  // ==========================================
  // 5. FOREIGN REGULATION (GDPR)
  // ==========================================
  console.log("📜 Seeding foreign regulations...");

  await upsertLegalRef(prisma, {
    referenceNumber: "GDPR", referenceType: "international_standard",
    title: "General Data Protection Regulation (EU) 2016/679",
    titleAr: "لائحة حماية البيانات العامة (الاتحاد الأوروبي) 2016/679",
    titleFr: "Règlement général sur la protection des données (UE) 2016/679",
    titleEn: "General Data Protection Regulation (EU) 2016/679",
    jurisdiction: "European Union", domain: "PERSONAL_DATA", status: "ACTIVE", isGlobal: true, organizationId: null,
    officialSource: "Official Journal of the European Union",
    issuingAuthority: "European Parliament and Council",
    keywords: ["حماية البيانات", "خصوصية", "GDPR", "RGPD"],
    description: "European Union regulation on the protection of natural persons with regard to the processing of personal data.",
  });
  console.log("  ✅ Regulation: GDPR");

  // ==========================================
  // 6. COMPLIANCE FRAMEWORKS
  // ==========================================
  console.log("📊 Seeding compliance frameworks...");

  const frameworks = [
    { name: "ISO 15489 Records Management", nameAr: "إدارة السجلات ISO 15489", code: "ISO15489", type: "ISO", jurisdiction: "International", version: "2016", description: "International standard for records management principles and responsibilities" },
    { name: "ISO/IEC 27001 Information Security", nameAr: "أمن المعلومات ISO/IEC 27001", code: "ISO27001", type: "ISO", jurisdiction: "International", version: "2022", description: "Information security management systems requirements" },
    { name: "ISO/IEC 27701 Privacy", nameAr: "الخصوصية ISO/IEC 27701", code: "ISO27701", type: "ISO", jurisdiction: "International", version: "2019", description: "Privacy information management system" },
    { name: "Algerian Archives Law", nameAr: "قانون الأرشيف الجزائري", code: "DZ-ARCHIVES", type: "ALGERIAN_LAW", jurisdiction: "Algeria", version: "1988", description: "Algerian law governing national archives management" },
    { name: "Algerian Data Protection", nameAr: "حماية البيانات الشخصية الجزائرية", code: "DZ-DATAPROTECT", type: "ALGERIAN_LAW", jurisdiction: "Algeria", version: "2018", description: "Algerian law on personal data protection" },
  ];

  const createdFrameworks: Record<string, string> = {};

  for (const fw of frameworks) {
    const existing = await prisma.complianceFramework.findUnique({ where: { code: fw.code } });
    if (existing) {
      await prisma.complianceFramework.update({ where: { id: existing.id }, data: fw });
      createdFrameworks[fw.code] = existing.id;
    } else {
      const created = await prisma.complianceFramework.create({ data: fw });
      createdFrameworks[fw.code] = created.id;
    }
    console.log(`  ✅ Framework: ${fw.code}`);
  }

  // ==========================================
  // 7. COMPLIANCE REQUIREMENTS
  // ==========================================
  console.log("📋 Seeding compliance requirements...");

  const allRequirements: Array<{ frameworkCode: string; code: string; title: string; titleAr: string; description: string; category: string; severity: string; mandatory: boolean; evidenceType: string; implementationGuidance: string }> = [
    // ISO 15489
    { frameworkCode: "ISO15489", code: "RM-01", title: "Records Management Policy", titleAr: "سياسة إدارة السجلات", description: "Organization shall establish and maintain a records management policy", category: "GOVERNANCE", severity: "CRITICAL", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Document and maintain a formal records management policy" },
    { frameworkCode: "ISO15489", code: "RM-02", title: "Records Responsibility", titleAr: "مسؤولية إدارة السجلات", description: "Define roles and responsibilities for records management", category: "GOVERNANCE", severity: "HIGH", mandatory: true, evidenceType: "DOCUMENT", implementationGuidance: "Create roles and responsibility matrix for records management" },
    { frameworkCode: "ISO15489", code: "RM-03", title: "Records Inventory", titleAr: "جرد السجلات", description: "Maintain an inventory of records systems", category: "IDENTIFICATION", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Develop and maintain a comprehensive records inventory" },
    { frameworkCode: "ISO15489", code: "RM-04", title: "Classification Scheme", titleAr: "مخطط التصنيف", description: "Establish classification system for records", category: "IDENTIFICATION", severity: "HIGH", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Implement a standardized classification scheme for all records" },
    { frameworkCode: "ISO15489", code: "RM-05", title: "Records Capture", titleAr: "التقاط السجلات", description: "Records shall be captured at the point of creation", category: "CAPTURE", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Ensure records are captured at the point of creation or receipt" },
    { frameworkCode: "ISO15489", code: "RM-06", title: "Access Controls", titleAr: "ضوابط الوصول", description: "Access to records shall be controlled and managed", category: "SECURITY", severity: "CRITICAL", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement role-based access controls for records management systems" },
    { frameworkCode: "ISO15489", code: "RM-07", title: "Retention Schedule", titleAr: "جدول الاحتفاظ", description: "Establish and maintain retention schedules", category: "RETENTION", severity: "HIGH", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Develop and maintain retention schedules for all record types" },
    { frameworkCode: "ISO15489", code: "RM-08", title: "Disposition Authority", titleAr: "صلاحية الإتلاف", description: "Disposition of records must be authorized", category: "DISPOSITION", severity: "CRITICAL", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Establish authorization process for records disposition" },
    { frameworkCode: "ISO15489", code: "RM-09", title: "Audit Trail", titleAr: "سجل التدقيق", description: "Maintain audit trails for records management activities", category: "AUDIT", severity: "HIGH", mandatory: true, evidenceType: "AUDIT_LOG", implementationGuidance: "Implement comprehensive audit trail logging for all records activities" },
    { frameworkCode: "ISO15489", code: "RM-10", title: "Disaster Recovery", titleAr: "التعافي من الكوارث", description: "Ensure records are protected against disasters", category: "SECURITY", severity: "CRITICAL", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement disaster recovery procedures for records protection" },
    // ISO 27001
    { frameworkCode: "ISO27001", code: "IS-01", title: "Information Security Policy", titleAr: "سياسة أمن المعلومات", description: "Organization shall establish an information security policy", category: "GOVERNANCE", severity: "CRITICAL", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Document and maintain a formal information security policy" },
    { frameworkCode: "ISO27001", code: "IS-02", title: "Risk Assessment", titleAr: "تقييم المخاطر", description: "Conduct regular risk assessments for information assets", category: "GOVERNANCE", severity: "CRITICAL", mandatory: true, evidenceType: "DOCUMENT", implementationGuidance: "Implement risk assessment methodology and conduct regular assessments" },
    { frameworkCode: "ISO27001", code: "IS-03", title: "Access Control", titleAr: "ضوابط الوصول", description: "Implement access control policies and procedures", category: "ACCESS", severity: "CRITICAL", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement role-based access control with principle of least privilege" },
    { frameworkCode: "ISO27001", code: "IS-04", title: "Cryptography", titleAr: "التشفير", description: "Implement cryptographic controls for data protection", category: "CRYPTOGRAPHY", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement encryption for data at rest and in transit" },
    { frameworkCode: "ISO27001", code: "IS-05", title: "Physical Security", titleAr: "الأمن المادي", description: "Implement physical security controls for facilities", category: "PHYSICAL", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement physical access controls and environmental protections" },
    { frameworkCode: "ISO27001", code: "IS-06", title: "Operations Security", titleAr: "أمن العمليات", description: "Implement operational security procedures", category: "OPERATIONS", severity: "HIGH", mandatory: true, evidenceType: "DOCUMENT", implementationGuidance: "Develop and maintain operational security procedures and guidelines" },
    { frameworkCode: "ISO27001", code: "IS-07", title: "Backup and Recovery", titleAr: "النسخ الاحتياطي والتعافي", description: "Implement backup and recovery procedures", category: "CONTINUITY", severity: "CRITICAL", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement regular backup procedures and test recovery processes" },
    // DZ-ARCHIVES
    { frameworkCode: "DZ-ARCHIVES", code: "DZA-01", title: "Archives Management Policy", titleAr: "سياسة إدارة الأرشيف", description: "Establish archives management policy compliant with Law 88-09", category: "GOVERNANCE", severity: "CRITICAL", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Develop archives management policy aligned with Law 88-09 requirements" },
    { frameworkCode: "DZ-ARCHIVES", code: "DZA-02", title: "Document Classification", titleAr: "تصنيف الوثائق", description: "Classify documents according to national archives standards", category: "IDENTIFICATION", severity: "HIGH", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Implement document classification per national archives guidelines" },
    { frameworkCode: "DZ-ARCHIVES", code: "DZA-03", title: "Retention Periods", titleAr: "فترات الاحتفاظ", description: "Apply retention periods as defined by Law 88-09", category: "RETENTION", severity: "HIGH", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Configure retention schedules per Law 88-09 requirements" },
    { frameworkCode: "DZ-ARCHIVES", code: "DZA-04", title: "Access to Archives", titleAr: "الوصول إلى الأرشيف", description: "Control access to archived documents", category: "SECURITY", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement access controls for archived documents" },
    { frameworkCode: "DZ-ARCHIVES", code: "DZA-05", title: "Archives Preservation", titleAr: "حفظ الأرشيف", description: "Ensure proper preservation of archived documents", category: "SECURITY", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement preservation measures for long-term document retention" },
    // DZ-DATAPROTECT
    { frameworkCode: "DZ-DATAPROTECT", code: "DZP-01", title: "Data Protection Policy", titleAr: "سياسة حماية البيانات", description: "Establish data protection policy compliant with Law 18-07", category: "GOVERNANCE", severity: "CRITICAL", mandatory: true, evidenceType: "POLICY", implementationGuidance: "Develop data protection policy aligned with Law 18-07 requirements" },
    { frameworkCode: "DZ-DATAPROTECT", code: "DZP-02", title: "Data Processing Consent", titleAr: "موافقة معالجة البيانات", description: "Obtain consent for personal data processing", category: "CONSENT", severity: "CRITICAL", mandatory: true, evidenceType: "DOCUMENT", implementationGuidance: "Implement consent mechanisms for personal data processing" },
    { frameworkCode: "DZ-DATAPROTECT", code: "DZP-03", title: "Data Subject Rights", titleAr: "حقوق أصحاب البيانات", description: "Implement data subject rights (access, rectification, erasure)", category: "RIGHTS", severity: "HIGH", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement procedures for data subject rights fulfillment" },
    { frameworkCode: "DZ-DATAPROTECT", code: "DZP-04", title: "Data Security Measures", titleAr: "تدابير أمن البيانات", description: "Implement security measures for personal data protection", category: "SECURITY", severity: "CRITICAL", mandatory: true, evidenceType: "SYSTEM_CONFIG", implementationGuidance: "Implement technical and organizational security measures" },
    { frameworkCode: "DZ-DATAPROTECT", code: "DZP-05", title: "Data Breach Notification", titleAr: "إخطار خرق البيانات", description: "Notify authorities of personal data breaches", category: "BREACH", severity: "CRITICAL", mandatory: true, evidenceType: "DOCUMENT", implementationGuidance: "Establish breach notification procedures per Law 18-07" },
  ];

  for (const req of allRequirements) {
    const frameworkId = createdFrameworks[req.frameworkCode];
    if (!frameworkId) continue;

    const existing = await prisma.complianceRequirement.findFirst({
      where: { code: req.code, frameworkId },
    });

    const { frameworkCode: _, ...reqData } = req;
    if (existing) {
      await prisma.complianceRequirement.update({
        where: { id: existing.id },
        data: { ...reqData, frameworkId },
      });
    } else {
      await prisma.complianceRequirement.create({
        data: { ...reqData, frameworkId },
      });
    }
    console.log(`  ✅ Requirement: ${req.code} - ${req.title}`);
  }

  console.log("🎉 Legal data seeding completed!");
}
