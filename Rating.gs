// ===== AI 回饋評分模組 =====
// 在群組裡用 Flex 訊息的 1~5 按鈕收集當事人對 AI 回饋的評分。
// Flex 按鈕長在訊息泡泡內，群組訊息不會把它洗掉（不同於 Quick Reply）。

// 記錄最近一次 AI 實際回應所用的模型（由 callGeminiAPI 設定）
var LAST_AI_MODEL = '';

// 評分用的兩張工作表名稱
var SHEET_AI_FEEDBACK = 'AI_Feedback_Log';
var SHEET_AI_RATING   = 'AI_Rating_Log';

/**
 * 取得工作表，不存在則建立並寫入標題列
 */
function getOrCreateSheet(name, headers) {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

// AI_Feedback_Log 欄位順序（「評分」緊接在「模型」之後）
var FEEDBACK_HEADERS = [
  '時間', 'feedbackId', '群組Id', '作者UserId', '作者(心得姓名)',
  '心得類型', '修煉主題', '模型', '評分', '回饋字數', '回饋全文'
];

/**
 * 取得 AI_Feedback_Log；不存在則建立。
 * 既有舊表若缺「評分」欄，會自動插在「模型」右邊（就地升級，舊資料對齊不亂）。
 */
function ensureFeedbackSheet() {
  let sheet = getOrCreateSheet(SHEET_AI_FEEDBACK, FEEDBACK_HEADERS);
  let lastCol = sheet.getLastColumn();
  let cur = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (cur.indexOf('評分') === -1) {
    let modelCol = cur.indexOf('模型') + 1; // 1-based
    if (modelCol > 0) {
      sheet.insertColumnAfter(modelCol);
      sheet.getRange(1, modelCol + 1).setValue('評分');
    }
  }
  return sheet;
}

// AI_Rating_Log 欄位順序（「是否作者」放最後）
var RATING_HEADERS = ['時間', 'feedbackId', '評分者UserId', '評分者', '分數', '是否作者'];

/**
 * 取得 AI_Rating_Log；不存在則建立。既有舊表若缺「是否作者」欄則補在最後。
 */
function ensureRatingSheet() {
  let sheet = getOrCreateSheet(SHEET_AI_RATING, RATING_HEADERS);
  let lastCol = sheet.getLastColumn();
  let cur = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (cur.indexOf('是否作者') === -1) {
    sheet.getRange(1, lastCol + 1).setValue('是否作者');
  }
  return sheet;
}

/**
 * 把分數回填到 AI_Feedback_Log 對應 feedbackId 那一列的「評分」欄。
 * 以標題名稱定位欄位，順序變動也不受影響。
 */
function setFeedbackScore(feedbackId, score) {
  let sheet = ensureFeedbackSheet();   // 先確保「評分」欄存在（含舊表就地升級）
  let lastCol = sheet.getLastColumn();
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let fidCol = headers.indexOf('feedbackId') + 1;
  let scoreCol = headers.indexOf('評分') + 1;
  if (fidCol === 0 || scoreCol === 0) return;

  let n = sheet.getLastRow() - 1;
  if (n <= 0) return;
  let fids = sheet.getRange(2, fidCol, n, 1).getValues();
  for (let i = 0; i < fids.length; i++) {
    if (String(fids[i][0]) === String(feedbackId)) {
      sheet.getRange(i + 2, scoreCol).setValue(score);
      return;
    }
  }
}

/**
 * 記錄一筆 AI 回饋（產生回饋時呼叫），回傳寫入的 feedbackId
 * @param {string} feedbackId - 唯一識別碼
 * @param {Object} event - LINE 事件
 * @param {string} authorName - 心得中的姓名
 * @param {string} model - 使用的模型
 * @param {string} feedbackText - 回饋全文
 */
function logAIFeedback(feedbackId, event, authorName, model, feedbackText) {
  try {
    let report = event.word || '';
    let reportType = detectReportType(report);
    let theme = '';
    if (reportType === ReportType.PRACTICE_108) {
      let t = extractPracticeTheme(report);
      if (t.found) {
        theme = (t.number ? ('[' + t.number + '] ') : '') + (t.name || '');
      }
    }

    let sheet = ensureFeedbackSheet();

    sheet.appendRow([
      new Date(),
      feedbackId,
      (event.source && event.source.groupId) || '',
      (event.source && event.source.userId) || '',
      authorName || '',
      reportType,
      theme,
      model || '',
      '',                                       // 評分（待評分後回填）
      feedbackText ? feedbackText.length : 0,
      feedbackText || '',
    ]);

    return theme; // 回傳修煉主題，供評分卡顯示
  } catch (e) {
    log('logAIFeedback 失敗: ' + e.message);
    return '';
  }
}

/**
 * 記錄一筆評分（開放所有人）。同一 feedbackId + 同一評分者 → 以最後一次為準（更新）。
 * AI_Feedback_Log 的「評分」欄只回填「作者本人」的分數，避免被旁人蓋掉。
 * @param {boolean} isAuthor - 評分者是否為該篇作者本人
 * @returns {string} 'inserted' | 'updated'
 */
function recordRating(feedbackId, raterUserId, raterName, score, isAuthor) {
  let sheet = ensureRatingSheet();
  let authorMark = isAuthor ? '是' : '否';

  let data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(feedbackId) &&
        String(data[i][2]) === String(raterUserId)) {
      sheet.getRange(i + 1, 1).setValue(new Date());  // 時間
      sheet.getRange(i + 1, 5).setValue(score);       // 分數
      sheet.getRange(i + 1, 6).setValue(authorMark);  // 是否作者
      if (isAuthor) setFeedbackScore(feedbackId, score);
      return 'updated';
    }
  }
  sheet.appendRow([new Date(), feedbackId, raterUserId, raterName || '', score, authorMark]);
  if (isAuthor) setFeedbackScore(feedbackId, score);
  return 'inserted';
}

