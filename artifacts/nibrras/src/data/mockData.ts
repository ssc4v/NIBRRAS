import type {
  Workflow,
  WorkflowAgent,
  LearningProfile,
  SearchResult,
  Backup,
  LogEntry,
  Message,
  KnowledgeNode,
  Question,
  LearningFile,
  GeneratedQuestionSet,
  KnowledgeEdge,
} from '../types';

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'مرحباً. كيف يمكنني مساعدتك اليوم؟',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ─── Control ─────────────────────────────────────────────────────────────────

export const mockWorkflows: Workflow[] = [
  { id: 'w1', name: 'تحليل البيانات اليومية', status: 'active', lastRun: 'منذ 5 دقائق', agentsCount: 2, pinned: true, hidden: false },
  { id: 'w2', name: 'مراقبة الأخبار التقنية', status: 'active', lastRun: 'منذ ساعة', agentsCount: 3, pinned: false, hidden: false },
];

export const mockAgents: WorkflowAgent[] = [
  { id: 'a1', workflowId: 'w1', name: 'محلل البيانات', role: 'تحليل الأرقام واستخراج الإحصائيات', model: 'gpt-4', tools: ['Python', 'SQL'], databases: ['PostgreSQL'], prompt: 'أنت محلل بيانات دقيق.' },
];

// ─── Legacy learning profile ──────────────────────────────────────────────────

