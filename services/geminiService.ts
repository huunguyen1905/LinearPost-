
import { GoogleGenAI, Type } from "@google/genai";
import { Tone, PostType } from "../types";

// --- FIX BUILD ERROR: Khai báo process để tránh lỗi TS khi build trên Vercel ---
declare const process: any;

// Helper: Convert File to Gemini Part (Base64)
const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// 🏨 BRAND BIBLE CONFIGURATION
const BRAND_BIBLE = `
1. ĐỊNH VỊ: Prestige Travel tại Apec Mandala Cham Bay Mũi Né. Phân khúc 5 sao giá bình dân (Affordable Luxury). Slogan ngầm: "Tuyệt tác nghỉ dưỡng bên vịnh thiên đường - Giá chỉ từ 400k".
2. USP: Hồ bơi vô cực ion khoáng lớn nhất Châu Á, Vị trí cung đường biển đẹp nhất VN, Free vé hồ bơi/xe điện/wifi.
3. SẢN PHẨM & GIÁ (Tham khảo):
   - 1GM8 (Cặp đôi): 400k (CN-T6) - 500k (T7).
   - 2GM2 (Bạn bè): 400k (CN-T6) - 500k (T7).
   - GL GN (Gia đình nhỏ): 450k - 550k.
   - 2GM6 (Nhóm 4): 500k - 600k.
   - 2PN/Family: 900k - 1tr.
4. BRAND VOICE (TONE & MOOD): 
   - Chuyên nghiệp, Tinh tế, Khơi gợi cảm xúc (Wanderlust).
   - Ngôn từ sang trọng nhưng gần gũi, mời gọi.
   - Tập trung miêu tả trải nghiệm thực tế, vẻ đẹp visual của khu nghỉ dưỡng.
   - Sử dụng emoji tinh tế, hợp ngữ cảnh (🌊, 🌴, ✨, 📸, 🥂).
   - Tuyệt đối KHÔNG xưng tên cá nhân (như em Hương, mình...).
`;

const getToneInstruction = (tone: Tone) => {
    const toneMap: Record<string, string> = {
      [Tone.PROFESSIONAL]: 'Chuyên nghiệp, đẳng cấp, tập trung vào chất lượng dịch vụ và tiện ích 5 sao.',
      [Tone.VIRAL]: 'Bắt trend, ngắn gọn, giật tít, ngôn ngữ gen Z hoặc từ ngữ mạnh gây tò mò.',
      [Tone.FUNNY]: 'Hài hước, duyên dáng, dí dỏm để tăng tương tác.',
      [Tone.CASUAL]: 'Thư giãn, nhẹ nhàng (Healing), như một lời rủ rê đi trốn khỏi thành phố.',
      [Tone.INSPIRATIONAL]: 'Truyền cảm hứng, mơ mộng, tập trung vào vẻ đẹp thiên nhiên và sự chữa lành.'
    };
    return toneMap[tone] || tone;
};

