class Config {

  constructor(dataObj) {
    this.pluginData = dataObj.pluginData;
    this.querystring = dataObj.querystring;
    this.isPublic = dataObj.isPublic;
  }

  static get() {
    return new Promise((resolve, reject) => {
      buildfire.datastore.get("configs", (err, dataObj) => {
        if (err) {
          reject(err);
        } else {
          let config = new Config(dataObj);
          resolve(config);
        }
      });
    });
  }

  save() {
    return new Promise((resolve, reject) => {
      buildfire.datastore.save(this, "configs", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

}