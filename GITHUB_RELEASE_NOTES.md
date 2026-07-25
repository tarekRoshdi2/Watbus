# 🚀 ChatCore Enterprise AI HQ - GitHub Release & Update Notes (v2.5.0)

## 📌 Executive Summary
تحديث رئيسي شامل لمنظومة **ChatCore Enterprise AI Headquarters**:
- **قاعدة بيانات سحابية متكاملة للموظفين الأذكياء (Supabase AI Staff Database)**.
- **مركز تدريب وتخصص مستقل لكل موظف ذكي (Supabase Training HQ)**.
- **ربط ديناميكي بين محرك المحادثات `ChatCoreSwarm` وقاعدة بيانات Supabase**.
- **مفتاح تحكم دقيق (On/Off Toggle Button) لكل موظف** لحالات الإيقاف والتشغيل المؤقت.
- **تأمين السيرفر ومعالجة جميع أخطاء بيئة التشغيل ES Modules**.

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

## 🛠️ 4. Bug Fixes & Stability

1. **إصلاح ES Module Scope**:
   - حل خطأ `ReferenceError: require is not defined` واستبداله بـ `import crypto from 'crypto'`.
2. **إصلاح استيراد الأيقونات في React**:
   - إضافة استيراد `Brain` و `Trash2` من مكتبة `lucide-react`.
3. **فحص الأنظمة والتأكد من البناء بدون أخطاء**:
   - اجتياز اختبار `npx tsc --noEmit` بنجاح 100%.

---

## 🚀 How to Run Locally

```bash
# Install dependencies
npm install

# Start Server & Vite Dev Engine
npm run dev
```
