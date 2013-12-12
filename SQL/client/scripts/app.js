// YOUR CODE HERE:
var lastMessageID = 0;
var url = "http://127.0.0.1:8081/classes/messages";
var messages = []; 
var rooms = {};
var users = {};
var escapeHtml = function(text, limit) {
  // if (limit === 20){
    // debugger;
  // }
  limit = limit || 200;
  if (text) {
    var newText = text.slice(0, limit);
    var escText = document.createTextNode(newText);
    var p = document.createElement();
    p.appendChild(escText);
    return p.innerHTML;
  }
  return '';
};

var makeController = function() {
  return {
    promise: null,
    currentRoom: "all_rooms",
    getMessages: function() {
      this.promise = $.ajax({
        // always use this url
        url: url + '/' + lastMessageID,    // + "?order=-createdAt" + "&limit=20",
        type: 'GET',
        contentType: 'application/json',
        success: function (data) {
          console.log(data);
          lastMessageID = data.results[data.results.length-1].id;
          // debugger;
          _.each(data.results, function(message) {
            rooms[message.roomname] = true;
            users[message.username] = true;
            messages.push(createMessage(message));
          });
          // debugger;
         },
        error: function (data) {
           console.error('chatterbox: Failed to receive messages');
        }
      });   // end of ajax get  
    },
    renderMessages: function(){
      // debugger;
      var that = this;
      this.promise.done(function() {
        // debugger;
        for (var i = messages.length - 1; i > 0; i--) {
          // debugger;
          // console.log("renderMessages: " + that.currentRoom);
          // debugger;
          var msgHTML=  messages[i].renderMessage(that.currentRoom);
          $chatSession = $('.chat-session');
          if (msgHTML) {
            $chatSession.append($(msgHTML));
            $chatSession.prop('scrollTop', $chatSession.prop('scrollHeight'));
          }
        }
      });
    },
  
    sendMessage: function(message) {
       $.ajax({
        // always use this url
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(message),
        success: function (data) {
          console.log("chatterbox: message sent");
        },
        error: function (data) {
          // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
          console.error('chatterbox: Failed to send messages');
        }
      });   // end of ajax post
    }
  }
};

$(document).ready(function() {
  var populateSelect = function() {
    var selectStr = '';
    var escapedRoom = '';
    // debugger;
    $('.dyn-room').remove();
    _.each(rooms, function(value, room){
      // console.log(room);
      escapedRoom = escapeHtml(room, 20);
      selectStr = '<option class="dyn-room" value="' + escapedRoom + '">' + escapedRoom + '</option>';
      $('.rooms select').append($(selectStr));
    });
  }
  // populateSelect();
  var roomSelected = false;
  var controller = makeController(url);

  // setTimeout(populateSelect, 5000);

  setInterval(function() {
    controller.getMessages();

    controller.renderMessages();
    if (!roomSelected) {
      populateSelect();
    }
  }, 2000);

  // populateSelect();

  // Submit button click handler
  // ==========================================================================
  $(".chat-input input[type=\"submit\"]").on("click", function(e){
     e.preventDefault();
     var message = {
      'username': window.location.search.slice(10),  // gets username from url
      'userID' : window.userID,
       'text': $(this).prev().val(),
       'roomname': 'taqueria'
     };
      $(this).prev().val("");
     controller.sendMessage(message);
  });

  // Room pulldown select click handler
  // ==========================================================================
   $('.rooms select').on('change', function(e) {
      e.preventDefault;
      var $selVal = $(this).val()
      if ($selVal !== "all_rooms") {
        // debugger;
        url = "http://127.0.0.1:8080/classes/taqueria";
        controller.currentRoom = $selVal;
        roomSelected = true;
      } else {
        roomSelected = false
      }
   });

});
