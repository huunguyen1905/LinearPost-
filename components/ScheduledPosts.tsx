
import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, Image as ImageIcon, RefreshCw, Loader2, ChevronLeft, ChevronRight, CalendarRange, CalendarDays, MoreHorizontal, AlertCircle, PlayCircle, X, Save, Edit3, CheckCircle2 } from 'lucide-react';
import { ScheduledPost, Destination, PostStatus } from '../types';

interface ScheduledPostsProps {
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ScheduledPost>) => void;
  availableDestinations: Destination[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Nháp', color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' }, 
  scheduled: { label: 'Chờ Đăng', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }, 
  queue: { label: 'Hàng chờ', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }, 
  published: { label: 'Thành Công', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }, 
  failed: { label: 'Lỗi', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50' }, 
};

type ViewMode = 'week' | 'month';

// --- COMPONENTS CON ---

const MediaThumbnail = ({ src, type, className }: { src: string | null; type: 'video' | 'image'; className?: string }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={`flex items-center justify-center bg-[#1c1c1e] text-gray-700 ${className}`}>
                <ImageIcon size={20} />
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <img 
                src={src} 
                alt="Media" 
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
            {type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <PlayCircle size={24} className="text-white opacity-90 fill-white/20" />
                </div>
            )}
        </div>
    );
};

