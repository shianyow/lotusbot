function findtext(text,st,en)
{
  let a = text.indexOf(st);  
  if(a==-1)
    return "";  
  if(typeof en ==='undefined' || en=="")
    return text.slice(a + st.length).trim();
  let b = text.indexOf(en , a + st.length);
  if(b==-1)
    return text.slice(a + st.length).trim();
  else
    return text.slice(a + st.length, b).trim();
}

function extractDeepQuestion(text) {
  let match = String(text || '').match(/(?:【\s*叩問\s*】|［\s*叩問\s*］)\s*([\s\S]*?)(?=\n[【［]|$)/);
  if (!match) {
    return { raw: '', content: '', isEmpty: true };
  }

  let raw = match[1] == null ? '' : String(match[1]);
  let content = raw.trim();

  // 若第一行是括號備註（例如「(與修煉相關即可)」），忽略該行
  if (content) {
    let lines = content.split('\n').map(x => x.trim()).filter(x => x);
    if (lines.length > 0 && /^\([^\)]*\)$/.test(lines[0])) {
      lines.shift();
    }
    content = lines.join('\n').trim();
  }

  // 空叩問判斷：僅「無」或「暫無」（允許結尾空白/標點）才視為空
  let trimmedStart = content.replace(/^[\s\u3000]+/, '');
  let isEmpty = !content || /^(無|暫無)[\s\u3000\.,!?:;，。！？：；、]*$/.test(trimmedStart);

  return { raw: raw, content: content, isEmpty: isEmpty };
}

function writeReportBotFromLog()
{
  sheetLog = "Log";

  let sheet = SpreadsheetApp.getActive().getSheetByName(sheetLog);
  if (sheet == null) {
    return "程式錯誤，不存在的工作表：" + '"' + sheetName + '"';
  }

  let column = sheet.getRange('A:B');
  let values = column.getValues();
  let dateFrom = new Date("2022-10-24 21:00:00 +08:00");
  let dateTo = new Date("2022-10-25 21:00:00 +08:00");

  console.log("values.length=", values.length);
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].getTime() > dateTo.getTime() || values[i][0].getTime() < dateFrom.getTime()) {
      continue;
    }

    let v = JSON.parse(values[i][1]);
    if (typeof v.events[0].message == "undefined" || typeof v.events[0].message.text == "undefined") {
      continue;
    }

    let text = v.events[0].message.text;

    // console.log("text=" + text);

    const TITLE = "108項修煉心得分享";
    let rule = "^(【.*" + TITLE + ".*】" + "|" + "［.*" + TITLE + ".*］)";
    let re = new RegExp(`${rule}`);
    if (!text.match(re)) {
      // console.log("Invalid title");
      continue;
    }

    let name_array = text.match(/(【\s*姓名\s*】|［\s*姓名\s*］)(.*)/);
    if (!name_array || name_array[2].trim() == "") {
      // console.log("Invalid name");
      continue;
    }

    let userId = v.events[0].source.userId;
    let user = User.getData(userId);
    console.log("date=" + values[i][0] + "\n" +
      "displayName=" + user.displayName + "\n" +
      "text=\n" + text + "\n");

    appendReport([
      values[i][0],
      name_array[2].trim(),
      text,
      user.displayName,
    ]);
  }
}

function appendReport(row, sheetName)
{
  let sheet = SpreadsheetApp.getActive().getSheetByName(sheetName); 
  // console.log(row, sheetName);

  sheet.appendRow(row);
}

// function appendReport(row)
// {
//   let sheet = SpreadsheetApp.getActive().getSheetByName("Report_Bot"); 
//   // console.log(row);

//   sheet.appendRow(row);
// }

