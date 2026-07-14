/**
 * learning.tsx — تبويب التعلم
 * 5 sections: خريطة التعلم | خريطة العلاقات | بنك الأسئلة | مولّد الأسئلة | ملفات التعلم
 * UI calls learningService exclusively — no direct mock data imports.
 * All state is local React state. No backend calls.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, GitBranch, HelpCircle, Wand2, FolderOpen,
  ChevronDown, ChevronLeft, Plus, Trash2, Edit2, Link,
  MoveRight, Archive, AlertCircle, CheckCircle, RefreshCw,
  Youtube, FileText, Image, Video, FileSpreadsheet, StickyNote,
  Search, Filter, Eye, EyeOff,
} from 'lucide-react';
import * as svc from '../services/learningService';
import type {
  KnowledgeNode, KnowledgeEdge, Question, LearningFile,
  GeneratedQuestionSet, KnowledgeRelationshipType, RelationshipStrength,
  QuestionType, QuestionDifficulty, FileType,
} from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'tree' | 'relations' | 'bank' | 'generator' | 'files';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'tree', label: 'خريطة التعلم', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'relations', label: 'خريطة العلاقات', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'bank', label: 'بنك الأسئلة', icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { id: 'generator', label: 'مولّد الأسئلة', icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: 'files', label: 'ملفات التعلم', icon: <FolderOpen className="h-3.5 w-3.5" /> },
];

const NODE_TYPE_LABELS: Record<KnowledgeNode['type'], string> = {
  domain: 'مجال', area: 'معرفة', branch: 'فرع', 'sub-branch': 'فرع فرعي', lesson: 'درس',
};

const STATUS_COLORS: Record<KnowledgeNode['status'], string> = {
  new: 'bg-zinc-700 text-zinc-300',
  learning: 'bg-zinc-600 text-white',
  mastered: 'bg-white text-black',
  'needs-review': 'bg-zinc-800 text-yellow-300 border border-yellow-800',
  'missing-basics': 'bg-zinc-800 text-red-400 border border-red-900',
};

const STATUS_LABELS: Record<KnowledgeNode['status'], string> = {
  new: 'جديد', learning: 'يتعلم', mastered: 'متقن',
  'needs-review': 'يحتاج مراجعة', 'missing-basics': 'ناقص الأساسيات',
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'اختيار متعدد', 'true-false': 'صح/خطأ',
  text: 'سؤال نصي', image: 'سؤال بصورة', video: 'سؤال بفيديو',
  audio: 'سؤال بصوت', order: 'ترتيب خطوات', practical: 'تطبيق عملي',
  explain: 'شرح بكلامك', 'fill-in': 'تكملة فراغ',
};

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: 'سهل', medium: 'متوسط', hard: 'صعب',
};

const RELATIONSHIP_TYPES: KnowledgeRelationshipType[] = [
  'يعتمد على', 'متطلب سابق', 'يشرح', 'مثال على', 'يشبه', 'يعارض',
  'يسبب لبس مع', 'يُستخدم في', 'جزء من', 'نتيجة لـ', 'مرتبط بـ',
  'يختبر', 'مأخوذ من ملف', 'مولّد من فيديو', 'يحتاج مراجعة بسبب',
];

const STRENGTH_OPTIONS: RelationshipStrength[] = ['ضعيف', 'متوسط', 'قوي'];

const FILE_TYPE_ICONS: Record<FileType, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  notes: <StickyNote className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
};

const FILE_TYPE_LABELS: Record<FileType, string> = {
  youtube: 'YouTube', pdf: 'PDF', notes: 'ملاحظات',
  article: 'مقال', video: 'فيديو', image: 'صورة', text: 'نص',
};

// ─── Shared small components ──────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm mb-3 ${
      type === 'ok'
        ? 'border-zinc-600 bg-zinc-900 text-zinc-200'
        : 'border-red-900 bg-zinc-900 text-red-400'
    }`}>
      {type === 'ok'
        ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-white" />
        : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
      <span>{msg}</span>
    </div>
  );
}

function MasteryBar({ value }: { value: number }) {
  return (
    <div className="mt-1 h-1 w-full rounded-full bg-zinc-800">
      <div
        className="h-1 rounded-full bg-white transition-all"
        style={{ width: `${Math.max(2, value)}%` }}
      />
    </div>
  );
}

function Badge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearningPage() {
  const [section, setSection] = useState<SectionId>('tree');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const notify = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div className="flex h-full flex-col bg-black text-white" dir="rtl">
      {/* Section tabs — horizontally scrollable */}
      <div className="shrink-0 overflow-x-auto border-b border-zinc-800 bg-zinc-950">
        <div className="flex min-w-max px-2 pt-2 pb-0 gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                section === s.id
                  ? 'bg-zinc-800 text-white border-t border-x border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="shrink-0 px-4 pt-3">
          <Toast msg={toast.msg} type={toast.type} />
        </div>
      )}

      {/* Section content */}
      <div className="flex-1 overflow-y-auto">
        {section === 'tree' && <KnowledgeTreeSection notify={notify} />}
        {section === 'relations' && <RelationshipMapSection notify={notify} />}
        {section === 'bank' && <QuestionBankSection notify={notify} />}
        {section === 'generator' && <QuestionGeneratorSection notify={notify} />}
        {section === 'files' && <LearningFilesSection notify={notify} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section 1: خريطة التعلم
// ═══════════════════════════════════════════════════════════════════════════════

function KnowledgeTreeSection({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['ai-1', 'cy-1', 'pr-1', 'ma-1']));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState('');
  const [addType, setAddType] = useState<KnowledgeNode['type']>('lesson');

  useEffect(() => {
    void svc.getLearningTree().then((data) => { setNodes(data); setLoading(false); });
  }, []);

  const roots = nodes.filter((n) => n.parentId === null);
  const childrenOf = (id: string) => nodes.filter((n) => n.parentId === id);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleArchive = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await svc.archiveKnowledgeNode(id);
      setNodes((prev) => prev.filter((n) => n.id !== id && n.parentId !== id));
      notify('تمت أرشفة العقدة وأبنائها.');
    } catch {
      notify('فشلت الأرشفة.', 'err');
    } finally { setBusy(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = addLabel.trim();
    if (!label || busy) return;
    setBusy(true);
    try {
      const node = await svc.createKnowledgeNode(label, addParentId, addType);
      setNodes((prev) => [...prev, node]);
      setAddLabel('');
      setAddParentId(null);
      notify(`تمت إضافة "${label}" إلى خريطة التعلم.`);
    } catch {
      notify('فشل الإضافة.', 'err');
    } finally { setBusy(false); }
  };

  function NodeRow({ node, depth }: { node: KnowledgeNode; depth: number }) {
    const children = childrenOf(node.id);
    const isExpanded = expanded.has(node.id);
    return (
      <div>
        <div
          className={`group flex items-center gap-2 rounded-lg p-2 hover:bg-zinc-900 cursor-pointer`}
          style={{ paddingRight: `${12 + depth * 16}px` }}
        >
          <button
            onClick={() => { if (children.length > 0) toggleExpand(node.id); }}
            className="shrink-0 text-zinc-500"
          >
            {children.length > 0
              ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />)
              : <span className="inline-block w-3.5" />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => setAddParentId(node.id)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{node.label}</span>
              <Badge label={NODE_TYPE_LABELS[node.type]} className="bg-zinc-800 text-zinc-400" />
              <Badge
                label={STATUS_LABELS[node.status]}
                className={STATUS_COLORS[node.status]}
              />
              {node.questionCount > 0 && (
                <Badge label={`${node.questionCount} سؤال`} className="bg-zinc-800 text-zinc-400" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-500">إتقان {node.mastery}%</span>
              <div className="flex-1 max-w-[80px]"><MasteryBar value={node.mastery} /></div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
            <button
              onClick={() => setAddParentId(node.id)}
              className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="إضافة فرع فرعي"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => void handleArchive(node.id)}
              disabled={busy}
              className="rounded p-1 hover:bg-zinc-800 text-zinc-600 hover:text-red-400"
              title="أرشفة"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Add child form */}
        {addParentId === node.id && (
          <form
            onSubmit={handleAdd}
            className="mx-4 mb-2 rounded-lg border border-zinc-700 bg-zinc-950 p-3 space-y-2"
            style={{ marginRight: `${16 + depth * 16}px` }}
          >
            <p className="text-xs text-zinc-400">إضافة داخل: <strong className="text-white">{node.label}</strong></p>
            <input
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              placeholder="اسم العنصر الجديد"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              autoFocus
            />
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as KnowledgeNode['type'])}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              {(Object.keys(NODE_TYPE_LABELS) as KnowledgeNode['type'][]).map((t) => (
                <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!addLabel.trim() || busy}
                className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40"
              >
                إضافة
              </button>
              <button
                type="button"
                onClick={() => { setAddParentId(null); setAddLabel(''); }}
                className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {isExpanded && children.map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">خريطة التعلم</h2>
          <p className="text-xs text-zinc-500">مجال ← معرفة ← فرع ← فرع فرعي ← درس</p>
        </div>
        <button
          onClick={() => setAddParentId(null)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" /> مجال جديد
        </button>
      </div>

      {/* Add root node form */}
      {addParentId === null && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950 p-3 space-y-2">
          <p className="text-xs text-zinc-400">إضافة مجال رئيسي جديد</p>
          <input
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            placeholder="اسم المجال"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            autoFocus
          />
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as KnowledgeNode['type'])}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:outline-none"
          >
            {(Object.keys(NODE_TYPE_LABELS) as KnowledgeNode['type'][]).map((t) => (
              <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={!addLabel.trim() || busy} className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40">إضافة</button>
            <button type="button" onClick={() => setAddLabel('')} className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400">مسح</button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-zinc-500 text-center py-8">جاري التحميل…</p>}
      {!loading && roots.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">لا توجد مجالات بعد. أضف مجالاً لتبدأ.</p>
      )}
      {!loading && (
        <div className="space-y-1">
          {roots.map((root) => (
            <NodeRow key={root.id} node={root} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section 2: خريطة العلاقات
// ═══════════════════════════════════════════════════════════════════════════════

function RelationshipMapSection({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<KnowledgeRelationshipType | ''>('');
  const [filterWeak, setFilterWeak] = useState(false);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [missingPrereqs, setMissingPrereqs] = useState<KnowledgeNode[]>([]);
  const [showMissing, setShowMissing] = useState(false);

  // Add edge form state
  const [newEdge, setNewEdge] = useState<{
    sourceId: string; targetId: string;
    type: KnowledgeRelationshipType; strength: RelationshipStrength;
    confidence: number; reason: string;
  }>({
    sourceId: '', targetId: '', type: 'يعتمد على',
    strength: 'متوسط', confidence: 75, reason: '',
  });

  useEffect(() => {
    void svc.getKnowledgeRelationshipGraph().then(({ nodes: n, edges: e }) => {
      setNodes(n); setEdges(e); setLoading(false);
    });
  }, []);

  const nodeById = (id: string) => nodes.find((n) => n.id === id);

  const filteredEdges = edges.filter((e) => {
    if (filterWeak && e.strength !== 'ضعيف') return false;
    if (filterType && e.type !== filterType) return false;
    if (search) {
      const src = nodeById(e.sourceId)?.label ?? '';
      const tgt = nodeById(e.targetId)?.label ?? '';
      const q = search.toLowerCase();
      if (!src.includes(q) && !tgt.includes(q) && !e.type.includes(q)) return false;
    }
    return true;
  });

  const handleRemoveEdge = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await svc.removeKnowledgeRelationshipMock(id);
      setEdges((prev) => prev.filter((e) => e.id !== id));
      notify('تمت إزالة العلاقة.');
    } catch { notify('فشلت الإزالة.', 'err'); }
    finally { setBusy(false); }
  };

  const handleAddEdge = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!newEdge.sourceId || !newEdge.targetId || busy) return;
    setBusy(true);
    try {
      const edge = await svc.createKnowledgeRelationship({
        ...newEdge,
        createdBy: 'user',
      });
      setEdges((prev) => [...prev, edge]);
      setShowAddEdge(false);
      notify('تمت إضافة العلاقة بنجاح.');
    } catch { notify('فشل الإضافة.', 'err'); }
    finally { setBusy(false); }
  };

  const handleFindMissing = async () => {
    if (!selectedNode || busy) return;
    setBusy(true);
    try {
      const missing = await svc.findMissingPrerequisites(selectedNode.id);
      setMissingPrereqs(missing);
      setShowMissing(true);
      if (missing.length === 0) notify('لا توجد متطلبات ناقصة لهذه العقدة.');
      else notify(`تم إبراز ${missing.length} متطلبات بإتقان أقل من 50%.`);
    } catch { notify('فشل الفحص.', 'err'); }
    finally { setBusy(false); }
  };

  const nodeEdges = selectedNode
    ? edges.filter((e) => e.sourceId === selectedNode.id || e.targetId === selectedNode.id)
    : [];

  const strengthColor = (s: RelationshipStrength) =>
    s === 'قوي' ? 'text-white' : s === 'متوسط' ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">خريطة العلاقات</h2>
          <p className="text-xs text-zinc-500">شبكة تربط المعلومات عبر المجالات</p>
        </div>
        <button
          onClick={() => setShowAddEdge(true)}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
        >
          <Plus className="h-3.5 w-3.5" /> إضافة علاقة
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عقدة أو علاقة…"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pr-9 pl-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as KnowledgeRelationshipType | '')}
            className="flex-1 min-w-[140px] rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="">كل أنواع العلاقات</option>
            {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => setFilterWeak(!filterWeak)}
            className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${
              filterWeak ? 'border-zinc-500 bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500'
            }`}
          >
            <Filter className="h-3 w-3" /> العلاقات الضعيفة
          </button>
          {selectedNode && (
            <button
              onClick={handleFindMissing}
              disabled={busy}
              className="flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            >
              <AlertCircle className="h-3 w-3" /> متطلبات ناقصة
            </button>
          )}
        </div>
      </div>

      {/* Missing prereqs highlight */}
      {showMissing && missingPrereqs.length > 0 && (
        <div className="mb-3 rounded-lg border border-yellow-900 bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-yellow-400">متطلبات ناقصة لـ {selectedNode?.label}</p>
            <button onClick={() => setShowMissing(false)} className="text-zinc-600 text-xs">إغلاق</button>
          </div>
          <div className="space-y-1">
            {missingPrereqs.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1">
                <span className="text-xs text-white">{n.label}</span>
                <span className="text-[10px] text-yellow-500">إتقان {n.mastery}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add edge form */}
      {showAddEdge && (
        <form onSubmit={handleAddEdge} className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950 p-4 space-y-3">
          <p className="text-sm font-medium">إضافة علاقة جديدة</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">من (المصدر)</label>
              <select
                value={newEdge.sourceId}
                onChange={(e) => setNewEdge({ ...newEdge, sourceId: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                required
              >
                <option value="">اختر…</option>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">إلى (الهدف)</label>
              <select
                value={newEdge.targetId}
                onChange={(e) => setNewEdge({ ...newEdge, targetId: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                required
              >
                <option value="">اختر…</option>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">نوع العلاقة</label>
              <select
                value={newEdge.type}
                onChange={(e) => setNewEdge({ ...newEdge, type: e.target.value as KnowledgeRelationshipType })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">قوة العلاقة</label>
              <select
                value={newEdge.strength}
                onChange={(e) => setNewEdge({ ...newEdge, strength: e.target.value as RelationshipStrength })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {STRENGTH_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">السبب / الشرح (اختياري)</label>
            <input
              value={newEdge.reason}
              onChange={(e) => setNewEdge({ ...newEdge, reason: e.target.value })}
              placeholder="لماذا توجد هذه العلاقة؟"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!newEdge.sourceId || !newEdge.targetId || busy} className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40">إضافة</button>
            <button type="button" onClick={() => setShowAddEdge(false)} className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400">إلغاء</button>
          </div>
        </form>
      )}

      {/* Node selector panel */}
      {selectedNode && (
        <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{selectedNode.label}</span>
            <button onClick={() => setSelectedNode(null)} className="text-xs text-zinc-500 hover:text-zinc-300">إغلاق</button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-400 mb-2">
            <span>{NODE_TYPE_LABELS[selectedNode.type]}</span>
            <span>·</span>
            <span>إتقان {selectedNode.mastery}%</span>
            <span>·</span>
            <span>{STATUS_LABELS[selectedNode.status]}</span>
            <span>·</span>
            <span>{selectedNode.questionCount} سؤال</span>
          </div>
          <MasteryBar value={selectedNode.mastery} />
          <div className="mt-2">
            <p className="text-[10px] text-zinc-500 mb-1">علاقاتها ({nodeEdges.length})</p>
            {nodeEdges.length === 0
              ? <p className="text-xs text-zinc-600">لا توجد علاقات مسجّلة</p>
              : nodeEdges.map((e) => {
                  const other = nodeById(e.sourceId === selectedNode.id ? e.targetId : e.sourceId);
                  const dir = e.sourceId === selectedNode.id ? '←' : '→';
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-0.5 text-xs">
                      <span className={strengthColor(e.strength)}>●</span>
                      <span className="text-zinc-500">{dir}</span>
                      <span className="text-zinc-200">{other?.label ?? e.sourceId}</span>
                      <span className="text-zinc-500">{e.type}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* Edge list */}
      {loading && <p className="text-sm text-zinc-500 text-center py-8">جاري التحميل…</p>}
      {!loading && (
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-600 mb-2">{filteredEdges.length} علاقة</p>
          {filteredEdges.map((edge) => {
            const src = nodeById(edge.sourceId);
            const tgt = nodeById(edge.targetId);
            return (
              <div
                key={edge.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-sm">
                      <button
                        onClick={() => setSelectedNode(src ?? null)}
                        className="font-medium text-white hover:underline"
                      >
                        {src?.label ?? edge.sourceId}
                      </button>
                      <span className="text-xs rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">{edge.type}</span>
                      <button
                        onClick={() => setSelectedNode(tgt ?? null)}
                        className="font-medium text-white hover:underline"
                      >
                        {tgt?.label ?? edge.targetId}
                      </button>
                    </div>
                    {edge.reason && (
                      <p className="mt-0.5 text-[10px] text-zinc-500 truncate">{edge.reason}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-[10px] text-zinc-600">
                      <span className={strengthColor(edge.strength)}>{edge.strength}</span>
                      <span>·</span>
                      <span>ثقة {edge.confidence}%</span>
                      <span>·</span>
                      <span>{edge.createdBy === 'system' ? 'نظام' : edge.createdBy === 'mock-ai' ? 'Mock AI' : 'مستخدم'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRemoveEdge(edge.id)}
                    disabled={busy}
                    className="shrink-0 rounded p-1 hover:bg-zinc-800 text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredEdges.length === 0 && !loading && (
            <p className="text-sm text-zinc-500 text-center py-6">لا توجد علاقات تطابق البحث.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section 3: بنك الأسئلة
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionBankSection({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filterType, setFilterType] = useState<QuestionType | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState<QuestionDifficulty | ''>('');
  const [filterNode, setFilterNode] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', type: 'text' as QuestionType, difficulty: 'medium' as QuestionDifficulty, linkedNodeId: '' });

  useEffect(() => {
    void Promise.all([svc.listQuestions(), svc.getLearningTree()]).then(([qs, ns]) => {
      setQuestions(qs); setNodes(ns); setLoading(false);
    });
  }, []);

  const filtered = questions.filter((q) => {
    if (filterType && q.type !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    if (filterNode && q.linkedNodeId !== filterNode) return false;
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.title.trim() || busy) return;
    setBusy(true);
    try {
      const q = await svc.createQuestion({ ...newQ, title: newQ.title.trim() });
      setQuestions((prev) => [...prev, q]);
      setNewQ({ title: '', type: 'text', difficulty: 'medium', linkedNodeId: '' });
      setShowAdd(false);
      notify('تمت إضافة السؤال إلى البنك.');
    } catch { notify('فشلت الإضافة.', 'err'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await svc.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      notify('تم حذف السؤال.');
    } catch { notify('فشل الحذف.', 'err'); }
    finally { setBusy(false); }
  };

  const nodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  const difficultyStyle = (d: QuestionDifficulty) =>
    d === 'hard' ? 'text-red-400' : d === 'medium' ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">بنك الأسئلة</h2>
          <p className="text-xs text-zinc-500">{questions.length} سؤال إجمالاً</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
        >
          <Plus className="h-3.5 w-3.5" /> سؤال جديد
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as QuestionType | '')}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">كل الأنواع</option>
          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
            <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as QuestionDifficulty | '')}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">كل الصعوبات</option>
          {(Object.keys(DIFFICULTY_LABELS) as QuestionDifficulty[]).map((d) => (
            <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
          ))}
        </select>
        <select
          value={filterNode}
          onChange={(e) => setFilterNode(e.target.value)}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">كل المجالات</option>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950 p-4 space-y-3">
          <p className="text-sm font-medium">إضافة سؤال جديد</p>
          <textarea
            value={newQ.title}
            onChange={(e) => setNewQ({ ...newQ, title: e.target.value })}
            placeholder="نص السؤال…"
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newQ.type}
              onChange={(e) => setNewQ({ ...newQ, type: e.target.value as QuestionType })}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={newQ.difficulty}
              onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value as QuestionDifficulty })}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {(Object.keys(DIFFICULTY_LABELS) as QuestionDifficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <select
            value={newQ.linkedNodeId}
            onChange={(e) => setNewQ({ ...newQ, linkedNodeId: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">ربط بمعرفة (اختياري)</option>
            {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={!newQ.title.trim() || busy} className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40">إضافة</button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400">إلغاء</button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-zinc-500 text-center py-8">جاري التحميل…</p>}
      <div className="space-y-2">
        {filtered.map((q) => (
          <div key={q.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug mb-1.5">{q.title}</p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <Badge label={QUESTION_TYPE_LABELS[q.type]} className="bg-zinc-800 text-zinc-300" />
                  <Badge label={DIFFICULTY_LABELS[q.difficulty]} className={`bg-zinc-900 border border-zinc-700 ${difficultyStyle(q.difficulty)}`} />
                  {q.linkedNodeId && (
                    <Badge label={nodeLabel(q.linkedNodeId)} className="bg-zinc-900 text-zinc-500 border border-zinc-800" />
                  )}
                  {q.mediaUrl && (
                    <Badge label="وسائط" className="bg-zinc-800 text-zinc-400" />
                  )}
                </div>
                <div className="mt-1.5 flex gap-3 text-[10px] text-zinc-600">
                  <span>✓ {q.correctCount}</span>
                  <span>✗ {q.incorrectCount}</span>
                  <span>تأثير +{q.masteryImpact}%</span>
                </div>
              </div>
              <button
                onClick={() => void handleDelete(q.id)}
                disabled={busy}
                className="shrink-0 rounded p-1 hover:bg-zinc-800 text-zinc-700 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-6">لا توجد أسئلة تطابق الفلتر.</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section 4: مولّد الأسئلة
// ═══════════════════════════════════════════════════════════════════════════════

type GenSource = 'text' | 'youtube' | 'image' | 'video' | 'csv';

const GEN_SOURCES: { id: GenSource; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'text', label: 'نص', icon: <FileText className="h-4 w-4" />, placeholder: 'الصق النص هنا…' },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" />, placeholder: 'https://youtube.com/watch?v=…' },
  { id: 'image', label: 'صورة', icon: <Image className="h-4 w-4" />, placeholder: '[Placeholder] اسم الصورة أو وصفها' },
  { id: 'video', label: 'فيديو', icon: <Video className="h-4 w-4" />, placeholder: '[Placeholder] اسم مقطع الفيديو' },
  { id: 'csv', label: 'CSV', icon: <FileSpreadsheet className="h-4 w-4" />, placeholder: '[Placeholder] ملف CSV' },
];

function QuestionGeneratorSection({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [source, setSource] = useState<GenSource>('text');
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedQuestionSet | null>(null);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [busy, setBusy] = useState(false);
  const [sentToBank, setSentToBank] = useState(false);

  useEffect(() => {
    void svc.getLearningTree().then(setNodes);
  }, []);

  const sourceCfg = GEN_SOURCES.find((s) => s.id === source)!;
  const suggestedNode = result?.suggestedBranchId
    ? nodes.find((n) => n.id === result.suggestedBranchId)
    : null;

  const generate = async () => {
    const val = input.trim();
    if (!val || generating) return;
    setGenerating(true);
    setResult(null);
    setSentToBank(false);
    try {
      let set: GeneratedQuestionSet;
      if (source === 'youtube') set = await svc.generateQuestionsFromYouTubeMock(val);
      else if (source === 'image') set = await svc.generateQuestionsFromImageMock(val);
      else if (source === 'video') set = await svc.generateQuestionsFromVideoMock(val);
      else set = await svc.generateQuestionsFromTextMock(val);
      setResult(set);
    } catch {
      notify('فشل التوليد.', 'err');
    } finally {
      setGenerating(false);
    }
  };

  const sendToBank = async () => {
    if (!result || busy) return;
    setBusy(true);
    try {
      const added = await svc.addGeneratedQuestionsToBank(result);
      setSentToBank(true);
      notify(`تم إرسال ${added.length} سؤال إلى بنك الأسئلة.`);
    } catch {
      notify('فشل الإرسال.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const sendToRelations = async () => {
    if (!result || busy) return;
    setBusy(true);
    try {
      if (source === 'youtube') {
        const edges = await svc.generateRelationshipsFromYouTubeMock(input);
        notify(`تم إنشاء ${edges.length} علاقة في خريطة العلاقات.`);
      } else {
        const edges = await svc.generateRelationshipsFromTextMock(result.sourceTitle);
        notify(`تم إنشاء ${edges.length} علاقة في خريطة العلاقات.`);
      }
    } catch {
      notify('فشل الإرسال.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="font-semibold">مولّد الأسئلة</h2>
        <p className="text-xs text-zinc-500">Mock — لا يوجد اتصال حقيقي بأي خدمة</p>
      </div>

      {/* Source type selector */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {GEN_SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSource(s.id); setInput(''); setResult(null); setSentToBank(false); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              source === s.id
                ? 'border-white bg-white text-black'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mb-3">
        {source === 'text' ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sourceCfg.placeholder}
            rows={4}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sourceCfg.placeholder}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        )}
        {(source === 'image' || source === 'video' || source === 'csv') && (
          <p className="mt-1 text-[10px] text-zinc-600">
            Mock Mode — الرفع الحقيقي غير مفعّل. أدخل وصفاً أو اسم الملف كبديل.
          </p>
        )}
      </div>

      <button
        onClick={generate}
        disabled={!input.trim() || generating}
        className="mb-4 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {generating
          ? <><RefreshCw className="h-4 w-4 animate-spin" /> جاري التوليد…</>
          : <><Wand2 className="h-4 w-4" /> توليد أسئلة</>}
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">{result.sourceTitle}</p>
            {result.sourceUrl && (
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{result.sourceUrl}</p>
            )}
          </div>

          {/* Topics */}
          <div>
            <p className="text-[10px] text-zinc-500 mb-1">المواضيع المستخرجة</p>
            <div className="flex flex-wrap gap-1">
              {result.topics.map((t) => (
                <Badge key={t} label={t} className="bg-zinc-800 text-zinc-300" />
              ))}
            </div>
          </div>

          {/* Suggested branch */}
          {suggestedNode && (
            <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
              <p className="text-[10px] text-zinc-500 mb-0.5">الفرع المقترح</p>
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-sm text-white">{suggestedNode.label}</span>
                <Badge label={NODE_TYPE_LABELS[suggestedNode.type]} className="bg-zinc-800 text-zinc-400" />
              </div>
            </div>
          )}

          {/* Generated questions */}
          <div>
            <p className="text-[10px] text-zinc-500 mb-1">{result.questions.length} أسئلة مولّدة</p>
            <div className="space-y-2">
              {result.questions.map((q, i) => (
                <div key={i} className="rounded-md border border-zinc-800 bg-zinc-900 p-2.5">
                  <p className="text-xs text-white mb-1">{q.title}</p>
                  <div className="flex gap-1.5">
                    <Badge label={QUESTION_TYPE_LABELS[q.type as QuestionType] ?? q.type} className="bg-zinc-800 text-zinc-400" />
                    <Badge label={DIFFICULTY_LABELS[q.difficulty as QuestionDifficulty] ?? q.difficulty} className="bg-zinc-800 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={sendToBank}
              disabled={busy || sentToBank}
              className="flex-1 rounded-md bg-white py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              {sentToBank ? '✓ أُرسل للبنك' : 'أرسل إلى بنك الأسئلة'}
            </button>
            <button
              onClick={sendToRelations}
              disabled={busy}
              className="flex-1 rounded-md border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            >
              أرسل إلى خريطة العلاقات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section 5: ملفات التعلم
// ═══════════════════════════════════════════════════════════════════════════════

function LearningFilesSection({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [files, setFiles] = useState<LearningFile[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFile, setNewFile] = useState({ title: '', type: 'notes' as FileType, url: '', linkedNodeId: '' });
  const [expandedActions, setExpandedActions] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<{ fileId: string; nodeId: string } | null>(null);

  useEffect(() => {
    void Promise.all([svc.getLearningFiles(), svc.getLearningTree()]).then(([fs, ns]) => {
      setFiles(fs); setNodes(ns); setLoading(false);
    });
  }, []);

  const nodeLabel = (id?: string) => id ? (nodes.find((n) => n.id === id)?.label ?? id) : '—';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.title.trim() || busy) return;
    setBusy(true);
    try {
      const f = await svc.createLearningFile({
        title: newFile.title.trim(),
        type: newFile.type,
        url: newFile.url || undefined,
        linkedNodeId: newFile.linkedNodeId || undefined,
      });
      setFiles((prev) => [...prev, f]);
      setNewFile({ title: '', type: 'notes', url: '', linkedNodeId: '' });
      setShowAdd(false);
      notify('تمت إضافة الملف.');
    } catch { notify('فشل الإضافة.', 'err'); }
    finally { setBusy(false); }
  };

  const handleArchive = async (fileId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await svc.archiveLearningFileMock(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      notify('تمت الأرشفة.');
    } catch { notify('فشلت الأرشفة.', 'err'); }
    finally { setBusy(false); setExpandedActions(null); }
  };

  const handleLink = async (fileId: string, nodeId: string) => {
    if (!nodeId || busy) return;
    setBusy(true);
    try {
      const updated = await svc.linkFileToConcept(fileId, nodeId);
      setFiles((prev) => prev.map((f) => f.id === fileId ? updated : f));
      notify('تم ربط الملف بالمعرفة.');
    } catch { notify('فشل الربط.', 'err'); }
    finally { setBusy(false); setLinkTarget(null); setExpandedActions(null); }
  };

  const handleGenerateQuestions = async (fileId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const set = await svc.generateQuestionsFromFileMock(fileId);
      const added = await svc.addGeneratedQuestionsToBank(set);
      notify(`تم توليد ${added.length} سؤال وإرسالها لبنك الأسئلة.`);
    } catch { notify('فشل التوليد.', 'err'); }
    finally { setBusy(false); setExpandedActions(null); }
  };

  const handleMove = async (fileId: string, nodeId: string) => {
    if (!nodeId || busy) return;
    setBusy(true);
    try {
      const updated = await svc.moveLearningFileMock(fileId, nodeId);
      setFiles((prev) => prev.map((f) => f.id === fileId ? updated : f));
      notify('تم نقل الملف.');
    } catch { notify('فشل النقل.', 'err'); }
    finally { setBusy(false); setLinkTarget(null); setExpandedActions(null); }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">ملفات التعلم</h2>
          <p className="text-xs text-zinc-500">{files.length} ملف</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
        >
          <Plus className="h-3.5 w-3.5" /> ملف جديد
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950 p-4 space-y-3">
          <p className="text-sm font-medium">إضافة ملف تعلم</p>
          <input
            value={newFile.title}
            onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
            placeholder="عنوان الملف"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newFile.type}
              onChange={(e) => setNewFile({ ...newFile, type: e.target.value as FileType })}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {(Object.keys(FILE_TYPE_LABELS) as FileType[]).map((t) => (
                <option key={t} value={t}>{FILE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={newFile.linkedNodeId}
              onChange={(e) => setNewFile({ ...newFile, linkedNodeId: e.target.value })}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">ربط بمعرفة (اختياري)</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <input
            value={newFile.url}
            onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
            placeholder="رابط (اختياري)"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={!newFile.title.trim() || busy} className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40">إضافة</button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400">إلغاء</button>
          </div>
        </form>
      )}

      {/* Link to node form */}
      {linkTarget && (
        <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3 space-y-2">
          <p className="text-sm font-medium">{linkTarget.nodeId === 'move' ? 'نقل إلى' : 'ربط بمعرفة'}</p>
          <select
            value={linkTarget.nodeId === 'move' ? '' : linkTarget.nodeId}
            onChange={(e) => setLinkTarget({ ...linkTarget, nodeId: e.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="">اختر عقدة…</option>
            {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!linkTarget.nodeId || linkTarget.nodeId === 'move') return;
                void handleLink(linkTarget.fileId, linkTarget.nodeId);
              }}
              disabled={!linkTarget.nodeId || linkTarget.nodeId === 'move' || busy}
              className="flex-1 rounded-md bg-white py-1.5 text-sm font-medium text-black disabled:opacity-40"
            >
              تأكيد
            </button>
            <button onClick={() => setLinkTarget(null)} className="flex-1 rounded-md border border-zinc-700 py-1.5 text-sm text-zinc-400">إلغاء</button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-zinc-500 text-center py-8">جاري التحميل…</p>}
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
            {/* File header */}
            <div className="flex items-center gap-3 p-3">
              <span className="shrink-0 text-zinc-500">{FILE_TYPE_ICONS[file.type] ?? <FileText className="h-4 w-4" />}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.title}</p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  <Badge label={FILE_TYPE_LABELS[file.type]} className="bg-zinc-800 text-zinc-400" />
                  {file.linkedNodeId && (
                    <Badge label={nodeLabel(file.linkedNodeId)} className="bg-zinc-900 text-zinc-500 border border-zinc-800" />
                  )}
                  {file.linkedQuestionsCount > 0 && (
                    <Badge label={`${file.linkedQuestionsCount} سؤال`} className="bg-zinc-900 text-zinc-500" />
                  )}
                  {file.inReviewQueue && (
                    <Badge label="في قائمة المراجعة" className="bg-zinc-900 text-yellow-600 border border-yellow-900" />
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedActions(expandedActions === file.id ? null : file.id)}
                className="shrink-0 rounded p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white"
              >
                {expandedActions === file.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Expanded actions */}
            {expandedActions === file.id && (
              <div className="border-t border-zinc-800 bg-zinc-900 px-3 py-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setLinkTarget({ fileId: file.id, nodeId: '' }); setExpandedActions(null); }}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <Link className="h-3 w-3" /> ربط بمعرفة
                  </button>
                  <button
                    onClick={() => void handleGenerateQuestions(file.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <Wand2 className="h-3 w-3" /> توليد أسئلة
                  </button>
                  <button
                    onClick={() => { setLinkTarget({ fileId: file.id, nodeId: 'move' }); setExpandedActions(null); }}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <MoveRight className="h-3 w-3" /> نقل
                  </button>
                  <button
                    onClick={() => void handleArchive(file.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-md border border-red-900 px-2 py-1.5 text-xs text-red-400 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <Archive className="h-3 w-3" /> أرشفة
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && files.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-6">لا توجد ملفات تعلم. أضف أول ملف.</p>
        )}
      </div>
    </div>
  );
}
