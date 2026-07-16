# دليل نشر السيستم على Hostinger (Hostinger Deployment Guide)

يحتوي هذا المجلد (`HOSTINGER`) على نسخة نظيفة جاهزة تماماً للرفع على **GitHub** للربط المباشر مع **Hostinger Node.js Hosting**.

---

## 📋 1. الملفات والمجلدات المستبعدة (مهم جداً!)
تم استبعاد المجلدات والملفات التالية من هذه النسخة لأنها **ملفات تشغيل محلية سرية ومتغيرة** ولا يجب رفعها أبداً على مستودع GitHub العام:
* `node_modules/` (يتم تثبيتها تلقائياً بواسطة Hostinger عند النشر).
* `whatsapp-sessions/` (تُحفظ تلقائياً في Supabase ويتم استعادتها سحابياً).
* `db-store.json` (تُحفظ وتُستعاد من Supabase تلقائياً).
* `.env` (ملف يحتوي على كلمات المرور والمفاتيح السرية، وسنقوم بضبطها في لوحة التحكم بدلاً من رفعها).

---

## 🚀 2. خطوات الرفع على GitHub
قم بإنشاء مستودع (Repository) جديد على حسابك في GitHub، ثم شغل الأوامر التالية من داخل مجلد `HOSTINGER`:

```bash
git init
git add .
git commit -m "Initial commit: Whatsapp CRM ready for Hostinger"
git branch -M main
git remote add origin <رابط_المستودع_الخاص_بك_على_جيت_هاب>
git push -u origin main
```

---

## ⚙️ 3. الإعدادات المطلوبة في لوحة تحكم Hostinger

بعد ربط المستودع في لوحة تحكم Hostinger، تأكد من ضبط الإعدادات التالية:

### أ. إعدادات البيئة وتشغيل الأوامر (Build Configuration)
* **Framework:** `Express` (أو اختر Node.js العام).
* **Node Version:** `22.x` أو أعلى.
* **Build Command:**
  ```bash
  npm install && npm run build
  ```
* **Start Command:**
  ```bash
  npm run start
  ```

### ب. المتغيرات البيئية (Environment Variables)
يجب إضافة المتغيرات البيئية التالية في لوحة تحكم Hostinger (لا تضعها في ملف `.env` على جيت هاب لحماية بياناتك):

1. **`GEMINI_API_KEY`**: مفتاح الـ API الخاص بـ Google Gemini.
2. **`APP_URL`**: رابط موقعك بعد النشر (مثال: `https://your-domain.com`).
3. **`SUPABASE_URL`**: رابط مشروعك على Supabase (مثال: `https://ejeqxgjkfzqqtcryoigu.supabase.co`).
4. **`SUPABASE_SERVICE_ROLE_KEY`**: مفتاح الـ `service_role` الإداري السري (الذي يبدأ بـ `eyJ...` من إعدادات API في Supabase).

---

بمجرد إتمام الرفع والربط، سيبدأ Hostinger ببناء المشروع بنجاح وتجهيز السيستم للعمل!