// HELPER: Format date for Sheet (dd/MM/yyyy HH:mm:ss)
const formatISODateToSheet = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Component Modal Chỉnh Sửa
const EditPostModal = ({ 
    post, 
    onClose, 
    onSave 
}: { 
    post: ScheduledPost; 
    onClose: () => void; 
    onSave: (id: string, updates: Partial<ScheduledPost>) => Promise<void>;
}) => {
    const [content, setContent] = useState(post.content);
    const [mandatory, setMandatory] = useState(post.mandatoryContent || '');
    const [seeding, setSeeding] = useState(post.seedingComment || '');
    const [time, setTime] = useState(post.scheduledTime);
    const [status, setStatus] = useState<PostStatus>(post.status);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Topic được tạo tự động từ 50 ký tự đầu của content
        const newTopic = content.length > 60 ? content.substring(0, 60) + "..." : content;
        
        // Ensure format is correct for Sheet
        const formattedTime = formatISODateToSheet(time);

        await onSave(post.id, {
            content: content,
            mandatoryContent: mandatory,
            seedingComment: seeding,
            scheduledTime: formattedTime, // Send format: 20/12/2025 11:51:29
            status: status,
            topic: newTopic
        });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className={`p-4 border-b border-white/5 flex justify-between items-center ${status === 'failed' ? 'bg-red-500/10' : 'bg-[#252528]'}`}>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Edit3 size={18} className={status === 'failed' ? 'text-red-400' : 'text-blue-500'} />
                        Chỉnh sửa bài viết
                        {status === 'failed' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded ml-2">LỖI HỆ THỐNG</span>}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                    
                    {/* Time & Status Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Thời gian đăng</label>
                            <input 
                                type="datetime-local" 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Trạng thái</label>
                            <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value as PostStatus)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <option key={key} value={key}>{conf.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                            <span>Nội dung chính</span>
                            <span className="text-gray-600">{content.length} ký tự</span>
                        </label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none min-h-[150px] leading-relaxed resize-y"
                            placeholder="Nhập nội dung bài viết..."
                        />
                    </div>

                    {/* Mandatory Content */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nội dung bắt buộc (Chữ ký/Liên hệ)</label>
                        <textarea 
                            value={mandatory}
                            onChange={(e) => setMandatory(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-blue-500/50 focus:outline-none min-h-[60px] resize-y"
                            placeholder="Thông tin liên hệ, hashtag chung..."
                        />
                    </div>

                    {/* Seeding Comment */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Bình luận Seeding</label>
                        <textarea 
                            value={seeding}
                            onChange={(e) => setSeeding(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-blue-500/50 focus:outline-none min-h-[50px] resize-y"
                            placeholder="Nội dung comment đầu tiên..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#252528] flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ScheduledPosts: React.FC<ScheduledPostsProps> = ({ 
    posts, 
    onDelete, 
    onUpdate,
    onRefresh, 
    isLoading = false 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // --- CALENDAR LOGIC ---

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  };

  const getDaysInMonthView = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = getStartOfWeek(firstDay);
    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const getDaysInWeekView = (date: Date) => {
    const startDate = getStartOfWeek(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
        if (!post.scheduledTime) return false;
        const postDate = new Date(post.scheduledTime);
        return postDate.getDate() === date.getDate() &&
               postDate.getMonth() === date.getMonth() &&
               postDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };
  
  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getDate() === d2.getDate() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getFullYear() === d2.getFullYear();
  };

  const handlePostClick = (e: React.MouseEvent, post: ScheduledPost) => {
      e.stopPropagation(); // Ngăn chặn click event lan ra container ngày
      setEditingPost(post);
  };

  // --- RENDERERS ---

  const renderHeader = () => (
    <div className="flex flex-col gap-4 mb-4 lg:mb-8 flex-shrink-0">
        <div className="flex justify-between items-center lg:items-start">
            <div>
                <h1 className="text-xl lg:text-3xl font-bold text-white tracking-tight mb-1">
                    Lịch trình
                </h1>
                <p className="text-gray-400 text-[10px] lg:text-sm font-medium hidden lg:block">Quản lý chiến dịch nội dung.</p>
            </div>
            
            <div className="flex items-center gap-2">
                 {onRefresh && (
                    <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-2 lg:px-4 lg:py-2.5 bg-[#1c1c1e] text-white rounded-xl border border-white/5 hover:bg-[#2c2c2e] active:scale-95 disabled:opacity-50"
                    >
                    <RefreshCw size={16} className={`text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                )}
                <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-center min-w-[50px]">
                    <span className="text-sm lg:text-xl font-bold text-white leading-none">{posts.length}</span>
                    <span className="text-[8px] lg:text-[10px] text-gray-500 uppercase">Tổng</span>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/10 shadow-lg">
             <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={18}/>
             </button>
             
             <div className="text-sm font-bold text-white">
                {viewMode === 'month' 
                    ? `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`
                    : `Tuần ${getStartOfWeek(currentDate).getDate()}/${getStartOfWeek(currentDate).getMonth()+1}`
                }
             </div>

             <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={18}/>
             </button>
        </div>

        <div className="flex justify-center lg:justify-end">
            <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-white/10 w-full lg:w-auto">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'month' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'}`}
                >
                    <CalendarDays size={14} /> Tháng
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'}`}
                >
                    <CalendarRange size={14} /> Tuần
                </button>
            </div>
        </div>
    </div>
  );

  const renderDayDetails = () => {
      const dayPosts = getPostsForDate(selectedDate);
      const isToday = isSameDay(selectedDate, new Date());

      return (
          <div className="mt-4 animate-fade-in pb-20 lg:pb-0">
             <div className="flex items-center justify-between mb-3 px-1">
                 <h3 className="text-white font-bold text-sm flex items-center gap-2">
                     <Clock size={14} className="text-blue-500"/>
                     Chi tiết ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
                     {isToday && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Hôm nay</span>}
                 </h3>
                 {dayPosts.length > 0 && <span className="text-xs text-gray-500">{dayPosts.length} bài đăng</span>}
             </div>

             {dayPosts.length === 0 ? (
                 <div className="bg-[#1c1c1e] rounded-2xl p-6 text-center border border-white/5 border-dashed">
                     <p className="text-gray-500 text-xs">Không có bài viết nào trong ngày này.</p>
                 </div>
             ) : (
                 <div className="space-y-3">
                     {dayPosts.map(post => {
                         const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                         const isFailed = post.status === 'failed';
                         
                         return (
                            <div 
                                key={post.id} 
                                onClick={(e) => handlePostClick(e, post)}
                                className={`bg-[#1c1c1e] rounded-2xl p-3 border flex gap-3 transition-all shadow-lg group cursor-pointer ${
                                    isFailed 
                                    ? 'border-red-500/50 bg-red-900/10 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                    : 'border-white/5 hover:border-blue-500/30 hover:bg-white/5'
                                }`}
                            >
                                {/* Media Thumbnail */}
                                <div className="relative">
                                    <MediaThumbnail 
                                        src={post.mediaPreview} 
                                        type={post.mediaType}
                                        className="w-20 h-20 rounded-xl bg-black flex-shrink-0 relative overflow-hidden border border-white/5"
                                    />
                                    {isFailed && (
                                        <div className="absolute -top-1 -right-1 z-10 bg-red-500 rounded-full text-white p-0.5 shadow-md">
                                            <AlertCircle size={12} fill="white" className="text-red-600" />
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute bottom-0 left-0 right-0 h-1 ${status.bg.replace('/10', '')}`}></div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(post.scheduledTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="text-gray-600 hover:text-red-500 p-1">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="text-xs font-semibold text-white mt-1 line-clamp-2 leading-relaxed group-hover:text-blue-400 transition-colors">
                                            {post.topic}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${status.bg} ${status.color}`}>
                                            {isFailed && <AlertCircle size={10} />}
                                            {status.label}
                                        </span>
                                        <div className="flex -space-x-1.5">
                                            {post.destinations.slice(0, 3).map((d, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full bg-gray-700 border border-[#1c1c1e] flex items-center justify-center text-[6px] text-white font-bold">
                                                    {d.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         );
                     })}
                 </div>
             )}
          </div>
      );
  };

  const renderMonthView = () => {
      const days = getDaysInMonthView(currentDate);
      const today = new Date();
      const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

      return (
        <div className="w-full h-full flex flex-col">
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-fr gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {days.map((day, idx) => {
                    const isToday = isSameDay(day, today);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isSelected = isSameDay(day, selectedDate);
                    const dayPosts = getPostsForDate(day);
                    const hasPosts = dayPosts.length > 0;
                    const hasFailedPost = dayPosts.some(p => p.status === 'failed');

                    return (
                        <div 
                            key={idx} 
                            onClick={() => {
                                setSelectedDate(day);
                            }}
                            className={`
                                relative min-h-[50px] lg:min-h-[120px] p-1 lg:p-2 transition-all cursor-pointer flex flex-col gap-1 items-center lg:items-start
                                ${!isCurrentMonth ? 'opacity-20 bg-black' : 'bg-[#121212] hover:bg-[#1c1c1e]'}
                                ${isSelected ? 'bg-white/10 ring-1 ring-inset ring-blue-500/50 z-10' : ''}
                                ${hasFailedPost ? 'bg-red-900/10' : ''}
                            `}
                        >
                            <div className="flex w-full justify-between items-start">
                                <div className={`
                                    text-[10px] lg:text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                                    ${isToday ? 'bg-blue-600 text-white' : (isSelected ? 'text-white' : 'text-gray-400')}
                                `}>
                                    {day.getDate()}
                                </div>
                                {hasFailedPost && (
                                    <div className="hidden lg:block">
                                        <AlertCircle size={12} className="text-red-500 animate-pulse" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="lg:hidden">
                                {hasPosts && (
                                    <div className="flex gap-0.5">
                                        <div className={`w-1 h-1 rounded-full ${hasFailedPost ? 'bg-red-500' : (dayPosts.length > 2 ? 'bg-blue-400' : 'bg-gray-400')}`}></div>
                                        {dayPosts.length > 1 && <div className="w-1 h-1 rounded-full bg-gray-600"></div>}
                                    </div>
                                )}
                            </div>

                            <div className="hidden lg:flex flex-col gap-1 w-full overflow-y-auto custom-scrollbar">
                                {dayPosts.slice(0, 3).map(post => {
                                    const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                                    const isFailed = post.status === 'failed';
                                    return (
                                        <div 
                                            key={post.id}
                                            onClick={(e) => handlePostClick(e, post)}
                                            className={`px-1.5 py-1 rounded border-l-[3px] text-[9px] truncate bg-[#1c1c1e] hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between ${
                                                isFailed ? 'border-red-500 text-red-200 bg-red-900/20' : status.color.replace('text-', 'border-')
                                            }`}
                                            title={post.topic}
                                        >
                                            <span className={isFailed ? 'text-red-200 font-semibold' : 'text-gray-300'}>{post.topic}</span>
                                            {isFailed && <AlertCircle size={8} className="text-red-500 flex-shrink-0 ml-1" />}
                                        </div>
                                    )
                                })}
                                {dayPosts.length > 3 && (
                                    <span className="text-[9px] text-gray-500 pl-1">+{dayPosts.length - 3} nữa</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {renderDayDetails()}
        </div>
      );
  };

  const renderWeekView = () => {
    const days = getDaysInWeekView(currentDate);
    const today = new Date();
    
    return (
        <div className="w-full h-full pb-4">
             <div className="flex lg:grid lg:grid-cols-7 gap-2 overflow-x-auto snap-x snap-mandatory pb-4 lg:pb-0 h-full">
                {days.map((day, idx) => {
                    const isToday = isSameDay(day, today);
                    const dayPosts = getPostsForDate(day);
                    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()];

                    return (
                        <div key={idx} className="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-auto snap-center flex flex-col h-full bg-[#121212]/50 rounded-xl border border-white/5 overflow-hidden">
                             <div className={`p-3 text-center border-b border-white/5 ${isToday ? 'bg-blue-600/10' : ''}`}>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase block">{dayName}</span>
                                 <span className={`text-lg font-bold ${isToday ? 'text-blue-500' : 'text-white'}`}>{day.getDate()}</span>
                             </div>

                             <div className="flex-1 p-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar bg-black/20 min-h-[300px]">
                                {dayPosts.length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-10">
                                        <span className="text-2xl font-bold text-gray-700 select-none">Trống</span>
                                    </div>
                                )}
                                {dayPosts.map(post => {
                                    const status = STATUS_CONFIG[post.status];
                                    const isFailed = post.status === 'failed';
                                    return (
                                        <div 
                                            key={post.id} 
                                            onClick={(e) => handlePostClick(e, post)}
                                            className={`group relative bg-[#1c1c1e] rounded-xl border overflow-hidden transition-all shadow-lg shrink-0 cursor-pointer ${
                                                isFailed 
                                                ? 'border-red-500/50 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                                : 'border-white/10 hover:border-blue-500/50'
                                            }`}
                                        >
                                            {/* Time Tag */}
                                            <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                                                {new Date(post.scheduledTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            
                                            <div className="aspect-video w-full bg-black relative">
                                                 <MediaThumbnail 
                                                    src={post.mediaPreview} 
                                                    type={post.mediaType}
                                                    className="w-full h-full opacity-80"
                                                />
                                                {isFailed && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/30 backdrop-blur-[1px]">
                                                        <div className="bg-red-600 rounded-full p-2 animate-pulse">
                                                            <AlertCircle size={20} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`absolute bottom-0 inset-x-0 h-1 ${status.bg.replace('/10', '')}`}></div>
                                            </div>

                                            <div className="p-3">
                                                <p className="text-[10px] font-semibold text-gray-200 line-clamp-2 leading-snug mb-2 group-hover:text-blue-400" title={post.content}>{post.topic}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} font-bold uppercase`}>
                                                        {status.label}
                                                    </span>
                                                    <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="text-gray-600 hover:text-red-500 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    );
                })}
             </div>
        </div>
    );
  };

  return (
    <>
        <div className="w-full h-full p-4 lg:p-12 overflow-y-auto custom-scrollbar bg-black/20">
        <div className="max-w-[1400px] mx-auto min-h-full flex flex-col">
            {renderHeader()}

            {isLoading && posts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 lg:py-32 text-gray-600">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                    <p className="text-xs font-medium animate-pulse">Đang đồng bộ...</p>
                </div>
            ) : posts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 lg:py-32 text-gray-600 border border-dashed border-white/10 rounded-[24px] lg:rounded-[32px] bg-white/5 mx-2">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="text-base font-semibold">Trống trơn</p>
                <p className="text-xs text-center px-4">Chưa có nội dung nào được lên lịch.</p>
                <button 
                    onClick={onRefresh} 
                    className="mt-4 px-4 py-2 bg-blue-600/10 text-blue-500 rounded-full text-xs font-bold hover:bg-blue-600/20 transition-colors"
                >
                    Kiểm tra lại
                </button>
            </div>
            ) : (
            <div className="flex-1 relative h-full flex flex-col">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-[#000000]/50 backdrop-blur-[1px] rounded-[24px] flex items-center justify-center h-full pointer-events-none">
                        <div className="bg-[#1c1c1e] px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl border border-white/10 sticky top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                            <span className="text-xs font-bold text-white">Đang cập nhật...</span>
                        </div>
                    </div>
                )}
                
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
            </div>
            )}
        </div>
        </div>
        
        {/* Render Modal if Editing */}
        {editingPost && (
            <EditPostModal 
                post={editingPost} 
                onClose={() => setEditingPost(null)} 
                onSave={async (id, updates) => {
                    await onUpdate(id, updates);
                }}
            />
        )}
    </>
  );
};
