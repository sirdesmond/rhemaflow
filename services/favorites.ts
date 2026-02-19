import { db, auth } from "./firebase";
import { Declaration, DeclarationCategory, AtmosphereType } from "../types";

/**
 * Returns a reference to the current user's declarations subcollection.
 */
function declarationsRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return db.collection("users").doc(uid).collection("declarations");
}

/**
 * Save a new declaration to Firestore.
 * Returns the generated document ID.
 */
export async function saveDeclaration(params: {
  text: string;
  reference: string;
  scriptureText: string;
  category: DeclarationCategory;
  atmosphere: AtmosphereType;
  imageUrl: string | null;
  audioUrl: string | null;
}): Promise<string> {
  const ref = declarationsRef().doc();
  const declaration: Declaration = {
    id: ref.id,
    userId: auth.currentUser!.uid,
    text: params.text,
    reference: params.reference,
    scriptureText: params.scriptureText,
    category: params.category,
    atmosphere: params.atmosphere,
    imageUrl: params.imageUrl,
    audioUrl: params.audioUrl,
    createdAt: Date.now(),
    isFavorite: true,
  };
  await ref.set(declaration);
  return ref.id;
}

/**
 * Delete a saved declaration by ID.
 */
export async function deleteDeclaration(id: string): Promise<void> {
  await declarationsRef().doc(id).delete();
}

/**
 * Toggle the isFavorite field on a saved declaration.
 */
export async function toggleFavorite(
  id: string,
  isFavorite: boolean
): Promise<void> {
  await declarationsRef().doc(id).update({ isFavorite });
}

/**
 * Subscribe to real-time updates of the user's declarations.
 * Returns an unsubscribe function.
 */
export function onDeclarationsSnapshot(
  callback: (declarations: Declaration[]) => void
) {
  return declarationsRef()
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const declarations = snapshot.docs.map(
        (doc) => doc.data() as Declaration
      );
      callback(declarations);
    });
}
