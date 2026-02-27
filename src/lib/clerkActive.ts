import { createContext, useContext } from "react";

/** true uniquement quand <ClerkProvider> est réellement monté dans l'arbre */
export const ClerkActiveCtx = createContext(false);
export const useClerkActive = () => useContext(ClerkActiveCtx);
