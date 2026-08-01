import admin from "firebase-admin";

let initialized = false;

export function isFirebaseAuthConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim()
  );
}

export function getFirebaseAuth() {
  if (!isFirebaseAuthConfigured()) {
    throw new Error("Firebase Admin is not configured");
  }

  if (!initialized) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    initialized = true;
  }

  return admin.auth();
}

export async function verifyFirebaseIdToken(idToken) {
  const auth = getFirebaseAuth();
  return auth.verifyIdToken(idToken);
}