/**
 * 一次性回填：把 AI_Rating_Log 既有的評分，全部補寫到 AI_Feedback_Log 的「評分」欄。
 * 用於補齊「在回填功能上線前就已存在」的舊評分。可在 Apps Script 編輯器手動執行。
 */
function backfillFeedbackScores() {
  let ss = SpreadsheetApp.getActive();
  let rt = ss.getSheetByName(SHEET_AI_RATING);
  let fb = ss.getSheetByName(SHEET_AI_FEEDBACK);
  if (!rt || !fb) {
    let msg = '尚無 ' + SHEET_AI_RATING + ' 或 ' + SHEET_AI_FEEDBACK + '，無可回填';
    console.log(msg);
    return msg;
  }
  ensureFeedbackSheet(); // 確保「評分」欄存在

  // feedbackId -> 作者 UserId
  let fdata = fb.getDataRange().getValues();
  let authorOf = {};
  for (let i = 1; i < fdata.length; i++) {
    authorOf[String(fdata[i][1])] = String(fdata[i][3] || '');
  }

  let rdata = rt.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < rdata.length; i++) {
    let fid = String(rdata[i][1]);
    let rater = String(rdata[i][2] || '');
    let score = Number(rdata[i][4]);
    if (!fid || isNaN(score)) continue;
    let author = authorOf[fid];
    // 只回填作者本人的分數（查不到作者時則最佳努力回填）
    if (author && rater && rater !== author) continue;
    setFeedbackScore(fid, score);
    count++;
  }
  let msg = '已回填 ' + count + ' 筆「作者本人」評分到 ' + SHEET_AI_FEEDBACK;
  console.log(msg);
  return msg;
}

/**
 * 彙整評分結果：把回饋表與評分表用 feedbackId 對應，算出各模型平均分。
 * 同時輸出「全部評分」與「僅作者本人評分」兩種口徑。
 * 結果寫入 AI_Rating_Summary 工作表，並印到記錄（可在 Apps Script 編輯器手動執行查看）。
 */
