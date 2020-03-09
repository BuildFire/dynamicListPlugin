
describe('Content', function () {
  const expect = chai.expect

  let configData = {
    pluginData: 'test',
    querystring: '{{topicId}}',
    isPublic: true
  }

  let config = new Config(configData);

  describe('Save Config', function () {
    it('should save config  without errors', function (done) {
      config.save().then((result) => {
          done();
        })
        .catch((err) => {
          done(err)
        })
    });
  });

  describe('Get Config', function () {
    it('should return configs object without errors', function (done) {
      Config.get().then((result) => {
        done();
      })
      .catch((err) => {
        done(err);
      })
    });
  });
});