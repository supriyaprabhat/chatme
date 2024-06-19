const functions = require('firebase-functions');
const admin = require('firebase-admin');
const voipSender = require('./push-token-sender')
const messageSender = require('./message-sender')
const sizeof = require('object-sizeof');
const {generateVirgilJwt} =  require( './generate-virgil-jwt');

//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 
//Download original version from CodeCanyon from this link  - https://codecanyon.net/item/super-chat-android-chatting-app-with-groups-and-voicevideo-calls/46407287 


const iosEnabled = false


admin.initializeApp()

//message types
const SENT_TEXT = 1;
const SENT_IMAGE = 2;
const SENT_VIDEO = 5;
const SENT_VOICE_MESSAGE = 11;
const SENT_AUDIO = 9;
const SENT_FILE = 13;
const SENT_CONTACT = 16;
const SENT_LOCATION = 18;

//group events types
const ADMIN_ADDED = 1;
const USER_ADDED = 2;
const USER_REMOVED_BY_ADMIN = 3;
const USER_LEFT_GROUP = 4;
const GROUP_SETTINGS_CHANGED = 5;
const GROUP_CREATION = 6;
const ADMIN_REMOVED = 7;
const JOINED_VIA_LINK = 8;


const MESSAGE_TIME_LIMIT = 15;

const options = {
  priority: 'high',

  "mutable_content": true
}


const MAX_FCM_LIMIT = 4096

const packageName = "com.teamxdevelopers.superchat"



//this function will called whenver a message is created at the node 'meesages' 
//it will get the message data including the sender and receiver ids 
//and lastly send it to the receiver using his registrationTokens
exports.sendMessageNotification = functions.database.ref('/messages/{messageId}').onCreate((snap, context) => {
  //get the message object
  const val = snap.val();
  //get fromId field
  const fromId = val.fromId;
  //get toId field
  const toId = val.toId;
  //get messageId
  const messageId = context.params.messageId;

  //message Details
  const content = val.content;
  const metadata = val.metadata;
  const timestamp = val.timestamp;
  const type = val.type;









  // Get the list of device notification tokens.
  const getDeviceTokensPromise = admin.database().ref(`users/${toId}/notificationTokens/`).once('value');

});



//this function will send notifications whenever a new message created for a certain group
exports.sendMessagesForGroups = functions.database.ref(`/groupsMessages/{groupId}/{messageId}`).onCreate((snap, context) => {


})

//this will trigger whenever a new user added to a group
exports.participantAdded = functions.database.ref(`/groups/{groupId}/users/{userId}`).onCreate((snap, context) => {
  const groupId = context.params.groupId
  //the ID of the added user
  const userId = context.params.userId
  //the ID of the admin who added the user
  const addedByUid = context.auth.uid


  //this boolean will determine if the id was the same id of admin id
  const isThisUserCreatedTheGroup = addedByUid === userId && snap.val();



  //get userPhone
  const userPhonePromise = admin.database().ref(`/users/${userId}/phone`).once('value')
  //get admin who added the user phone's 
  const addedByPhonePromise = admin.database().ref(`/users/${addedByUid}/phone`).once('value')

  //execute the above Promises
  return Promise.all([userPhonePromise, addedByPhonePromise]).then((results) => {
    const userPhone = results[0].val()
    const addedByPhone = results[1].val()

    var eventType;
    if (userPhone === addedByPhone) {
      //if it's true then it's an Admin and it's the Group creator
      if (snap.val())
        eventType = GROUP_CREATION
      else
        //if it's false then it's a member that joined using an link
        eventType = JOINED_VIA_LINK
    }
    else {
      eventType = USER_ADDED
    }

    const time = Date.now()


    const event = {
      contextStart: `${addedByPhone}`,
      eventType: eventType,
      contextEnd: `${eventType === JOINED_VIA_LINK ? "null" : userPhone}`,
      timestamp: `${time}`
    }

    //if it's JOINED_VIA_LINK then set it as "link" else set it as the person who added this user
    var addedBy = eventType === JOINED_VIA_LINK ? "link" : addedByPhone;
    //set group event
    return admin.database().ref(`/groupEvents/${groupId}`).push().set(event).then(() => {
      //set who added this user to this group
      return admin.database().ref(`/groupMemberAddedBy/${userId}/${groupId}`).set(addedBy).then(() => {
        //set groupId for this user to determine what groups are participated in
        return admin.database().ref(`/groupsByUser/${userId}/${groupId}`).set(isThisUserCreatedTheGroup).then(() => {
          //delete the deleted user previously so he can join the group via invitaton link
          //also this is called only when an admin adds this user
          return admin.database().ref(`/groupsDeletedUsers/${groupId}/${userId}`).remove()
        })
      })
    })

  })



})

//this group events will trigger whenever a new change happened to a group, user added,admin removed, etc..
exports.groupEvents = functions.database.ref(`/groupEvents/{groupId}/{eventId}`).onCreate((snap, context) => {
  const groupId = context.params.groupId
  const eventId = context.params.eventId
  const val = snap.val()

  const contextStart = val.contextStart;
  const eventType = val.eventType.toString();
  const contextEnd = val.contextEnd;

  const payload = {
    data: {
      event: 'group_event',
      groupId: `${groupId}`,
      eventId: `${eventId}`,
      contextStart: `${contextStart}`,
      eventType: eventType,
      contextEnd: `${contextEnd}`
    }
  }

  var message = {
    topic: groupId,
    data: payload.data,
    "android": {
      "priority": "high"
    },
    apns: {

      payload: {

        aps: {
          "content-available": 1,
        },
      },
    },
  };




  return admin.messaging().send(message)
})



