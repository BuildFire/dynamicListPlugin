class Helper {

  static get PRIVACY() {
    return {
      PUBLIC: 'public',
      PRIVATE: 'private'
    }
  }

  static get INDICATOR() {
    return {
      IMAGE: 'image',
      COLOR: 'color'
    }
  }

  static get EVENTS () {
    return {
      TOPIC_CRETAED: 'TOPIC_CRETAED',
      TOPIC_REPORTED: 'TOPIC_REPORTED',
      TOPIC_DELETED: 'TOPIC_DELETED',
    }
  }

  static getConfigs() {
    return new Promise((resolve, reject) => {
      buildfire.datastore.get("configs", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static trackAction(key, aggregationValue) {
    let metData = {};
    if (aggregationValue) {
      metData._buildfire = {aggregationValue};
    }
    buildfire.analytics.trackAction(key, metData);
  }
}