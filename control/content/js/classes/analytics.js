class Analytics {

 static get events () {
    return {
      TOPIC_CRETAED: 'TOPIC_CRETAED',
      TOPIC_REPORTED: 'TOPIC_REPORTED',
      TOPIC_DELETED: 'TOPIC_DELETED',
    }
  }

  static init() {
    this.registerEvent('Topic Created', this.events.TOPIC_CRETAED, 'Occurs when a user create a new topic', false);
    this.registerEvent('Topic Reported', this.events.TOPIC_REPORTED, 'Occurs when a user report about a topic', false);
    this.registerEvent('Topic Deleted', this.events.TOPIC_DELETED, 'Occurs when a user delete a topic', false);
  }

  static registerEvent(title, key, description, silentNotification) {
    buildfire.analytics.registerEvent({
      title,
      key,
      description
    }, {
      silentNotification
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