//this will send a message to the user to make him fetch the group data including the users in this a group and subscribe to FCM topic
exports.addUserToGroup = functions.database.ref(`/groupsByUser/{userId}/{groupId}`).onCreate((snap, context) => {
  const userId = context.params.userId
  const groupId = context.params.groupId
  //this boolean will determine if there is a need to send a notification
  //if it's false we don't need to send the message, since the user itself has created this group
  //and he already subscribed and fetched user data
  const sendNotification = !snap.val()



  if (!sendNotification) {
    return null
  }

  return admin.database().ref(`groups/${groupId}/info/name`).once('value').then((groupSnap) => {
    const groupName = groupSnap.val()

    return admin.database().ref(`users/${userId}/notificationTokens/`).once('value').then((snapshot) => {



      const tokens = Object.keys(snapshot.val())
      const message = getNewGroupPayload(groupId, groupName)
      message.tokens = tokens
      return admin.database().ref(`newGroups/${userId}/${groupId}`).set(message.data).then(() => {
        return messageSender.sendMulticastMessage(message, userId)
      })


    })

  })

})

//this will unsubscribe the user from FCM Topic (Group) when he removed from the group
exports.unsubscribeUserFromTopicOnDelete = functions.database.ref(`/groupsByUser/{userId}/{groupId}`).onDelete((snap, context) => {
  const userId = context.params.userId
  const groupId = context.params.groupId




  return admin.database().ref(`users/${userId}/notificationTokens/`).once('value').then((snapshot) => {
    const tokens = Object.keys(snapshot.val());

    return admin.messaging().unsubscribeFromTopic(tokens, groupId)


  })

})

//this will trigger when a group member removed
exports.participantRemoved = functions.database.ref(`/groups/{groupId}/users/{userId}`).onDelete((snap, context) => {
  const groupId = context.params.groupId
  const userId = context.params.userId
  const deletedByUid = context.auth.uid



  //get removed user phone
  const userPhonePromise = admin.database().ref(`/users/${userId}/phone`).once('value')
  //get phone of the admin who removed this user
  const removedByPhonePromise = admin.database().ref(`/users/${deletedByUid}/phone`).once('value')

  //execute above promises
  return Promise.all([userPhonePromise, removedByPhonePromise]).then((results) => {
    const userPhone = results[0].val()
    const removedByPhone = results[1].val()
    const time = Date.now()



    var contextStart;
    var contextEnd;
    var eventType;
    //if the id is the same id of deletedById,then user exits the group by himself
    if (userId === deletedByUid) {
      eventType = USER_LEFT_GROUP
      contextStart = userPhone
      contextEnd = 'null'
    }
    //otherwise an admin removed this user
    else {
      eventType = USER_REMOVED_BY_ADMIN
      contextStart = removedByPhone
      contextEnd = userPhone
    }

    const event = {
      contextStart: `${contextStart}`,
      eventType: eventType,
      contextEnd: `${contextEnd}`,
      timestamp: `${time}`
    }

    //if user removed by admin then add his id to deleted users of the group
    //this will prevent this user from joining the group again when using Group Invitation Link


    if (eventType === USER_REMOVED_BY_ADMIN) {

      return admin.database().ref(`/groupsDeletedUsers/${groupId}/${userId}`).set(true).then(() => {


        //set group Event in database
        return admin.database().ref(`/groupEvents/${groupId}`).push().set(event).then(() => {


          //if the deleted user is an admin, then check if there are other admins,if not set a new admin randomly
          if (snap.val() === true) {
            return admin.database().ref(`/groups/${groupId}/users/`).once('value').then((snapshot) => {



              //if the group is not exists return null and do nothing
              if (snapshot.val() === null) {
                return null
              }

              const users = snapshot.val()

              //check if there is another admin,if not set a new admin randomly


              //check if there is another admin in group, if not we will generate an admin randomly
              if (!isThereAdmin(users)) {



                //get current users
                const usersArray = Object.keys(snapshot.val())

                //generate a new admin
                const newAdminUid = usersArray[Math.floor(Math.random() * usersArray.length)];




                //set new admin
                return admin.database().ref(`/groups/${groupId}/users/${newAdminUid}`).set(true).then(() => {

                  //remove the user from group 
                  return admin.database().ref(`/groupsByUser/${userId}/${groupId}`).remove().then(() => {
                    // return admin.messaging().sendToTopic(groupId, payload).then(() => {
                    //   
                    // })
                  })
                })
              }
            })
          }



          //if the removed user is not admin ,just remove him from the group
          return admin.database().ref(`/groupsByUser/${userId}/${groupId}`).remove()

        })

      })
    }

    //set group Event in database
    return admin.database().ref(`/groupEvents/${groupId}`).push().set(event).then(() => {


      //if the deleted user is an admin, then check if there are other admins,if not set a new admin randomly
      if (snap.val() === true) {
        return admin.database().ref(`/groups/${groupId}/users/`).once('value').then((snapshot) => {



          //if the group is not exists return null and do nothing
          if (snapshot.val() === null) {
            return null
          }

          const users = snapshot.val()

          //check if there is another admin,if not set a new admin randomly


          //check if there is another admin in group, if not we will generate an admin randomly
          if (!isThereAdmin(users)) {



            //get current users
            const usersArray = Object.keys(snapshot.val())

            //generate a new admin
            const newAdminUid = usersArray[Math.floor(Math.random() * usersArray.length)];




            //set new admin
            return admin.database().ref(`/groups/${groupId}/users/${newAdminUid}`).set(true).then(() => {

              //remove the user from group 
              return admin.database().ref(`/groupsByUser/${userId}/${groupId}`).remove().then(() => {

              })
            })
          }
        })
      }



      //if the removed user is not admin ,just remove him from the group
      return admin.database().ref(`/groupsByUser/${userId}/${groupId}`).remove()

    })


  })
})

