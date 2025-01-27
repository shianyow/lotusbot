
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