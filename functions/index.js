const functions = require('firebase-functions');
const admin = require('firebase-admin');
const schedule = require('node-schedule');
const serviceAccount = require('./firebase-serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://flutter-d8e01-default-rtdb.firebaseio.com',
});

// Replace with your desired notification data path (if different)
const notificationDataRef = admin.database().ref('/user');


exports.scheduledNotification = functions.pubsub
    .schedule('22/30 * * * *') // Runs at 8:00 AM IST daily (replace with your desired schedule)
    .onRun(async (context) => {
        notificationDataRef.get()
            .then(async (snapshot) => {
                if (snapshot.exists()) {
                    // Do something with the retrieved data

                    //console.log('Scheduled function triggered at:', context.timestamp);

                    // Fetch notification data from database
                    const notificationSnapshot = await notificationDataRef.once('value');
                    const notificationData = notificationSnapshot.val();

                    // Check if any notifications are scheduled for today
                    if (!notificationData) {
                        console.log('No notifications scheduled for today.');
                        return;
                    }

                    // Loop through each user's notification data
                    for (const userEmail in notificationData) {
                        const userNotification = notificationData[userEmail];

                        // Construct the path to the user's FCM token based on email
                        const fcmTokenRef = notificationDataRef.child(userEmail).child('greenhouseDetails');

                        // Get all greenhouse IDs (replace 'Green1' with a dynamic way to fetch all)
                        const greenhouseIds = Object.keys(userNotification.greenhouseDetails); // Assuming 'greenhouseDetails' contains greenhouse IDs as keys

                        for (const greenhouseId of greenhouseIds) {
                            // Construct the full path to the FCM token for the specific greenhouse
                            const specificTokenRef = fcmTokenRef.child(greenhouseId).child('fcmToken');

                            // Fetch FCM token for this specific greenhouse
                            const fcmTokenSnapshot = await specificTokenRef.once('value');
                            const fcmToken = fcmTokenSnapshot.val();
                            console.log('fcmToken');
                            console.log(fcmToken);
                            if (!fcmToken) {
                                console.warn(`No FCM token found for user ${userEmail}, greenhouse: ${greenhouseId}`);
                                continue; // Skip to next greenhouse for this user if no token
                            }

                            // Prepare notification payload (consider including greenhouse details if needed)
                            const payload = {
                                notification: {
                                    title: 'Irrigation Alert',
                                    body: 'Ready to Irrigate',
                                },
                                token: fcmToken,
                            };

                            // Send notification using FCM messaging
                            const messaging = admin.messaging();
                            await messaging.send(payload)
                                .then((response) => {
                                    console.log(`Successfully sent notification to user ${userEmail}, greenhouse ${greenhouseId}:`, response);
                                })
                                .catch((error) => {
                                    console.error(`Error sending notification to user ${userEmail}, greenhouse ${greenhouseId}:`, error);
                                });
                        }
                    }

                } else {
                    console.log('No data available');
                }
            })
            .catch((error) => {
                console.error(error);
            });
    });

    //});
