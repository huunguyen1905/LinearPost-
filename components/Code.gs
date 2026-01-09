
/**
 * LINEAR POST AI - BACKEND SCRIPT V12 (Smart Migration: Add Page ID Column)
 * ---------------------------------------------
 */

// --- CẤU HÌNH ---
var MEDIA_FOLDER_ID = "HAY_THAY_ID_THU_MUC_DRIVE_VAO_DAY"; 

var SHEET_POSTS = "Bang_1";
var SHEET_PAGES = "Page FB";
var SHEET_CONFIG = "Cấu Hình"; 

// --- KHỞI TẠO WEB APP ---
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    var postData = {};
    
    // Parse JSON Body
    if (e.postData && e.postData.contents) {
       try { postData = JSON.parse(e.postData.contents); } catch (e) { }
    }
    
    var action = params.action || postData.action;
    var payload = postData.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'testConnection': return responseJSON({ success: true, message: "Kết nối thành công! Script đang hoạt động." });
      case 'getPosts': return responseJSON(getPosts(ss));
      case 'createBatchPosts': return responseJSON(createBatchPosts(ss, payload));
      case 'updatePost': return responseJSON(updatePost(ss, payload));
      case 'deletePost': return responseJSON(deletePost(ss, payload));
      case 'uploadMedia': return responseJSON(uploadMedia(payload));
      case 'uploadBatchMedia': return responseJSON(uploadBatchMedia(payload));
      case 'getDestinations': return responseJSON(getDestinations(ss));
      case 'addDestination': return responseJSON(addDestination(ss, payload));
      case 'updateDestination': return responseJSON(updateDestination(ss, payload));
      case 'removeDestination': return responseJSON(removeDestination(ss, payload));
      case 'getConfig': return responseJSON(getConfig(ss)); 
      case 'setupSheet': return responseJSON(setupSheet());
      default: return responseJSON({ success: false, message: "Invalid Action or Missing Parameters" });
    }
  } catch (err) {
    return responseJSON({ success: false, message: "Server Error: " + err.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// --- HÀM SETUP SHEET & MIGRATION ---
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SETUP SHEET: Bang_1 (Bài viết)
  var sheet1 = ss.getSheetByName(SHEET_POSTS);
  var headers1 = [
    "STT", "Trang FB", "ID Trang", "Trạng thái", "Loại bài viết", "Thời gian đăng", 
    "Nội dung chính", "Nội dung bắt buộc", "Bình luận", "Link Video", "Link ảnh", "Link FB"
  ];

  if (!sheet1) { 
    // Tạo mới nếu chưa có
    sheet1 = ss.insertSheet(SHEET_POSTS);
    var headerRange = sheet1.getRange(1, 1, 1, headers1.length);
    headerRange.setValues([headers1]);
    headerRange.setFontWeight("bold").setBackground("#fce5cd").setHorizontalAlignment("center");
    sheet1.setFrozenRows(1);
    sheet1.getRange(2, 6, 999, 4).setNumberFormat("@"); // Format Text
    sheet1.getRange("G:I").setWrap(true);
    sheet1.setColumnWidth(7, 350); 
    sheet1.setColumnWidth(3, 150); // Độ rộng cột ID Trang
  } else {
    // *** SMART MIGRATION: Kiểm tra và chèn cột ID Trang nếu thiếu ***
    var headerCheck = sheet1.getRange(1, 3).getValue(); // Check cột C
    if (headerCheck !== "ID Trang") {
       // Nếu cột 3 không phải ID Trang, ta chèn cột mới vào sau cột B (Cột 2)
       sheet1.insertColumnAfter(2);
       sheet1.getRange(1, 3).setValue("ID Trang").setFontWeight("bold").setBackground("#fce5cd");
       sheet1.setColumnWidth(3, 150);
       
       // Cập nhật lại toàn bộ header để đảm bảo đúng thứ tự
       sheet1.getRange(1, 1, 1, headers1.length).setValues([headers1]);
    }
  }
  
  // 2. SETUP SHEET: Page FB
  var sheet2 = ss.getSheetByName(SHEET_PAGES);
  if (!sheet2) { 
    sheet2 = ss.insertSheet(SHEET_PAGES); 
    var headers2 = ["Tên Page", "ID Page", "Access Token"];
    sheet2.getRange(1, 1, 1, 3).setValues([headers2]).setFontWeight("bold").setBackground("#d9ead3");
    sheet2.setFrozenRows(1);
    sheet2.getRange(2, 2, 999, 1).setNumberFormat("@");
  }

  // 3. SETUP SHEET: Cấu Hình
  var sheet3 = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet3) {
    sheet3 = ss.insertSheet(SHEET_CONFIG);
    var headers3 = ["KEY (Không sửa)", "VALUE (Giá trị)", "Mô tả"];
    sheet3.getRange(1, 1, 1, 3).setValues([headers3]).setFontWeight("bold").setBackground("#cfe2f3");
    sheet3.setFrozenRows(1);
    sheet3.appendRow(["GEMINI_API_KEY", "", "Dán Gemini API Key của bạn vào cột B"]);
    sheet3.setColumnWidth(1, 150);
    sheet3.setColumnWidth(2, 350);
    sheet3.setColumnWidth(3, 200);
  }

  return { success: true, message: "Đã cập nhật cấu trúc bảng tính (Thêm cột ID Trang)!" };
}

// --- LOGIC CONFIG ---
function getConfig(ss) {
  var sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) return { success: true, data: {} };
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: {} };
  
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); 
  var config = {};
  
  for (var i = 0; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var val = String(data[i][1]).trim();
    if (key) {
      config[key] = val;
    }
  }
  
  return { success: true, data: config };
}

