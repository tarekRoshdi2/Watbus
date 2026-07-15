import React, { useState, useEffect } from 'react';
import { User, DemoLead } from '../types';
import { 
  Activity, 
  Users, 
  FileText, 
  Settings, 
  Shield, 
  Cpu, 
  Server, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  Key, 
  Mail, 
  Calendar, 
  Database, 
  Clock, 
  RefreshCw, 
  MessageSquare, 
  Phone, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  UserCheck, 
  XCircle,
  BarChart2
} from 'lucide-react';
import OTPTesting from './OTPTesting';

interface Props {
  currentUser: User | null;
  lang: 'ar' | 'en';
}

export default function AdminPage({ currentUser, lang }: Props) {
  const [data, setData] = useState<{users: User[], demoLeads: DemoLead[]} | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'settings'>('overview');
  
  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tracking & detailed user activity data
  const [userWorkData, setUserWorkData] = useState<any>(null);
  const [loadingWork, setLoadingWork] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'activity'>('info');

  // Edit fields for selected user
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSubscriptionStatus, setEditSubscriptionStatus] = useState<'active' | 'inactive' | 'trial'>('trial');
  const [editDuration, setEditDuration] = useState('30');
  const [editUsageLimit, setEditUsageLimit] = useState('5000');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch users report
  const fetchReport = () => {
    fetch('/api/admin/otp-report')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching admin report:", err));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Fetch detailed work & activity for a user
  const fetchUserWork = (userId: string) => {
    setLoadingWork(true);
    fetch(`/api/admin/users/${userId}/work`)
      .then(res => res.json())
      .then(resData => {
        setUserWorkData(resData);
        setLoadingWork(false);
      })
      .catch(err => {
        console.error("Error fetching user work:", err);
        setLoadingWork(false);
      });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setModalTab('info');
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditSubscriptionStatus(user.subscriptionStatus);
    setEditDuration('30');
    setEditUsageLimit(String(user.usageLimit || 5000));
    setSaveSuccess(false);
    setSaveError('');
    fetchUserWork(user.id);
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editEmail,
          password: editPassword || undefined,
          subscriptionStatus: editSubscriptionStatus,
          duration: editDuration,
          usageLimit: editUsageLimit
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh report
        fetchReport();
        // Refresh details
        fetchUserWork(editingUser.id);
      } else {
        const errData = await response.json();
        setSaveError(errData.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm(
      lang === 'ar' 
        ? '⚠️ هل أنت متأكد تماماً من رغبتك في حذف هذا المستخدم نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء!' 
        : '⚠️ Are you absolutely sure you want to permanently delete this user from the system? This action cannot be undone!'
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
        setEditingUser(null);
        fetchReport();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const filteredUsers = data?.users.filter(u => {
    const matchQuery = searchQuery.trim().toLowerCase();
    if (!matchQuery) return true;
    return (
      u.username.toLowerCase().includes(matchQuery) ||
      (u.email && u.email.toLowerCase().includes(matchQuery)) ||
      u.id.toLowerCase().includes(matchQuery)
    );
  }) || [];

  const tabs = [
    { id: 'overview', name: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: Activity },
    { id: 'users', name: lang === 'ar' ? 'إدارة المستخدمين' : 'User Management', icon: Users },
    { id: 'logs', name: lang === 'ar' ? 'سجلات النظام' : 'System Logs', icon: FileText },
    { id: 'settings', name: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
    { id: 'otp', name: lang === 'ar' ? 'اختبار OTP' : 'OTP Testing', icon: Shield },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-zinc-900 to-zinc-850 dark:from-zinc-900 dark:to-zinc-800 p-6 md:p-8 rounded-3xl text-white shadow-lg border border-zinc-800">
        <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                <Shield className="text-[#00a884] w-8 h-8" />
                {lang === 'ar' ? 'لوحة التحكم المركزية' : 'Admin Central Command'}
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">
              {lang === 'ar' ? 'نظام التحكم الشامل بالمستخدمين وتراخيص الخدمة وتتبع نشاط الأجهزة' : 'Comprehensive control panel for subscription statuses, limits, and real-time device monitoring'}
            </p>
        </div>
        <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-full bg-[#00a884]/20 text-[#00a884] font-bold text-xs border border-[#00a884]/30 flex items-center gap-2">
                 <UserCheck className="w-4 h-4" />
                 {lang === 'ar' ? 'حساب مدير النظام' : 'Super Admin Mode'}
             </div>
             <button 
               onClick={fetchReport}
               className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 border border-zinc-700"
             >
                <RefreshCw className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'تحديث البيانات' : 'Sync'}
             </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-1 scrollbar-none">
        {tabs.map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-[#00a884] text-[#00a884] bg-[#00a884]/5' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
                <tab.icon className="w-4 h-4" />
                {tab.name}
            </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                  { label: lang === 'ar' ? 'إجمالي أصحاب الحسابات' : 'Total Customers', value: data?.users.length || 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: lang === 'ar' ? 'طلبات الديمو المحجوزة' : 'Demo Leads', value: data?.demoLeads.length || 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: lang === 'ar' ? 'المستخدمون النشطون' : 'Active Paid Users', value: data?.users.filter(u => u.subscriptionStatus === 'active').length || 0, icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  { label: lang === 'ar' ? 'فترات التجربة المجانية' : 'Free Trials Active', value: data?.users.filter(u => u.subscriptionStatus === 'trial').length || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 transition-all hover:scale-[1.01]">
                      <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                          <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">{stat.label}</p>
                          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#00a884]" />
                {lang === 'ar' ? 'طلبات التواصل الأخيرة لطلب تجريبي (Demo Leads)' : 'Recent Demo Leads'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="text-xs text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <th className="py-2 text-start">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th className="py-2 text-start">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                      <th className="py-2 text-start">{lang === 'ar' ? 'التاريخ' : 'Created At'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.demoLeads && data.demoLeads.length > 0 ? (
                      data.demoLeads.slice(-5).reverse().map(lead => (
                        <tr key={lead.id} className="text-xs border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3 font-bold">{lead.username}</td>
                          <td className="py-3 font-mono text-zinc-500">{lead.phone}</td>
                          <td className="py-3 text-zinc-400">{new Date(lead.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-zinc-400 text-xs">
                          {lang === 'ar' ? 'لا يوجد طلبات حالياً' : 'No demo leads registered yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00a884]" />
                {lang === 'ar' ? 'حالة البنية التحتية' : 'Infrastructure Health'}
              </h3>
              <div className="space-y-4">
                {[
                  { name: lang === 'ar' ? 'استهلاك المعالج' : 'CPU Load', value: '12%', progress: 12, color: 'bg-emerald-500' },
                  { name: lang === 'ar' ? 'الذاكرة RAM' : 'Memory Usage', value: '450MB / 1GB', progress: 45, color: 'bg-blue-500' },
                  { name: lang === 'ar' ? 'صحة قاعدة البيانات' : 'DB Engine Status', value: lang === 'ar' ? 'ممتاز' : 'Healthy (0ms delay)', progress: 100, color: 'bg-emerald-500' },
                  { name: lang === 'ar' ? 'الرسائل في طابور الإرسال' : 'Campaign Queue Size', value: '0 pending', progress: 0, color: 'bg-zinc-300 dark:bg-zinc-700' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-600 dark:text-zinc-300">{stat.name}</span>
                      <span className="text-zinc-500 font-mono">{stat.value}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} transition-all duration-500`} style={{ width: `${stat.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h2 className="font-extrabold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#00a884]" />
                      {lang === 'ar' ? 'قائمة المشتركين والعملاء' : 'Subscription Accounts'}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      {lang === 'ar' ? 'تعديل الصلاحيات، تغيير كلمات المرور، ومراقبة النشاط الفعلي لكل عميل.' : 'Modify subscription parameters, update passwords, and trace live platform activity per tenant.'}
                    </p>
                 </div>
                 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                     <div className="relative flex-1 md:flex-initial">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                        <input 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={lang === 'ar' ? 'البحث عن مستخدم...' : 'Search for users...'} 
                          className="pl-9 pr-4 py-2 w-full md:w-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none border border-transparent focus:border-[#00a884]/35 transition-all" 
                        />
                     </div>
                     <button 
                         onClick={() => setIsAddUserOpen(true)}
                         className="px-4 py-2.5 bg-[#00a884] hover:bg-[#008f6e] text-white rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-[#00a884]/10 cursor-pointer"
                     >
                        <span>{lang === 'ar' ? '+ إضافة مستخدم جديد' : '+ New User'}</span>
                     </button>
                 </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-start">
                   <thead className="text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                       <tr>
                           <th className="pb-3 text-start pl-4">{lang === 'ar' ? 'الاسم والبيانات' : 'Account Identifier'}</th>
                           <th className="pb-3 text-start">{lang === 'ar' ? 'نوع الاشتراك' : 'License Type'}</th>
                           <th className="pb-3 text-start">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</th>
                           <th className="pb-3 text-start">{lang === 'ar' ? 'الاستهلاك الفعلي' : 'AI Token Consumption'}</th>
                           <th className="pb-3 text-start">{lang === 'ar' ? 'الحد الأقصى' : 'Usage Limit'}</th>
                           <th className="pb-3 text-start">{lang === 'ar' ? 'الإجراءات والتحكم' : 'Management'}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-all">
                              <td className="py-4 pl-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-sm font-black border border-zinc-200 dark:border-zinc-700 uppercase">
                                        {u.username.substring(0, 2)}
                                      </div>
                                      <div>
                                        <div className="font-black text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                          {u.username}
                                          {u.isOnline && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">ID: {u.id}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                    u.subscriptionStatus === 'active' 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                      : u.subscriptionStatus === 'trial' 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  }`}>
                                      {u.subscriptionStatus === 'active' ? (lang === 'ar' ? 'مشترك مدفوع' : 'Paid active') : 
                                       u.subscriptionStatus === 'trial' ? (lang === 'ar' ? 'نسخة تجريبية' : 'Free Trial') : 
                                       (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                                  </span>
                              </td>
                              <td className="py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                  {u.email || (lang === 'ar' ? 'غير محدد' : 'Not set')}
                              </td>
                              <td className="py-4">
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono">
                                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="font-bold">{u.totalTokensUsed?.toLocaleString() || 0}</span>
                                      <span className="text-[10px] text-zinc-400">tokens</span>
                                  </div>
                              </td>
                              <td className="py-4 text-xs font-mono text-zinc-400">
                                  {u.usageLimit ? `${u.usageLimit.toLocaleString()} tokens` : '5,000 tokens'}
                              </td>
                              <td className="py-4">
                                  <button 
                                      onClick={() => handleEditClick(u)}
                                      className="text-xs bg-[#00a884]/10 text-[#00a884] hover:bg-[#00a884]/20 border border-[#00a884]/15 px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1"
                                  >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>{lang === 'ar' ? 'إدارة ومتابعة العمل' : 'Manage & Track'}</span>
                                  </button>
                              </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-zinc-400 text-sm">
                            {lang === 'ar' ? 'لم يتم العثور على أي مستخدم بهذا البحث' : 'No users found matching your search query'}
                          </td>
                        </tr>
                      )}
                   </tbody>
               </table>
             </div>
          </div>
      )}
      
      {/* Logs Tab */}
      {activeTab === 'logs' && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="font-bold text-lg">{lang === 'ar' ? 'سجلات النظام والتشغيل الفوري' : 'System Logs'}</h2>
               <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-zinc-500 rounded-full font-mono">Real-time Node Agent</span>
             </div>
             <div className="bg-zinc-950 p-5 rounded-2xl font-mono text-xs text-zinc-300 h-96 overflow-y-auto space-y-2 border border-zinc-850 shadow-inner">
                 <p className="text-zinc-500">[{new Date().toLocaleTimeString()}] [SYSTEM_BOOT] Core application modules online.</p>
                 <p className="text-[#00a884]">[{new Date().toLocaleTimeString()}] [WHATSAPP_STARTUP] Multi-device session manager initialized successfully.</p>
                 <p className="text-amber-500">[{new Date().toLocaleTimeString()}] [DATABASE_SYNC] Local JSON store backed up and cached.</p>
                 <p className="text-indigo-400">[{new Date().toLocaleTimeString()}] [SECURITY_ALERT] JWT verification layer enabled for CRM endpoints.</p>
                 <p className="text-zinc-400">[{new Date().toLocaleTimeString()}] [ADMIN_LOGIN] Admin session refreshed from Superuser panel.</p>
             </div>
          </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 max-w-2xl">
             <h2 className="font-bold text-lg">{lang === 'ar' ? 'الإعدادات العامة للوحة الإدارة' : 'Settings'}</h2>
             <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-850/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                 <div>
                   <p className="font-bold text-sm">{lang === 'ar' ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}</p>
                   <p className="text-xs text-zinc-400 mt-0.5">{lang === 'ar' ? 'حظر دخول العملاء مؤقتاً لتحديث قواعد البيانات.' : 'Temporarily lock client interfaces during database updates.'}</p>
                 </div>
                 <input type="checkbox" className="w-5 h-5 accent-[#00a884]" />
             </div>
             <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-850/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                 <div>
                   <p className="font-bold text-sm">{lang === 'ar' ? 'معدل جلب البيانات تلقائياً (بالثواني)' : 'Data Sync Interval (seconds)'}</p>
                   <p className="text-xs text-zinc-400 mt-0.5">{lang === 'ar' ? 'تحديد فترة المزامنة للخلفية.' : 'Define sync rate for background status monitoring.'}</p>
                 </div>
                 <input type="number" defaultValue="60" className="p-2 rounded-xl border dark:border-zinc-850 bg-white dark:bg-zinc-900 text-center w-24 text-sm outline-none focus:border-[#00a884]/40" />
             </div>
             <button className="px-5 py-3 bg-[#00a884] hover:bg-[#008f6e] text-white rounded-xl font-bold text-xs transition-all cursor-pointer">
                 {lang === 'ar' ? 'حفظ إعدادات لوحة التحكم' : 'Save System Settings'}
             </button>
          </div>
      )}

      {activeTab === 'otp' && <OTPTesting lang={lang} />}

      {/* ADD USER DIALOG MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-3">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00a884]" />
                {lang === 'ar' ? 'إضافة مستخدم جديد للنظام' : 'Create New Client Account'}
              </h2>
              <button 
                onClick={() => setIsAddUserOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <AddUserForm closeModal={() => { setIsAddUserOpen(false); fetchReport(); }} lang={lang} />
          </div>
        </div>
      )}

      {/* COMPREHENSIVE EDIT & TRACKING MODAL (THE HEART OF MANAGEMENT) */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-4">
            
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00a884]/20 text-[#00a884] flex items-center justify-center text-lg font-black border border-[#00a884]/30 uppercase">
                  {editingUser.username.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-black flex items-center gap-1.5 text-white">
                    {lang === 'ar' ? 'إدارة ومتابعة العميل:' : 'Account Control & Tracking:'} {editingUser.username}
                  </h2>
                  <p className="text-[11px] text-zinc-400">ID: {editingUser.id} • Registered</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-xs text-zinc-300 transition-all cursor-pointer border border-zinc-700"
                >
                  {lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>
            </div>

            {/* Modal Sub-navigation Tabs */}
            <div className="bg-zinc-50 dark:bg-zinc-950 px-6 border-b border-zinc-100 dark:border-zinc-850 flex gap-2 shrink-0">
              <button
                onClick={() => setModalTab('info')}
                className={`py-3.5 px-4 font-black text-xs border-b-2 flex items-center gap-1.5 transition-all ${
                  modalTab === 'info' 
                    ? 'border-[#00a884] text-[#00a884]' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                {lang === 'ar' ? 'بيانات الاشتراك والتحكم' : 'Subscription & Parameters'}
              </button>
              <button
                onClick={() => setModalTab('activity')}
                className={`py-3.5 px-4 font-black text-xs border-b-2 flex items-center gap-1.5 transition-all ${
                  modalTab === 'activity' 
                    ? 'border-[#00a884] text-[#00a884]' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Activity className="w-4 h-4" />
                {lang === 'ar' ? 'تتبع نشاط المستخدم ومراقبة عمله' : 'Live Work & Activity Logs'}
                {userWorkData && (
                  <span className="bg-[#00a884] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {(userWorkData.devices?.length || 0) + (userWorkData.campaigns?.length || 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* TAB 1: EDIT SUBSCRIPTION INFO */}
              {modalTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left stats summary */}
                  <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-4">
                    <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'ملخص استهلاك الحساب' : 'Account Statistics'}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-bold block">{lang === 'ar' ? 'التوكنات' : 'AI Tokens'}</span>
                        <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 font-mono block mt-1">
                          {editingUser.totalTokensUsed?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-bold block">{lang === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</span>
                        <span className="text-sm font-extrabold text-[#00a884] font-mono block mt-1">
                          ${editingUser.costInDollars?.toFixed(4) || 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">{lang === 'ar' ? 'حالة التواجد' : 'Status'}</span>
                        <span className="font-bold flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${editingUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                          {editingUser.isOnline ? (lang === 'ar' ? 'متصل الآن' : 'Online') : (lang === 'ar' ? 'غير متصل' : 'Offline')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">{lang === 'ar' ? 'آخر ظهور' : 'Last Seen'}</span>
                        <span className="font-semibold text-zinc-500 font-mono">
                          {editingUser.lastSeenAt ? new Date(editingUser.lastSeenAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">{lang === 'ar' ? 'تاريخ نهاية الاشتراك' : 'Expiry Date'}</span>
                        <span className="font-bold text-amber-500 font-mono">
                          {editingUser.trialExpiresAt ? new Date(editingUser.trialExpiresAt).toLocaleDateString() : (lang === 'ar' ? 'غير محدد' : 'Not set')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                      <p className="text-[10px] text-zinc-400 font-bold">{lang === 'ar' ? 'الإجراءات الحساسة' : 'Dangerous Operations'}</p>
                      <button 
                        onClick={() => handleDeleteUser(editingUser.id)}
                        className="w-full py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'حذف حساب العميل نهائياً' : 'Delete Account Permanently'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right editing form inputs */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-[#00a884]" />
                      {lang === 'ar' ? 'تعديل البيانات وتحديث التراخيص' : 'Modify Parameters & Expiry'}
                    </h3>

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      </label>
                      <input 
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-800 focus:border-[#00a884] outline-none transition-all font-semibold"
                      />
                    </div>

                    {/* Change Password Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                      </label>
                      <input 
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder={lang === 'ar' ? 'اتركه فارغاً للحفاظ على كلمة المرور الحالية' : 'Leave empty to keep existing password'}
                        className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-800 focus:border-[#00a884] outline-none transition-all"
                      />
                    </div>

                    {/* Grid Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Subscription Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400">
                          {lang === 'ar' ? 'نوع باقة الاشتراك' : 'License Plan'}
                        </label>
                        <select 
                          value={editSubscriptionStatus}
                          onChange={(e: any) => setEditSubscriptionStatus(e.target.value)}
                          className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-800 focus:border-[#00a884] outline-none transition-all font-semibold"
                        >
                          <option value="active">{lang === 'ar' ? 'مشترك مدفوع (Active)' : 'Paid (Active)'}</option>
                          <option value="trial">{lang === 'ar' ? 'نسخة تجريبية (Trial)' : 'Free Trial (Trial)'}</option>
                          <option value="inactive">{lang === 'ar' ? 'حساب معطل (Inactive)' : 'Disabled (Inactive)'}</option>
                        </select>
                      </div>

                      {/* Subscription Duration */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'تمديد الصلاحية (بالأيام)' : 'Add Days to Plan'}
                        </label>
                        <input 
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          placeholder="e.g. 30"
                          className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-800 focus:border-[#00a884] outline-none transition-all font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {/* Usage Limit input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'الحد الأقصى لاستهلاك التوكنات' : 'Maximum AI Token Limit'}
                      </label>
                      <input 
                        type="number"
                        value={editUsageLimit}
                        onChange={(e) => setEditUsageLimit(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-800 focus:border-[#00a884] outline-none transition-all font-mono font-semibold"
                      />
                    </div>

                    {/* Alert Banner inside Modal */}
                    {saveSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{lang === 'ar' ? 'تم حفظ وتحديث التعديلات بنجاح فوري!' : 'Successfully saved all client adjustments!'}</span>
                      </div>
                    )}

                    {saveError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <button 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="w-full py-3 bg-[#00a884] hover:bg-[#008f6e] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#00a884]/15 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{lang === 'ar' ? 'يتم الحفظ والتطبيق...' : 'Applying configurations...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'حفظ وتطبيق التغييرات فورا' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DETAILED WORK & ACTIVITY MONITORING */}
              {modalTab === 'activity' && (
                <div className="space-y-6">
                  {loadingWork ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#00a884]" />
                      <span className="text-xs font-bold">{lang === 'ar' ? 'يتم جلب سجلات النشاط وتفاصيل العمل...' : 'Retrieving tenant work data & connections...'}</span>
                    </div>
                  ) : userWorkData ? (
                    <div className="space-y-6">
                      
                      {/* Work counters banner */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                        <div className="text-center p-2">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'أجهزة الواتساب المضافة' : 'WhatsApp Lines'}</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">{userWorkData.devices?.length || 0}</span>
                        </div>
                        <div className="text-center p-2 border-r border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'الحملات الإعلانية' : 'Campaigns Created'}</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">{userWorkData.campaigns?.length || 0}</span>
                        </div>
                        <div className="text-center p-2 border-r border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'إجمالي المحادثات' : 'Conversations'}</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">{userWorkData.conversationsCount || 0}</span>
                        </div>
                        <div className="text-center p-2 border-r border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">{lang === 'ar' ? 'الرسائل المرسلة' : 'Messages Handled'}</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">{userWorkData.messagesSentCount || 0}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Section 1: WhatsApp Connected Lines */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
                          <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-[#00a884]" />
                            {lang === 'ar' ? 'خطوط واتساب وأجهزة العميل' : 'User Connected WhatsApp Lines'}
                          </h4>
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {userWorkData.devices && userWorkData.devices.length > 0 ? (
                              userWorkData.devices.map((dev: any) => (
                                <div key={dev.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                                      {dev.name}
                                      <span className={`w-2.5 h-2.5 rounded-full ${dev.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono">ID: {dev.id}</div>
                                  </div>
                                  <div className="text-right space-y-0.5 font-mono text-[10px] text-zinc-500">
                                    <div>{dev.phoneNumber || 'N/A'}</div>
                                    <div>Method: {dev.method}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-xs py-8 text-zinc-400">
                                {lang === 'ar' ? 'لا يوجد أجهزة مربوطة لهذا المستخدم حتى الآن' : 'No WhatsApp devices paired yet'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Section 2: Broadcast Campaigns created */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
                          <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-[#00a884]" />
                            {lang === 'ar' ? 'حملات البث الإعلاني للعميل' : 'Broadcast Campaigns'}
                          </h4>
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {userWorkData.campaigns && userWorkData.campaigns.length > 0 ? (
                              userWorkData.campaigns.map((camp: any) => (
                                <div key={camp.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850 space-y-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-zinc-850 dark:text-zinc-100">{camp.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      camp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                      camp.status === 'sending' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {camp.status}
                                    </span>
                                  </div>
                                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#00a884] h-full" style={{ width: `${camp.progress || 0}%` }}></div>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                                    <span>Targets: {camp.targets?.length || 0} contacts</span>
                                    <span>Progress: {camp.progress || 0}%</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-xs py-8 text-zinc-400">
                                {lang === 'ar' ? 'لم يقم هذا المستخدم بإنشاء أي حملة بث حتى الآن' : 'No campaigns registered yet'}
                              </p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Section 3: Recent Message Feed Timeline */}
                      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
                        <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#00a884]" />
                          {lang === 'ar' ? 'سجل العمل ومراقبة الرسائل الأخيرة' : 'Live Client Activity Timeline & Outgoing Messages'}
                        </h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {userWorkData.recentMessages && userWorkData.recentMessages.length > 0 ? (
                            userWorkData.recentMessages.map((msg: any) => {
                              const isSent = msg.senderId === editingUser.id;
                              return (
                                <div key={msg.id} className={`p-3 rounded-2xl flex flex-col space-y-1 text-xs max-w-xl ${
                                  isSent ? 'bg-[#00a884]/5 border border-[#00a884]/10 mr-auto text-right' : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 ml-auto'
                                }`}>
                                  <div className="flex justify-between items-center gap-4 text-[10px] text-zinc-400">
                                    <span className="font-bold text-zinc-500">
                                      {isSent ? (lang === 'ar' ? 'العميل أرسل إلى:' : 'Client Sent To:') : (lang === 'ar' ? 'العميل استقبل من:' : 'Client Received From:')} {msg.recipientId || msg.senderId}
                                    </span>
                                    <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-zinc-800 dark:text-zinc-200 font-medium break-words leading-relaxed">{msg.content}</p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-xs py-10 text-zinc-400">
                              {lang === 'ar' ? 'لا يوجد رسائل أو أنشطة تشغيلية مسجلة بعد' : 'No communication records found'}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p className="text-center text-xs py-12 text-zinc-400">{lang === 'ar' ? 'فشل في تحميل سجلات العمل' : 'Failed to retrieve detailed logs'}</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end shrink-0">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق ومتابعة باقى النظام' : 'Dismiss'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Add User Sub-component
function AddUserForm({ closeModal, lang }: { closeModal: () => void, lang: 'ar' | 'en' }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSubscription, setNewSubscription] = useState('trial');
  const [newDuration, setNewDuration] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  return (
      <div className="space-y-4">
          {errorText && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
            <input 
                type="text" 
                placeholder="e.g. Mahmoud" 
                className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-850 focus:border-[#00a884] outline-none transition-all font-semibold"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input 
                type="email" 
                placeholder="mahmoud@example.com" 
                className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-850 focus:border-[#00a884] outline-none transition-all font-semibold"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
            <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-850 focus:border-[#00a884] outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{lang === 'ar' ? 'نوع الاشتراك' : 'Subscription'}</label>
              <select 
                  className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-850 focus:border-[#00a884] outline-none transition-all font-semibold"
                  value={newSubscription}
                  onChange={(e) => setNewSubscription(e.target.value)}
              >
                  <option value="active">{lang === 'ar' ? 'مشترك (Active)' : 'Active'}</option>
                  <option value="trial">{lang === 'ar' ? 'تجربة (Trial)' : 'Trial'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{lang === 'ar' ? 'المدة بالأيام' : 'Days'}</label>
              <input 
                  type="number" 
                  className="w-full p-3 text-sm rounded-xl border dark:bg-zinc-950 dark:border-zinc-850 focus:border-[#00a884] outline-none transition-all font-mono font-semibold"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
              />
            </div>
          </div>

          <button 
              disabled={isSaving}
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f6e] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#00a884]/15 cursor-pointer disabled:opacity-50"
              onClick={async () => {
                  if (!newUsername || !newPassword) {
                      setErrorText(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
                      return;
                  }
                  setIsSaving(true);
                  setErrorText('');
                  try {
                    const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          username: newUsername, 
                          password: newPassword, 
                          email: newEmail,
                          subscriptionStatus: newSubscription, 
                          duration: newDuration 
                        })
                    });
                    if (response.ok) {
                        alert(lang === 'ar' ? 'تم إنشاء حساب العميل بنجاح!' : 'User saved successfully');
                        closeModal();
                    } else {
                        const errorData = await response.json();
                        setErrorText(errorData.error || (lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving user'));
                    }
                  } catch (err: any) {
                    setErrorText(err.message || 'Error occurred');
                  } finally {
                    setIsSaving(false);
                  }
              }}
          >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'يتم الإنشاء...' : 'Creating client...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تأكيد الحفظ وإنشاء الحساب' : 'Create Account'}</span>
                </>
              )}
          </button>
      </div>
  );
}
