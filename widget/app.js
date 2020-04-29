let breadcrumbsHistory = [];
let config;
let timerId;
let colorIndex = 0;
let loggedUser = null;
const topicInpuDialog = new mdc.dialog.MDCDialog(inputDialog);
const deleteTopicDialog = new mdc.dialog.MDCDialog(deleteDialog);
const reportTopicDialog = new mdc.dialog.MDCDialog(reportDialog);
// const snackbar = new mdc.snackbar.MDCSnackbar(snackBar);

init();

function init() {
  buildfire.spinner.show();

  Helper.getConfigs()
    .then(result => {
      buildfire.spinner.hide()
      config = result.data;
      if (config.privacy === Helper.PRIVACY.PRIVATE && !loggedUser) {
        enforceUserLogin();
      } else {
        getCurrentUser();
      }

    })
    .catch(err => {
      buildfire.spinner.hide()
      scrollContainer.classList.add('bitmap');
      console.error(err);
    });

  buildfire.datastore.onUpdate(result => {
    topicInpuDialog.close();
    deleteTopicDialog.close();
    reportTopicDialog.close();
    closeBottomSheet();

    config = result.data;
    if (config.privacy === Helper.PRIVACY.PRIVATE && !loggedUser) {
      enforceUserLogin();
    } else {
      getCurrentUser();
    }
  });

  buildfire.auth.onLogout(() => {
    loggedUser = null;
    if (config.privacy === Helper.PRIVACY.PRIVATE) {
      authManager.login(false)
        .then(user => {
          loggedUser = user;
          loadData();
        })
        .catch(console.error);
    }
  })

}

function enforceUserLogin() {
  authManager.getCurrentUser()
    .then(user => {
      if (user) {
        loggedUser = user;
        // loadData();
        getData();
        return;
      }

      authManager.login(false)
        .then(userCred => {
          loggedUser = userCred;
          // loadData();
          getData();
        })
        .catch(console.error);
    })
    .catch(console.error);
}

function getCurrentUser() {
  authManager.getCurrentUser()
    .then(user => {
      loggedUser = user;
      // loadData();
      getData();
    })
    .catch(console.error);
}

function loadData(filterData) {
  checkTagPermissions(showHideAddButton);
  clearList();
  buildfire.spinner.show()
  let filter = {
    "_buildfire.index.date1": {
      $type: "null"
    },
  };
  if (filterData && Object.keys(filterData).length > 0) {
    filter = {
      ...filter,
      ...filterData
    }
  }
  Topic.getTopics(config.privacy, filter, null, {
      type: 1
    })
    .then(topics => {
      clearList();
      buildfire.spinner.hide()
      if (topics && topics.length === 0) {
        scrollContainer.classList.add('bitmap');
        return;
      }
      for (const obj of topics) {
        let topic = new Topic({
          ...obj.data,
          id: obj.id
        });
        renderTopic(topic);
      }
    })
    .catch(err => {
      scrollContainer.classList.add('bitmap');
      console.error(err);
    })
}

function search() {
  let target = searchTxt.value;
  let filter = {};
  if (target) {
    filter.$text = {
      $search: target
    };
  }

  if (breadcrumbsHistory && breadcrumbsHistory.length > 0) {
    let breadcrumbOptions = breadcrumbsHistory[breadcrumbsHistory.length - 1].options;
    if (breadcrumbOptions.topic) {
      filter['$json.parentTopicId'] = breadcrumbOptions.topic.id
    } else {
      filter['$json.parentTopicId'] = {
        $type: "null"
      }
    }
  }

  clearTimeout(timerId)
  timerId = setTimeout(() => {
    loadData(filter)
  }, 500)
}

function renderTopic(topic) {
  let appendingElem;
  if (topic.type === 'Group') {
    appendingElem = createListGroup(topic);

  } else {
    appendingElem = createListLink(topic)
  }
  listContainer.appendChild(appendingElem);
}

function createListGroup(topic) {
  let card = listGroup.cloneNode();
  card.classList.remove('invisiable');
  card.innerHTML = listGroup.innerHTML;
  if (config.indicator === Helper.INDICATOR.IMAGE) {
    card.style.backgroundImage = `url(${getImage(topic)})`;
    card.style.height = '12.0625rem';
  } else {
    card.style.background = getColor();
    card.style.height = '7.5rem';
  }

  card.querySelector('.group-title').innerHTML = topic.title;
  let optionsBtn = card.querySelector('button');

  optionsBtn.onclick = (event) => {
    event.preventDefault();
    showOptionsDailog(topic, card)
  };
  card.onclick = function (event) {
    event.preventDefault();
    if (event.target.tagName === 'BUTTON') {
      return;
    }
   
    buildfire.history.push(topic.title, {
      topic
    });
    getData();
  };

  card.id = topic.id;
  return card;
}

