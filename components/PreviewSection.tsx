
import React from 'react';
import { Send, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';
import { FacebookMockup } from './FacebookMockup';
import { GlassCard } from './GlassCard';
import { PostType } from '../types';

interface PreviewSectionProps {
  content: string;
  mediaPreviews: string[];
  mediaType: 'image' | 'video';
  postType?: PostType;
  mandatoryContent?: string;
  seedingComment?: string;
  isGenerating: boolean;
  onSend: () => void;
  isSending: boolean;
  sendSuccess: boolean | null;
  scheduleMode: 'now' | 'later';
  scheduledTime: string;
  selectedCount?: number;
  loadingText?: string; 
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  content,
  mediaPreviews,
  mediaType,
  postType,
  mandatoryContent,
  seedingComment,
  isGenerating,
  onSend,
  isSending,
  sendSuccess,
  scheduleMode,
  scheduledTime,
  selectedCount = 0,
  loadingText
}) => {
  
  const formattedTime = scheduleMode === 'later' && scheduledTime 
    ? new Date(scheduledTime).toLocaleString('vi-VN', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
      }) 
    : 'Ngay lập tức';

  const canSend = (!!content || mediaPreviews.length > 0) && sendSuccess !== true;

  return (
    <div className="h-full flex flex-col justify-center items-center relative overflow-hidden bg-black/50 lg:bg-transparent">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[#050505]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-40"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] opacity-40"></div>

      <div className="relative z-10 w-full flex flex-col items-center h-full justify-center p-4 lg:p-0">
        {/* Mockup Container with Auto-Scale for Mobile */}
        <div className="w-full max-w-[400px] transform scale-[0.80] xs:scale-85 sm:scale-100 transition-transform duration-500 ease-out origin-center mt-[-40px] lg:mt-0">
            <FacebookMockup 
            content={content} 
            isGenerating={isGenerating} 
            mediaPreviews={mediaPreviews} 
            mediaType={mediaType}
            postType={postType}
            mandatoryContent={mandatoryContent}
            seedingComment={seedingComment}
            />
        </div>

        {/* Floating Action Bar - Moved UP to avoid overlapping with Bottom Nav on Mobile */}
        <div className="absolute bottom-28 lg:bottom-12 w-full max-w-[340px] lg:max-w-[380px] z-50 px-4 lg:px-0">
          <GlassCard className="p-2 pl-6 flex items-center justify-between gap-4 rounded-full bg-[#1c1c1e]/90 backdrop-blur-2xl border-white/10 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] lg:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {sendSuccess === true ? 'TRẠNG THÁI' : scheduleMode === 'later' ? 'THỜI GIAN' : 'SẴN SÀNG'}
              </span>
              <span className="text-xs lg:text-sm text-white font-semibold truncate max-w-[120px] lg:max-w-[150px]">
                 {isSending ? (loadingText || 'Đang xử lý...') : 
                  (sendSuccess === true 
                    ? (scheduleMode === 'later' ? 'Đã lên lịch!' : 'Đã đăng!') 
                    : (scheduleMode === 'later' ? formattedTime : 'Đăng ngay'))}
              </span>
            </div>
            
            <button
              onClick={onSend}
              disabled={isSending || !canSend}
              className={`h-10 lg:h-12 px-5 lg:px-6 rounded-full flex items-center gap-2 font-bold text-xs lg:text-sm transition-all transform active:scale-95 ${
                sendSuccess === true
                  ? 'bg-green-500 text-white cursor-default shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : isSending
                  ? 'bg-[#2c2c2e] text-gray-400 cursor-wait min-w-[100px] justify-center'
                  : !canSend
                  ? 'bg-[#2c2c2e] text-gray-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
              }`}
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : sendSuccess === true ? (
                 <CheckCircle2 size={18} />
              ) : (
                <>
                  <span>{scheduleMode === 'later' ? 'Xác nhận' : `Gửi (${selectedCount})`}</span>
                  {scheduleMode === 'later' ? <CalendarClock size={14} /> : <Send size={14} />}
                </>
              )}
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
