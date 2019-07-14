// Unit testing helper function. If email already exists:
const getUserByEmail = function(email, database) {
  for (const key in database) {
    if (email === database[key].email) {
      let currentUser = database[key];
      return currentUser;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };