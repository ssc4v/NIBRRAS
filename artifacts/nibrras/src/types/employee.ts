export type EmployeeStatus =
  | 'draft'
  | 'testing'
  | 'active'
  | 'paused'
  | 'failed'
  | 'waiting_approval'
  | 'archived';

export type OperatingMode =
  | 'manual'
  | 'scheduled'
  | 'event_driven'
  | 'supervised'
  | 'autonomous';

export type ApprovalPolicy = 'all' | 'sensitive' | 'none';

export interface AiEmployee {
  id: string;
  name: string;
  jobTitle: string;
  department: string | null;
  description: string | null;
  avatar: string | null;
  mainObjective: string | null;
  responsibilities: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  supervisorId: string | null;
  communicationStyle: string | null;
  preferredLanguage: string | null;
  status: EmployeeStatus;
  operatingMode: OperatingMode;
  tools: string[];
  integrations: string[];
  permissions: Record<string, boolean>;
  memoryConfig: Record<string, unknown>;
  knowledgeSources: string[];
  connectedWorkflows: string[];
  approvalPolicy: string | null;
  templateId: string | null;
  version: number;
  successCount: number;
  errorCount: number;
  pendingApprovals: number;
  lastActivityAt: string | null;
  currentTask: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  jobTitle: string;
  department?: string;
  description?: string;
  avatar?: string;
  mainObjective?: string;
  responsibilities?: string[];
  allowedActions?: string[];
  forbiddenActions?: string[];
  communicationStyle?: string;
  preferredLanguage?: string;
  operatingMode?: OperatingMode;
  tools?: string[];
  permissions?: Record<string, boolean>;
  approvalPolicy?: string;
  templateId?: string;
}

export interface EmployeeTemplate {
  id: string;
  name: string;
  nameEn: string;
  avatar: string;
  jobTitle: string;
  department: string;
  description: string;
  mainObjective: string;
  responsibilities: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  operatingMode: OperatingMode;
  approvalPolicy: string;
  permissions: Record<string, boolean>;
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  draft: 'مسودة',
  testing: 'اختبار',
  active: 'نشط',
  paused: 'متوقف',
  failed: 'فشل',
  waiting_approval: 'انتظار موافقة',
  archived: 'أرشيف',
};

export const MODE_LABELS: Record<OperatingMode, string> = {
  manual: 'يدوي',
  scheduled: 'مجدول',
  event_driven: 'مدفوع بالأحداث',
  supervised: 'مراقَب',
  autonomous: 'مستقل',
};

export const MODE_DESCRIPTIONS: Record<OperatingMode, string> = {
  manual: 'يعمل فقط عند تشغيله يدويًا من قِبلك',
  scheduled: 'يعمل وفق جدول زمني محدد',
  event_driven: 'يُشغَّل بواسطة أحداث (بريد، webhook، رسالة...)',
  supervised: 'يُعدّ العمل وينتظر موافقتك قبل التنفيذ',
  autonomous: 'ينفّذ الإجراءات المسموح بها تلقائيًا',
};

