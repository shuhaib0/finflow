
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When deployed, environment variables are directly available.
    // This method is more robust than parsing a JSON string.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must be correctly formatted.
        // Replace `\n` markers with actual newlines.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
