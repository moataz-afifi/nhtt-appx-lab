const express = require("express");
const BSON = require("bson");
const { Contact } = require('../model/model');

var isListener = false;

const router = express.Router();

/**
 * ** ROUTES **
 */

/**
 * Get Contact List
 */
router.get('/', async (req, res) => {
  const contacts = await read().then((contacts) => {
    console.log(`Numero de contactos ${contacts.length}`);
    res.send(contacts);
  }).catch(err => {
    console.error("Failed to execute in:", err);
    res.status(400).send(`Failed to execute in ${err}`);
  });
});

/**
 * Add Contact
 */
router.post('/', async (req, res) => {
  if (!("firstName" in req.body) || !("lastName" in req.body)) {
    res.status(400).send("Missing first name or last name variables");
  } else {
    await save(req.body).then(() => {
      socket.emit("contact", "new contact created");
      res.status(201).send();
    }).catch(err => {
      console.error("Failed to save contact", err);
      res.status(400).send(`Failed to execute in ${err}`);
    });
  }
});

/**
 * Update contact 
 * */
router.put('/', async (req, res) => {
  if (!("firstName" in req.body) || !("lastName" in req.body) || !("_id" in req.body)) {
    res.status(400).send("Missing firstName, lastName or id variables");
  } else {
    await update(req.body).then(() => {
      socket.emit("contact", "contact updated");
      res.status(200).send();
    }).catch(err => {
      console.error("Failed to update contact", err);
      res.status(503).send(err);
    });
  }
});

/**
 * Delete Contact
 */
router.delete('/', async (req, res) => {
  if (!("_id" in req.body)) {
    res.status(400).send("Missing id variable");
  } else {
    await remove(req.body).then(() => {
      socket.emit("contact", "contact deleted");
      res.status(204).send();
    }).catch(err => {
      console.error("Failed to delete contact", err);
      res.status(503).send(err);
    });
  }
});

/**
 * ** AUXILIAR FUNCTIONS **
 */

/**
 * Function to open a Realm and stores it globally
 * @returns An instance of Realm (anonymous or of the user logged in)
 */
async function openRealm() {
  if (app.currentUser == null) {
    throw 'User not validated';
  } else {
    const config = {
      schema: [Contacts],
      sync: {
        user: app.currentUser,
        flexible: true,
        // initialSubscriptions: {
        //   update: (subs, realm) => {
        //     subs.add(
        //       realm.objects('Contact')
        //       );
        //   },
        // },
      },
    }
    try {
      return await Realm.open(config);
    } catch (err) {
      console.log("failed to open realm", err.message);
      throw err.message;
    }
  }
}

/**
 * Function to read the list of Contacts for a certain user
 * @returns {List<Contact>} List of Contacts
 */
async function read() {
  console.log("READ");
  const realm = await openRealm();
  const contacts = realm.objects('Contact').sorted('firstName');
  console.log(`${realm.subscriptions}`);
  if (!isListener) {
    contacts.addListener(listener)
    isListener = true;
  }
  return contacts;
};

/**
 * Function to save a new Contact in the private Realm of the user
 * @param {JSON Object with the properties of the Contact} body 
 */
async function save(body) {
  console.log("SAVE");
  const realm = await openRealm();
  const age = parseInt(body.age) || -1;
  realm.write(() => {
    realm.create('Contact', {
      _id: new BSON.ObjectID(),
      owner_id: app.currentUser.id,
      firstName: body.firstName,
      lastName: body.lastName,
      age: (age != -1) ? age : null
    });
  });
};

/**
 * Function to update a Contact
 * @param {Object} body the Contact Object to be updated 
 * @returns {Contact} the new updated Contact
 */
async function update(body) {
  console.log("UPDATE");
  const realm = await openRealm();
  let id = new body._id;
  const age = parseInt(body.age) || -1;
  const updatedContact = realm.write(() => {
    const contact = realm.objectForPrimaryKey('Contact', id)
    contact.firstName = body.firstName
    contact.lastName = body.lastName
    if (age != -1) {
      contact.age = age
    }
  });
  return updatedContact;
}

/**
 * Function to delete a Contact
 * @param {string} body the id of the contact to be deleted 
 */
async function remove(body) {
  console.log("DETELE");
  const realm = await openRealm();
  let id = new body._id;
  realm.write(() => {
    const contact = realm.objectForPrimaryKey('Contact', id)
    realm.delete(contact)
  });
}

/**
 * Function to clear the listener when the user logout
 */
var clearListener = async function () {
  console.log('clear listener');
  try {
    const realm = await openRealm();
    const contacts = realm.objects('Contact').sorted("firstName");
    contacts.removeListener(listener);
    isListener = false;
  } catch (error) {
    console.log(error.message)
  }
}

/**
 * The listener for changes
 * @param {contacts} contacts 
 * @param {*} changes 
 */
function listener(contacts, changes) {
  changes.insertions.forEach((index) => {
    console.log(`insert index: ${index}`);
    let contact = contacts[index];
    console.log("new contact: " + JSON.stringify(contact));
    socket.emit("add:contact", {
      contact: contact,
      message: "New contact added"
    });
  });
  changes.modifications.forEach((index) => {
    console.log(`update index: ${index}`);
    let contact = contacts[index];
    console.log("updated contact: " + JSON.stringify(contact));
    socket.emit("update:contact", {
      contact: contact,
      message: "Contact updated"
    });
  });
  changes.deletions.forEach((index) => {
    console.log(`deletion index: ${index}`);
    socket.emit("delete:contact", {
      contact: null,
      message: "Contact deleted"
    });
  });
}

module.exports = {
  router: router,
  clearListener: clearListener
}