export const EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  {
    id: 'social-media-manager',
    name: 'مدير وسائل التواصل',
    nameEn: 'Social Media Manager',
    avatar: '📱',
    jobTitle: 'مدير وسائل التواصل الاجتماعي',
    department: 'التسويق',
    description: 'يدير المحتوى والتفاعل على منصات التواصل الاجتماعي بشكل ذكي وآمن',
    mainObjective: 'بناء وإدارة حضور احترافي على منصات التواصل الاجتماعي',
    responsibilities: [
      'بحث مواضيع المحتوى',
      'إنشاء محتوى وفق الهوية التجارية',
      'بناء تقويم المحتوى',
      'جدولة المنشورات',
      'مراقبة التعليقات والمحادثات',
      'جمع تحليلات الأداء',
      'إعداد تقارير أسبوعية',
    ],
    allowedActions: ['إنشاء محتوى', 'جدولة منشورات', 'قراءة تحليلات', 'اقتراح هاشتاقات'],
    forbiddenActions: ['نشر بدون موافقة', 'حذف منشورات', 'تغيير كلمات المرور', 'إضافة تطبيقات خارجية'],
    operatingMode: 'supervised',
    approvalPolicy: 'all',
    permissions: {
      draft_content: true,
      schedule_posts: false,
      publish_social: false,
      read_analytics: true,
      reply_comments: false,
      use_paid_models: true,
      access_shared_memory: true,
    },
  },
  {
    id: 'content-researcher',
    name: 'باحث المحتوى',
    nameEn: 'Content Researcher',
    avatar: '🔍',
    jobTitle: 'باحث محتوى',
    department: 'التسويق',
    description: 'يبحث في المصادر الموثوقة ويلخص المعلومات المطلوبة',
    mainObjective: 'توفير معلومات دقيقة وموثوقة لدعم إنشاء المحتوى',
    responsibilities: ['البحث في المصادر الموثوقة', 'تلخيص المعلومات', 'التحقق من الحقائق', 'إنشاء تقارير البحث'],
    allowedActions: ['بحث ويب', 'تلخيص محتوى', 'إنشاء تقارير'],
    forbiddenActions: ['نشر مباشر', 'تعديل بيانات', 'الوصول لمعلومات سرية'],
    operatingMode: 'supervised',
    approvalPolicy: 'sensitive',
    permissions: { web_search: true, read_email: false, use_paid_models: true },
  },
  {
    id: 'email-assistant',
    name: 'مساعد البريد',
    nameEn: 'Email Assistant',
    avatar: '✉️',
    jobTitle: 'مساعد إدارة البريد الإلكتروني',
    department: 'الإدارة',
    description: 'يصنّف البريد الوارد ويصيغ الردود ويرتّب المهام المستخرجة',
    mainObjective: 'تنظيم البريد الإلكتروني وتحسين كفاءة التواصل',
    responsibilities: ['تصنيف البريد الوارد', 'صياغة ردود مقترحة', 'استخراج المهام', 'تنظيم الأولويات'],
    allowedActions: ['قراءة البريد', 'صياغة ردود', 'تصنيف رسائل'],
    forbiddenActions: ['إرسال بريد بدون موافقة', 'حذف رسائل', 'مشاركة بيانات خاصة'],
    operatingMode: 'supervised',
    approvalPolicy: 'all',
    permissions: { read_email: true, draft_email: true, send_email: false },
  },
  {
    id: 'personal-assistant',
    name: 'المساعد الشخصي',
    nameEn: 'Personal Assistant',
    avatar: '🤝',
    jobTitle: 'مساعد شخصي',
    department: 'الإدارة',
    description: 'ينظّم المهام والمواعيد ويُعدّ ملخصات يومية',
    mainObjective: 'زيادة إنتاجيتك من خلال تنظيم مهامك ومواعيدك',
    responsibilities: ['تنظيم المهام اليومية', 'تلخيص الاجتماعات', 'تذكير بالمواعيد', 'إعداد تقارير يومية'],
    allowedActions: ['قراءة التقويم', 'إنشاء مهام', 'إرسال تذكيرات'],
    forbiddenActions: ['تعديل مواعيد بدون تأكيد', 'الوصول للمعلومات المالية'],
    operatingMode: 'supervised',
    approvalPolicy: 'sensitive',
    permissions: { read_calendar: true, create_calendar_event: false, access_shared_memory: true },
  },
  {
    id: 'workflow-developer',
    name: 'مطور سير العمل',
    nameEn: 'Workflow Developer',
    avatar: '⚙️',
    jobTitle: 'مطور وأتمتة سير العمل',
    department: 'التقنية',
    description: 'يصمم ويختبر ويصحح سير العمل في n8n',
    mainObjective: 'بناء وصيانة سير عمل فعّالة وآمنة',
    responsibilities: ['تصميم سير العمل', 'اختبار العمليات', 'تصحيح الأخطاء', 'توثيق العمليات'],
    allowedActions: ['قراءة سير العمل', 'إنشاء مسودة', 'اختبار آمن'],
    forbiddenActions: ['نشر مباشر بدون اختبار', 'حذف إنتاجي', 'تعديل بيانات الاعتماد'],
    operatingMode: 'supervised',
    approvalPolicy: 'all',
    permissions: { read_workflow: true, create_workflow: true, edit_workflow_draft: true, publish_workflow: false, delete_workflow: false },
  },
];

export const DEFAULT_PERMISSIONS: Record<string, { label: string; defaultValue: boolean; highRisk: boolean }> = {
  read_workflow: { label: 'قراءة سير العمل', defaultValue: true, highRisk: false },
  create_workflow: { label: 'إنشاء سير العمل', defaultValue: false, highRisk: false },
  edit_workflow_draft: { label: 'تعديل مسودة سير العمل', defaultValue: false, highRisk: false },
  publish_workflow: { label: 'نشر سير العمل', defaultValue: false, highRisk: true },
  delete_workflow: { label: 'حذف سير العمل', defaultValue: false, highRisk: true },
  read_email: { label: 'قراءة البريد الإلكتروني', defaultValue: false, highRisk: false },
  draft_email: { label: 'صياغة بريد إلكتروني', defaultValue: false, highRisk: false },
  send_email: { label: 'إرسال بريد إلكتروني', defaultValue: false, highRisk: true },
  read_calendar: { label: 'قراءة التقويم', defaultValue: false, highRisk: false },
  create_calendar_event: { label: 'إنشاء أحداث التقويم', defaultValue: false, highRisk: false },
  draft_content: { label: 'صياغة محتوى', defaultValue: true, highRisk: false },
  publish_social: { label: 'نشر على وسائل التواصل', defaultValue: false, highRisk: true },
  reply_comments: { label: 'الرد على التعليقات', defaultValue: false, highRisk: true },
  use_paid_models: { label: 'استخدام نماذج مدفوعة', defaultValue: false, highRisk: false },
  access_shared_memory: { label: 'الوصول للذاكرة المشتركة', defaultValue: false, highRisk: false },
  web_search: { label: 'بحث الويب', defaultValue: true, highRisk: false },
};
