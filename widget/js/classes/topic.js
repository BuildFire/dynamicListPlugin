class Topic {

  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.titleIndex = data.titleIndex;
    this.type = data.type;
    this.parentTopicId = data.parentTopicId || null;
    this.originalShareId = data.originalShareId || null;
    this.reportedBy = data.reportedBy || [];
    this.createdOn = data.createdOn || null;
    this.createdBy = data.createdBy || null;
    this.lastUpdatedOn = data.lastUpdatedOn || null;
    this.lastUpdatedBy = data.lastUpdatedBy || null;
    this.deletedBy = data.deletedBy || null;
    this.deletedOn = data.deletedOn || null;
  }

  static getAllTopics(filter, limit, sort) {
    let topics = [];
    return new Promise((resolve, reject) => {
      buildfire.publicData.search({ filter, skip: 0, limit, sort }, "topics", function (err, dataResult) {
        if (err) reject(err);
        else {
          buildfire.userData.search({ filter, skip: 0, limit, sort }, "topics", function (err, userResult) {
            if (err) {
              dataResult.map(function (item) {
                item.data.privacy = "public";
              });
              resolve(dataResult)
            }
            else {
              for (let i = 0; i < dataResult.length; i++) {
                dataResult[i].data.privacy = "public";
                topics.push(dataResult[i]);
              }
              for (let i = 0; i < userResult.length; i++) {
                userResult[i].data.privacy = "private";
                topics.push(userResult[i]);
              }
              resolve(topics)
            }
          })
        }
      })
    });
  }

  static getTopics(privacy, filter, limit, sort) {
    let db = buildfire.publicData;
    if (privacy === 'private') {
      db = buildfire.userData;
    }
    return new Promise((resolve, reject) => {
      db.search({
        filter,
        skip: 0,
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

  getRowData() {
    return {
      id: this.id,
      title: this.title,
      titleIndex: this.titleIndex,
      type: this.type,
      parentTopicId: this.parentTopicId,
      originalShareId: this.originalShareId,
      reportedBy: this.reportedBy,
      createdOn: this.createdOn,
      createdBy: this.createdBy,
      lastUpdatedOn: this.lastUpdatedOn,
      lastUpdatedBy: this.lastUpdatedBy,
      deletedOn: this.deletedOn,
      deletedBy: this.deletedBy,
      _buildfire: {
        index: {
          string1: this.parentTopicId,
          date1: this.deletedOn,
          text: this.title,
          array1: this.reportedBy
        }
      }
    }

  }

  save(privacy) {
    let db = this.getDatasource(privacy);
    const topic = this.getRowData();
    topic.createdOn = new Date();
    topic.titleIndex = topic.title.toLowerCase();

    return new Promise((resolve, reject) => {
      db.insert(topic, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          Helper.trackAction(Helper.EVENTS.TOPIC_CRETAED);
          resolve(result);
        }
      });
    });
  }

  update(privacy) {
    let db = this.getDatasource(privacy);
    return new Promise((resolve, reject) => {
      let topic = this.getRowData();
      topic.lastUpdatedOn = new Date();
      topic.titleIndex = topic.title.toLowerCase();
      db.update(this.id, topic, "topics", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  report(privacy, user, reason) {
    const report = {
      user,
      reason,
      createdOn: new Date()
    }

    if (this && this.reportedBy) {
      this.reportedBy.push(report);
    }
    Helper.trackAction(Helper.EVENTS.TOPIC_REPORTED);
    return this.update(privacy)
  }


  static delete(db, topicId) {
    return new Promise((resolve, reject) => {
      if (!topicId) {
        reject({
          error: 'Missed Parameters',
          message: 'You missed id parameter',
        });
        return;
      }

      db.delete(topicId, 'topics', (err, result) => {
        if (err) {
          reject(err);
        } else {
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