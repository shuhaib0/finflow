
import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey!)),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
