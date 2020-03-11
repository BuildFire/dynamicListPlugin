class Topic {

  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.parentTopicId = data.parentTopicId || null;
    this.reportedBy = data.reportedBy || [];
    this.deletedOn = null
  }


  static getTopics(privacy, filter, limit, sort) {
    let db = buildfire.publicData;
    if (privacy === 'private') {
      db = buildfire.userData;
    }
    return new Promise((resolve, reject) => {
      db.search({
        filter,
        limit,
        sort
      }, "topics", function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  save(privacy) {
    let db = this.getDatasource(privacy);
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

  update(privacy) {
    let db = this.getDatasource(privacy);
    return new Promise( async (resolve, reject) => {
      let topic = await this.getById(privacy, this.id);
      if (topic && Object.keys(topic.data).length === 0) {
        resolve({
          code: "NOTFOUND",
          message: "Entry not found",
          ...topic
        })
        return;
      }
      db.update(this.id, this, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  report(privacy, userId, reason) {
    const report = {
      userId,
      reason,
      craetedOn: new Date()
    }

    if (this && this.reportedBy) {
      this.reportedBy.push(report);
    }
    Analytics.trackAction(Analytics.events.TOPIC_REPORTED);
    return this.update(privacy)
  }


  delete(privacy) {
    let db = this.getDatasource(privacy);

    return new Promise(async (resolve, reject) => {
      if (!this.id) {
        reject({
          error: 'Missed Parameters',
          message: 'You missed id parameter'
        });
      }

      let topic = await this.getById(privacy, this.id);
      if (topic && Object.keys(topic.data).length === 0) {
        resolve({
          code: "NOTFOUND",
          message: "Entry not found",
          ...topic
        })
        return;
      }

      if (privacy === 'public') {
        const filter = {
          "$json.parentTopicId": this.id
        }
        const topics = await Topic.getTopics(privacy, filter, 1);
        if (topics && topics.length > 0) {
          reject({
            error: 'Unauthorized',
            message: this.title + 'is not empty'
          });
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

  getById(privacy, topicId) {
    let db = this.getDatasource(privacy);
    return new Promise((resolve, reject) => {
      db.getById(topicId, 'topics', function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }


  getDatasource(privacy) {
    let db = buildfire.publicData;;
    if (privacy === 'private') {
      db = buildfire.userData;
    }

    return db
  }


}