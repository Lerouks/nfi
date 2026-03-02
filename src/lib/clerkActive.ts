import { createContext, useContext } from "react";

/** true uniquement quand <ClerkProvider> est réellement monté dans l'arbre */
export const ClerkActiveCtx = createContext(false);
export const useClerkActive = () => useContext(ClerkActiveCtx);

/** true pendant la sonde réseau Clerk (avant que clerkOk soit résolu) */
export const ClerkCheckingCtx = createContext(false);
export const useClerkChecking = () => useContext(ClerkCheckingCtx);
