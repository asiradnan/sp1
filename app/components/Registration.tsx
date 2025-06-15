import * as React from "react";
import { startRegistration } from "../utils/webauthn";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";
import { api } from "../utils/api";

export default function Registration() {
  const { login } = useAuth();
  const [username, setUsername] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [animateButton, setAnimateButton] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "yubikey">("form");
  const [showRetryOption, setShowRetryOption] = React.useState(false);

  const handleClearAndRetry = async () => {
  console.log("=== CLEAR AND RETRY STARTED ===");
  console.log("Username being sent:", username.trim());
  console.log("Request payload:", { username: username.trim() });
  
  setShowRetryOption(false);
  setError(null);
  setIsLoading(true);
  
  try {
    console.log("Making API call to clear challenges...");
    console.log("API endpoint:", "https://testsso.asiradnan.com/api/auth/clear-challenges/");
    
    // Use the API to clear challenges
    const response = await api.clearChallenges({ username: username.trim() });
    
    console.log("=== CLEAR CHALLENGES RESPONSE ===");
    console.log("Response received:", response);
    console.log("Response type:", typeof response);
    console.log("Response keys:", Object.keys(response));
    
    if (response.success) {
      console.log("✅ Clear challenges successful");
      console.log("Deleted count:", response.deleted_count);
      console.log("Message:", response.message);
      
      setSuccess("Challenges cleared. You can now try registering again.");
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      console.log("❌ Clear challenges failed - success was false");
      setError("Failed to clear challenges. Please try again.");
    }
    
  } catch (err: any) {
    console.log("=== CLEAR CHALLENGES ERROR ===");
    console.log("Error caught:", err);
    console.log("Error name:", err.name);
    console.log("Error message:", err.message);
    console.log("Error stack:", err.stack);
    
    if (err.response) {
      console.log("Error response:", err.response);
      console.log("Error response status:", err.response.status);
      console.log("Error response data:", err.response.data);
    }
    
    setError(`Failed to clear challenges: ${err.message}`);
    console.error("Clear challenges error:", err);
  } finally {
    console.log("=== CLEAR AND RETRY FINISHED ===");
    setIsLoading(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setAnimateButton(true);
    setStep("yubikey");
    setShowRetryOption(false);

    try {
      // Check if browser supports WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      // Check if platform supports authenticators
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log("Platform authenticator available:", available);

      const response = await startRegistration(
        username.trim(),
        firstName.trim(),
        lastName.trim(),
        email.trim()
      );

      if (response.verified || response.success) {
        setSuccess("Registration successful! Your YubiKey has been registered.");
        setStep("form");
        
        // If we get an SSO token, log the user in
        if (response.sso_token || response.token) {
          login(response.sso_token || response.token);
        }
      } else {
        throw new Error("Registration verification failed");
      }
    } catch (err: any) {
      if (err.message && err.message.includes("returned more than one RegistrationChallenge")) {
        setError("Multiple registration attempts detected. This usually happens when previous attempts weren't completed properly.");
        setShowRetryOption(true);
      } else if (err.name === 'NotAllowedError') {
        setError("Registration was cancelled or timed out. Please try again and touch your YubiKey when prompted.");
      } else if (err.name === 'SecurityError') {
        setError("Security error occurred. Please ensure you're using HTTPS and try again.");
      } else if (err.name === 'NotSupportedError') {
        setError("Your browser or device doesn't support this type of authentication.");
      } else if (err.name === 'InvalidStateError') {
        setError("This authenticator is already registered. Please try logging in instead.");
      } else if (err.name === 'ConstraintError') {
        setError("The authenticator doesn't meet the security requirements.");
      } else if (err.message && err.message.includes("rawId")) {
        setError("Authentication device error. Please ensure your YubiKey is properly connected and try again.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
      setStep("form");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setAnimateButton(false), 500);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 transform transition-all duration-300 hover:shadow-2xl">
      <div className="relative">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
          Register with YubiKey
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
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
            <p className="text-sm">Clear previous registration attempts and try again?</p>
            <button
              onClick={handleClearAndRetry}
              disabled={isLoading}
              className={`ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Clearing..." : "Clear & Retry"}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p>{success}</p>
            </div>
          </div>
        </div>
      )}

      {step === "yubikey" && isLoading && !showRetryOption && (
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
              <p className="font-medium">Please touch your YubiKey</p>
              <p className="text-sm">Insert your YubiKey and touch the gold contact when it blinks</p>
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
            Username *
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
              required
              disabled={isLoading}
              placeholder="Enter your username"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
          >
            Email
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your email (optional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              placeholder="First name"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
              animateButton ? "animate-pulse scale-105" : ""
            } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading && !showRetryOption ? (
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
                {step === "yubikey" ? "Touch your YubiKey..." : "Processing..."}
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Register with YubiKey
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors duration-200"
          >
            Login now
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
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
                Passwordless authentication using your YubiKey hardware security key
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fast, secure, and phishing-resistant authentication
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Works with YubiKey 5 series and other FIDO2 compatible keys
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
