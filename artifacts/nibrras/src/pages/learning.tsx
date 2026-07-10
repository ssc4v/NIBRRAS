import React, { useState, useEffect } from 'react';
import {
  getKnowledgeTree,
  createKnowledgeNode,
  archiveKnowledgeNode,
  linkFileToKnowledgeNode,
  updateLearningFile,
  moveLearningFile,
  archiveLearningFile,
  generateQuestionsFromFileMock,
  addGeneratedQuestionsToMap,
  generateQuestionsFromTextMock,
  generateQuestionsFromImageMock,
  getQuestionsByKnowledgeNode,
  getLearningFiles,
  generateQuestionsFromYouTubeMock,
  addGeneratedQuestionsToBank
} from '../services/learningService';
import { KnowledgeNode, Question, LearningFile, GeneratedQuestionSet } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, BookOpen, BrainCircuit, FileText, 
  Plus, MoreVertical, Image as ImageIcon, Video, Link as LinkIcon, Edit2, ListTree, CheckCircle2, ChevronDown, ChevronLeft, Youtube, RefreshCcw,
  FolderOpen, Mic, TerminalSquare, ListOrdered, Type, FileQuestion, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const typeColorMap: Record<string, string> = {
  domain: 'bg-foreground text-background',
  area: 'bg-muted text-foreground border-border',
  branch: 'bg-muted/60 text-foreground border-border',
  'sub-branch': 'bg-background text-muted-foreground border-dashed',
  lesson: 'bg-background text-foreground'
};

const statusTranslationMap: Record<string, string> = {
  'new': 'جديد',
  'learning': 'قيد التعلم',
  'mastered': 'أتقنته',
  'needs-review': 'يحتاج مراجعة',
  'missing-basics': 'أساس ناقص'
};

const typeTranslationMap: Record<string, string> = {
  'domain': 'مجال',
  'area': 'معرفة',
  'branch': 'فرع',
  'sub-branch': 'فرع فرعي',
  'lesson': 'درس'
};

const questionTypeMap: Record<string, string> = {
  'multiple-choice': 'اختيار من متعدد',
  'true-false': 'صح/خطأ',
  'text': 'سؤال نصي',
  'image': 'صورة',
  'video': 'فيديو',
  'audio': 'صوت',
  'order': 'ترتيب',
  'practical': 'عملي',
  'explain': 'شرح'
};

const questionTypeIconMap: Record<string, any> = {
  'multiple-choice': ListOrdered,
  'true-false': CheckCircle2,
  'text': Type,
  'image': ImageIcon,
  'video': Video,
  'audio': Mic,
  'order': ListOrdered,
  'practical': TerminalSquare,
  'explain': MessageSquare
};

const diffColorMap: Record<string, string> = {
  'easy': 'bg-muted text-foreground',
  'medium': 'bg-secondary text-secondary-foreground',
  'hard': 'bg-foreground text-background'
};

const fileTypeMap: Record<string, string> = {
  'text': 'نص',
  'image': 'صورة',
  'video': 'فيديو',
  'youtube': 'يوتيوب',
  'article': 'مقال',
  'pdf': 'PDF',
  'notes': 'ملاحظات'
};

