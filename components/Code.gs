
/**
 * LINEAR POST AI - BACKEND SCRIPT V8 (Add Edit Destination)
 * ---------------------------------------------
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Dán toàn bộ code này vào Apps Script.
 * 2. Thay MEDIA_FOLDER_ID bằng ID thư mục ảnh của bạn.
 * 3. Lưu file (Ctrl + S).
 * 4. Bấm 'Triển khai' (Deploy) -> 'Triển khai mới' (New deployment) -> Lấy URL mới.
 */

// --- CẤU HÌNH ---
var MEDIA_FOLDER_ID = "HAY_THAY_ID_THU_MUC_DRIVE_VAO_DAY"; 

var SHEET_POSTS = "Bang_1";
var SHEET_PAGES = "Page FB";

// --- KHỞI TẠO WEB APP ---
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    var postData = {};
    
    // Parse JSON Body
    if (e.postData && e.postData.contents) {
       try { postData = JSON.parse(e.postData.contents); } catch (e) {
         return responseJSON({ success: false, message: "Invalid JSON Body" });
       }
    }
    
    var action = params.action || postData.action;
    var payload = postData.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'getPosts': return responseJSON(getPosts(ss));
      case 'createBatchPosts': return responseJSON(createBatchPosts(ss, payload));
      case 'updatePost': return responseJSON(updatePost(ss, payload));
      case 'deletePost': return responseJSON(deletePost(ss, payload));
      case 'uploadMedia': return responseJSON(uploadMedia(payload));
      case 'uploadBatchMedia': return responseJSON(uploadBatchMedia(payload));
      case 'getDestinations': return responseJSON(getDestinations(ss));
      case 'addDestination': return responseJSON(addDestination(ss, payload));
      case 'updateDestination': return responseJSON(updateDestination(ss, payload)); // NEW: Update Page Info
      case 'removeDestination': return responseJSON(removeDestination(ss, payload));
      case 'setupSheet': return responseJSON(setupSheet());
      default: return responseJSON({ success: false, message: "Invalid Action" });
    }
  } catch (err) {
    return responseJSON({ success: false, message: "Server Error: " + err.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// --- HÀM SETUP SHEET (CHẠY THỦ CÔNG 1 LẦN) ---
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SETUP SHEET: Bang_1 (Bài viết)
  var sheet1 = ss.getSheetByName(SHEET_POSTS);
  if (sheet1) { ss.deleteSheet(sheet1); } // Xóa cũ tạo mới để đảm bảo sạch sẽ
  sheet1 = ss.insertSheet(SHEET_POSTS);
  
  var headers1 = [
    "STT",              // A
    "Trang FB",         // B
    "Trạng thái",       // C
    "Loại bài viết",    // D
    "Thời gian đăng",   // E
    "Nội dung chính",   // F
    "Nội dung bắt buộc",// G
    "Bình luận",        // H
    "Link Video",       // I
    "Link ảnh",         // J
    "Link FB"           // K
  ];
  
  // Format Header
  var headerRange = sheet1.getRange(1, 1, 1, headers1.length);
  headerRange.setValues([headers1]);
  headerRange.setFontWeight("bold").setBackground("#fce5cd").setHorizontalAlignment("center");
  sheet1.setFrozenRows(1);

  // Format Data Columns
  var lastCol = headers1.length;
  var fullRange = sheet1.getRange(2, 1, 999, lastCol);
  fullRange.setVerticalAlignment("top"); 
  fullRange.setFontFamily("Arial").setFontSize(10);
  
  // *** QUAN TRỌNG: Cài đặt Wrap (Xuống dòng) cho toàn bộ cột nội dung ***
  sheet1.getRange("F:H").setWrap(true).setVerticalAlignment("top");

  // Định dạng Text thô (@) cho cột Nội dung để tránh lỗi hiển thị công thức
  sheet1.getRange(2, 6, 999, 3).setNumberFormat("@"); // Cột F, G, H (Nội dung)

  // Chỉnh độ rộng cột cho dễ nhìn
  sheet1.setColumnWidth(1, 120); // STT
  sheet1.setColumnWidth(2, 150); // Trang FB
  sheet1.setColumnWidth(4, 120); // Loại bài
  sheet1.setColumnWidth(5, 130); // Thời gian
  sheet1.setColumnWidth(6, 350); // Nội dung chính (Rộng nhất)
  sheet1.setColumnWidth(7, 200); // Nội dung bắt buộc
  sheet1.setColumnWidth(8, 200); // Bình luận
  
  // 2. SETUP SHEET: Page FB
  var sheet2 = ss.getSheetByName(SHEET_PAGES);
  if (!sheet2) { sheet2 = ss.insertSheet(SHEET_PAGES); }
  var headers2 = ["Tên Page", "ID Page", "Access Token"];
  sheet2.getRange(1, 1, 1, 3).setValues([headers2]).setFontWeight("bold").setBackground("#d9ead3");
  sheet2.setFrozenRows(1);
  sheet2.setColumnWidth(1, 150);
  sheet2.setColumnWidth(2, 150);
  sheet2.setColumnWidth(3, 300); // Token rộng

  return { success: true, message: "Đã thiết lập lại cấu trúc bảng tính chuẩn!" };
}

// --- LOGIC BÀI VIẾT ---

function getPosts(ss) {
  var sheet = ss.getSheetByName(SHEET_POSTS);
  if (!sheet) return { success: true, data: [] };
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  
  // Đọc toàn bộ dữ liệu (A -> K)
  var data = sheet.getRange(2, 1, lastRow - 1, 11).getDisplayValues(); // Dùng getDisplayValues để lấy string chuẩn
  return { success: true, data: data };
}

function createBatchPosts(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_POSTS);
  if (!sheet) return { success: false, message: "Chưa chạy setupSheet" };

  var videoUrlStr = payload.videoUrls || "";
  var imageUrlStr = payload.imageUrls || "";
  var common = payload.commonData || {};
  var newRows = [];

  if (payload.items && payload.items.length > 0) {
    payload.items.forEach(function(item) {
      
      // Xử lý Trang FB: Đảm bảo là string
      var destStr = "";
      if (item.destinations && Array.isArray(item.destinations)) {
        destStr = item.destinations.join(", ");
      } else if (typeof item.destinations === 'string') {
        destStr = item.destinations;
      }

      var row = [
        "'" + item.id,                          // A: STT (Thêm ' để giữ định dạng số dài)
        destStr,                                // B: Trang FB
        common.status || 'queue',               // C: Trạng thái
        common.postType || 'Đăng Một Ảnh',      // D: Loại bài viết
        "'" + item.scheduledTime,               // E: Thời gian đăng
        item.content || '',                     // F: Nội dung chính
        item.mandatoryContent || '',            // G: Nội dung bắt buộc
        item.seedingComment || '',              // H: Bình luận
        videoUrlStr,                            // I: Link Video
        imageUrlStr,                            // J: Link ảnh
        ''                                      // K: Link FB
      ];
      newRows.push(row);
    });
  }

  if (newRows.length === 0) return { success: true };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    var lastRow = sheet.getLastRow();
    // Ghi dữ liệu
    sheet.getRange(lastRow + 1, 1, newRows.length, 11).setValues(newRows);
    
    // *** FIX: Cưỡng chế Wrap Text (Xuống dòng) và Căn trên sau khi ghi ***
    var contentRange = sheet.getRange(lastRow + 1, 6, newRows.length, 3); // Cột F, G, H
    contentRange.setWrap(true); 
    contentRange.setVerticalAlignment("top");
    contentRange.setNumberFormat("@");
    
  } catch (e) {
     return { success: false, message: "Lỗi ghi Sheet: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
  return { success: true };
}

function updatePost(ss, payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = ss.getSheetByName(SHEET_POSTS);
    var id = String(payload.id);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, message: "No Data" };

    var idData = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
    
    for (var i = 0; i < idData.length; i++) {
      if (String(idData[i][0]) === id) {
        var r = i + 2;
        
        if (payload.status) sheet.getRange(r, 3).setValue(payload.status);
        if (payload.scheduledTime) sheet.getRange(r, 5).setValue("'" + payload.scheduledTime);
        
        // *** FIX: Khi Update nội dung, cũng phải setWrap(true) ***
        if (payload.content !== undefined) {
           sheet.getRange(r, 6)
                .setNumberFormat("@")
                .setWrap(true)              // Quan trọng: Bật xuống dòng
                .setVerticalAlignment("top") // Quan trọng: Căn trên
                .setValue(payload.content);
        }
        if (payload.mandatoryContent !== undefined) {
           sheet.getRange(r, 7)
                .setNumberFormat("@")
                .setWrap(true)
                .setVerticalAlignment("top")
                .setValue(payload.mandatoryContent);
        }
        if (payload.seedingComment !== undefined) {
           sheet.getRange(r, 8)
                .setNumberFormat("@")
                .setWrap(true)
                .setVerticalAlignment("top")
                .setValue(payload.seedingComment);
        }
        
        return { success: true };
      }
    }
  } finally {
    lock.releaseLock();
  }
  return { success: false, message: "ID Not Found" };
}

