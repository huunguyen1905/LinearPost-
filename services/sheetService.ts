
import { Destination, ScheduledPost, UploadFile, PostStatus, PostType } from "../types";

// Đổi key sang V4 để đảm bảo reset cache
const STORAGE_KEY = 'LINEAR_POST_SCRIPT_URL_V4'; 
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvV2UKyCjQR6EvGQH7-TIX3fsj8mxW6K31trv_VrWJK-bxxQ2H86PGCo8vY7nVf8_i/exec';

interface SheetResponse {
  success: boolean;
  message?: string;
  data?: any;
  url?: string;
  type?: 'video' | 'image';
  files?: Array<{ url: string; type: 'video' | 'image' }>; // Support Batch
}

export interface BatchPostItem {
    id: string;
    content: string;
    destinations: string[]; 
    scheduledTime: string; 
    mandatoryContent: string;
    seedingComment: string;
}

// --- STATUS MAPPING UTILS ---

const STATUS_TO_VN: Record<string, string> = {
    'draft': 'Nháp',
    'scheduled': 'Chờ Đăng',
    'queue': 'Hàng chờ',
    'published': 'Thành Công',
    'failed': 'Lỗi'
};

const STATUS_FROM_VN: Record<string, PostStatus> = {
    'Nháp': 'draft',
    'Chờ Đăng': 'scheduled',
    'Hàng chờ': 'queue',
    'Thành Công': 'published',
    'Lỗi': 'failed',
    'draft': 'draft',
    'scheduled': 'scheduled',
    'queue': 'queue',
    'published': 'published',
    'failed': 'failed'
};

const normalizeStatus = (raw: any): PostStatus => {
    const val = String(raw).trim();
    return STATUS_FROM_VN[val] || (['draft', 'scheduled', 'queue', 'published', 'failed'].includes(val) ? val as PostStatus : 'draft');
};

