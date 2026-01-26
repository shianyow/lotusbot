class LineApp {
  
  constructor(token){
    this._triggers = {};
    this._token = token;    
    this._rules = [];
    this._replayMessages = [];
    this.triggerHandler = (event,params)=>{
      if( this._triggers[event] ) {
        for(let i in this._triggers[event] )
          this._triggers[event][i](params);
      }
    }

    this.on('post', (data) => {
      let events = data.events;
      for(let i in events)
      {
        let event = events[i];
        let type = event.type;
        this.triggerHandler(type, event);
        this.triggerHandler('finish',event);
      }
    });

    this.on('message',(event) => {
      let message = event.message;      
      // (optional) get user data aggressively onmessage
      if(this.aggressive)
      {
        let info = this.getInfo(event);
        event.group = info.group;
        event.user = info.user;
      }
      this.triggerHandler(message.type,event);
    });

    this.on('text',(event) => {      
      event.word = event.message.text;
      for(let i in this._rules)
      {
        if(!this._rules[i].check(event))
          continue;
        
        this._replayMessages = this._replayMessages.concat(this._rules[i].reply(event));
        break;
      }
    });

    this.on('finish',(event) => {      
      let replyToken = event.replyToken;
      if(this._replayMessages.length > 0)
      {  
        this.sendLineReply(replyToken,this._replayMessages);
      }
      this._replayMessages = [];        
    });

    this.getInfo = (event) => {
      let userId = event.source.userId;
      let groupId = event.source.groupId;
      let roomId = event.source.roomId;      
      let user,group;
      user = User.getData(userId);

      if(groupId != null)
      {
        if(user == null)
        {
          let us = this.getGroupMember(groupId,userId);
          us.name = us.displayName;
          user = User.putData(us);
        }
      }
      else if(roomId != null)
      {
        if(user == null)
        {
          let us = this.getRoomMember(roomId,userId);
          us.name = us.displayName;
          user = User.putData(us);
        }
      }
      else if(user == null)
      {
        let us = this.getUser(userId);
        us.name = us.displayName;
        user = User.putData(us);
      }

      return {user:user, group:group};
    };
    return this;
  }

  get aggressive() {
    return this._aggressive;
  }

  set aggressive(value){ 
    this._aggressive = value;
  }

  on(event, callback){
    if(!this._triggers[event])
      this._triggers[event] = [];
    this._triggers[event].push(callback);
  }

  onpost(data) {
    this.triggerHandler('post',data);
  }

  addRule(name,reply,check){
    if(check == null)
    {
      check = (event)=>event.word.startsWith(name);
    }
    this._rules.push({name:name,check:check,reply:reply});
  }

  addRule_quote(name,reply,check){
    if(check == null)
    {
      let rule = "^\n?.*" + name;
      let re = new RegExp(`${rule}`);
      check = (event)=>event.word.match(re);
    }
    this._rules.push({name:name,check:check,reply:reply});
  }

  getMessageContent(messageid)
  {
    let url = 'https://api-data.line.me/v2/bot/message/'+messageid+'/content';
    let response = UrlFetchApp.fetch(url, {
        'headers': {
          'Authorization': 'Bearer ' + this._token,
        },
        'method': 'get',
      });
    return response;
  }

  getUser(userid)
  {  
    let url = 'https://api.line.me/v2/bot/profile/'+userid+'/';  
    let response = UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + this._token,
        },
        'method': 'get',
      });
    let userprop = JSON.parse(response);
    let imageurl ="";
    if(typeof userprop.pictureUrl !=='undefined')
      imageurl = "https://profile.line-scdn.net/"+userprop.pictureUrl.split('/')[userprop.pictureUrl.split('/').length-1];
    let statusMessage = (typeof userprop.statusMessage ==='undefined')? "":userprop.statusMessage;
    return {userId:userid,displayName:userprop.displayName,imageurl:imageurl,statusMessage:statusMessage};
  }

  getGroupMember(groupid,userid)
  {
    let url = 'https://api.line.me/v2/bot/group/'+groupid+'/member/'+userid+'/';
    let response = UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + this._token,
        },
        'method': 'get',
      });
    let userprop = JSON.parse(response);    
    let imageurl ="";
    if(typeof userprop.pictureUrl !=='undefined')
      imageurl = "https://profile.line-scdn.net/"+userprop.pictureUrl.split('/')[userprop.pictureUrl.split('/').length-1]; 
    let statusMessage = (typeof userprop.statusMessage ==='undefined')? "":userprop.statusMessage;
    return {userId:userid,displayName:userprop.displayName,imageurl:imageurl,statusMessage:statusMessage};
  }

  getRoomMember(roomid,userid)
  {
    let url = 'https://api.line.me/v2/bot/room/'+roomid+'/member/'+userid+'/';
    let response = UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + this._token,
        },
        'method': 'get',
      });
    let userprop = JSON.parse(response);    
    let imageurl ="";
    if(typeof userprop.pictureUrl !=='undefined')
      imageurl = "https://profile.line-scdn.net/"+userprop.pictureUrl.split('/')[userprop.pictureUrl.split('/').length-1]; 
    let statusMessage = (userprop.statusMessage == null)? "":userprop.statusMessage;
    return {userId:userid,displayName:userprop.displayName,imageurl:imageurl,statusMessage:statusMessage};
  }

  getGroupIds(groupid)
  {
    //只有認證帳號才能
    let url = 'https://api.line.me/v2/bot/group/'+groupid+'/member/ids'
    let response = UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + this._token,
        },
        'method': 'get',
      });
    return response;
  }

  leaveGroup(groupid)
  {
    let url = 'https://api.line.me/v2/bot/group/'+groupid+'/leave';
    let response = UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + this._token,
      },
      'method': 'post',
    });
    return response;
  }

  sendLinePush(id,messages)
  {    
    let url = 'https://api.line.me/v2/bot/message/push';
    let response = UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + this._token,
      },
      'method': 'post',
      'payload': JSON.stringify(
        {
          'to': id,
          'messages': messages,
        }
      )
    });
    return response;
  }

  sendLineReply(replyToken, messages)
  {    
    let url = 'https://api.line.me/v2/bot/message/reply';
    let response = UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + this._token,
      },
      'method': 'post',
      'payload': JSON.stringify(
        {
          'replyToken': replyToken,
          'messages': messages,
        }
      ),
    });
    return response;
  }

  static LineAudio(url,duration)
  {
    return {'type': 'audio', 'originalContentUrl': url,'duration':duration };                
  }

  static LinePositiveSticker()
  {
    let sticker = [[1,2],[1,4],[1,5],[1,13],[1,14],[1,114],[1,119],[1,125],[1,132],[1,134],[1,137],[1,138],[1,139],[1,407],[2,34],[2,45],[2,144],[2,164],[2,166],[2,171],[2,172],[2,516],[3,180],[3,184],[3,186],[3,195],[3,200]];
    let stickno = Math.floor(Math.random() * sticker.length);
    return {"type": "sticker","packageId": sticker[stickno][0].toString(),"stickerId": sticker[stickno][1].toString(),};
  }

  static LineStickerFormatNG()
  {
    let sticker = [
      [446,2015], 
      [6370, 11088027],
      [11537, 52002746],
      [11537, 52002749],
      [11537, 52002754],
      [11537, 52002770],
      [11538, 51626499],
    ];
    let stickno = Math.floor(Math.random() * sticker.length);
    return {"type": "sticker","packageId": sticker[stickno][0].toString(),"stickerId": sticker[stickno][1].toString(),};
  }

  static LineStickerFormatOK()
  {
    let sticker = [
      [6370, 11088016],
      [8522, 16581266],
      [8522, 16581271],
      [11537, 52002734],
      [11537, 52002735],
      [11537, 52002736],
      [11537, 52002740],
      [11538, 51626501],
    ];
    let stickno = Math.floor(Math.random() * sticker.length);
    return {"type": "sticker","packageId": sticker[stickno][0].toString(),"stickerId": sticker[stickno][1].toString(),};
  }

  static LineSticker(packageid,stickerid)
  {
    return {"type": "sticker","packageId": packageid,"stickerId": stickerid,};
  }



  static LineImage(url)
  {
    return {"type": "image","originalContentUrl": url,"previewImageUrl": url,};
  }
    
  static LineText(message)
  {
    return {"type":"text","text":message};
  }

  static sendLineImage(img,token,message) {
    let sending_url = 'https://notify-api.line.me/api/notify';
    let boundary = "labnol";
    let requestBody = Utilities.newBlob(
      "--"+boundary+"\r\n"
      + "Content-Disposition: form-data; name=\"message\"\r\n\r\n"
      + message +"\r\n"+"--"+boundary+"\r\n"
      + "Content-Disposition: form-data; name=\"imageFile\"; filename=\""+img.getName()+"\"\r\n"
    + "Content-Type: " + img.getContentType()+"\r\n\r\n").getBytes()
    .concat(img.getBytes())
    .concat(Utilities.newBlob("\r\n--"+boundary+"--\r\n").getBytes());
    
    let options = {
      method: "post",
      contentType: "multipart/form-data; boundary="+boundary,
      payload: requestBody,
      muteHttpExceptions: true,
      headers: {'Authorization': 'Bearer ' + token}
    };
    UrlFetchApp.fetch(sending_url, options);
  }

  static sendline(token,message)
  {
    let sending_url = 'https://notify-api.line.me/api/notify';  
    if( token == null)
      return;
    let param = {
      'headers' : {'Authorization':'Bearer '+token},
      'method' : 'post',
      'payload': 
      {
        'message':message,
      }};
    UrlFetchApp.fetch(sending_url,param);
  }
}