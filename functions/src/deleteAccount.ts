import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

export const deleteAccount = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = context.auth.uid;

    try {
      // Delete all user images from Storage
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: `declarations/${uid}/` });
      if (files.length > 0) {
        await Promise.all(files.map((file) => file.delete()));
      }

      // Delete all declarations from Firestore
      const declarationsRef = admin.firestore().collection(`users/${uid}/declarations`);
      const declarations = await declarationsRef.listDocuments();
      if (declarations.length > 0) {
        const batch = admin.firestore().batch();
        declarations.forEach((doc) => batch.delete(doc));
        await batch.commit();
      }

      // Delete user profile document
      await admin.firestore().doc(`users/${uid}`).delete();

      // Delete the Firebase Auth user
      await admin.auth().deleteUser(uid);

      return { success: true };
    } catch (error) {
      console.error("deleteAccount error:", error);
      throw new functions.https.HttpsError("internal", "Failed to delete account.");
    }
  });
