/**
 * 修煉報告彙整匯出功能
 * 從 Report_Bot 和 Report_手動登記 查詢心得，匯出純文字供 AI 分析
 */

/**
 * 顯示匯出對話框
 */
function showExportReportDialog() {
  var html = HtmlService.createHtmlOutputFromFile('ReportExportForm')
    .setWidth(380)
    .setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, '匯出修煉報告');
}

/**
 * 匯出修煉報告主函數
 * @param {string} startDateStr - 開始日期 (YYYY-MM-DD)
 * @param {string} endDateStr - 結束日期 (YYYY-MM-DD)
 * @param {string} name - 姓名篩選（選填，部分匹配）
 * @param {string} topic - 修煉主題篩選（選填，搜尋內容關鍵字）
 * @returns {Object} { success, data (base64), fileName, count, message }
 */
function exportReport(startDateStr, endDateStr, name, topic) {
  try {
    var startParts = startDateStr.split('-');
    var endParts = endDateStr.split('-');
    var startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0);
    var endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59, 999);

    var entries = getReportEntries(startDate, endDate, name, topic);

    if (entries.length === 0) {
      var msg = '找不到符合條件的修煉報告';
      if (name) msg += '（姓名：' + name + '）';
      if (topic) msg += '（主題：' + topic + '）';
      return { success: false, message: msg };
    }

    var text = formatReportText(entries, name, topic, startDate, endDate);
    var data = Utilities.base64Encode(Utilities.newBlob(text, 'text/plain', 'report.txt').getBytes());

    var timezone = 'Asia/Taipei';
    var startStr = Utilities.formatDate(startDate, timezone, 'yyyyMMdd');
    var endStr = Utilities.formatDate(endDate, timezone, 'yyyyMMdd');
    var fileName = '修煉報告彙整_' + startStr + '-' + endStr;
    if (name) fileName += '_' + name;
    if (topic) fileName += '_' + topic;
    fileName += '.txt';

    return {
      success: true,
      data: data,
      fileName: fileName,
      count: entries.length
    };

  } catch (e) {
    console.error(e);
    return { success: false, message: e.message || '發生未知錯誤' };
  }
}

/**
 * 從工作表查詢修煉報告
 */
function getReportEntries(startDate, endDate, name, topic) {
  var sheetNames = ['Report_Bot', 'Report_手動登記'];
  var allEntries = [];

  sheetNames.forEach(function(sheetName) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var time = row[0];
      var rowName = row[1];
      var content = row[2];

      if (!time || !rowName) continue;

      if (!(time instanceof Date)) {
        time = new Date(time);
      }
      if (isNaN(time.getTime())) continue;

      // 日期範圍篩選
      if (time < startDate || time > endDate) continue;

      // 姓名篩選（部分匹配）
      if (name) {
        if (String(rowName).indexOf(name) === -1 && name.indexOf(String(rowName)) === -1) {
          continue;
        }
      }

      // 修煉主題篩選（在內容中搜尋關鍵字）
      if (topic) {
        if (String(content).indexOf(topic) === -1) {
          continue;
        }
      }

      allEntries.push({
        time: time,
        name: String(rowName).trim(),
        content: String(content || ''),
        source: sheetName
      });
    }
  });

  allEntries.sort(function(a, b) {
    return a.time - b.time;
  });

  return allEntries;
}

/**
 * 格式化修煉報告為純文字
 */
function formatReportText(entries, name, topic, startDate, endDate) {
  var timezone = 'Asia/Taipei';
  var startStr = Utilities.formatDate(startDate, timezone, 'yyyy/MM/dd');
  var endStr = Utilities.formatDate(endDate, timezone, 'yyyy/MM/dd');
  var exportDate = Utilities.formatDate(new Date(), timezone, 'yyyy/MM/dd HH:mm');

  var lines = [];

  // 標頭
  lines.push('===== 修煉報告彙整 =====');
  lines.push('匯出日期：' + exportDate);

  var filters = '篩選條件：日期 ' + startStr + ' ~ ' + endStr;
  if (name) filters += ' | 姓名：' + name;
  if (topic) filters += ' | 主題：' + topic;
  lines.push(filters);

  lines.push('共 ' + entries.length + ' 篇');
  lines.push('========================');
  lines.push('');

  // 每篇報告
  entries.forEach(function(entry, index) {
    lines.push('--- 第 ' + (index + 1) + ' 篇 ---');
    lines.push('姓名：' + entry.name);
    lines.push('日期：' + Utilities.formatDate(entry.time, timezone, 'yyyy/MM/dd HH:mm'));
    lines.push('來源：' + entry.source);
    lines.push('');
    lines.push(entry.content);
    lines.push('');
  });

  return lines.join('\n');
}
