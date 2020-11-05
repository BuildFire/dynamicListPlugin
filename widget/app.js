let breadcrumbsHistory = [];
let config;
let timerId;
let colorIndex = 0;
let loggedUser = null;
let instanceId = null;
const topicInpuDialog = new mdc.dialog.MDCDialog(inputDialog);
const deleteTopicDialog = new mdc.dialog.MDCDialog(deleteDialog);
const reportTopicDialog = new mdc.dialog.MDCDialog(reportDialog);
let languages = {};
let appTheme = {};
init();

function init() {
  buildfire.spinner.show();
  buildfire.appearance.titlebar.show();
  buildfire.appearance.getAppTheme(function (err, theme) {
    appTheme = theme.colors;
    document.getElementsByClassName('widgetIcon')[1].style.setProperty('color', appTheme.icons, 'important');
    document.getElementsByClassName('widgetIcon')[0].style.setProperty('color', appTheme.icons, 'important');
    document.getElementsByClassName('widgetIcon')[1].style.setProperty('color', appTheme.icons, 'important');
    document.getElementById('dialogtitle').style.setProperty('color', appTheme.successTheme, 'important');
    document.getElementById('searchIcon').style.setProperty('color', appTheme.icons, 'important');
    document.getElementById('addBtn').style.setProperty('background-color', appTheme.icons, 'important');
  })
  Helper.getConfigs()
    .then(result => {
      buildfire.spinner.hide();
      config = result.data;
      getStrings();
      if (config.privacy === Helper.PRIVACY.PRIVATE && !loggedUser) {
        enforceUserLogin();
      } else {
        getCurrentUser();
      }
      if (config.contentType !== 2) {
        groupsDiv.setAttribute('style', 'display: none;');
        linksDiv.setAttribute('style', 'display: none;');
        link.checked = true;
        breakPoint.setAttribute('style', 'display: none;');
      }

      if (config.privacy != 'both') {
        topicTypeRadioGroup.setAttribute('style', 'display: none');
      }
      if (config.emptyState) {
        scrollContainer.setAttribute('data-text', config.emptyStateMessage)
      }

      buildfire.getContext((err, context) => {
        if (err) return console.error(err);
        instanceId = context.instanceId;
      })
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
    buildfire.components.drawer.closeDrawer();
    getStrings();
    config = result.data;
    if (config.privacy === Helper.PRIVACY.PRIVATE && !loggedUser) {
      enforceUserLogin();
    } else {
      getCurrentUser();
    }
    if (config.contentType === 1) {
      groupsDiv.setAttribute('style', 'display: none;');
      linksDiv.setAttribute('style', 'display: none;');
      breakPoint.setAttribute('style', 'display: none;');
      link.checked = true;
    } else {
      groupsDiv.setAttribute('style', 'display: flex;');
      linksDiv.setAttribute('style', 'display: flex;');
      breakPoint.setAttribute('style', 'display: block;');
    }
    if (config.privacy != 'both') {
      topicTypeRadioGroup.setAttribute('style', 'display: none');
    }
    else {
      topicTypeRadioGroup.setAttribute('style', 'display: block');
    }
    if (config.emptyState) {
      scrollContainer.setAttribute('data-text', config.emptyStateMessage)
    } else scrollContainer.setAttribute('data-text', '');
  });

  buildfire.auth.onLogin(function (user) {
    if (user && user._id) {
      loggedUser = user;
      buildfire.deeplink.getData(function (result) {
        if (result) {
          subscribeToGroup(result);
        } else {
          getData();
        }
      });
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
    } else {
      loadData()
    }
  })

  window.addEventListener('click', function (e) {
    if (document.getElementById('inputDialog').contains(e.target)) {
      if (e.target.className === "mdc-dialog__scrim") {
        topicInpuDialog.close();
      }
    }
  });
}

function enforceUserLogin() {
  authManager.getCurrentUser()
    .then(user => {
      if (user) {
        loggedUser = user;
        buildfire.deeplink.getData(function (result) {
          if (result) {
            subscribeToGroup(result);
          } else {
            getData();
          }
        });
        return;
      }

      authManager.login(false)
        .then(userCred => {
          loggedUser = userCred;
          buildfire.deeplink.getData(function (result) {
            if (result) {
              subscribeToGroup(result);
            } else {
              getData();
            }
          });
        })
        .catch(console.error);
    })
    .catch(console.error);
}

