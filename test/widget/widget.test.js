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

  describe('Get Topics', function () {
    it('should get public topics without errors', function (done) {
      Topic.getTopics(publicPrivacy, {}, 10, {}).then(result => {
        assert.deepInclude(result[0], {
          userToken: 'public'
        })
        done()
      }).catch(err =>  done(err));
    });

    it('should get privte topics without errors', function (done) {
      Topic.getTopics(privatePrivacy, {}, 10, {}).then(result => {
        done();
      }).catch(err => done(err));
    });
  });

  describe('Save Topic', function () {
    it('should save public topic to public data without errors', function (done) {
      publicTopic.save(publicPrivacy).then(result => {
        done();
      }).catch(err =>  done(err));
    });

    it('should save private topic to user data without errors', function (done) {
      privateTopic.save(privatePrivacy).then(result => {
        done();
      }).catch(err => done(err));
    });
  });

  describe('Update Topic', function () {
    const data = {
      id: "5e6bd8e609aa7805b321bf42",
      title: "politics01",
      type: "Link",
      parentTopicId: null,
      reportedBy: [],
    }
    let updatedTopic = new Topic(data);

    it('should update topic without errors', function (done) {
      updatedTopic.update(publicPrivacy).then(result => {
        done();
      }).catch(err =>  done(err));
    });
  });

  describe('Delete Topic', function () {
    const data = {
      id: "5e6bd8cf09aa7805b321bf41",
      title: "Artist01",
      type: "Link",
      parentTopicId: null,
      reportedBy: [],
    }
    let deletedTopic = new Topic(data);

    it('should delete topic without errors', function (done) {
      deletedTopic.delete(publicPrivacy).then(result => {
        console.log(result);
        done();
      }).catch(err => done(err));
    });
  });

  describe('Report Topic', function () {
    const data = {
      id: "5e6ab7d4fddc2b059954ed6c",
      title: "Sport",
      type: "Link",
      parentTopicId: null,
      reportedBy: [],
    }
    let reportedTopic = new Topic(data);
    it('should report topic without errors', function (done) {
      reportedTopic.report(publicPrivacy, 'tets14556862', 'Spam').then(result => {
        assert.strictEqual(result.data.reportedBy.length, 1)
        done();
      }).catch(err =>  done(err));
    });
  });
});