function createListLink(topic) {
  let card = listLink.cloneNode();
  card.classList.remove('invisiable');
  card.innerHTML = listLink.innerHTML;

  let linkImg = card.querySelector('.link-img');
  if (config.indicator === Helper.INDICATOR.IMAGE) {
    linkImg.style.backgroundImage = `url(${getImage(topic)})`;
  } else {
    linkImg.style.display = 'none';
    card.style.borderLeft = `solid 0.5rem ${getColor()}`;
  }

  card.querySelector('.link-title').innerHTML = topic.title;
  let optionsBtn = card.querySelector('button');

  card.onclick = function (event) {
    event.preventDefault();
    if (event.target.tagName === 'BUTTON') {
      return;
    }
    navigateTo(topic)
  };

  optionsBtn.onclick = (event) => {
    event.preventDefault();
    showOptionsDailog(topic, card)
  };
  card.id = topic.id;
  return card;
}

function clearList() {
  scrollContainer.classList.remove('bitmap');
  let group = listGroup;
  let link = listLink;
  listContainer.innerHTML = '';
  listContainer.appendChild(group);
  listContainer.appendChild(link);
}

function openTopicInputDialog() {
  if (!loggedUser) {
    authManager.login(true)
      .then(user => {
        loggedUser = user;
      })
      .catch(console.error);
    return;
  }
  topicInpuDialog.scrimClickAction = '';
  topicInpuDialog.open();

}

function addNewTopic() {
  let title = topicTitle.value;
  if (!title) {
    showMessage('Please, enter title of topic');

    return;
  }

  let types = topicTypesRadioGroup.querySelectorAll('input[name="topicType"]');
  let type;
  for (const elem of types) {
    if (elem.checked) {
      type = elem.value;
    }
  }
  if (!type) {
    showMessage('Please, you have to select type of topic');
    return;
  }

  let parentTopicId;
  if (breadcrumbsHistory && breadcrumbsHistory.length > 0) {
    let breadcrumbOptions = breadcrumbsHistory[breadcrumbsHistory.length - 1].options;
    if (breadcrumbOptions.topic) {
      parentTopicId = breadcrumbOptions.topic.id;
    }
  }

  const topic = new Topic({
    title,
    type,
    parentTopicId,
    createdBy: loggedUser
  });
  addTopicBtn.disabled = true;
  topic.save(config.privacy)
    .then((result => {
      topicInpuDialog.close();
      showMessage(`Successfully added ${topic.title} topic`)
      getData();
      topicTitle.value = '';
      addTopicBtn.disabled = false;
    }))
    .catch(err => {
      console.error(err);
      addTopicBtn.disabled = false;
      showMessage(err.message);
    })
}

function getData() {
  getBreadcrumbs()
    .then(breadcrumbs => {
      breadcrumbsHistory = breadcrumbs;
      let filter = {}
      // Here the length should be more than 1 where alwase we have home breadcrumbs in index 0
      // if (breadcrumbs && breadcrumbs.length > 1 && breadcrumbs[breadcrumbs.length - 1]) {
      //   let currentTopicLevel = breadcrumbs[breadcrumbs.length - 1].options.topic;
      //   filter['$json.parentTopicId'] = currentTopicLevel.id;
      // } else {
      //   filter['$json.parentTopicId'] = {
      //     $type: "null"
      //   }
      // }
      if (breadcrumbs && breadcrumbs.length > 0) {
        let breadcrumbOptions = breadcrumbs[breadcrumbs.length - 1].options;
        if (breadcrumbOptions.topic) {
          filter['$json.parentTopicId'] = breadcrumbOptions.topic.id
        } else {
          filter['$json.parentTopicId'] = {
            $type: "null"
          }
        }
      }

      renderBreadcrumbs(breadcrumbs);
      loadData(filter);
    })
    .catch(console.error)

}

function getBreadcrumbs() {
  return new Promise((resolve, reject) => {
    const options = {
      pluginBreadcrumbsOnly: false
    };
    buildfire.history.get(options, (err, breadcrumbs) => {
      if (err) {
        reject(err);
      } else {
        // if (breadcrumbs.length === 0) {
        //   buildfire.history.push('Home', {
        //     topic: null
        //   });
        // }
        resolve(breadcrumbs)
      }
    });
  })
}

