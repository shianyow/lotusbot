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