//this will called when an admin changed (removed,or added)
exports.groupAdminChanged = functions.database.ref(`/groups/{groupId}/users/{userId}`).onUpdate((change, context) => {
  const groupId = context.params.groupId
  const userId = context.params.userId
  var addedById = undefined

  //check if the admin was added by another admin or has ben set Randomly by cloud functions
  if (context.auth !== undefined) {
    addedById = context.auth.uid
  }



  //check if admin added or removed
  const isNowAdmin = change.after.val()

  const userPhonePromise = admin.database().ref(`/users/${userId}/phone`).once('value')
  const addedByPhonePromise = admin.database().ref(`/users/${addedById}/phone`).once('value')

  //if there is no admin left in group ,then it will be set by functions,therefore 'addedById' will be undefined
  if (addedById === undefined) {
    return userPhonePromise.then((snap) => {
      const userPhone = snap.val()
      const timestamp = Date.now()
      const event = {
        contextStart: `null`,
        eventType: ADMIN_ADDED,
        contextEnd: `${userPhone}`,
        timestamp: `${timestamp}`
      }



      return admin.database().ref(`/groupEvents/${groupId}/`).push().set(event)
    })
  }

  //otherwise get users phone and set the event
  return Promise.all([userPhonePromise, addedByPhonePromise]).then((results) => {
    const userPhone = results[0].val()
    const addedByPhone = results[1].val()
    var eventType;

    if (isNowAdmin) {
      eventType = ADMIN_ADDED
    }
    else {
      eventType = ADMIN_REMOVED
    }

    const timestamp = Date.now()
    const event = {
      contextStart: `${addedByPhone}`,
      eventType: eventType,
      contextEnd: `${userPhone}`,
      timestamp: `${timestamp}`
    }


    return admin.database().ref(`/groupEvents/${groupId}/`).push().set(event)

  })

})

//this will called when the photo or 'onlyAdminsCanPost' changed
exports.groupInfoChanged = functions.database.ref(`/groups/{groupId}/info`).onUpdate((change, context) => {
  const groupId = context.params.groupId
  const changedById = context.auth.uid


  return admin.database().ref(`/users/${changedById}/phone`).once('value').then((snapshot) => {
    const changedByPhone = snapshot.val()
    const event = {
      eventType: GROUP_SETTINGS_CHANGED,
      contextStart: `${changedByPhone}`,
      contextEnd: 'null'
    }

    return admin.database().ref(`/groupEvents/${groupId}/`).push().set(event)

  })



})

//this will delete the message for every one in the group
exports.deleteMessageForGroup = functions.database.ref(`deleteMessageRequestsForGroup/{groupId}/{messageId}`).onCreate((snap, context) => {
  const groupId = context.params.groupId
  const messageId = context.params.messageId
  const messageAuthorUid = context.auth.uid

  //get the message
  return admin.database().ref(`/groupsMessages/${groupId}/${messageId}`).once('value').then((results) => {


    const message = results.val()
    const timestamp = message.timestamp

    //check if message time has not passed 
    if (!timePassed(timestamp)) {
      //send delete message to the group


      return admin.database().ref(`groups/${groupId}/users`).once('value').then((usersSnap) => {
        const users = Object.keys(usersSnap.val())
        const messagesToSave = []

        const deletedMessage = {
          messageId: messageId,
          groupId: groupId,
          isGroup: true,
          isBroadcast: false
        }

        users.forEach(uid => {
          //in case if this message was deleted by this user
          if (uid !== messageAuthorUid) {
            messagesToSave.push(admin.database().ref(`deletedMessages/${uid}/${messageId}`).set(deletedMessage))
          }
        });

        const messageNotification = getDeleteMessagePayload(messageId)
        messageNotification.condition = getCondition(groupId, messageAuthorUid)

        return Promise.all(messagesToSave).then(() => {
          return admin.messaging().send(messageNotification)
        })



      })


    }

    return null
  })
})