function renderBreadcrumbs(breadcrumbs) {
  clearBreadcrumbs();
  if (breadcrumbs.length > 1 && breadcrumbs[breadcrumbs.length - 1].options.topic) {
    breadcrumbsDiv.classList.remove('invisiable');
  } else {
    breadcrumbsDiv.classList.add('invisiable');
  }

  // just show the plugin breadcrumbs
  let perivousBread;
  breadcrumbs.forEach((elem, index) => {
    if (!elem.options.topic) {
      perivousBread = elem;
    } else {
      if (perivousBread && !perivousBread.options.topic) {
        let breadcrumb = createBreadcrumb(perivousBread, 0);
        breadcrumbsDiv.appendChild(breadcrumb);
        perivousBread = null;
      }
      let breadcrumb = createBreadcrumb(elem, index);
      breadcrumbsDiv.appendChild(breadcrumb);
    }
  });
  breadcrumbsDiv.scrollLeft = 1000;
}

function createBreadcrumb(bread, index) {
  let breadcrumbElem = breadcrumbDiv.cloneNode();
  breadcrumbElem.classList.remove('invisiable');
  breadcrumbElem.innerHTML = breadcrumbDiv.innerHTML;
  let breadcrumbLabel = breadcrumbElem.querySelector('.breadcrumb-label');
  let breadcrumbIcon = breadcrumbElem.querySelector('.breadcrumb-icon');

  breadcrumbLabel.innerHTML = bread.label;
  if (index === 0) {
    breadcrumbIcon.style.display = 'none';
  } else {
    breadcrumbIcon.style.display = '';
  }
  breadcrumbElem.id = bread.uid;
  breadcrumbLabel.onclick = () => navigateBreadcrumbs(bread);

  return breadcrumbElem;
}

function navigateBreadcrumbs(bread) {
  for (let i = breadcrumbsHistory.length - 1; i >= 0; i--) {
    let breadcrumb = breadcrumbsHistory[i];
    if (breadcrumb.uid === bread.uid) {
      break;
    }
    buildfire.history.pop();
  }
}

function clearBreadcrumbs() {
  let breadcrumbElem = breadcrumbDiv;
  breadcrumbsDiv.innerHTML = '';
  breadcrumbsDiv.appendChild(breadcrumbElem);
}

function showOptionsDailog(topic, targetEelement) {
  const bottomSheetCard = document.querySelector('#bottomSheet');
  const editOption = bottomSheetCard.querySelector('#editTopicOption');
  const deleteOption = bottomSheetCard.querySelector('#deleteTopicOption');
  const reportOption = bottomSheetCard.querySelector('#reportTopicOption');
  editOption.style.display = 'none'

  if (config.privacy === Helper.PRIVACY.PRIVATE) {
    reportOption.style.display = 'none';
  } else {
    reportOption.style.display = '';
  }

  if (loggedUser && topic.createdBy && topic.createdBy.id === loggedUser.id) {
    deleteOption.style.display = '';
  } else {
    deleteOption.style.display = 'none';
  }


  deleteOption.onclick = () => openDeleteDialg(topic, targetEelement);
  reportOption.onclick = () => openReportDialog(topic);

  document.querySelector('.bottom-sheet').classList.add('backdoor')
  document.querySelector('.mdc-drawer').classList.add('open-bottom-sheet');

}

function openDeleteDialg(topic, targetEelement) {
  if (!loggedUser) {
    authManager.login(true)
      .then(user => {
        loggedUser = user;
      })
      .catch(console.error);
    return;
  }

  deleteTopicDialog.scrimClickAction = '';
  deleteTopicDialog.open();
  closeBottomSheet();

  dialogDeleteBtn.onclick = function (event) {
    event.preventDefault();
    dialogDeleteBtn.disabled = true;
    topic.deletedBy = loggedUser;
    topic.delete(config.privacy)
      .then(result => {
        deleteTopicDialog.close();
        showMessage(`Successfully deleted ${topic.title} topic`)
        dialogDeleteBtn.disabled = false;
        listContainer.removeChild(targetEelement);
        if (listContainer.children.length <= 2) {
          scrollContainer.classList.add('bitmap');
        }
      })
      .catch(err => {
        dialogDeleteBtn.disabled = false;
        deleteTopicDialog.close();
        console.error(err);
        showMessage(err.message);
      })
  };


}

