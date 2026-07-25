import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Smartphone, 
  HelpCircle, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Save, 
  Loader2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { DeviceLink, FlowStage } from '../types.js';

interface CustomerFlowBuilderProps {
  currentUser: any;
  devices: DeviceLink[];
  lang: 'ar' | 'en';
  onUpdateDeviceAgent: (deviceId: string, data: any) => Promise<void>;
}

export default function CustomerFlowBuilder({
  currentUser,
  devices,
  lang,
  onUpdateDeviceAgent
}: CustomerFlowBuilderProps) {
  // Select active device
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Stages list edit state
  const [stagesList, setStagesList] = useState<FlowStage[]>([]);
  const [flowEnabled, setFlowEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const DEFAULT_FLOW_STAGES: FlowStage[] = [
    { id: 'awareness', name: 'وعي عام', nameEn: 'Awareness', color: '#6366f1', keywords: ['تفاصيل', 'باقة', 'ممكن', 'شرح', 'فيديو', 'برنامج', 'توضيح'] },
    { id: 'consideration', name: 'اهتمام ومقارنة', nameEn: 'Consideration', color: '#3b82f6', keywords: ['تفاصيل', 'باقة', 'ممكن', 'شرح', 'فيديو', 'برنامج', 'توضيح'] },
    { id: 'intent', name: 'نية جادة', nameEn: 'Intent', color: '#a855f7', keywords: ['رقم الحساب', 'بكم الاشتراك', 'سعر الباقة', 'رابط الدفع', 'طريقة الدفع', 'خصم'] },
    { id: 'action', name: 'تفعيل واشتراك', nameEn: 'Action', color: '#10b981', keywords: ['تم التحويل', 'حولت', 'ايصال', 'إيصال', 'التحويل البنكي', 'فودافون كاش', 'اشترك السنوي'] },
    { id: 'loyalty', name: 'ولاء وتوصية', nameEn: 'Loyalty', color: '#ec4899', keywords: ['شكرا', 'تسلم', 'ممتاز جدا', 'روعة', 'أشكرك', 'رائع'] }
  ];

  // Pick first device on load
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // Load selected device's flow settings
  useEffect(() => {
    if (!selectedDeviceId) return;
    const device = devices.find(d => d.id === selectedDeviceId);
    if (device) {
      setStagesList(device.flowStages && device.flowStages.length > 0 ? [...device.flowStages] : [...DEFAULT_FLOW_STAGES]);
      setFlowEnabled(!!device.flowStagesEnabled);
      setErrorMessage('');
      setSaveSuccess(false);
    }
  }, [selectedDeviceId, devices]);

  const handleSave = async () => {
    if (!selectedDeviceId) return;
    
    // Validation
    const emptyNames = stagesList.some(s => !s.name.trim() || !s.nameEn.trim());
    if (emptyNames) {
      setErrorMessage(lang === 'ar' ? 'يرجى كتابة أسماء صحيحة لجميع المراحل.' : 'Please enter valid names for all stages.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const device = devices.find(d => d.id === selectedDeviceId);
      if (device) {
        await onUpdateDeviceAgent(selectedDeviceId, {
          aiAgentEnabled: device.aiAgentEnabled,
          aiAgentName: device.aiAgentName,
          aiAgentInstructions: device.aiAgentInstructions,
          aiModel: device.aiModel,
          aiTemperature: device.aiTemperature,
          aiKnowledgeBase: device.aiKnowledgeBase,
          aiStopKeyword: device.aiStopKeyword,
          aiVoiceEnabled: device.aiVoiceEnabled,
          aiVoiceTone: device.aiVoiceTone,
          flowStages: stagesList,
          flowStagesEnabled: flowEnabled
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(lang === 'ar' ? 'فشل حفظ الإعدادات، يرجى المحاولة لاحقاً.' : 'Failed to save settings, please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStage = () => {
    const newId = `stage_${Math.random().toString(36).substring(2, 7)}`;
    setStagesList([
      ...stagesList,
      {
        id: newId,
        name: lang === 'ar' ? 'مرحلة جديدة' : 'New Stage',
        nameEn: 'New Stage',
        color: '#3b82f6',
        keywords: []
      }
    ]);
  };

  const handleDeleteStage = (index: number) => {
    if (stagesList.length <= 2) {
      setErrorMessage(lang === 'ar' ? 'يجب أن تحتوي مسار العميل على مرحلتين على الأقل.' : 'Pipeline must contain at least 2 stages.');
      return;
    }
    setStagesList(stagesList.filter((_, i) => i !== index));
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const newList = [...stagesList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stagesList.length) return;
    
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    setStagesList(newList);
  };

  const handleUpdateStageField = (index: number, field: keyof FlowStage, value: any) => {
    const newList = [...stagesList];
    newList[index] = {
      ...newList[index],
      [field]: value
    };
    setStagesList(newList);
  };

  if (devices.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 m-6 glass-panel">
        <Workflow className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700 animate-pulse" />
        <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 mb-2">
          {lang === 'ar' ? 'لا يوجد أجهزة متصلة حالياً' : 'No WhatsApp lines connected'}
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          {lang === 'ar' 
            ? 'يرجى ربط خط واتساب أولاً من صفحة الأجهزة لتمكين تصميم وإعداد رحلة العميل الخاصة بك.'
            : 'Please pair a WhatsApp line first from the Connections page to set up your customer journey pipeline.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto custom-scrollbar rtl:text-right ltr:text-left">
      
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-reverse">
          <div className="flex items-center gap-3 flex-row-reverse text-right">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-800 dark:text-zinc-100">
                {lang === 'ar' ? 'مصمم رحلة العميل المخصصة 🎯' : 'Customer Journey Pipeline Builder 🎯'}
              </h2>
              <p className="text-[10px] text-zinc-400 font-medium">
                {lang === 'ar' 
                  ? 'صمم مراحل مبيعاتك ونقاط تحول العملاء، ليقوم المساعد الذكي بتصنيف الشات تلقائياً.' 
                  : 'Design custom sales stages. AI will automatically classify and segment your chats.'}
              </p>
            </div>
          </div>

          {/* Active Device Selector */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500 text-zinc-700 dark:text-zinc-200 font-bold cursor-pointer"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phoneNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enable Toggle Switch */}
        <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/30 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80">
          <div className="rtl:text-right ltr:text-left">
            <span className="font-extrabold text-xs block text-zinc-800 dark:text-zinc-200">
              {lang === 'ar' ? 'تفعيل نظام التصنيف والمراحل المخصصة' : 'Enable Customer Journey Classification'}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              {lang === 'ar' 
                ? 'عند إيقاف هذا الخيار، سيستخدم نظام الـ CRM ومحلل الذكاء الاصطناعي المراحل الأساسية الافتراضية.' 
                : 'If disabled, CRM Kanban and AI classification fallback to default standard stages.'}
            </span>
          </div>

          <button
            onClick={() => setFlowEnabled(!flowEnabled)}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
          >
            {flowEnabled ? (
              <ToggleRight className="w-12 h-8 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-12 h-8 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">
          {lang === 'ar' ? 'معاينة مسار التدفق البصري' : 'Visual Pipeline Progression'}
        </h4>
        
        <div className="flex items-center justify-center flex-row-reverse gap-1.5 overflow-x-auto scrollbar-none py-2">
          {stagesList.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-1.5 flex-row-reverse">
              <div 
                className="px-4 py-2.5 rounded-xl border flex items-center gap-2 shadow-xs transition-all"
                style={{ 
                  backgroundColor: flowEnabled ? `${stage.color}10` : '#f4f4f510',
                  borderColor: flowEnabled ? stage.color : '#e4e4e7',
                }}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: flowEnabled ? stage.color : '#a1a1aa' }} 
                />
                <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                  {lang === 'ar' ? stage.name : stage.nameEn}
                </span>
              </div>
              {idx < stagesList.length - 1 && (
                <span className="text-zinc-300 dark:text-zinc-700 font-bold text-xs">←</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Config Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Tips / Notes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-3">
            <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
              <span>كيف يعمل التصنيف التلقائي؟</span>
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </h4>
            
            <ul className="space-y-2.5 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed text-right list-inside list-disc">
              <li>يقوم نظام الـ CRM بمراقبة الرسائل المتبادلة مع العميل لحظة بلحظة.</li>
              <li>بمجرد إرسال العميل أي كلمة تطابق <b>الكلمات الدلالية</b> الخاصة بمرحلة معينة، يتم نقله تلقائياً إليها.</li>
              <li>عند كتابة كلمات دلالية، افصل بينها بفاصلة (مثال: <code>سعر، اشتراك، بكم</code>).</li>
              <li>إذا تم تفعيل <b>المساعد الذكي (AI)</b>، فإنه يقوم بتحليل سياق ونية العميل ووضعه بالمرحلة التي تناسب كلامه بدقة حتى لو لم يكتب الكلمات الدلالية حرفياً.</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Stages Editor List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-4">
            <div className="flex justify-between items-center flex-row-reverse">
              <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                {lang === 'ar' ? 'إدارة وتحرير المراحل' : 'Pipeline Stages Manager'}
              </h3>
              
              <button
                onClick={handleAddStage}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إضافة مرحلة جديدة' : 'Add Stage'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {stagesList.map((stage, idx) => (
                <div 
                  key={stage.id} 
                  className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl space-y-3 text-right"
                >
                  {/* Stage Header Controls */}
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <span 
                        className="w-3.5 h-3.5 rounded-full block border border-white/20 shadow-xs" 
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                        {lang === 'ar' ? `المرحلة ${idx + 1}: ${stage.name}` : `Stage ${idx + 1}: ${stage.nameEn}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveStage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        title={lang === 'ar' ? 'تحريك لأعلى' : 'Move Up'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveStage(idx, 'down')}
                        disabled={idx === stagesList.length - 1}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        title={lang === 'ar' ? 'تحريك لأسفل' : 'Move Down'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteStage(idx)}
                        disabled={stagesList.length <= 2}
                        className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                        title={lang === 'ar' ? 'حذف المرحلة' : 'Delete Stage'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'الاسم باللغة العربية' : 'Name in Arabic'}
                      </label>
                      <input 
                        type="text"
                        required
                        value={stage.name}
                        onChange={(e) => handleUpdateStageField(idx, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-right font-bold text-zinc-800 dark:text-zinc-200 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'الاسم باللغة الإنجليزية' : 'Name in English'}
                      </label>
                      <input 
                        type="text"
                        required
                        value={stage.nameEn}
                        onChange={(e) => handleUpdateStageField(idx, 'nameEn', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-left font-bold text-zinc-800 dark:text-zinc-200 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Keywords Input */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'الكلمات الدلالية للتفعيل التلقائي (مفصولة بفاصلة)' : 'Trigger Keywords (separated by comma)'}
                    </label>
                    <input 
                      type="text"
                      value={stage.keywords.join(', ')}
                      onChange={(e) => {
                        const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
                        handleUpdateStageField(idx, 'keywords', words);
                      }}
                      placeholder={lang === 'ar' ? 'مثال: سعر، باقة، تفاصيل، دفع' : 'e.g. price, package, detail, payment'}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-right font-mono text-zinc-700 dark:text-zinc-300 focus:border-amber-500"
                    />
                    
                    {/* Live Keywords tags preview */}
                    {stage.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 flex-row-reverse">
                        {stage.keywords.map((kw, kwIdx) => (
                          <span 
                            key={kwIdx}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                            style={{ 
                              color: stage.color, 
                              backgroundColor: `${stage.color}15`,
                              borderColor: `${stage.color}30`,
                              borderWidth: 1
                            }}
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CRM Stage Automation Actions */}
                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-3">
                    <span className="block text-[9px] font-extrabold text-[#00a884] uppercase tracking-wider">
                      {lang === 'ar' ? '⚙️ أتمتة الإجراءات عند دخول المرحلة' : '⚙️ Stage Automations & Actions'}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Auto response text */}
                      <div>
                        <label className="block text-[9px] font-extrabold text-zinc-400 mb-1">
                          {lang === 'ar' ? 'الرد التلقائي المرسل للعميل' : 'Auto-Response text to Customer'}
                        </label>
                        <textarea
                          rows={2}
                          value={stage.autoResponseText || ''}
                          onChange={(e) => handleUpdateStageField(idx, 'autoResponseText', e.target.value)}
                          placeholder={lang === 'ar' ? 'اكتب رسالة يتم إرسالها تلقائياً للعميل عند دخوله هذه المرحلة...' : 'Automatically send this message to the client on transition...'}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-right text-zinc-700 dark:text-zinc-300 focus:border-[#00a884] leading-relaxed"
                        />
                      </div>

                      {/* Stage AI Prompt instructions */}
                      <div>
                        <label className="block text-[9px] font-extrabold text-zinc-400 mb-1">
                          {lang === 'ar' ? 'توجيهات مخصصة للمساعد (AI)' : 'Custom AI Instructions Override'}
                        </label>
                        <textarea
                          rows={2}
                          value={stage.stageAiInstructions || ''}
                          onChange={(e) => handleUpdateStageField(idx, 'stageAiInstructions', e.target.value)}
                          placeholder={lang === 'ar' ? 'تعليمات إضافية للمساعد الذكي في هذه المرحلة (مثال: ركز على حث العميل على الشراء)...' : 'Extra guidelines for the AI agent in this stage...'}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-right text-zinc-700 dark:text-zinc-300 focus:border-[#00a884] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Sales agent notification toggle */}
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl">
                      <div className="rtl:text-right ltr:text-left">
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                          {lang === 'ar' ? 'تنبيه موظفي المبيعات والخدمة' : 'Alert Sales Representatives'}
                        </span>
                        <span className="text-[9px] text-zinc-400 block mt-0.5">
                          {lang === 'ar' ? 'إرسال إشعار فوري للفريق عند انتقال العميل إلى هذه المرحلة.' : 'Send a browser push alert to the agent team when client enters this stage.'}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!stage.notifyOnEnter}
                        onChange={(e) => handleUpdateStageField(idx, 'notifyOnEnter', e.target.checked)}
                        className="w-4 h-4 accent-[#00a884] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Color circle palette picker */}
                  <div className="flex items-center gap-2 flex-row-reverse pt-1">
                    <span className="text-[9px] font-bold text-zinc-400">
                      {lang === 'ar' ? 'اللون المميز للمرحلة:' : 'Distinct stage color:'}
                    </span>
                    <div className="flex gap-1.5">
                      {['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#a855f7'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleUpdateStageField(idx, 'color', color)}
                          className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                            stage.color === color ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex-row-reverse text-right">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Success Box */}
            {saveSuccess && (
              <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex-row-reverse text-right animate-pulse">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold">
                  {lang === 'ar' ? 'تم حفظ التغييرات بنجاح لمسار العميل!' : 'Journey configuration saved successfully!'}
                </span>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-100 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs flex justify-center items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {lang === 'ar' ? 'حفظ إعدادات رحلة العميل 💾' : 'Save Customer Journey 💾'}
              </span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