function test()
{
  // console.log(findNoReportNames());
  // console.log(remindReport());
  console.log(cmdList());
  // console.log(checkState("查詢狀態 上週"));
  // console.log(checkState("查詢狀態 本週"));
  // console.log(checkReport("查詢心得 本週未分享"));
  // console.log(checkReport("查詢心得 本週已分享"));
  console.log(checkReport("查詢總結 上週未分享"));
  console.log(checkReport("查詢心得 本週已分享"));
  // console.log(checkReport("查詢心得 上週已分享"));
  // console.log(checkReport("查詢心得"));
  // console.log(checkReport("查詢心得 123"));

//   let phrase = `【108項修煉心得分享】
// 【033 修觀果知因】
// 【第**篇】
  

// 【第＊組】
// 【姓名】＊＊＊
// 【日期】2022.06.**

// 【心得】

// 【從中看到的自己】

// 【從中得到的體悟】

// 【從中得到的反思】
// `
//   let row = [new Date(), "test_123", phrase, "吳先祐"];

//   appendReport(row);
}

function testUpdateNGTime()
{
  let userId = "U70991a1bceaad744e8967c3997bb4ef9";
  updateNGTime(userId);
}

function updateNGTime(userId)
{
  let user = User.getData(userId);
  if(user) {
    user.lastNGTime = new Date();
    User.putData(user);
  }
}

function testHastRecentNG()
{
  let userId = "U70991a1bceaad744e8967c3997bb4ef9";
  if(checkHasRecentNG(userId)) {
    console.log("true");
  } else {
    console.log("false");
  }
}

function checkHasRecentNG(userId)
{
  let user = User.getData(userId);
  
  if(user.lastNGTime) {
    let lastNGTime = new Date(user.lastNGTime).getTime();
    user.lastNGTime = "";
    User.putData(user);

    let now = new Date().getTime();
    let diffSecs = Math.floor((now - lastNGTime) / 1000);
     
    if(diffSecs < 600) {
      return true
    }
  }

  return false;
}

function getLastWeekRangeOfMonth(inputDate) {
  const date = new Date(inputDate);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  console.log("====== " + lastDayOfMonth);
  
  // Calculate the last Sunday of the month
  const lastSunday = lastDayOfMonth.getDate() - lastDayOfMonth.getDay() - 7;

  console.log("====== " + lastSunday);
  // Calculate the last Saturday of the month
  const lastSaturday = lastSunday + 6;

  console.log("====== " + lastSaturday);

  // Create a new Date object for the last Sunday
  const lastSundayDate = new Date(date.getFullYear(), date.getMonth(), lastSunday);

  console.log("====== " + lastSundayDate);
  // Create a new Date object for the last Saturday
  const lastSaturdayDate = new Date(date.getFullYear(), date.getMonth(), lastSaturday);

  console.log("====== " + lastSaturdayDate);

  return {
    startDate: lastSundayDate.toISOString().split('T')[0],
    endDate: lastSaturdayDate.toISOString().split('T')[0]
  };
}

function testLastWeek()
{

// 測試函數，輸入日期格式為 "YYYY-MM-DD"
const inputDate = "2023-12-28"; // 修改此處日期以測試不同日期
const { startDate, endDate } = getLastWeekRangeOfMonth(inputDate);
console.log(`所在月份的最後一週區間：${startDate} 到 ${endDate}`);

}

function cmdList()
{
  cmd =
    "查詢命令 -- 列出所有命令\n" +
    "提醒分享心得 -- 提醒本週未分享心得的夥伴\n" +
    "查詢心得 -- 查詢心得分享情況\n" +
    "查詢總結 -- 查詢總結分享情況\n" +
    "查詢狀態 -- 查詢特殊狀態名單";

  return cmd;
}

function checkState(cmd)
{
  let help =
    "使用範例：\n" +
    "1) 查詢狀態 本週\n" +
    "2) 查詢狀態 上週\n";
  let args = cmd.match(/(查詢狀態\s)(.*)/);
  if (!args || args[2].trim() == "") {
    return help;
  }

  let date = new Date();
  switch (args[2].trim()) {
    case "上週":
      date.setDate(date.getDate() - 7);
      break;
    case "本週":
      date.setDate(date.getDate());
      break;
    default:
      return help;
  }

  specialStatesData = findSpecialStateNames(date);

  console.log(specialStatesData);
  
  let output = "";
  let count = 0;
  for (let state in specialStatesData) {
    if (Array.isArray(specialStatesData[state]) && specialStatesData[state].length > 0) {
      output += `${state}：${specialStatesData[state].join('、')}\n`;
      count += specialStatesData[state].length;
    }
  }

  let result = `${args[2].trim() || ''}特殊狀態名單：共 ${count} 位\n` + output;

  return result;
}

