const admin = require('firebase-admin')

function sendMulticastMessage(message,uid){
    return admin.messaging().sendMulticast(message).then(results => {
        if (results.failureCount !== 0) {
            const promises = []
    
            results.responses.forEach((response, index) => {
    
                const error = response.error
    
                if (error) {
                    // console.log("error ", error, "index ",ind)
                    // console.log("error ", error.code)
    
                    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
                        const invalidToken = message.tokens[index]
                        promises.push(admin.database().ref(`users/${uid}/notificationTokens/${invalidToken}`).remove())
                        console.log("invalid token ", invalidToken)
    
    
                    }
                }
    
            })

            return Promise.all(promises)
        }else{
            return null
        }
        
    
    })
    
}
exports.sendMulticastMessage = sendMulticastMessage;