//this will delete the message for every one in the group
exports.deleteMessageForBroadcast = functions.database.ref(`deleteMessageRequestsForBroadcast/{broadcastId}/{messageId}`).onCreate((snap, context) => {
  const broadcastId = context.params.broadcastId
  const messageId = context.params.messageId
  const messageAuthorUid = context.auth.uid

  //get the message
  return admin.database().ref(`broadcastsMessages/${broadcastId}/${messageId}`).once('value').then((results) => {
    const message = results.val()
    const timestamp = message.timestamp



    //check if message time has not passed 
    if (!timePassed(timestamp)) {
      //send delete message to the group



      return admin.database().ref(`broadcasts/${broadcastId}/users`).once('value').then((usersSnap) => {
        const users = Object.keys(usersSnap.val())
        const messagesToSave = []

        const deletedMessage = {
          messageId: messageId,
          broadcastId: broadcastId,
          isGroup: false,
          isBroadcast: true
        }

        users.forEach(uid => {
          //in case if this message was deleted by this user
          if (uid !== messageAuthorUid) {
            messagesToSave.push(admin.database().ref(`deletedMessages/${uid}/${messageId}`).set(deletedMessage))
          }
        });


        return Promise.all(messagesToSave).then(() => {
          const messageNotification = getDeleteMessagePayload(messageId)
          message.topic = broadcastId
          return admin.messaging().send(messageNotification)
        })



      })

    }
    return null

  })
})

//this will delete message for other user in a chat
exports.deleteMessage = functions.database.ref(`/deleteMessageRequests/{messageId}`).onCreate((snap, context) => {
  const messageId = context.params.messageId




  return admin.database().ref(`messages/${messageId}`).once('value').then((results) => {
    const message = results.val()
    const timestamp = message.timestamp
    const toId = message.toId

    if (!timePassed(timestamp)) {


      return admin.database().ref(`/users/${toId}/notificationTokens`)
        .once('value')
        .then((tokensSnapshot) => {
          // Check if there are notification tokens.
          if (!tokensSnapshot.hasChildren()) {
            return
          }

          const tokens = Object.keys(tokensSnapshot.val())

          const message = getDeleteMessagePayload(messageId, true)
          message.tokens = tokens

          const deletedMessage = {
            messageId: messageId,
            isGroup: false,
            isBroadcast: false
          }

          return admin.database().ref(`deletedMessages/${toId}/${messageId}`).set(deletedMessage).then(() => {
            return messageSender.sendMulticastMessage(message, toId)
          })



        })
    }

    return null

  })

})


exports.setStatusCount = functions.database.ref(`statusSeenUids/{uid}/{statusId}`).onCreate((snap, context) => {
  const uid = context.params.uid
  const statusId = context.params.statusId

  return admin.database().ref(`statusCount/${uid}/${statusId}`).once('value').then((results => {
    const count = results.exists() ? snap.val() : 0
    return admin.database().ref(`statusCount/${uid}/${statusId}`).set(count + 1)
  }))
})

exports.subscribeToBroadcast = functions.database.ref(`broadcasts/{broadcastId}/users/{uid}`).onCreate((snap, context) => {
  const uid = context.params.uid
  const broadcastId = context.params.broadcastId
  const isCreator = snap.val()

  return admin.database().ref(`broadcastsByUser/${uid}/${broadcastId}`).set(isCreator).then(() => {
    //if it's true then this user is whom created the broadcast and there is no need to subscribe to topic
    if (snap.val()) {
      return null
    }

    return admin.database().ref(`users/${uid}/notificationTokens`).once('value').then((results) => {
      const tokens = Object.keys(results.val())
      //subscribe to FCM Topic
      return admin.messaging().subscribeToTopic(tokens, broadcastId)
    })

  })
})

//this is to resubscribe the user for broadcasts when he re-installs the app(when a new notification token generated)
exports.resubscribeUserToBroadcasts = functions.database.ref(`users/{uid}/notificationTokens/{token}`).onCreate((snap, context) => {
  const uid = context.params.uid
  const token = context.params.token
  return admin.database().ref(`broadcastsByUser/${uid}`).once('value').then((results) => {
    const promises = []
    results.forEach((snapshot) => {
      //add only the broadcasts that are not created by the user,since we don't need to subscribe him to broadcast
      if (!snapshot.val()) {
        promises.push(admin.messaging().subscribeToTopic(token, snapshot.key))
      }


    })

    return Promise.all(promises).then((results) => {

    })
  })
})

exports.sendMessageToBroadcast = functions.database.ref(`broadcastsMessages/{broadcastId}/{messageId}`).onCreate((snap, context) => {
  //get the message object
  const val = snap.val();
  //get fromId field
  const fromId = val.fromId;
  //get toId field
  const toId = val.toId;
  //get messageId
  const messageId = context.params.messageId;
  const broadcastId = context.params.broadcastId;


  //message Details
  const content = val.content;
  const metadata = val.metadata;
  const timestamp = val.timestamp;
  const type = val.type;



  //get user info
  const getSenderInfo = admin.database().ref(`users/${fromId}/phone`).once('value');

  //determine if user is blocked
  const isUserBlocked = admin.database().ref(`blockedUsers/${toId}/${fromId}/`).once('value');

  //Execute the Functions
  return Promise.all([getSenderInfo, isUserBlocked]).then(results => {
    const friendSnapshot = results[0];
    const isBlockedSnapshot = results[1];



    //check if user is blocked,if so do not send the message to him
    if (isBlockedSnapshot.exists()) {
      return
    }

    //get sender phone number
    const senderPhone = friendSnapshot.val();



    //payload contains the data to send it to receiver
    var message = getMessagePayload(type, val, senderPhone, content, timestamp, fromId, toId, undefined, messageId, metadata);
    message.topic = broadcastId

    return admin.database().ref(`broadcasts/${broadcastId}/users`).once('value').then((usersSnap) => {
      const users = Object.keys(usersSnap.val())
      const messagesToSave = []



      users.forEach(uid => {
        //in case if this message was deleted by this user
        if (uid !== fromId) {
          messagesToSave.push(admin.database().ref(`userMessages/${uid}/${messageId}`).set(message.data))
        }
      });


      return Promise.all(messagesToSave).then(() => {
        message.data = removeExtraLimitForPayload(message.data)
        return admin.messaging().send(message)
      })



    })


  });
})