function ratingSummary() {
  let ss = SpreadsheetApp.getActive();
  let fb = ss.getSheetByName(SHEET_AI_FEEDBACK);
  let rt = ss.getSheetByName(SHEET_AI_RATING);
  if (!fb || !rt) {
    let msg = '尚無評分資料（找不到 ' + SHEET_AI_FEEDBACK + ' 或 ' + SHEET_AI_RATING + '）';
    console.log(msg);
    return msg;
  }

  // feedbackId -> { model, author }
  let fdata = fb.getDataRange().getValues();
  let map = {};
  for (let i = 1; i < fdata.length; i++) {
    let fid = String(fdata[i][1]);
    map[fid] = { model: String(fdata[i][7] || '(未知)'), author: String(fdata[i][3] || '') };
  }

  // model -> 統計
  let stats = {};
  function bump(model, score, isAuthor) {
    if (!stats[model]) stats[model] = { n: 0, sum: 0, an: 0, asum: 0 };
    stats[model].n++; stats[model].sum += score;
    if (isAuthor) { stats[model].an++; stats[model].asum += score; }
  }

  let rdata = rt.getDataRange().getValues();
  for (let i = 1; i < rdata.length; i++) {
    let fid = String(rdata[i][1]);
    let rater = String(rdata[i][2] || '');
    let score = Number(rdata[i][4]);
    let info = map[fid];
    if (!info || isNaN(score)) continue;
    bump(info.model, score, !!rater && rater === info.author);
  }

  // 寫入彙整表
  let sum = getOrCreateSheet('AI_Rating_Summary',
    ['模型', '評分數(全部)', '平均(全部)', '評分數(僅作者)', '平均(僅作者)', '更新時間']);
  if (sum.getLastRow() > 1) {
    sum.getRange(2, 1, sum.getLastRow() - 1, 6).clearContent();
  }

  let now = new Date();
  let lines = [];
  Object.keys(stats).forEach(function (m) {
    let s = stats[m];
    let avgAll = s.n ? s.sum / s.n : 0;
    let avgAuthor = s.an ? s.asum / s.an : 0;
    sum.appendRow([
      m, s.n, Math.round(avgAll * 100) / 100,
      s.an, Math.round(avgAuthor * 100) / 100, now,
    ]);
    lines.push(m + '｜全部 ' + s.n + ' 筆 平均 ' + avgAll.toFixed(2) +
      '；僅作者 ' + s.an + ' 筆 平均 ' + avgAuthor.toFixed(2));
  });

  let out = lines.length ? lines.join('\n') : '尚無可彙整的評分';
  console.log(out);
  return out;
}

/**
 * 解析 postback 的 data 字串，例如 "action=rate&fid=xxx&score=4"
 * （Apps Script 無 URLSearchParams，故自行解析）
 */
function parsePostbackData(s) {
  let obj = {};
  String(s || '').split('&').forEach(function (kv) {
    let pair = kv.split('=');
    let k = decodeURIComponent(pair[0] || '');
    let v = decodeURIComponent(pair[1] || '');
    if (k) obj[k] = v;
  });
  return obj;
}

/**
 * 建立「評分小卡」：接在純文字回饋之後送出的獨立評分卡。
 * 回饋本身用純文字（好讀、可隨使用者字體設定放大、可複製）；此卡只放評分按鈕。
 * 卡片標示作者姓名＋主題，讓使用者在熱鬧群組裡一眼認出哪張是給自己的。
 * 按鈕的 postback data 夾帶 feedbackId 與作者 UserId（供「只允許本人評分」防呆）。
 * @param {string} feedbackId
 * @param {string} authorName - 作者姓名
 * @param {string} theme - 修煉主題（可空）
 * @param {string} authorUserId - 作者 LINE UserId（用於評分權限比對）
 */
function flexRatingCard(feedbackId, authorName, theme, authorUserId) {
  let buttons = [1, 2, 3, 4, 5].map(function (n) {
    return {
      type: 'button',
      style: 'secondary',
      height: 'md',
      action: {
        type: 'postback',
        label: String(n),
        data: 'action=rate&fid=' + feedbackId + '&score=' + n +
              '&auth=' + (authorUserId || ''),
        // displayText 用通用文字（不含分數）：點下立刻顯示確認、避免重複點，
        // 又不把分數公開在群組裡影響其他人
        displayText: '✓ 已送出評分',
      },
    };
  });

  // 標題：給【姓名】的回饋評分；有主題就再加一行
  let contents = [{
    type: 'text',
    text: '給【' + (authorName || '您') + '】的回饋評分',
    weight: 'bold',
    size: 'xl',
    color: '#8a5a2b',
    wrap: true,
  }];
  if (theme) {
    contents.push({
      type: 'text',
      text: '主題：' + theme,
      size: 'md',
      color: '#666666',
      wrap: true,
    });
  }
  contents.push({
    type: 'text',
    text: '這份回饋對您的修煉有幫助嗎？　1（沒幫助）～ 5（很有幫助）',
    size: 'md',
    color: '#555555',
    wrap: true,
    margin: 'md',
  });
  contents.push({
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    margin: 'md',
    contents: buttons,
  });

  return {
    type: 'flex',
    altText: '請為「' + (authorName || '您') + '」這次的 AI 回饋評分（1～5）',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: contents,
      },
    },
  };
}
