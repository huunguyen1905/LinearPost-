import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Globe, Fingerprint, ShieldCheck, Link2, Save, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Destination } from '../types';
import { sheetService } from '../services/sheetService';

interface SettingsProps {
  destinations: Destination[];
  onAddDestination: (dest: Destination) => void;
  onRemoveDestination: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ destinations, onAddDestination, onRemoveDestination }) => {
  // Connection Config State
  const [scriptUrl, setScriptUrl] = useState('');
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  // New Destination State
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedUrl = sheetService.getScriptUrl();
    if (savedUrl) {
      setScriptUrl(savedUrl);
      setIsUrlSaved(true);
    }
  }, []);

  const handleSaveUrl = () => {
    if (scriptUrl.trim()) {
      sheetService.setScriptUrl(scriptUrl);
      setIsUrlSaved(true);
      // Reload page gently to refresh connections if needed, or just let user navigate
      alert("Đã lưu cấu hình kết nối!");
    }
  };

  const handleAdd = () => {
    if (!name || !pageId || !token) return;

    const newDest: Destination = {
      id: pageId,
      name: name,
      accessToken: token,
      type: 'page'
    };

    onAddDestination(newDest);
    
    // Reset form
    setName('');
    setPageId('');
    setToken('');
  };

  const toggleTokenVisibility = (id: string) => {
    setShowToken(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full h-full p-8 lg:p-16 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Cài đặt hệ thống
          </h1>
          <p className="text-gray-400 text-sm font-medium">Cấu hình kết nối Google Sheet và quản lý Fanpage.</p>
        </div>

        {/* 1. Connection Config Section */}
        <div className="space-y-4 animate-fade-in">
             <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Kết nối Cơ sở dữ liệu</h2>
             <GlassCard className="p-6">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                        <Link2 size={12} /> Google Apps Script Web App URL
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={scriptUrl}
                            onChange={(e) => {
                                setScriptUrl(e.target.value);
                                setIsUrlSaved(false);
                            }}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className={`flex-1 bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 transition-all border ${isUrlSaved ? 'border-green-500/30 focus:ring-green-500/50' : 'border-white/5 focus:ring-blue-500/50'}`}
                        />
                        <button
                            onClick={handleSaveUrl}
                            className={`px-6 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                isUrlSaved 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                            }`}
                        >
                            {isUrlSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {isUrlSaved ? 'Đã lưu' : 'Lưu'}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500">
                        * Triển khai Script với quyền <b>"Anyone"</b>. URL phải kết thúc bằng <code>/exec</code>.
                    </p>
                </div>
             </GlassCard>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. Add Page Form */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Thêm trang mới</h2>
            <GlassCard className="p-6 space-y-5">
              
              {!isUrlSaved && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-orange-400 text-xs flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} />
                      Vui lòng nhập và lưu Script URL ở trên trước.
                  </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <Globe size={12} /> Tên Trang (Page Name)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isUrlSaved}
                  placeholder="VD: Prestige Travel..."
                  className="w-full bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <Fingerprint size={12} /> ID Trang (Page ID)
                </label>
                <input
                  type="text"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  disabled={!isUrlSaved}
                  placeholder="VD: 100089..."
                  className="w-full bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5 font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <Key size={12} /> Access Token
                </label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={!isUrlSaved}
                  placeholder="EAA..."
                  rows={3}
                  className="w-full bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5 font-mono resize-none custom-scrollbar disabled:opacity-50"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!name || !pageId || !token || !isUrlSaved}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !name || !pageId || !token || !isUrlSaved
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20 active:scale-[0.98]'
                }`}
              >
                <Plus size={18} />
                <span>Kết nối trang</span>
              </button>

            </GlassCard>
          </div>

          {/* 3. List Pages */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Danh sách trang ({destinations.length})</h2>
            
            <div className="space-y-3">
              {destinations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl bg-white/5">
                   <ShieldCheck size={32} className="mb-2 opacity-30" />
                   <p className="text-sm">Chưa có trang nào được kết nối</p>
                </div>
              ) : (
                destinations.map((dest) => (
                  <GlassCard key={dest.id} className="p-4 flex items-start gap-4 group hover:bg-[#1c1c1e] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0">
                      {dest.name.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-white font-semibold text-sm truncate">{dest.name}</h3>
                      <p className="text-gray-500 text-[10px] font-mono mt-0.5">ID: {dest.id}</p>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-black/30 px-2 py-1 rounded text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                           {showToken[dest.id] ? dest.accessToken : '••••••••••••••••••••'}
                        </div>
                        <button 
                           onClick={() => toggleTokenVisibility(dest.id)}
                           className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                        >
                           {showToken[dest.id] ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveDestination(dest.id)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </GlassCard>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};