exports.unsubscribeUserFromBroadcast = functions.database.ref(`broadcasts/{broadcastId}/users/{userId}`).onDelete((snap, context) => {
  const userId = context.params.userId
  const broadcastId = context.params.broadcastId


  return admin.database().ref(`users/${userId}/notificationTokens/`).once('value').then((snapshot) => {
    const tokens = Object.keys(snapshot.val());

    return admin.database().ref(`broadcastsByUser/${userId}/${broadcastId}`).remove().then(() => {
      return admin.messaging().unsubscribeFromTopic(tokens, broadcastId)
    })


  })
})







exports.sendUnDeliveredNotifications = functions.https.onCall((data, context) => {
  return admin.database().ref(`sendUnDeliveredNotificationsLock`).once('value').then((lockSnap) => {

    if (lockSnap.exists()) {

      return null
    } else {
      return admin.database().ref(`sendUnDeliveredNotificationsLock`).set(true).then(() => {

        // return new Promise((resolve, reject) => {
        //   setTimeout(function () {
        const uid = context.auth.uid

        const getUserMessages = admin.database().ref(`userMessages/${uid}`).once('value')
        const getDeletedMessages = admin.database().ref(`deletedMessages/${uid}`).once('value')
        const getNewGroups = admin.database().ref(`newGroups/${uid}`).once('value')

        return Promise.all([getUserMessages, getDeletedMessages, getNewGroups]).then((results) => {
          const userMessages = results[0]
          const deletedMessages = results[1]
          const newGroups = results[2]


          const notifications = []



          return admin.database().ref(`users/${uid}/notificationTokens`).once('value').then((tokensSnap) => {

            const tokens = Object.keys(tokensSnap.val())



            userMessages.forEach(messageSnap => {

              const message = messageSnap.val()
              const notification = getMessagePayload(message.type, message, message.phone, message.content, message.timestamp, message.fromId, message.toId, message.isGroup, message.messageId, message.metadata)
              notification.tokens = tokens
              notification.data = removeExtraLimitForPayload(message.data)
              notifications.push(messageSender.sendMulticastMessage(notification, uid))


            });



            deletedMessages.forEach(deletedMessageSnap => {
              const deletedMessage = deletedMessageSnap.val()
              const notification = getDeleteMessagePayload(deletedMessage.messageId)
              notification.tokens = tokens
              notifications.push(messageSender.sendMulticastMessage(notification, uid))

            });


            newGroups.forEach(newGroupSnap => {

              const newGroup = newGroupSnap.val()

              const notification = getNewGroupPayload(newGroup.groupId, newGroup.groupName)
              notification.tokens = tokens
              notifications.push(messageSender.sendMulticastMessage(notification, uid))

            });




            return Promise.all(notifications).then(() => {

              return admin.database().ref(`sendUnDeliveredNotificationsLock`).remove()
            }).catch(() => {
              return admin.database().ref(`sendUnDeliveredNotificationsLock`).remove()
            })
          })

        })
        // .then(resolve, reject);






        // }, 8 * 1000);
        // });



      })
    }
  })


})

exports.sendNewCallNotification = functions.database.ref(`userCalls/{uid}/{callId}`).onCreate((snap, context) => {
  const val = snap.val()


  const callId = val.callId
  const timestamp = val.timestamp
  const fromId = val.callerId
  const toId = val.toId
  const callType = val.callType
  const channel = val.channel
  const uid = context.params.uid
  const groupId = val.groupId
  const groupName = val.groupName
  const phoneNumber = val.phoneNumber


  const data = {
    event: 'new_call',
    callId,
    timestamp: `${timestamp}`,
    callerId: fromId,
    toId,
    channel,
    callType: `${callType}`,
    groupId,
    groupName,
    phoneNumber,
  }
  removeUndefined(data)

  // Get the list of device notification tokens.

  return admin.database().ref(`users/${uid}/`).once('value').then(userSnapshot => {
    // Check if there are notification tokens tokens.
    const tokensSnapshot = userSnapshot.child('notificationTokens')

    if (!tokensSnapshot.hasChildren()) {
      return
    }

    const pkTokenSnapshot = userSnapshot.child('pktoken')
    var pkTokens = []
    if (pkTokenSnapshot.exists()) {
      pkTokens = Object.keys(pkTokenSnapshot.val())
    }


    const tokens = []
    //get android tokens only
    tokensSnapshot.forEach(token => {
      const platform = token.val()
      if (platform !== "ios") {
        tokens.push(token.key)
      }
    })


    // Listing all tokens.



    const message = getNewCallPayload(callId, fromId, toId, timestamp, callType, channel)
    message.data = data
    message.tokens = tokens



    if (iosEnabled) {

      if (tokens.length == 0) {


        return voipSender.sendPkToken(pkTokens, data)
      }

      const sendPushKitNotification = voipSender.sendPkToken(pkTokens, data)
      const sendNotificationMessage = messageSender.sendMulticastMessage(message, uid)

      return Promise.all([sendNotificationMessage, sendPushKitNotification])
    } else {
      return messageSender.sendMulticastMessage(message, uid)
    }

  })

})

