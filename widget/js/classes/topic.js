class Topic {

  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.type = data.type;
    this.parentTopicId = data.parentTopicId || null;
    this.reportedBy = data.reportedBy || [];
    this.createdOn = data.createdOn || null;
    this.createdBy = data.createdBy || null;
    this.lastUpdatedOn = data.lastUpdatedOn || null;
    this.lastUpdatedBy = data.lastUpdatedBy || null;
    this.deletedBy = data.deletedBy || null;
    this.deletedOn = data.deletedOn || null;
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
      title: this.title,
      type: this.type,
      parentTopicId: this.parentTopicId,
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


  delete(privacy) {
    return new Promise((resolve, reject) => {
      if (!this.id) {
        reject({
          error: 'Missed Parameters',
          message: 'You missed id parameter'
        });
        return;
      }

      if (privacy === 'public') {
        const filter = {
          "$json.parentTopicId": this.id,
          "_buildfire.index.date1": {
            $type: "null"
          },
        }
        // const topics = await Topic.getTopics(privacy, filter, 1);
        Topic.getTopics(privacy, filter, 1)
          .then(topics => {
            if (topics && topics.length > 0) {
              reject({
                error: 'Unauthorized',
                message: this.title + 'is not empty'
              });
              return;
            }
            this.deletedOn = new Date();
            this.update(privacy)
              .then(result => {
                Helper.trackAction(Helper.EVENTS.TOPIC_DELETED);
                resolve(result);
              })
              .catch(err => {
                reject(err);
              });
          });
      } else {
        this.deletedOn = new Date();
        this.update(privacy)
          .then(result => {
            Helper.trackAction(Helper.EVENTS.TOPIC_DELETED);
            resolve(result);
          })
          .catch(err => {
            reject(err);
          })
      }
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