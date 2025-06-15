// API configuration
const API_BASE_URL = "https://testsso.asiradnan.com/api/auth";

// API endpoints
const ENDPOINTS = {
  REGISTER_CHALLENGE: `${API_BASE_URL}/register/challenge/`,
  REGISTER_VERIFY: `${API_BASE_URL}/register/verify/`,
  LOGIN_CHALLENGE: `${API_BASE_URL}/login/challenge/`,
  LOGIN_VERIFY: `${API_BASE_URL}/login/verify/`,
  VERIFY_TOKEN: `${API_BASE_URL}/verify-token/`,
  USER_PROFILE: `${API_BASE_URL}/profile/`,
  CLEAR_CHALLENGES: `${API_BASE_URL}/clear-challenges/`,
};

// Helper for making API requests
async function apiRequest<T>(
  url: string,
  method: "GET" | "POST" = "GET",
  data?: any,
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.detail || `API request failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

// API service
export const api = {
  // Registration
  getRegistrationChallenge: (data: {
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }) => apiRequest(ENDPOINTS.REGISTER_CHALLENGE, "POST", data),

  verifyRegistration: (data: {
    username: string;
    credential_id: string;
    client_data_json: string;
    attestation_object: string;
  }) => apiRequest(ENDPOINTS.REGISTER_VERIFY, "POST", data),

  // Authentication
  getAuthenticationChallenge: (data: { username?: string }) =>
    apiRequest(ENDPOINTS.LOGIN_CHALLENGE, "POST", data),

  verifyAuthentication: (data: {
    credential_id: string;
    authenticator_data: string;
    client_data_json: string;
    signature: string;
    user_handle?: string;
  }) => apiRequest(ENDPOINTS.LOGIN_VERIFY, "POST", data),

  // SSO Token
  verifyToken: (token: string) =>
    apiRequest(ENDPOINTS.VERIFY_TOKEN, "POST", { token }),

  // User profile
  getUserProfile: (token: string) =>
    apiRequest(ENDPOINTS.USER_PROFILE, "GET", undefined, token),

  // Clear challenges
  clearChallenges: (data: { username: string }) =>
    apiRequest(ENDPOINTS.CLEAR_CHALLENGES, "POST", data),
};
