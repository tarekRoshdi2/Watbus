/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemTranslations {
  // Sidebar Tabs / Rails
  dashboardTab: string;
  adminTab: string;
  usersTab: string;
  addUser: string;
  username: string;
  statistics: string;
  usage: string;
  chatTab: string;
  connectTab: string;
  campaignsTab: string;
  logout: string;

  // General Dashboard / Sidebar
  unifiedInbox: string;
  unifiedInboxSub: string;
  newChat: string;
  selectActiveLine: string;
  allLines: string;
  allLabels: string;
  newLabel: string;
  leadLabel: string;
  pendingLabel: string;
  completedLabel: string;
  vipLabel: string;
  quickDemoLabel: string;
  quickDemoPlaceholder: string;
  openButton: string;
  searchPlaceholder: string;
  noMessagesYet: string;
  noChatsMatch: string;
  youCantAddYourself: string;

  // Introduction / Welcome
  welcomeTitle: string;
  welcomeSub: string;
  endpointActive: string;

  // ChatArea
  typingIndicator: string;
  online: string;
  offline: string;
  lastSeenRecent: string;
  labelSelect: string;
  backToList: string;
  messagePlaceholder: string;
  audioRecording: string;
  audioRecorded: string;
  cancel: string;
  send: string;
  mute: string;
  unmute: string;

  // WhatsAppSettings
  deviceSetupTitle: string;
  deviceSetupSub: string;
  addDeviceButton: string;
  addDevicePlaceholder: string;
  activeLinesTitle: string;
  pairingCode: string;
  disconnectLine: string;
  connecting: string;
  connected: string;
  scanQrCode: string;
  customInstructions: string;
  customInstructionsSub: string;
  aiAgentSettingsTitle: string;
  enableAgent: string;
  enableAgentSub: string;
  agentNameLabel: string;
  agentNamePlaceholder: string;
  aiModelLabel: string;
  creativitySliderLabel: string;
  focusedLabel: string;
  balancedLabel: string;
  creativeLabel: string;
  stopKeywordLabel: string;
  stopKeywordPlaceholder: string;
  stopKeywordSub: string;
  knowledgeBaseLabel: string;
  knowledgeBasePlaceholder: string;
  knowledgeBaseSub: string;
  saveRulesButton: string;

  // Voice AI Settings
  voiceAiSettingsTitle: string;
  enableVoiceReplies: string;
  enableVoiceRepliesSub: string;
  voiceToneLabel: string;
  professionalTone: string;
  friendlyTone: string;
  formalTone: string;

  // MarketingCampaigns
  broadcastTitle: string;
  broadcastSub: string;
  newCampaignButton: string;
  campaignName: string;
  targetContacts: string;
  targetContactsPlaceholder: string;
  campaignMessage: string;
  campaignMessagePlaceholder: string;
  scheduleCampaign: string;
  sendRate: string;
  statusLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  actionsLabel: string;
  deleteLabel: string;
  runLabel: string;
  noCampaignsYet: string;

  // DashboardStats
  analyticsTitle: string;
  analyticsSub: string;
  totalMessages: string;
  responseTime: string;
  activeBots: string;
  campaignSuccess: string;
  quickStats: string;
  refreshData: string;
}