function checkReport(cmd)
{  
  let help =
    "使用範例：\n" +
    "1) [查詢心得|查詢總結] 本週未分享\n" +
    "2) [查詢心得|查詢總結] 本週已分享\n" +
    "3) [查詢心得|查詢總結] 上週未分享\n" +
    "4) [查詢心得|查詢總結] 上週已分享";
  
  let isSummary = false;
  // console.log(cmd);
  let args = cmd.match(/(查詢心得\s)(.*)/);
  if (!args) {
    args = cmd.match(/(查詢總結\s)(.*)/);
    isSummary = true;
  }

  if (!args || args[2].trim() == "") {
    return help;
  }

  let names = [];
  let date = new Date();

  switch (args[2].trim()) {
    case "本週未分享":
      date.setDate(date.getDate());
      names = findNoReportNames(date, false, isSummary);
      break;
    case "本週已分享":
      date.setDate(date.getDate());
      names = findNoReportNames(date, true, isSummary);
      break;
    case "上週未分享":
      date.setDate(date.getDate() - 7);
      names = findNoReportNames(date, false, isSummary);
      break;
    case "上週已分享":
      date.setDate(date.getDate() - 7);
      names = findNoReportNames(date, true, isSummary);
      break;
    default:
      return help;
  }

  let output = args[2].trim() + "：共 " + names.length + " 位\n";
  output += formatNames(names);

  return output;
}

function remindReport()
{
  date = new Date();
  names = findNoReportNames(date, false);

  let text = "敬愛的老師、各位家人們當下好，溫馨提醒尚未分享心得的家人，記得分享修煉文喔\n\n";
  return text + formatNames(names);
}

function formatNames(names)
{
  if (!names) {
    return "";
  }

  let output = "";

  if (names.length > 0) {
    output = output + names[0];
  }
  for (let i = 1; i < names.length; i++) {
    output = output + "、" + names[i];
  }

  return output;
}

function findNoReportNames(date, submit, isSummary = false)
{
  let sheetArray = isSummary ? ["總結統計"] : ["每週統計"];
  let nameNoReport = [];
  let nameSubmitted = [];
  let specialStates = [
    "新入群",
    "108讀誦月",
    "抄寫天人師",
    "抄寫完成",
    "請假",
  ];

  for (const sheetName of sheetArray) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (sheet == null) {
      return ["程式錯誤，不存在的工作表：" + '"' + sheetName + '"'];
    }

    let column = sheet.getRange('A:FF');
    let values = column.getValues();
  
    console.log("sheetName=", sheetName, "values.length=", values.length);
    for (let i = 0; i < values.length; i++) {
      // 欄位格式是日期
      if ((values[i][1] instanceof Date) && (values[i][2] instanceof Date)) {
        // 時間在當週區間
        if (date.getTime() >= values[i][1].getTime() && date.getTime() < values[i][2].getTime()) {
          console.log("index=", i);
          for (let j = 3; j < values[i].length; j++) {
            let name = values[8][j];
            let reportCount = values[i][j];
            // 名字存在，且當週不處於特殊狀態
            if (name != "" && !specialStates.includes(reportCount)) {
              // 報告篇數是空的
              if (reportCount == 0 || isNaN(reportCount)) {
                nameNoReport.push(name);
              } else {
                nameSubmitted.push(name);
              }
            }
          }
          break;
        }
      }
    }
  }

  if (submit == true) {
    return nameSubmitted;
  } else {
    return nameNoReport;
  }
}

