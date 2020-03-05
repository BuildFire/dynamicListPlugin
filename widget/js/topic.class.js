class Topic {

  constructor(data) {
    this.title = data.title;
    this.type = data.type;
    this.parentTopicId = data.parentTopicId || null;
    this.reportedBy =  data.reportedBy || [];
  }
}