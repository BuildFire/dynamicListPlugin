const appController = {
  deleteTopic(topicId, privacy) {
    let db = this.getDataSource(privacy);

    if (privacy === 'both') {
      db = this.getDataSource('private');
    } else {
      db = this.getDataSource(privacy);
    }

    return new Promise((resolve, reject) => {
      return Topic.delete(db, topicId)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          if (err.code === 'NOTFOUND') {
            db = this.getDataSource('public');
            return Topic.delete(db, topicId)
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                console.log(err);
                reject(err);
              });
          }
        });
    });
  },

  getDataSource(privacy) {
    let db = buildfire.publicData;
    if (privacy === 'private') {
      db = buildfire.userData;
    }
    return db;
  },
};
