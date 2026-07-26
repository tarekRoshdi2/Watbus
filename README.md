# 🚀 ChatCore Enterprise AI — Watbus Platform (v3.5.0 Gold Edition)

![ChatCore Enterprise](https://img.shields.io/badge/ChatCore-Enterprise%20AI-00a884?style=for-the-badge&logo=whatsapp&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

منظومة **ChatCore Enterprise AI (Watbus)** المتكاملة لإدارة أتمتة الواتساب، المبيعات، الحسابات والفواتير المصورة، الدعم الفني، وطاقم الموظفين الذكيين بالذكاء الاصطناعي متعدد الوسائط (Multimodal Swarm AI Engine).

---

## 📋 فهرس المحتويات (Table of Contents)
- [🌟 أبرز التحديثات والميزات في الإصدار الذهبي v3.5.0](#-أبرز-التحديثات-والميزات-في-الإصدار-الذهبي-v350)
- [🔐 الإصلاحات الأمنية والحماية (Security Hardening)](#-الإصلاحات-الأمنية-والحماية-security-hardening)
- [⚡ تحسين أداء اتصالات قاعدة البيانات (Database Connection Pooling)](#-تحسين-أداء-اتصالات-قاعدة-البيانات-database-connection-pooling)
- [🤖 طاقم الموظفين الذكيين (AI Swarm Agents Architecture)](#-طاقم-الموظفين-الذكيين-ai-swarm-agents-architecture)
- [🎓 مركز تدريب وتخصص الموظفين (Supabase AI Training HQ)](#-مركز-تدريب-وتخصص-الموظفين-supabase-ai-training-hq)
- [🎙️ الذكاء الاصطناعي متعدد الوسائط (Multimodal Capabilities)](#-الذكاء-الاصطناعي-متعدد-الوسائط-multimodal-capabilities)
- [📱 محرك إدارة أجهزة الواتساب (Multi-Device Engine)](#-محرك-إدارة-أجهزة-الواتساب-multi-device-engine)
- [🌐 تكامل الخدمات والبوتات الخارجية (External Integrations)](#-تكامل-الخدمات-والبوتات-الخارجية-external-integrations)
- [🏗️ البنية التحتية والتقنيات (Tech Stack)](#-البنية-التحتية-والتقنيات-tech-stack)
- [🔌 دليل واجهات API (API Reference Endpoints)](#-دليل-واجهات-api-api-reference-endpoints)
- [🚀 التشغيل والبناء (Quick Start & Deployment)](#-التشغيل-والبناء-quick-start--deployment)

---

## 🌟 أبرز التحديثات والميزات في الإصدار الذهبي v3.5.0

1. **سد كافة الثغرات الأمنية ومنع التجاوزات الصريحة**: إزالة ثغرات الـ Auth Bypass بالكامل، فرض مصادقة JWT الشاملة، وتقييد الوصول للمسارات المحمية.
2. **حل مشكلة استنزاف اتصالات Supabase (`EMAXCONNSESSION`)**: تطبيق النمط المفرد (Singleton Pattern) لكائنات Supabase وتحجيم مجمع اتصالات `pg.Pool` و Prisma لـ `max: 5`.
3. **دعم مستندات الـ PDF وقراءتها بالكامل**: تفحص وتحليل ملفات الـ PDF والكتالوجات المرفقة واستخراج الإجابات فوريّاً.
4. **مركز تدريب وتخصص سحابي مستقل لكل موظف ذكي**: ربط الـ Swarm بجدول `agent_training_data` على Supabase وحقن سيناريوهات الشخصيات والضوابط أوتوماتيكياً.
5. **مفتاح التحكم والإيقاف المؤقت (On/Off Agent Toggle)**: إمكانية إيقاف/تشغيل أي موظف ذكي بضغطة زر مع معالجة الانتقال السلس بدون تعطيل المحادثة.
6. **استقرار بوت تليجرام ومولد البطاقات المصورة**: حظر أخطاء تنسيق الـ Markdown في تليجرام ومنع تعارضات الـ Polling.

---

## 🔐 الإصلاحات الأمنية والحماية (Security Hardening)

- **إلغاء ثغرة `x-user-id` Auth Bypass**: تم حذف السلوك الذي كان يمنح صلاحية `admin` لأي طلب يحتوي على `x-user-id: admin`. تم إجبار التحقق من وجود المستخدم الفعلي وصحة حسابه.
- **إلغاء التعيين التلقائي كـ Admin عند فشل الـ Token**: في حال انتهاء صلاحية الـ JWT Token، يتم إلغاء الـ Fallback السابق وإرجاع استجابة `401 Unauthorized` صريحة.
- **تأمين مفتاح التشفير JWT**: منع الاعتماد المباشر على المفتـاح الافتراضي وإلزام وجود `JWT_SECRET` في البيئة التشغيلية.
- **تقييد المعدل وحماية الأمان (Rate Limiting)**: تطبيق `express-rate-limit` وتحديد سياسات الأمان لمسارات الـ API.

---

## ⚡ تحسين أداء اتصالات قاعدة البيانات (Database Connection Pooling)

- **Supabase Singleton Pattern**: توحيد استدعاء `getSupabaseClient()` عبر كائن سحابي واحد معاد الاستخدام يمنع إنشاء اتصالات HTTP/PostgREST مكررة.
- **Prisma & PostgreSQL Connection Limits**: إدخال الإعدادات التالية في [src/db.ts](file:///f:/AI/Watbus/src/db.ts):
  ```typescript
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  ```
- **Pg-Boss Connection Safeguards**: إعداد زمام قوائم المعالجة `pg-boss` ليعمل بأمان تحت قيود الاتصال دون إسقاط الخادم عند أوقات الضغط العالي.

---

## 🤖 طاقم الموظفين الذكيين (AI Swarm Agents Architecture)

الم المنظومة تعتمد على محرك الـ Swarm التشاركي (`ChatCoreSwarm`):

```
                       [ Incoming Message / Webhook ]
                                     │
                                     ▼
                           [ RouterAgent (طارق) ]
       (Classifies Intent via Gemini 2.0 Flash / Quick Regex)
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
[ Ahmed (المبيعات) ]        [ Salah (الفواتير) ]         [ Omar (الدعم الفني) ]
 Catalog & Pricing          SVG Invoice Cards            Ticket & Issue Logs
        │                            │                            │
        ├────────────────────────────┼────────────────────────────┘
        ▼                            ▼
[ Kareem (الديزاين) ]      [ Mariam (التسويق) ]
 Offer Banners & Cards     Campaigns & Retargeting
```

- **أحمد (مبيعات وكتالوج)**: متخصص في الإجابة عن المنتجات والأسعار والتوصية المناسبة.
- **صلاح (حسابات وفواتير)**: ينشئ فواتير سداد رسمية مصورة برابط فودافون كاش وأنستا باي عبر [cardGenerator.ts](file:///f:/AI/Watbus/src/utils/cardGenerator.ts).
- **عمر (دعم فني وربط)**: متابعة الأعطال البرمجية وإنشاء تذاكر المتابعة بـ SVG كارت.
- **كريم (ديزاين ووسائط)**: توليد كروت وبنرات العروض للعملاء.
- **مريم (تسويق وحملات)**: كتابة المحتوى التسويقي والحملات الموجهة.
- **طارق (موجه النظام RouterAgent)**: تحليل نية العميل وتحديد الموظف الأنسب للرد.

---

## 🎓 مركز تدريب وتخصص الموظفين (Supabase AI Training HQ)

تم ربط النظام بقواعد بيانات Supabase السحابية لإتاحة تدريب وتخصيص الموظفين الأذكياء بدون تعديل الكود البرمجي:

### جداول قاعدة البيانات (Supabase Schema):
- **`public.ai_agents`**: حفظ الهوية الكاملة، الدور الوظيفي، النموذج الذكي (`gemini-2.5-flash`)، درجة الابتكار (Temperature)، اللهجة (عامية مصري/خليجي/فصحى)، الضوابط، وحالة التشغيل/الإيقاف لكل موظف.
- **`public.agent_training_data`**: جدول مركز التدريب والتخصص المخزن سحابياً على Supabase، ويحتوي على تصنيفات متعددة:
  - `persona`: الشخصية وأسلوب التحدث.
  - `knowledge`: المعرفة والحقائق والأسعار.
  - `scenario`: سيناريوهات التعامل مع اعتراضات العملاء.
  - `guardrail`: الحدود والضوابط وخصومات السعر.
  - `example_qa`: الأمثلة الشائعة للأسئلة والأجوبة.

---

## 🎙️ الذكاء الاصطناعي متعدد الوسائط (Multimodal Capabilities)

- **الرسائل الصوتية (Voice Notes)**: استقبال وتفريغ مقاطع الصوت وتحليلها وإعادة توليد الإجابات صوتياً وصوت صوتي طبيعي عبر VoiceAgent.
- **تحليل الصور (Vision Analysis)**: فحص وقراءة الصور المرفقة (صور المنتجات، إيصالات الدفع والتحويلات البنكية).
- **تفحص مستندات PDF (PDF Document Parsing)**: قراءة الملفات والمستندات والكتالوجات بصيغة PDF المرفقة من العملاء والإجابة عن تفاصيلها بدقة متناهية.

---

## 📱 محرك إدارة أجهزة الواتساب (Multi-Device Engine)

- ربط عدة أجهزة واتساب في وقت واحد عبر مكتبة `@whiskeysockets/baileys` و WhatsApp Cloud API.
- المزامنة السحابية للجلسات عبر جدول `whatsapp_sessions` لتجنب إعادة مسح كود الـ QR بعد إعادة تشغيل الخادم.
- معالجة التضارب التلقائي والتأكد من سلامة ملفات `creds.json` قبل بدء الجلسة.

---

## 🌐 تكامل الخدمات والبوتات الخارجية (External Integrations)

- **ExpoCore Webhook Integration**: يستقبل طلبات إرسال تذاكر المعارض، الفواتير، ومستندات الـ PDF بـ Base64 عبر `/api/expocore/webhook` وإرسالها فوراً للعملاء عبر الواتساب.
- **Telegram Bot Integration**: إرسال واستقبال المحادثات عبر تليجرام وتكامل مع الـ Swarm AI مع حماية ضد أخطاء الـ Markdown و Polling Conflicts.
- **OpenRouter Fallback Engine**: نظام احتياطي أوتوماتيكي للتحول لنماذج OpenRouter (مثل DeepSeek / Llama) في حال نفاذ حصص Gemini API.

---

## 🏗️ البنية التحتية والتقنيات (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, WebSocket (ws).
- **Database**: PostgreSQL, Supabase Cloud, Prisma ORM, JSON Local Fallback Store.
- **AI Engine**: Google GenAI SDK (Gemini 2.0 Flash/Lite), Multi-Key Rotation Engine, OpenRouter API.
- **Async Queue**: Pg-Boss Queue (PostgreSQL Background Worker).
- **Messaging Engines**: Baileys Multi-File Auth, Meta WhatsApp Cloud API, Telegram Bot API.

---

## 🔌 دليل واجهات API (API Reference Endpoints)

| المسار (Endpoint) | النوع (Method) | الوصف (Description) |
|---|---|---|
| `/api/auth/admin-login` | `POST` | تسجيل دخول المسؤول والحصول على JWT Token |
| `/api/agents` | `GET` | جلب قائمة الموظفين الأذكياء وإعداداتهم |
| `/api/agents/:agentId/training` | `GET / POST` | استرجاع وإضافة مواد تدريبية للموظف على Supabase |
| `/api/agents/:agentId/training/:itemId/toggle` | `PATCH` | تفعيل/تعطيل وحدة تدريبية محددة للموظف |
| `/api/agents/:agentId/toggle-status` | `POST` | تشغيل أو إيقاف الموظف الذكي مؤقتاً |
| `/api/expocore/webhook` | `POST` | استقبال الفواتير والتذاكر وربط الأنظمة الخارجية |
| `/api/supabase/status` | `GET` | فحص حالة قاعدة البيانات السحابية وجداول المزامنة |
| `/api/catalog` | `GET / POST` | جلب وإضافة منتجات الكتالوج |

---

## 🚀 التشغيل والبناء (Quick Start & Deployment)

### 1. تثبيت المكتبات (Install Dependencies)
```bash
npm install
```

### 2. إعداد ملف البيئة (`.env`)
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_API_KEYS="key1,key2,key3"
JWT_SECRET="your-super-secure-jwt-secret-key-2026"
```

### 3. تشغيل بيئة التطوير (Development)
```bash
npm run dev
```

### 4. بناء وتشغيل الإنتاج (Production Build & Start)
```bash
# فحص البناء والأخطاء
npm run lint

# البناء المحلي للإنتاج
npm run build:local

# تشغيل خادم الإنتاج
npm start
```

---

## 📜 التوثيق والدلائل المساندة (Documentation)

- 📜 [دليل الرفع على استضافة Hostinger](file:///f:/AI/Watbus/HOSTINGER_DEPLOY.md)
- 📝 [تقرير المراجعة الأمنية والتقنية الشاملة](file:///C:/Users/Roshdi/.gemini/antigravity-ide/brain/429befe6-1e11-48c9-bb02-fa67ea4c9be4/implementation_plan.md)
- 🛠️ [سجل التحقق والاختبارات الفنية](file:///C:/Users/Roshdi/.gemini/antigravity-ide/brain/429befe6-1e11-48c9-bb02-fa67ea4c9be4/walkthrough.md)

---

## 🛡️ الترخيص (License)
Apache-2.0 License — جميع الحقوق محفوظة لمنظومة ChatCore Enterprise AI / Watbus 2026.