function findSpecialStateNames(date, isSummary = false)
{
  let sheetArray = isSummary ? ["總結統計"] : ["每週統計"];
  let specialStates = ["抄寫天人師", "108讀誦月", "新入群", "抄寫完成", "請假"];
  let nameSpecialState = {};

  nameSpecialState = specialStates.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = [];
    return accumulator;
  }, {});

  for (const sheetName of sheetArray) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (sheet == null) {
      return ["程式錯誤，不存在的工作表：" + '"' + sheetName + '"'];
    }

    let column = sheet.getRange('A:FF');
    let values = column.getValues();
  
    console.log("sheetName=", sheetName, "values.length=", values.length);
    for (let i = 0; i < values.length; i++) {
      // 欄位格式是日期
      if ((values[i][1] instanceof Date) && (values[i][2] instanceof Date)) {
        // 時間在當週區間
        if (date.getTime() >= values[i][1].getTime() && date.getTime() < values[i][2].getTime()) {
          console.log("index=", i);
          for (let j = 3; j < values[i].length; j++) {
            let name = values[8][j];
            let reportState = values[i][j];
            // 名字存在，且當週不處於特殊狀態
            if (name != "" && specialStates.includes(reportState)) {
              nameSpecialState[reportState].push(name);
            }
          }
          break;
        }
      }
    }
  }

  return nameSpecialState;
}

function checkSubject(report, subject) {
  const regex = new RegExp(`(【.*${subject}.*】|\\[.*${subject}.*\\])(.*)`);
  console.log(regex);
  let subject_array = report.match(regex);

  return (subject_array);
}

function test_check_report()
{
  let phrase = `    
【修煉航海週記1.0版】
【第**篇】
【進階*組】
【姓名】＊＊＊
【日期】2023.12.＊

【修煉主題】
051不著相修行

●事件：

●覺己 覺他 覺境：

●體悟：

[觀呼吸實作心得體悟]


【天人師的德範威儀應心語句】

[生命服務日常實踐分享]
`

  const required_subjects_1 = [
    "修煉主題",
    "觀呼吸實作心得體悟",
    "天人師的德範威儀應心語句",
    "生命服務日常實踐分享",
  ];

  const required_subjects_2 = [
    "修煉主題",
    "觀呼吸實作心得體悟",
    "天人師的德範威儀應心語句",
    "叩問",
  ];

  let missing_subjects = [];
  let subjects = phrase.includes("2.0版") ? required_subjects_2 : required_subjects_1;
  
  for (const subject of subjects) {
    if (!checkSubject(phrase, subject)) {
      missing_subjects.push(`【${subject}】`);
    }
  }

  if (missing_subjects.length > 0) {
    console.log("夥伴您好，您的修煉航海週記少了以下項目：\n" + missing_subjects.join("\n") + "\n");
  }

}

function test_parse_start_line()
{
  let phrase = `    
    【108項修煉心得分享】
【033 修觀果知因】
【第**篇】
  

【第＊組】
【姓名】＊＊＊
【日期】2022.06.**

【心得】

【從中看到的自己】

【從中得到的體悟】

【從中得到的反思】
`
const TITLE = "108項修煉心得分享";
name_quote = "【" + TITLE + "】";
console.log(name_quote); 
let rule = "^\n?.*(【.*" + "心得分享" + ".*】" + "|" + "［.*" + "心得分享" + ".*］)";
let re = new RegExp(`${rule}`);
console.log(re);
let name_array = phrase.match(re);
if (name_array) {
	console.log("Yes!\n");
}

let rule2 = "^(【\\s*" + TITLE + "\\s*】" + "|" + "［\\s*" + TITLE + "\\s*］)";
let re2 = new RegExp(`${rule2}`);
name_array = phrase.match(re2);
if (!name_array) {
  console.log("請在心得第一行使用以下標題：\n【108項修煉心得分享】");
}

}

