import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getFirebaseApp } from "./config";

const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";

let emulatorsConnected = false;

export function getFirebaseFunctions() {
  const functions = getFunctions(getFirebaseApp(), region);

  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    if (!emulatorsConnected) {
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      emulatorsConnected = true;
    }
  }

  return functions;
}
