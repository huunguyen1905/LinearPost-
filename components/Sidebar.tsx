
import React from 'react';
import { PenTool, Calendar, Settings, LogOut, Command, Globe } from 'lucide-react';

interface SidebarProps {
  currentView: 'create' | 'schedule' | 'settings' | 'web';
  setCurrentView: (view: 'create' | 'schedule' | 'settings' | 'web') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'create', icon: PenTool, label: 'Tạo mới' },
    { id: 'schedule', icon: Calendar, label: 'Lịch đăng' },
    { id: 'web', icon: Globe, label: 'Đăng Web' }, // NEW ITEM
    { id: 'settings', icon: Settings, label: 'Cài đặt' }, 
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on lg+) */}
      <div className="hidden lg:flex w-[88px] h-full flex-col items-center py-6 z-50 bg-[#1c1c1e]/40 backdrop-blur-2xl border-r border-white/[0.05]">
        {/* App Logo */}
        <div 
          onClick={() => setCurrentView('create')}
          className="w-12 h-12 rounded-[14px] bg-gradient-to-b from-[#323232] to-[#0a0a0a] flex items-center justify-center shadow-lg border border-white/10 mb-8 relative group cursor-pointer"
        >
          <div className="absolute inset-0 rounded-[14px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Command size={24} className="text-white opacity-80" />
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-4 w-full px-4">
          {menuItems.filter(i => i.id !== 'settings').map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`group relative flex flex-col items-center justify-center w-full aspect-square rounded-[18px] transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <item.icon size={24} strokeWidth={2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {isActive && (
                  <div className="absolute right-[-17px] top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-6 mb-4">
          <button 
              onClick={() => setCurrentView('settings')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentView === 'settings' ? 'text-white bg-white/10 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-white/10'
              }`}
          >
            <Settings size={22} className={currentView === 'settings' ? 'text-blue-400' : ''} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Visible on < lg) */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 h-[64px] bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-[32px] z-50 flex items-center justify-around px-2 shadow-2xl safe-area-bottom">
         {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`relative flex flex-col items-center justify-center w-14 h-full transition-all duration-300 ${
                  isActive ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-blue-500/10 -translate-y-1' : ''}`}>
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && <div className="w-1 h-1 rounded-full bg-blue-500 mt-1 absolute bottom-2"></div>}
              </button>
            );
         })}
      </div>
    </>
  );
};
