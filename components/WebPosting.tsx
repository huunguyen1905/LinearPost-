
import React from 'react';
import { Construction, Globe, Lock, Layout, Image as ImageIcon, Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';

export const WebPosting: React.FC = () => {
  return (
    <div className="w-full h-full p-8 lg:p-16 overflow-y-auto custom-scrollbar relative">
      
      {/* Background Overlay for "Coming Soon" vibe */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <GlassCard className="p-8 lg:p-12 max-w-lg w-full text-center border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 text-blue-500">
                <Construction size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Tính năng đang phát triển</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hệ thống <b>Auto-Post to Web</b> (WordPress/Custom CMS) đang được xây dựng. 
                Tính năng này sẽ giúp bạn đồng bộ nội dung từ AI lên Website chuẩn SEO tự động.
            </p>
            <button className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                Nhận thông báo khi ra mắt
            </button>
        </GlassCard>
      </div>

      {/* Background Mockup UI (Blurred & Inactive) */}
      <div className="max-w-5xl mx-auto space-y-8 opacity-40 pointer-events-none filter blur-[2px] select-none">
        
        {/* Header Mockup */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Đăng bài Website
            </h1>
            <p className="text-gray-400 text-sm font-medium">SEO Automation & Content Management.</p>
          </div>
          <div className="px-4 py-2 bg-[#1c1c1e] rounded-xl border border-white/10 flex items-center gap-2 text-gray-500">
             <Globe size={16} />
             <span className="text-xs font-bold">No Website Connected</span>
          </div>
        </div>

        {/* Editor Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Input */}
            <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tiêu đề bài viết (H1)</label>
                        <div className="h-12 bg-[#1c1c1e] rounded-xl border border-white/5 w-full"></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Đường dẫn tĩnh (Slug)</label>
                        <div className="h-10 bg-[#1c1c1e] rounded-xl border border-white/5 w-3/4"></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                            <span>Nội dung bài viết</span>
                            <span className="flex gap-2">
                                <Sparkles size={12} /> AI Rewrite
                            </span>
                        </label>
                        <div className="h-[400px] bg-[#1c1c1e] rounded-xl border border-white/5 w-full p-4 space-y-3">
                            <div className="h-4 bg-white/10 rounded w-full"></div>
                            <div className="h-4 bg-white/10 rounded w-5/6"></div>
                            <div className="h-4 bg-white/10 rounded w-4/6"></div>
                            <br/>
                            <div className="h-32 bg-white/5 rounded-lg border border-white/5 w-full flex items-center justify-center text-gray-600">
                                <ImageIcon size={24} />
                            </div>
                            <br/>
                            <div className="h-4 bg-white/10 rounded w-full"></div>
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Right: Settings */}
            <div className="space-y-6">
                <GlassCard className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Ảnh đại diện (Thumbnail)</label>
                        <div className="aspect-video bg-[#1c1c1e] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-600 gap-2">
                            <Layout size={24} />
                        </div>
                    </div>

                    <div className="space-y-3">
                         <div className="h-px bg-white/10"></div>
                         <div className="flex justify-between items-center text-gray-400">
                             <span className="text-sm">Trạng thái</span>
                             <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs">Publish</span>
                         </div>
                         <div className="flex justify-between items-center text-gray-400">
                             <span className="text-sm">Chuyên mục</span>
                             <span className="bg-[#1c1c1e] border border-white/10 px-2 py-0.5 rounded text-xs">Tin tức</span>
                         </div>
                         <div className="flex justify-between items-center text-gray-400">
                             <span className="text-sm">Tags</span>
                             <span className="bg-[#1c1c1e] border border-white/10 px-2 py-0.5 rounded text-xs">Travel, Hotel</span>
                         </div>
                    </div>

                    <button className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold text-sm opacity-50 cursor-not-allowed">
                        Đăng bài ngay
                    </button>
                </GlassCard>
            </div>
        </div>

      </div>
    </div>
  );
};
