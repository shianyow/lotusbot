// 從 Script Properties 讀取敏感資訊
var CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');

var LINENOTIFY = {
  CLIENTID: PropertiesService.getScriptProperties().getProperty('LINENOTIFY_CLIENTID') || '',
  CLIENTSECRET: PropertiesService.getScriptProperties().getProperty('LINENOTIFY_CLIENTSECRET') || '',
}
var LINELOGIN = {
  CLIENTID: PropertiesService.getScriptProperties().getProperty('LINELOGIN_CLIENTID') || '',
  CLIENTSECRET: PropertiesService.getScriptProperties().getProperty('LINELOGIN_CLIENTSECRET') || '',
}

var LIFFURL = PropertiesService.getScriptProperties().getProperty('LIFFURL') || '';

var GROUP_TEST = (PropertiesService.getScriptProperties().getProperty('GROUP_TEST') || '').split(',').filter(x => x);

var GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
var OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';

// 觀照覺明修煉營知識庫 Google Docs ID
var KNOWLEDGE_DOC_ID = PropertiesService.getScriptProperties().getProperty('KNOWLEDGE_DOC_ID') || '';

// 108 項修煉知識庫 Google Sheets ID
var PRACTICE_108_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PRACTICE_108_SHEET_ID') || '';