exports.indexNewCall = functions.database.ref(`newCalls/{toId}/{fromId}/{callId}/`).onCreate((snap, context) => {


  const val = snap.val()

  const callId = val.callId
  const timestamp = val.timestamp
  const fromId = val.callerId
  const toId = val.toId
  const callType = val.callType
  const channel = val.channel


  //determine if user is blocked
  return admin.database().ref(`blockedUsers/${toId}/${fromId}/`).once('value').then(isBlockedSnapshot => {
    if (isBlockedSnapshot.exists()) {
      return
    }

    return admin.database().ref(`users/${fromId}/phone`).once('value').then(snap => {
      const phoneNumber = snap.val()
      const data = {
        callId,
        timestamp,
        callerId: fromId,
        toId,
        callType,
        channel,
        phoneNumber
      }


      return admin.database().ref(`userCalls/${toId}/${callId}`).set(data)

    })

  })




})

exports.indexNewGroupCall = functions.database.ref(`groupCalls/{groupId}/{callId}/`).onCreate((snap, context) => {

  const val = snap.val()

  const callId = val.callId
  const timestamp = val.timestamp
  const callerId = val.callerId
  const callType = val.callType
  const groupId = val.groupId
  const channel = val.channel





  return admin.database().ref(`groups/${groupId}`).once('value').then((snapshot) => {
    const uidsSnapshot = snapshot.child("users")
    const groupName = snapshot.child("info").child("name").val()
    const uids = Object.keys(uidsSnapshot.val())





    const promises = []
    const data = {
      callId,
      timestamp,
      callerId,
      callType,
      groupId,
      channel,
      groupName
    }

    uids.forEach(uid => {
      if (uid !== callerId) {
        promises.push(admin.database().ref(`userCalls/${uid}/${callId}`).set(data))
      }
    })

    return Promise.all(promises)

  })

})





function getDeleteMessagePayload(messageId) {


  var message = {
    data: {
      event: "message_deleted",
      messageId: `${messageId}`
    },
    "android": {
      "priority": "high"
    },

    apns: {
      headers: {
        "apns-topic": `${packageName}`
      },
      payload: {

        aps: {
          alert: {
            title: "Deleted Message",
            body: 'this Message was deleted',

          },
          "mutable-content": 1,
        },
      },
    },
  };


  return message
}

function getDeviceIdChangedPayload(deviceId) {
  var message = {
    data: {
      event: "logout",
      deviceId
    },
    "android": {
      "priority": "high"
    },

    apns: {
      headers: {
        "apns-topic": `${packageName}`
      },
      payload: {

        aps: {
          alert: {
            title: "Logged out",
            body: 'you have logged in on another device',

          },
          "mutable-content": 1,
        },
      },
    },
  };


  return message
}

function getNewGroupPayload(groupId, groupName) {
  const payload = {
    data: {
      event: 'new_group',
      groupId: `${groupId}`,
      groupName: `${groupName}`
    }
  }

  var message = {
    data: payload.data,
    "android": {
      "priority": "high"
    },
    apns: {
      headers: {
        "apns-topic": `${packageName}`
      },
      payload: {

        aps: {
          alert: {
            title: 'New Group',
            body: `you have been added to ${groupName}`,

          },
          "mutable-content": 1,
        },
      },
    },
  };

  return message
}

function getNewCallPayload(callId, fromId, toId, timestamp, callType, channel) {
  const payload = {
    data: {
      event: 'new_call',
      callId,
      fromId,
      toId,
      timestamp: `${timestamp}`,
      callType: `${callType}`,
      channel
    }
  }


  var message = {
    data: payload.data,
    "android": {
      "priority": "high"
    },
    apns: {
      headers: {
        "apns-topic": `${packageName}`
      },
      payload: {

        aps: {
          alert: {
            title: 'New Call',
            body: `new call`,

          },
          "mutable-content": 1,
        },
      },
    },
  }

  return message

}


function removeExtraLimitForPayload(data){
  let payloadSize = sizeof(data)

  if (payloadSize > MAX_FCM_LIMIT) {
    if (data.type === SENT_TEXT && data.partialText) {
      data.content = ''
    }
    data.thumb = ''
  }

  return data
}


