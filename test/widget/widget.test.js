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
      }).catch(err => {
        done(err);
      })
    });

    it('should get privte topics without errors', function (done) {
      Topic.getTopics(privatePrivacy, {}, 10, {}).then(result => {
        done();
      }).catch(err => {
        done(err);
      })
    });
  });

  describe('Save Topic', function () {
    it('should save public topic to public data without errors', function (done) {
      publicTopic.save(publicPrivacy).then(result => {
        done();
      }).catch(err => done(err))
    });

    it('should save private topic to user data without errors', function (done) {
      privateTopic.save(privatePrivacy).then(result => {
        done();
      }).catch(err => done(err));
    });
  });

  describe('Update Topic', function () {
    const data = {
      id: "5e6000cda5b6a40592241889",
      title: "politics01",
      type: "Link",
      parentTopicId: null,
      reportedBy: [],
    }
    let updatedTopic = new Topic(data);

    it('should update topic without errors', function (done) {
      updatedTopic.update(publicPrivacy).then(result => {
        done();
      }).catch(err => {
        done(err);
      })
    });
  });

  describe('Delete Topic', function () {
    const data = {
      id: "5e668a783c452305fb587445",
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
      }).catch(err => {
        done(err);
      })
    });
  });

  describe('Report Topic', function () {
    const data = {
      id: "5e66abd1aa280805a7ad0ddd",
      title: "Artist",
      type: "Link",
      parentTopicId: null,
      reportedBy: [],
    }
    let reportedTopic = new Topic(data);
    it('should report topic without errors', function (done) {
      reportedTopic.report(publicPrivacy, 'tets14556862', 'Not Polit').then(result => {
        assert.strictEqual(result.data.reportedBy.length, 1)
        done();
      }).catch(err => {
        done(err);
      })
    });
  });
});