export type Locale = 'ar' | 'fr' | 'en';

type TranslationKeys = {
  // Common
  appName: string;
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  view: string;
  search: string;
  filter: string;
  sort: string;
  export: string;
  import: string;
  upload: string;
  download: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  confirm: string;
  yes: string;
  no: string;

  // Navigation
  dashboard: string;
  documents: string;
  collections: string;
  searchPage: string;
  processing: string;
  workflows: string;
  compliance: string;
  team: string;
  analytics: string;
  notifications: string;
  activity: string;
  trash: string;
  documentation: string;
  settings: string;

  // Auth
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  welcomeBack: string;
  createAccount: string;
  forgotPassword: string;
  noAccount: string;
  hasAccount: string;

  // Dashboard
  totalDocuments: string;
  processingQueue: string;
  needsReview: string;
  expiringSoon: string;
  storageUsed: string;
  recentActivity: string;
  aiInsights: string;

  // Documents
  allDocuments: string;
  uploadDocuments: string;
  dragDropFiles: string;
  orClickToUpload: string;
  supportedFormats: string;
  documentType: string;
  classification: string;
  status: string;
  department: string;
  uploadedAt: string;
  fileSize: string;
  version: string;
  tags: string;
  metadata: string;
  aiInsightsDoc: string;
  versions: string;
  activity: string;
  permissions: string;

  // Compliance
  retentionPolicies: string;
  legalHolds: string;
  auditLogs: string;
  recordsManagement: string;

  // Settings
  organization: string;
  billing: string;
  notifications: string;
  security: string;
  language: string;
  currentPlan: string;
  upgrade: string;
  monthly: string;
  annual: string;
  days: string;
  trialDaysLeft: string;
  trialExpired: string;
  trialExpiredDesc: string;
  trialDesc: string;
  subscribe: string;
  paymentTitle: string;
  paymentGatewayDesc: string;
  paymentDemoMode: string;
  paymentOpenGateway: string;
  paymentInvoiceInfo: string;
  paymentClose: string;

  // Messages
  noDocuments: string;
  noMetadata: string;
  noSearchResults: string;
  uploadSuccess: string;
  processingStarted: string;
  documentArchived: string;
  documentDeleted: string;

  // AI Assistant
  aiAssistant: string;
  askAboutDocs: string;
  askSadi: string;

  // Status
  statusUploading: string;
  statusQueued: string;
  statusProcessing: string;
  statusExtracting: string;
  statusIndexing: string;
  statusAnalyzing: string;
  statusCompleted: string;
  statusFailed: string;
  statusQuarantined: string;

  // Type
  typeContract: string;
  typeInvoice: string;
  typeReport: string;
  typeCertificate: string;
  typeLetter: string;
  typeId: string;
  typePolicy: string;
  typeLegal: string;
  typeHr: string;
  typeFinancial: string;
  typeTechnical: string;
  typeOther: string;

  // Classification
  classificationPublic: string;
  classificationInternal: string;
  classificationConfidential: string;
  classificationHighlyConfidential: string;

  // Archive
  archiveActive: string;
  archiveInactive: string;
  archiveArchived: string;
  archiveOnHold: string;
  archivePendingDisposal: string;
  archiveDisposed: string;

  // Approval
  approvalDraft: string;
  approvalPendingReview: string;
  approvalApproved: string;
  approvalRejected: string;
  approvalArchived: string;

  // Language
  langAr: string;
  langFr: string;
  langEn: string;
  langUnknown: string;

  // Roles
  roleOwner: string;
  roleAdmin: string;
  roleManager: string;
  roleEditor: string;
  roleReviewer: string;
  roleViewer: string;
  roleAuditor: string;

  // Landing Page
  solution: string;
  features: string;
  howItWorks: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  startFree: string;
  seeHowItWorks: string;
  heroAiInsight: string;
  archivedDocs: string;
  autoClassify: string;
  languages: string;
  secureAccess: string;
  problemTitle: string;
  problemDesc: string;
  problem1: string;
  problem2: string;
  problem3: string;
  problem4: string;
  problem5: string;
  problem6: string;
  problem7: string;
  problemSolution: string;
  howItWorksTitle: string;
  howItWorksDesc: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  step5Title: string;
  step5Desc: string;
  aiTitle: string;
  aiDesc: string;
  aiFeature1: string;
  aiFeature1Desc: string;
  aiFeature2: string;
  aiFeature2Desc: string;
  aiFeature3: string;
  aiFeature3Desc: string;
  aiFeature4: string;
  aiFeature4Desc: string;
  aiFeature5: string;
  aiFeature5Desc: string;
  aiFeature6: string;
  aiFeature6Desc: string;
  searchDemoTitle: string;
  searchDemoDesc: string;
  searchDemoQuery: string;
  searchDemoResult: string;
  expires: string;
  viewResults: string;
  archiveTitle: string;
  archiveDesc: string;
  versionControl: string;
  metadata: string;
  smartTags: string;
  retention: string;
  fullTextSearch: string;
  legal: string;
  finance: string;
  hr: string;
  contracts: string;
  agreements: string;
  legalDocs: string;
  invoices: string;
  reports: string;
  payments: string;
  employees: string;
  empContracts: string;
  certificates: string;
  workflowTitle: string;
  workflowDesc: string;
  wfUpload: string;
  wfClassify: string;
  wfReview: string;
  wfApproval: string;
  wfArchive: string;
  wfAlert: string;
  wfRenewal: string;
  workflowExample: string;
  securityTitle: string;
  securityDesc: string;
  tls: string;
  active: string;
  monitoring: string;
  useCasesTitle: string;
  useCasesDesc: string;
  useCase1: string;
  useCase1Desc: string;
  useCase2: string;
  useCase2Desc: string;
  useCase3: string;
  useCase3Desc: string;
  useCase4: string;
  useCase4Desc: string;
  useCase5: string;
  useCase5Desc: string;
  pricingDesc: string;
  popular: string;
  planStarterDesc: string;
  planBusinessDesc: string;
  planProDesc: string;
  planEnterpriseDesc: string;
  custom: string;
  monthHT: string;
  contactUs: string;
  faqTitle: string;
  faqArabic: string;
  faqArabicAnswer: string;
  faqFormats: string;
  faqFormatsAnswer: string;
  faqSearch: string;
  faqSearchAnswer: string;
  faqPermissions: string;
  faqPermissionsAnswer: string;
  faqSecurity: string;
  faqSecurityAnswer: string;
  ctaTitle: string;
  ctaDesc: string;

  // New features — i18n full coverage
  create: string;
  createDocument: string;
  createDocumentDesc: string;
  documentNumber: string;
  issuingAuthority: string;
  documentDate: string;
  creationDate: string;
  priority: string;
  workflow: string;
  retentionManagement: string;
  retentionSuggestion: string;
  confidence: string;
  applicableRule: string;
  accept: string;
  approve: string;
  modify: string;
  reject: string;
  refresh: string;
  by: string;
  traceability: string;
  electronicSignature: string;
  addSigner: string;
  signatures: string;
  translate: string;
  translateToArabic: string;
  translateToFrench: string;
  translateToEnglish: string;
  reports: string;
  expiringDocs: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  recommendedAction: string;
  disposalQueue: string;
  legalKnowledgeBase: string;
  legalKnowledgeBaseDesc: string;
  workflowStepper: string;
  classificationRestricted: string;
  archivePermanent: string;
  approvalSigned: string;
  approvalActive: string;
  previewBeforeSave: string;
  template: string;
  templateBlank: string;
  templateContract: string;
  templateReport: string;
  templateLetter: string;
  templateInvoice: string;
  saveAsDraft: string;
  sendForReview: string;
  sendForSignature: string;
  toPermanentArchive: string;
  requestDisposal: string;
  languageDetected: string;
  document: string;
  category: string;
  owner: string;
  expiration: string;
  totalExpiring: string;
  allTypes: string;
  allPriority: string;
  pipelineUpload: string;
  pipelineVirusScan: string;
  pipelineValidation: string;
  pipelineHash: string;
  pipelineDedup: string;
  pipelineOcr: string;
  pipelineTextExtraction: string;
  pipelineMetadata: string;
  pipelineClassification: string;
  pipelineChunking: string;
  pipelineEmbedding: string;
  pipelineIndexing: string;
  pipelineAiAnalysis: string;
  pipelineReady: string;
};

