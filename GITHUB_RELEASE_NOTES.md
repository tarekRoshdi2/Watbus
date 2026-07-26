# 🚀 ChatCore Enterprise AI HQ - GitHub Release & Update Notes (v3.5.0)

## 📌 Executive Summary
تحديث رئيسي وإصدار ذهبي شامل لمنظومة **ChatCore Enterprise AI Headquarters (v3.5.0)**:
- **إصلاح وسد كافة الثغرات الأمنية (Security Hardening)**: إزالة ثغرة التجاوز `x-user-id` وتأمين JWT والـ Rate Limiting.
- **معالجة تجميع اتصالات قاعدة البيانات (Supabase Pool Fix)**: تحديد حد أقصى `max: 5` لمنع أخطاء `EMAXCONNSESSION`.
- **تعزيز الذكاء متعدد الوسائط (Multimodal AI & PDF Engine)**: إضافة التوجيه وتفحص مستندات الـ PDF والملفات بصورة كاملة.
- **قاعدة بيانات سحابية متكاملة للموظفين الأذكياء (Supabase AI Staff Database)**.
- **تكامل واستقرار بوت تليجرام وخادم الواتساب (Telegram & Baileys Stabilization)**.

---

## 🗄️ 1. Supabase Database Architecture

تم تصميم وبناء الجداول التالية داخل قاعدة بيانات PostgreSQL على Supabase:

### `public.ai_agents`
جدول الموظفين الأذكياء الرئيسي، يحتوي على:
- `id`: المعرف الفريد للموظف (`agent_sales`, `agent_invoice`, `agent_support`, `agent_media`, `agent_marketing`, `agent_router`, `agent_dev`).
- `name`, `name_en`, `role`, `description`, `status` (`active`, `busy`, `offline`).
- `model`: نموذج الذكاء الاصطناعي (`gemini-2.5-flash`).
- `system_prompt`, `responsibilities`, `guardrails`, `metrics`, `disabled`.

### `public.agent_training_data`
جدول مركز التدريب والتخصص المخصص لكل موظف:
- `agent_id`: FK -> `ai_agents(id)`.
- `type`: نوع التخصص (`persona`, `knowledge`, `scenario`, `guardrail`, `example_qa`).
- `title`: عنوان الوحدة التدريبية.
- `content`: النصوص والتعليمات التفصيلية للذكاء الاصطناعي.
- `is_active`: حالة تفعيل الوحدة التدريبية.
- `priority`: أولوية حقن التعليمات أثناء معالجة المحادثة.

### `public.agent_performance_logs` & `public.agent_training_resources`
سجلات الأداء اللحظي لكل موظف والملفات/الموارد المرفوعة لتدريب طاقم الموظفين.

---

## ⚙️ 2. Backend Engine & Swarm Integration (`server.ts` & `ChatCoreSwarm.ts`)

- **واجهات API جديدة للتدريب**:
  - `GET /api/agents/:agentId/training`: استرجاع جميع الوحدات التدريبية المفعّلة للموظف.
  - `POST /api/agents/:agentId/training`: إضافة وحدة تدريبية جديدة فوراً.
  - `PATCH /api/agents/:agentId/training/:itemId/toggle`: تغيير حالة التفعيل (Active/Inactive).
  - `DELETE /api/agents/:agentId/training/:itemId`: حذف وحدة تدريبية من قاعدة البيانات.
  - `POST /api/agents/:agentId/toggle-status`: تبديل حالة الموظف (تشغيل/إيقاف مؤقت).

- **حقن التخصص التلقائي (`ChatCoreSwarm.ts`)**:
  - يقوم المحرك بحقن تعليمات التدريب النشطة من Supabase تلقائياً في سياق الموظف المختص (`agent_invoice`, `agent_support`, `agent_media`, `agent_sales`) قبل توليد الرد عبر Gemini API.

---

## 🎨 3. Dashboard UI Enhancements (`AgentsDashboard.tsx`)

- **زر التشغيل والإيقاف المؤقت (Toggle On/Off)**:
  - إضافة زر تفاعلي لكل بطاقة موظف في الـ Roster.
  - ظهور بنر تحذيري وشارات حمراء عند إيقاف أي موظف مع تخطي الـ Swarm له تلقائياً.

- **تبويب مركز التدريب المخصص (`Supabase HQ`)**:
  - إضافة تبويب **🎓 مركز التدريب والتخصص (Supabase HQ)** داخل نافذة التحكم بالموظف.
  - واجهة إضافة وحدات تدريبية وتصنيفها (معرفة، سيناريو، ضوابط، شخصية).
  - قائمة استعراض المواد التدريبية المزامنة مع Supabase مع زر تفعيل وحذف مباشر.

---

## 🛠️ 4. Bug Fixes, Security & Performance (v3.5.0 Gold)

1. **إصلاح وسد الثغرات الأمنية الحادة (Auth Vulnerabilities)**:
   - حذف ثغرة التجاوز عن طريق الهيدر `x-user-id` والـ fallback غير الآمن لـ `admin-tarek`.
   - تأمين الـ JWT Token والـ Authorization Headers وإرجاع `401 Unauthorized` صريحة.
2. **معالجة اتصالات قاعدة البيانات (Connection Pool & Supabase Limits)**:
   - حل مشكلة `EMAXCONNSESSION` بتحديد `max: 5` اتصالات فقط لمجمع اتصالات `pg.Pool` في Prisma واستخدام الـ Supabase Client Singleton.
3. **دعم المستندات والـ Multimodal Document Analysis**:
   - دعم كامل لقراءة وتحليل وتفحص مستندات الـ PDF والملفات الصوتية والصورة تلقائياً.
4. **تكامل البوتات والخدمات (Telegram & Card Generators)**:
   - إصلاح معالجة Markdown في تليجرام لمنع تعليق أو سقوط البوت عند إرسال التنسيقات المعقدة.
5. **فحص الأنظمة والتأكد من البناء بدون أخطاء**:
   - اجتياز اختبار `npx tsc --noEmit` بنجاح 100%.

---

## 🚀 How to Run Locally

```bash
# Install dependencies
npm install

# Start Server & Vite Dev Engine
npm run dev
```
