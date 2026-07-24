import React, { useState, useEffect, useMemo } from 'react';
import { User, DeviceLink, Campaign } from '../types';
import { translations } from '../translations';
import {
  User as UserIcon,
  Users,
  Mail,
  Shield,
  Activity,
  Check,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  Phone,
  BarChart2,
  Calendar,
  Lock,
  AlertCircle,
  Database,
  Briefcase,
  Zap,
  Smartphone,
  Send,
  X,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sliders,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  currentUser: User | null;
  lang: 'ar' | 'en';
}

export default function ClientsPage({ currentUser, lang }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<DeviceLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Detail views and dialogs state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userWorkDetails, setUserWorkDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

    // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'user'>('user');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive' | 'trial'>('trial');
  const [formUsageLimit, setFormUsageLimit] = useState(10000);
  const [formPassword, setFormPassword] = useState('');
  const [formDurationDays, setFormDurationDays] = useState(30);

  const t = translations[lang];

  // Load all system data
  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, devicesRes, campaignsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/devices', { headers: { 'x-user-id': currentUser?.id || '' } }),
        fetch('/api/campaigns', { headers: { 'x-user-id': currentUser?.id || '' } })
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        // Filter out bot user 'meta-ai' and temp WhatsApp contacts
        const systemUsers = (uData.users || []).filter(
          (u: User) => u.id !== 'meta-ai' && !u.id.startsWith('contact_')
        );
        setUsers(systemUsers);
      }

      if (devicesRes.ok) {
        const dData = await devicesRes.json();
        setDevices(dData.devices || []);
      }

      if (campaignsRes.ok) {
        const cData = await campaignsRes.json();
        setCampaigns(cData.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load system management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, [currentUser]);

  // Fetch detailed work and consumption statistics from the API when selecting a user
  useEffect(() => {
    if (selectedUserId) {
      setDetailsLoading(true);
      fetch(`/api/admin/users/${selectedUserId}/work`)
        .then(res => res.json())
        .then(data => {
          setUserWorkDetails(data);
        })
        .catch(err => console.error('Failed to load user work details:', err))
        .finally(() => setDetailsLoading(false));
    } else {
      setUserWorkDetails(null);
    }
  }, [selectedUserId, users]);

  // Open Edit User Modal
  const handleOpenEdit = (user: User) => {
    setIsEditingUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormPhoneNumber(user.phoneNumber || '');
    setFormRole(user.role);
    setFormStatus(user.subscriptionStatus);
    setFormUsageLimit(user.usageLimit || 10000);
    setFormPassword('');
    setFormDurationDays(30);
    setFormError(null);
    setFormSuccess(null);
  };

  // Open Create User Modal
  const handleOpenCreate = () => {
    setIsCreatingUser(true);
    setFormUsername('');
    setFormEmail('');
    setFormPhoneNumber('');
    setFormRole('user');
    setFormStatus('trial');
    setFormUsageLimit(10000);
    setFormPassword('');
    setFormDurationDays(30);
    setFormError(null);
    setFormSuccess(null);
  };

  // Save/Create User Action
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim()) {
      setFormError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم الكريم.' : 'Please enter username.');
      return;
    }

    setActionLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (isEditingUser) {
        // Edit User PUT Request
        const res = await fetch(`/api/admin/users/${isEditingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            email: formEmail,
            phoneNumber: formPhoneNumber,
            role: formRole,
            subscriptionStatus: formStatus,
            usageLimit: formUsageLimit,
            password: formPassword || undefined,
            duration: formDurationDays.toString()
          })
        });

        if (res.ok) {
          setFormSuccess(lang === 'ar' ? 'تم حفظ وتحديث بيانات المشترك بنجاح!' : 'User settings updated successfully!');
          setTimeout(() => {
            setIsEditingUser(null);
            loadSystemData();
          }, 1500);
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || (lang === 'ar' ? 'فشل حفظ التعديلات.' : 'Failed to update user.'));
        }
      } else {
        // Create User POST Request
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            password: formPassword || 'User@2026',
            subscriptionStatus: formStatus,
            duration: formDurationDays.toString(),
            phoneNumber: formPhoneNumber
          })
        });

        if (res.ok) {
          const data = await res.json();
          // Immediately apply other properties like email and limit via PUT to make it professional
          await fetch(`/api/admin/users/${data.user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formEmail,
              role: formRole,
              usageLimit: formUsageLimit,
              phoneNumber: formPhoneNumber
            })
          });

          setFormSuccess(lang === 'ar' ? 'تم إنشاء حساب المشترك الجديد وتفعيله!' : 'New subscriber account created successfully!');
          setTimeout(() => {
            setIsCreatingUser(false);
            loadSystemData();
          }, 1500);
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || (lang === 'ar' ? 'فشل إنشاء المشترك الجديد.' : 'Failed to create user.'));
        }
      }
    } catch (err) {
      console.error('Error saving user data:', err);
      setFormError(lang === 'ar' ? 'خطأ فني في الاتصال بالخادم.' : 'Technical error communicating with server.');
    } finally {
      setActionLoading(false);
    }
  };

  // Adjust / Refill client limits directly
  const handleQuickRefill = async (userId: string, amount: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const currentLimit = user.usageLimit || 10000;
    const newLimit = currentLimit + amount;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageLimit: newLimit
        })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, usageLimit: newLimit } : u));
      }
    } catch (err) {
      console.error('Failed to quick refill limit:', err);
    }
  };

  // Simulate client consumption (for developer presentation & sandbox testing)
  const handleSimulateConsumption = async (userId: string, amount: number, isReset: boolean = false) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentUsed = user.totalTokensUsed || 0;
    const currentCost = user.costInDollars || 0;
    
    const newUsed = isReset ? 0 : Math.max(0, currentUsed + amount);
    // Cost: $0.005 per message
    const newCost = isReset ? 0 : parseFloat((currentCost + (amount * 0.005)).toFixed(2));

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalTokensUsed: newUsed,
          costInDollars: newCost
        })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, totalTokensUsed: newUsed, costInDollars: newCost } : u));
      }
    } catch (err) {
      console.error('Failed to simulate consumption:', err);
    }
  };

  // Quick Switch Status directly from sidebar controls
  const handleQuickSwitchStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'trial') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionStatus: newStatus
        })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: newStatus } : u));
      }
    } catch (err) {
      console.error('Failed to switch user status:', err);
    }
  };

  // Delete User Action
  const handleDeleteUser = async (userId: string, name: string) => {
    const confirmMsg = lang === 'ar' 
      ? `هل أنت متأكد تماماً من حذف حساب المشترك "${name}" وكل الأجهزة التابعة له؟`
      : `Are you sure you want to permanently delete subscriber account "${name}" and all associated devices?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedUserId === userId) setSelectedUserId(null);
        loadSystemData();
      } else {
        alert(lang === 'ar' ? 'فشل حذف الحساب من خادم النظام.' : 'Failed to delete account.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Filtered subscribers list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.id.includes(searchQuery);

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.subscriptionStatus === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Selected User complete stats (Fallback state while API loads)
  const activeUserStats = useMemo(() => {
    if (!selectedUserId) return null;
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return null;

    const userDevices = devices.filter((d) => d.ownerId === user.id);
    const userCampaigns = campaigns.filter((c) => c.ownerId === user.id);

    return {
      user,
      devices: userDevices,
      campaigns: userCampaigns,
      connectedDevicesCount: userDevices.filter((d) => d.status === 'connected').length,
      totalCampaignsCount: userCampaigns.length
    };
  }, [selectedUserId, users, devices, campaigns]);

  // Overall Statistics Cards
  const statsOverview = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.subscriptionStatus === 'active').length;
    const trial = users.filter((u) => u.subscriptionStatus === 'trial').length;
    const connectedDevices = devices.filter((d) => d.status === 'connected').length;

    return { total, active, trial, connectedDevices };
  }, [users, devices]);

  return (
    <div id="clients-subscribers-management" className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 overflow-y-auto space-y-8 text-right relative">
      <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.012] dark:opacity-[0.005] pointer-events-none" />

      {/* ACTION BLOCK: EXTREMELY PROMINENT GREEN ADD SUBSCRIBER BAR */}
      <div className="relative z-10">
        <button
          onClick={handleOpenCreate}
          className="w-full py-4 px-6 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg hover:shadow-xl group font-extrabold text-sm md:text-base relative overflow-hidden"
        >
          <Plus className="w-5 h-5" />
          <span>
            {lang === 'ar' ? 'إضافة وإنشاء حساب مشترك جديد بالمنظومة ⚡' : 'Create & Provision New Subscriber Account ⚡'}
          </span>
        </button>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-900 pb-6 relative z-10">
        <div className="space-y-1.5 order-2 md:order-1 text-right w-full">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
              <Shield className="w-3 h-3" />
              <span>{lang === 'ar' ? 'إدارة لوحة التحكم وصلاحيات النظام' : 'System Administration Access'}</span>
            </span>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">
              {lang === 'ar' ? 'صفحة إدارة الموظفين وفريق العمل والحسابات' : 'Employees & Staff Roster Directory'}
            </h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-2xl ml-auto">
            {lang === 'ar'
              ? 'متابعة أداء المشتركين الفعليين بالسيستم، تعديل باقاتهم، تتبع استهلاك الميزات، مراقبة أجهزتهم وحملاتهم التسويقية لضمان التشغيل بكفاءة.'
              : 'Track and monitor active system subscribers, edit their parameters, assign limits, review connected lines, and trace bulk campaigns.'}
          </p>
        </div>
      </div>

      {/* SYSTEM METRICS SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Total Accounts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:scale-[1.02] transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">{lang === 'ar' ? 'إجمالي الحسابات' : 'Total Subscribers'}</span>
            <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">{statsOverview.total}</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:scale-[1.02] transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">{lang === 'ar' ? 'الاشتراكات النشطة' : 'Active Accounts'}</span>
            <span className="text-lg font-black text-emerald-500">{statsOverview.active}</span>
          </div>
        </div>

        {/* Free Trials */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:scale-[1.02] transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">{lang === 'ar' ? 'فترات تجريبية' : 'Trial Accounts'}</span>
            <span className="text-lg font-black text-amber-500">{statsOverview.trial}</span>
          </div>
        </div>

        {/* Linked Devices */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:scale-[1.02] transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">{lang === 'ar' ? 'قنوات الواتساب المتصلة' : 'Connected WhatsApps'}</span>
            <span className="text-lg font-black text-teal-500">{statsOverview.connectedDevices}</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between relative z-10 shadow-xs">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end order-2 md:order-1">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 outline-hidden text-right"
          >
            <option value="all">{lang === 'ar' ? 'كل حالات الاشتراك' : 'All Subscription States'}</option>
            <option value="active">{lang === 'ar' ? 'نشط / باقة مدفوعة' : 'Active (Paid)'}</option>
            <option value="trial">{lang === 'ar' ? 'تجريبي مجاني' : 'Free Trial'}</option>
            <option value="inactive">{lang === 'ar' ? 'غير نشط / منتهي' : 'Inactive (Expired)'}</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 outline-hidden text-right"
          >
            <option value="all">{lang === 'ar' ? 'كل الرتب والصلاحيات' : 'All Roles'}</option>
            <option value="admin">{lang === 'ar' ? 'المدراء (Admin)' : 'Administrators'}</option>
            <option value="user">{lang === 'ar' ? 'المستخدمون العاديون' : 'Standard Users'}</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 order-1 md:order-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن مشترك بالاسم أو البريد...' : 'Search by subscriber name/email...'}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs outline-hidden focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] text-right font-sans"
          />
        </div>
      </div>

      {/* DUAL COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-start">
        
        {/* LIST COLUMN */}
        <div className={`${selectedUserId ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold">{lang === 'ar' ? 'جاري تحميل بيانات المشتركين...' : 'Loading subscribers data...'}</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-zinc-300" />
                <span className="text-xs font-bold">{lang === 'ar' ? 'لا يوجد مشتركين مطابقين للتصفية.' : 'No subscribers match the current filter.'}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-zinc-850 text-zinc-400 font-extrabold select-none">
                      <th className="p-4">{lang === 'ar' ? 'المشترك' : 'Subscriber'}</th>
                      <th className="p-4">{lang === 'ar' ? 'الصلاحية والنوع' : 'Access Role'}</th>
                      <th className="p-4">{lang === 'ar' ? 'حالة الاشتراك' : 'Subscription Status'}</th>
                      <th className="p-4">{lang === 'ar' ? 'الأجهزة المتصلة' : 'WhatsApp Channels'}</th>
                      <th className="p-4">{lang === 'ar' ? 'معدل الاستهلاك وباقة الرسايل' : 'API Consumption'}</th>
                      <th className="p-4 text-left">{lang === 'ar' ? 'التحكم والعمليات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {filteredUsers.map((user) => {
                      const userDevices = devices.filter((d) => d.ownerId === user.id);
                      const activeLines = userDevices.filter((d) => d.status === 'connected').length;
                      const limit = user.usageLimit || 10000;
                      const progress = Math.min(100, Math.round(((user.totalTokensUsed || 0) / limit) * 100));

                      return (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/40 transition-all cursor-pointer ${
                            selectedUserId === user.id ? 'bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01]' : ''
                          }`}
                        >
                          {/* User details */}
                          <td className="p-4">
                            <div className="flex items-center gap-3 justify-end">
                              <div className="text-right">
                                <h4 className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 justify-end">
                                  {user.isOnline ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-zinc-300" title="Offline" />
                                  )}
                                  <span>{user.username}</span>
                                </h4>
                                <span className="text-[10px] text-zinc-400 block font-mono mt-0.5">{user.email || '—'}</span>
                                {user.phoneNumber && (
                                  <span className="text-[10px] text-[#00a884] dark:text-[#00c298] font-bold font-mono block mt-1 bg-[#00a884]/5 dark:bg-[#00a884]/10 px-1.5 py-0.5 rounded-md inline-block">
                                    📱 {user.phoneNumber}
                                  </span>
                                )}
                              </div>
                              <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                              />
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 leading-none ${
                              user.role === 'admin'
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-500/15'
                                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15'
                            }`}>
                              <Shield className="w-3 h-3" />
                              <span>{user.role === 'admin' ? (lang === 'ar' ? 'مدير نظام' : 'Admin') : (lang === 'ar' ? 'مشترك / مستخدم' : 'User')}</span>
                            </span>
                          </td>

                          {/* Subscription status */}
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 leading-none ${
                              user.subscriptionStatus === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                                : user.subscriptionStatus === 'trial'
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/15'
                                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-500/15'
                            }`}>
                              <span>
                                {user.subscriptionStatus === 'active' 
                                  ? (lang === 'ar' ? 'باقة مدفوعة' : 'Active Paid') 
                                  : user.subscriptionStatus === 'trial' 
                                  ? (lang === 'ar' ? 'فترة تجريبية' : 'Free Trial') 
                                  : (lang === 'ar' ? 'منتهي / ملغي' : 'Expired')}
                              </span>
                            </span>
                            {user.trialExpiresAt && (
                              <span className="text-[9px] text-zinc-400 block font-mono mt-1">
                                {new Date(user.trialExpiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>

                          {/* Connected Devices */}
                          <td className="p-4">
                            <div className="flex items-center gap-1 justify-end font-bold text-zinc-700 dark:text-zinc-300">
                              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{activeLines} / {userDevices.length} {lang === 'ar' ? 'أجهزة' : 'devices'}</span>
                            </div>
                          </td>

                          {/* Message consumption with Alert Badges & Refills */}
                          <td className="p-4">
                            <div className="space-y-1.5 w-44 inline-block text-right">
                              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                  {progress >= 100 ? (
                                    <span className="inline-flex items-center text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded text-[8px] font-black border border-rose-500/20">
                                      {lang === 'ar' ? '🔴 تم النفاد' : 'Exhausted'}
                                    </span>
                                  ) : progress >= 80 ? (
                                    <span className="inline-flex items-center text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded text-[8px] font-black border border-amber-500/20 animate-pulse">
                                      {lang === 'ar' ? '⚠️ شارف على الانتهاء' : 'Near Limit'}
                                    </span>
                                  ) : null}
                                  <span className="font-mono text-[9px] text-zinc-400">({progress}%)</span>
                                </div>
                                <span className="font-mono text-[9px] text-zinc-800 dark:text-zinc-200">
                                  {user.totalTokensUsed || 0} / {limit}
                                </span>
                              </div>
                              
                              {/* Progress bar line */}
                              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progress >= 95 
                                      ? 'bg-gradient-to-l from-red-600 to-rose-500' 
                                      : progress >= 80 
                                      ? 'bg-gradient-to-l from-amber-500 to-yellow-400' 
                                      : 'bg-gradient-to-l from-emerald-500 to-teal-400'
                                  }`} 
                                  style={{ width: `${progress}%` }} 
                                />
                              </div>

                              {/* Interactive Quick Actions on Consumption */}
                              <div className="flex items-center justify-between text-[9px] pt-1">
                                <span className="text-zinc-400 font-bold block flex items-center gap-0.5 font-mono">
                                  <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>${parseFloat((user.costInDollars || 0).toString()).toFixed(2)}</span>
                                </span>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => handleQuickRefill(user.id, 5000, e)}
                                    className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded text-[8px] font-black transition-all border border-indigo-200/50"
                                    title={lang === 'ar' ? 'زيادة سعة الباقة بمقدار +5,000 رسالة فورا' : 'Add +5,000 capacity'}
                                  >
                                    +5K {lang === 'ar' ? 'سعة' : 'cap'}
                                  </button>
                                  <button
                                    onClick={(e) => handleQuickRefill(user.id, 10000, e)}
                                    className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded text-[8px] font-black transition-all border border-emerald-200/50"
                                    title={lang === 'ar' ? 'زيادة سعة الباقة بمقدار +10,000 رسالة فورا' : 'Add +10,000 capacity'}
                                  >
                                    +10K {lang === 'ar' ? 'سعة' : 'cap'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Action controls */}
                          <td className="p-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-start">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer border border-zinc-200/40 dark:border-zinc-700"
                                title={lang === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account Details'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-500/15"
                                  title={lang === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Account'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS SIDEBAR: HERO COCKPIT FOR DYNAMIC CONSUMPTION ANALYSIS */}
        <AnimatePresence>
          {selectedUserId && activeUserStats && (
            <motion.div
              initial={{ opacity: 0, x: lang === 'ar' ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === 'ar' ? -40 : 40 }}
              className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/85 rounded-3xl p-5 space-y-6 shadow-md text-right relative overflow-y-auto max-h-[85vh] custom-scrollbar"
            >
              {/* Header inside Sidebar Details */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3 relative z-10">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
                  title={lang === 'ar' ? 'إغلاق التفاصيل' : 'Close Details'}
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'لوحة تتبع وتحليل الاستهلاك' : 'Billing & Usage Cockpit'}</span>
                  <Activity className="w-4 h-4 text-[#00a884] animate-pulse" />
                </h3>
              </div>

              {/* User overview block */}
              <div className="flex flex-col items-center justify-center text-center space-y-2 relative z-10 pt-2">
                <div className="relative">
                  <img
                    src={activeUserStats.user.avatarUrl}
                    alt={activeUserStats.user.username}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-[#00a884]/20 shadow-sm"
                  />
                  {activeUserStats.user.isOnline ? (
                    <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
                  ) : (
                    <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-zinc-300 border-2 border-white dark:border-zinc-900" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-base text-zinc-800 dark:text-zinc-100">
                    {activeUserStats.user.username}
                  </h4>
                  <span className="text-[10px] text-zinc-400 block font-mono">{activeUserStats.user.email || '—'}</span>
                  {activeUserStats.user.phoneNumber && (
                    <span className="text-xs font-black text-[#00a884] dark:text-[#00c298] block mt-1 bg-[#00a884]/5 dark:bg-[#00a884]/10 px-2 py-0.5 rounded-lg inline-block font-mono">
                      📱 {activeUserStats.user.phoneNumber}
                    </span>
                  )}
                  <p className="text-[11px] text-zinc-500 italic mt-1 font-mono">
                    "{activeUserStats.user.statusText || 'No custom status set.'}"
                  </p>
                </div>
              </div>

              {/* BENTO CARD 1: LIVE CONSUMPTION GAUGE & REMAINING MESSAGES */}
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-950 dark:to-zinc-900 p-4 rounded-2xl border border-zinc-250/60 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full font-black">
                    {lang === 'ar' ? 'عداد الاستهلاك' : 'Meter Gauge'}
                  </span>
                  <h5 className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <span>{lang === 'ar' ? 'معدل استهلاك الباقة' : 'Package Consumption'}</span>
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  </h5>
                </div>

                {detailsLoading ? (
                  <div className="h-28 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    {/* Visual Mini Radial Indicator */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-200 dark:text-zinc-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#00a884]"
                          strokeWidth="3.5"
                          strokeDasharray={`${Math.min(100, Math.round(((activeUserStats.user.totalTokensUsed || 0) / (activeUserStats.user.usageLimit || 10000)) * 100))}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 font-mono">
                          {Math.min(100, Math.round(((activeUserStats.user.totalTokensUsed || 0) / (activeUserStats.user.usageLimit || 10000)) * 100))}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold">{lang === 'ar' ? 'الرسائل المستهلكة:' : 'Consumed Messages:'}</div>
                      <div className="text-base font-black font-mono text-zinc-800 dark:text-zinc-100">
                        {activeUserStats.user.totalTokensUsed || 0}
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {lang === 'ar' ? 'المتبقي بالرصيد:' : 'Remaining credit:'}{' '}
                        <span className="font-mono font-bold text-emerald-500">
                          {Math.max(0, (activeUserStats.user.usageLimit || 10000) - (activeUserStats.user.totalTokensUsed || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BENTO CARD 2: REAL COST TRACKER & REVENUE METRICS */}
              <div className="bg-gradient-to-br from-amber-500/[0.02] to-amber-500/[0.06] p-4 rounded-2xl border border-amber-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-black">
                    {lang === 'ar' ? 'التحصيل والفواتير' : 'Billing ROI'}
                  </span>
                  <h5 className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <span>{lang === 'ar' ? 'تكلفة الاستهلاك اللحظية' : 'Estimated Accrued Cost'}</span>
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                  </h5>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    {lang === 'ar' ? 'مبني على تسعير ($0.005)' : 'Based on $0.005/msg'}
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    ${parseFloat((activeUserStats.user.costInDollars || 0).toString()).toFixed(2)}
                  </div>
                </div>

                {/* Simulated subscription tier progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold text-zinc-400">
                    <span>VIP</span>
                    <span>{lang === 'ar' ? 'باقة ذهبية' : 'Gold'}</span>
                    <span>{lang === 'ar' ? 'مبتدئ' : 'Basic'}</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round(((activeUserStats.user.costInDollars || 0) / 150) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* BENTO CARD 3: INTERACTIVE CONSUMPTION TENSION REGULATOR & SANDBOX SIMULATOR */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-950 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-black">
                    {lang === 'ar' ? 'لوحة تحكم للمطور' : 'Sandbox Console'}
                  </span>
                  <h5 className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                    <span>{lang === 'ar' ? 'التحكم الفوري ومحاكاة الاستهلاك' : 'Tuning & Simulator Tools'}</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </h5>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                  {lang === 'ar' 
                    ? 'هذه الأدوات تتيح لك تجربة محاكاة الاستهلاك، زيادة السعة، وتغيير حالات الباقات لحظياً لاختبار سلوك النظام والإنذارات الملونة:' 
                    : 'Use the controls below to simulate outbound API message volumes, extend package limits, or toggle subscription status on the fly:'}
                </p>

                {/* Adjust Limit Refills */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-zinc-400 text-right">{lang === 'ar' ? 'أضف رصيد رسائل فوري:' : 'Instant Limit Adjuster:'}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleQuickRefill(activeUserStats.user.id, 1000)}
                      className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all"
                    >
                      +1,000
                    </button>
                    <button
                      onClick={() => handleQuickRefill(activeUserStats.user.id, 5000)}
                      className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all"
                    >
                      +5,000
                    </button>
                    <button
                      onClick={() => handleQuickRefill(activeUserStats.user.id, 25000)}
                      className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all"
                    >
                      +25,000
                    </button>
                  </div>
                </div>

                {/* Simulate Consumption Outbound */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-zinc-400 text-right">{lang === 'ar' ? 'محاكاة إرسال تذاكر ورسائل (استهلاك):' : 'Simulate Outbound Deliveries:'}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleSimulateConsumption(activeUserStats.user.id, 500)}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <span>+500</span>
                      <Zap className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleSimulateConsumption(activeUserStats.user.id, 2000)}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <span>+2,000</span>
                      <Zap className="w-2.5 h-2.5 animate-bounce" />
                    </button>
                    <button
                      onClick={() => handleSimulateConsumption(activeUserStats.user.id, 0, true)}
                      className="py-1.5 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>{lang === 'ar' ? 'تصفير' : 'Reset'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Status Switches */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-zinc-400 text-right">{lang === 'ar' ? 'تغيير نوع باقة العضوية فورا:' : 'Switch Subscription Plan:'}</div>
                  <div className="grid grid-cols-3 gap-1.5 text-[9px] font-black">
                    <button
                      onClick={() => handleQuickSwitchStatus(activeUserStats.user.id, 'active')}
                      className={`py-1 rounded-lg transition-all cursor-pointer border ${activeUserStats.user.subscriptionStatus === 'active' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}
                    >
                      {lang === 'ar' ? 'مدفوعة' : 'Paid'}
                    </button>
                    <button
                      onClick={() => handleQuickSwitchStatus(activeUserStats.user.id, 'trial')}
                      className={`py-1 rounded-lg transition-all cursor-pointer border ${activeUserStats.user.subscriptionStatus === 'trial' ? 'bg-amber-500/15 border-amber-500 text-amber-600' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}
                    >
                      {lang === 'ar' ? 'تجريبية' : 'Trial'}
                    </button>
                    <button
                      onClick={() => handleQuickSwitchStatus(activeUserStats.user.id, 'inactive')}
                      className={`py-1 rounded-lg transition-all cursor-pointer border ${activeUserStats.user.subscriptionStatus === 'inactive' ? 'bg-rose-500/15 border-rose-500 text-rose-600' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}
                    >
                      {lang === 'ar' ? 'منتهية' : 'Expired'}
                    </button>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 4: ACTIVE DEVICES */}
              <div className="space-y-2 relative z-10">
                <h5 className="text-[10px] font-black text-[#00a884] uppercase tracking-wider flex items-center gap-1 justify-end">
                  <span>{lang === 'ar' ? 'قنوات وأرقام الواتساب النشطة بالعميل:' : 'WhatsApp Lines Connected:'}</span>
                  <Smartphone className="w-3.5 h-3.5" />
                </h5>

                {activeUserStats.devices.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 text-center py-2 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    {lang === 'ar' ? 'لم يقم هذا المشترك بربط أية أرقام بعد.' : 'No WhatsApp lines linked yet.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {activeUserStats.devices.map((device) => (
                      <div 
                        key={device.id} 
                        className="p-2 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-right"
                      >
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-extrabold ${
                          device.status === 'connected' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {device.status === 'connected' ? (lang === 'ar' ? 'متصل' : 'Connected') : (lang === 'ar' ? 'غير متصل' : 'Offline')}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-bold block text-zinc-700 dark:text-zinc-200">{device.name}</span>
                          <span className="text-[9px] text-zinc-400 block font-mono">{device.phoneNumber || 'Simulation Line'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BENTO CARD 5: RECENT WORK HANDSHAKES & MESSAGES */}
              <div className="space-y-2 relative z-10">
                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                  <span>{lang === 'ar' ? 'سجل العمليات والرسائل الأخير:' : 'Recent Handshake Logs:'}</span>
                  <Database className="w-3.5 h-3.5" />
                </h5>

                {detailsLoading ? (
                  <div className="p-4 text-center">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : !userWorkDetails || !userWorkDetails.recentMessages || userWorkDetails.recentMessages.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 text-center py-2 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    {lang === 'ar' ? 'لا يوجد سجل رسائل نشط لهذا المشترك.' : 'No communication history found.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                    {userWorkDetails.recentMessages.map((msg: any) => (
                      <div 
                        key={msg.id} 
                        className="p-2 bg-zinc-50 dark:bg-zinc-950/30 rounded-lg border border-zinc-100 dark:border-zinc-850/80 text-right space-y-1"
                      >
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-[8px] text-zinc-400 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                            {msg.senderId === selectedUserId ? (lang === 'ar' ? '📤 صادر' : '📤 Out') : (lang === 'ar' ? '📥 وارد' : '📥 In')}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-700 dark:text-zinc-300 font-mono break-words leading-relaxed line-clamp-2">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SYSTEM INFORMATION AND DATES */}
              <div className="space-y-2 relative z-10 border-t border-zinc-150 dark:border-zinc-850 pt-3 text-[10px] text-zinc-400 space-y-1.5 font-sans">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {activeUserStats.user.lastSeenAt ? new Date(activeUserStats.user.lastSeenAt).toLocaleString() : '—'}
                  </span>
                  <span className="font-bold">{lang === 'ar' ? 'آخر تواجد نشط بالسيستم:' : 'Last Seen Presence:'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {activeUserStats.user.trialExpiresAt ? new Date(activeUserStats.user.trialExpiresAt).toLocaleDateString() : '—'}
                  </span>
                  <span className="font-bold">{lang === 'ar' ? 'تاريخ انتهاء الاشتراك:' : 'Subscription Expiry:'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-indigo-500 font-bold">{activeUserStats.user.id}</span>
                  <span className="font-bold">{lang === 'ar' ? 'الرمز التعريفي للمشترك:' : 'Subscriber Account ID:'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CREATE / EDIT ACCOUNT DIALOG MODAL */}
      <AnimatePresence>
        {(isCreatingUser || isEditingUser) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-right"
            >
              <button
                onClick={() => {
                  setIsEditingUser(null);
                  setIsCreatingUser(false);
                }}
                className="absolute top-4 left-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 justify-end border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  {isEditingUser 
                    ? (lang === 'ar' ? 'تعديل بيانات الحساب والاشتراك' : 'Edit Subscriber Parameters') 
                    : (lang === 'ar' ? 'إضافة حساب مشترك جديد للسيستم' : 'Create System Account')}
                </h3>
                <UserIcon className="w-5 h-5 text-[#00a884]" />
              </div>

              {formError && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 justify-end">
                  <span>{formError}</span>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                </div>
              )}
              {formSuccess && (
                <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 justify-end">
                  <span>{formSuccess}</span>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-zinc-500">{lang === 'ar' ? 'الاسم الكريم بالكامل:' : 'Full Name:'}</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    required
                    placeholder={lang === 'ar' ? 'مثال: أستاذ طارق رشدي' : 'e.g. Tarek Roshdi'}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-sans"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-zinc-500">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-sans"
                  />
                </div>

                {/* WhatsApp Phone Number */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-zinc-500">
                    {lang === 'ar' ? 'رقم الواتساب الرئيسي للربط والإرسال:' : 'Primary WhatsApp Number (for sending and linking):'}
                  </label>
                  <input
                    type="text"
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: 201234567890' : 'e.g. 201234567890'}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {lang === 'ar' 
                      ? 'رقم الواتساب الأساسي المسجل للمشترك لإرسال التذاكر وتلقي الإشعارات.' 
                      : 'The primary WhatsApp number used to send tickets and handle integrations.'}
                  </p>
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-zinc-500">{lang === 'ar' ? 'صلاحيات الحساب:' : 'Account Role:'}</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right"
                    >
                      <option value="user">{lang === 'ar' ? 'مشترك (User)' : 'Standard User'}</option>
                      <option value="admin">{lang === 'ar' ? 'مدير نظام (Admin)' : 'Administrator'}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-zinc-500">{lang === 'ar' ? 'حالة الاشتراك:' : 'Subscription:'}</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right"
                    >
                      <option value="active">{lang === 'ar' ? 'نشط / باقة مدفوعة' : 'Active (Paid)'}</option>
                      <option value="trial">{lang === 'ar' ? 'تجريبي مجاني' : 'Free Trial'}</option>
                      <option value="inactive">{lang === 'ar' ? 'غير نشط / منتهي' : 'Inactive (Expired)'}</option>
                    </select>
                  </div>
                </div>

                {/* Limits & Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-zinc-500">{lang === 'ar' ? 'الحد الأقصى للرسايل:' : 'Message Limit:'}</label>
                    <input
                      type="number"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-zinc-500">
                      {isEditingUser 
                        ? (lang === 'ar' ? 'تحديث كلمة المرور:' : 'New Password:') 
                        : (lang === 'ar' ? 'تعيين كلمة المرور:' : 'Password:')}
                    </label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={isEditingUser ? (lang === 'ar' ? 'اتركه فارغاً للإبقاء عليها' : 'Leave empty to keep') : 'Tarek@2026'}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-sans"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-zinc-500">
                    {lang === 'ar' ? 'مدة التفعيل أو التمديد بالباقة (أيام):' : 'Subscription Duration (Days):'}
                  </label>
                  <input
                    type="number"
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-[#00a884] text-right font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {lang === 'ar' 
                      ? 'سيقوم النظام باحتساب تاريخ انتهاء الاشتراك آلياً وإضافته لحساب العميل.' 
                      : 'The system will automatically calculate and update the absolute expiration timestamp.'}
                  </p>
                </div>

                {/* Submit actions */}
                <div className="flex items-center gap-2.5 justify-start pt-4 border-t border-zinc-100 dark:border-zinc-850">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md disabled:opacity-50"
                  >
                    {actionLoading 
                      ? (lang === 'ar' ? 'جاري الحفظ والربط...' : 'Saving parameters...') 
                      : (lang === 'ar' ? 'حفظ البيانات آلياً ⚡' : 'Save Details ⚡')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUser(null);
                      setIsCreatingUser(false);
                    }}
                    className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