const TreeNode = ({ node, allNodes, onUpdate, depth = 0 }: { node: KnowledgeNode, allNodes: KnowledgeNode[], onUpdate: () => void, depth?: number }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = allNodes.filter(n => n.parentId === node.id);
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50 transition-colors group"
        style={{ paddingRight: `${depth * 1.5 + 1}rem` }}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className={`p-1 rounded hover:bg-muted ${!hasChildren ? 'invisible' : ''}`}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{node.label}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${typeColorMap[node.type]}`}>
                {typeTranslationMap[node.type]}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {statusTranslationMap[node.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> إتقان: {node.mastery}%</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/> {node.questionCount} سؤال</span>
              {node.childCount > 0 && <span className="flex items-center gap-1"><ListTree className="w-3 h-3"/> {node.childCount} تفرع</span>}
            </div>
          </div>
        </div>
        
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={async () => {
            await createKnowledgeNode(node.id, { label: 'فرع جديد', type: 'branch' });
            toast.success("تم إضافة فرع جديد");
            onUpdate();
          }}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={async () => {
            await archiveKnowledgeNode(node.id);
            toast.success("تم أرشفة العنصر");
            onUpdate();
          }}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="flex flex-col">
          {children.map(child => (
            <TreeNode key={child.id} node={child} allNodes={allNodes} onUpdate={onUpdate} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ q, nodes }: { q: Question, nodes: KnowledgeNode[] }) => {
  const node = nodes.find(n => n.id === q.linkedNodeId);
  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-bold leading-relaxed">{q.title}</CardTitle>
              {q.mediaUrl && (
                <a href={q.mediaUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <LinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] font-normal flex items-center gap-1">
                {questionTypeIconMap[q.type] && React.createElement(questionTypeIconMap[q.type], { className: "w-3 h-3" })}
                {questionTypeMap[q.type]}
              </Badge>
              <Badge variant="secondary" className={`text-[10px] font-normal ${diffColorMap[q.difficulty]}`}>
                {q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'medium' ? 'متوسط' : 'صعب'}
              </Badge>
              {node && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-md">
                  <LinkIcon className="w-3 h-3" /> {node.label}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex justify-between items-end border-t border-border/50 mt-2">
        <div className="flex gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">صحيحة: <span className="text-foreground">{q.correctCount}</span></span>
          <span className="flex items-center gap-1">خاطئة: <span className="text-foreground">{q.incorrectCount}</span></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs font-semibold px-3" onClick={() => toast.info('وضع التعديل')}>تعديل</Button>
          <Button size="sm" className="h-7 text-xs font-bold px-4" onClick={() => toast.success('بدء الحل')}>حل السؤال</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FileCard = ({ f, nodes, onUpdate }: { f: LearningFile, nodes: KnowledgeNode[], onUpdate: () => void }) => {
  const node = nodes.find(n => n.id === f.linkedNodeId);
  return (
    <div className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card shadow-sm hover:border-foreground/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground">
          {f.type === 'youtube' && <Youtube className="w-5 h-5" />}
          {f.type === 'pdf' && <FileText className="w-5 h-5" />}
          {f.type === 'notes' && <Edit2 className="w-5 h-5" />}
          {f.type === 'image' && <ImageIcon className="w-5 h-5" />}
          {f.type === 'video' && <Video className="w-5 h-5" />}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">{f.title}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal bg-muted">{fileTypeMap[f.type] || f.type}</Badge>
            {node && <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {node.label}</span>}
          </div>
        </div>
      </div>
      
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={async () => { await linkFileToKnowledgeNode(f.id, nodes[0]?.id || 'dummy'); toast.success("تم ربط الملف بالمعرفة"); onUpdate(); }}>ربط بمعرفة</DropdownMenuItem>
          <DropdownMenuItem onClick={async () => { await generateQuestionsFromFileMock(f.id); toast.success("تم توليد أسئلة من الملف"); onUpdate(); }}>توليد أسئلة</DropdownMenuItem>
          <DropdownMenuItem onClick={async () => { await moveLearningFile(f.id, nodes[1]?.id || 'dummy'); toast.success("تم نقل الملف"); onUpdate(); }}>نقل</DropdownMenuItem>
          <DropdownMenuItem onClick={async () => { await updateLearningFile(f.id, { title: f.title + ' (معدل)' }); toast.success("تم تعديل الملف"); onUpdate(); }}>تعديل</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => { await archiveLearningFile(f.id); toast.success("تم أرشفة الملف"); onUpdate(); }}>أرشفة</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  );
};

const GeneratorSection = ({ onQuestionsGenerated, nodes }: { onQuestionsGenerated: () => void, nodes: KnowledgeNode[] }) => {
  const [inputType, setInputType] = useState('youtube');
  const [url, setUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedQuestionSet | null>(null);

  
  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      let res;
      if (inputType === 'youtube' && url) {
        res = await generateQuestionsFromYouTubeMock(url);
      } else if (inputType === 'text') {
        res = await generateQuestionsFromTextMock('dummy text');
      } else if (inputType === 'image') {
        res = await generateQuestionsFromImageMock({});
      } else {
        res = await generateQuestionsFromFileMock('dummy_file');
      }
      setResult(res);
      toast.success("تم تحليل المصدر وتوليد الأسئلة");
    } finally {
      setGenerating(false);
    }
  };

const handleAddToBank = async () => {
    if (!result) return;
    await addGeneratedQuestionsToBank(result.questions);
    toast.success("تم إرسال الأسئلة إلى بنك الأسئلة");
    onQuestionsGenerated();
    setResult(null);
    setUrl('');
  };

  const handleAddToMap = async () => {
    if (!result) return;
    await addGeneratedQuestionsToMap(result.questions);
    toast.success("تم ربط الأسئلة بخريطة المعرفة");
    setResult(null);
    setUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {['youtube', 'text', 'image', 'video', 'article', 'notes'].map(type => (
          <Button 
            key={type} 
            variant={inputType === type ? 'default' : 'outline'}
            className={`text-xs h-9 font-bold ${inputType === type ? 'shadow-md' : ''}`}
            onClick={() => setInputType(type)}
          >
            {type === 'youtube' && <Youtube className="w-4 h-4 ml-1.5" />}
            {type === 'text' && <FileText className="w-4 h-4 ml-1.5" />}
            {type === 'image' && <ImageIcon className="w-4 h-4 ml-1.5" />}
            {type === 'video' && <Video className="w-4 h-4 ml-1.5" />}
            {type === 'article' && <LinkIcon className="w-4 h-4 ml-1.5" />}
            {type === 'notes' && <Edit2 className="w-4 h-4 ml-1.5" />}
            {type === 'youtube' ? 'يوتيوب' : type === 'text' ? 'نص' : type === 'image' ? 'صورة' : type === 'video' ? 'فيديو' : type === 'article' ? 'مقال' : 'ملاحظات'}
          </Button>
        ))}
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-6 space-y-4">
          
          {inputType === 'youtube' ? (
            <>
              <div className="space-y-2.5">
                <label className="text-sm font-bold">رابط يوتيوب</label>
                <Input 
                  placeholder="ضع رابط YouTube هنا" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  dir="ltr"
                  className="text-left font-mono text-sm bg-muted/50 focus:bg-background"
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating || !url} className="w-full font-bold shadow-sm">
                {generating ? <RefreshCcw className="w-4 h-4 ml-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 ml-2" />}
                {generating ? 'جاري التحليل واستخراج المواضيع...' : 'حلّل المقطع وحوّله إلى أسئلة'}
              </Button>
              <div className="pt-2">
                <p className="text-[11px] text-muted-foreground text-center font-medium bg-muted/50 p-2 rounded-md">
                  <span className="font-bold">ملاحظة معمارية:</span> لاحقًا سيتم إرسال الرابط عبر NIBRRAS إلى n8n لتحليل المقطع، ثم استخراج النص (Transcript)، وتمريره لنموذج الذكاء الاصطناعي لتوليد الأسئلة، واستعادتها كـ JSON.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="py-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl bg-muted/20 font-medium">
                واجهة إدخال للمصدر ({inputType}). انقر زر التوليد لمحاكاة استخراج الأسئلة.
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full font-bold shadow-sm">
                {generating ? <RefreshCcw className="w-4 h-4 ml-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 ml-2" />}
                جاري التوليد (محاكاة)
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {result && (
        <Card className="border-foreground shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                  تم التوليد بنجاح
                </CardTitle>
                <CardDescription className="mt-1 font-medium text-xs">
                  المصدر: {result.sourceTitle}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-bold">{result.questions.length} أسئلة</Badge>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {result.topics.map(t => (
                <Badge key={t} variant="outline" className="text-[10px] bg-background font-medium">{t}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 bg-background">
            {result.questions.map((q, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold leading-relaxed">{q.title}</span>
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-background">{questionTypeMap[q.type] || q.type}</Badge>
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  مستوى الصعوبة: {q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </div>
              </div>
            ))}
          </CardContent>
          {result.suggestedBranchId && (
            <div className="px-4 py-2 bg-muted/20 border-t border-border border-b flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground">الفرع المقترح:</span>
              <Badge variant="outline" className="bg-background">
                {nodes.find((n: KnowledgeNode) => n.id === result.suggestedBranchId)?.label || result.suggestedBranchId}
              </Badge>
            </div>
          )}
          <CardFooter className="p-4 pt-3 gap-3 border-t border-border bg-muted/10">
            <Button onClick={handleAddToBank} className="flex-1 text-xs font-bold h-10 shadow-sm">
              أرسل إلى بنك الأسئلة
            </Button>
            <Button onClick={handleAddToMap} variant="outline" className="flex-1 text-xs font-bold h-10">
              أرسل إلى خريطة المعرفة
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default function LearningPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [files, setFiles] = useState<LearningFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');

  const loadData = async () => {
    setLoading(true);
    const [n, q, f] = await Promise.all([
      getKnowledgeTree(),
      getQuestionsByKnowledgeNode(),
      getLearningFiles()
    ]);
    setNodes(n);
    setQuestions(q);
    setFiles(f);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <RefreshCcw className="w-6 h-6 animate-spin text-foreground" />
        <span className="text-sm font-bold">جاري تهيئة بيئة التعلم...</span>
      </div>
    );
  }

  const rootNodes = nodes.filter(n => !n.parentId);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="px-6 py-5 border-b border-border bg-card shrink-0 z-10 shadow-sm">
        <h1 className="font-extrabold text-2xl tracking-tight">مسار التعلم</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">تطورك مستمر. كل خطوة تبني على ما قبلها.</p>
        
        <div className="mt-6 flex bg-muted p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar border border-border/50 shadow-inner">
          {[
            { id: 'map', label: 'خريطة المعرفة', icon: Network },
            { id: 'bank', label: 'بنك الأسئلة', icon: BookOpen },
            { id: 'generator', label: 'مولّد الأسئلة', icon: BrainCircuit },
            { id: 'files', label: 'ملفات التعلم', icon: FolderOpen }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-md transition-all whitespace-nowrap min-w-[80px] ${
                activeTab === tab.id 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <ScrollArea className="flex-1 bg-muted/10">
        <div className="p-6 pb-24 max-w-3xl mx-auto w-full">
          
          {activeTab === 'map' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-extrabold text-lg flex items-center gap-2">
                  <Network className="w-5 h-5 text-foreground" />
                  الهيكل المعرفي
                </h2>
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-background">
                  <Plus className="w-3 h-3 ml-1.5" /> إضافة مجال
                </Button>
              </div>
              <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                {rootNodes.map(node => (
                  <TreeNode key={node.id} node={node} allNodes={nodes} onUpdate={loadData} />
                ))}
                {rootNodes.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm font-bold bg-muted/20">
                    لا توجد مجالات معرفية بعد.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-extrabold text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-foreground" />
                  بنك الأسئلة
                </h2>
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-background">
                  <Plus className="w-3 h-3 ml-1.5" /> إضافة سؤال
                </Button>
              </div>
              <div className="grid gap-3">
                {questions.map(q => (
                  <QuestionCard key={q.id} q={q} nodes={nodes} />
                ))}
                {questions.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm font-bold border border-border rounded-xl bg-card shadow-sm">
                    لا توجد أسئلة بعد.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'generator' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-5">
                <BrainCircuit className="w-5 h-5 text-foreground" />
                <h2 className="font-extrabold text-lg">مولّد الأسئلة</h2>
              </div>
              <GeneratorSection onQuestionsGenerated={loadData} nodes={nodes} />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-extrabold text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-foreground" />
                  ملفات التعلم
                </h2>
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-background">
                  <Plus className="w-3 h-3 ml-1.5" /> إضافة ملف
                </Button>
              </div>
              <div className="grid gap-3">
                {files.map(f => (
                  <FileCard key={f.id} f={f} nodes={nodes} onUpdate={loadData} />
                ))}
                {files.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm font-bold border border-border rounded-xl bg-card shadow-sm">
                    لا توجد ملفات بعد.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
