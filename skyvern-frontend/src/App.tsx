import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { router } from "./router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/QueryClient";

import { PostHogProvider } from "posthog-js/react";
import { UserContext } from "@/store/UserContext";
import { CredentialGetterContext } from "@/store/CredentialGetterContext";
import { envCredential } from "@/util/env";
import { useAuthStore } from "@/store/AuthStore";

const postHogOptions = {
  api_host: "https://app.posthog.com",
};

const getUser = () => {
  return null;
};

function App() {
  // Simple credential getter: prefer user token, else env API key
  const credentialGetter = async () => {
    try {
      const token = useAuthStore.getState().getToken();
      if (token) return token;
      if (envCredential) return envCredential;
      return null;
    } catch {
      return null;
    }
  };
  return (
    <UserContext.Provider value={getUser}>
      <PostHogProvider
        apiKey="phc_bVT2ugnZhMHRWqMvSRHPdeTjaPxQqT3QSsI3r5FlQR5"
        options={postHogOptions}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark">
            <CredentialGetterContext.Provider value={credentialGetter}>
              <RouterProvider router={router} />
            </CredentialGetterContext.Provider>
          </ThemeProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </UserContext.Provider>
  );
}

export default App;
