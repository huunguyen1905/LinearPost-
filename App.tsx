
import React, { useState, useEffect, useCallback } from 'react';
import { InputSection } from './components/InputSection';
import { PreviewSection } from './components/PreviewSection';
import { Sidebar } from './components/Sidebar';
import { ScheduledPosts } from './components/ScheduledPosts';
import { Settings } from './components/Settings';
import { WebPosting } from './components/WebPosting';
import { Tone, Destination, ScheduledPost, PostType, PostStatus, UploadFile } from './types';
import { generatePostContent, generateVariations } from './services/geminiService';
import { sheetService, BatchPostItem } from './services/sheetService';
import { PenLine, Eye } from 'lucide-react';

// --- HELPERS ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// *** UPGRADE: Tối ưu nén ảnh ***
const compressImage = async (file: File, quality = 0.7, maxWidth = 1600): Promise<string> => {
  if (file.type.startsWith('video')) return fileToBase64(file);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = () => {
        resolve(fileToBase64(file));
      }
    };
    reader.onerror = () => resolve(fileToBase64(file));
  });
};

// *** UPDATE: Format chuẩn dd/MM/yyyy HH:mm:ss theo yêu cầu n8n ***
const formatDateForSheet = (dateObj: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(dateObj.getDate());
  const m = pad(dateObj.getMonth() + 1);
  const y = dateObj.getFullYear();
  const h = pad(dateObj.getHours());
  const min = pad(dateObj.getMinutes());
  const s = pad(dateObj.getSeconds());
  
  // Format khớp với cấu hình n8n: 20/12/2025 11:51:29
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
};

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'schedule' | 'settings' | 'web'>('create');
  
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Input State
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [postType, setPostType] = useState<PostType>(PostType.TEXT_ONLY);
  const [audience, setAudience] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState('');

  const [mandatoryContent, setMandatoryContent] = useState(
    `🏨 Prestige Travel - Apec Mandala Cham Bay Mũi Né\n☎️ Hotline/Zalo: 093.888.xxxx (Booking 24/7)\n✨ Giá chỉ từ 400k/người - Bao vé hồ bơi & xe điện`
  );
  const [seedingComment, setSeedingComment] = useState('');
  
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  
  const [postStatus, setPostStatus] = useState<PostStatus>('scheduled');
  const [autoRewrite, setAutoRewrite] = useState(true);

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);

  // --- DATA FETCHING ---
  
  const fetchPosts = useCallback(async (silent: boolean | any = false) => {
    const isSilent = typeof silent === 'boolean' ? silent : false;

    if (!isSilent) setIsLoadingPosts(true);
    try {
        const posts = await sheetService.getPosts();
        if (Array.isArray(posts)) {
            setScheduledPosts(posts);
        }
    } catch (error) {
        console.error("Failed to fetch posts", error);
    } finally {
        if (!isSilent) setIsLoadingPosts(false);
    }
  }, []);

  const fetchDestinations = useCallback(async () => {
    const dests = await sheetService.getDestinations();
    setAvailableDestinations(dests);
    if (dests.length > 0 && destinations.length === 0) {
      setDestinations([dests[0].id]);
    }
  }, [destinations.length]);

  const fetchConfig = useCallback(async () => {
      const config = await sheetService.getConfig();
      if (config && config['GEMINI_API_KEY']) {
          setGeminiKey(config['GEMINI_API_KEY']);
      }
  }, []);

  useEffect(() => {
    fetchDestinations();
    fetchConfig();
    fetchPosts(false);

    const intervalId = setInterval(() => {
        fetchPosts(true); 
    }, 30000);

    const onFocus = () => {
        fetchPosts(true);
        fetchDestinations();
        fetchConfig();
    };

    window.addEventListener('focus', onFocus);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', onFocus);
    };
  }, [fetchDestinations, fetchPosts, fetchConfig]);

  useEffect(() => {
      if (currentView === 'schedule') {
          fetchPosts(false);
      }
      if (currentView === 'create' && availableDestinations.length === 0) {
          fetchDestinations();
      }
  }, [currentView, fetchPosts, fetchDestinations, availableDestinations.length]);

  useEffect(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    setScheduledTime(localISOTime);
  }, []);

  useEffect(() => {
    return () => { mediaPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, []); 
  
  useEffect(() => {
    const newPreviews = mediaFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(newPreviews);

    if (mediaFiles.length > 0) {
        const firstFile = mediaFiles[0];
        if (firstFile.type.startsWith('video')) {
            setPostType(PostType.VIDEO);
        } else {
            if (mediaFiles.length > 1) {
                setPostType(PostType.MULTIPLE_IMAGES);
            } else {
                setPostType(PostType.SINGLE_IMAGE);
            }
        }
    } else {
        if (postType !== PostType.TEXT_WITH_BACKGROUND) {
            setPostType(PostType.TEXT_ONLY);
        }
    }

    return () => {
        newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]);
  
  useEffect(() => {
    if (scheduleMode === 'later') {
        setPostStatus('scheduled');
    } 
  }, [scheduleMode]);

  const handleGenerate = async () => {
    if (!generatedContent && mediaFiles.length === 0) return;
    
    setIsGenerating(true);
    setMobileTab('editor'); 
    
    setSendSuccess(null);
    try {
      const content = await generatePostContent(generatedContent, tone, audience, postType, mediaFiles, geminiKey);
      setGeneratedContent(content);
      if (window.innerWidth < 1024) {
        setTimeout(() => setMobileTab('preview'), 500);
      }
    } catch (error) {
      console.error(error);
      setGeneratedContent("Lỗi khi tạo nội dung. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setMediaFiles(prev => [...prev, ...newFiles]);
  };
  
  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleDestination = (id: string) => {
    setDestinations(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleAddDestination = async (newDest: Destination) => {
    setAvailableDestinations(prev => [...prev, newDest]);
    setDestinations(prev => [...prev, newDest.id]);
    await sheetService.addDestination(newDest);
  };

  const handleRemoveDestination = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa trang này không?')) {
        setAvailableDestinations(prev => prev.filter(d => d.id !== id));
        setDestinations(prev => prev.filter(dId => dId !== id));
        await sheetService.removeDestination(id);
    }
  };

  const handleSendToScheduler = async () => {
    if ((!generatedContent && mediaFiles.length === 0 && postType !== PostType.TEXT_WITH_BACKGROUND) || destinations.length === 0) return;

    setIsSending(true);
    setLoadingText('Khởi tạo...');
    
    const videoUrls: string[] = [];
    const imageUrls: string[] = [];

    if (mediaFiles.length > 0) {
        setLoadingText(`Đang xử lý ${mediaFiles.length} files...`);
        try {
            const uploadPromises = mediaFiles.map(async (file, index) => {
                const compressedData = await compressImage(file);
                
                const payload: UploadFile = {
                    data: compressedData,
                    mimeType: file.type,
                    name: file.name
                };

                return sheetService.uploadMedia(payload).then(res => {
                    return { index, res }; 
                });
            });

            setLoadingText(`Đang tải lên song song ${mediaFiles.length} file...`);
            
            const results = await Promise.all(uploadPromises);

            let successCount = 0;
            results.forEach(({ res }) => {
                if (res && res.url) {
                    successCount++;
                    if (res.type === 'video') videoUrls.push(res.url);
                    else imageUrls.push(res.url);
                }
            });

            if (successCount === 0 && mediaFiles.length > 0) {
                throw new Error("Tất cả file tải lên đều thất bại.");
            }
            
        } catch (e) {
            console.error("Media Upload Error:", e);
            alert("Lỗi tải lên media. Có thể do file quá lớn hoặc mạng yếu. Hãy thử lại với ít ảnh hơn.");
            setIsSending(false);
            setLoadingText('');
            return;
        }
    }

    let contents = [generatedContent];
    
    if (destinations.length > 1 && autoRewrite) {
        setLoadingText('Đang nhân bản & viết lại nội dung...');
        try {
            const variations = await generateVariations(generatedContent, destinations.length, tone, geminiKey);
            if (variations.length < destinations.length) {
                while (variations.length < destinations.length) {
                    variations.push(variations[variations.length % variations.length]);
                }
            }
            contents = variations;
        } catch (e) {
            contents = Array(destinations.length).fill(generatedContent);
        }
    } else {
        contents = Array(destinations.length).fill(generatedContent);
    }

    setLoadingText('Đang lưu vào hệ thống...');
    const selectedDests = availableDestinations.filter(d => destinations.includes(d.id));
    
    const baseTime = scheduleMode === 'now' ? new Date() : new Date(scheduledTime);
    
    const batchItems: BatchPostItem[] = selectedDests.map((dest, index) => {
        let postTime = new Date(baseTime);
        if (scheduleMode === 'later' && index > 0) {
            postTime = new Date(baseTime.getTime() + index * 15 * 60000); 
        }
        
        return {
            id: (Date.now() + index).toString(),
            content: contents[index % contents.length],
            destinations: [dest.name],
            destinationIds: [dest.id], // NEW: Send Page ID
            scheduledTime: formatDateForSheet(postTime),
            mandatoryContent: mandatoryContent,
            seedingComment: seedingComment
        };
    });

    const isVideo = mediaFiles.length > 0 && mediaFiles[0].type.startsWith('video');
    
    const topicDerived = generatedContent.slice(0, 50) + (generatedContent.length > 50 ? '...' : '') || 'Bài viết mới';
    
    const commonData: Partial<ScheduledPost> = {
        topic: topicDerived,
        mediaType: isVideo ? 'video' : 'image',
        postType: postType, 
        status: postStatus,
        createdAt: formatDateForSheet(new Date())
    };

    console.log("SENDING PAYLOAD TO SHEET:", {
        videoUrls,
        imageUrls,
        batchItems,
        commonData
    });

    try {
      const success = await sheetService.createBatchPosts(videoUrls, imageUrls, batchItems, commonData);
      
      if (success) {
        setSendSuccess(true);
        setTimeout(() => {
            setSendSuccess(null);
            setGeneratedContent('');
            setSeedingComment('');
            setMediaFiles([]); 
            setMediaPreviews([]);
            fetchPosts(false); // Force refresh list
            setCurrentView('schedule');
            setMobileTab('editor'); 
        }, 500);
      } else {
        setSendSuccess(false);
        alert("Lỗi gửi dữ liệu. Vui lòng kiểm tra quyền truy cập của Script (Anyone) hoặc Deploy bản mới.");
      }
    } catch (e) {
      console.error("Batch Create Error:", e);
      setSendSuccess(false);
      alert("Lỗi mạng không xác định.");
    } finally {
      setIsSending(false);
      setLoadingText('');
    }
  };

  const handleDeletePost = async (id: string) => {
    if(window.confirm('Xóa bài viết?')) {
        setScheduledPosts(prev => prev.filter(p => p.id !== id));
        await sheetService.deletePost(id);
    }
  };

  const handleUpdatePost = async (id: string, updates: Partial<ScheduledPost>) => {
    setScheduledPosts(prev => prev.map(post => 
        post.id === id ? { ...post, ...updates } : post
    ));
    await sheetService.updatePost(id, updates);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-screen overflow-hidden bg-background font-sans text-white">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 h-full relative overflow-hidden flex flex-col">
        {currentView === 'create' && (
           <div className="flex flex-col lg:flex-row h-full w-full animate-fade-in overflow-hidden relative">
              
              {/* TOP MOBILE TABS */}
              <div className="lg:hidden absolute top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-white/10">
                   <button
                        onClick={() => setMobileTab('editor')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            mobileTab === 'editor' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
                        }`}
                   >
                        <PenLine size={14} /> Soạn thảo
                   </button>
                   <button
                        onClick={() => setMobileTab('preview')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            mobileTab === 'preview' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'
                        }`}
                   >
                        <Eye size={14} /> Xem trước
                   </button>
                </div>
              </div>
              
              {/* INPUT SECTION */}
              <div className={`w-full lg:w-[60%] h-full border-r border-white/5 order-2 lg:order-1 overflow-hidden transition-all duration-300 absolute inset-0 lg:static z-10 lg:z-auto bg-background pt-[60px] lg:pt-0 ${
                  mobileTab === 'editor' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}>
                <div className="h-full overflow-y-auto pb-40 lg:pb-0 custom-scrollbar">
                    <InputSection 
                        tone={tone} setTone={setTone} postType={postType} setPostType={setPostType}
                        audience={audience} setAudience={setAudience} onGenerate={handleGenerate} isGenerating={isGenerating}
                        generatedContent={generatedContent} setGeneratedContent={setGeneratedContent}
                        mandatoryContent={mandatoryContent} setMandatoryContent={setMandatoryContent}
                        seedingComment={seedingComment} setSeedingComment={setSeedingComment}
                        destinations={destinations} toggleDestination={handleToggleDestination} availableDestinations={availableDestinations}
                        scheduleMode={scheduleMode} setScheduleMode={setScheduleMode} scheduledTime={scheduledTime} setScheduledTime={setScheduledTime}
                        mediaFiles={mediaFiles} onFilesChange={handleFilesChange} onRemoveFile={handleRemoveFile}
                        postStatus={postStatus} setPostStatus={setPostStatus}
                        autoRewrite={autoRewrite} setAutoRewrite={setAutoRewrite}
                    />
                </div>
              </div>

              {/* PREVIEW SECTION */}
              <div className={`w-full lg:w-[40%] h-full bg-surface order-1 lg:order-2 overflow-hidden border-b lg:border-b-0 border-white/5 transition-all duration-300 absolute inset-0 lg:static z-10 lg:z-auto pt-[60px] lg:pt-0 ${
                  mobileTab === 'preview' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              }`}>
                <PreviewSection 
                  content={generatedContent} mediaPreviews={mediaPreviews}
                  mediaType={mediaFiles[0]?.type.startsWith('video') ? 'video' : 'image'} postType={postType}
                  mandatoryContent={mandatoryContent} seedingComment={seedingComment} isGenerating={isGenerating}
                  onSend={handleSendToScheduler} isSending={isSending} sendSuccess={sendSuccess}
                  scheduleMode={scheduleMode} scheduledTime={scheduledTime}
                  selectedCount={destinations.length}
                  loadingText={loadingText}
                />
              </div>

           </div>
        )}
        {currentView === 'schedule' && (
           <div className="h-full w-full animate-fade-in bg-background pb-24 lg:pb-0">
              <ScheduledPosts 
                posts={scheduledPosts} 
                onDelete={handleDeletePost} 
                onUpdate={handleUpdatePost} 
                availableDestinations={availableDestinations} 
                onRefresh={() => fetchPosts(false)}
                isLoading={isLoadingPosts}
              />
           </div>
        )}
        {currentView === 'settings' && (
           <div className="h-full w-full animate-fade-in bg-background pb-24 lg:pb-0">
              <Settings destinations={availableDestinations} onAddDestination={handleAddDestination} onRemoveDestination={handleRemoveDestination} />
           </div>
        )}
        {currentView === 'web' && (
           <div className="h-full w-full animate-fade-in bg-background pb-24 lg:pb-0">
              <WebPosting />
           </div>
        )}
      </div>
    </div>
  );
}

export default App;
