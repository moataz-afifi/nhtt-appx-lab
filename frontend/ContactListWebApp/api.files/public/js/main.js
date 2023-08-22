/**
 * Emun class for handing over
 * different toast messages to 
 * display to the user
 */
const logLevel = {
  INFO: 0,
  SUCCESS: 1,
  ERROR: 2
};

$(document).ready(function () {
  /**
   * Ajax call for see if there is an user log in
   */
  $.ajax({
    type: "get",
    url: "http://localhost:3200/users/connected",
    contentType: 'application/json',
    beforeSend: function () {
      $('#singin').parent().removeClass('active');
      $('#singin').addClass('disabled');
      $('#loadingUser').attr('hidden', false);
      showToast(logLevel.INFO, "Checking if user is logged in");
    },
    success: function (user) {
      console.log(user);
      $('#username').html("Logout");
      $('#username').attr('hidden', false);
      $('#singin').parent().removeClass('active');
      $('#singin').addClass('disabled');
      showToast(logLevel.SUCCESS, "User is logged");
      showContactTable();
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.log(errorThrown);
      $('#singin').parent().addClass('active');
      $('#singin').removeClass('disabled');
      showToast(logLevel.ERROR, jqXhr.responseText);
    },
    complete: function () {

    }
  });
});

/**
 * Function called to show the toast message in the UI
 * @param {logLevel} level to select the type of the toast 
 * @param {string} msg Message to display
 */
function showToast(level, msg) {
  toastr.remove();
  toastr.options.positionClass = "toast-top-center";
  toastr.options.timeOut = "2000";
  toastr.options.progressBar = false
  switch (level) {
    case logLevel.INFO:
      toastr.info(msg);
      break;
    case logLevel.SUCCESS:
      toastr.success(msg);
      break;
    case logLevel.ERROR:
      toastr.error(msg);
      break;
  }
}

/**
 * Function to add a table listener to react for 
 * Updates, Deletes when the user clicks in one contact in a row
 * @param {DataTable} table the DataTable object
 */
function addTableListener(table) {
  $('#contactTable tbody').on('click', 'tr', function () {
    var id = table.row(this).data()._id;
    var firstName = table.row(this).data().firstName;
    var lastName = table.row(this).data().lastName;
    var age = table.row(this).data().age;
    $('#formControlUpdate1').val(firstName);
    $('#formControlUpdate2').val(lastName);
    $('#formControlUpdate3').val(age);
    $("#contactId").val(id);
    $('#updateContact').modal('show');
  });
}

/**
 * Function to be called when the delete contact button is pressed
 * on a Contact row
 * @param {string} id the id of the user to be deleted 
 */
function deleteContact(id) {
  $.ajax({
    type: "delete",
    url: 'http://localhost:3200/contacts',
    contentType: 'application/json',
    data: JSON.stringify({ '_id': id }),
    beforeSend: function (xhr) {
      $('#loadingDelete').attr('hidden', false);
      $('#btnDeleteContact').attr('disabled', true);
    },
    success: function (msg) {
      console.log('The user has been sent to be deleted');
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.log(errorThrown);
      showToast(logLevel.ERROR, jqXhr.responseText);
    },
    complete: function () {
      $('#loadingDelete').attr('hidden', true);
      $('#btnDeleteContact').attr('disabled', false);
      $('#updateContact').modal('hide');
    }
  });
}

/**
 * Function to be called to store a new contact in the User logged Realm
 */
function saveContact() {
  var firstName = $('#formControlInput1').val()
  var lastName = $('#formControlInput2').val()
  var age = $('#formControlInput3').val() === undefined ? null : $('#formControlInput3').val()
  if (firstName === '' || lastName === '') {
    alert('First name and Last name are mandatory');
  } else {
    if (age === null) {
      var data = { 'firstName': firstName, 'lastName': lastName };
    } else {
      var data = { 'firstName': firstName, 'lastName': lastName, 'age': age };
    }
    $.ajax({
      type: "post",
      url: 'http://localhost:3200/contacts',
      contentType: 'application/json',
      data: JSON.stringify(data),
      beforeSend: function () {
        $('#loadingAdd').attr('hidden', false);
        $('#btnSaveContact').attr('disabled', true);
      },
      success: function (msg) {
        console.log(`The user has been sent to be created. ${msg}`);
      },
      error: function (jqXhr, textStatus, errorThrown) {
        console.error(errorThrown);
        showToast(logLevel.ERROR, jqXhr.responseText);
      },
      complete: function () {
        $('#addContact').modal('hide');
        $('#loadingAdd').attr('hidden', true);
        $('#btnSaveContact').attr('disabled', false);
        $('#formControlInput1').val('');
        $('#formControlInput2').val('');
      }
    });
  }
}

/**
 * Function to be called for update the properties
 * of the Contact selected in the Table 
 */
