describe('Widget', function () {
  const assert = chai.assert

  let newTopic1 = {
    title: 'Technology',
    parentTopicId: null,
    type: 'Group',
    reportedBy: [],
    deletedOn: null,
  }

  let newTopic2 = {
    title: 'politics',
    parentTopicId: null,
    type: 'Link',
    reportedBy: [],
    deletedOn: null,
  }

  let publicPrivacy = 'public';
  let privatePrivacy = 'privare';

  let privateTopic = new Topic(newTopic1);
  let publicTopic = new Topic(newTopic2);

  let filter = {
    "_buildfire.index.date1": {
      "$type": "null"
    }
  }

  describe('Get Topics', function () {
    it('should get public topics without errors', function (done) {
      Topic.getTopics(publicPrivacy, filter, 10, {}).then(result => {
        // assert.deepInclude(result[0], {
        //   userToken: 'public'
        // })
        done()
      }).catch(err => done(err));
    });

    it('should get privte topics without errors', function (done) {
      Topic.getTopics(privatePrivacy, filter, 10, {}).then(result => {
        done();
      }).catch(err => done(err));
    });
  });

  describe('Save Topic', function () {
    it('should save public topic to public data without errors', function (done) {
      publicTopic.save(publicPrivacy).then(result => {
        done();
      }).catch(err => done(err));
    });

    it('should save private topic to user data without errors', function (done) {
      privateTopic.save(privatePrivacy).then(result => {
        done();
      }).catch(err => done(err));
    });
  });

  describe('Update Topic', function () {

    it('should update topic without errors', function (done) {
      Topic.getTopics(publicPrivacy, filter, 1, {createdOn: 1})
        .then(async result => {
          let topic = result[0];
          let updatedTopic = new Topic({
            ...topic.data,
            id: topic.id
          });
          updatedTopic.title = 'Test Update';
          const testResult = await updatedTopic.update(publicPrivacy);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('Delete Topic', function () {

    it('should delete topic without errors', function (done) {
      Topic.getTopics(publicPrivacy, filter, 1, {
          createdOn: -1
        })
        .then(async result => {
          let topic = result[0];
          let deletedTopic = new Topic({
            ...topic.data,
            id: topic.id
          });
          const testResult = await deletedTopic.delete(publicPrivacy);
          console.log(testResult);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('Report Topic', function () {
    it('should report topic without errors', function (done) {
      Topic.getTopics(publicPrivacy, filter, 1, {createdOn: 1})
        .then(async result => {
          let topic = result[0];
          console.log(topic);

          let reportedTopic = new Topic({
            ...topic.data,
            id: topic.id
          });
          const testResult = await reportedTopic.report(publicPrivacy, 'Test Report', 'Spam');
          done();
        })
        .catch(err => done(err));
    });
  });
});