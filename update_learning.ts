import fs from 'fs';

let content = fs.readFileSync('artifacts/nibrras/src/pages/learning.tsx', 'utf8');

// Imports
if (!content.includes('DropdownMenu')) {
  content = content.replace(
    "import { toast } from 'sonner';",
    `import { toast } from 'sonner';\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';`
  );
}

// Add learning files service imports
content = content.replace(
  "import {\n  getKnowledgeTree,",
  "import {\n  getKnowledgeTree,\n  createKnowledgeNode,\n  archiveKnowledgeNode,\n  linkFileToKnowledgeNode,\n  updateLearningFile,\n  moveLearningFile,\n  archiveLearningFile,\n  generateQuestionsFromFileMock,\n  addGeneratedQuestionsToMap,\n  generateQuestionsFromTextMock,\n  generateQuestionsFromImageMock,"
);

// 1. Segmented control labels
content = content.replace(
  "{ id: 'map', label: 'الخريطة', icon: Network }",
  "{ id: 'map', label: 'خريطة المعرفة', icon: Network }"
);
content = content.replace(
  "{ id: 'bank', label: 'بنك الأسئلة', icon: BookOpen }",
  "{ id: 'bank', label: 'بنك الأسئلة', icon: BookOpen }"
);
content = content.replace(
  "{ id: 'generator', label: 'المولّد', icon: BrainCircuit }",
  "{ id: 'generator', label: 'مولّد الأسئلة', icon: BrainCircuit }"
);
content = content.replace(
  "{ id: 'files', label: 'الملفات', icon: FolderOpen }",
  "{ id: 'files', label: 'ملفات التعلم', icon: FolderOpen }"
);

// 2. Generator result suggested branch
const resultPanelReplacement = `{result.suggestedBranchId && (
            <div className="px-4 py-2 bg-muted/20 border-t border-border border-b flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground">الفرع المقترح:</span>
              <Badge variant="outline" className="bg-background">
                {nodes.find((n: KnowledgeNode) => n.id === result.suggestedBranchId)?.label || result.suggestedBranchId}
              </Badge>
            </div>
          )}
          <CardFooter className="p-4 pt-3 gap-3 border-t border-border bg-muted/10">`;

content = content.replace(
  `<CardFooter className="p-4 pt-3 gap-3 border-t border-border bg-muted/10">`,
  resultPanelReplacement
);

// Add 'nodes' prop to GeneratorSection
content = content.replace(
  `const GeneratorSection = ({ onQuestionsGenerated }: { onQuestionsGenerated: () => void }) => {`,
  `const GeneratorSection = ({ onQuestionsGenerated, nodes }: { onQuestionsGenerated: () => void, nodes: KnowledgeNode[] }) => {`
);

content = content.replace(
  `<GeneratorSection onQuestionsGenerated={loadData} />`,
  `<GeneratorSection onQuestionsGenerated={loadData} nodes={nodes} />`
);

// Add 'onUpdate' to TreeNode
content = content.replace(
  `const TreeNode = ({ node, allNodes, depth = 0 }: { node: KnowledgeNode, allNodes: KnowledgeNode[], depth?: number }) => {`,
  `const TreeNode = ({ node, allNodes, onUpdate, depth = 0 }: { node: KnowledgeNode, allNodes: KnowledgeNode[], onUpdate: () => void, depth?: number }) => {`
);

content = content.replace(
  `<TreeNode key={child.id} node={child} allNodes={allNodes} depth={depth + 1} />`,
  `<TreeNode key={child.id} node={child} allNodes={allNodes} onUpdate={onUpdate} depth={depth + 1} />`
);

content = content.replace(
  `<TreeNode key={node.id} node={node} allNodes={nodes} />`,
  `<TreeNode key={node.id} node={node} allNodes={nodes} onUpdate={loadData} />`
);

// Replace TreeNode inline logic
const treeNodeActions = `
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
`;

content = content.replace(
  /<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">[\s\S]*?<\/div>\s*<\/div>\s*\{expanded && hasChildren/m,
  treeNodeActions + `      </div>\n      \n      {expanded && hasChildren`
);

// 3. FileCard actions
content = content.replace(
  `const FileCard = ({ f, nodes }: { f: LearningFile, nodes: KnowledgeNode[] }) => {`,
  `const FileCard = ({ f, nodes, onUpdate }: { f: LearningFile, nodes: KnowledgeNode[], onUpdate: () => void }) => {`
);

content = content.replace(
  `<FileCard key={f.id} f={f} nodes={nodes} />`,
  `<FileCard key={f.id} f={f} nodes={nodes} onUpdate={loadData} />`
);

const fileCardActions = `
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
`;

content = content.replace(
  /<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">[\s\S]*?<\/Button>/m,
  fileCardActions
);

// 4. HandleAddToMap uses service layer
content = content.replace(
  `const handleAddToMap = () => {
    toast.success("تم ربط الأسئلة بخريطة المعرفة");
  };`,
  `const handleAddToMap = async () => {
    if (!result) return;
    await addGeneratedQuestionsToMap(result.questions);
    toast.success("تم ربط الأسئلة بخريطة المعرفة");
    setResult(null);
    setUrl('');
  };`
);

// 4b. Remove fallback UI in GeneratorSection and make generic fallback work
const generatorHandleReplacement = `
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
`;

content = content.replace(
  /const handleGenerate = async \(\) => \{[\s\S]*?setGenerating\(false\);\s*\}\s*\};\s*/m,
  generatorHandleReplacement + '\n'
);

const genericInputContent = `
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
`;

content = content.replace(
  /\{inputType === 'youtube' \? \([\s\S]*?<\/>\s*\) : \([\s\S]*?<\/div>\s*\)\}/m,
  genericInputContent
);

fs.writeFileSync('artifacts/nibrras/src/pages/learning.tsx', content);
