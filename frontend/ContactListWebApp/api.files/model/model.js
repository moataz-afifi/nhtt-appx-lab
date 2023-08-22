/**
 * Contact class:
 * Represent a Schema in Realm App
 */
const Contact = {
  name: 'Contact',
  properties: {
    _id: 'objectId',
    owner_id: 'string?',
    firstName: 'string?',
    lastName: 'string?',
    age: 'string?'
  },
  primaryKey: '_id',
};

module.exports = { Contact }