// --- LOGIC BÀI VIẾT (UPDATED INDICES: ID Trang = Cột 3) ---

function getPosts(ss) {
  var sheet = ss.getSheetByName(SHEET_POSTS);
  if (!sheet) return { success: true, data: [] };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  // Lấy 12 cột (A -> L)
  var data = sheet.getRange(2, 1, lastRow - 1, 12).getDisplayValues(); 
  return { success: true, data: data };
}

function createBatchPosts(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_POSTS);
  if (!sheet) return { success: false, message: "Chưa setup sheet" };

  var videoUrlStr = payload.videoUrls || "";
  var imageUrlStr = payload.imageUrls || "";
  var common = payload.commonData || {};
  var newRows = [];

  if (payload.items && payload.items.length > 0) {
    payload.items.forEach(function(item) {
      var destStr = Array.isArray(item.destinations) ? item.destinations.join(", ") : item.destinations;
      // Nhận ID Trang từ frontend (nếu có), nếu không để trống
      var destIdsStr = Array.isArray(item.destinationIds) ? item.destinationIds.join(", ") : (item.destinationIds || "");
      
      var row = [
        "'" + item.id,               // 1. STT (A)
        destStr,                     // 2. Trang FB (B)
        "'" + destIdsStr,            // 3. ID Trang (C) -> NEW
        common.status || 'queue',    // 4. Trạng thái (D)
        common.postType || 'Đăng Một Ảnh', // 5. Loại bài viết (E)
        item.scheduledTime,          // 6. Thời gian (F)
        item.content || '',          // 7. Nội dung (G)
        item.mandatoryContent || '', // 8. Nội dung bắt buộc (H)
        item.seedingComment || '',   // 9. Bình luận (I)
        videoUrlStr,                 // 10. Link Video (J)
        imageUrlStr,                 // 11. Link ảnh (K)
        ''                           // 12. Link FB (L)
      ];
      newRows.push(row);
    });
  }

  if (newRows.length === 0) return { success: true };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    var lastRow = sheet.getLastRow();
    // Ghi 12 cột
    sheet.getRange(lastRow + 1, 1, newRows.length, 12).setValues(newRows);
    var range = sheet.getRange(lastRow + 1, 1, newRows.length, 12);
    range.setVerticalAlignment("top");
    // Format text cho các cột nội dung (Cột 7,8,9 -> G, H, I)
    sheet.getRange(lastRow + 1, 7, newRows.length, 3).setNumberFormat("@").setWrap(true);
  } catch (e) { return { success: false, message: "Lỗi ghi: " + e.toString() }; } 
  finally { lock.releaseLock(); }
  return { success: true };
}

