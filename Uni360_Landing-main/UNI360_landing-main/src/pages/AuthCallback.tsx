import { useEffect, useState } from "react";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      const token = params.get("accessToken");
      if (!token) throw new Error("No token found in URL: " + window.location.href);

      const user = {
        email: params.get("email") || "",
        firstName: params.get("firstName") || params.get("first_name") || "",
        lastName: params.get("lastName") || params.get("last_name") || "",
        fullName: params.get("fullName") || params.get("name") || "",
        userId: params.get("userId") || params.get("id") || "",
        userType: params.get("userType") || "STUDENT",
      };

      if (!window.opener) {
        console.warn("window.opener is null. Falling back to localStorage communication.");
      }

      // 1. Try postMessage first
      window.opener?.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS", token, user },
        "*"
      );

      // 2. Fallback: Save directly to localStorage so the main window can detect it
      localStorage.setItem("google_auth_token", token);
      localStorage.setItem("google_auth_user", JSON.stringify(user));
      
      // Trigger storage event manually just in case
      window.dispatchEvent(new Event("storage"));

      window.close();
    } catch (err: any) {
      console.error("OAuth callback error:", err);
      setError(err.message || "An error occurred");
    }
  }, []);

  if (error) {
    return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;
  }

  return <p>Logging you in...</p>;
};

export default AuthCallback;