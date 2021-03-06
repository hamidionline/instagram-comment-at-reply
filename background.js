//// globals

// api endpoint
var searchURLParts = ["https://www.instagram.com/web/search/topsearch/?context=blended&query=","&rank_token="];
var inputField = null;
var inputAsArray = [];
var autocompletes = [];
var typingLocation = 0;
var body = document.querySelector('body');
var pendingRequest = null;

//// utilities

// debounces given function by given delay
function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
};

//// Views

// renders the separator element between autocomplete suggestions
function renderSeparator() {
  var separator = document.createElement("span");
  separator.innerHTML = "|";
  separator.style.paddingLeft = '4px';
  separator.style.paddingRight = '4px';
  return separator;
}

// renders individual autocomplete options (usernames)
function renderAutocompleteOption(value, id) {
  var username = document.createElement("span");
  username.className = "autocomplete-option";
  username.id = id;
  username.innerHTML = '@' + value;
  username.style.color = '#003569';
  username.style.cursor = 'pointer';

  username.addEventListener('click',function() {
    var clickedID = username.id;
    handleSelectedOption(clickedID);
  });

  return username;
}

// renders full autocomplete element
// params: text input field element
//         text input field's parent element
//         autocomplete data (array from IG API response)
function renderAutocomplete(inputField, inputFieldParent, autocompleteResponseOptions) {
  var output = document.createElement("div");
  output.className = 'autocomplete-picker';
  output.style.display = "inline-block";
  for (var i=0; i<autocompleteResponseOptions.length; i++) {
    output.appendChild(renderAutocompleteOption(autocompleteResponseOptions[i].user.username, i));

    if (i<autocompleteResponseOptions.length-1) {
      output.appendChild(renderSeparator());
    }
  }
  inputFieldParent.appendChild(output);
}

// removes autocomplete element
function destructAutocomplete() {
  var autocomplete = document.getElementsByClassName('autocomplete-picker');
  if (autocomplete[0]) {
    autocomplete[0].remove();
  }
}

//// event handlers
function handleSelectedOption(clickedID) {
  inputAsArray[typingLocation] = "@"+autocompletes[clickedID].user.username;
  inputField.value = inputAsArray.join(" ");
  inputField.append(" ");
}

function handleResponse(res, inputField) {
  if(res.users[0] !== undefined) {
    destructAutocomplete();
    var inputFieldParent = inputField.parentNode;
    autocompletes = res.users.slice(0,3);
    renderAutocomplete(inputField, inputFieldParent, autocompletes);
  }
}

body.addEventListener('keyup', function(event) {
  if (event.target !== event.currentTarget && event.target.placeholder === 'Add a comment…') {
    inputField = event.target;
    var type = inputField.value;
    inputAsArray = type.split(" ");
    var lastWord = inputAsArray[inputAsArray.length-1];
    if (lastWord !== undefined && lastWord.charAt(0)==='@') {
      typingLocation = inputAsArray.length-1;
      lastWord = lastWord.substring(1);
      var searchURL = searchURLParts[0] + lastWord + searchURLParts[1] + "0.500";
      var oReq = new XMLHttpRequest();
      oReq.onload = function(e) {
        handleResponse(e.target.response, inputField);
        pendingRequest = null;
      }
      oReq.open('GET', searchURL);
      oReq.responseType = 'json';
      if (pendingRequest) {
        pendingRequest.abort();
      }
      oReq.send();
      pendingRequest = oReq;
    } else {
      destructAutocomplete();
    }
  }
  event.stopPropagation();
});
