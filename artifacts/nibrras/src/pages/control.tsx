import { useState, useEffect } from 'react';
import { 
  listWorkflows, 
  getWorkflowAgents, 
  runWorkflowMock, 
  installWorkflowMock, 
  hideWorkflowMock, 
  getWorkflowLogsMock,
  getGlobalLogsMock,
  getAgentDetails,
  updateAgentPromptMock
} from '../services/n8nService';
import { listBackupsMock, restoreBackupMock } from '../services/backupService';
import { Workflow, WorkflowAgent, Backup, LogEntry } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Play, Eye, History, Pin, EyeOff, Settings, 
  Database, Bot, Activity, AlertTriangle, AlertCircle, Info,
  Save, RotateCcw, GitBranch, Github, Link2
} from 'lucide-react';

export default function ControlPage() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<WorkflowAgent[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Agent Details State
  const [selectedAgent, setSelectedAgent] = useState<WorkflowAgent | null>(null);
  const [promptEdit, setPromptEdit] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [wfs, bks, lgs] = await Promise.all([
        listWorkflows(),
        listBackupsMock(),
        getGlobalLogsMock()
      ]);
      setWorkflows(wfs);
      setBackups(bks);
      setLogs(lgs);
      
      if (wfs.length > 0) {
        const agts = await getWorkflowAgents(wfs[0].id);
        setAgents(agts);
        if (agts.length > 0) {
          setSelectedAgent(agts[0]);
          setPromptEdit(agts[0].prompt);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRunWorkflow = async (id: string) => {
    toast.info("جاري التشغيل...", { description: "يتم الآن إرسال طلب التشغيل عبر n8n." });
    await runWorkflowMock(id);
    toast.success("تم", { description: "تم تشغيل Workflow بنجاح." });
  };

  const handleShowAgents = async (workflowId: string) => {
    setActiveTab('agents');
    const agts = await getWorkflowAgents(workflowId);
    setAgents(agts);
  };

  const handleRestore = async (id: string) => {
    toast.info("استعادة", { description: "جاري استعادة النسخة..." });
    await restoreBackupMock(id);
    toast.success("اكتمل", { description: "تم استعادة النسخة محلياً (محاكاة)." });
  };

  const handleSavePrompt = async () => {
    if (!selectedAgent) return;
    toast.info("حفظ", { description: "جاري تحديث التعليمات..." });
    await updateAgentPromptMock(selectedAgent.id, promptEdit);
    toast.success("تم الحفظ", { description: "تم تحديث الوكيل بنجاح." });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="px-6 py-5 border-b border-border bg-card flex-shrink-0">
        <h1 className="font-bold text-2xl tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6" /> مركز التحكم
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة n8n والوكلاء المستقلين</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted h-12 p-1 hide-scrollbar">
            <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs">Agents</TabsTrigger>
            <TabsTrigger value="agent-details" className="text-xs">Agent Details</TabsTrigger>
            <TabsTrigger value="backups" className="text-xs">Backups</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <div className="mt-6 pb-24">
            
            {/* WORKFLOWS TAB */}
            <TabsContent value="workflows" className="space-y-4 m-0">
              {loading ? <div className="text-sm text-muted-foreground">جاري التحميل...</div> : 
                workflows.map(wf => (
                  <Card key={wf.id} className="bg-card">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {wf.name}
                          {wf.pinned && <Pin className="w-3.5 h-3.5 text-muted-foreground" />}
                          {wf.hidden && <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">آخر تشغيل: {wf.lastRun}</CardDescription>
                      </div>
                      <Badge variant={wf.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {wf.status === 'active' ? 'نشط' : 'متوقف'}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Bot className="w-4 h-4" /> {wf.agentsCount} وكلاء</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleRunWorkflow(wf.id)}>
                          <Play className="w-3.5 h-3.5 ml-1" /> تشغيل
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs bg-background" onClick={() => handleShowAgents(wf.id)}>
                          <Eye className="w-3.5 h-3.5 ml-1" /> عرض Agents
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs bg-background" onClick={() => setActiveTab('logs')}>
                          <History className="w-3.5 h-3.5 ml-1" /> السجلات
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => installWorkflowMock(wf.id)}>
                          <Pin className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => hideWorkflowMock(wf.id)}>
                          <EyeOff className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </TabsContent>

            {/* AGENTS TAB */}
            <TabsContent value="agents" className="space-y-4 m-0">
              {agents.length === 0 ? <div className="text-sm text-muted-foreground">لا يوجد وكلاء.</div> :
                agents.map(agent => (
                  <Card key={agent.id} className="bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-[10px]">{agent.model}</Badge>
                      </div>
                      <CardDescription className="text-xs">{agent.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agent.lastError && (
                        <div className="bg-destructive/10 text-destructive text-xs p-2 rounded flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{agent.lastError}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                      </div>
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs bg-background" onClick={() => {
                        setSelectedAgent(agent);
                        setPromptEdit(agent.prompt);
                        setActiveTab('agent-details');
                      }}>
                        إعدادات الوكيل
                      </Button>
                    </CardContent>
                  </Card>
                ))
              }
            </TabsContent>

            {/* AGENT DETAILS TAB */}
            <TabsContent value="agent-details" className="space-y-6 m-0">
              {!selectedAgent ? <div className="text-sm text-muted-foreground">الرجاء اختيار وكيل أولاً.</div> :
                <>
                  <div className="bg-foreground text-background text-xs p-3 rounded-md flex items-start gap-3 shadow-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-background/80" />
                    <span>سيتم حفظ نسخة احتياطية قبل أي تعديل حقيقي لاحقًا.</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">النموذج (Model)</label>
                      <Input value={selectedAgent.model} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">الأدوات والصلاحيات</label>
                      <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-muted/30">
                        {selectedAgent.tools.map(t => <Badge key={t} variant="outline" className="bg-background">{t}</Badge>)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">قواعد البيانات (Databases)</label>
                      <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-muted/30">
                        {selectedAgent.databases && selectedAgent.databases.length > 0 ? selectedAgent.databases.map(d => <Badge key={d} variant="outline" className="bg-background"><Database className="w-3 h-3 ml-1" />{d}</Badge>) : <span className="text-xs text-muted-foreground">لا يوجد</span>}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">القواعد (Rules)</label>
                      <ul className="text-xs text-muted-foreground list-disc list-inside px-2 space-y-1">
                        <li>الالتزام باللغة العربية.</li>
                        <li>عدم إعطاء وعود غير قابلة للتحقيق.</li>
                        <li>استدعاء أداة البحث عند نقص المعلومات.</li>
                      </ul>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">التعليمات الأساسية (System Prompt)</label>
                      <textarea 
                        className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={promptEdit}
                        onChange={e => setPromptEdit(e.target.value)}
                        dir="auto"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">سجل الوكيل (Logs)</label>
                      <div className="p-3 border border-border rounded-md bg-muted/30 text-xs font-mono max-h-32 overflow-y-auto space-y-2">
                        {logs.filter(l => l.source === selectedAgent.id).length > 0 ? (
                           logs.filter(l => l.source === selectedAgent.id).map(l => <div key={l.id}>{l.timestamp} - {l.message}</div>)
                        ) : <span className="text-muted-foreground">لا توجد سجلات حديثة</span>}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">النسخ الاحتياطية للوكيل</label>
                      <div className="p-3 border border-border rounded-md bg-muted/30 text-xs space-y-2">
                        {backups.slice(0, 2).map(b => (
                          <div key={b.id} className="flex justify-between items-center border-b border-border/50 pb-1 last:border-0 last:pb-0">
                            <span>{b.version}</span>
                            <span className="text-muted-foreground">{b.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleSavePrompt}>
                      <Save className="w-4 h-4 ml-2" /> حفظ التعديلات محلياً
                    </Button>
                  </div>
                </>
              }
            </TabsContent>

            {/* BACKUPS TAB */}
            <TabsContent value="backups" className="space-y-4 m-0">
              {backups.map(b => (
                <Card key={b.id} className="bg-card">
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-sm font-mono">{b.version}</span>
                        <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{b.changedItem}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{b.date}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 bg-background text-xs h-8" onClick={() => handleRestore(b.id)}>
                      <RotateCcw className="w-3.5 h-3.5 ml-1" /> استعادة
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* LOGS TAB */}
            <TabsContent value="logs" className="m-0">
              <div className="bg-card border border-border rounded-xl overflow-hidden font-mono text-xs">
                <div className="bg-muted p-2 border-b border-border flex items-center gap-2">
                  <Activity className="w-4 h-4" /> <span>Activity Feed</span>
                </div>
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {logs.map(l => (
                    <div key={l.id} className="flex gap-3 items-start">
                      <span className="text-muted-foreground shrink-0">{l.timestamp}</span>
                      <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full ${
                        l.type === 'error' ? 'bg-destructive text-destructive-foreground' :
                        l.type === 'warning' ? 'bg-accent text-accent-foreground' :
                        'bg-foreground text-background'
                      }`}>
                        {l.type === 'error' ? '!' : l.type === 'warning' ? '?' : 'i'}
                      </span>
                      <span className="text-foreground leading-relaxed">{l.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6 m-0">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="w-5 h-5" /> الاتصال بمحرك n8n
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                    <span className="text-sm font-medium">حالة الاتصال</span>
                    <Badge variant="destructive" className="text-[10px]">غير متصل (Mock Mode)</Badge>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">API Base URL</label>
                    <Input readOnly value="http://localhost:5678/api/v1" className="bg-muted text-muted-foreground font-mono text-xs h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Webhook URL</label>
                    <Input readOnly value="http://localhost:5678/webhook/..." className="bg-muted text-muted-foreground font-mono text-xs h-9" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Github className="w-5 h-5" /> النسخ الاحتياطي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                    <span className="text-sm font-medium">مستودع GitHub</span>
                    <Badge variant="secondary" className="text-[10px]">متزامن</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-5 h-5" /> خيارات متقدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Free-only mode</p>
                      <p className="text-[10px] text-muted-foreground">استخدام النماذج المجانية فقط</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Strict UI/API separation</p>
                      <p className="text-[10px] text-muted-foreground">فصل كامل للواجهة عن المنطق</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">تأكيد الإجراءات الخطرة</p>
                      <p className="text-[10px] text-muted-foreground">طلب تأكيد قبل أي تعديل جذري</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
