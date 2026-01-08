
import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, User } from 'lucide-react';
import { PostType } from '../types';

interface FacebookMockupProps {
  content: string;
  isGenerating: boolean;
  mediaPreviews?: string[];
  mediaType?: 'image' | 'video';
  postType?: PostType;
  mandatoryContent?: string;
  seedingComment?: string;
}

export const FacebookMockup: React.FC<FacebookMockupProps> = ({ 
  content, 
  isGenerating, 
  mediaPreviews = [], 
  mediaType = 'image',
  postType,
  mandatoryContent,
  seedingComment
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const CHAR_LIMIT = 280;

  // Reset expanded state when content changes (new generation)
  useEffect(() => {
    setIsExpanded(false);
  }, [content]);

  const renderMediaGrid = () => {
    if (mediaPreviews.length === 0) return null;

    if (mediaType === 'video' || postType?.includes('Video')) {
      return (
         <div className="w-full bg-black flex items-center justify-center">
            <video 
              src={mediaPreviews[0]} 
              controls 
              className={`max-w-full max-h-[500px] object-contain ${postType?.includes('Story') ? 'aspect-[9/16] h-[500px]' : 'w-full'}`} 
            />
         </div>
      );
    }

    const count = mediaPreviews.length;

    // Layout 1: Single Image
    if (count === 1) {
      return (
        <div className="w-full bg-black flex items-center justify-center">
           <img 
              src={mediaPreviews[0]} 
              alt="post" 
              className={`max-h-[500px] object-contain w-full ${postType?.includes('Story') ? 'aspect-[9/16]' : ''}`} 
            />
        </div>
      );
    }

    // Layout 2: Two Images
    if (count === 2) {
      return (
        <div className="w-full aspect-video grid grid-cols-2 gap-1 bg-white">
           <img src={mediaPreviews[0]} className="w-full h-full object-cover" />
           <img src={mediaPreviews[1]} className="w-full h-full object-cover" />
        </div>
      );
    }

    // Layout 3: Three Images
    if (count === 3) {
      return (
        <div className="w-full aspect-square grid grid-cols-2 gap-1 bg-white">
           <div className="row-span-2 relative">
              <img src={mediaPreviews[0]} className="w-full h-full object-cover absolute inset-0" />
           </div>
           <div className="flex flex-col gap-1 h-full">
              <div className="relative h-1/2">
                <img src={mediaPreviews[1]} className="w-full h-full object-cover absolute inset-0" />
              </div>
              <div className="relative h-1/2">
                <img src={mediaPreviews[2]} className="w-full h-full object-cover absolute inset-0" />
              </div>
           </div>
        </div>
      );
    }

    // Layout 4+
    return (
        <div className="w-full aspect-square flex flex-col gap-1 bg-white">
           <div className="w-full h-[60%] relative">
               <img src={mediaPreviews[0]} className="w-full h-full object-cover absolute inset-0" />
           </div>
           <div className="w-full h-[40%] grid grid-cols-3 gap-1">
               <img src={mediaPreviews[1]} className="w-full h-full object-cover" />
               <img src={mediaPreviews[2]} className="w-full h-full object-cover" />
               <div className="relative w-full h-full">
                  <img src={(mediaPreviews[3] || mediaPreviews[0])} className="w-full h-full object-cover" />
                  {count > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">+{count - 3}</span>
                    </div>
                  )}
               </div>
           </div>
        </div>
    );
  };

  const renderTextContent = () => {
      if (postType === PostType.TEXT_WITH_BACKGROUND) {
        return (
            <div className="w-full aspect-square bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center p-6 text-center rounded-xl text-white font-bold text-xl shadow-inner break-words flex-col gap-2">
                <span>{content || "Nội dung..."}</span>
                {mandatoryContent && <span className="text-xs font-normal opacity-80 mt-2 whitespace-pre-wrap">{mandatoryContent}</span>}
            </div>
        );
      }

      const shouldTruncate = content.length > CHAR_LIMIT && !isExpanded;
      const displayContent = shouldTruncate ? content.slice(0, CHAR_LIMIT) + '...' : content;

      return (
        <div className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap font-normal">
            {displayContent || (mediaPreviews.length === 0 && <span className="text-gray-400 italic font-light text-xs">Bản xem trước...</span>)}
            
            {shouldTruncate && (
                <span 
                    onClick={() => setIsExpanded(true)}
                    className="text-gray-500 font-semibold cursor-pointer hover:underline ml-1"
                >
                    Xem thêm
                </span>
            )}

            {/* Chỉ hiển thị Mandatory Content khi đã mở rộng hoặc nội dung ngắn */}
            {(!shouldTruncate && mandatoryContent) && (
                <div className="mt-2 text-blue-900/80 font-normal whitespace-pre-wrap animate-fade-in">
                    {mandatoryContent}
                </div>
            )}
        </div>
      );
  };

  return (
    // Changed fixed w-[375px] h-[667px] to responsive classes
    <div className="w-full max-w-[375px] min-w-[320px] bg-white text-black rounded-[32px] overflow-hidden shadow-2xl border-[6px] border-surface relative mx-auto flex flex-col h-auto min-h-[600px]">
      {/* Status Bar Mockup */}
      <div className="h-10 bg-white flex justify-between items-center px-6 pt-2 flex-shrink-0 z-20">
        <span className="text-[10px] font-semibold text-black">9:41</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-black/10"></div>
          <div className="w-3 h-3 rounded-full bg-black/10"></div>
          <div className="w-3 h-3 rounded-full bg-black/10"></div>
        </div>
      </div>

      {/* App Header */}
      <div className="h-10 border-b border-gray-100 flex items-center justify-center font-bold text-blue-600 text-base flex-shrink-0 relative z-20 bg-white/95 backdrop-blur-sm">
        facebook
        {postType && (
            <div className="absolute right-4 top-2.5 text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {postType.replace(/_/g, ' ')}
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="bg-white mb-2 pb-2">
          {/* Post Header */}
          <div className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                AI
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900 leading-tight">Trang Của Bạn</div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                  <span>Vừa xong</span>
                  <span>•</span>
                  <Globe size={10} />
                </div>
              </div>
            </div>
            <MoreHorizontal className="text-gray-500" size={18} />
          </div>

          {/* Post Content */}
          <div className="px-3 mb-2">
            {isGenerating ? (
              <div className="space-y-2 animate-pulse py-2">
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
              </div>
            ) : (
              renderTextContent()
            )}
          </div>

          {/* Post Media */}
          {postType !== PostType.TEXT_WITH_BACKGROUND && renderMediaGrid()}

          <div className="px-3">
             {/* Interaction Stats */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center border border-white">
                  <ThumbsUp size={8} className="text-white fill-current" />
                </div>
                <span>Thích</span>
              </div>
              <div className="flex gap-2">
                <span>{seedingComment ? '1' : '0'} bình luận</span>
              </div>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center py-1 mt-0.5">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded active:bg-gray-50 transition-colors">
                <ThumbsUp size={16} className="text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-500">Thích</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded active:bg-gray-50 transition-colors">
                <MessageCircle size={16} className="text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-500">Bình luận</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded active:bg-gray-50 transition-colors">
                <Share2 size={16} className="text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-500">Chia sẻ</span>
              </button>
            </div>
            
            {/* Seeding Comment */}
            {seedingComment && (
                <div className="mt-2 pt-2 border-t border-gray-100 animate-fade-in">
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[8px] shadow-sm flex-shrink-0">
                            AI
                        </div>
                        <div className="flex-1">
                            <div className="bg-gray-100 rounded-xl px-2.5 py-1.5 inline-block">
                                <span className="font-bold text-[10px] text-gray-900 block">Trang Của Bạn</span>
                                <span className="text-[10px] text-gray-800 whitespace-pre-wrap">{seedingComment}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full pointer-events-none z-30"></div>
    </div>
  );
};