function test_parse_name()
{
  let phrase = `
【108項修煉心得分享】
【033 修觀果知因】
【第**篇】
【第＊組】
【姓名】＊＊＊
【日期】2022.06.**

【心得】

【從中看到的自己】

【從中得到的體悟】

【從中得到的反思】
`

  let name_array = phrase.match(/(【\s*姓名\s*】|\［\s*姓名\s*\］)(.*)/);
  if (!name_array || name_array[2].trim() == "") {
    console.log(
      "請在心得中填上姓名，格式如下：\n" +
      "【姓名】ＸＸＸ");
  } else {
    console.log("_" + name_array[2].trim() + "_");
  }
}

function log(e)
{
  Log.appendData({Time:new Date(),Message:JSON.stringify(e)});
}

function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 未設定');
  }

  const payload = {
    contents: [{
      role: "user",
      parts: [{
        text: prompt
      }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ];

  let lastErr = null;
  let attemptedModels = [];

  for (const model of models) {
    const url = 'https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent?key=' + GEMINI_API_KEY;
    attemptedModels.push(model);
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseText = response.getContentText();
      const result = JSON.parse(responseText);

      if (result.error) {
        const code = result.error.code;
        const status = result.error.status;
        const message = result.error.message || '未知錯誤';
        const err = new Error('Gemini API 錯誤: ' + message);

        const isRateLimit = code === 429 || status === 'RESOURCE_EXHAUSTED' || /exceeded/i.test(message);
        if (isRateLimit) {
          lastErr = err;
          continue;
        }
        throw err;
      }

      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        log('Gemini model used: ' + JSON.stringify({model:model, attemptedModels:attemptedModels}));
        return result.candidates[0].content.parts[0].text;
      }

      throw new Error('Gemini API 回應格式錯誤');
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      const isRateLimit = /429|RESOURCE_EXHAUSTED|exceeded/i.test(msg);
      if (isRateLimit) {
        lastErr = e;
        continue;
      }
      if (msg.includes('Gemini API')) {
        throw e;
      }
      throw new Error('Gemini API 呼叫失敗: ' + msg);
    }
  }

  log('Gemini model failed: ' + JSON.stringify({attemptedModels:attemptedModels, error:lastErr ? String(lastErr.message || lastErr) : 'exceeded quota'}));
  throw lastErr || new Error('Gemini API 錯誤: exceeded quota');
}

function callOpenAIAPI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未設定');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 1000
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const result = JSON.parse(responseText);
    
    // 記錄完整回應以便診斷
    if (result.error) {
      log('OpenAI API 錯誤回應: ' + JSON.stringify(result.error));
      throw new Error('OpenAI API 錯誤: ' + (result.error.message || '未知錯誤'));
    }
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content;
    } else {
      log('OpenAI API 回應格式異常: ' + responseText);
      throw new Error('OpenAI API 回應格式錯誤');
    }
  } catch (e) {
    if (e.message.includes('OpenAI API')) {
      throw e;
    }
    log('OpenAI API 呼叫失敗: ' + e.message);
    throw new Error('OpenAI API 呼叫失敗: ' + e.message);
  }
}

function generateAIFeedback(report, question) {
  const prompt = `請以溫暖、務實、尊重的口吻，針對以下修煉心得中的叩問提供回饋。

修煉心得全文：
${report}

叩問內容：
${question}

請提供：
1. 針對叩問的具體回應
2. 結合心得內容的觀察與建議
3. 溫暖的鼓勵與支持

格式要求：
- 回覆內容不要包含任何問候或稱呼（例如「你好」、「夥伴您好」、或直接叫出姓名）
- 稱呼對方時，使用「您」
- 不要寒暄或開場白，第一句直接進入回饋重點
- 不要重述題目或原文
- 不要使用任何 Markdown 符號
- 300 字以內`;

  try {
    if (GEMINI_API_KEY) {
      return callGeminiAPI(prompt);
    } 
    // OpenAI 暫時停用，等充值後再啟用
    // else if (OPENAI_API_KEY) {
    //   return callOpenAIAPI(prompt);
    // } 
    else {
      throw new Error('AI API Key 未設定');
    }
  } catch (e) {
    throw e;
  }
}