// ** CHANGED: Accept API Key as an argument **
export const generatePostContent = async (
  topic: string,
  tone: Tone,
  audience: string,
  postType: PostType,
  mediaFiles: File[] = [],
  apiKey: string
): Promise<string> => {
  try {
    const finalKey = apiKey || process.env.API_KEY;
    if (!finalKey) {
        return "Lỗi: Chưa cấu hình Gemini API Key trong Google Sheet (Sheet 'Cấu Hình') hoặc .env.";
    }

    // Initialize AI instance with dynamic key
    const ai = new GoogleGenAI({ apiKey: finalKey });

    let typeInstruction = '';
    switch (postType) {
        case PostType.TEXT_WITH_BACKGROUND:
            typeInstruction = 'QUAN TRỌNG: Dạng bài Text nền màu. Nội dung PHẢI NGẮN GỌN dưới 130 ký tự.';
            break;
        default:
            typeInstruction = 'Dạng bài: Facebook Post tiêu chuẩn.';
            break;
    }

    // Xử lý ảnh (chỉ lấy ảnh, bỏ qua video nếu model không hỗ trợ video trực tiếp qua base64 tốt bằng ảnh)
    const imageParts = [];
    if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
            if (file.type.startsWith('image/')) {
                const part = await fileToGenerativePart(file);
                imageParts.push(part);
            }
        }
    }

    const hasImages = imageParts.length > 0;
    const visionInstruction = hasImages 
        ? `TÔI CÓ ĐÍNH KÈM HÌNH ẢNH THỰC TẾ. Hãy phân tích kỹ hình ảnh này (bối cảnh, màu sắc, không gian, cảm xúc) và kết hợp nó với ý tưởng "${topic}" để viết bài.` 
        : `Ý tưởng chính: "${topic}"`;

    const prompt = `
      VAI TRÒ: Senior Copywriter cho Prestige Travel (Apec Mũi Né).
      
      THÔNG TIN ĐẦU VÀO:
      - ${visionInstruction}
      - Khách hàng mục tiêu: ${audience}
      - Tone giọng: ${getToneInstruction(tone)}
      - ${typeInstruction}
      - BRAND BIBLE: ${BRAND_BIBLE}

      YÊU CẦU ĐỊNH DẠNG (BẮT BUỘC):
      1. CHỈ XUẤT VĂN BẢN THUẦN (Plain Text).
      2. TUYỆT ĐỐI KHÔNG sử dụng Markdown (Không dùng **, __, ##, headers).
      3. KHÔNG in đậm, KHÔNG in nghiêng.
      4. Các ý liệt kê sử dụng gạch đầu dòng (-) hoặc dấu chấm (•) hoặc emoji đầu dòng.
      5. Chia đoạn rõ ràng bằng cách xuống dòng.

      YÊU CẦU NỘI DUNG:
      - Nếu có ảnh, hãy miêu tả vẻ đẹp trong ảnh để dẫn dắt người đọc (Show, don't just tell).
      - Viết một bài đăng Facebook hoàn chỉnh, có Hook thu hút ngay dòng đầu.
      - Không xưng tên cá nhân.
    `;

    // Gọi API với cấu trúc Multimodal
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
          parts: [
              ...imageParts, // Đưa ảnh vào trước
              { text: prompt } // Đưa prompt vào sau
          ]
      }
    });

    return response.text || "Đang phác thảo...";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('API key')) {
        return "Lỗi: API Key không hợp lệ. Vui lòng kiểm tra lại trong Google Sheet.";
    }
    return "Lỗi kết nối AI hoặc ảnh quá lớn.";
  }
};

export const generateVariations = async (
    baseContent: string,
    count: number,
    tone: Tone,
    apiKey: string
): Promise<string[]> => {
    try {
        const finalKey = apiKey || process.env.API_KEY;
        if (!finalKey) return Array(count).fill(baseContent);
        
        const ai = new GoogleGenAI({ apiKey: finalKey });

        const prompt = `
            CONTEXT: Bạn là trợ lý AI chuyên viết lại nội dung (Spin Content) để tránh spam trên Facebook.
            INPUT CONTENT: "${baseContent}"
            TONE: ${getToneInstruction(tone)}
            YÊU CẦU:
            1. Viết lại ${count} phiên bản khác nhau dựa trên nội dung gốc.
            2. Giữ nguyên thông điệp chính và thông tin giá/kỹ thuật.
            3. Thay đổi cấu trúc câu, từ ngữ mở đầu (Hook) và cách kêu gọi hành động (CTA) để tạo sự mới mẻ.
            4. Thay đổi bộ icon/emoji sử dụng.
            5. TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN (Không **, ##). Chỉ text thuần.
            OUTPUT FORMAT: Trả về JSON Array chứa các chuỗi string. Ví dụ: ["Nội dung 1...", "Nội dung 2..."].
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const json = JSON.parse(response.text || '[]');
        return Array.isArray(json) ? json : [baseContent];
    } catch (e) {
        console.error("Error generating variations:", e);
        // Fallback: Return original content repeated if AI fails
        return Array(count).fill(baseContent);
    }
};