function getCurrentUser() {
  authManager.getCurrentUser()
    .then(user => {
      loggedUser = user;
      buildfire.deeplink.getData(function (result) {
        if (result) {
          subscribeToGroup(result);
        } else {
          getData();
        }
      });
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
  if (config.privacy === 'both') {
    if (config.writePrivacy === Helper.WRITE_PRIVACY.PRIVATE) {
      checkTagPermissions(function (hasTag) {
        if (!hasTag) {
          topicTypeRadioGroup.setAttribute('style', 'display: none;');
          privateGroup.checked = true;
        }
      })
    }
    Topic.getAllTopics(filter, null, {
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
          topic.privacy = obj.data.privacy;
          renderTopic(topic);
        }
        /*setTimeout(() => {
          let elements = document.getElementsByClassName('titleIcon');
          for (let el of elements) {
            console.log(el)
            el.style.setProperty('color', appTheme.icons, 'important');
          }
          let elements2 = document.getElementsByClassName('action-btn');
          for (let el of elements2) {
            console.log(el)
            el.style.setProperty('color', appTheme.icons, 'important');
          }
        }, 500)*/
      })
      .catch(err => {
        scrollContainer.classList.add('bitmap');
        console.error(err);
      })
  }
  else {
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
  card.classList.remove('invisible');
  card.innerHTML = listGroup.innerHTML;

  if (config.indicator === Helper.INDICATOR.IMAGE) {
    card.style.backgroundImage = `url(${getImage(topic)})`;
    card.style.height = '12.0625rem';
  } else {
    card.style.background = getColor();
    card.style.height = '7.5rem';
  }

  card.querySelector('.group-title').innerHTML = `<span class="material-icons titleIcon">
  ${topic.privacy === "public" ? 'public' : 'lock'}</span> 
  ${topic.title}`;

  let optionsBtn = card.querySelectorAll('button')[0];

  optionsBtn.onclick = (event) => {
    event.preventDefault();
    showOptionsDialog(topic, card)
  };
  card.onclick = function (event) {
    event.preventDefault();
    if (event.target.tagName === 'BUTTON') {
      return;
    }

    buildfire.history.push(topic.title, {
      instanceId,
      topic
    });
    getData();
  };

  card.id = topic.id;
  return card;
}

function createListLink(topic) {
  let card = listLink.cloneNode();
  card.classList.remove('invisible');
  card.innerHTML = listLink.innerHTML;

  let linkImg = card.querySelector('.link-img');
  if (config.indicator === Helper.INDICATOR.IMAGE) {
    linkImg.style.backgroundImage = `url(${getImage(topic)})`;
  } else {
    linkImg.style.display = 'none';
    card.style.borderLeft = `solid 0.5rem ${getColor()}`;
  }

  card.querySelector('.link-title').innerHTML = topic.title;
  let optionsBtn = card.querySelectorAll('button')[0];
  card.onclick = function (event) {
    event.preventDefault();
    if (event.target.tagName === 'BUTTON') {
      return;
    }
    navigateTo(topic)
  };

  optionsBtn.onclick = (event) => {
    event.preventDefault();
    showOptionsDialog(topic, card)
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

  let types = topicTypeRadioGroup2.querySelectorAll('input[name="topicType2"]');
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

  let types2 = topicTypeRadioGroup.querySelectorAll('input[name="topicType"]');
  let type2;
  for (const elem of types2) {
    if (elem.checked) {
      type2 = elem.value;
    }
  }
  if (config.privacy === 'both' && !type2) {
    showMessage('Please, you have to select privacy type of topic');
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
  let privacy = '';
  if (config.privacy === 'both') {
    privacy = type2;
  } else privacy = config.privacy;
  topic.save(privacy)
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
    let pluginBreadCrumbs = [];
    buildfire.history.get(options, (err, breadcrumbs) => {
      if (err) {
        reject(err);
      } else {
        buildfire.getContext((err, context) => {
          if (err) reject(err);
          let homeBreadcrumb = null;
          breadcrumbs.map(bread => {
            if (bread.label === "Home") {
              bread.label = context.title;
              homeBreadcrumb = bread;
              pluginBreadCrumbs.push(bread);
            }
            if (bread.options.instanceId === context.instanceId) {
              pluginBreadCrumbs.push(bread);
            }
            if (bread.label === context.title) {
              if (bread.label !== homeBreadcrumb.label) {
                pluginBreadCrumbs.push(bread);
              }
            }
          })
          resolve(pluginBreadCrumbs)
        })
      }
    });
  })
}

function renderBreadcrumbs(breadcrumbs) {
  clearBreadcrumbs();
  if (breadcrumbs.length > 1 && breadcrumbs[breadcrumbs.length - 1].options.topic) {
    breadcrumbsDiv.classList.remove('invisible');
  } else {
    breadcrumbsDiv.classList.add('invisible');
  }

  // just show the plugin breadcrumbs
  let perviousBread;
  breadcrumbs.forEach((elem, index) => {
    if (!elem.options.topic) {
      perviousBread = elem;
    } else {
      if (perviousBread && !perviousBread.options.topic) {
        let breadcrumb = createBreadcrumb(perviousBread, 0);
        breadcrumbsDiv.appendChild(breadcrumb);
        perviousBread = null;
      }
      let breadcrumb = createBreadcrumb(elem, index);
      breadcrumbsDiv.appendChild(breadcrumb);
    }
  });
  breadcrumbsDiv.scrollLeft = 1000;
}

function createBreadcrumb(bread, index) {
  let breadcrumbElem = breadcrumbDiv.cloneNode();
  breadcrumbElem.classList.remove('invisible');
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

function showOptionsDialog(topic, targetElement) {
  const options = {
    listItems: [
      {
        id: 'cancel',
        icon: 'close',
        text: 'Cancel',
      }
    ]
  };

  if (config.privacy !== Helper.PRIVACY.PRIVATE) {
    options.listItems.unshift({
      id: 'report',
      icon: 'report',
      text: 'Report',
    })
  }

  if (loggedUser && topic.createdBy && topic.createdBy._id === loggedUser._id) {
    options.listItems.unshift({
      id: 'delete',
      icon: 'delete',
      text: 'Delete Topic',
    })
  }

  options.listItems.unshift({
    id: 'share',
    icon: 'share',
    text: 'Share with others',
  })

  const callback = (error, result) => {
    if (error) return console.error(error);
    buildfire.components.drawer.closeDrawer();
    switch (result.id) {
      case 'delete':
        openDeleteDialog(topic, targetElement)
        break;
      case 'report':
        openReportDialog(topic)
        break;
      case 'share':
        shareWithOthers(topic)
        break;
    }
  };

  buildfire.components.drawer.openBottomDrawer(options, callback);

}

function openDeleteDialog(topic, targetElement) {
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

  dialogDeleteBtn.onclick = function (event) {
    event.preventDefault();
    dialogDeleteBtn.disabled = true;
    topic.deletedBy = loggedUser;
    topic.delete(config.privacy)
      .then(result => {
        deleteTopicDialog.close();
        showMessage(`Successfully deleted ${topic.title} topic`)
        dialogDeleteBtn.disabled = false;
        listContainer.removeChild(targetElement);
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
    'Harassment',
    'Spamming',
    'Fraud',
  ]

  arrOfReasons.forEach((reason, index) => {
    const radioBtn = radioDiv.cloneNode();
    radioBtn.innerHTML = radioDiv.innerHTML;
    radioBtn.classList.remove('invisible');
    const radioInput = radioBtn.querySelector('input[name="reportReason"]');
    radioInput.id = 'reasonRadio' + index;
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


function navigateTo(topic) {
  const queryString = getQueryString(config.querystring, topic.id, topic.title, loggedUser ? loggedUser._id : null);
  let pluginData = config.pluginData;
  if (Object.keys(pluginData).length === 0) {
    buildfire.navigation.navigateToSocialWall({
      title: topic.title,
      queryString: `wid=${topic.id}&topic_title=${topic.title}&privacy=${topic.privacy}`
    })
  } else {
    if (topic.originalShareId) pluginData.queryString = 'wid=' + topic.originalShareId + '&privacy=' + topic.privacy;
    else pluginData.queryString = queryString + '&privacy=' + topic.privacy;
    buildfire.navigation.navigateTo(pluginData);
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
      text: 'Close',
    }
  };
  buildfire.components.toast.showToastMessage(options, (err, result) => {
    if (err) throw error;
  });
}

buildfire.navigation.onAppLauncherActive(() => {
  getData();
  buildfire.appearance.titlebar.show();
}, false);

buildfire.history.onPop((breadcrumb) => {
  getData();
  buildfire.appearance.titlebar.show();
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
  if ((config.privacy === Helper.PRIVACY.PUBLIC && config.writePrivacy === Helper.WRITE_PRIVACY.PRIVATE && config.writePrivacyTag && config.writePrivacyTag.trim().length)
    || config.privacy === Helper.PRIVACY.BOTH) {
    let writePrivacyTags = config.writePrivacyTag ? config.writePrivacyTag.split(",").map(tag => tag.trim()) : null;
    buildfire.getContext((err, context) => {
      if (err) return cb(false);
      let { appId } = context;
      if (loggedUser && loggedUser.tags && loggedUser.tags[appId] && writePrivacyTags && writePrivacyTags.length) {
        let userTags = loggedUser.tags[appId].map(tag => tag.tagName);
        for (let i = 0; i < userTags.length; i++) {
          for (let j = 0; j < writePrivacyTags.length; j++) {
            if (userTags[i] === writePrivacyTags[j]) {
              return cb(true)
            }
          }
        }
      }
      return cb(false);
    })
  } else {
    return cb(true)
  }
}

function showHideAddButton(hasPermission) {
  if (config.privacy !== Helper.PRIVACY.BOTH)
    addButton.style.display = hasPermission ? "block" : "none";
}

function getStrings() {
  let collectionName = "$bfLanguageSettings_en-us";
  buildfire.datastore.search({}, collectionName, (e, result) => {
    let strings = {};
    result = result[0]
    if (result && result.data && result.data.screenOne)
      strings = result.data.screenOne;
    else
      strings = stringsConfig.screenOne.labels;

    Object.keys(strings).forEach(e => {
      strings[e].value ? languages[e] = strings[e].value : languages[e] = strings[e].defaultValue;
    });
    setStrings();
  });
}

function setStrings() {
  dialogtitle.innerText = languages.newItem;
  topicTitleText.innerHTML = languages.topicTitle;
  groupsLabel.innerHTML = languages.group;
  linksLabel.innerHTML = languages.link;
  searchTxt.placeholder = languages.searchBar;
}

function shareWithOthers(data) {
  console.log(data)
  let link = {};
  link.title = data.title;
  link.type = "website";
  link.description = "Join group";
  let toShare = {};
  toShare.title = data.title;
  toShare.createdBy = { _id: data.createdBy._id };
  toShare.privacy = data.privacy;
  toShare.type = data.type;
  console.log(toShare);
  link.data = {
    toShare
  };

  buildfire.deeplink.generateUrl(link, function (err, result) {
    if (err) {
      console.error(err)
    } else {
      buildfire.device.share({ 
        subject: link.title,
        text: link.description,
        image: 'http://myImageUrl',
        link: result.url
       }, function (err,result) {
        if (err)
        console.log(err)
        else
          console.log(result)
       });
    }
  });
}

function subscribeToGroup(data) {
  let group = data.toShare;
  if (group.privacy === 'public') return getData();
  if (group.createdBy._id === loggedUser._id) return getData();
  let searchOptions = {}
  searchOptions.filter = {
    $and: [
      { '$json.createdBy._id': loggedUser._id },
      { '$json.title': group.title },
    ]
  }
  buildfire.userData.search(searchOptions, 'topics', function (err, result) {
    if (err) {
      console.log(err)
    }
    if (result && result.length > 0) {
      getData();
    }
    else {
      const topic = new Topic({
        title: group.title,
        type: group.type,
        parentTopicId: group.parentTopicId,
        originalShareId: group.id,
        createdBy: loggedUser,
        createdOn: new Date()
      });
      topic.save(group.privacy)
        .then((result => {
          showMessage(`You have been added to ${topic.title} topic`)
          getData();
        }))
        .catch(err => {
          console.error(err);
          showMessage(err.message);
        })
    }
  })

}