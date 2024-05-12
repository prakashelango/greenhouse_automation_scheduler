const cron = require('node-cron');
const moment = require('moment-timezone');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./functions/firebase-serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://flutter-d8e01-default-rtdb.firebaseio.com',
});

// Function to send notifications to Android users
const sendNotifications = async () => {
    try {
        // Retrieve FCM tokens from Firebase Realtime Database
        // cWCp1UdtTHO_r6M0o2jhhY:APA91bE4hKt2QZI4GpIA3JDhMcBTBZ2V54nKakCjRQ4zRKWFO28PzA2NDSHoLm-mgkxWphrXGyashfIwgRAzCJHWzP6eV9uAfImzbBHu-tZBzxhSgyR8ywnGh_fYlvZP5zJ7fMcw8CPF
        //const snapshot = await admin.database().ref('fcmTokens').once('value');
        //const tokens = Object.values(snapshot.val() || {});
        const tokens = Object.values('cWCp1UdtTHO_r6M0o2jhhY:APA91bE4hKt2QZI4GpIA3JDhMcBTBZ2V54nKakCjRQ4zRKWFO28PzA2NDSHoLm-mgkxWphrXGyashfIwgRAzCJHWzP6eV9uAfImzbBHu-tZBzxhSgyR8ywnGh_fYlvZP5zJ7fMcw8CPF' || {});

        // Send notifications to each token
        const payload = {
            notification: {
                title: 'Notification Title',
                body: 'Notification Body',
            },
        };

        const response = await admin.messaging().sendToDevice(tokens, payload);
        console.log('Successfully sent notifications:', response);
        response.results.forEach(result => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', result.registrationToken, error);
            }
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
};

// Function to be executed at 8 AM IST
const task = () => {
    console.log('Running scheduled task at 8 AM IST');
    sendNotifications().then(r => console.log(r));
};

// Schedule the task to run at 8 AM IST every day
const scheduledTask = cron.schedule('0 8 * * *', () => {
    const currentTime = moment().tz('Asia/Kolkata').format('HH:mm:ss');
    console.log(`Current time in IST: ${currentTime}`);
    task();
}, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
});

// Start the scheduler
//scheduledTask.start();
task();
// Log a message to indicate that the application is running
console.log('Application is running...');