export const translations: Record<'ar' | 'en', SystemTranslations> = {
  ar: {
    dashboardTab: 'الرئيسية',
    adminTab: 'الإدارة',
    usersTab: 'الموظفين وفريق العمل',
    addUser: 'إضافة مستخدم',
    username: 'اسم المستخدم',
    statistics: 'الإحصائيات',
    usage: 'الاستهلاك',
    chatTab: 'المحادثات',
    connectTab: 'الربط',
    campaignsTab: 'الحملات',
    logout: 'تسجيل الخروج',

    unifiedInbox: 'صندوق محادثات ChatCore الموحد',
    unifiedInboxSub: 'تغذية صندوق الوارد الموحد',
    newChat: 'محادثة جديدة',
    selectActiveLine: 'اختر الحساب النشط لعرض محادثاته:',
    allLines: 'عرض كل الخطوط',
    allLabels: 'الكل',
    newLabel: 'جديد',
    leadLabel: 'عميل محتمل',
    pendingLabel: 'قيد الانتظار',
    completedLabel: 'مكتمل',
    vipLabel: 'مهم جداً',
    quickDemoLabel: 'بدء محادثة تجريبية سريعة بالاسم',
    quickDemoPlaceholder: 'اكتب اسم العميل أو الزائر...',
    openButton: 'فتح',
    searchPlaceholder: 'بحث في المحادثات والرسائل...',
    noMessagesYet: 'لا توجد رسائل سابقة',
    noChatsMatch: 'لا توجد محادثات مطابقة للفلاتر المحددة.',
    youCantAddYourself: 'لا يمكنك إضافة نفسك!',

    welcomeTitle: 'بوابة ChatCore للمحادثات والخدمة الموحدة',
    welcomeSub: 'اختر أي محادثة أو خط اتصال من الجانب لبدء الرد على العملاء، أو استخدم فلاتر البوابات لمشاهدة المحادثات الخاصة بكل رقم هاتف مستقل على حدة!',
    endpointActive: 'نقطة اتصال ChatCore آمنة ونشطة',

    typingIndicator: 'يكتب الآن...',
    online: 'متصل الآن',
    offline: 'غير متصل',
    lastSeenRecent: 'متصل مؤخراً',
    labelSelect: 'تصنيف',
    backToList: 'العودة للمحادثات',
    messagePlaceholder: 'اكتب رسالة أو اكتب "/" للردود السريعة...',
    audioRecording: 'جاري تسجيل الصوت...',
    audioRecorded: 'تم تسجيل الصوت',
    cancel: 'إلغاء',
    send: 'إرسال',
    mute: 'كتم الصوت',
    unmute: 'تشغيل الصوت',

    deviceSetupTitle: 'إعدادات وبوابات ChatCore',
    deviceSetupSub: 'قم بربط وإدارة بوابات واتساب متعددة الأجهزة وتخصيص مساعدي الذكاء الاصطناعي Gemini لكل بوابة بشكل مستقل.',
    addDeviceButton: 'ربط بوابة جديدة',
    addDevicePlaceholder: 'مثال: خط مبيعات Roshdi الأساسي',
    activeLinesTitle: 'قنوات الاتصال المربوطة حالياً',
    pairingCode: 'رمز الاقتران (Pairing Code)',
    disconnectLine: 'قطع الاتصال وإلغاء الربط',
    connecting: 'جاري الاتصال...',
    connected: 'نشط ومتصل حالياً',
    scanQrCode: 'يرجى مسح رمز QR من هاتفك لربط الحساب بالبوابة.',
    customInstructions: 'التعليمات والتوجيهات للذكاء الاصطناعي',
    customInstructionsSub: 'تخصيص مساعد الذكاء الاصطناعي (Gemini API)',
    aiAgentSettingsTitle: 'تخصيص المساعد الذكي (Gemini API)',
    enableAgent: 'تفعيل الرد التلقائي التلقائي',
    enableAgentSub: 'يقوم بالرد الفوري على رسائل العملاء بالذكاء الاصطناعي',
    agentNameLabel: 'اسم المساعد / البوت | AI Agent Name',
    agentNamePlaceholder: 'مثال: رفيق مبيعات Roshdi الذكي',
    aiModelLabel: 'موديل الذكاء الاصطناعي | Gemini Model',
    creativitySliderLabel: 'درجة الإبداع والحرارة | AI Temperature',
    focusedLabel: 'دقيق ومقيد (0.1)',
    balancedLabel: 'متوازن وعملي',
    creativeLabel: 'إبداعي وتفاعلي (1.0)',
    stopKeywordLabel: 'كلمة إيقاف المساعد الذكي (التحويل البشري) | Human Takeover Keyword',
    stopKeywordPlaceholder: 'مثال: موظف، انسان، بشر، stop (عند كتابتها يتوقف الرد الآلي فوراً)',
    stopKeywordSub: 'إذا أرسل العميل هذه الكلمة، سيقوم النظام تلقائياً بتعطيل الرد الآلي وتحويل المحادثة لحالة "الانتظار المعلق" وإخطارك.',
    knowledgeBaseLabel: 'قاعدة المعرفة والأسئلة الشائعة | Factual Knowledge Base / FAQ',
    knowledgeBasePlaceholder: 'اكتب هنا الحقائق والأسعار وتفاصيل الخدمات حتى يجيب بها المساعد بدقة...',
    knowledgeBaseSub: 'اكتب هنا الحقائق والأسعار وتفاصيل الخدمات حتى يجيب بها المساعد بدقة دون تزييف أو تخمين للحقائق.',
    saveRulesButton: 'حفظ أوامر الوكيل وتفعيله | Save AI Rules',

    voiceAiSettingsTitle: 'إعدادات الردود الصوتية (Voice AI)',
    enableVoiceReplies: 'تفعيل الردود بالرسائل الصوتية',
    enableVoiceRepliesSub: 'سيقوم المساعد بالرد برسالة صوتية (Voice Note) بدلاً من النص',
    voiceToneLabel: 'نبرة وأسلوب الصوت | Voice AI Tone',
    professionalTone: 'احترافي وعملي (Professional)',
    friendlyTone: 'ودي ولطيف (Friendly)',
    formalTone: 'رسمي وجاد (Formal)',

    broadcastTitle: 'التسويق الإعلاني والحملات الترويجية الموجهة',
    broadcastSub: 'قم بإنشاء وإدارة حملات البث الجماعي المباشر لجميع جهات الاتصال أو فئات مستهدفة محددة عبر بوابات واتساب النشطة لديك بنقرة واحدة.',
    newCampaignButton: 'إنشاء حملة تسويقية جديدة',
    campaignName: 'اسم الحملة التسويقية',
    targetContacts: 'الفئات وجهات الاتصال المستهدفة',
    targetContactsPlaceholder: 'اختر تصنيفاً محدداً أو جميع جهات الاتصال',
    campaignMessage: 'محتوى نص رسالة الحملة الترويجية',
    campaignMessagePlaceholder: 'اكتب محتوى الرسالة هنا (يمكنك تضمين متغيرات مثل {username} لبرمجة الاسم تلقائياً)',
    scheduleCampaign: 'جدولة البث والإطلاق المباشر',
    sendRate: 'معدل الإرسال الآمن للرسائل (ثانية لكل رسالة)',
    statusLabel: 'حالة الحملة',
    activeLabel: 'نشطة',
    inactiveLabel: 'غير نشطة',
    actionsLabel: 'الإجراءات والتحكم',
    deleteLabel: 'حذف الحملة',
    runLabel: 'إطلاق فوري للحملة',
    noCampaignsYet: 'لا توجد حملات تسويقية نشطة حالياً. قم بإنشاء أول حملة إعلانية الآن واستمتع بمعدل وصول 100%!',

    analyticsTitle: 'لوحة التحكم والتحليلات البيانية المتقدمة',
    analyticsSub: 'مراقبة حركة الرسائل الواردة والصادرة لجميع بوابات واتساب الذكية، ورصد أداء المساعد الآلي ومعدلات نجاح الحملات الإعلانية.',
    totalMessages: 'إجمالي الرسائل (الصادرة/الواردة)',
    responseTime: 'متوسط سرعة استجابة البوت الذكي',
    activeBots: 'الوكلاء الأذكياء النشطون حالياً',
    campaignSuccess: 'معدل نجاح تسليم الحملات الإعلانية',
    quickStats: 'إحصائيات الأداء اللحظية',
    refreshData: 'تحديث البيانات وتحميل المؤشرات اللحظية'
  },
  en: {
    dashboardTab: 'Dashboard',
    adminTab: 'Admin',
    usersTab: 'Staff & Employees',
    addUser: 'Add User',
    username: 'Username',
    statistics: 'Statistics',
    usage: 'Usage',
    chatTab: 'Chats',
    connectTab: 'Connect',
    campaignsTab: 'Campaigns',
    logout: 'Log Out',

    unifiedInbox: 'ChatCore Unified Inbox',
    unifiedInboxSub: 'ChatCore CRM Inbox Feed',
    newChat: 'New Chat',
    selectActiveLine: 'Select active WhatsApp line to view chats:',
    allLines: 'All Lines',
    allLabels: 'All',
    newLabel: 'New',
    leadLabel: 'Lead',
    pendingLabel: 'Pending',
    completedLabel: 'Completed',
    vipLabel: 'VIP',
    quickDemoLabel: 'Start Quick Demo Chat by Name',
    quickDemoPlaceholder: 'Type customer or visitor name...',
    openButton: 'Open',
    searchPlaceholder: 'Search conversations and messages...',
    noMessagesYet: 'No messages yet',
    noChatsMatch: 'No conversations match the selected filters.',
    youCantAddYourself: "You can't add yourself!",

    welcomeTitle: 'ChatCore Unified Chats & Support Portal',
    welcomeSub: 'Select a conversation or a WhatsApp line from the left to start responding, or use filters to isolate chats per device!',
    endpointActive: 'Secure ChatCore Endpoint Active',

    typingIndicator: 'Typing...',
    online: 'Online',
    offline: 'Offline',
    lastSeenRecent: 'Last seen recently',
    labelSelect: 'Label',
    backToList: 'Back to list',
    messagePlaceholder: 'Type a message or "/" for quick replies...',
    audioRecording: 'Recording audio...',
    audioRecorded: 'Audio recorded',
    cancel: 'Cancel',
    send: 'Send',
    mute: 'Mute Audio',
    unmute: 'Play Audio',

    deviceSetupTitle: 'ChatCore Settings & Gateways',
    deviceSetupSub: 'Connect and manage multi-device WhatsApp gateways and configure Gemini AI assistants for each portal independently.',
    addDeviceButton: 'Connect New Gateway',
    addDevicePlaceholder: 'e.g. Roshdi Main Sales Line',
    activeLinesTitle: 'Currently Connected Gateways',
    pairingCode: 'Pairing Code',
    disconnectLine: 'Disconnect & Unpair Line',
    connecting: 'Connecting...',
    connected: 'Active & Connected',
    scanQrCode: 'Please scan the QR code from your phone to connect the gateway.',
    customInstructions: 'AI Agent Custom Instructions',
    customInstructionsSub: 'Customize AI Agent (Gemini API)',
    aiAgentSettingsTitle: 'Customize AI Assistant (Gemini API)',
    enableAgent: 'Enable AI Auto-Responder',
    enableAgentSub: 'Responds instantly using Google Gemini AI',
    agentNameLabel: 'AI Agent Name / Bot Name',
    agentNamePlaceholder: 'e.g. Roshdi Smart Sales Assistant',
    aiModelLabel: 'Gemini AI Model',
    creativitySliderLabel: 'AI Temperature / Creativity',
    focusedLabel: 'Direct & Focused (0.1)',
    balancedLabel: 'Balanced & Practical',
    creativeLabel: 'Creative & Conversational (1.0)',
    stopKeywordLabel: 'Human Takeover Trigger Keyword',
    stopKeywordPlaceholder: 'e.g. agent, human, stop, support (stops AI instantly when received)',
    stopKeywordSub: 'If the customer sends this word, the auto-responder will stop and conversation will be marked for Human Takeover.',
    knowledgeBaseLabel: 'Factual Knowledge Base / FAQ',
    knowledgeBasePlaceholder: 'Write factual prices, services, and product details here for the agent to use accurately...',
    knowledgeBaseSub: 'Provide facts, prices, and support details so the agent responds accurately without hallucinating.',
    saveRulesButton: 'Save AI Rules & Activate',

    voiceAiSettingsTitle: 'Voice AI & Audio Settings',
    enableVoiceReplies: 'Enable AI Voice Note Replies',
    enableVoiceRepliesSub: 'The agent will respond with a real Voice Note instead of text',
    voiceToneLabel: 'AI Voice Tone & Persona Style',
    professionalTone: 'Professional & Efficient',
    friendlyTone: 'Friendly & Casual',
    formalTone: 'Formal & Polite',

    broadcastTitle: 'Marketing Campaigns & Broadcasts',
    broadcastSub: 'Create and manage bulk broadcast marketing campaigns targeted at specific client labels or all contacts via your active WhatsApp gateways.',
    newCampaignButton: 'Create New Campaign',
    campaignName: 'Campaign Name',
    targetContacts: 'Target Recipients & Labels',
    targetContactsPlaceholder: 'Select all contacts or a specific label category',
    campaignMessage: 'Broadcast Message Content',
    campaignMessagePlaceholder: 'Type your message here (use {username} to dynamically program client names)',
    scheduleCampaign: 'Schedule & Launch Broadcast',
    sendRate: 'Safe Send Delay (seconds per message)',
    statusLabel: 'Campaign Status',
    activeLabel: 'Active',
    inactiveLabel: 'Inactive',
    actionsLabel: 'Actions & Control',
    deleteLabel: 'Delete Campaign',
    runLabel: 'Launch Immediately',
    noCampaignsYet: 'No active marketing campaigns. Create your first campaign now to experience a 100% direct reach rate!',

    analyticsTitle: 'Premium Business Analytics & Live Metrics',
    analyticsSub: 'Monitor incoming and outgoing message rates across all WhatsApp gateways, track AI assistant performance, and review broadcast campaign delivery statistics.',
    totalMessages: 'Total Messages Sent/Received',
    responseTime: 'Average Bot Response Speed',
    activeBots: 'Active AI Agents Connected',
    campaignSuccess: 'Broadcast Delivery Success Rate',
    quickStats: 'Live Performance Statistics',
    refreshData: 'Refresh System Metrics'
  }
};
