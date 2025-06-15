import * as React from "react";
import { startAuthentication } from "../utils/webauthn";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [animateButton, setAnimateButton] = React.useState(false);
  const [showRetryOption, setShowRetryOption] = React.useState(false);

  const handleClearAndRetry = async () => {
    setShowRetryOption(false);
    setError(null);
    
    try {
      // Clear authentication challenges endpoint
      await fetch('https://testsso.asiradnan.com/api/auth/clear-auth-challenges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
        credentials: 'include'
      });
      
      setError("Authentication challenges cleared. You can now try logging in again.");
    } catch (err) {
      setError("Failed to clear challenges. Please contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnimateButton(true);

    try {
      // Check if browser supports WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      const response = await startAuthentication(username.trim() || undefined);

      // Check for successful authentication (handle both field names)
      if (response.authenticated || response.verified || response.success) {
        console.log("✅ Authentication successful, logging in user");
        login(response.sso_token);
      } else {
        throw new Error("Authentication failed - no success indicator");
      }
    } catch (err: any) {
      console.error("❌ Authentication error:", err);
      
      // Handle specific error cases
      if (err.message && err.message.includes("Multiple authentication attempts")) {
        setError("Multiple authentication attempts detected. This usually happens when previous attempts weren't completed properly.");
        setShowRetryOption(true);
      } else if (err.message && err.message.includes("Challenge not found")) {
        setError("Authentication session expired. Please try again.");
      } else if (err.message && err.message.includes("Credential not found")) {
        setError("No registered security key found. Please register first.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setAnimateButton(false), 500);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 transform transition-all duration-300 hover:shadow-2xl">
      <div className="relative">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
          Login with WebAuthn
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md animate-bounce">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {showRetryOption && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-sm">Clear previous authentication attempts and try again?</p>
            <button
              onClick={handleClearAndRetry}
              className="ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
            >
              Clear & Retry
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium">Please touch your security key</p>
              <p className="text-sm">Touch the gold contact when your security key blinks</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="username"
            className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
          >
            Username (optional)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="username"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Leave empty for passkey login"
              disabled={isLoading}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            If you have a passkey, you can leave this empty
          </p>
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
              animateButton ? "animate-pulse scale-105" : ""
            } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
                Login with Security Key
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors duration-200"
          >
            Register now
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Secured with FIDO2 WebAuthn - No passwords needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
