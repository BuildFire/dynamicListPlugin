class Topic {

  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.parentTopicId = data.parentTopicId || null;
    this.reportedBy = data.reportedBy || [];
    this.deletedOn = null
  }


  static getTopics(isPubic, filter, limit, sort) {
    let db = this.getDatasource(isPubic);
    return new Promise((resolve, reject) => {
      db.search({
        filter,
        limit,
        sort
      }, "topics", function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  save(isPubic) {
    let db = this.getDatasource(isPubic);
    const topic = {
      title: this.title,
      type: this.type,
      parentTopicId: this.parentTopicId,
      reportedBy: this.reportedBy,
      _buildfire: {
        index: {
          string1: this.parentTopicId,
          date1: this.deletedOn,
          text: this.title
        }
      }
    }
    return new Promise((resolve, reject) => {
      db.insert(topic, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          Analytics.trackAction(Analytics.events.TOPIC_CRETAED);
          resolve(result);
        }
      });
    });
  }

  update (isPubic) {
    let db = this.getDatasource(isPubic);
    return new Promise((resolve, reject) => {
      db.update(this.id, this, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  report(isPubic, userId, reason) {
    const report = {
      userId,
      reason,
      craetedOn: new Date()
    }

    if (topic && topic.reportedBy) {
      this.reportedBy.push(report);
    }
    Analytics.trackAction(Analytics.events.TOPIC_REPORTED);
    return this.update(isPubic)
  }

  async delete(isPubic) {
    
    let db = this.getDatasource(isPubic);

    return new Promise((resolve, reject) => {
      if (!this.id) {
        reject({error: 'Missed Parameters', message: 'You missed id parameter'});
      }
  
      if (isPubic) {
        const filter = {
          "$json.parentTopicId": this.id
        }
        const topics = await this.getTopics(isPubic, filter, 1);
        if (topics && topics.length > 0) {
          reject({error: 'Unauthorized', message: this.title + 'is not empty'});
        }
      }

      db.delete(this.id, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          Analytics.trackAction(Analytics.events.TOPIC_DELETED);
          resolve(result);
        }
      });
    });
  }


  getDatasource(isPubic) {
    let db = buildfire.publicData;;
    if (!isPubic) {
      db = buildfire.userData;
    }

    return db
  }


}