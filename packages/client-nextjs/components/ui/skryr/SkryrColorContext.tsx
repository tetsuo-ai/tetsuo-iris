// SkryrColorContext.tsx

import React, { createContext, useContext } from "react";

// Define the shape of the context value. Right now, we only have computedColor:
interface SkryrColorContextValue {
    computedColor: string;
}

// Create the context with a default value:
const SkryrColorContext = createContext<SkryrColorContextValue>({
    computedColor: "#fff", // or any fallback color
});

// Export this provider so we can wrap parts of the app with it
export const SkryrColorProvider = SkryrColorContext.Provider;

// Export a custom hook for easier consumption:
export function useSkryrColor() {
    return useContext(SkryrColorContext);
}
