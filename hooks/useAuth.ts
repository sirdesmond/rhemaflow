import { useState, useEffect } from "react";
import { onAuthStateChanged } from "../services/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser as FirebaseAuthTypes.User | null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
