import * as admin from "firebase-admin";

admin.initializeApp();

export { generateDeclaration } from "./generateDeclaration";
export { generateSpeech } from "./generateSpeech";
export { generateImage } from "./generateImage";
export { deleteAccount } from "./deleteAccount";
export { getUsageStatus } from "./getUsageStatus";