const translations: Record<Locale, TranslationKeys> = {
  en: {
    appName: 'SADI PRO',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    upload: 'Upload',
    download: 'Download',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    dashboard: 'Dashboard',
    documents: 'Documents',
    collections: 'Collections',
    searchPage: 'Search',
    processing: 'Processing',
    workflows: 'Workflows',
    compliance: 'Compliance',
    team: 'Team',
    analytics: 'Analytics',
    notifications: 'Notifications',
    activity: 'Activity Log',
    trash: 'Trash',
    documentation: 'Documentation',
    settings: 'Settings',

    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    organizationName: 'Organization Name',
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',

    totalDocuments: 'Total Documents',
    processingQueue: 'Processing Queue',
    needsReview: 'Needs Review',
    expiringSoon: 'Expiring Soon',
    storageUsed: 'Storage Used',
    recentActivity: 'Recent Activity',
    aiInsights: 'AI Insights',

    allDocuments: 'All Documents',
    uploadDocuments: 'Upload Documents',
    dragDropFiles: 'Drag & drop files here',
    orClickToUpload: 'or click to upload',
    supportedFormats: 'PDF, DOCX, XLSX, PPTX, TXT, CSV, Images, ZIP',
    documentType: 'Document Type',
    classification: 'Classification',
    status: 'Status',
    department: 'Department',
    uploadedAt: 'Uploaded At',
    fileSize: 'File Size',
    version: 'Version',
    tags: 'Tags',
    metadata: 'Metadata',
    aiInsightsDoc: 'AI Insights',
    versions: 'Versions',
    activity: 'Activity',
    permissions: 'Permissions',

    retentionPolicies: 'Retention Policies',
    legalHolds: 'Legal Holds',
    auditLogs: 'Audit Logs',
    recordsManagement: 'Records Management',

    organization: 'Organization',
    billing: 'Billing',
    security: 'Security',
    language: 'Language',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade',
    monthly: 'Monthly',
    annual: 'Annual',
    days: 'days',
    trialDaysLeft: 'Free Trial',
    trialExpired: 'Trial Expired',
    trialExpiredDesc: 'Your free trial has ended. Subscribe to continue uploading documents.',
    trialDesc: 'Starter plan features. Upgrade anytime for more storage and users.',
    subscribe: 'Subscribe',
    paymentTitle: 'Payment',
    paymentGatewayDesc: 'Algerian gateway: Chargily Pay / SATIM — DZD — CIB / Edahabia / BaridiMob + Wire Transfer',
    paymentDemoMode: 'Demo mode (no CHARGILY_API_KEY set). Payment simulation only — no real charge.',
    paymentOpenGateway: 'Open Chargily',
    paymentInvoiceInfo: 'NIF/NIS/RC on PDF invoice • VAT 19% included • Instant receipt • Support: contact@sadi.pro',
    paymentClose: 'Close',

    noDocuments: 'No documents yet',
    noMetadata: 'No metadata available',
    noSearchResults: 'No search results found',
    uploadSuccess: 'Documents uploaded successfully',
    processingStarted: 'Processing started',
    documentArchived: 'Document archived',
    documentDeleted: 'Document moved to trash',

    aiAssistant: 'AI Assistant',
    askAboutDocs: 'Ask questions about your documents in natural language.',
    askSadi: 'Ask SADI AI',

    statusUploading: 'Uploading',
    statusQueued: 'Queued',
    statusProcessing: 'Processing',
    statusExtracting: 'Extracting',
    statusIndexing: 'Indexing',
    statusAnalyzing: 'Analyzing',
    statusCompleted: 'Completed',
    statusFailed: 'Failed',
    statusQuarantined: 'Quarantined',

    typeContract: 'Contract',
    typeInvoice: 'Invoice',
    typeReport: 'Report',
    typeCertificate: 'Certificate',
    typeLetter: 'Letter',
    typeId: 'ID Document',
    typePolicy: 'Policy',
    typeLegal: 'Legal Document',
    typeHr: 'HR Document',
    typeFinancial: 'Financial',
    typeTechnical: 'Technical',
    typeOther: 'Other',

    classificationPublic: 'Public',
    classificationInternal: 'Internal',
    classificationConfidential: 'Confidential',
    classificationHighlyConfidential: 'Highly Confidential',

    archiveActive: 'Active',
    archiveInactive: 'Inactive',
    archiveArchived: 'Archived',
    archiveOnHold: 'On Hold',
    archivePendingDisposal: 'Pending Disposal',
    archiveDisposed: 'Disposed',

    approvalDraft: 'Draft',
    approvalPendingReview: 'Pending Review',
    approvalApproved: 'Approved',
    approvalRejected: 'Rejected',
    approvalArchived: 'Archived',

    langAr: 'Arabic',
    langFr: 'French',
    langEn: 'English',
    langUnknown: 'Unknown',

    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleManager: 'Manager',
    roleEditor: 'Editor',
    roleReviewer: 'Reviewer',
    roleViewer: 'Viewer',
    roleAuditor: 'Auditor',

    // Landing Page
    solution: 'Solution',
    features: 'Features',
    howItWorks: 'How It Works',
    heroTitle: 'Transform your archive into an intelligent system.',
    heroSubtitle: 'SADI PRO AI',
    heroDesc: 'SADI PRO AI is an intelligent document archiving and management system that digitizes documents, automatically extracts information, searches thousands of files, and automates the document lifecycle.',
    startFree: 'Start Free',
    seeHowItWorks: 'See How It Works',
    heroAiInsight: '47 contracts expiring within 30 days. AI detected 3 high-value documents requiring immediate review.',
    archivedDocs: 'Documents archived',
    autoClassify: 'AI auto-classification',
    languages: '3 languages',
    secureAccess: '24/7 secure access',
    problemTitle: 'Is your organization still relying on traditional archiving?',
    problemDesc: 'Scattered files, lost information, wasted time, and manual processes.',
    problem1: '📁 Scattered files across departments',
    problem2: '🔍 Difficulty finding information',
    problem3: '⌛ Wasted time searching for documents',
    problem4: '📝 Manual data entry',
    problem5: '📄 Duplicate documents',
    problem6: '⚠️ Forgotten contracts and deadlines',
    problem7: '🔓 Difficulty controlling permissions',
    problemSolution: 'SADI PRO AI transforms this process into an intelligent archive.',
    howItWorksTitle: 'From document to knowledge in seconds',
    howItWorksDesc: 'A simple 5-step process to digitize and intelligently manage your documents.',
    step1Title: 'Upload',
    step1Desc: 'Upload PDF, image, or Office document.',
    step2Title: 'SADI Understands',
    step2Desc: 'OCR + AI reads and classifies the document.',
    step3Title: 'Extract',
    step3Desc: 'Automatically extracts name, date, amount, parties, classification, and keywords.',
    step4Title: 'Archive',
    step4Desc: 'Places the document in the correct location with metadata and permissions.',
    step5Title: 'Search & Ask',
    step5Desc: 'Search in natural language or ask SADI AI directly.',
    aiTitle: 'AI Document Intelligence',
    aiDesc: 'Artificial intelligence that understands and processes your documents.',
    aiFeature1: 'Smart Classification',
    aiFeature1Desc: 'Automatically recognizes document type and classifies it.',
    aiFeature2: 'OCR',
    aiFeature2Desc: 'Converts scanned documents and images into searchable text.',
    aiFeature3: 'Information Extraction',
    aiFeature3Desc: 'Extracts important data without manual entry.',
    aiFeature4: 'Semantic Search',
    aiFeature4Desc: 'Search for information, not just file names.',
    aiFeature5: 'AI Assistant',
    aiFeature5Desc: 'Ask about your archive content and get document-based answers.',
    aiFeature6: 'Smart Metadata',
    aiFeature6Desc: 'Automatically creates metadata and tags.',
    searchDemoTitle: 'Ask Your Archive',
    searchDemoDesc: 'Ask questions in natural language and get instant answers from your documents.',
    searchDemoQuery: 'What contracts expire within 30 days?',
    searchDemoResult: 'Found 8 contracts matching your search criteria.',
    expires: 'Expires',
    viewResults: 'View Results',
    archiveTitle: 'Organized, searchable, and intelligent archive',
    archiveDesc: 'Structure your documents with folders, versions, metadata, tags, retention policies, and granular permissions.',
    versionControl: 'Version Control',
    smartTags: 'Smart Tags',
    retention: 'Retention Policies',
    fullTextSearch: 'Full-Text Search',
    legal: 'Legal',
    finance: 'Finance',
    hr: 'Human Resources',
    contracts: 'Contracts',
    agreements: 'Agreements',
    legalDocs: 'Legal Documents',
    invoices: 'Invoices',
    reports: 'Reports',
    payments: 'Payments',
    employees: 'Employees',
    empContracts: 'Employment Contracts',
    certificates: 'Certificates',
    workflowTitle: 'Automate your document lifecycle',
    workflowDesc: 'Not just archiving — complete workflow automation from upload to retention.',
    wfUpload: 'Upload Document',
    wfClassify: 'AI Classification',
    wfReview: 'Review',
    wfApproval: 'Approval',
    wfArchive: 'Archive',
    wfAlert: 'Expiration Alert',
    wfRenewal: 'Retention / Renewal',
    workflowExample: '⚠️ Contract expiring in 30 days — Send alert → Review → Approve → Renew',
    securityTitle: 'Enterprise-grade security for your documents',
    securityDesc: 'Your documents are protected with industry-standard security measures.',
    tls: 'TLS',
    active: 'Active',
    monitoring: 'Monitoring',
    useCasesTitle: 'Designed for every department',
    useCasesDesc: 'SADI PRO AI serves legal, finance, HR, and operations teams.',
    useCase1: 'Legal Department',
    useCase1Desc: 'Contracts, agreements, and legal documents with version control and compliance.',
    useCase2: 'Finance',
    useCase2Desc: 'Invoices, financial reports, budgets, and payment documents.',
    useCase3: 'Human Resources',
    useCase3Desc: 'Employee files, contracts, certificates, and performance reviews.',
    useCase4: 'Administration',
    useCase4Desc: 'Centralized archive, reports, and organizational analytics.',
    useCase5: 'Procurement',
    useCase5Desc: 'Purchase orders, supplier contracts, and vendor management.',
    pricingDesc: 'Start free with the Starter plan. Upgrade anytime.',
    popular: 'Popular',
    planStarterDesc: 'For individuals and small teams.',
    planBusinessDesc: 'For small and medium businesses.',
    planProDesc: 'For enterprises and large teams.',
    planEnterpriseDesc: 'Custom infrastructure, permissions, and integrations.',
    custom: 'Custom',
    monthHT: 'month HT',
    contactUs: 'Contact Us',
    faqTitle: 'Frequently Asked Questions',
    faqArabic: 'Does SADI PRO support Arabic?',
    faqArabicAnswer: 'Yes, SADI PRO AI fully supports Arabic, French, and English with RTL layout and Arabic fonts.',
    faqFormats: 'What document formats are supported?',
    faqFormatsAnswer: 'PDF, Word, Excel, PowerPoint, images (PNG, JPG, TIFF), text files, CSV, JSON, XML, HTML, and ZIP archives.',
    faqSearch: 'Can I search inside documents?',
    faqSearchAnswer: 'Yes, SADI PRO uses PostgreSQL full-text search and AI-powered semantic search to find information inside your documents.',
    faqPermissions: 'Can I control user permissions?',
    faqPermissionsAnswer: 'Yes, SADI PRO has a complete RBAC system with 7 roles (Owner, Admin, Manager, Editor, Reviewer, Viewer, Auditor) and granular permissions.',
    faqSecurity: 'Is my data secure?',
    faqSecurityAnswer: 'Yes. Files are stored in Cloudflare R2 (encrypted at rest), all API calls use JWT authentication, passwords are bcrypt-hashed, and all endpoints have RBAC guards.',
    ctaTitle: 'Transform your archive into an intelligent information source.',
    ctaDesc: 'Start organizing your documents, extracting information, and accessing them faster.',

    create: 'Create',
    createDocument: 'Create Document',
    createDocumentDesc: 'Template · Upload · Preview · Workflow',
    documentNumber: 'Document Number',
    issuingAuthority: 'Issuing Authority',
    documentDate: 'Document Date',
    creationDate: 'Creation Date',
    priority: 'Priority',
    workflow: 'Workflow',
    retentionManagement: 'Retention Management',
    retentionSuggestion: 'AI Suggestion',
    confidence: 'Confidence',
    applicableRule: 'Applicable Rule',
    accept: 'Accept',
    approve: 'Approve',
    modify: 'Modify',
    reject: 'Reject',
    refresh: 'Refresh',
    by: 'By',
    traceability: 'Traceability',
    electronicSignature: 'Electronic Signature',
    addSigner: 'Add Signer',
    signatures: 'Signatures',
    translate: 'Translate',
    translateToArabic: 'Translate to Arabic',
    translateToFrench: 'Translate to French',
    translateToEnglish: 'Translate to English',
    expiringDocs: 'Documents Expiring Soon',
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    recommendedAction: 'Recommended Action',
    disposalQueue: 'Disposal Queue',
    legalKnowledgeBase: 'Legal Knowledge Base',
    legalKnowledgeBaseDesc: 'Laws, circulars and decisions relating to archiving and document management in Algeria',
    workflowStepper: 'Workflow',
    classificationRestricted: 'Restricted',
    archivePermanent: 'Permanent Archive',
    approvalSigned: 'Signed',
    approvalActive: 'Active',
    previewBeforeSave: 'Preview before save',
    template: 'Template',
    templateBlank: 'Blank',
    templateContract: 'Contract',
    templateReport: 'Report',
    templateLetter: 'Letter',
    templateInvoice: 'Invoice',
    saveAsDraft: 'Save as Draft',
    sendForReview: 'Send for Review',
    sendForSignature: 'Send for Signature',
    toPermanentArchive: 'To Permanent Archive',
    requestDisposal: 'Request Disposal',
    languageDetected: 'Language',
    document: 'Document',
    category: 'Category',
    owner: 'Owner',
    expiration: 'Expiration',
    totalExpiring: 'Total expiring',
    allTypes: 'All types',
    allPriority: 'All priority',
    pipelineUpload: 'Upload',
    pipelineVirusScan: 'Virus Scan',
    pipelineValidation: 'Validation',
    pipelineHash: 'Hash',
    pipelineDedup: 'Dedup',
    pipelineOcr: 'OCR',
    pipelineTextExtraction: 'Text Extraction',
    pipelineMetadata: 'Metadata',
    pipelineClassification: 'Classification',
    pipelineChunking: 'Chunking',
    pipelineEmbedding: 'Embedding',
    pipelineIndexing: 'Indexing',
    pipelineAiAnalysis: 'AI Analysis',
    pipelineReady: 'Ready',
  },

  ar: {
    appName: 'سادي برو',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    export: 'تصدير',
    import: 'استيراد',
    upload: 'رفع',
    download: 'تحميل',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',

    dashboard: 'لوحة التحكم',
    documents: 'الوثائق',
    collections: 'المجموعات',
    searchPage: 'بحث',
    processing: 'المعالجة',
    workflows: 'سير العمل',
    compliance: 'الامتثال',
    team: 'الفريق',
    analytics: 'التحليلات',
    notifications: 'الإشعارات',
    activity: 'سجل النشاط',
    trash: 'سلة المهملات',
    documentation: 'التوثيق',
    settings: 'الإعدادات',

    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    organizationName: 'اسم المؤسسة',
    welcomeBack: 'مرحباً بعودتك',
    createAccount: 'إنشاء حسابك',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',

    totalDocuments: 'إجمالي الوثائق',
    processingQueue: 'قائمة المعالجة',
    needsReview: 'تحتاج مراجعة',
    expiringSoon: 'تنتهي قريباً',
    storageUsed: 'مساحة التخزين المستخدمة',
    recentActivity: 'النشاط الأخير',
    aiInsights: 'تحليلات الذكاء الاصطناعي',

    allDocuments: 'جميع الوثائق',
    uploadDocuments: 'رفع الوثائق',
    dragDropFiles: 'اسحب وأفلت الملفات هنا',
    orClickToUpload: 'أو انقر للرفع',
    supportedFormats: 'PDF, DOCX, XLSX, PPTX, TXT, CSV, صور, ZIP',
    documentType: 'نوع الوثيقة',
    classification: 'التصنيف',
    status: 'الحالة',
    department: 'القسم',
    uploadedAt: 'تاريخ الرفع',
    fileSize: 'حجم الملف',
    version: 'الإصدار',
    tags: 'الوسوم',
    metadata: 'البيانات الوصفية',
    aiInsightsDoc: 'تحليلات الذكاء الاصطناعي',
    versions: 'الإصدارات',
    activity: 'النشاط',
    permissions: 'الصلاحيات',

    retentionPolicies: 'سياسات الاحتفاظ',
    legalHolds: 'الاحتفاظ القانوني',
    auditLogs: 'سجلات التدقيق',
    recordsManagement: 'إدارة السجلات',

    organization: 'المؤسسة',
    billing: 'الفواتير',
    security: 'الأمان',
    language: 'اللغة',
    currentPlan: 'الخطة الحالية',
    upgrade: 'ترقية',
    monthly: 'شهري',
    annual: 'سنوي',
    days: 'يوم',
    trialDaysLeft: 'فترة تجريبية',
    trialExpired: 'انتهت الفترة التجريبية',
    trialExpiredDesc: 'انتهت فترة التجربة المجانية. اشترك لمتابعة رفع الوثائق.',
    trialDesc: 'ميزات خطة Starter. قم بالترقية في أي وقت لمزيد من التخزين والمستخدمين.',
    subscribe: 'اشترك',
    paymentTitle: 'الدفع',
    paymentGatewayDesc: 'بوابة جزائرية: Chargily Pay / SATIM — دج — CIB /חקabia / BaridiMob + تحويل بنكي',
    paymentDemoMode: 'وضع تجريبي (لا يوجد CHARGILY_API_KEY). محاكاة الدفع فقط — لا يوجد خصم حقيقي.',
    paymentOpenGateway: 'فتح Chargily',
    paymentInvoiceInfo: 'NIF/NIS/RC على فاتورة PDF • ضريبة القيمة المضافة 19% مشمولة • إيصال فوري • الدعم: contact@sadi.pro',
    paymentClose: 'إغلاق',

    noDocuments: 'لا توجد وثائق بعد',
    noMetadata: 'لا توجد بيانات وصفية',
    noSearchResults: 'لم يتم العثور على نتائج',
    uploadSuccess: 'تم رفع الوثائق بنجاح',
    processingStarted: 'بدأت المعالجة',
    documentArchived: 'تم أرشفة الوثيقة',
    documentDeleted: 'تم نقل الوثيقة إلى سلة المهملات',

    aiAssistant: 'المساعد الذكي',
    askAboutDocs: 'اطرح أسئلة حول مستنداتك بلغة طبيعية.',
    askSadi: 'اسأل سادي AI',

    statusUploading: 'جاري الرفع',
    statusQueued: 'في الانتظار',
    statusProcessing: 'قيد المعالجة',
    statusExtracting: 'استخراج',
    statusIndexing: 'فهرسة',
    statusAnalyzing: 'تحليل',
    statusCompleted: 'مكتمل',
    statusFailed: 'فشل',
    statusQuarantined: 'محجور',

    typeContract: 'عقد',
    typeInvoice: 'فاتورة',
    typeReport: 'تقرير',
    typeCertificate: 'شهادة',
    typeLetter: 'رسالة',
    typeId: 'وثيقة هوية',
    typePolicy: 'سياسة',
    typeLegal: 'وثيقة قانونية',
    typeHr: 'وثيقة موارد بشرية',
    typeFinancial: 'مالي',
    typeTechnical: 'تقني',
    typeOther: 'أخرى',

    classificationPublic: 'عام',
    classificationInternal: 'داخلي',
    classificationConfidential: 'سري',
    classificationHighlyConfidential: 'سري للغاية',

    archiveActive: 'نشط',
    archiveInactive: 'غير نشط',
    archiveArchived: 'مؤرشف',
    archiveOnHold: 'معلق',
    archivePendingDisposal: 'بانتظار الإتلاف',
    archiveDisposed: 'متلف',

    approvalDraft: 'مسودة',
    approvalPendingReview: 'بانتظار المراجعة',
    approvalApproved: 'موافق عليه',
    approvalRejected: 'مرفوض',
    approvalArchived: 'مؤرشف',

    langAr: 'العربية',
    langFr: 'الفرنسية',
    langEn: 'الإنجليزية',
    langUnknown: 'غير معروف',

    roleOwner: 'مالك',
    roleAdmin: 'مسؤول',
    roleManager: 'مدير',
    roleEditor: 'محرر',
    roleReviewer: 'مراجع',
    roleViewer: 'مشاهد',
    roleAuditor: 'مدقق',

    // Landing Page
    solution: 'الحل',
    features: 'المميزات',
    howItWorks: 'كيف يعمل',
    heroTitle: 'حوّل أرشيف مؤسستك إلى نظام ذكي.',
    heroSubtitle: 'SADI PRO AI',
    heroDesc: 'SADI PRO AI هو نظام ذكي لأرشفة وإدارة وتحليل وثائق المؤسسات، يساعدك على رقمنة الوثائق، استخراج المعلومات تلقائيًا، البحث داخل آلاف الملفات، وأتمتة دورة حياة الوثيقة.',
    startFree: 'ابدأ مجانًا',
    seeHowItWorks: 'شاهد كيف يعمل',
    heroAiInsight: '47 عقد تنتهي خلال 30 يومًا. كشف الذكاء الاصطناعي عن 3 وثائق عالية القيمة تتطلب مراجعة فورية.',
    archivedDocs: 'وثيقة مؤرشفة',
    autoClassify: 'تصنيف وتلقائي بالذكاء الاصطناعي',
    languages: '3 لغات',
    secureAccess: 'وصول آمن 24/7',
    problemTitle: 'هل ما زالت مؤسستك تعتمد على الأرشيف التقليدي؟',
    problemDesc: 'ملفات مبعثرة، معلومات ضائعة، وقت ضائع، وعمليات يدوية.',
    problem1: '📁 ملفات مبعثرة عبر الأقسام',
    problem2: '🔍 صعوبة العثور على المعلومات',
    problem3: '⌛ وقت ضائع في البحث عن الوثائق',
    problem4: '📝 إدخال بيانات يدوي',
    problem5: '📄 وثائق مكررة',
    problem6: '⚠️ عقود ومواعيد منسية',
    problem7: '🔓 صعوبة التحكم في الصلاحيات',
    problemSolution: 'SADI PRO AI يحول هذه العملية إلى أرشيف ذكي.',
    howItWorksTitle: 'من الوثيقة إلى المعلومة في ثوانٍ',
    howItWorksDesc: 'عملية بسيطة من 5 خطوات لرقمنة إدارة وثائقك بذكاء.',
    step1Title: 'ارفع',
    step1Desc: 'ارفع PDF أو صورة أو مستند Office.',
    step2Title: 'SADI يفهم',
    step2Desc: 'OCR + AI يقوم بقراءة وتصنيف الوثيقة.',
    step3Title: 'استخرج',
    step3Desc: 'يستخرج تلقائيًا الاسم والتاريخ والمبلغ والأطراف والتصنيف والكلمات المفتاحية.',
    step4Title: 'أرشف',
    step4Desc: 'يضع الوثيقة في المكان الصحيح مع Metadata وPermissions.',
    step5Title: 'ابحث واسأل',
    step5Desc: 'ابحث باللغة الطبيعية أو اسأل SADI AI مباشرة.',
    aiTitle: 'الذكاء الاصطناعي يفهم وثائقك',
    aiDesc: 'ذكاء اصطناعي يفهم ويrocess وثائقك.',
    aiFeature1: 'التصنيف الذكي',
    aiFeature1Desc: 'يتعرف تلقائيًا على نوع الوثيقة وتصنيفها.',
    aiFeature2: 'OCR',
    aiFeature2Desc: 'حوّل الوثائق والصور الممسوحة إلى نص قابل للبحث.',
    aiFeature3: 'استخراج المعلومات',
    aiFeature3Desc: 'يستخرج البيانات المهمة دون إدخال يدوي.',
    aiFeature4: 'البحث الدلالي',
    aiFeature4Desc: 'ابحث عن المعلومات وليس فقط أسماء الملفات.',
    aiFeature5: 'مساعد الذكاء الاصطناعي',
    aiFeature5Desc: 'اسأل عن محتوى أرشيفك واحصل على إجابات مبنية على وثائقك.',
    aiFeature6: 'بيانات وصفية ذكية',
    aiFeature6Desc: 'أنشئ Metadata وTags تلقائيًا.',
    searchDemoTitle: 'اسأل أرشيفك',
    searchDemoDesc: 'اسأل أسئلة باللغة الطبيعية واحصل على إجابات فورية من وثائقك.',
    searchDemoQuery: 'ما هي العقود التي تنتهي خلال 30 يومًا؟',
    searchDemoResult: 'وجدت 8 عقود تستوفي شروط البحث.',
    expires: 'ينتهي',
    viewResults: 'عرض النتائج',
    archiveTitle: 'أرشيف منظم، قابل للبحث، وذكي',
    archiveDesc: 'نظّم وثائقك بمجلدات وإصدارات وبيانات وصفية وعلامات وسياسات احتفاظ وصلاحيات دقيقة.',
    versionControl: 'التحكم بالإصدارات',
    smartTags: 'العلامات الذكية',
    retention: 'سياسات الاحتفاظ',
    fullTextSearch: 'البحث النصي الكامل',
    legal: 'القانوني',
    finance: 'المالي',
    hr: 'الموارد البشرية',
    contracts: 'العقود',
    agreements: 'الاتفاقيات',
    legalDocs: 'الوثائق القانونية',
    invoices: 'الفواتير',
    reports: 'التقارير',
    payments: 'المدفوعات',
    employees: 'الموظفون',
    empContracts: 'عقود العمل',
    certificates: 'الشهادات',
    workflowTitle: 'أتمتة دورة حياة الوثيقة',
    workflowDesc: 'لا تكتفِ بالأرشفة — أتمتة كاملة من الرفع إلى الاحتفاظ.',
    wfUpload: 'رفع الوثيقة',
    wfClassify: 'التصنيف بالذكاء الاصطناعي',
    wfReview: 'المراجعة',
    wfApproval: 'الموافقة',
    wfArchive: 'الأرشفة',
    wfAlert: 'تنبيه الانتهاء',
    wfRenewal: 'الاحتفاظ / التجديد',
    workflowExample: '⚠️ عقد سينتهي بعد 30 يومًا — إرسال تنبيه → مراجعة → موافقة → تجديد',
    securityTitle: 'أمان مؤسسي لوثائقك',
    securityDesc: 'وثائقك محمية بمعايير أمان صناعية.',
    tls: 'TLS',
    active: 'نشط',
    monitoring: 'مراقبة',
    useCasesTitle: 'مصمم لكل قسم في مؤسستك',
    useCasesDesc: 'SADI PRO AI يخدم الأقسام القانونية والمالية والموارد البشرية والإدارية.',
    useCase1: 'القسم القانوني',
    useCase1Desc: 'العقود والاتفاقيات والوثائق القانونية مع التحكم بالإصدارات والامتثال.',
    useCase2: 'المالية',
    useCase2Desc: 'الفواتير والتقارير المالية والميزانيات والمستندات المالية.',
    useCase3: 'الموارد البشرية',
    useCase3Desc: 'ملفات الموظفين والعقود والشهادات وتقييمات الأداء.',
    useCase4: 'الإدارة',
    useCase4Desc: 'أرشيف مركزي وتقارير وتحليلات تنظيمية.',
    useCase5: 'المشتريات',
    useCase5Desc: 'أوامر الشراء وعقود الموردين وإدارة الموردين.',
    pricingDesc: 'ابدأ مجانًا مع خطة Starter. قم بالترقية في أي وقت.',
    popular: 'الأكثر شعبية',
    planStarterDesc: 'للأفراد والفرق الصغيرة.',
    planBusinessDesc: 'للشركات الصغيرة والمتوسطة.',
    planProDesc: 'للمؤسسات والفرق الكبيرة.',
    planEnterpriseDesc: 'بنية تحتية وصلاحيات وتكتيكات مخصصة.',
    custom: 'حسب الطلب',
    monthHT: 'شهر HT',
    contactUs: 'تواصل معنا',
    faqTitle: 'الأسئلة الشائعة',
    faqArabic: 'هل يدعم SADI PRO اللغة العربية؟',
    faqArabicAnswer: 'نعم، SADI PRO AI يدعم العربية والفرنسية والإنجليزية بالكامل مع تخطيط RTL وخطوط عربية.',
    faqFormats: 'ما أنواع الوثائق المدعومة؟',
    faqFormatsAnswer: 'PDF وWord وExcel وPowerPoint والصور (PNG, JPG, TIFF) والملفات النصية وCSV وJSON وXML وHTML وأرشيفات ZIP.',
    faqSearch: 'هل يمكن البحث داخل الوثائق؟',
    faqSearchAnswer: 'نعم، SADI PRO يستخدم البحث النصي الكامل في PostgreSQL والبحث الدلالي بالذكاء الاصطناعي للعثور على المعلومات داخل وثائقك.',
    faqPermissions: 'هل يمكن تحديد صلاحيات المستخدمين؟',
    faqPermissionsAnswer: 'نعم، SADI PRO يمتلك نظام RBAC كامل بأدوار (المالك، المدير، المدير، المحرر، المراجع، المشاهد، المدقق) وصلاحيات دقيقة.',
    faqSecurity: 'هل بياناتي آمنة؟',
    faqSecurityAnswer: 'نعم. الملفات مخزنة في Cloudflare R2 (مشفرة)، جميع API تستخدم JWT، كلمات المرور مشفرة بـ bcrypt، جميع endpoints محمية بـ RBAC.',
    ctaTitle: 'حوّل أرشيفك إلى مصدر ذكي للمعلومات.',
    ctaDesc: 'ابدأ في تنظيم وثائقك، استخراج المعلومات منها، والوصول إليها بشكل أسرع.',

    create: 'إنشاء',
    createDocument: 'إنشاء وثيقة',
    createDocumentDesc: 'قالب · رفع · معاينة · سير العمل',
    documentNumber: 'رقم الوثيقة',
    issuingAuthority: 'الجهة المصدرة',
    documentDate: 'تاريخ الوثيقة',
    creationDate: 'تاريخ الإنشاء',
    priority: 'الأولوية',
    workflow: 'سير العمل',
    retentionManagement: 'إدارة الاحتفاظ',
    retentionSuggestion: 'اقتراح الذكاء الاصطناعي',
    confidence: 'الثقة',
    applicableRule: 'القاعدة المطبقة',
    accept: 'قبول',
    approve: 'موافقة',
    modify: 'تعديل',
    reject: 'رفض',
    refresh: 'تحديث',
    by: 'بواسطة',
    traceability: 'التتبع',
    electronicSignature: 'التوقيع الإلكتروني',
    addSigner: 'إضافة موقع',
    signatures: 'التواقيع',
    translate: 'ترجمة',
    translateToArabic: 'ترجمة إلى العربية',
    translateToFrench: 'ترجمة إلى الفرنسية',
    translateToEnglish: 'ترجمة إلى الإنجليزية',
    expiringDocs: 'الوثائق التي تنتهي قريباً',
    critical: 'حرج',
    high: 'مرتفع',
    medium: 'متوسط',
    low: 'منخفض',
    recommendedAction: 'الإجراء الموصى به',
    disposalQueue: 'قائمة الإتلاف',
    legalKnowledgeBase: 'قاعدة المعرفة القانونية',
    legalKnowledgeBaseDesc: 'القوانين والمناشير والقرارات المتعلقة بالأرشيف وإدارة الوثائق في الجزائر',
    workflowStepper: 'سير العمل',
    classificationRestricted: 'محظور',
    archivePermanent: 'أرشيف دائم',
    approvalSigned: 'موقع',
    approvalActive: 'نشط',
    previewBeforeSave: 'معاينة قبل الحفظ',
    template: 'قالب',
    templateBlank: 'فارغ',
    templateContract: 'عقد',
    templateReport: 'تقرير',
    templateLetter: 'رسالة',
    templateInvoice: 'فاتورة',
    saveAsDraft: 'حفظ كمسودة',
    sendForReview: 'إرسال للمراجعة',
    sendForSignature: 'إرسال للتوقيع',
    toPermanentArchive: 'إلى الأرشيف الدائم',
    requestDisposal: 'طلب الإتلاف',
    languageDetected: 'اللغة',
    document: 'وثيقة',
    category: 'فئة',
    owner: 'المالك',
    expiration: 'الانتهاء',
    totalExpiring: 'إجمالي المنتهية',
    allTypes: 'كل الأنواع',
    allPriority: 'كل الأولويات',
    pipelineUpload: 'الرفع',
    pipelineVirusScan: 'فحص الفيروسات',
    pipelineValidation: 'التحقق',
    pipelineHash: 'التجزئة',
    pipelineDedup: 'إزالة التكرار',
    pipelineOcr: 'التعرف الضوئي',
    pipelineTextExtraction: 'استخراج النص',
    pipelineMetadata: 'البيانات الوصفية',
    pipelineClassification: 'التصنيف',
    pipelineChunking: 'التقطيع',
    pipelineEmbedding: 'التضمين',
    pipelineIndexing: 'الفهرسة',
    pipelineAiAnalysis: 'تحليل الذكاء الاصطناعي',
    pipelineReady: 'جاهز',
  },

  fr: {
    appName: 'SADI PRO',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    export: 'Exporter',
    import: 'Importer',
    upload: 'Téléverser',
    download: 'Télécharger',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',

    dashboard: 'Tableau de bord',
    documents: 'Documents',
    collections: 'Collections',
    searchPage: 'Recherche',
    processing: 'Traitement',
    workflows: 'Flux de travail',
    compliance: 'Conformité',
    team: 'Équipe',
    analytics: 'Analyses',
    notifications: 'Notifications',
    activity: 'Journal',
    trash: 'Corbeille',
    documentation: 'Documentation',
    settings: 'Paramètres',

    signIn: 'Se connecter',
    signUp: "S'inscrire",
    signOut: 'Se déconnecter',
    email: 'E-mail',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    organizationName: "Nom de l'organisation",
    welcomeBack: 'Bon retour',
    createAccount: 'Créer votre compte',
    forgotPassword: 'Mot de passe oublié?',
    noAccount: "Vous n'avez pas de compte?",
    hasAccount: 'Vous avez déjà un compte?',

    totalDocuments: 'Total des documents',
    processingQueue: 'File de traitement',
    needsReview: 'À réviser',
    expiringSoon: 'Expire bientôt',
    storageUsed: 'Espace utilisé',
    recentActivity: 'Activité récente',
    aiInsights: 'Analyses IA',

    allDocuments: 'Tous les documents',
    uploadDocuments: 'Téléverser des documents',
    dragDropFiles: 'Glissez-déposez vos fichiers ici',
    orClickToUpload: 'ou cliquez pour téléverser',
    supportedFormats: 'PDF, DOCX, XLSX, PPTX, TXT, CSV, Images, ZIP',
    documentType: 'Type de document',
    classification: 'Classification',
    status: 'Statut',
    department: 'Département',
    uploadedAt: 'Téléversé le',
    fileSize: 'Taille du fichier',
    version: 'Version',
    tags: 'Étiquettes',
    metadata: 'Métadonnées',
    aiInsightsDoc: 'Analyses IA',
    versions: 'Versions',
    activity: 'Activité',
    permissions: 'Permissions',

    retentionPolicies: 'Politiques de rétention',
    legalHolds: 'Gels juridiques',
    auditLogs: "Journaux d'audit",
    recordsManagement: 'Gestion des documents',

    organization: 'Organisation',
    billing: 'Facturation',
    security: 'Sécurité',
    language: 'Langue',
    currentPlan: 'Plan actuel',
    upgrade: 'Mettre à niveau',
    monthly: 'Mensuel',
    annual: 'Annuel',
    days: 'jours',
    trialDaysLeft: 'Essai gratuit',
    trialExpired: 'Essai expiré',
    trialExpiredDesc: 'Votre essai gratuit est terminé. Abonnez-vous pour continuer à téléverser des documents.',
    trialDesc: 'Fonctionnalités du plan Starter. Passez à niveau à tout moment pour plus de stockage et d\'utilisateurs.',
    subscribe: 'S\'abonner',
    paymentTitle: 'Paiement',
    paymentGatewayDesc: 'Gateway algérien: Chargily Pay / SATIM — DZD — CIB / Edahabia / BaridiMob + Virement',
    paymentDemoMode: 'Mode démo (sans CHARGILY_API_KEY) — simulation de paiement uniquement, pas de débit réel.',
    paymentOpenGateway: 'Ouvrir Chargily',
    paymentInvoiceInfo: 'NIF/NIS/RC sur facture PDF • TVA 19% incluse • Reçu instantané • Support: contact@sadi.pro',
    paymentClose: 'Fermer',

    noDocuments: 'Aucun document pour le moment',
    noMetadata: 'Aucune métadonnée disponible',
    noSearchResults: 'Aucun résultat trouvé',
    uploadSuccess: 'Documents téléversés avec succès',
    processingStarted: 'Traitement démarré',
    documentArchived: 'Document archivé',
    documentDeleted: 'Document déplacé vers la corbeille',

    aiAssistant: 'Assistant IA',
    askAboutDocs: 'Posez des questions sur vos documents en langage naturel.',
    askSadi: 'Demander à SADI IA',

    statusUploading: 'Téléversement',
    statusQueued: 'En attente',
    statusProcessing: 'Traitement',
    statusExtracting: 'Extraction',
    statusIndexing: 'Indexation',
    statusAnalyzing: 'Analyse',
    statusCompleted: 'Terminé',
    statusFailed: 'Échoué',
    statusQuarantined: 'En quarantaine',

    typeContract: 'Contrat',
    typeInvoice: 'Facture',
    typeReport: 'Rapport',
    typeCertificate: 'Certificat',
    typeLetter: 'Lettre',
    typeId: "Pièce d'identité",
    typePolicy: 'Politique',
    typeLegal: 'Document juridique',
    typeHr: 'Document RH',
    typeFinancial: 'Financier',
    typeTechnical: 'Technique',
    typeOther: 'Autre',

    classificationPublic: 'Public',
    classificationInternal: 'Interne',
    classificationConfidential: 'Confidentiel',
    classificationHighlyConfidential: 'Très confidentiel',

    archiveActive: 'Actif',
    archiveInactive: 'Inactif',
    archiveArchived: 'Archivé',
    archiveOnHold: 'En attente',
    archivePendingDisposal: 'En attente de destruction',
    archiveDisposed: 'Détruit',

    approvalDraft: 'Brouillon',
    approvalPendingReview: 'En cours de révision',
    approvalApproved: 'Approuvé',
    approvalRejected: 'Rejeté',
    approvalArchived: 'Archivé',

    langAr: 'Arabe',
    langFr: 'Français',
    langEn: 'Anglais',
    langUnknown: 'Inconnu',

    roleOwner: 'Propriétaire',
    roleAdmin: 'Administrateur',
    roleManager: 'Gestionnaire',
    roleEditor: 'Éditeur',
    roleReviewer: 'Réviseur',
    roleViewer: 'Lecteur',
    roleAuditor: 'Auditeur',

    // Landing Page
    solution: 'Solution',
    features: 'Fonctionnalités',
    howItWorks: 'Comment ça marche',
    heroTitle: 'Transformez votre archive en système intelligent.',
    heroSubtitle: 'SADI PRO AI',
    heroDesc: 'SADI PRO AI est un système intelligent d\'archivage et de gestion de documents qui numérise les documents, extrait automatiquement les informations, recherche dans des milliers de fichiers et automatise le cycle de vie des documents.',
    startFree: 'Commencer gratuitement',
    seeHowItWorks: 'Voir comment ça marche',
    heroAiInsight: '47 contrats expirant dans les 30 prochains jours. L\'IA a détecté 3 documents à haute valeur nécessitant une révision immédiate.',
    archivedDocs: 'Documents archivés',
    autoClassify: 'Classification automatique par IA',
    languages: '3 langues',
    secureAccess: 'Accès sécurisé 24/7',
    problemTitle: 'Votre organisation utilise-t-elle encore un archivage traditionnel ?',
    problemDesc: 'Fichiers dispersés, informations perdues, temps perdu et processus manuels.',
    problem1: '📁 Fichiers dispersés entre les départements',
    problem2: '🔍 Difficulté à trouver les informations',
    problem3: '⌛ Temps perdu à chercher des documents',
    problem4: '📝 Saisie manuelle de données',
    problem5: '📄 Documents en double',
    problem6: '⚠️ Contrats et échéances oubliés',
    problem7: '🔓 Difficulté à contrôler les permissions',
    problemSolution: 'SADI PRO AI transforme ce processus en archive intelligente.',
    howItWorksTitle: 'Du document à la connaissance en quelques secondes',
    howItWorksDesc: 'Un processus simple en 5 étapes pour numériser et gérer intelligemment vos documents.',
    step1Title: 'Téléverser',
    step1Desc: 'Téléversez PDF, image ou document Office.',
    step2Title: 'SADI comprend',
    step2Desc: 'OCR + IA lit et classe le document.',
    step3Title: 'Extraire',
    step3Desc: 'Extrait automatiquement le nom, la date, le montant, les parties, la classification et les mots-clés.',
    step4Title: 'Archiver',
    step4Desc: 'Place le document au bon endroit avec métadonnées et permissions.',
    step5Title: 'Rechercher et demander',
    step5Desc: 'Recherchez en langage naturel ou demandez directement à SADI AI.',
    aiTitle: 'Intelligence documentaire par IA',
    aiDesc: 'Intelligence artificielle qui comprend et traite vos documents.',
    aiFeature1: 'Classification intelligente',
    aiFeature1Desc: 'Reconnaît automatiquement le type de document et le classe.',
    aiFeature2: 'OCR',
    aiFeature2Desc: 'Convertit les documents numérisés et images en texte searchable.',
    aiFeature3: 'Extraction d\'informations',
    aiFeature3Desc: 'Extrait les données importantes sans saisie manuelle.',
    aiFeature4: 'Recherche sémantique',
    aiFeature4Desc: 'Recherchez des informations, pas seulement des noms de fichiers.',
    aiFeature5: 'Assistant IA',
    aiFeature5Desc: 'Posez des questions sur le contenu de votre archive et obtenez des réponses basées sur les documents.',
    aiFeature6: 'Métadonnées intelligentes',
    aiFeature6Desc: 'Crée automatiquement métadonnées et tags.',
    searchDemoTitle: 'Interrogez votre archive',
    searchDemoDesc: 'Posez des questions en langage naturel et obtenez des réponses instantanées de vos documents.',
    searchDemoQuery: 'Quels contrats expirent dans les 30 prochains jours ?',
    searchDemoResult: '8 contrats correspondant à vos critères de recherche trouvés.',
    expires: 'Expire le',
    viewResults: 'Voir les résultats',
    archiveTitle: 'Archive organisée, searchable et intelligente',
    archiveDesc: 'Structurez vos documents avec dossiers, versions, métadonnées, tags, politiques de rétention et permissions granulaires.',
    versionControl: 'Contrôle de version',
    smartTags: 'Tags intelligents',
    retention: 'Politiques de rétention',
    fullTextSearch: 'Recherche plein texte',
    legal: 'Juridique',
    finance: 'Finance',
    hr: 'Ressources humaines',
    contracts: 'Contrats',
    agreements: 'Accords',
    legalDocs: 'Documents juridiques',
    invoices: 'Factures',
    reports: 'Rapports',
    payments: 'Paiements',
    employees: 'Employés',
    empContracts: 'Contrats de travail',
    certificates: 'Certificats',
    workflowTitle: 'Automatisez le cycle de vie de vos documents',
    workflowDesc: 'Pas seulement de l\'archivage — automatisation complète du téléchargement à la rétention.',
    wfUpload: 'Téléverser le document',
    wfClassify: 'Classification IA',
    wfReview: 'Révision',
    wfApproval: 'Approbation',
    wfArchive: 'Archiver',
    wfAlert: 'Alerte d\'expiration',
    wfRenewal: 'Rétention / Renouvellement',
    workflowExample: '⚠️ Contrat expirant dans 30 jours — Alerte → Révision → Approbation → Renouvellement',
    securityTitle: 'Sécurité de niveau entreprise pour vos documents',
    securityDesc: 'Vos documents sont protégés par des mesures de sécurité standard de l\'industrie.',
    tls: 'TLS',
    active: 'Actif',
    monitoring: 'Surveillance',
    useCasesTitle: 'Conçu pour chaque département',
    useCasesDesc: 'SADI PRO AI sert les équipes juridiques, financières, RH et opérationnelles.',
    useCase1: 'Département juridique',
    useCase1Desc: 'Contrats, accords et documents juridiques avec contrôle de version et conformité.',
    useCase2: 'Finance',
    useCase2Desc: 'Factures, rapports financiers, budgets et documents de paiement.',
    useCase3: 'Ressources humaines',
    useCase3Desc: 'Dossiers d\'employés, contrats, certificats et évaluations de performance.',
    useCase4: 'Administration',
    useCase4Desc: 'Archive centralisée, rapports et analyses organisationnelles.',
    useCase5: 'Achats',
    useCase5Desc: 'Bons de commande, contrats fournisseurs et gestion des vendors.',
    pricingDesc: 'Commencez gratuitement avec le plan Starter. Passez à niveau à tout moment.',
    popular: 'Populaire',
    planStarterDesc: 'Pour les individus et petites équipes.',
    planBusinessDesc: 'Pour les petites et moyennes entreprises.',
    planProDesc: 'Pour les grandes entreprises et équipes.',
    planEnterpriseDesc: 'Infrastructure, permissions et intégrations personnalisées.',
    custom: 'Personnalisé',
    monthHT: 'mois HT',
    contactUs: 'Nous contacter',
    faqTitle: 'Questions fréquentes',
    faqArabic: 'SADI PRO supporte-t-il l\'arabe ?',
    faqArabicAnswer: 'Oui, SADI PRO AI supporte entièrement l\'arabe, le français et l\'anglais avec disposition RTL et polices arabes.',
    faqFormats: 'Quels formats de documents sont supportés ?',
    faqFormatsAnswer: 'PDF, Word, Excel, PowerPoint, images (PNG, JPG, TIFF), fichiers texte, CSV, JSON, XML, HTML et archives ZIP.',
    faqSearch: 'Puis-je rechercher dans les documents ?',
    faqSearchAnswer: 'Oui, SADI PRO utilise la recherche plein texte PostgreSQL et la recherche sémantique par IA pour trouver des informations dans vos documents.',
    faqPermissions: 'Puis-je contrôler les permissions utilisateurs ?',
    faqPermissionsAnswer: 'Oui, SADI PRO possède un système RBAC complet avec 7 rôles (Propriétaire, Admin, Manager, Éditeur, Réviseur, Lecteur, Auditeur) et des permissions granulaires.',
    faqSecurity: 'Mes données sont-elles sécurisées ?',
    faqSecurityAnswer: 'Oui. Les fichiers sont stockés dans Cloudflare R2 (chiffrés), tous les appels API utilisent JWT, les mots de passe sont hashés en bcrypt, et tous les endpoints sont protégés par RBAC.',
    ctaTitle: 'Transformez votre archive en source intelligente d\'informations.',
    ctaDesc: 'Commencez à organiser vos documents, extraire les informations et y accéder plus rapidement.',

    create: 'Créer',
    createDocument: 'Créer un document',
    createDocumentDesc: 'Modèle · Téléversement · Aperçu · Flux',
    documentNumber: 'Numéro de document',
    issuingAuthority: 'Autorité émettrice',
    documentDate: 'Date du document',
    creationDate: 'Date de création',
    priority: 'Priorité',
    workflow: 'Flux de travail',
    retentionManagement: 'Gestion de la rétention',
    retentionSuggestion: 'Suggestion IA',
    confidence: 'Confiance',
    applicableRule: 'Règle applicable',
    accept: 'Accepter',
    approve: 'Approuver',
    modify: 'Modifier',
    reject: 'Rejeter',
    refresh: 'Actualiser',
    by: 'Par',
    traceability: 'Traçabilité',
    electronicSignature: 'Signature électronique',
    addSigner: 'Ajouter signataire',
    signatures: 'Signatures',
    translate: 'Traduire',
    translateToArabic: 'Traduire en arabe',
    translateToFrench: 'Traduire en français',
    translateToEnglish: 'Traduire en anglais',
    expiringDocs: 'Documents expirant bientôt',
    critical: 'CRITIQUE',
    high: 'ÉLEVÉ',
    medium: 'MOYEN',
    low: 'FAIBLE',
    recommendedAction: 'Action recommandée',
    disposalQueue: 'File de destruction',
    legalKnowledgeBase: 'Base de connaissances juridique',
    legalKnowledgeBaseDesc: 'Lois, circulaires et décisions relatives à l’archivage et à la gestion documentaire en Algérie',
    workflowStepper: 'Flux',
    classificationRestricted: 'Restreint',
    archivePermanent: 'Archive permanente',
    approvalSigned: 'Signé',
    approvalActive: 'Actif',
    previewBeforeSave: 'Aperçu avant enregistrement',
    template: 'Modèle',
    templateBlank: 'Vierge',
    templateContract: 'Contrat',
    templateReport: 'Rapport',
    templateLetter: 'Lettre',
    templateInvoice: 'Facture',
    saveAsDraft: 'Enregistrer brouillon',
    sendForReview: 'Envoyer pour révision',
    sendForSignature: 'Envoyer pour signature',
    toPermanentArchive: 'Vers archive permanente',
    requestDisposal: 'Demander destruction',
    languageDetected: 'Langue',
    document: 'Document',
    category: 'Catégorie',
    owner: 'Propriétaire',
    expiration: 'Expiration',
    totalExpiring: 'Total expirant',
    allTypes: 'Tous les types',
    allPriority: 'Toutes les priorités',
    pipelineUpload: 'Téléversement',
    pipelineVirusScan: 'Analyse antivirus',
    pipelineValidation: 'Validation',
    pipelineHash: 'Hachage',
    pipelineDedup: 'Déduplication',
    pipelineOcr: 'OCR',
    pipelineTextExtraction: 'Extraction de texte',
    pipelineMetadata: 'Métadonnées',
    pipelineClassification: 'Classification',
    pipelineChunking: 'Découpage',
    pipelineEmbedding: 'Embedding',
    pipelineIndexing: 'Indexation',
    pipelineAiAnalysis: 'Analyse IA',
    pipelineReady: 'Prêt',
  },
};

