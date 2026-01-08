
export enum Tone {
  PROFESSIONAL = 'Professional',
  VIRAL = 'Viral',
  FUNNY = 'Funny',
  CASUAL = 'Casual',
  INSPIRATIONAL = 'Inspirational'
}

export enum PostType {
  MULTIPLE_IMAGES = 'Đăng Nhiều Ảnh',
  SINGLE_IMAGE = 'Đăng Một Ảnh',
  TEXT_ONLY = 'Text',
  VIDEO = 'Video',
  TEXT_WITH_BACKGROUND = 'Text_Kèm_Background'
}

export type PostStatus = 'draft' | 'scheduled' | 'queue' | 'published' | 'failed';

export interface PostState {
  tone: Tone;
  audience: string;
  content: string;
  isGenerating: boolean;
  destinations: string[];
}

export interface Destination {
  id: string; // Page ID
  name: string; // Page Name
  accessToken: string; // Access Token
  type: 'page' | 'group';
  icon?: string; 
}

export interface WebhookResponse {
  success: boolean;
  message: string;
}

export interface UploadFile {
  data: string; // base64
  mimeType: string;
  name: string;
}

export interface ScheduledPost {
  id: string;
  topic: string;
  content: string;
  mediaPreview: string | null; // Keep single preview for List View UI compatibility
  mediaType: 'image' | 'video';
  
  // New: Support multiple file uploads
  mediaUploads?: UploadFile[];
  
  // New: Mandatory content & Seeding
  mandatoryContent?: string;
  seedingComment?: string;
  
  postType?: PostType;
  destinations: string[];
  scheduledTime: string;
  status: PostStatus;
  createdAt: string;
}