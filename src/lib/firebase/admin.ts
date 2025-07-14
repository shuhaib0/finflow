
import admin from 'firebase-admin';

// This is the service account object. It's constructed from environment variables.
// IMPORTANT: You must get these values from your Firebase project settings.
// Go to Project Settings > Service accounts, and generate a new private key.
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key must be correctly formatted, replacing escaped newlines.
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

/**
 * Gets the initialized Firebase Admin app.
 * If the app is not already initialized, it initializes it.
 * This function prevents re-initialization on hot reloads.
 */
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Check if all necessary service account details are present
      if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Log a warning if the app is used without full credentials.
        // This might happen in some environments, but it's not ideal for production.
        console.warn("Firebase Admin SDK not initialized. Missing environment variables.");
        // We can initialize without credentials for some limited use cases or CI,
        // but most features will fail.
        admin.initializeApp();
      }
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      // We throw an error here because the app cannot function without Firebase admin.
      throw new Error('Firebase admin initialization failed');
    }
  }
  return admin;
}

const adminInstance = getFirebaseAdmin();
const auth = adminInstance.auth();
const db = adminInstance.firestore();

export { auth, db };
