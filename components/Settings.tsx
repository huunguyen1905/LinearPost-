
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Globe, Fingerprint, ShieldCheck, Link2, Save, CheckCircle2, Edit3, X, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');

  // Manage Destination State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedUrl = sheetService.getScriptUrl();
    if (savedUrl) {
      setScriptUrl(savedUrl);
      setIsUrlSaved(true);
    }
  }, []);

  const handleSaveUrl = async () => {
    if (!scriptUrl.trim()) return;
    
    setTestError('');
    setIsTesting(true);

    // 1. Test Connection First
    const success = await sheetService.testConnection(scriptUrl);
    
    if (success) {
        sheetService.setScriptUrl(scriptUrl);
        setIsUrlSaved(true);
        // Force reload page to sync everything
        if(window.confirm("Kết nối thành công! Tải lại trang để đồng bộ dữ liệu?")) {
            window.location.reload();
        }
    } else {
        setTestError("Kết nối thất bại! Hãy kiểm tra quyền truy cập (Anyone) hoặc URL.");
        setIsUrlSaved(false);
    }
    setIsTesting(false);
  };

  const handleSaveDestination = async () => {
    if (!name || !pageId || !token) return;
    setIsProcessing(true);

    const dest: Destination = {
      id: pageId,
      name: name,
      accessToken: token,
      type: 'page'
    };

    if (isEditing) {
        // Edit Mode: Update via Service
        const success = await sheetService.updateDestination(dest);
        if (success) {
            alert("Cập nhật thành công! Dữ liệu sẽ được đồng bộ lại.");
            resetForm();
        } else {
            alert("Lỗi cập nhật. Vui lòng thử lại.");
        }
    } else {
        // Add Mode
        onAddDestination(dest);
        resetForm();
    }
    setIsProcessing(false);
  };

  const handleEditClick = (dest: Destination) => {
      setIsEditing(true);
      setName(dest.name);
      setPageId(dest.id);
      setToken(dest.accessToken);
      // Cuộn lên đầu
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
      setIsEditing(false);
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
                                setTestError('');
                            }}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className={`flex-1 bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 transition-all border ${isUrlSaved ? 'border-green-500/30 focus:ring-green-500/50' : 'border-white/5 focus:ring-blue-500/50'}`}
                        />
                        <button
                            onClick={handleSaveUrl}
                            disabled={isTesting}
                            className={`px-6 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                isUrlSaved 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                            } disabled:opacity-50`}
                        >
                            {isTesting ? <RefreshCw size={16} className="animate-spin" /> : (isUrlSaved ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                            {isTesting ? 'Đang thử...' : (isUrlSaved ? 'Đã lưu' : 'Kiểm tra & Lưu')}
                        </button>
                    </div>
                    {testError && (
                        <div className="text-xs text-red-400 flex items-center gap-2 animate-fade-in">
                            <AlertTriangle size={12} /> {testError}
                        </div>
                    )}
                    <p className="text-[10px] text-gray-500 italic">Lưu ý: Script phải được Deploy quyền "Anyone" (Bất kỳ ai).</p>
                </div>
             </GlassCard>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. Add/Edit Page Form */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    {isEditing ? 'Cập nhật thông tin' : 'Thêm trang mới'}
                </h2>
                {isEditing && (
                    <button onClick={resetForm} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold uppercase">
                        <X size={12} /> Hủy bỏ
                    </button>
                )}
            </div>
            
            <GlassCard className={`p-6 space-y-5 transition-all duration-300 ${isEditing ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : ''}`}>
              
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
                  disabled={!isUrlSaved || isEditing} // Disable ID editing to prevent mismatch
                  placeholder="VD: 100089..."
                  className={`w-full bg-[#1c1c1e] text-sm text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5 font-mono disabled:opacity-50 ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                {isEditing && <p className="text-[9px] text-gray-500 italic">* Không thể thay đổi ID khi chỉnh sửa</p>}
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
                onClick={handleSaveDestination}
                disabled={!name || !pageId || !token || !isUrlSaved || isProcessing}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !name || !pageId || !token || !isUrlSaved || isProcessing
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : isEditing 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/20 active:scale-[0.98]'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20 active:scale-[0.98]'
                }`}
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : (isEditing ? <CheckCircle2 size={18} /> : <Plus size={18} />)}
                <span>{isEditing ? 'Cập nhật thông tin' : 'Kết nối trang'}</span>
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
                  <GlassCard key={dest.id} className={`p-4 flex items-start gap-4 group hover:bg-[#1c1c1e] transition-colors border ${isEditing && pageId === dest.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}>
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

                    <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditClick(dest)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                          title="Sửa thông tin"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveDestination(dest.id)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          title="Xóa trang"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>
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
