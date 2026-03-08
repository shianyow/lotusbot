function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('工具箱')
    .addItem('匯出修煉報告', 'showExportReportDialog')
    .addToUi();
}

function doGet(e)
{
  var para = e.parameter;
  return Router(para);
}

function doPost(e) {
  try
  {    
    let msg= JSON.parse(e.postData.contents);
    log(msg);
    let line = init();
    line.onpost(msg);
  }
  catch(ex)
  {
    log(ex);
  }
}