import {
  getAuth,
  getIdToken,
  signInWithPhoneNumber,
  signOut,
} from '@react-native-firebase/auth';

export type PhoneConfirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

export async function sendFirebasePhoneOtp(e164Phone: string): Promise<PhoneConfirmation> {
  return signInWithPhoneNumber(getAuth(), e164Phone);
}

export async function confirmFirebasePhoneOtp(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  const user = credential?.user;

  if (!user) {
    throw new Error('Phone verification failed. Please try again.');
  }

  return getIdToken(user, true);
}

export async function signOutFirebaseAuth(): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }
}
