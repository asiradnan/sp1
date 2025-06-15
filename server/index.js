import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, Link, useLocation, redirect } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as React from "react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const API_BASE_URL = "https://testsso.asiradnan.com/api/auth";
const ENDPOINTS = {
  REGISTER_CHALLENGE: `${API_BASE_URL}/register/challenge/`,
  REGISTER_VERIFY: `${API_BASE_URL}/register/verify/`,
  LOGIN_CHALLENGE: `${API_BASE_URL}/login/challenge/`,
  LOGIN_VERIFY: `${API_BASE_URL}/login/verify/`,
  VERIFY_TOKEN: `${API_BASE_URL}/verify-token/`,
  USER_PROFILE: `${API_BASE_URL}/profile/`,
  CLEAR_CHALLENGES: `${API_BASE_URL}/clear-challenges/`
};
async function apiRequest(url, method = "GET", data, token) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const config = {
    method,
    headers,
    credentials: "include"
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
const api = {
  // Registration
  getRegistrationChallenge: (data) => apiRequest(ENDPOINTS.REGISTER_CHALLENGE, "POST", data),
  verifyRegistration: (data) => apiRequest(ENDPOINTS.REGISTER_VERIFY, "POST", data),
  // Authentication
  getAuthenticationChallenge: (data) => apiRequest(ENDPOINTS.LOGIN_CHALLENGE, "POST", data),
  verifyAuthentication: (data) => apiRequest(ENDPOINTS.LOGIN_VERIFY, "POST", data),
  // SSO Token
  verifyToken: (token) => apiRequest(ENDPOINTS.VERIFY_TOKEN, "POST", { token }),
  // User profile
  getUserProfile: (token) => apiRequest(ENDPOINTS.USER_PROFILE, "GET", void 0, token),
  // Clear challenges
  clearChallenges: (data) => apiRequest(ENDPOINTS.CLEAR_CHALLENGES, "POST", data)
};
const AuthContext = React.createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [ssoToken, setSsoToken] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  React.useEffect(() => {
    if (!isClient) return;
    const token = localStorage.getItem("sso_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, [isClient]);
  const verifyToken = async (token) => {
    try {
      setIsLoading(true);
      const response = await api.verifyToken(token);
      if (response.valid || response.success) {
        setUser(response.user);
        setSsoToken(token);
        if (isClient) {
          localStorage.setItem("sso_token", token);
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };
  const refreshUser = async () => {
    if (!ssoToken) return;
    try {
      const response = await api.getUserProfile(ssoToken);
      setUser(response.user || response);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      if (error instanceof Error && error.message.includes("401")) {
        logout();
      }
    }
  };
  const login2 = (token) => {
    setSsoToken(token);
    if (isClient) {
      localStorage.setItem("sso_token", token);
    }
    verifyToken(token);
  };
  const logout = () => {
    setUser(null);
    setSsoToken(null);
    if (isClient) {
      localStorage.removeItem("sso_token");
    }
    setIsLoading(false);
  };
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    ssoToken,
    login: login2,
    logout,
    refreshUser
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
}
function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout$1({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    suppressHydrationWarning: true,
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      suppressHydrationWarning: true,
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(AuthProvider, {
    children: /* @__PURE__ */ jsx(Outlet, {})
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout: Layout$1,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
function Welcome() {
  const [activeFeature, setActiveFeature] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3e3);
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900 rounded-full opacity-20 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-20 -left-20 w-60 h-60 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-40 right-20 w-40 h-40 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl animate-pulse" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative container mx-auto px-4 py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-5xl mx-auto mb-24", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:w-1/2 text-center md:text-left mb-10 md:mb-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative inline-block mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-6xl font-extrabold leading-tight", children: "WebAuthn SSO" }),
            /* @__PURE__ */ jsx("div", { className: "absolute -bottom-2 left-0 w-full h-3 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-30 rounded-full" })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold text-gray-800 dark:text-white mb-6", children: [
            "Next Generation ",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "Passwordless Authentication" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 dark:text-gray-300 mb-8", children: "Secure, seamless, and simple access across all your applications with FIDO2 WebAuthn technology." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/register",
                className: "px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300",
                children: "Get Started"
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/login",
                className: "px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-md hover:shadow-lg border border-indigo-100 dark:border-gray-700 transform hover:-translate-y-1 transition-all duration-300",
                children: "Sign In"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:w-1/2 relative", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full h-96", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl transform rotate-3 scale-95 opacity-20 dark:opacity-30" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-12 bg-gray-100 dark:bg-gray-700 flex items-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-red-500 rounded-full" }),
              /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-yellow-500 rounded-full" }),
              /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-green-500 rounded-full" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "pt-16 px-6 pb-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xs mx-auto", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-6 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "w-8 h-8 text-indigo-600 dark:text-indigo-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: "2",
                        d: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                      }
                    )
                  }
                ) }),
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200", children: "Authenticate with WebAuthn" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2", children: "Use your security key or biometrics" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "h-10 w-10 mx-auto border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin" }),
                /* @__PURE__ */ jsx("div", { className: "mt-4 text-center text-sm text-indigo-600 dark:text-indigo-400", children: "Verifying your identity..." })
              ] })
            ] }) }) })
          ] })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto mb-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-800 dark:text-white mb-4", children: "Powerful Authentication Features" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto", children: "Our platform combines the security of WebAuthn with the convenience of Single Sign-On" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8", children: features.map((feature, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg transform transition-all duration-300 ${activeFeature === index ? "scale-105 shadow-xl ring-2 ring-indigo-500 dark:ring-indigo-400" : "hover:shadow-xl hover:-translate-y-1"}`,
            onMouseEnter: () => setActiveFeature(index),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-4", children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `p-3 rounded-full mb-4 ${activeFeature === index ? "bg-indigo-100 dark:bg-indigo-900 animate-pulse" : "bg-gray-100 dark:bg-gray-700"}`,
                    children: feature.icon
                  }
                ),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800 dark:text-white mb-2", children: feature.title })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300 text-center", children: feature.description })
            ]
          },
          index
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto mb-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-800 dark:text-white mb-4", children: "How It Works" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto", children: "Simple, secure, and passwordless authentication in three easy steps" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 hidden md:block z-0" }),
          /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-8", children: steps.map((step, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "relative flex flex-col items-center",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6 z-10", children: index + 1 }),
                /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full h-full", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800 dark:text-white mb-4", children: step.title }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: step.description })
                ] }) })
              ]
            },
            index
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 shadow-2xl", children: /* @__PURE__ */ jsxs("div", { className: "md:flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 md:mb-0 md:mr-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-white mb-4", children: "Ready to get started?" }),
            /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-lg", children: "Join thousands of organizations using our secure authentication platform." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/register",
                className: "px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center",
                children: "Create Account"
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/login",
                className: "px-8 py-4 bg-transparent text-white border border-white font-medium rounded-xl hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300 text-center",
                children: "Sign In"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "No credit card required • Free trial available • Enterprise support" }) })
      ] })
    ] })
  ] });
}
const features = [
  {
    title: "Secure Authentication",
    description: "Enterprise-grade security with FIDO2 passwordless authentication.",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "w-8 h-8 text-indigo-600 dark:text-indigo-400",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          }
        )
      }
    )
  },
  {
    title: "Single Sign-On",
    description: "One authentication for all your applications and services.",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "w-8 h-8 text-indigo-600 dark:text-indigo-400",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          }
        )
      }
    )
  },
  {
    title: "Phishing-Resistant",
    description: "Eliminates credential theft and phishing attacks completely.",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "w-8 h-8 text-indigo-600 dark:text-indigo-400",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          }
        )
      }
    )
  },
  {
    title: "Cross-Platform",
    description: "Works across all modern browsers and operating systems.",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "w-8 h-8 text-indigo-600 dark:text-indigo-400",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: "2",
            d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
          }
        )
      }
    )
  }
];
const steps = [
  {
    title: "Register",
    description: "Create an account using your security key, fingerprint, or face recognition."
  },
  {
    title: "Authenticate",
    description: "Sign in with a simple tap or biometric verification - no passwords to remember."
  },
  {
    title: "Access",
    description: "Seamlessly access all your applications with a single authentication."
  }
];
function Layout({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path;
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [
    /* @__PURE__ */ jsx("nav", { className: "bg-white dark:bg-gray-800 shadow-md", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between h-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 flex items-center", children: /* @__PURE__ */ jsx(
          Link,
          {
            to: "/",
            className: "text-xl font-bold text-indigo-600 dark:text-indigo-400",
            children: "WebAuthn SSO"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:ml-6 sm:flex sm:space-x-8", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/",
              className: `${isActive("/") ? "border-indigo-500 text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`,
              children: "Home"
            }
          ),
          isAuthenticated ? /* @__PURE__ */ jsx(
            Link,
            {
              to: "/profile",
              className: `${isActive("/profile") ? "border-indigo-500 text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`,
              children: "Profile"
            }
          ) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full border-2 border-t-indigo-500 animate-spin" }) : isAuthenticated ? /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-700 dark:text-gray-300 mr-2", children: [
          "Hello, ",
          user == null ? void 0 : user.username
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/profile",
            className: "bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200",
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "View profile" }),
              /* @__PURE__ */ jsx(
                "svg",
                {
                  className: "h-6 w-6",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    }
                  )
                }
              )
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex space-x-2 relative", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/login",
            className: `
                      inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                      transition-all duration-300 transform
                      ${isActive("/login") ? "bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300 dark:ring-indigo-700" : "text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800"}
                    `,
            children: [
              isActive("/login") && /* @__PURE__ */ jsxs("span", { className: "absolute -top-1 -right-1 flex h-3 w-3", children: [
                /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" }),
                /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-indigo-500" })
              ] }),
              "Login"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/register",
            className: `
                      inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                      transition-all duration-300 transform
                      ${isActive("/register") ? "bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300 dark:ring-indigo-700" : "text-white bg-indigo-600 hover:bg-indigo-700"}
                    `,
            children: [
              isActive("/register") && /* @__PURE__ */ jsxs("span", { className: "absolute -top-1 -right-1 flex h-3 w-3", children: [
                /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" }),
                /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-indigo-500" })
              ] }),
              "Register"
            ]
          }
        )
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx("main", { className: "py-10", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children }) }),
    /* @__PURE__ */ jsx("footer", { className: "bg-white dark:bg-gray-800 shadow-inner mt-auto", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-500 dark:text-gray-400", children: [
      "WebAuthn SSO Implementation © ",
      (/* @__PURE__ */ new Date()).getFullYear()
    ] }) }) })
  ] });
}
function meta$3({}) {
  return [{
    title: "WebAuthn SSO - Secure Passwordless Authentication"
  }, {
    name: "description",
    content: "Your gateway to seamless authentication and secure access. Enterprise-grade security with easy integration."
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  return /* @__PURE__ */ jsx(Layout, {
    children: /* @__PURE__ */ jsx(Welcome, {})
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlToArrayBuffer(base64url) {
  const padding = "=".repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
async function startRegistration(username, firstName, lastName, email) {
  console.log("=== START REGISTRATION ===");
  console.log("Input parameters:", { username, firstName, lastName, email });
  try {
    console.log("Step 1: Getting registration challenge...");
    const challengeResponse = await api.getRegistrationChallenge({
      username,
      first_name: firstName,
      last_name: lastName,
      email
    });
    console.log("Challenge response:", challengeResponse);
    const credentialCreationOptions = {
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengeResponse.challenge),
        rp: {
          id: challengeResponse.rp.id,
          name: challengeResponse.rp.name
        },
        user: {
          id: base64UrlToArrayBuffer(challengeResponse.user.id),
          name: challengeResponse.user.name,
          displayName: challengeResponse.user.displayName
        },
        pubKeyCredParams: challengeResponse.pubKeyCredParams.map((param) => ({
          type: param.type,
          alg: param.alg
        })),
        timeout: challengeResponse.timeout,
        authenticatorSelection: {
          authenticatorAttachment: challengeResponse.authenticatorSelection.authenticatorAttachment,
          residentKey: challengeResponse.authenticatorSelection.residentKey,
          userVerification: challengeResponse.authenticatorSelection.userVerification
        },
        attestation: challengeResponse.attestation
      }
    };
    console.log("Credential creation options:", credentialCreationOptions);
    console.log("Step 3: Creating credential with navigator.credentials.create...");
    const credential = await navigator.credentials.create(credentialCreationOptions);
    if (!credential) {
      throw new Error("Failed to create credential");
    }
    console.log("Credential created:", credential);
    console.log("Credential ID:", credential.id);
    console.log("Credential rawId:", credential.rawId);
    console.log("Credential response:", credential.response);
    if (!credential.id) {
      throw new Error("Credential missing required id");
    }
    if (!credential.rawId) {
      throw new Error("Credential missing required rawId");
    }
    const response = credential.response;
    if (!response.clientDataJSON) {
      throw new Error("Credential response missing clientDataJSON");
    }
    if (!response.attestationObject) {
      throw new Error("Credential response missing attestationObject");
    }
    const verificationData = {
      username,
      credential_id: credential.id,
      // This should be the base64url encoded credential ID
      client_data_json: arrayBufferToBase64Url(response.clientDataJSON),
      attestation_object: arrayBufferToBase64Url(response.attestationObject)
    };
    console.log("Verification data:", verificationData);
    console.log("Step 5: Sending verification data to server...");
    const verificationResponse = await api.verifyRegistration(verificationData);
    console.log("Verification response:", verificationResponse);
    console.log("=== REGISTRATION COMPLETED ===");
    return verificationResponse;
  } catch (error) {
    console.error("=== REGISTRATION FAILED ===");
    console.error("Error details:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}
async function startAuthentication(username) {
  var _a;
  console.log("=== START AUTHENTICATION ===");
  console.log("Username:", username);
  try {
    const challengeResponse = await api.getAuthenticationChallenge({ username });
    console.log("Challenge response:", challengeResponse);
    const credentialRequestOptions = {
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengeResponse.challenge),
        timeout: challengeResponse.timeout,
        rpId: challengeResponse.rpId,
        allowCredentials: (_a = challengeResponse.allowCredentials) == null ? void 0 : _a.map((cred) => ({
          type: "public-key",
          id: base64UrlToArrayBuffer(cred.id)
        })),
        userVerification: challengeResponse.userVerification
      }
    };
    console.log("Credential request options:", credentialRequestOptions);
    const credential = await navigator.credentials.get(credentialRequestOptions);
    if (!credential) {
      throw new Error("Failed to get credential");
    }
    console.log("Credential retrieved:", credential);
    const response = credential.response;
    const verificationData = {
      credential_id: credential.id,
      authenticator_data: arrayBufferToBase64Url(response.authenticatorData),
      client_data_json: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      user_handle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : void 0
    };
    console.log("Verification data:", verificationData);
    const verificationResponse = await api.verifyAuthentication(verificationData);
    console.log("Verification response:", verificationResponse);
    console.log("=== AUTHENTICATION COMPLETED ===");
    return verificationResponse;
  } catch (error) {
    console.error("=== AUTHENTICATION FAILED ===");
    console.error("Error details:", error);
    throw error;
  }
}
function Login() {
  const { login: login2 } = useAuth();
  const [username, setUsername] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [animateButton, setAnimateButton] = React.useState(false);
  const [showRetryOption, setShowRetryOption] = React.useState(false);
  const handleClearAndRetry = async () => {
    setShowRetryOption(false);
    setError(null);
    try {
      await fetch("https://testsso.asiradnan.com/api/auth/clear-auth-challenges/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
        credentials: "include"
      });
      setError("Authentication challenges cleared. You can now try logging in again.");
    } catch (err) {
      setError("Failed to clear challenges. Please contact support.");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnimateButton(true);
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }
      const response = await startAuthentication(username.trim() || void 0);
      if (response.authenticated || response.verified || response.success) {
        console.log("✅ Authentication successful, logging in user");
        login2(response.sso_token);
      } else {
        throw new Error("Authentication failed - no success indicator");
      }
    } catch (err) {
      console.error("❌ Authentication error:", err);
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
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 transform transition-all duration-300 hover:shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center", children: [
      "Login with WebAuthn",
      /* @__PURE__ */ jsx("div", { className: "absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-5 h-5 text-white",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "2",
              d: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
            }
          )
        }
      ) })
    ] }) }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md animate-bounce", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "h-5 w-5 text-red-500",
          viewBox: "0 0 20 20",
          fill: "currentColor",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              fillRule: "evenodd",
              d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
              clipRule: "evenodd"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { children: error }) })
    ] }) }),
    showRetryOption && /* @__PURE__ */ jsx("div", { className: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Clear previous authentication attempts and try again?" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleClearAndRetry,
          className: "ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors",
          children: "Clear & Retry"
        }
      )
    ] }) }),
    isLoading && /* @__PURE__ */ jsx("div", { className: "bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxs(
        "svg",
        {
          className: "animate-spin h-5 w-5 text-blue-500",
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          children: [
            /* @__PURE__ */ jsx(
              "circle",
              {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              }
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Please touch your security key" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Touch the gold contact when your security key blinks" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "username",
            className: "block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2",
            children: "Username (optional)"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative rounded-md shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-5 w-5 text-gray-400",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "username",
              className: "block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200",
              value: username,
              onChange: (e) => setUsername(e.target.value),
              placeholder: "Leave empty for passkey login",
              disabled: isLoading
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500 dark:text-gray-400", children: "If you have a passkey, you can leave this empty" })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: `w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${animateButton ? "animate-pulse scale-105" : ""} ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`,
          disabled: isLoading,
          children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }
                  )
                ]
              }
            ),
            "Authenticating..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: "w-5 h-5 mr-2",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: "2",
                    d: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  }
                )
              }
            ),
            "Login with Security Key"
          ] })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/register",
          className: "font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors duration-200",
          children: "Register now"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "h-5 w-5 text-green-500",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "2",
              d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Secured with FIDO2 WebAuthn - No passwords needed" }) })
    ] }) })
  ] });
}
function meta$2({}) {
  return [{
    title: "Login - WebAuthn SSO"
  }, {
    name: "description",
    content: "Login to your account using WebAuthn passwordless authentication."
  }];
}
const login = UNSAFE_withComponentProps(function LoginPage() {
  return /* @__PURE__ */ jsx(Layout, {
    children: /* @__PURE__ */ jsx("div", {
      className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",
      children: /* @__PURE__ */ jsx("div", {
        className: "px-4 py-6 sm:px-0",
        children: /* @__PURE__ */ jsx("div", {
          className: "mt-10",
          children: /* @__PURE__ */ jsx(Login, {})
        })
      })
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function Registration() {
  const { login: login2 } = useAuth();
  const [username, setUsername] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [animateButton, setAnimateButton] = React.useState(false);
  const [step, setStep] = React.useState("form");
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
        }, 3e3);
      } else {
        console.log("❌ Clear challenges failed - success was false");
        setError("Failed to clear challenges. Please try again.");
      }
    } catch (err) {
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
  const handleSubmit = async (e) => {
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
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.");
      }
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
        if (response.sso_token || response.token) {
          login2(response.sso_token || response.token);
        }
      } else {
        throw new Error("Registration verification failed");
      }
    } catch (err) {
      if (err.message && err.message.includes("returned more than one RegistrationChallenge")) {
        setError("Multiple registration attempts detected. This usually happens when previous attempts weren't completed properly.");
        setShowRetryOption(true);
      } else if (err.name === "NotAllowedError") {
        setError("Registration was cancelled or timed out. Please try again and touch your YubiKey when prompted.");
      } else if (err.name === "SecurityError") {
        setError("Security error occurred. Please ensure you're using HTTPS and try again.");
      } else if (err.name === "NotSupportedError") {
        setError("Your browser or device doesn't support this type of authentication.");
      } else if (err.name === "InvalidStateError") {
        setError("This authenticator is already registered. Please try logging in instead.");
      } else if (err.name === "ConstraintError") {
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
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 transform transition-all duration-300 hover:shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center", children: [
      "Register with YubiKey",
      /* @__PURE__ */ jsx("div", { className: "absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-5 h-5 text-white",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "2",
              d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            }
          )
        }
      ) })
    ] }) }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md animate-bounce", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "h-5 w-5 text-red-500",
          viewBox: "0 0 20 20",
          fill: "currentColor",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              fillRule: "evenodd",
              d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
              clipRule: "evenodd"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { children: error }) })
    ] }) }),
    showRetryOption && /* @__PURE__ */ jsx("div", { className: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Clear previous registration attempts and try again?" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleClearAndRetry,
          disabled: isLoading,
          className: `ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`,
          children: isLoading ? "Clearing..." : "Clear & Retry"
        }
      )
    ] }) }),
    success && /* @__PURE__ */ jsx("div", { className: "bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md animate-pulse", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
        "svg",
        {
          className: "h-5 w-5 text-green-500",
          viewBox: "0 0 20 20",
          fill: "currentColor",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              fillRule: "evenodd",
              d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
              clipRule: "evenodd"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { children: success }) })
    ] }) }),
    step === "yubikey" && isLoading && !showRetryOption && /* @__PURE__ */ jsx("div", { className: "bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxs(
        "svg",
        {
          className: "animate-spin h-5 w-5 text-blue-500",
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          children: [
            /* @__PURE__ */ jsx(
              "circle",
              {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              }
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Please touch your YubiKey" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Insert your YubiKey and touch the gold contact when it blinks" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "username",
            className: "block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2",
            children: "Username *"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative rounded-md shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-5 w-5 text-gray-400",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "username",
              className: "block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200",
              value: username,
              onChange: (e) => setUsername(e.target.value),
              required: true,
              disabled: isLoading,
              placeholder: "Enter your username"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "email",
            className: "block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2",
            children: "Email"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative rounded-md shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-5 w-5 text-gray-400",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              id: "email",
              className: "block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              disabled: isLoading,
              placeholder: "Enter your email (optional)"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "label",
            {
              htmlFor: "firstName",
              className: "block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2",
              children: "First Name"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "firstName",
              className: "block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200",
              value: firstName,
              onChange: (e) => setFirstName(e.target.value),
              disabled: isLoading,
              placeholder: "First name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "label",
            {
              htmlFor: "lastName",
              className: "block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2",
              children: "Last Name"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              id: "lastName",
              className: "block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200",
              value: lastName,
              onChange: (e) => setLastName(e.target.value),
              disabled: isLoading,
              placeholder: "Last name"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: `w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${animateButton ? "animate-pulse scale-105" : ""} ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`,
          disabled: isLoading,
          children: isLoading && !showRetryOption ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }
                  )
                ]
              }
            ),
            step === "yubikey" ? "Touch your YubiKey..." : "Processing..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: "w-5 h-5 mr-2",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: "2",
                    d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  }
                )
              }
            ),
            "Register with YubiKey"
          ] })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/login",
          className: "font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors duration-200",
          children: "Login now"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-5 w-5 text-green-500",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Passwordless authentication using your YubiKey hardware security key" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-5 w-5 text-blue-500",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: "M13 10V3L4 14h7v7l9-11h-7z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Fast, secure, and phishing-resistant authentication" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-5 w-5 text-purple-500",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Works with YubiKey 5 series and other FIDO2 compatible keys" }) })
      ] })
    ] }) })
  ] });
}
function meta$1({}) {
  return [{
    title: "Register - WebAuthn SSO"
  }, {
    name: "description",
    content: "Create a new account using WebAuthn passwordless authentication."
  }];
}
const register = UNSAFE_withComponentProps(function RegisterPage() {
  return /* @__PURE__ */ jsx(Layout, {
    children: /* @__PURE__ */ jsx("div", {
      className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",
      children: /* @__PURE__ */ jsx("div", {
        className: "px-4 py-6 sm:px-0",
        children: /* @__PURE__ */ jsx("div", {
          className: "mt-10",
          children: /* @__PURE__ */ jsx(Registration, {})
        })
      })
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: register,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function Profile() {
  const { user, logout, ssoToken } = useAuth();
  if (!user) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6", children: /* @__PURE__ */ jsx("p", { className: "text-center text-gray-600 dark:text-gray-400", children: "Please log in to view your profile." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full", children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-indigo-600 dark:text-indigo-300", children: user.username.charAt(0).toUpperCase() }) }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold text-gray-800 dark:text-white", children: user.username }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-400", children: user.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 dark:text-white mb-2", children: "Account Information" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "User ID:" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-800 dark:text-gray-200", children: user.id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Username:" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-800 dark:text-gray-200", children: user.username })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Email:" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-800 dark:text-gray-200", children: user.email || "Not provided" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4 mt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 dark:text-white mb-2", children: "SSO Information" }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-100 dark:bg-gray-700 p-3 rounded-md", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 break-all", children: ssoToken }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: "This token can be used to authenticate with other services that support this SSO provider." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: logout,
        className: "w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-300",
        children: "Logout"
      }
    ) })
  ] });
}
function meta({}) {
  return [{
    title: "Profile - WebAuthn SSO"
  }, {
    name: "description",
    content: "View your user profile and SSO token information."
  }];
}
const profile = UNSAFE_withComponentProps(function ProfilePage() {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  if (!isAuthenticated && !isLoading) {
    return redirect("/login");
  }
  return /* @__PURE__ */ jsx(Layout, {
    children: /* @__PURE__ */ jsx("div", {
      className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",
      children: /* @__PURE__ */ jsx("div", {
        className: "px-4 py-6 sm:px-0",
        children: /* @__PURE__ */ jsx("div", {
          className: "mt-10",
          children: /* @__PURE__ */ jsx(Profile, {})
        })
      })
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: profile,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Ct_VGB7W.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-DlDHz9mS.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js", "/assets/AuthContext-DZ0VfLeJ.js"], "css": ["/assets/root-X3BP-tAN.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-DovX1ee9.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js", "/assets/Layout-DuDAntyH.js", "/assets/AuthContext-DZ0VfLeJ.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "/login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-CfU0hTeJ.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js", "/assets/webauthn-B0dbrbQ7.js", "/assets/AuthContext-DZ0VfLeJ.js", "/assets/Layout-DuDAntyH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "/register", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/register-XvciQLYr.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js", "/assets/webauthn-B0dbrbQ7.js", "/assets/AuthContext-DZ0VfLeJ.js", "/assets/Layout-DuDAntyH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile": { "id": "routes/profile", "parentId": "root", "path": "/profile", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/profile-BzzXC5T7.js", "imports": ["/assets/chunk-NL6KNZEE-bQRukl_s.js", "/assets/AuthContext-DZ0VfLeJ.js", "/assets/Layout-DuDAntyH.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-b1be82f8.js", "version": "b1be82f8", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "/login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/register": {
    id: "routes/register",
    parentId: "root",
    path: "/register",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/profile": {
    id: "routes/profile",
    parentId: "root",
    path: "/profile",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
