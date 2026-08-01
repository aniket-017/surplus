import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';

export type PhoneConfirmation = FirebaseAuthTypes.ConfirmationResult;

export async function sendFirebasePhoneOtp(e164Phone: string): Promise<PhoneConfirmation> {
  return auth().signInWithPhoneNumber(e164Phone);
}

export async function confirmFirebasePhoneOtp(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);

  if (!credential?.user) {
    throw new Error('Phone verification failed. Please try again.');
  }

  return credential.user.getIdToken(true);
}

export async function signOutFirebaseAuth(): Promise<void> {
  if (auth().currentUser) {
    await auth().signOut();
  }
}
