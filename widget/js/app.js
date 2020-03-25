let config;
let timerId;
let colorIndex = 0;
let loggedUser = null;
const topicInpuDialog = new mdc.dialog.MDCDialog(inputDialog);
const deleteTopicDialog = new mdc.dialog.MDCDialog(deleteDialog);
const reportTopicDialog = new mdc.dialog.MDCDialog(reportDialog);

function getConfig() {
  buildfire.spinner.show()
  Config.get()
    .then(result => {
      buildfire.spinner.hide()
      config = new Config(result.data);

      if (config.privacy === Config.PRIVACY.PRIVATE && !loggedUser) {
        enforceUserLogin();
      } else {
        getCurrentUser();
      }

    })
    .catch(err => {
      buildfire.spinner.hide()
      listContainer.classList.add('bitmap');
      console.error(err);
    });

  buildfire.datastore.onUpdate(result => {
    topicInpuDialog.close();
    deleteTopicDialog.close();
    reportTopicDialog.close();
    closeBottomSheet();
    
    config = new Config(result.data);
    if (config.privacy === Config.PRIVACY.PRIVATE && !loggedUser) {
      enforceUserLogin();
    } else {
      getCurrentUser();
    }
  });

  function enforceUserLogin() {
    authManager.getCurrentUser()
      .then(user => {
        if (user) {
          loggedUser = user;
          loadData();
          return;
        }

        authManager.login(false)
          .then(userCred => {
            loggedUser = userCred;
            loadData();
          })
          .catch(console.error);
      })
      .catch(console.error);
  }

  function getCurrentUser() {
    authManager.getCurrentUser()
      .then(user => {
        loggedUser = user;
        loadData();
      })
      .catch(console.error);
  }

  buildfire.auth.onLogout(() => {
    loggedUser = null;
    if (config.privacy === Config.PRIVACY.PRIVATE) {
      authManager.login(false)
        .then(user => {
          loggedUser = user;
          loadData();
        })
        .catch(console.error);
    }
  })

}

getConfig();

function loadData(filterData) {
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
      buildfire.spinner.hide()
      if (topics && topics.length === 0) {
        listContainer.classList.add('bitmap');
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
      listContainer.classList.add('bitmap');
      console.error(err);
    })
}

function search() {
  let target = searchTxt.value;
  let filter;
  if (target) {
    filter = {
      $text: {
        $search: target
      }
    };
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
  if (config.indicator === Config.INDICATOR.IMAGE) {
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
    navigateTo(topic)
  };

  card.removeAttribute('id');
  return card;
}

function createListLink(topic) {
  let card = listLink.cloneNode();
  card.classList.remove('invisiable');
  card.innerHTML = listLink.innerHTML;

  let linkImg = card.querySelector('.link-img');
  if (config.indicator === Config.INDICATOR.IMAGE) {
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
  card.removeAttribute('id');
  return card;
}

function clearList() {
  listContainer.classList.remove('bitmap');
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
    return;
  }

  const topic = new Topic({
    title,
    type,
    createdBy: loggedUser
  });
  addTopicBtn.disabled = true;
  topic.save(config.privacy)
    .then((result => {
      topicInpuDialog.close();
      loadData();
      topicTitle.value = '';
      addTopicBtn.disabled = false;
    }))
    .catch(err => {
      console.error(err);
      addTopicBtn.disabled = false;
    })


}

function showOptionsDailog(topic, targetEelement) {
  const bottomSheetCard = document.querySelector('#bottomSheet');
  const editOption = bottomSheetCard.querySelector('#editTopicOption');
  const deleteOption = bottomSheetCard.querySelector('#deleteTopicOption');
  const reportOption = bottomSheetCard.querySelector('#reportTopicOption');
  editOption.style.display = 'none'

  if (config.privacy === Config.PRIVACY.PRIVATE) {
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
    topic.delete(config.privacy)
      .then(result => {
        deleteTopicDialog.close();
        dialogDeleteBtn.disabled = false;
        listContainer.removeChild(targetEelement);
      })
      .catch(err => {
        dialogDeleteBtn.disabled = false;
        console.error(err);
      })
  };


}

function openReportDialog(topic) {
  closeBottomSheet();
  if (!loggedUser) {
    authManager.login(true)
      .then(user => {
        loggedUser = user;
      })
      .catch(console.error);
    return;
  }
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
      })
      .catch(err => {
        sendReportBtn.disabled = false;
        console.error(err);
      })
  };
}

function closeBottomSheet() {
  document.querySelector('.mdc-drawer').classList.remove('open-bottom-sheet');
  document.querySelector('.bottom-sheet').classList.remove('backdoor')
}

function navigateTo(topic) {
  const queryString = getQueryString(config.querystring, topic.id, topic.title, 544654);
  let pluginData = config.pluginData;
  pluginData.queryString = queryString;
  buildfire.navigation.navigateTo(pluginData)
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
    `https://app.buildfire.com/api/stockImages/${encodeURIComponent(topic.title)}?w=${getWeekNumber(new Date())}`, {
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