
import admin from 'firebase-admin';

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set.');
}

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      throw new Error('Firebase admin initialization error');
    }
  }
  return admin;
}

const adminInstance = getFirebaseAdmin();
const auth = adminInstance.auth();
const db = adminInstance.firestore();

export { auth, db };