function deletePost(ss, payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = ss.getSheetByName(SHEET_POSTS);
    var id = String(payload.id);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false };

    var idData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idData.length; i++) {
      if (String(idData[i][0]) === id) {
        sheet.deleteRow(i + 2);
        return { success: true };
      }
    }
  } finally {
    lock.releaseLock();
  }
  return { success: false };
}

// --- MEDIA & PAGE UTILS ---

// Upload 1 file
function uploadMedia(payload) {
  try {
    if (!MEDIA_FOLDER_ID || MEDIA_FOLDER_ID.includes("HAY_THAY_ID")) return { success: false, message: "No Folder ID" };
    var folder = DriveApp.getFolderById(MEDIA_FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(payload.data), payload.mimeType, payload.name);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
    var type = payload.mimeType.includes('video') ? 'video' : 'image';
    return { success: true, url: fileUrl, type: type };
  } catch (e) {
    return { success: false, message: "Upload Error: " + e.toString() };
  }
}

// Upload Batch
function uploadBatchMedia(payload) {
  try {
    if (!MEDIA_FOLDER_ID || MEDIA_FOLDER_ID.includes("HAY_THAY_ID")) {
        return { success: false, message: "Chưa cấu hình Folder ID" };
    }
    var folder = DriveApp.getFolderById(MEDIA_FOLDER_ID);
    var results = [];
    
    if (payload.files && Array.isArray(payload.files)) {
      for (var i = 0; i < payload.files.length; i++) {
         var item = payload.files[i];
         var blob = Utilities.newBlob(Utilities.base64Decode(item.data), item.mimeType, item.name);
         var file = folder.createFile(blob);
         file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
         
         var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
         var type = item.mimeType.includes('video') ? 'video' : 'image';
         
         results.push({ url: fileUrl, type: type });
      }
    }
    return { success: true, files: results };
  } catch (e) {
    return { success: false, message: "Batch Upload Error: " + e.toString() };
  }
}

function getDestinations(ss) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  if (!sheet) return { success: true, data: [] };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return { success: true, data: data.map(function(r) { return { name: r[0], id: String(r[1]), accessToken: r[2] }; }) };
}

function addDestination(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  sheet.appendRow([payload.name, payload.id, payload.accessToken]);
  return { success: true };
}

// *** NEW: Hàm cập nhật thông tin trang ***
function updateDestination(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  var id = String(payload.id); // ID trang làm khóa
  var lastRow = sheet.getLastRow();
  
  // Duyệt qua cột ID (Cột B - index 1) để tìm dòng
  var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]) === id) { // Cột 2 là ID
       var row = i + 2;
       // Cập nhật Tên (Cột 1) và Token (Cột 3)
       sheet.getRange(row, 1).setValue(payload.name);
       sheet.getRange(row, 3).setValue(payload.accessToken);
       return { success: true };
    }
  }
  return { success: false, message: "Destination ID Not Found" };
}

function removeDestination(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  var id = String(payload.id);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}
