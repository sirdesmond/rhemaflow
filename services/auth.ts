import { auth, db, functions } from "./firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import authModule, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { UserProfile, UserSettings, DeclarationCategory } from "../types";
import { trackSignIn, trackSignUp, trackAccountLinked, trackSignOut, trackDeleteAccount } from "./analytics";

// Configure Google Sign-In.
// The webClientId comes from your Firebase Console → Authentication → Sign-in method → Google.
// Replace this value with your actual web client ID.
GoogleSignin.configure({
  webClientId: "520245432248-d81nbuia4e9c2c1gv99bn1fg0lprbcnn.apps.googleusercontent.com",
});

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  notificationTime: "08:00",
  defaultAtmosphere: "glory",
  defaultCategory: DeclarationCategory.GENERAL,
};

/**
 * Creates a Firestore user document if one doesn't already exist.
 */
async function ensureUserDoc(
  uid: string,
  displayName: string,
  email: string,
  photoURL: string | null
) {
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    const profile: UserProfile = {
      uid,
      displayName,
      email,
      photoURL,
      createdAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    };
    await userRef.set(profile);
  }
}

/**
 * Sign in with Google. Returns the Firebase user.
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken ?? null;
  const credential = authModule.GoogleAuthProvider.credential(idToken);
  const result = await auth.signInWithCredential(credential);
  const user = result.user;
  const isNew = result.additionalUserInfo?.isNewUser;
  await ensureUserDoc(
    user.uid,
    user.displayName ?? "",
    user.email ?? "",
    user.photoURL
  );
  isNew ? trackSignUp("google") : trackSignIn("google");
  return user;
}

/**
 * Sign in with Apple (iOS only). Returns the Firebase user.
 */
export async function signInWithApple() {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken, fullName } = appleCredential;
  if (!identityToken) {
    throw new Error("Apple sign-in failed: no identity token");
  }

  const provider = new authModule.OAuthProvider("apple.com");
  const credential = provider.credential(identityToken);

  const result = await auth.signInWithCredential(credential);
  const user = result.user;
  const isNew = result.additionalUserInfo?.isNewUser;
  const name = fullName
    ? `${fullName.givenName ?? ""} ${fullName.familyName ?? ""}`.trim()
    : user.displayName ?? "";

  await ensureUserDoc(user.uid, name, user.email ?? "", user.photoURL);
  isNew ? trackSignUp("apple") : trackSignIn("apple");
  return user;
}

/**
 * Sign in anonymously. User can link credentials later.
 */
export async function signInAnonymously() {
  const result = await auth.signInAnonymously();
  await ensureUserDoc(result.user.uid, "Guest", "", null);
  trackSignIn("anonymous");
  return result.user;
}

/**
 * Link an anonymous account to a real provider (Google or Apple).
 * Preserves the anonymous UID and all associated data.
 */
export async function linkAccount(
  provider: "google" | "apple"
): Promise<FirebaseAuthTypes.User> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No user signed in.");

  if (provider === "google") {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken ?? null;
    const credential = authModule.GoogleAuthProvider.credential(idToken);
    const result = await currentUser.linkWithCredential(credential);
    const user = result.user;
    await ensureUserDoc(
      user.uid,
      user.displayName ?? "",
      user.email ?? "",
      user.photoURL
    );
    trackAccountLinked("google");
    return user;
  } else {
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { identityToken, fullName } = appleCredential;
    if (!identityToken) throw new Error("Apple sign-in failed: no identity token");

    const oauthProvider = new authModule.OAuthProvider("apple.com");
    const credential = oauthProvider.credential(identityToken);
    const result = await currentUser.linkWithCredential(credential);
    const user = result.user;
    const name = fullName
      ? `${fullName.givenName ?? ""} ${fullName.familyName ?? ""}`.trim()
      : user.displayName ?? "";
    await ensureUserDoc(user.uid, name, user.email ?? "", user.photoURL);
    trackAccountLinked("apple");
    return user;
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  trackSignOut();
  await auth.signOut();
}

/**
 * Delete the current user's account and all associated data.
 */
export async function deleteAccount() {
  trackDeleteAccount();
  const fn = functions.httpsCallable("deleteAccount");
  await fn();
  await auth.signOut();
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void
) {
  return auth.onAuthStateChanged(callback);
}