let currentLocale: Locale = (localStorage.getItem('sadi_locale') as Locale) || 'en';

const listeners = new Set<() => void>();
function notify() { listeners.forEach((fn) => fn()); }

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try { localStorage.setItem('sadi_locale', locale); } catch {}
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  notify();
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof TranslationKeys): string {
  return translations[currentLocale][key] || translations.en[key] || key;
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// React hook — re-renders when locale changes
import { useSyncExternalStore } from 'react';
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}
export function useTranslation(): { t: typeof t; locale: Locale; setLocale: typeof setLocale } {
  const locale = useLocale();
  return { t: (k: keyof TranslationKeys) => translations[locale][k] || translations.en[k] || k, locale, setLocale };
}

export function isRTL(): boolean {
  return currentLocale === 'ar';
}

// Init dir/lang on load (no notify — avoids double render)
try {
  const saved = localStorage.getItem('sadi_locale') as Locale | null;
  if (saved && ['en', 'fr', 'ar'].includes(saved)) currentLocale = saved;
} catch {}
if (typeof document !== 'undefined') {
  document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLocale;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(currentLocale === 'ar' ? 'ar-DZ' : currentLocale === 'fr' ? 'fr-FR' : 'en-US').format(num);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(currentLocale === 'ar' ? 'ar-DZ' : currentLocale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
