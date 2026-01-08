
import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Briefcase, Smile, Zap, Coffee, Lightbulb, Image as ImageIcon, UploadCloud, X, Film, Layers, Type, Settings2, Eraser, Circle, Clock, CheckCircle2, ChevronUp, ChevronDown, Plus, Globe, Check } from 'lucide-react';
import { Tone, Destination, PostType, PostStatus } from '../types';
import { GlassCard } from './GlassCard';

interface InputSectionProps {
  tone: Tone;
  setTone: (val: Tone) => void;
  postType: PostType;
  setPostType: (val: PostType) => void;
  audience: string;
  setAudience: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedContent: string;
  setGeneratedContent: (val: string) => void;
  mandatoryContent: string;
  setMandatoryContent: (val: string) => void;
  seedingComment: string;
  setSeedingComment: (val: string) => void;
  destinations: string[];
  toggleDestination: (id: string) => void;
  availableDestinations: Destination[];
  scheduleMode: 'now' | 'later';
  setScheduleMode: (mode: 'now' | 'later') => void;
  scheduledTime: string;
  setScheduledTime: (val: string) => void;
  mediaFiles: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  postStatus: PostStatus;
  setPostStatus: (status: PostStatus) => void;
  autoRewrite: boolean;
  setAutoRewrite: (val: boolean) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  tone,
  setTone,
  postType,
  setPostType,
  audience,
  setAudience,
  onGenerate,
  isGenerating,
  generatedContent,
  setGeneratedContent,
  mandatoryContent,
  setMandatoryContent,
  seedingComment,
  setSeedingComment,
  destinations,
  toggleDestination,
  availableDestinations,
  scheduleMode,
  setScheduleMode,
  scheduledTime,
  setScheduledTime,
  mediaFiles,
  onFilesChange,
  onRemoveFile,
  postStatus,
  setPostStatus,
  autoRewrite,
  setAutoRewrite
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Custom Dropdown State
  const [isPostTypeOpen, setIsPostTypeOpen] = useState(false);
  const postTypeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (postTypeRef.current && !postTypeRef.current.contains(event.target as Node)) {
        setIsPostTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toneOptions = [
    { value: Tone.PROFESSIONAL, icon: Briefcase, label: 'Uy tín' },
    { value: Tone.VIRAL, icon: Zap, label: 'Viral' },
    { value: Tone.CASUAL, icon: Coffee, label: 'Healing' },
    { value: Tone.FUNNY, icon: Smile, label: 'Hài hước' },
    { value: Tone.INSPIRATIONAL, icon: Lightbulb, label: 'Review' },
  ];

  const postTypes = [
    { value: PostType.MULTIPLE_IMAGES, label: 'Đăng Nhiều Ảnh', icon: Layers },
    { value: PostType.SINGLE_IMAGE, label: 'Đăng Một Ảnh', icon: ImageIcon },
    { value: PostType.TEXT_ONLY, label: 'Text', icon: Type },
    { value: PostType.VIDEO, label: 'Video', icon: Film },
    { value: PostType.TEXT_WITH_BACKGROUND, label: 'Text_Kèm_Background', icon: Type },
  ];
  
  const statusOptions: { value: PostStatus, label: string, icon: any, color: string }[] = [
    { value: 'draft', label: 'Nháp', icon: Circle, color: 'text-red-400' },
    { value: 'scheduled', label: 'Chờ Đăng', icon: Clock, color: 'text-yellow-400' },
    { value: 'queue', label: 'Hàng chờ', icon: Layers, color: 'text-purple-400' },
    { value: 'published', label: 'Thành Công', icon: CheckCircle2, color: 'text-green-400' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesChange(filesArray);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleClearContent = () => {
    if(window.confirm('Xóa nội dung đang soạn thảo?')) {
        setGeneratedContent('');
    }
  };

  const activePostTypeLabel = postTypes.find(t => t.value === postType)?.label;
  const ActivePostTypeIcon = postTypes.find(t => t.value === postType)?.icon || Layers;

  return (
    <div className="h-full flex flex-col gap-5 p-4 lg:p-12 overflow-y-visible">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
            <span className="bg-white/10 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/5 shadow-sm">
                Prestige AI 2.0
            </span>
        </div>
        <h1 className="text-2xl lg:text-4xl font-bold text-white tracking-tight mt-1">
          Soạn thảo
        </h1>
      </div>

      {/* Post Type Selector (Custom Dropdown) */}
      <div ref={postTypeRef} className="relative z-30">
          <div 
             onClick={() => setIsPostTypeOpen(!isPostTypeOpen)}
             className="flex items-center justify-between bg-[#1c1c1e] p-3 lg:p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-white/10 transition-all group"
          >
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-105 transition-transform">
                      <ActivePostTypeIcon size={20} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Loại bài đăng</span>
                      <span className="text-sm font-bold text-white">{activePostTypeLabel}</span>
                  </div>
              </div>
              
              <div className="px-4 py-2 bg-white/5 group-hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all border border-white/5 flex items-center gap-2">
                  Thay đổi {isPostTypeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
          </div>

          {isPostTypeOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {postTypes.map(t => (
                      <button
                          key={t.value}
                          onClick={() => {
                              setPostType(t.value);
                              setIsPostTypeOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 ${
                            postType === t.value ? 'text-white bg-white/5' : 'text-gray-400'
                          }`}
                      >
                          <t.icon size={16} className={postType === t.value ? 'text-blue-500' : 'text-gray-500'} />
                          {t.label}
                          {postType === t.value && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                      </button>
                  ))}
              </div>
          )}
      </div>

      {/* Collapsible Advanced Settings (Tone & Audience Only) */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#1c1c1e]/50">
          <button 
             onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
             className="w-full flex items-center justify-between p-3 lg:p-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
             <div className="flex items-center gap-2">
                 <Settings2 size={14} />
                 <span>Cấu hình nâng cao</span>
             </div>
             {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isAdvancedOpen && (
              <div className="p-3 lg:p-4 pt-0 space-y-4 animate-fade-in border-t border-white/5">
                 {/* Tone & Audience */}
                 <div className="grid grid-cols-1 gap-4 pt-2">
                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Phong cách</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 lg:mx-0 lg:px-0">
                        {toneOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setTone(option.value)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] lg:text-xs font-medium transition-all duration-200 border ${
                            tone === option.value
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                : 'bg-transparent border-white/10 text-gray-400'
                            }`}
                        >
                            <option.icon size={12} />
                            {option.label}
                        </button>
                        ))}
                    </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Khách hàng mục tiêu</label>
                    <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="VD: Cặp đôi Gen Z..."
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                    />
                 </div>
              </div>
          )}
      </div>

      {/* Content Editor - MERGED */}
      <div className="space-y-2 animate-fade-in-up">
        <div className="flex justify-between items-center px-1">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nội dung bài viết</label>
             <div className="flex gap-2">
                <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                    {generatedContent.length} ký tự
                </span>
             </div>
        </div>
        <GlassCard className="p-1 overflow-hidden relative group">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
              {generatedContent && (
                  <button 
                    onClick={handleClearContent} 
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                    title="Xóa nội dung"
                  >
                      <Eraser size={14} />
                  </button>
              )}
              <button
                onClick={onGenerate}
                disabled={!generatedContent || isGenerating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                !generatedContent || isGenerating 
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] hover:shadow-[0_0_20px_rgba(0,122,255,0.4)] text-white active:scale-95'
                }`}
              >
                  {isGenerating ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  <span className="text-xs">AI Viết tiếp</span>
              </button>
          </div>

          <textarea
            value={generatedContent}
            onChange={(e) => setGeneratedContent(e.target.value)}
            placeholder="Nhập ý tưởng hoặc nội dung bài viết..."
            className={`w-full bg-transparent p-5 text-sm lg:text-base text-gray-200 focus:outline-none resize-none leading-relaxed font-light placeholder:text-gray-600 min-h-[250px] lg:min-h-[350px] ${postType === PostType.TEXT_WITH_BACKGROUND ? 'text-center font-bold flex items-center justify-center pt-20' : ''}`}
          />
        </GlassCard>
      </div>

      {/* Media Area - UPGRADED: SHOW for all types except BACKGROUND */}
      {postType !== PostType.TEXT_WITH_BACKGROUND && (
        <div className="space-y-2">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
             <span>Media {mediaFiles.length > 0 && `(${mediaFiles.length})`}</span>
           </label>
           
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept={postType.includes('Video') ? "video/*" : "image/*,video/*"}
              multiple={true}
              onChange={handleFileSelect}
           />

           {mediaFiles.length === 0 ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/20 rounded-[20px] p-4 lg:p-6 flex flex-col items-center justify-center text-gray-500 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer bg-[#1c1c1e]/50 min-h-[100px]"
             >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center mb-2 shadow-lg text-blue-500">
                  <UploadCloud size={16} />
                </div>
                <p className="text-[10px] lg:text-xs font-semibold text-gray-400">Chạm để tải ảnh/video</p>
             </div>
           ) : (
             <div className="space-y-3">
                 <div className="grid grid-cols-4 gap-2">
                    {mediaFiles.map((file, index) => (
                       <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-white/10">
                          {file.type.startsWith('video') ? (
                            <div className="w-full h-full bg-black flex items-center justify-center text-gray-500">
                               <Film size={20} />
                            </div>
                          ) : (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="preview" 
                              className="w-full h-full object-cover" 
                            />
                          )}
                          <button 
                            onClick={() => onRemoveFile(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white transition-opacity hover:bg-red-500"
                          >
                            <X size={10} />
                          </button>
                       </div>
                    ))}
                    <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/40 hover:bg-white/5 cursor-pointer transition-all"
                    >
                       <Plus size={20} />
                       <span className="text-[8px] font-bold mt-1">THÊM</span>
                    </div>
                 </div>
             </div>
           )}
        </div>
      )}

      {/* Mandatory Content only (Seeding Hidden) */}
      <div className="space-y-3 pt-2">
          <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                 Nội dung bắt buộc
              </label>
              <textarea
                value={mandatoryContent}
                onChange={(e) => setMandatoryContent(e.target.value)}
                placeholder="Nhập thông tin liên hệ, địa chỉ, chữ ký cuối bài..."
                className="w-full bg-[#1c1c1e] text-xs text-white placeholder-gray-600 px-3 py-2 rounded-xl focus:outline-none border border-white/5 h-16 resize-none"
              />
          </div>
      </div>

      {/* Destinations & Publish - Bottom Section */}
      <div className="space-y-4 pt-4 border-t border-white/5 pb-40">
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Kênh đích
                  </label>
                  {/* AUTO REWRITE TOGGLE */}
                  {destinations.length > 1 && (
                      <div 
                        onClick={() => setAutoRewrite(!autoRewrite)}
                        className="flex items-center gap-2 cursor-pointer bg-white/5 px-2 py-1 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                      >
                          <div className={`w-3 h-3 rounded flex items-center justify-center transition-colors ${autoRewrite ? 'bg-blue-500' : 'bg-gray-700'}`}>
                             {autoRewrite && <Check size={8} className="text-white" />}
                          </div>
                          <span className="text-[9px] font-semibold text-gray-300">AI viết lại từng kênh</span>
                      </div>
                  )}
              </div>
              
              {availableDestinations.length === 0 ? (
                <div className="bg-[#1c1c1e] border border-dashed border-white/10 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs">Chưa có trang nào được kết nối.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableDestinations.map((dest) => {
                    const isSelected = destinations.includes(dest.id);
                    return (
                      <button
                        key={dest.id}
                        onClick={() => toggleDestination(dest.id)}
                        className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-[#1c1c1e] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {/* Avatar Circle */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                            isSelected ? 'bg-white text-blue-600' : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                        }`}>
                            {dest.name.substring(0, 1).toUpperCase()}
                        </div>

                        {/* Full Name */}
                        <span className="text-xs font-semibold truncate max-w-[150px]">{dest.name}</span>

                        {/* Checkmark indicator for selected state */}
                        {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1c1e] z-10 flex items-center justify-center">
                                <CheckCircle2 size={8} className="text-white" />
                            </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
                <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Trạng thái
                    </label>
                    <select 
                        value={postStatus}
                        onChange={(e) => {
                            const val = e.target.value as PostStatus;
                            setPostStatus(val);
                            if(val === 'scheduled') setScheduleMode('later');
                            else setScheduleMode('now');
                        }}
                        className="w-full bg-[#1c1c1e] text-white text-xs font-semibold px-3 py-2.5 rounded-xl border-none focus:outline-none appearance-none"
                     >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                     </select>
                </div>

                <div className={`space-y-1 flex-[1.5] transition-all duration-300 ${postStatus === 'scheduled' ? 'opacity-100' : 'opacity-50'}`}>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Thời gian
                    </label>
                    <input 
                        type="datetime-local" 
                        value={scheduledTime}
                        onChange={(e) => {
                            setScheduledTime(e.target.value);
                            setPostStatus('scheduled');
                            setScheduleMode('later');
                        }}
                        className="w-full bg-[#1c1c1e] text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none color-scheme-dark"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
