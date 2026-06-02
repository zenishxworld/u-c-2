import { useEffect, useState } from "react";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // Check if backend returned an error
      const errorParam = params.get("error");
      if (errorParam) {
        console.error("OAuth callback error from backend:", errorParam);
        const errorDesc = params.get("error_description") || params.get("message") || errorParam;
        setError(`Google authentication failed: ${errorDesc}`);
        
        // Notify the opener about the error
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_ERROR", error: errorDesc },
            "*"
          );
        }
        return;
      }

      const token = params.get("accessToken");
      if (!token) {
        console.error("OAuth callback: No token found. All params:", Object.fromEntries(params.entries()));
        setError("No access token received. Please try again.");
        return;
      }

      const user = {
        id:        params.get("userId")    || params.get("id")         || "",
        email:     params.get("email")     || "",
        firstName: params.get("firstName") || params.get("first_name") || "",
        lastName:  params.get("lastName")  || params.get("last_name")  || "",
        fullName:  params.get("fullName")  || params.get("name")       || "",
        userType:  params.get("userType")  || "STUDENT",
      };

      if (window.opener) {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_SUCCESS", token, user },
          "*"
        );
      }

      window.close();
    } catch (err) {
      console.error("OAuth callback error:", err);
      setError("An unexpected error occurred during authentication.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: "#dc2626", marginBottom: "12px" }}>Authentication Failed</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>{error}</p>
        <p style={{ color: "#999", fontSize: "14px" }}>
          This window will close automatically, or you can close it manually and try again.
        </p>
        <button 
          onClick={() => window.close()} 
          style={{ 
            marginTop: "16px", padding: "8px 24px", backgroundColor: "#E49B0F", 
            color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
            fontSize: "14px", fontWeight: "600"
          }}
        >
          Close Window
        </button>
      </div>
    );
  }

  return <p>Logging you in...</p>;
};

export default AuthCallback;