function updatePost(ss, payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = ss.getSheetByName(SHEET_POSTS);
    var id = String(payload.id);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false };
    
    // Cột 1 là ID (STT)
    var idData = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
    
    for (var i = 0; i < idData.length; i++) {
      if (String(idData[i][0]) === id) {
        var r = i + 2;
        // Cập nhật theo index mới (dịch chuyển +1 do thêm cột ID Trang vào vị trí 3)
        
        // Trạng thái: Cột 4 (D)
        if (payload.status) sheet.getRange(r, 4).setValue(payload.status);
        
        // Thời gian: Cột 6 (F)
        if (payload.scheduledTime) sheet.getRange(r, 6).setNumberFormat("@").setValue(payload.scheduledTime);
        
        // Nội dung: Cột 7 (G)
        if (payload.content !== undefined) sheet.getRange(r, 7).setNumberFormat("@").setValue(payload.content);
        
        // Nội dung bắt buộc: Cột 8 (H)
        if (payload.mandatoryContent !== undefined) sheet.getRange(r, 8).setNumberFormat("@").setValue(payload.mandatoryContent);
        
        // Bình luận: Cột 9 (I)
        if (payload.seedingComment !== undefined) sheet.getRange(r, 9).setNumberFormat("@").setValue(payload.seedingComment);
        
        return { success: true };
      }
    }
  } finally { lock.releaseLock(); }
  return { success: false };
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
      if (String(idData[i][0]) === id) { sheet.deleteRow(i + 2); return { success: true }; }
    }
  } finally { lock.releaseLock(); }
  return { success: false };
}

// --- MEDIA & PAGE UTILS --- (Giữ nguyên)
function uploadMedia(payload) {
  try {
    if (!MEDIA_FOLDER_ID || MEDIA_FOLDER_ID.includes("HAY_THAY_ID")) return { success: false, message: "No Folder ID" };
    var folder = DriveApp.getFolderById(MEDIA_FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(payload.data), payload.mimeType, payload.name);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var type = payload.mimeType.includes('video') ? 'video' : 'image';
    return { success: true, url: "https://drive.google.com/uc?export=view&id=" + file.getId(), type: type };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function uploadBatchMedia(payload) {
  try {
    if (!MEDIA_FOLDER_ID || MEDIA_FOLDER_ID.includes("HAY_THAY_ID")) return { success: false };
    var folder = DriveApp.getFolderById(MEDIA_FOLDER_ID);
    var results = [];
    if (payload.files && Array.isArray(payload.files)) {
      for (var i = 0; i < payload.files.length; i++) {
         var item = payload.files[i];
         var blob = Utilities.newBlob(Utilities.base64Decode(item.data), item.mimeType, item.name);
         var file = folder.createFile(blob);
         file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
         var type = item.mimeType.includes('video') ? 'video' : 'image';
         results.push({ url: "https://drive.google.com/uc?export=view&id=" + file.getId(), type: type });
      }
    }
    return { success: true, files: results };
  } catch (e) { return { success: false, message: e.toString() }; }
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
  sheet.appendRow([payload.name, "'" + payload.id, payload.accessToken]);
  return { success: true };
}

function updateDestination(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  var id = String(payload.id);
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][1]).replace(/'/g, '') === id) { 
       var r = i + 2;
       sheet.getRange(r, 1).setValue(payload.name);
       sheet.getRange(r, 3).setValue(payload.accessToken);
       return { success: true };
    }
  }
  return { success: false };
}

function removeDestination(ss, payload) {
  var sheet = ss.getSheetByName(SHEET_PAGES);
  var id = String(payload.id);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).replace(/'/g, '') === id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}
