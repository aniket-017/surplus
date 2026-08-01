import admin from "firebase-admin";

let initialized = false;

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!raw) {
    return null;
  }

  const privateKey = raw.replace(/\\n/g, "\n");

  if (
    !privateKey.includes("BEGIN PRIVATE KEY") ||
    privateKey.includes("...\n") ||
    privateKey.includes("...\\n")
  ) {
    return null;
  }

  return privateKey;
}

export function isFirebaseAuthConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      getPrivateKey()
  );
}

export function getFirebaseAuth() {
  if (!isFirebaseAuthConfigured()) {
    throw new Error("Firebase Admin is not configured");
  }

  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
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

export function getFirebaseErrorCode(error) {
  return error?.code || error?.errorInfo?.code || null;
}
