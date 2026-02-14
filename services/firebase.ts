import firebase from "@react-native-firebase/app";
import "@react-native-firebase/auth";
import "@react-native-firebase/firestore";
import "@react-native-firebase/storage";
import "@react-native-firebase/functions";

// Firebase initializes automatically from GoogleService-Info.plist (iOS)
// and google-services.json (Android). These imports ensure each module
// is registered with the default app instance.

export const auth = firebase.app().auth();
export const db = firebase.app().firestore();
export const storage = firebase.app().storage();
export const functions = firebase.app().functions();
