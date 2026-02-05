function listGeminiModels() {
  if (!GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY 未設定');
    return;
  }
  
  const url = 'https://generativelanguage.googleapis.com/v1/models?key=' + GEMINI_API_KEY;
  
  try {
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    console.log('可用的 Gemini 模型：');
    if (result.models) {
      result.models.forEach(model => {
        console.log('- 模型名稱: ' + model.name);
        console.log('  支援方法: ' + (model.supportedGenerationMethods || []).join(', '));
        console.log('  顯示名稱: ' + model.displayName);
        console.log('');
      });
    }
    
    return result;
  } catch (e) {
    console.log('查詢模型失敗: ' + e.message);
    throw e;
  }
}

function testGeminiAPI() {
  const testPrompt = "請用一句話回答：什麼是修煉？";
  
  try {
    const result = callGeminiAPI(testPrompt);
    console.log("測試成功！");
    console.log("AI 回應：" + result);
    return result;
  } catch (e) {
    console.log("測試失敗：" + e.message);
    
    // 檢查 Log 表查看詳細錯誤
    const sheet = SpreadsheetApp.getActive().getSheetByName("Log");
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const lastLog = sheet.getRange(lastRow, 1, 1, 2).getValues()[0];
      console.log("最後一筆 Log：");
      console.log("時間：" + lastLog[0]);
      console.log("訊息：" + lastLog[1]);
    }
    
    throw e;
  }
}

function testOpenAIAPI() {
  const testPrompt = "請用一句話回答：什麼是修煉？";
  
  try {
    const result = callOpenAIAPI(testPrompt);
    console.log("OpenAI 測試成功！");
    console.log("AI 回應：" + result);
    return result;
  } catch (e) {
    console.log("OpenAI 測試失敗：" + e.message);
    
    // 檢查 Log 表查看詳細錯誤
    const sheet = SpreadsheetApp.getActive().getSheetByName("Log");
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const lastLog = sheet.getRange(lastRow, 1, 1, 2).getValues()[0];
      console.log("最後一筆 Log：");
      console.log("時間：" + lastLog[0]);
      console.log("訊息：" + lastLog[1]);
    }
    
    throw e;
  }
}

function testAIFeedback() {
  const testReport = `【修煉航海週記2.0版】
【第 1 篇】
【姓名】測試者
【日期】2025.01.27

【修煉主題】
測試主題

●事件：
測試事件

●覺己 覺他 覺境：
測試覺察

●體悟：
測試體悟

【觀呼吸實作心得體悟】
測試觀呼吸

【天人師的德範威儀應心語句】
測試語句

【叩問】
如何在日常生活中保持覺察？`;

  try {
    const deepQuestion = extractDeepQuestion(testReport);
    console.log('叩問解析結果：' + JSON.stringify(deepQuestion));

    if (deepQuestion.isEmpty) {
      console.log('叩問為空，不呼叫 AI。');
      return '';
    }

    const feedback = generateAIFeedback(testReport, deepQuestion.content);
    console.log("AI 回饋測試成功！");
    console.log("回饋內容：\n" + feedback);
    return feedback;
  } catch (e) {
    console.log("AI 回饋測試失敗：" + e.message);
    throw e;
  }
}

/**
 * 測試觀照覺明修煉營的 AI 回饋
 */
function testGuanZhaoFeedback() {
  const testReport = `【修煉航海週記2.0版】
【觀照覺明修煉營】
【第1堂丨第1篇】
【姓名】測試者
【日期】2026.02.05
【契應內容】覺知當下
【文檔研磨心得】
透過研讀文檔，理解到觀照的核心在於不帶評判地覺察當下發生的一切。

【實修狀況丨體悟】
今天在工作中，同事對我的提案提出質疑，當下感覺到一股不悅升起。透過觀照，我看到了這個情緒的升起，但沒有被它帶著走。體悟到情緒只是一個訊號，不需要認同它。

【叩問】
當覺察到自己有情緒時，如何能夠更快速地回到觀照的狀態？`;

  console.log('=== 測試觀照覺明 AI 回饋 ===');

  // 檢查是否正確識別為觀照覺明
  const reportType = detectReportType(testReport);
  console.log('心得類型：' + reportType);

  // 檢查知識庫
  const knowledge = getKnowledgeBase();
  if (knowledge) {
    console.log('知識庫已載入，長度：' + knowledge.length + ' 字元');
  } else {
    console.log('警告：知識庫未設定或讀取失敗');
  }

  // 測試完整的 AI 回饋
  try {
    const deepQuestion = extractDeepQuestion(testReport);
    console.log('叩問：' + deepQuestion.content);

    if (deepQuestion.isEmpty) {
      console.log('叩問為空，不呼叫 AI。');
      return '';
    }

    const feedback = generateAIFeedback(testReport, deepQuestion.content);
    console.log('');
    console.log('=== AI 回饋 ===');
    console.log(feedback);
    return feedback;
  } catch (e) {
    console.log('測試失敗：' + e.message);
    throw e;
  }
}

/**
 * 測試 108 項修煉的 AI 回饋
 */
function test108PracticeFeedback() {
  const testReport = `【修煉航海週記2.0版】
【第 1 篇】
【姓名】測試者
【日期】2026.02.05

【修煉主題】
  105修出界定與破界定

●事件：
在工作中，我發現自己常常會給自己設限，認為某些事情不可能做到。

●覺己 覺他 覺境：
覺察到自己有很多無形的界定，限制了自己的發展。

●體悟：
原來很多限制都是自己加上去的。

【觀呼吸實作心得體悟】
透過觀呼吸，能夠更清楚地看到自己的念頭。

【天人師的德範威儀應心語句】
無

【叩問】
如何在日常生活中覺察並打破自己的界定？`;

  console.log('=== 測試 108 項修煉 AI 回饋 ===');

  // 測試提取修煉主題
  const theme = extractPracticeTheme(testReport);
  console.log('提取的修煉主題：' + JSON.stringify(theme));

  // 測試查詢知識庫
  if (theme.found) {
    const knowledge = get108PracticeKnowledge(theme);
    if (knowledge) {
      console.log('找到修煉內容：【' + knowledge.number + '】' + knowledge.title);
      console.log('內容長度：' + knowledge.content.length + ' 字元');
    } else {
      console.log('未找到對應的修煉內容');
    }
  }

  // 測試完整的 AI 回饋
  try {
    const deepQuestion = extractDeepQuestion(testReport);
    console.log('叩問：' + deepQuestion.content);

    if (deepQuestion.isEmpty) {
      console.log('叩問為空，不呼叫 AI。');
      return '';
    }

    const feedback = generateAIFeedback(testReport, deepQuestion.content);
    console.log('');
    console.log('=== AI 回饋 ===');
    console.log(feedback);
    return feedback;
  } catch (e) {
    console.log('測試失敗：' + e.message);
    throw e;
  }
}

/**
 * 測試提取修煉主題（不呼叫 AI）
 */
function testExtractPracticeTheme() {
  const testCases = [
    '【修煉主題】\n  105修出界定與破界定',
    '【修煉主題】\n  1修火侯',
    '【修煉主題】\n  001修火侯',
    '【修煉主題】修火侯',
    '【修煉主題】：修定力',
  ];

  console.log('=== 測試提取修煉主題 ===');
  for (const testCase of testCases) {
    const result = extractPracticeTheme(testCase);
    console.log('輸入：' + testCase.replace(/\n/g, '\\n'));
    console.log('結果：' + JSON.stringify(result));
    console.log('');
  }
}
