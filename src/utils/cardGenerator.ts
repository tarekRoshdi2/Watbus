/**
 * Ultra-High-Quality Visual Card & Invoice Image Generator
 * Generates crisp, clean PNG/SVG image cards for WhatsApp messaging.
 */

export interface InvoiceCardData {
  invoiceNumber: string;
  customerName: string;
  planName: string;
  amount: number | string;
  currency: string;
  date?: string;
  instaPayId?: string;
  vodafoneNo?: string;
}

export function generateInvoiceCardImage(data: InvoiceCardData): string {
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const instaPay = data.instaPayId || 'trkroshdi@instapay';
  const vodafone = data.vodafoneNo || '01115822923';
  const amountStr = typeof data.amount === 'number' ? data.amount.toLocaleString() : data.amount;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500" fill="none">
    <!-- Outer Glow & Background -->
    <rect width="900" height="500" rx="32" fill="#0b0f19"/>
    <rect width="896" height="496" x="2" y="2" rx="30" stroke="url(#paint0_linear)" stroke-opacity="0.6" stroke-width="3"/>

    <!-- Header Banner -->
    <rect x="40" y="35" width="820" height="75" rx="20" fill="url(#paint1_linear)"/>
    <text x="450" y="70" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle">ChatCore Enterprise AI — فاتورة رسمية معتمدة</text>
    <text x="450" y="93" fill="#A7F3D0" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">رقم الفاتورة: #${data.invoiceNumber} | التاريخ: ${dateStr}</text>

    <!-- Client & Plan Info Box -->
    <rect x="40" y="130" width="820" height="110" rx="20" fill="#131b2e" stroke="#1e293b"/>
    <text x="830" y="165" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="13" text-anchor="end">اسم المستفيد والعميل:</text>
    <text x="830" y="195" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="800" text-anchor="end">${data.customerName}</text>
    
    <text x="70" y="165" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="13" text-anchor="start">الباقة المختارة:</text>
    <text x="70" y="195" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="800" text-anchor="start">${data.planName}</text>

    <!-- Amount Card -->
    <rect x="40" y="260" width="820" height="110" rx="20" fill="url(#paint2_linear)" stroke="#10B981" stroke-width="1.5"/>
    <text x="830" y="300" fill="#D1FAE5" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="end">الإجمالي المستحق (السعر شامل وصافي 100%):</text>
    <text x="830" y="345" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="900" text-anchor="end">${amountStr} ${data.currency}</text>
    <text x="70" y="325" fill="#A7F3D0" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="800" text-anchor="start">✔ حالة الفاتورة: بانتظار سكرين شوت التحويل</text>

    <!-- Payment Accounts Footer -->
    <rect x="40" y="390" width="820" height="75" rx="16" fill="#0f172a" stroke="#334155"/>
    <text x="830" y="420" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="800" text-anchor="end">📱 حسابات التحويل الفوري المعتمدة:</text>
    <text x="830" y="445" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="end">• InstaPay: ${instaPay} | • فودافون كاش: ${vodafone}</text>

    <!-- Gradients -->
    <defs>
      <linearGradient id="paint0_linear" x1="0" y1="0" x2="900" y2="500" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10B981"/>
        <stop offset="0.5" stop-color="#6366F1"/>
        <stop offset="1" stop-color="#F59E0B"/>
      </linearGradient>
      <linearGradient id="paint1_linear" x1="40" y1="35" x2="860" y2="110" gradientUnits="userSpaceOnUse">
        <stop stop-color="#059669"/>
        <stop offset="1" stop-color="#0284C7"/>
      </linearGradient>
      <linearGradient id="paint2_linear" x1="40" y1="260" x2="860" y2="370" gradientUnits="userSpaceOnUse">
        <stop stop-color="#064E3B"/>
        <stop offset="1" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
  </svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

export function generatePlansCardImage(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" fill="none">
    <rect width="900" height="520" rx="32" fill="#090d16"/>
    <rect width="896" height="516" x="2" y="2" rx="30" stroke="#6366f1" stroke-opacity="0.4" stroke-width="2"/>
    
    <text x="450" y="50" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle">👑 باقات وأسعار شات كور للذكاء الاصطناعي (ChatCore AI)</text>
    <text x="450" y="80" fill="#38bdf8" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle">اختر الباقة المناسبة لمشروعك لربط الواتساب وطاقم الموظفين الذكيين</text>

    <!-- Plan 1 -->
    <rect x="40" y="110" width="250" height="360" rx="20" fill="#111827" stroke="#1f2937" stroke-width="2"/>
    <text x="165" y="150" fill="#9ca3af" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="800" text-anchor="middle">الباقة الأساسية (Starter)</text>
    <text x="165" y="195" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="900" text-anchor="middle">1,000 ج.م</text>
    <text x="165" y="240" fill="#10b981" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ جهاز واتساب واحد</text>
    <text x="165" y="275" fill="#10b981" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ 1,000 رسالة AI شهرياً</text>
    <text x="165" y="310" fill="#10b981" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ كود OTP أوتوماتيكي</text>
    <text x="165" y="345" fill="#10b981" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ سجل المحادثات والـ CRM</text>

    <!-- Plan 2 (Pro Popular) -->
    <rect x="325" y="95" width="250" height="390" rx="20" fill="#1e1b4b" stroke="#818cf8" stroke-width="3"/>
    <rect x="380" y="95" width="140" height="26" rx="13" fill="#6366f1"/>
    <text x="450" y="112" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="900" text-anchor="middle">⭐ الأكثر اختياراً 🔥</text>
    <text x="450" y="155" fill="#a5b4fc" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="800" text-anchor="middle">الباقة الاحترافية (Pro)</text>
    <text x="450" y="200" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="900" text-anchor="middle">2,000 ج.م</text>
    <text x="450" y="245" fill="#818cf8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ 5 أجهزة واتساب متصلة</text>
    <text x="450" y="280" fill="#818cf8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ 10,000 رسالة AI شهرياً</text>
    <text x="450" y="315" fill="#818cf8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ الموظفين الذكيين بالكامل</text>
    <text x="450" y="350" fill="#818cf8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ تفريغ الصوتيات والرسائل</text>
    <text x="450" y="385" fill="#818cf8" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ دعم أولوية مخصص</text>

    <!-- Plan 3 -->
    <rect x="610" y="110" width="250" height="360" rx="20" fill="#111827" stroke="#1f2937" stroke-width="2"/>
    <text x="735" y="150" fill="#f59e0b" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="800" text-anchor="middle">باقة الشركات (Enterprise)</text>
    <text x="735" y="195" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="900" text-anchor="middle">4,000 ج.م</text>
    <text x="735" y="240" fill="#f59e0b" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ أجهزة ورسائل لا نهائية</text>
    <text x="735" y="275" fill="#f59e0b" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ مقر الموظفين الذكيين HQ</text>
    <text x="735" y="310" fill="#f59e0b" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ Supabase Cloud Sync</text>
    <text x="735" y="345" fill="#f59e0b" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✔ دعم VIP 24/7 مخصص</text>
  </svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}