function openReportDialog(topic) {
  closeBottomSheet();
  clearReportsContent();
  if (!loggedUser) {
    authManager.login(true)
      .then(user => {
        loggedUser = user;
      })
      .catch(console.error);
    return;
  }

  const arrOfReasons = [
    'Inappropriate profile pictures',
    'Harrassment',
    'Spamming',
    'Fraud',
  ]

  arrOfReasons.forEach((reason, index) => {
    const radioBtn = radioDiv.cloneNode();
    radioBtn.innerHTML = radioDiv.innerHTML;
    radioBtn.classList.remove('invisiable');
    const radioInput = radioBtn.querySelector('input[name="reportReason"]');
    radioInput.id = 'reasonRadion' + index;
    radioInput.value = reason;
    const radioLabel = radioBtn.querySelector('.radio-label');
    radioLabel.setAttribute('for', radioInput.id); 
    radioLabel.innerHTML = reason;
    radioBtn.removeAttribute('id');
    reportDialogContent.appendChild(radioBtn);
  });

  
  reportTopicDialog.scrimClickAction = '';
  reportTopicDialog.open();

  sendReportBtn.onclick = (event) => {
    event.preventDefault();

    let reasons = reportDialog.querySelectorAll('input[name="reportReason"]');
    let reason;
    for (const elem of reasons) {
      if (elem.checked) {
        reason = elem.value;
      }
    }
    if (!reason) {
      return;
    }
    sendReportBtn.disabled = true;

    reportTopicDialog.close();
    topic.report(config.privacy, loggedUser, reason)
      .then(result => {
        sendReportBtn.disabled = false;
        showMessage(`Successfully reported ${topic.title} topic`)
      })
      .catch(err => {
        sendReportBtn.disabled = false;
        reportTopicDialog.close();
        console.error(err);
        showMessage(err.message);
      })
  };
}

function clearReportsContent() {
  let radioBtn = radioDiv;
  reportDialogContent.innerHTML = '';
  reportDialogContent.appendChild(radioBtn);
}

function closeBottomSheet() {
  document.querySelector('.mdc-drawer').classList.remove('open-bottom-sheet');
  document.querySelector('.bottom-sheet').classList.remove('backdoor')
}

function navigateTo(topic) {
  const queryString = getQueryString(config.querystring, topic.id, topic.title, 544654);
  let pluginData = config.pluginData;
  if (Object.keys(pluginData).length === 0) {
    buildfire.navigation.navigateToSocialWall({
      title: topic.title,
      queryString: `wid=${topic.id}&topic_title=${topic.title}`
    })
  } else {
    pluginData.queryString = queryString;
    buildfire.navigation.navigateTo(pluginData)
  }
}

function getQueryString(qs, topic_id, topic_title, user_id) {
  return eval("`" + qs + "`");
}

function getImage(topic) {
  let imgWidth;
  let imgHeight;
  if (topic.type === 'Group') {
    imgWidth = '720';
    imgHeight = '16:9'
  } else {
    imgWidth = 'm'
    imgHeight = '1:1'
  }
  const url = buildfire.imageLib.cropImage(
    `https://app.buildfire.com/api/stockImages?topic=${escape(topic.title)}&w=${getWeekNumber(new Date())}`, {
      size: imgWidth,
      aspect: imgHeight
    }
  );

  return url;
}

function getColor() {
  const colors = ['#C45858', '#58C4C2', '#FF8E71', '#EFA851', '#8C5475', '#B0ADFF'];
  if (colorIndex === colors.length) {
    colorIndex = 0;
  }
  return colors[colorIndex++];
}

// get week number of year
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

function showMessage(message) {
  const options = {
    text: message,
    action: {
      text: 'Colse',
    }
  };
  buildfire.components.toast.showToastMessage(options, (err, result) => {
    if (err) throw error;
  });
}

buildfire.history.onPop((breadcrumb) => {
  getData();
});

buildfire.messaging.onReceivedMessage = (message) => {
  switch (message.action) {
    case 'Delete':
      let topicElem = document.getElementById(message.topic.id);
      if (topicElem) {
        listContainer.removeChild(topicElem);
        if (listContainer.children.length <= 2) {
          scrollContainer.classList.add('bitmap');
        }
      }
    break;
  }
}

function checkTagPermissions(cb) {
  if(config.privacy === Helper.PRIVACY.PUBLIC && config.writePrivacy === Helper.WRITE_PRIVACY.PRIVATE && config.writePrivacyTag && config.writePrivacyTag.trim().length){
    let writePrivacyTag = config.writePrivacyTag.trim();
    buildfire.getContext((err, context) => {
      if(err) return cb(false);
      
      let { appId } = context;
      if(loggedUser && loggedUser.tags && loggedUser.tags[appId]) {
        return cb(loggedUser.tags[appId].map(tag => tag.tagName).includes(writePrivacyTag));
      }
      return cb(false);
    })
  } else {
    return cb(true)
  }
}

function showHideAddButton(hasPermission) {
  addButton.style.display = hasPermission ? "block" : "none";
}