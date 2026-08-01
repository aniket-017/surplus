import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from '@react-native-firebase/auth';

export type PhoneConfirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

export async function sendFirebasePhoneOtp(e164Phone: string): Promise<PhoneConfirmation> {
  const auth = getAuth();
  // Clear any previous Firebase session so auto-verify belongs to this attempt.
  if (auth.currentUser) {
    await signOut(auth);
  }
  return signInWithPhoneNumber(auth, e164Phone);
}

export async function confirmFirebasePhoneOtp(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  const user = credential?.user ?? getAuth().currentUser;

  if (!user) {
    throw new Error('Phone verification failed. Please try again.');
  }

  return getIdToken(user, true);
}

/** Returns a Firebase ID token if the user is already signed in (Android SMS auto-verify). */
export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) {
    return null;
  }
  return getIdToken(user, true);
}

export function subscribeFirebaseAuth(callback: (signedIn: boolean) => void): () => void {
  return onAuthStateChanged(getAuth(), (user) => {
    callback(Boolean(user));
  });
}

export async function signOutFirebaseAuth(): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }
}
