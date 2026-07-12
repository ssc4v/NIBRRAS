import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, ArrowRight, BookOpen, FileText, HelpCircle, Plus, Trash2 } from 'lucide-react';
import {
  answerQuestion,
  archiveKnowledgeNode,
  createKnowledgeNode,
  createLearningFile,
  createQuestion,
  deleteQuestion,
  getLearningGraph,
  listQuestions,
  type LearningGraph,
  type Question,
} from '../services/learningService';
import { Button } from '@/components/ui/button';

export default function LearningPage() {
  const [, setLocation] = useLocation();
  const [graph, setGraph] = useState<LearningGraph | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nodeLabel, setNodeLabel] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGraph, nextQuestions] = await Promise.all([getLearningGraph(), listQuestions()]);
      setGraph(nextGraph);
      setQuestions(nextQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات التعلم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
      setNotice(success);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشلت العملية.');
    } finally {
      setBusy(false);
    }
  };

  const addNode = (event: React.FormEvent) => {
    event.preventDefault();
    const label = nodeLabel.trim();
    if (!label) return;
    void run(async () => {
      await createKnowledgeNode(label);
      setNodeLabel('');
    }, 'تم إنشاء عقدة معرفة وحفظها فعليًا.');
  };

  const addFile = (event: React.FormEvent) => {
    event.preventDefault();
    const title = fileTitle.trim();
    if (!title) return;
    void run(async () => {
      await createLearningFile(title);
      setFileTitle('');
    }, 'تم إنشاء ملف تعلم وحفظه فعليًا.');
  };

  const addQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    const title = questionTitle.trim();
    const answer = correctAnswer.trim();
    if (!title || !answer) return;
    void run(async () => {
      await createQuestion({ title, correctAnswer: answer, type: 'text' });
      setQuestionTitle('');
      setCorrectAnswer('');
    }, 'تمت إضافة السؤال إلى البنك فعليًا.');
  };

  const solve = (question: Question) => {
    const answer = window.prompt(question.title);
    if (answer === null) return;
    void run(async () => {
      const result = await answerQuestion(question.id, answer);
      window.alert(result.correct ? 'إجابة صحيحة' : `إجابة غير صحيحة. الصحيح: ${String(result.correctAnswer)}`);
    }, 'تم تسجيل الإجابة وتحديث الإحصاءات.');
  };

  return (
    <div className="min-h-full bg-background p-4">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">نظام التعلم</h1>
          <p className="text-sm text-muted-foreground">خريطة معرفة، ملفات، وبنك أسئلة محفوظة في n8n</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
          <ArrowRight className="ml-1 h-4 w-4" /> المحادثة
        </Button>
      </header>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && <div className="mb-4 rounded-xl border border-border bg-card p-3 text-sm">{notice}</div>}
      {loading && <p className="text-sm text-muted-foreground">جاري تحميل البيانات الحقيقية…</p>}

      {!loading && graph && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5" /><h2 className="font-semibold">خريطة المعرفة</h2></div>
            <form onSubmit={addNode} className="mb-3 flex gap-2">
              <input value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} placeholder="اسم المجال أو الدرس" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <Button type="submit" size="icon" disabled={!nodeLabel.trim() || busy}><Plus className="h-4 w-4" /></Button>
            </form>
            <div className="space-y-2">
              {graph.nodes.length === 0 && <p className="text-sm text-muted-foreground">لا توجد عقد معرفة بعد.</p>}
              {graph.nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div><p className="text-sm font-medium">{node.label}</p><p className="text-xs text-muted-foreground">إتقان {node.mastery}%</p></div>
                  <Button variant="ghost" size="icon" disabled={busy} onClick={() => void run(() => archiveKnowledgeNode(node.id), 'تمت أرشفة العقدة.')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2"><FileText className="h-5 w-5" /><h2 className="font-semibold">ملفات التعلم</h2></div>
            <form onSubmit={addFile} className="mb-3 flex gap-2">
              <input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="اسم الملف" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <Button type="submit" size="icon" disabled={!fileTitle.trim() || busy}><Plus className="h-4 w-4" /></Button>
            </form>
            <div className="space-y-2">
              {graph.files.length === 0 && <p className="text-sm text-muted-foreground">لا توجد ملفات بعد.</p>}
              {graph.files.map((file) => <div key={file.id} className="rounded-lg border border-border p-3 text-sm">{file.title}</div>)}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2"><HelpCircle className="h-5 w-5" /><h2 className="font-semibold">بنك الأسئلة</h2></div>
            <form onSubmit={addQuestion} className="mb-3 space-y-2">
              <input value={questionTitle} onChange={(e) => setQuestionTitle(e.target.value)} placeholder="نص السؤال" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="الإجابة الصحيحة" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <Button type="submit" size="icon" disabled={!questionTitle.trim() || !correctAnswer.trim() || busy}><Plus className="h-4 w-4" /></Button>
              </div>
            </form>
            <div className="space-y-2">
              {questions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أسئلة بعد.</p>}
              {questions.map((question) => (
                <div key={question.id} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-sm font-medium">{question.title}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => solve(question)}>حل السؤال</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => deleteQuestion(question.id), 'تم حذف السؤال.')}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