const normalizeDate = (dateStr: string): string => {
    try {
        if (!dateStr) return '';
        const cleanStr = String(dateStr).replace(/'/g, '').trim(); 
        
        if (cleanStr.includes('-') && cleanStr.length > 10) return cleanStr;
        
        const parts = cleanStr.split(' ');
        const dPart = parts[0];
        const tPart = parts[1] || '00:00:00';

        if (dPart.includes('/')) {
            const [day, month, year] = dPart.split('/');
            return `${year}-${month}-${day}T${tPart}`;
        }
        
        return cleanStr;
    } catch (e) {
        console.error("Date Parse Error:", dateStr);
        return dateStr;
    }
};

// *** FIX: Hàm chuyển đổi link Drive sang dạng hiển thị được ***
const convertDriveLink = (link: string): string => {
    if (!link) return '';
    const cleanLink = link.trim();
    
    // Tìm ID file trong link Drive
    // Hỗ trợ các dạng: /file/d/ID, id=ID
    const idMatch = cleanLink.match(/[-\w]{25,}/);
    
    if (idMatch && (cleanLink.includes('drive.google.com') || cleanLink.includes('docs.google.com'))) {
        // Sử dụng link lh3.googleusercontent.com để bypass CORS và load nhanh hơn
        // d/ID là format 'download/display' không cần redirect
        return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
    }
    
    return cleanLink;
};

export const sheetService = {
  getScriptUrl(): string {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored.trim() : DEFAULT_SCRIPT_URL.trim();
  },

  setScriptUrl(url: string) {
    localStorage.setItem(STORAGE_KEY, url.trim());
  },

  // --- DESTINATIONS ---
  async getDestinations(): Promise<Destination[]> {
    const url = this.getScriptUrl();
    if (!url) return [];
    try {
      const targetUrl = `${url}?action=getDestinations&_t=${Date.now()}`;
      const response = await fetch(targetUrl, { method: 'GET' });
      const json: SheetResponse = await response.json();
      return (json.success && Array.isArray(json.data)) ? json.data : [];
    } catch (error) {
      console.error("getDestinations Error:", error);
      return [];
    }
  },

  async addDestination(dest: Destination): Promise<boolean> {
    return this.sendRequest('addDestination', dest);
  },

  // *** NEW: Update Destination ***
  async updateDestination(dest: Destination): Promise<boolean> {
    return this.sendRequest('updateDestination', dest);
  },

  async removeDestination(id: string): Promise<boolean> {
    return this.sendRequest('removeDestination', { id });
  },

  // --- POSTS ---
  async getPosts(): Promise<ScheduledPost[]> {
    const url = this.getScriptUrl();
    if (!url) return [];
    try {
      const targetUrl = `${url}?action=getPosts&_t=${Date.now()}`;
      const response = await fetch(targetUrl, { method: 'GET' });
      const json: SheetResponse = await response.json();
      
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((r: any): ScheduledPost => {
            // FIX: Xử lý link ảnh bằng convertDriveLink
            const videoLinks = r[8] ? String(r[8]).split('\n').filter(Boolean) : [];
            const imageLinks = r[9] ? String(r[9]).split('\n').filter(Boolean).map(convertDriveLink) : [];
            
            const allMedia = [...videoLinks, ...imageLinks];
            const content = r[5] ? String(r[5]) : "";
            const topic = content.length > 60 ? content.substring(0, 60) + "..." : (content || "Bài viết không tiêu đề");
            
            const rawStatus = r[2];
            const statusEnum = normalizeStatus(rawStatus);

            const rawTime = r[4] ? String(r[4]) : '';
            const isoTime = normalizeDate(rawTime);

            return {
                id: String(r[0]).replace(/'/g, ''), 
                destinations: r[1] ? String(r[1]).split(', ') : [],
                status: statusEnum, 
                postType: (r[3] || 'Đăng Một Ảnh') as PostType,
                scheduledTime: isoTime, 
                content: content,
                mandatoryContent: r[6] || '',
                seedingComment: r[7] || '',
                mediaPreview: allMedia.length > 0 ? allMedia[0] : null,
                mediaType: (videoLinks.length > 0 ? 'video' : 'image') as 'video' | 'image',
                topic: topic, 
                createdAt: new Date().toISOString()
            };
        }).reverse();
      }
      return [];
    } catch (error) { 
        console.error("getPosts Error:", error);
        return []; 
    }
  },

  // Legacy Single Upload
  async uploadMedia(file: UploadFile): Promise<{ url: string; type: 'video' | 'image' } | null> {
      const url = this.getScriptUrl();
      if (!url) return null;

      try {
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'uploadMedia', payload: file })
          });
          const json: SheetResponse = await response.json();
          if (json.success && json.url) {
              return { url: json.url, type: json.type || 'image' };
          }
          return null;
      } catch (e) {
          console.error("Upload Media Fetch Error:", e);
          return null;
      }
  },

  // *** NEW: Batch Upload Method ***
  async uploadBatchMedia(files: UploadFile[]): Promise<Array<{ url: string; type: 'video' | 'image' }> | null> {
      const url = this.getScriptUrl();
      if (!url) return null;

      try {
          // Gửi 1 request duy nhất chứa mảng files
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ 
                  action: 'uploadBatchMedia', 
                  payload: { files: files } 
              })
          });
          const json: SheetResponse = await response.json();
          
          if (json.success && json.files && Array.isArray(json.files)) {
              return json.files;
          }
          return null;
      } catch (e) {
          console.error("Batch Upload Fetch Error:", e);
          return null;
      }
  },

  async createBatchPosts(
      videoUrls: string[],
      imageUrls: string[],
      items: BatchPostItem[],
      commonData: Partial<ScheduledPost>
  ): Promise<boolean> {
      
      const statusVN = STATUS_TO_VN[commonData.status || 'queue'] || 'Hàng chờ';

      const payload = {
          videoUrls: videoUrls.join('\n'),
          imageUrls: imageUrls.join('\n'),
          items: items || [],
          commonData: {
              status: statusVN,
              postType: commonData.postType || 'Đăng Một Ảnh'
          }
      };
      return this.sendRequest('createBatchPosts', payload);
  },

  async updatePost(id: string, updates: Partial<ScheduledPost>): Promise<boolean> {
    const payload: any = { id, ...updates };
    
    if (updates.status) {
        payload.status = STATUS_TO_VN[updates.status] || updates.status;
    }

    return this.sendRequest('updatePost', payload);
  },

  async deletePost(id: string): Promise<boolean> {
    return this.sendRequest('deletePost', { id });
  },

  async sendRequest(action: string, payload: any): Promise<boolean> {
    const url = this.getScriptUrl();
    if (!url) {
        console.error("Script URL is missing or empty.");
        return false;
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action, payload })
      });
      const result: SheetResponse = await response.json();
      
      if (!result.success) {
          console.error(`Backend Error (${action}):`, result.message);
      }
      return result.success;
    } catch (error) {
      console.error(`Network Error (${action}):`, error);
      return false;
    }
  }
};
