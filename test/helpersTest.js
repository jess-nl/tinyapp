const { assert } = require('chai');
const { getUserByEmail } = require('../helper');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = { 
      id: 'userRandomID', 
      email: 'user@example.com', 
      password: 'purple-monkey-dinosaur' 
    }
    assert.deepEqual(user, expectedOutput);
  });

  it('Non-existing user returns undefined', function() {
    const user = getUserByEmail("notvalid", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(getUserByEmail(user), expectedOutput);
  });
});