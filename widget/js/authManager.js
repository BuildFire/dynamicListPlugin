const authManager = {
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      buildfire.auth.getCurrentUser((err, user) => {
        if (err) {
          reject(err);
          return;
        }
        if (!user) {
          buildfire.auth.login({allowCancel: false} ,(err, loggedUser) => {
            if (err) {
              reject(err);
            } else {
              resolve(loggedUser);
            }
          })
        } else {
          resolve(user);
        }
      })
    })
  },
  login: (allowCancel) => {
    return new Promise((resolve, reject) => {
      buildfire.auth.login({allowCancel} ,(err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      })
    })
  },

}