function getMessagePayload(type, val, senderPhone, content, timestamp, fromId, toId, isGroup, messageId, metadata) {
  var payload;
  if (type == SENT_IMAGE || type == SENT_VIDEO) {
    //get blurred thumb from image or video
    const thumb = val.thumb;
    //get media duration if it's a Video if not it will send 'undefined'
    const mediaDuration = val.mediaDuration;
    // Notification details.
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        thumb: `${thumb}`,
        mediaDuration: `${mediaDuration}`,
        isGroup: `${isGroup}`
      }
    };
  }
  else if (type == SENT_VOICE_MESSAGE || type == SENT_AUDIO) {
    //get voice message or audio duration
    const mediaDuration = val.mediaDuration;
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        mediaDuration: `${mediaDuration}`,
        isGroup: `${isGroup}`
      }
    };
  }
  else if (type == SENT_FILE) {
    //get file size
    const fileSize = val.fileSize;
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        fileSize: `${fileSize}`,
        isGroup: `${isGroup}`
      }
    };
  }
  else if (type == SENT_CONTACT) {
    //convert contact map to JSON to send it as JSON string to the client
    const contact = val.contact
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        contact: `${contact}`,
        isGroup: `${isGroup}`
      }
    };
  }
  else if (type == SENT_LOCATION) {
    //convert location map to JSON to send it as JSON string to the client      
    const location = val.location;
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        location: `${location}`,
        isGroup: `${isGroup}`
      }
    };
    payload.data.lat = location.lat
    payload.data.lng = location.lng
    payload.data.address = location.address
    payload.data.name = location.name
    payload.data.location = true
  }
  //it's a Text Message
  else {
    payload = {
      data: {
        phone: `${senderPhone}`,
        content: `${content}`,
        timestamp: `${timestamp}`,
        fromId: `${fromId}`,
        toId: `${toId}`,
        messageId: `${messageId}`,
        type: `${type}`,
        metadata: `${metadata}`,
        isGroup: `${isGroup}`,
        partialText: `${val.partialText}`
      }
    };
  }


  const data = payload['data']
  data['quotedMessageId'] = val.quotedMessageId
  data['statusId'] = val.statusId
  data.encryptionType = val.encryptionType



  removeUndefined(data)





  var message = {
    data: data,
    "android": {
      "priority": "high"
    },
    apns: {

      headers: {
        "apns-topic": `${packageName}`
      },
      payload: {

        aps: {
          alert: {
            title: `${senderPhone}`,
            body: 'New Message',

          },

          "mutable-content": 1,
        },
      },
    },
  };

  return message

}



//remove undefined items from payload
function removeUndefined(obj) {
  for (var propName in obj) {
    if (typeof obj[propName] === "undefined" || obj[propName] === undefined || obj[propName] === 'undefined') {
      delete obj[propName];
    }
  }
}


//check if there is another admin in a group
function isThereAdmin(obj) {
  for (const k in obj) {
    if (obj[k] === true) {
      return true;
    }
  }
}

//check if message time not passed
function timePassed(timestamp) {
  return Math.floor((new Date() - timestamp) / 60000) > MESSAGE_TIME_LIMIT
}

function getCondition(groupId, fromId) {
  return `'${groupId}' in topics && !('${fromId}' in topics)`

}
/*
since PushKit Tokens may be generated only once for each device
we need to take an action in case if a user uninstalls the app on his device
and later on he signed in using another number, therefore we want to delete the token for old user
*/
exports.indexPKToken = functions.database.ref(`users/{userId}/pktoken/{token}`).onCreate(async (snap, context) => {
  const userId = context.params.userId
  const token = context.params.token

  let ref = admin.database().ref(`pkTokens/${token}`)
  let snapshot = await ref.once('value')

  //delete old tokens if exists
  if (snapshot.exists()) {
    let oldUserOfToken = snapshot.val()
    await admin.database().ref(`users/${oldUserOfToken}/pktoken/${token}`).remove()
  }

  return ref.set(userId)
})

exports.deviceIdChanged = functions.database.ref(`deviceId/{uid}`).onUpdate(async (snap, context) => {
  const uid = context.params.uid
  const newDeviceId = snap.after.val()
  let userRef = admin.database().ref(`users/${uid}`)
  const tokensSnap = await userRef.child(`notificationTokens`).once('value');
  const tokens = Object.keys(tokensSnap.val())
  let payload = getDeviceIdChangedPayload(newDeviceId)
  payload.tokens = tokens

  await admin.messaging().sendMulticast(payload)



  return Promise.all([
    userRef.child(`notificationTokens`).remove(),
    userRef.child(`pktoken`).remove(),
  ]
  )


})

exports.getVirgilJwt = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
      'while authenticated.');
  }
  
  // You can use context.auth.token.email, context.auth.token.phone_number or any unique value for identity
  const identity = context.auth.token.uid;
  const token = await generateVirgilJwt(identity);

  return {
    token: token.toString()
  };
});

exports.deleteGroupsByUserOnUserDeletion = functions.database.ref(`deleteUsersRequests/{uid}`).onCreate(async (snap, context) => {
  const uid = context.params.uid
  const groupsByUserRef = admin.database().ref(`groupsByUser/${uid}`)
  const groupsByUser = await groupsByUserRef.once('value')
  if (groupsByUser.exists()) {
    const groupsByUserSnap = groupsByUser.val()
    const groupsIds = Object.keys(groupsByUserSnap)
    const removeGroupsPromises = groupsIds.map(groupId => admin.database().ref(`groups/${groupId}/users/${uid}`).remove())
    await Promise.all(removeGroupsPromises)
    await groupsByUserRef.remove()
  }
  return null

})

exports.deleteBroadcastsByUserOnUserDeletion = functions.database.ref(`deleteUsersRequests/{uid}`).onCreate(async (snap, context) => {
  const uid = context.params.uid

  const broadcastsByUserRef = admin.database().ref(`broadcastsByUser/${uid}`)
  const broadcastsByUser = await broadcastsByUserRef.once('value')
  if (broadcastsByUser.exists()) {
    const broadcastsIds = Object.keys(broadcastsByUser.val())
    const promises = broadcastsIds.map(broadcastId => admin.database().ref(`broadcasts/${broadcastId}`).remove())
    await Promise.all(promises)
  }


  return null

})

