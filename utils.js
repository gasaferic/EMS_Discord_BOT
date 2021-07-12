module.exports = {
  updateField: function (array, field, value) {
    array.forEach((elem) => {
      if (elem.name === field) {
        elem.value = value
      }
    })
    return array
  },
  getFieldValue: function (array, field) {
    for (var elem of array) {
      if (elem.name === field) {
        return elem.value
      }
    }
  },
  getField: function (array, field) {
    for (var elem of array) {
      if (elem[field] !== undefined) {
        return elem[field]
      }
    }
  },
  isInServizio: function (arrayInServizio, id) {
    for (var elem of arrayInServizio) {
      if (elem.id === id) {
        return true;
      }
    }
    return false;
  },
  removeElemAtIndex: function(array, index) {
    var tempArray = []

    for (var elem of array) {
      if (array.indexOf(elem) !== index) {
        tempArray.push(elem)
      }
    }

    return tempArray;
  },
  updateGradiInServizio: function (arrayInServizio, utente, add) {
    if (add) {
      arrayInServizio.push({ username: utente.username, id: utente.id, timestampTimbro: new Date().getMilliseconds() })
    } else {
      for (var elem of arrayInServizio) {
        if (elem.id == utente.id) {
          arrayInServizio.splice(arrayInServizio.indexOf(elem), 1)
          break;
        }
      }
    }
  },
  getInServizioListString: function(array) {
    var listString = "";
    if (array.length === 0) {
      listString = "Nessuno in servizio"
    } else {
      for (var elem of array) {
        listString += elem.username + ((array.indexOf(elem) !== array.length - 1) ? "," : "")
      }
    }
    return listString
  },
  getHighestRole: function (rootRoles, userRoles) {
    for (var currentRole of rootRoles) {
      for (var currentUserRoleID of userRoles) {
        if (currentUserRoleID === currentRole.id) {
          return currentRole.id;
        }
      }
    }
  },
  // Gli passo l'id del ruolo dell'utente
  getRoleNameById: function (rootRoles, id) {
    for (const role of rootRoles.keys()) {
      if (role === id) {
        return rootRoles.get(role).name
      }
    }
  }
}