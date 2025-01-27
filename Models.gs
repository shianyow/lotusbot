function onDataChange(e) {

}

class DataHelper {
  static appendData(sheetname, data) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetname);
    let rows = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues();
    let keys = rows[0];
    let pos = sheet.getLastRow() + 1;    
    let rawdata = keys.map(x=>data[x]??"");
    sheet.appendRow([""]);
    sheet.getRange(pos,1,1,keys.length).setValues([rawdata]);
    let obj = {pos:pos,rawdata : rawdata};
    for(let k =0;k<keys.length;k++)
    {
      obj[keys[k]] = rawdata[k];
      Object.defineProperty(obj, keys[k], {
        get: ()=>obj.rawdata[k],
        set: (new_value) => {
          let oldValue = obj.rawdata[k];
          obj.rawdata[k] = new_value;        
          sheet.getRange(obj.pos,k+1).setValue(new_value);
          onDataChange?.({sheet:sheetname,obj:obj, action:'set',oldValue:oldValue,newValue : new_value});
        },
      });
    }
    obj.remove = ()=>{
      sheet.deleteRow(obj.pos);
      onDataChange?.({sheet:sheetname,key:keys[k], action:'remove', oldValue:obj});
    }

    onDataChange?.({sheet:sheetname,action:'add', newValue:obj, oldValue:null});
    return obj;
  }

  static putData(sheetname, key, data) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetname);
    let rows = sheet.getDataRange().getValues();

    let keys = rows[0];
    let found = false;
    let pos = 1;
    let index = Array.isArray(key) ? key.map((k)=>keys.indexOf(k)) : [keys.indexOf(key)];
    let oldObj = {};
    for(pos=1;pos<rows.length;pos++)
    {
      let row = rows[pos];
      if(index.every(x=>x==-1))
        continue;
      if(index.every((x,n)=>x==-1 || row[x]==data[keys[n]]))
      {
        found = true;
        oldObj = {pos:pos,rawdata : row};
        for(let k =0;k<keys.length;k++)
        {
          oldObj[keys[k]] = row[k];
          Object.defineProperty(oldObj, keys[k], {
            get: ()=>oldObj.rawdata[k],
            set: (new_value) => {
              oldObj.rawdata[k] = new_value;        
              sheet.getRange(oldObj.pos,k+1).setValue(new_value);
            },
          });
        } 
        break;
      }
    }
    
    pos+=1;

    let rawdata = keys.map(x=>data[x]??"");
    sheet.appendRow([""]);
    sheet.getRange(pos,1,1,keys.length).setValues([rawdata]);
    let obj = {pos:pos,rawdata : rawdata};  
    for(let k =0;k<keys.length;k++)
    {
      obj[keys[k]] = rawdata[k];
      Object.defineProperty(obj, keys[k], {
        get: ()=>obj.rawdata[k],
        set: (new_value) => {
          let oldValue = obj.rawdata[k];
          obj.rawdata[k] = new_value;        
          sheet.getRange(obj.pos,k+1).setValue(new_value);
          onDataChange?.({sheet:sheetname,obj:obj, action:'set',oldValue:oldValue,newValue : new_value});
        },
      });
    }
    obj.remove = ()=>{
      sheet.deleteRow(obj.pos);
      onDataChange?.({sheet:sheetname,key:keys[k], action:'remove', oldValue:obj});
    }

    onDataChange?.({sheet:sheetname,action:(found?'update':'add'), newValue:obj, oldValue:(found?oldObj:null)});
    return obj;
  }

  static getData(sheetname, key, keyword) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetname);
    let rows = sheet.getDataRange().getValues();
    
    let keys = rows[0];
    keyword = Array.isArray(keyword)? keyword : [keyword];
    let index = Array.isArray(key) ? key.map((k)=>keys.indexOf(k)) : [keys.indexOf(key)];
    let i=1;
    if(key == "pos")
    {
      i = keyword - 1;
    }
    for(i;i<rows.length;i++)
    {
      let row = rows[i];
      if(key == "pos" || index.every((x,n)=>x==-1 || row[x]==keyword[n]))
      {
        let obj = {pos:i+1,rawdata : row}
        for(let k =0;k<keys.length;k++)
        {
          obj[keys[k]] = row[k];
          Object.defineProperty(obj, keys[k], {
            get: ()=>obj.rawdata[k],
            set: (new_value) => {
              let oldValue = obj.rawdata[k];
              obj.rawdata[k] = new_value;        
              sheet.getRange(obj.pos,k+1).setValue(new_value);
              onDataChange?.({sheet:sheetname,key:keys[k],obj:obj, action:'set',oldValue:oldValue,newValue : new_value});
            },
          });
        }
        obj.remove = ()=>{        
          sheet.deleteRow(obj.pos);
          onDataChange?.({sheet:sheetname, action:'remove',oldValue:obj});
        }
        return obj;
      }
    }
    return null;
  }

  static getDatas(sheetname, key, keyword) {
    let sheet = SpreadsheetApp.getActive().getSheetByName(sheetname);
    let rows = sheet.getDataRange().getValues();
    let objs = [];
    let keys = rows[0];

    keyword = Array.isArray(keyword)? keyword : [keyword];
    let index = Array.isArray(key) ? key.map((k)=>keys.indexOf(k)) : [keys.indexOf(key)];

    for(let i=1;i<rows.length;i++)
    {
      let row = rows[i];
      if(index.every((x,n)=>x==-1 || row[x]==keyword[n]))
      {
        let obj = {pos:i+1,rawdata : row}
        for(let k =0;k<keys.length;k++)
        {
          obj[keys[k]] = row[k];
          Object.defineProperty(obj, keys[k], {
            get: ()=>obj.rawdata[k],
            set: (new_value) => {
              let oldValue = obj.rawdata[k];
              obj.rawdata[k] = new_value;     
              sheet.getRange(obj.pos,k+1).setValue(new_value);
              onDataChange?.({sheet:sheetname,key:keys[k],obj:obj, action:'set',oldValue:oldValue,newValue : new_value});
            },
          });
        }
        obj.remove = ()=>{
          sheet.deleteRow(obj.pos);
          onDataChange?.({sheet:sheetname, action:'remove',oldValue:obj});
        }
        objs.push(obj);
      }
    }
    return objs;
  }
}

class DataBase extends DataHelper {
  static get sheetName() { return ""; }
  static get primaryKeys() { return []; }

  static getData(keys) {
    return super.getData(this.sheetName,this.primaryKeys,keys);
  }

  static getDataBy(keys,values) {
    return super.getData(this.sheetName,keys,values);
  }

  static putData(data) {
    return super.putData(this.sheetName,this.primaryKeys,data);
  }

  static appendData(data) {
    return super.appendData(this.sheetName,data);
  }

  static getDatas() {
    return super.getDatas(this.sheetName);
  }

  static getDatasWhere(keys) {
    return super.getDatas(this.sheetName,this.primaryKeys,keys);
  }
}

class User extends DataBase {
  static get sheetName() { return "User"; }
  static get primaryKeys() { return ["userId"]; }

  static getDataByName(name) {
    return super.getDataBy("name",name) ?? super.getDataBy("displayName",name);
  }
}

class Log extends DataBase {
  static get sheetName() { return "Log"; }
}
