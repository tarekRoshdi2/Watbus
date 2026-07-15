import React, { useState, useEffect } from 'react';
import { User, GroupMember } from '../types.js';
import { Users, Loader2, Group as GroupIcon, Smartphone } from 'lucide-react';

interface GroupManagerProps {
  currentUser: User;
  devices: any[]; // Assuming device type or 'any' for now
  lang: 'ar' | 'en';
}

export default function GroupManager({ currentUser, devices, lang }: GroupManagerProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [groups, setGroups] = useState<{id: string, name: string}[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Fetch groups when a device is selected
  useEffect(() => {
    if (selectedDeviceId) {
        fetch(`/api/whatsapp/devices/${selectedDeviceId}/groups`)
            .then(res => res.json())
            .then(data => setGroups(data.groups || []))
            .catch(err => console.error(err));
    } else {
        setGroups([]);
    }
    setSelectedGroupId('');
    setMembers([]);
  }, [selectedDeviceId]);

  const fetchGroupMembers = async () => {
    if (!selectedGroupId || !selectedDeviceId) return;
    setIsExtracting(true);
    try {
      const response = await fetch(`/api/whatsapp/devices/${selectedDeviceId}/groups/${selectedGroupId}/members`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const exportToCsv = () => {
    const header = ["Name", "Number"];
    const rows = members.map(m => [m.name, m.number]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "group_members.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addToGroup = () => {
      // In a real implementation, this would open a modal to select a destination group
      // and then call an API to add the selected members.
      alert("Feature coming soon: This will allow adding selected members to another group of your choice.");
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        {lang === 'ar' ? 'سحب أعضاء الجروبات' : 'Group Member Extraction'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Selection */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <label className="block font-bold text-zinc-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'اختر الحساب المربوط' : 'Select Connected Account'}
              </label>
              <select 
                className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                  <option value="">{lang === 'ar' ? 'اختر حساباً...' : 'Select account...'}</option>
                  {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phoneNumber})</option>
                  ))}
              </select>
          </div>

          {/* Group Selection */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <label className="block font-bold text-zinc-700 dark:text-zinc-300">
                  {lang === 'ar' ? 'اختر الجروب' : 'Select Group'}
              </label>
              <select 
                className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={!selectedDeviceId}
              >
                  <option value="">{lang === 'ar' ? 'اختر جروباً...' : 'Select group...'}</option>
                  {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.memberCount} {lang === 'ar' ? 'عضواً' : 'members'})</option>
                  ))}
              </select>
          </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{lang === 'ar' ? 'أعضاء الجروب' : 'Group Members'}</h3>
          <div className="flex gap-2">
            <button
                onClick={addToGroup}
                disabled={members.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
                {lang === 'ar' ? 'إضافة لجروب' : 'Add to Group'}
            </button>
            <button
                onClick={exportToCsv}
                disabled={members.length === 0}
                className="bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-800 disabled:opacity-50"
            >
                {lang === 'ar' ? 'تصدير لإكسيل' : 'Export to Excel'}
            </button>
            <button
            onClick={fetchGroupMembers}
            disabled={isExtracting || !selectedGroupId}
            className="bg-[#00a884] text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
            {isExtracting ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar' ? 'جلب الأعضاء' : 'Fetch Members')}
          </button>
          </div>
        </div>
        
        {members.length > 0 ? (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <div className="flex-1 font-mono text-sm">
                  <p className="font-bold">{member.name}</p>
                  <p className="text-zinc-500">{member.number}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500">{lang === 'ar' ? 'حدد الجروب وانقر على جلب الأعضاء.' : 'Select group and click Fetch Members.'}</p>
        )}
      </div>
    </div>
  );
}
