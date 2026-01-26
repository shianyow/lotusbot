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