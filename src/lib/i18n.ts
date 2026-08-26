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

  // Messages
  noDocuments: string;
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
    notifications: 'Notifications',
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

    noDocuments: 'No documents yet',
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
    notifications: 'الإشعارات',
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

    noDocuments: 'لا توجد وثائق بعد',
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
    notifications: 'Notifications',
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

    noDocuments: 'Aucun document pour le moment',
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
