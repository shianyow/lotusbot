function init()
{
  let lineApp = new LineApp(CHANNEL_ACCESS_TOKEN);
  lineApp.aggressive = true;

  lineApp.addRule(
    "你好",
    () => {
      return [LineApp.LineText("你好!"),LineApp.LinePositiveSticker()];
    }
  );

  lineApp.addRule(
    "查詢命令",
    () => {
      return [LineApp.LineText(cmdList())];
    }
  );

  lineApp.addRule(
    "提醒分享心得",
    () => {
      return [LineApp.LineText(remindReport())];
    }
  );

  lineApp.addRule(
    "查詢心得",
    (event) => {
      return [LineApp.LineText(checkReport(event.word))];
    }
  );

  lineApp.addRule(
    "查詢總結",
    (event) => {
      return [LineApp.LineText(checkReport(event.word))];
    }
  );

  lineApp.addRule(
    "查詢狀態",
    (event) => {
      return [LineApp.LineText(checkState(event.word))];
    }
  );

  function collectReport(event, report) {
    // if(event.source.groupId == null)
    //   return LineApp.LineText("請在群組內使用此功能。");
    
    try
    {
      // 確認標題格式：第一行需包含關鍵字
      let firstLine = event.word.split('\n')[0];
      let keywords = ["修煉航海週記", "本月修煉總結"];
      let hasKeyword = keywords.some(keyword => firstLine.includes(keyword));
      if (!hasKeyword) {
        updateNGTime(event.user.userId);
        return [
          LineApp.LineText(event.user.displayName + "夥伴您好，" +
            "請在第一行包含「修煉航海週記」或「本月修煉總結」"),
          LineApp.LineStickerFormatNG(),
        ];
      }

      // 確認姓名格式
      let name_array = event.word.match(/(【\s*姓名\s*】|［\s*姓名\s*］|姓名：)(.*)/);
      if (!name_array || name_array[2].trim() == "") {
        updateNGTime(event.user.userId);
        return [
          LineApp.LineText(event.user.displayName + "夥伴您好，" +
            "請在心得中填上姓名，格式如下：\n【姓名】ＸＸＸ"),
          LineApp.LineStickerFormatNG(),
        ];
      }

      let lastNG = false;
      if(event.user.lastNGTime) {
        lastNG = checkHasRecentNG(event.user.userId);
      }

      if(GROUP_TEST.includes(event.source.groupId)) {
        // 測試
      }

      // 儲存心得
      appendReport([
        new Date(),
        name_array[2].trim(),
        event.word,
        event.user.displayName,
      ], report.sheetName);

      // 暫時停用必填項目檢查
      // let required_subjects = [];
      // let missing_subjects = [];

      // if (report.title == "修煉航海週記1.0版") {
      //   required_subjects = [
      //     "修煉主題",
      //     "觀呼吸實作心得體悟",
      //     "天人師的德範威儀應心語句",
      //     "生命服務日常實踐分享",
      //   ];
      // } else if (report.title == "修煉航海週記2.0版") {
      //   required_subjects = [
      //     "修煉主題",
      //     "觀呼吸實作心得體悟",
      //     "天人師的德範威儀應心語句",
      //     "叩問",
      //   ];
      // }

      // if (required_subjects.length > 0) {
      //   for (const subject of required_subjects) {
      //     if (!checkSubject(event.word, subject)) {
      //       missing_subjects.push(`【${subject}】`);
      //     }
      //   }

      //   if (missing_subjects.length > 0) {
      //     return [
      //       LineApp.LineText(event.user.displayName +
      //         "夥伴您好，您的修煉航海週記少了以下項目：\n" +
      //         missing_subjects.join("\n")),
      //     ];
      //   }
      // }

      if(lastNG) {
        return LineApp.LineStickerFormatOK();
      } else {
        return [];
      }
    }
    catch(e)
    {
      log(e);

      if(!TEST_GROUP.includes(event.source.groupId)) {
        return [];
      }

      return [LineApp.LineText("程式錯誤。")];
    }
  }

  // 修煉航海週記（統一處理1.0和2.0版）
  lineApp.addRule_quote(
    "修煉航海週記",
    (event) => {
      // 預設使用2.0版，若內容包含1.0則使用1.0版
      let report = { title: "修煉航海週記2.0版", sheetName: "Report_Bot" };
      if (event.word.includes("1.0")) {
        report = { title: "修煉航海週記1.0版", sheetName: "Report_Bot" };
      }
      return collectReport(event, report);
    }
  );

  // 本月修煉總結
  lineApp.addRule_quote(
    "本月修煉總結",
    (event) => {
      return collectReport(event, { title: "本月修煉總結", sheetName: "Report_Bot_總結" });
    }
  );


  //"join",當機器人被加入群組時
  //"leave",當機器人被踢出群組時
  //"memberJoined",當有使用者被加入群組時
  //"memberLeft",當有使用者離開群組時
  //"follow",當有使用者加好友時
  //"unfollow",當有使用者封鎖時
  //"message",當接收到任何訊息時
  //以下都會先觸發message
  //"location",當收到地理資訊時
  //"image",當接收到圖片時
  //"audio",當接收到音訊時
  //"video",當接收到影片時
  //"file",當接收到檔案時
  //"sticker",當接收到貼圖時
  //"postback",當接收到postback時，按鈕互動時才會使用到
  //"text",當接收到文字訊息時

  //以下非Line  Messaging的事件
  //"error",當有錯誤發生時
  //"final",當流程全部走完時
  /*
  lineApp.on('image', (event) =>{    
    if(AdminGroup.getData(event.source.groupId)!=null)
    {      
      let img = lineApp.getMessageContent(event.message.id).getBlob();
      savefile(event.source.groupId,img);
      lineApp._replayMessages.push(LineApp.LineText("已暫存圖片。"));
    }
  });
  */

  return lineApp;
}