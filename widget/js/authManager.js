const authManager = {
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      buildfire.auth.getCurrentUser((err, user) => {
        if (err) {
          reject(err);
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