export const mockLearningProfile: LearningProfile = {
  id: 'lp1',
  skills: [
    { id: 's1', label: 'الذكاء الاصطناعي', mastery: 90, dependencies: [] },
    { id: 's2', label: 'تعلم الآلة', mastery: 75, dependencies: ['s1'] },
  ],
  todayLesson: {
    title: 'مقدمة في الجبر الخطي',
    description: 'فهم المصفوفات والمتجهات الأساسية لبناء نماذج الذكاء الاصطناعي.',
    targetSkillId: 's6',
  },
  reviewQueue: [
    { title: 'مراجعة الإحصاء الوصفي', skillId: 's4' },
    { title: 'أساسيات التشفير', skillId: 'c5' },
  ],
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const mockSearchResults: SearchResult[] = [
  { id: 'sr1', title: 'دليل استخدام React', sourceType: 'Official Docs', trustScore: 98, summary: 'المستندات الرسمية لمكتبة واجهات المستخدم.', url: 'https://react.dev' },
];

// ─── Backups / Logs ───────────────────────────────────────────────────────────

export const mockBackups: Backup[] = [
  { id: 'b1', version: 'v1.4.2', date: '2024-10-25 14:30', changedItem: 'تحديث خريطة المعرفة', status: 'completed' },
];

export const mockLogs: LogEntry[] = [
  { id: 'l1', timestamp: '14:35:01', type: 'info', message: 'تم تحميل خريطة المعرفة بنجاح', source: 'learning' },
];

// ─── Knowledge Tree ───────────────────────────────────────────────────────────

export const mockKnowledgeNodes: KnowledgeNode[] = [
  // AI Tree
  { id: 'ai-1', parentId: null, label: 'الذكاء الاصطناعي', type: 'domain', mastery: 65, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ai-1-1', parentId: 'ai-1', label: 'تعلم الآلة', type: 'area', mastery: 50, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ai-1-1-1', parentId: 'ai-1-1', label: 'البيانات', type: 'branch', mastery: 40, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ai-1-1-1-1', parentId: 'ai-1-1-1', label: 'الإحصاء', type: 'sub-branch', mastery: 30, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ai-1-1-1-1-1', parentId: 'ai-1-1-1-1', label: 'الاحتمالات', type: 'lesson', mastery: 20, status: 'needs-review', childCount: 0, questionCount: 5, dependencies: [] },

  // Cyber Tree
  { id: 'cy-1', parentId: null, label: 'الأمن السيبراني', type: 'domain', mastery: 25, status: 'learning', childCount: 6, questionCount: 0, dependencies: [] },
  { id: 'cy-1-1', parentId: 'cy-1', label: 'الشبكات', type: 'area', mastery: 10, status: 'new', childCount: 1, questionCount: 3, dependencies: [] },
  { id: 'cy-1-1-1', parentId: 'cy-1-1', label: 'بروتوكولات الشبكة', type: 'branch', mastery: 5, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-1-1-1', parentId: 'cy-1-1-1', label: 'TCP/IP', type: 'sub-branch', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-1-1-1-1', parentId: 'cy-1-1-1-1', label: 'مقدمة للطبقات', type: 'lesson', mastery: 0, status: 'new', childCount: 0, questionCount: 1, dependencies: [] },
  { id: 'cy-1-2', parentId: 'cy-1', label: 'أنظمة التشغيل', type: 'area', mastery: 15, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-2-1', parentId: 'cy-1-2', label: 'لينكس (Linux)', type: 'branch', mastery: 20, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-2-1-1', parentId: 'cy-1-2-1', label: 'إدارة الصلاحيات', type: 'sub-branch', mastery: 15, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-2-1-1-1', parentId: 'cy-1-2-1-1', label: 'chmod & chown', type: 'lesson', mastery: 10, status: 'needs-review', childCount: 0, questionCount: 0, dependencies: [] },
  { id: 'cy-1-3', parentId: 'cy-1', label: 'اختبار الاختراق', type: 'area', mastery: 15, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-3-1', parentId: 'cy-1-3', label: 'استغلال ثغرات الويب', type: 'branch', mastery: 20, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-3-1-1', parentId: 'cy-1-3-1', label: 'حقن قواعد البيانات', type: 'sub-branch', mastery: 10, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-3-1-1-1', parentId: 'cy-1-3-1-1', label: 'الاستغلال الأعمى (Blind SQLi)', type: 'lesson', mastery: 5, status: 'missing-basics', childCount: 0, questionCount: 2, dependencies: [] },
  { id: 'cy-1-4', parentId: 'cy-1', label: 'التشفير', type: 'area', mastery: 40, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-4-1', parentId: 'cy-1-4', label: 'تشفير غير متماثل', type: 'branch', mastery: 35, status: 'needs-review', childCount: 1, questionCount: 2, dependencies: [] },
  { id: 'cy-1-4-1-1', parentId: 'cy-1-4-1', label: 'خوارزمية RSA', type: 'sub-branch', mastery: 30, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-4-1-1-1', parentId: 'cy-1-4-1-1', label: 'المفاتيح العامة والخاصة', type: 'lesson', mastery: 25, status: 'learning', childCount: 0, questionCount: 1, dependencies: [] },
  { id: 'cy-1-5', parentId: 'cy-1', label: 'البرمجة (أمن)', type: 'area', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-5-1', parentId: 'cy-1-5', label: 'بايثون للأمن', type: 'branch', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-5-1-1', parentId: 'cy-1-5-1', label: 'كتابة السكربتات', type: 'sub-branch', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-5-1-1-1', parentId: 'cy-1-5-1-1', label: 'فحص المنافذ', type: 'lesson', mastery: 0, status: 'new', childCount: 0, questionCount: 0, dependencies: [] },
  { id: 'cy-1-6', parentId: 'cy-1', label: 'الويب (أمن)', type: 'area', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-6-1', parentId: 'cy-1-6', label: 'بنية الويب', type: 'branch', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-6-1-1', parentId: 'cy-1-6-1', label: 'طلبات HTTP', type: 'sub-branch', mastery: 0, status: 'new', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'cy-1-6-1-1-1', parentId: 'cy-1-6-1-1', label: 'الترويسات (Headers)', type: 'lesson', mastery: 0, status: 'new', childCount: 0, questionCount: 0, dependencies: [] },

  // Programming Tree
  { id: 'pr-1', parentId: null, label: 'البرمجة', type: 'domain', mastery: 85, status: 'mastered', childCount: 3, questionCount: 0, dependencies: [] },
  { id: 'pr-1-1', parentId: 'pr-1', label: 'هياكل البيانات', type: 'area', mastery: 80, status: 'mastered', childCount: 1, questionCount: 10, dependencies: [] },
  { id: 'pr-1-1-1', parentId: 'pr-1-1', label: 'الأشجار (Trees)', type: 'branch', mastery: 75, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-1-1-1', parentId: 'pr-1-1-1', label: 'شجرة البحث الثنائية', type: 'sub-branch', mastery: 75, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-1-1-1-1', parentId: 'pr-1-1-1-1', label: 'الاجتياز (Traversal)', type: 'lesson', mastery: 80, status: 'mastered', childCount: 0, questionCount: 0, dependencies: [] },
  { id: 'pr-1-2', parentId: 'pr-1', label: 'هندسة البرمجيات', type: 'area', mastery: 60, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-2-1', parentId: 'pr-1-2', label: 'أنماط التصميم', type: 'branch', mastery: 50, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-2-1-1', parentId: 'pr-1-2-1', label: 'الأنماط الهيكلية', type: 'sub-branch', mastery: 40, status: 'needs-review', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-2-1-1-1', parentId: 'pr-1-2-1-1', label: 'نمط المحول (Adapter)', type: 'lesson', mastery: 30, status: 'learning', childCount: 0, questionCount: 2, dependencies: [] },
  { id: 'pr-1-3', parentId: 'pr-1', label: 'قواعد البيانات', type: 'area', mastery: 90, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-3-1', parentId: 'pr-1-3', label: 'الاستعلامات (SQL)', type: 'branch', mastery: 85, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-3-1-1', parentId: 'pr-1-3-1', label: 'الدمج (Joins)', type: 'sub-branch', mastery: 80, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'pr-1-3-1-1-1', parentId: 'pr-1-3-1-1', label: 'Inner vs Outer Join', type: 'lesson', mastery: 85, status: 'mastered', childCount: 0, questionCount: 0, dependencies: [] },

  // Math Tree
  { id: 'ma-1', parentId: null, label: 'الرياضيات', type: 'domain', mastery: 75, status: 'learning', childCount: 3, questionCount: 0, dependencies: [] },
  { id: 'ma-1-1', parentId: 'ma-1', label: 'الجبر الخطي', type: 'area', mastery: 70, status: 'learning', childCount: 1, questionCount: 8, dependencies: [] },
  { id: 'ma-1-1-1', parentId: 'ma-1-1', label: 'المصفوفات', type: 'branch', mastery: 65, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-1-1-1', parentId: 'ma-1-1-1', label: 'العمليات الأساسية', type: 'sub-branch', mastery: 70, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-1-1-1-1', parentId: 'ma-1-1-1-1', label: 'ضرب المصفوفات', type: 'lesson', mastery: 75, status: 'mastered', childCount: 0, questionCount: 0, dependencies: [] },
  { id: 'ma-1-2', parentId: 'ma-1', label: 'التفاضل والتكامل', type: 'area', mastery: 45, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-2-1', parentId: 'ma-1-2', label: 'التفاضل', type: 'branch', mastery: 55, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-2-1-1', parentId: 'ma-1-2-1', label: 'قاعدة السلسلة', type: 'sub-branch', mastery: 35, status: 'needs-review', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-2-1-1-1', parentId: 'ma-1-2-1-1', label: 'تطبيقات عملية', type: 'lesson', mastery: 20, status: 'learning', childCount: 0, questionCount: 1, dependencies: [] },
  { id: 'ma-1-3', parentId: 'ma-1', label: 'الرياضيات المتقطعة', type: 'area', mastery: 85, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-3-1', parentId: 'ma-1-3', label: 'المنطق', type: 'branch', mastery: 80, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-3-1-1', parentId: 'ma-1-3-1', label: 'جداول الصواب', type: 'sub-branch', mastery: 90, status: 'mastered', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'ma-1-3-1-1-1', parentId: 'ma-1-3-1-1', label: 'بناء الجداول المعقدة', type: 'lesson', mastery: 95, status: 'mastered', childCount: 0, questionCount: 0, dependencies: [] },

  // API / n8n domain
  { id: 'api-1', parentId: null, label: 'APIs والويب', type: 'domain', mastery: 60, status: 'learning', childCount: 3, questionCount: 0, dependencies: [] },
  { id: 'api-1-1', parentId: 'api-1', label: 'HTTP & REST', type: 'area', mastery: 70, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'api-1-1-1', parentId: 'api-1-1', label: 'Webhooks', type: 'branch', mastery: 55, status: 'learning', childCount: 0, questionCount: 1, dependencies: [] },
  { id: 'api-1-2', parentId: 'api-1', label: 'JSON & البيانات', type: 'area', mastery: 80, status: 'mastered', childCount: 0, questionCount: 0, dependencies: [] },
  { id: 'api-1-3', parentId: 'api-1', label: 'n8n وأتمتة العمليات', type: 'area', mastery: 40, status: 'learning', childCount: 1, questionCount: 0, dependencies: [] },
  { id: 'api-1-3-1', parentId: 'api-1-3', label: 'Workflows في n8n', type: 'branch', mastery: 35, status: 'learning', childCount: 0, questionCount: 0, dependencies: [] },
];

// ─── Knowledge Edges (Relationship Map) ──────────────────────────────────────

export const mockKnowledgeEdges: KnowledgeEdge[] = [
  // AI dependencies
  { id: 'e1', sourceId: 'ai-1', targetId: 'ai-1-1', type: 'يعتمد على', strength: 'قوي', confidence: 95, reason: 'الذكاء الاصطناعي يعتمد على تعلم الآلة كمكوّن رئيسي', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e2', sourceId: 'ai-1', targetId: 'ma-1', type: 'يعتمد على', strength: 'قوي', confidence: 90, reason: 'نماذج الذكاء الاصطناعي تستلزم أسساً رياضية متينة', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e3', sourceId: 'ai-1', targetId: 'pr-1', type: 'يعتمد على', strength: 'قوي', confidence: 95, reason: 'تطبيق النماذج يتطلب مهارات برمجية', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e4', sourceId: 'ai-1-1', targetId: 'ai-1-1-1', type: 'يعتمد على', strength: 'قوي', confidence: 90, reason: 'تعلم الآلة يعتمد على البيانات بشكل كامل', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e5', sourceId: 'ai-1-1', targetId: 'ma-1-1', type: 'يعتمد على', strength: 'قوي', confidence: 85, reason: 'خوارزميات تعلم الآلة تستخدم الجبر الخطي', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e6', sourceId: 'ai-1-1', targetId: 'pr-1', type: 'يُستخدم في', strength: 'قوي', confidence: 88, reason: 'تطبيق نماذج ML يتم عبر Python وأدوات البرمجة', createdBy: 'system', createdAt: '2024-01-01' },

  // ML ← Stats
  { id: 'e7', sourceId: 'ai-1-1-1-1', targetId: 'ma-1-2', type: 'متطلب سابق', strength: 'قوي', confidence: 80, reason: 'الإحصاء يحتاج أساساً في التفاضل والتكامل', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e8', sourceId: 'ai-1-1-1-1-1', targetId: 'ma-1-1', type: 'يعتمد على', strength: 'متوسط', confidence: 70, reason: 'الاحتمالات تستخدم مفاهيم الجبر الخطي في النماذج', createdBy: 'system', createdAt: '2024-01-01' },

  // Cyber dependencies
  { id: 'e9', sourceId: 'cy-1', targetId: 'cy-1-1', type: 'جزء من', strength: 'قوي', confidence: 95, reason: 'الشبكات أساس الأمن السيبراني', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e10', sourceId: 'cy-1', targetId: 'pr-1', type: 'يعتمد على', strength: 'قوي', confidence: 85, reason: 'الأمن السيبراني يتطلب معرفة برمجية', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e11', sourceId: 'cy-1', targetId: 'cy-1-4', type: 'يعتمد على', strength: 'متوسط', confidence: 80, reason: 'مفاهيم التشفير أساسية في الأمن', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e12', sourceId: 'cy-1-3', targetId: 'cy-1-1', type: 'متطلب سابق', strength: 'قوي', confidence: 90, reason: 'اختبار الاختراق يتطلب فهم الشبكات أولاً', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e13', sourceId: 'cy-1-3', targetId: 'cy-1-6', type: 'متطلب سابق', strength: 'قوي', confidence: 88, reason: 'استغلال ثغرات الويب يستلزم فهم HTTP وبنية الويب', createdBy: 'system', createdAt: '2024-01-01' },

  // SQL / Cyber confusion
  { id: 'e14', sourceId: 'cy-1-3-1-1', targetId: 'pr-1-3-1', type: 'يسبب لبس مع', strength: 'متوسط', confidence: 75, reason: 'حقن SQL يُخلط أحياناً مع استخدام SQL الاعتيادي', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e15', sourceId: 'cy-1-3-1-1-1', targetId: 'pr-1-3-1', type: 'يختبر', strength: 'متوسط', confidence: 80, reason: 'تنفيذ Blind SQLi يتطلب فهماً عميقاً لـ SQL', createdBy: 'system', createdAt: '2024-01-01' },

  // RSA / Crypto
  { id: 'e16', sourceId: 'cy-1-4-1-1', targetId: 'ma-1-3', type: 'يعتمد على', strength: 'قوي', confidence: 85, reason: 'RSA يستند إلى نظرية الأعداد والرياضيات المتقطعة', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e17', sourceId: 'cy-1-4-1-1', targetId: 'ma-1-2', type: 'يعتمد على', strength: 'ضعيف', confidence: 50, reason: 'بعض خوارزميات التشفير تستخدم مفاهيم التحليل الرياضي', createdBy: 'mock-ai', createdAt: '2024-01-01' },

  // API / n8n / Webhooks
  { id: 'e18', sourceId: 'api-1-3', targetId: 'api-1-1', type: 'يعتمد على', strength: 'قوي', confidence: 95, reason: 'n8n يعتمد على HTTP وREST APIs للتواصل مع الخدمات', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e19', sourceId: 'api-1-3', targetId: 'api-1-1-1', type: 'يُستخدم في', strength: 'قوي', confidence: 92, reason: 'n8n يستخدم Webhooks لاستلام الأحداث', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e20', sourceId: 'api-1-3', targetId: 'api-1-2', type: 'يعتمد على', strength: 'قوي', confidence: 90, reason: 'n8n يعتمد على JSON لتمرير البيانات بين العقد', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e21', sourceId: 'api-1-1-1', targetId: 'api-1-1', type: 'جزء من', strength: 'قوي', confidence: 95, reason: 'Webhook هو آلية داخل بروتوكول HTTP', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e22', sourceId: 'api-1-1-1', targetId: 'api-1-3', type: 'يسبب لبس مع', strength: 'متوسط', confidence: 70, reason: 'يُخلط أحياناً بين API العادي وWebhook وكلاهما مختلف', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e23', sourceId: 'api-1-3-1', targetId: 'ai-1', type: 'يُستخدم في', strength: 'متوسط', confidence: 75, reason: 'يمكن ربط n8n Workflows بوكلاء الذكاء الاصطناعي', createdBy: 'system', createdAt: '2024-01-01' },

  // Cross-domain
  { id: 'e24', sourceId: 'cy-1-5-1', targetId: 'pr-1', type: 'جزء من', strength: 'متوسط', confidence: 80, reason: 'بايثون للأمن هو تخصص ضمن مجال البرمجة العام', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e25', sourceId: 'cy-1-6-1-1', targetId: 'api-1-1', type: 'يشبه', strength: 'قوي', confidence: 85, reason: 'طلبات HTTP في سياق الأمن وسياق APIs متطابقة التقنية', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e26', sourceId: 'ma-1-1', targetId: 'ai-1-1', type: 'يشرح', strength: 'قوي', confidence: 90, reason: 'الجبر الخطي يشرح الرياضيات الداخلية لخوارزميات ML', createdBy: 'system', createdAt: '2024-01-01' },
  { id: 'e27', sourceId: 'pr-1-3-1-1', targetId: 'cy-1-3-1-1', type: 'مرتبط بـ', strength: 'قوي', confidence: 85, reason: 'JOIN في SQL مرتبط مباشرة بطريقة تنفيذ SQL Injection', createdBy: 'mock-ai', createdAt: '2024-01-02' },
  { id: 'e28', sourceId: 'ai-1-1-1-1-1', targetId: 'ma-1-2-1-1', type: 'يحتاج مراجعة بسبب', strength: 'متوسط', confidence: 65, reason: 'ضعف في الاحتمالات مرتبط بضعف في قاعدة السلسلة', createdBy: 'mock-ai', createdAt: '2024-01-03' },
];

// ─── Questions ────────────────────────────────────────────────────────────────

export const mockQuestions: Question[] = [
  { id: 'q1', title: 'ما هو قانون بايز؟', type: 'text', linkedNodeId: 'ai-1-1-1-1-1', difficulty: 'medium', masteryImpact: 10, correctCount: 2, incorrectCount: 1, lastAnswered: '2024-10-25', explanation: 'قانون بايز يربط الاحتمالات الشرطية.' },
  { id: 'q2', title: 'RSA يعتمد على صعوبة تحليل العوامل الأولية.', type: 'true-false', linkedNodeId: 'cy-1-4-1-1-1', difficulty: 'easy', masteryImpact: 5, correctCount: 5, incorrectCount: 0, correctAnswer: 'true' },
  { id: 'q3', title: 'اشرح خوارزمية البحث الثنائي بكلامك', type: 'explain', linkedNodeId: 'pr-1-1-1-1-1', difficulty: 'hard', masteryImpact: 15, correctCount: 1, incorrectCount: 3 },
  { id: 'q4', title: 'رتب طبقات نموذج OSI من الأسفل إلى الأعلى', type: 'order', linkedNodeId: 'cy-1-1-1-1-1', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0, correctAnswer: 'Physical, Data Link, Network, Transport, Session, Presentation, Application' },
  { id: 'q5', title: 'ما هي المصفوفة الذاتية (Idempotent)?', type: 'multiple-choice', linkedNodeId: 'ma-1-1-1-1-1', difficulty: 'medium', masteryImpact: 10, correctCount: 2, incorrectCount: 2, options: ['مصفوفة تساوي مربعها', 'مصفوفة قطرية', 'مصفوفة محددها صفر', 'مصفوفة متماثلة'], correctAnswer: 'مصفوفة تساوي مربعها' },
  { id: 'q6', title: 'حدد الثغرة في الكود المصور أعلاه', type: 'image', mediaUrl: 'https://placeholder.com/sqli.png', linkedNodeId: 'cy-1-3-1-1-1', difficulty: 'hard', masteryImpact: 20, correctCount: 1, incorrectCount: 4 },
  { id: 'q7', title: 'استخرج خطأ التصميم من هذا المقطع', type: 'video', mediaUrl: 'https://placeholder.com/design-patterns.mp4', linkedNodeId: 'pr-1-2-1-1-1', difficulty: 'medium', masteryImpact: 15, correctCount: 3, incorrectCount: 1 },
  { id: 'q8', title: 'استمع لطلب العميل وحدد النمط المناسب', type: 'audio', mediaUrl: 'https://placeholder.com/client-req.mp3', linkedNodeId: 'pr-1-2-1-1-1', difficulty: 'medium', masteryImpact: 10, correctCount: 2, incorrectCount: 0 },
  { id: 'q9', title: 'قم بتطبيق هجوم Blind SQLi على هذه البيئة الوهمية', type: 'practical', mediaUrl: 'https://labs.nibrras.local/env-1', linkedNodeId: 'cy-1-3-1-1-1', difficulty: 'hard', masteryImpact: 25, correctCount: 0, incorrectCount: 2 },
  { id: 'q10', title: 'أكمل: تعلم الآلة هو فرع من ____ ويهدف إلى ____', type: 'fill-in', linkedNodeId: 'ai-1-1', difficulty: 'easy', masteryImpact: 5, correctCount: 3, incorrectCount: 1, correctAnswer: 'الذكاء الاصطناعي / تعلم النماذج من البيانات' },
];

// ─── Learning Files ───────────────────────────────────────────────────────────

export const mockLearningFiles: LearningFile[] = [
  { id: 'f1', title: 'محاضرة الجبر الخطي 1', type: 'youtube', url: 'https://youtube.com/watch?v=fNk_zzaMoSs', linkedNodeId: 'ma-1-1-1-1-1', linkedQuestionsCount: 5, inReviewQueue: false },
  { id: 'f2', title: 'ملخص التشفير', type: 'pdf', linkedNodeId: 'cy-1-4-1-1-1', linkedQuestionsCount: 2, inReviewQueue: true },
  { id: 'f3', title: 'ملاحظاتي عن بايز', type: 'notes', linkedNodeId: 'ai-1-1-1-1-1', linkedQuestionsCount: 1, inReviewQueue: false },
  { id: 'f4', title: 'مقال: أنماط التصميم في React', type: 'article', linkedNodeId: 'pr-1-2-1-1-1', linkedQuestionsCount: 3, inReviewQueue: false },
  { id: 'f5', title: 'فيديو: شرح Blind SQLi', type: 'video', linkedNodeId: 'cy-1-3-1-1-1', linkedQuestionsCount: 2, inReviewQueue: true },
  { id: 'f6', title: 'تطبيقات قاعدة السلسلة', type: 'pdf', linkedNodeId: 'ma-1-2-1-1-1', linkedQuestionsCount: 1, inReviewQueue: false },
  { id: 'f7', title: 'أساسيات نموذج OSI', type: 'article', linkedNodeId: 'cy-1-1-1-1-1', linkedQuestionsCount: 4, inReviewQueue: false },
  { id: 'f8', title: 'أمثلة عملية لـ chmod', type: 'notes', linkedNodeId: 'cy-1-2-1-1-1', linkedQuestionsCount: 0, inReviewQueue: false },
];

// ─── Generated question sets (for mock generator history) ─────────────────────

export const mockGeneratedSets: GeneratedQuestionSet[] = [];
