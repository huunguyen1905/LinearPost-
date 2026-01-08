
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, Image as ImageIcon, Film, ChevronDown, FileEdit, Layers, RefreshCw, Loader2, ChevronLeft, ChevronRight, CalendarRange, CalendarDays } from 'lucide-react';
import { GlassCard } from './GlassCard';
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
  draft: { label: 'Nháp', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }, 
  scheduled: { label: 'Chờ Đăng', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }, 
  queue: { label: 'Hàng chờ', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }, 
  published: { label: 'Thành Công', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }, 
  failed: { label: 'Lỗi', color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/50' }, 
};

type ViewMode = 'week' | 'month';

export const ScheduledPosts: React.FC<ScheduledPostsProps> = ({ 
    posts, 
    onDelete, 
    onUpdate, 
    availableDestinations, 
    onRefresh, 
    isLoading = false 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- CALENDAR LOGIC ---

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
    return new Date(d.setDate(diff));
  };

  const getDaysInMonthView = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Monday of the week containing the 1st
    const startDate = getStartOfWeek(firstDay);
    const days = [];
    
    // Generate 42 days (6 weeks) to cover any month view
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

  // --- RENDERERS ---

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 lg:mb-8 gap-4 flex-shrink-0">
        <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-1">
            Lịch trình
        </h1>
        <div className="flex items-center gap-4 text-gray-400 text-xs lg:text-sm font-medium">
            <span>Quản lý chiến dịch nội dung.</span>
            
            {/* Calendar Navigation */}
            <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-lg p-1 border border-white/10">
                <button onClick={() => navigateDate('prev')} className="p-1 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
                <span className="min-w-[100px] text-center font-bold text-white">
                    {viewMode === 'month' 
                        ? `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`
                        : `Tuần ${getStartOfWeek(currentDate).getDate()}/${getStartOfWeek(currentDate).getMonth()+1} - ...`
                    }
                </span>
                <button onClick={() => navigateDate('next')} className="p-1 hover:text-white transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
            {/* View Switcher */}
            <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Tháng"
                >
                    <CalendarDays size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Tuần"
                >
                    <CalendarRange size={16} />
                </button>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
                <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 bg-[#1c1c1e] text-white rounded-xl lg:rounded-2xl border border-white/5 hover:bg-[#2c2c2e] hover:border-white/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                <RefreshCw size={14} className={`text-blue-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="text-[10px] lg:text-xs font-bold hidden sm:inline">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
                </button>
            )}
            
            <div className="text-right bg-white/5 px-3 py-2 rounded-xl lg:rounded-2xl border border-white/5 min-w-[60px] lg:min-w-[80px]">
                <div className="text-lg lg:text-xl font-bold text-white leading-none text-center">{posts.length}</div>
                <div className="text-[8px] lg:text-[10px] text-gray-500 uppercase tracking-widest mt-1 text-center">Tổng</div>
            </div>
        </div>
    </div>
  );

  const renderMonthView = () => {
      const days = getDaysInMonthView(currentDate);
      const today = new Date();
      const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

      return (
        <div className="w-full h-full flex flex-col pb-24 lg:pb-0">
            {/* Week Header */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
                {days.map((day, idx) => {
                    const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth();
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const dayPosts = getPostsForDate(day);

                    return (
                        <div 
                            key={idx} 
                            className={`min-h-[80px] lg:min-h-[120px] p-2 bg-[#121212] transition-colors hover:bg-[#1a1a1a] flex flex-col gap-1 ${!isCurrentMonth ? 'opacity-30 bg-black' : ''}`}
                            onClick={() => {
                                if (dayPosts.length > 0) {
                                    setCurrentDate(day);
                                    setViewMode('week');
                                }
                            }}
                        >
                            <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                {day.getDate()}
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                {dayPosts.map(post => {
                                    const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                                    return (
                                        <div 
                                            key={post.id}
                                            className={`px-2 py-1.5 rounded-md border-l-2 text-[10px] truncate cursor-pointer hover:opacity-80 transition-opacity bg-[#1c1c1e] ${status.color.replace('text-', 'border-')}`}
                                            title={`${status.label}: ${post.topic}`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.bg.replace('bg-', 'bg-')}`}></span>
                                                <span className="text-gray-300 truncate hidden lg:inline">{post.topic}</span>
                                                <span className="text-gray-300 lg:hidden w-1.5 h-1.5 bg-current rounded-full"></span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  };

  const renderWeekView = () => {
    const days = getDaysInWeekView(currentDate);
    const today = new Date();
    
    return (
        <div className="w-full h-full overflow-x-auto pb-4">
             <div className="grid grid-cols-7 min-w-[1000px] h-full gap-2">
                {days.map((day, idx) => {
                    const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth();
                    const dayPosts = getPostsForDate(day);
                    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()];

                    return (
                        <div key={idx} className="flex flex-col h-full bg-[#121212]/50 rounded-xl border border-white/5 overflow-hidden">
                             {/* Column Header */}
                             <div className={`p-3 text-center border-b border-white/5 ${isToday ? 'bg-blue-600/10' : ''}`}>
                                 <span className="text-[10px] font-bold text-gray-500 uppercase block">{dayName}</span>
                                 <span className={`text-lg font-bold ${isToday ? 'text-blue-500' : 'text-white'}`}>{day.getDate()}</span>
                             </div>

                             {/* Column Body */}
                             <div className="flex-1 p-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar bg-black/20">
                                {dayPosts.length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-10">
                                        <span className="text-2xl font-bold text-gray-700 select-none">Trống</span>
                                    </div>
                                )}
                                {dayPosts.map(post => {
                                    const status = STATUS_CONFIG[post.status];
                                    return (
                                        <div key={post.id} className="group relative bg-[#1c1c1e] rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all shadow-lg shrink-0">
                                            {/* Time Tag */}
                                            <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                                                {new Date(post.scheduledTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            
                                            {/* Media Thumb */}
                                            <div className="aspect-video w-full bg-black relative">
                                                {post.mediaPreview ? (
                                                    post.mediaType === 'video' ? 
                                                    <video src={post.mediaPreview} className="w-full h-full object-cover opacity-80" /> :
                                                    <img src={post.mediaPreview} className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="opacity-20"/></div>
                                                )}
                                                <div className={`absolute bottom-0 inset-x-0 h-1 ${status.bg.replace('/10', '')}`}></div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-2">
                                                <p className="text-[10px] font-semibold text-gray-200 line-clamp-2 leading-snug mb-2" title={post.content}>{post.topic}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} font-bold uppercase`}>
                                                        {status.label}
                                                    </span>
                                                    <button onClick={() => onDelete(post.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={12} />
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
    <div className="w-full h-full p-4 lg:p-12 overflow-y-auto custom-scrollbar bg-black/20">
      <div className="max-w-[1400px] mx-auto min-h-full flex flex-col">
        {renderHeader()}

        {/* Content Section */}
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
  );
};