exports.deleteUserStatusesOnUserDeletion = functions.database.ref(`deleteUsersRequests/{uid}/`).onCreate(async (snap, context) => {
  const uid = context.params.uid

  await admin.database().ref(`status/${uid}`).remove()
  await admin.database().ref(`textStatus/${uid}`).remove()
  return null
})

exports.deleteUser = functions.database.ref(`deleteUsersRequests/{uid}`).onCreate(async (snap, context) => {
  const uid = context.params.uid
  const userRef = admin.database().ref(`users/${uid}`)
  const userData = await userRef.once('value')
  const userDataSnap = userData.val()
  const phone = userDataSnap.phone

  await Promise.all([
    admin.database().ref(`deletedUsers/${uid}`).set(true),
    admin.database().ref(`uidByPhone/${phone}`).remove(),
    admin.database().ref(userRef).remove(),
    admin.auth().deleteUser(uid)
  ])
  return null

})



exports.getDashboardAnalysis = functions.https.onCall(async (data, context) => {
  try {
    
    // Firebase Realtime Database references
    const database = admin.database();
    const usersRef = database.ref('users');
    const groupsRef = database.ref('groups');
    const broadcastsRef = database.ref('broadcasts');
    const messagesRef = database.ref('messages');
    const deletedUsersRef = database.ref('deleteUsersRequests');
    const reportedUsersRef = database.ref('reportedUsers');
    const reportedGroupsRef = database.ref('reportedGroups');
    const verificationRef = database.ref('verification');

    const usersCount = await getCount(usersRef);
    const groupsCount = await getCount(groupsRef);
    const broadcastsCount = await getCount(broadcastsRef);
    const messagesCount = await getCount(messagesRef);
    const deletedUsersCount = await getCount(deletedUsersRef);
    const reportedUsersCount = await getCount(reportedUsersRef);
    const reportedGroupsCount = await getCount(reportedGroupsRef);
    const verificationCount = await getCount(verificationRef);
    

    const counts = [usersCount, deletedUsersCount, groupsCount, broadcastsCount, messagesCount, reportedUsersCount, reportedGroupsCount, verificationCount];

    return counts;

  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

async function getCount(ref) {
  const snapshot = await ref.once('value');
  return snapshot.numChildren();
}

exports.sendAnnouncementNotification = functions.database.ref('/announcement/text')
    .onWrite((change, context) => {
        // Exit if the data hasn't changed
        if (!change.after.exists() || change.before.val() === change.after.val()) {
            console.log('No change in announcement text.');
            return null;
        }

        const newAnnouncementText = change.after.val();
        const announcementRef = admin.database().ref('/announcement');

        const payload = {
            notification: {
                title: 'Announcement',
                body: newAnnouncementText,
            },
        };

        // Send notification to all users
        return admin.messaging().sendToTopic('allUsers', payload)
            .then((response) => {
                console.log('Notification sent successfully:', response);

                // Delete the announcement text after sending the notification
                return announcementRef.child('text').remove();
            })
            .then(() => {
                console.log('Announcement text deleted successfully.');
                return null;
            })
            .catch((error) => {
                console.error('Error sending notification:', error);
                return null;
            });
    });

    exports.updateReportedUsersCount = functions.database.ref('/reportedUsers/{uid}/list/{childId}')
    .onCreate(async(snapshot, context) => {
        const uid = context.params.uid;

        // Reference to the list and count
        const countRef = admin.database().ref(`/reportedUsers/${uid}/count`);

        // Get the current count
        return countRef.once('value').then((countSnapshot) => {
            let count = countSnapshot.val() || 0;

            // Increment count
            count++;

            // Update count in the database
            return countRef.set(count);
        });
    });

    exports.updateReportedGroupsCount = functions.database.ref('/reportedGroups/{gid}/list/{childId}')
    .onCreate(async(snapshot, context) => {
        const gid = context.params.gid;

        // Reference to the list and count
        const countRef = admin.database().ref(`/reportedGroups/${gid}/count`);

        // Get the current count
        return countRef.once('value').then((countSnapshot) => {
            let count = countSnapshot.val() || 0;

            // Increment count
            count++;

            // Update count in the database
            return countRef.set(count);
        });
    });

exports.disableUserAccount = functions.database.ref('/users/{uid}/disabled')
    .onUpdate((change, context) => {
        const uid = context.params.uid;
        const disabled = change.after.val();

        console.log(`Updating user account ${uid}. Disabled: ${disabled}`);

        if (disabled === true) {
            // Disable the user account
            return admin.auth().updateUser(uid, {
                disabled: true
            })
            .then(() => {
                console.log(`User account ${uid} disabled successfully.`);
                return null;
            })
            .catch(error => {
                console.error(`Error disabling user account ${uid}:`, error);
                return null;
            });
        } else if (disabled === false) {
            // Enable the user account
            return admin.auth().updateUser(uid, {
                disabled: false,
            })
            .then(() => {
                console.log(`User account ${uid} enabled successfully.`);
                return null;
            })
            .catch(error => {
                console.error(`Error enabling user account ${uid}:`, error);
                return null;
            });
        } else {
            console.log(`Invalid value for 'disabled' in user account ${uid}.`);
            // Handle other cases if needed
            return null;
        }
    });