function updateContact() {
  console.log("update");
  var id = $("#contactId").val();
  var firstName = $('#formControlUpdate1').val();
  var lastName = $('#formControlUpdate2').val();
  var age = $('#formControlUpdate3').val() === undefined ? null : $('#formControlUpdate3').val();
  if (firstName === '' || lastName === '') {
    alert('First Name and Last Name are mandatory');
  } else {
    if (age === null) {
      var data = { '_id': id, 'firstName': firstName, 'lastName': lastName };
    } else {
      var data = { '_id': id, 'firstName': firstName, 'lastName': lastName, 'age': age };
    }
    $.ajax({
      type: "put",
      url: 'http://localhost:3200/contacts',
      contentType: 'application/json',
      data: JSON.stringify(data),
      beforeSend: function () {
        $('#btnUpdateContact').attr('disabled', true);
        $('#loadingUpdate').attr('hidden', false);
      },
      success: function (msg) {
        console.log('The user has been updated.');
      },
      error: function (jqXhr, textStatus, errorThrown) {
        console.error(errorThrown);
        showToast(logLevel.ERROR, jqXhr.responseText);
      },
      complete: function () {
        $('#updateContact').modal('hide');
        $('#loadingUpdate').attr('hidden', true);
        $('#btnUpdateContact').attr('disabled', false);
      }
    });
  }
}

function loadDataTable() {
  if ($.fn.dataTable.isDataTable('#contactTable')) {
    $('#contactTable').DataTable().ajax.reload();
  } else {
    showContactTable();
  }
}

/**
 * Datatable setup
 * @returns @param {DataTable} table
 */
function showContactTable() {
  var table = $('#contactTable').DataTable({
    paging: false,
    info: true,
    searching: true,
    order: [[1, "asc"]],
    ajax: {
      url: 'http://localhost:3200/contacts',
      type: 'get',
      dataSrc: '',
      error: function (xhr, error, code) {
        console.error(xhr.responseText);
        showToast(logLevel.ERROR, `Can't load contacts: ${xhr.responseText}`);
      },
    },
    columns: [
      {
        data: '_id',
        visible: false
      },
      { data: 'firstName' },
      { data: 'lastName' },
      { data: 'age' }
    ]
  });
  addTableListener(table);
  return table;
}

function logIn() {
  console.log("login");
  var email = $('#formLogInEmail').val()
  var pass = $('#formLogInPass').val()
  var data = { 'email': email, 'pass': pass };
  $.ajax({
    type: "post",
    url: "http://localhost:3200/users/signin",
    contentType: 'application/json',
    data: JSON.stringify(data),
    beforeSend: function () {
      $('#btnLogIn').attr('disabled', true);
      $('#loadingLogin').attr('hidden', false);
      $('#btnRegisterIn').attr('disabled', true);
    },
    success: function (msg) {
      console.log(msg);
      $('#username').html("Logout");
      $('#username').attr('hidden', false);
      $('#singin').parent().removeClass('active');
      $('#singin').addClass('disabled');
      loadDataTable();
      $('#signIn').modal('hide');
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.error(errorThrown);
      showToast(logLevel.ERROR, jqXhr.responseText);
    },
    complete: function () {
      $('#loadingLogin').attr('hidden', true);
      $('#btnLogIn').attr('disabled', false);
      $('#btnRegisterIn').attr('disabled', false);
    }
  });
}

/**
 * Function to register using email/password
 */
function register() {
  console.log("register");
  var email = $('#formLogInEmail').val()
  var pass = $('#formLogInPass').val()
  var data = { 'email': email, 'pass': pass };
  $.ajax({
    type: "post",
    url: "http://localhost:3200/users/register",
    contentType: 'application/json',
    data: JSON.stringify(data),
    beforeSend: function () {
      $('#btnRegisterIn').attr('disabled', true);
      $('#loadingRegister').attr('hidden', false);
      $('#btnLogIn').attr('disabled', true);
    },
    success: function (msg) {
      console.log(msg);
      $('#username').html("Logout");
      $('#username').attr('hidden', false);
      $('#singin').parent().removeClass('active');
      $('#singin').addClass('disabled');
      loadDataTable();
      $('#signIn').modal('hide');
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.error(errorThrown);
      showToast(logLevel.ERROR, jqXhr.responseText);
    },
    complete: function () {
      $('#loadingRegister').attr('hidden', true);
      $('#btnRegisterIn').attr('disabled', false);
      $('#btnLogIn').attr('disabled', false);
    }
  });
}

/**
 * Function to logout the current user
 */
function logOut() {
  $.ajax({
    type: "post",
    url: "http://localhost:3200/users/logout",
    beforeSend: function () {
      $('#btnLogout').attr('disabled', true);
      $('#loadingLogout').attr('hidden', false);
    },
    success: function (msg) {
      console.log(msg);
      $('#username').html('');
      $('#username').attr('hidden', true);
      $('#singin').removeClass('disabled');
      $('#singin').parent().addClass('active');
      var table = $('#contactTable').DataTable()
      table.clear();
      table.draw();
    },
    error: function (jqXhr, textStatus, errorThrown) {
      console.error(errorThrown);
    },
    complete: function () {
      $('#loadingLogout').attr('hidden', true);
      $('#btnLogout').attr('disabled', false);
      $('#logout').modal('hide');
    }
  });
}