import * as React from "react";
import { Link } from "react-router";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Welcome() {
  const [activeFeature, setActiveFeature] = React.useState(0);

  // Animation for the hero section
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-60 h-60 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <div className="relative inline-block mb-4">
                <span className="inline-block relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-6xl font-extrabold leading-tight">
                  WebAuthn SSO
                </span>
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-30 rounded-full"></div>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
                Next Generation <br />
                <span className="text-indigo-600 dark:text-indigo-400">
                  Passwordless Authentication
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Secure, seamless, and simple access across all your applications
                with FIDO2 WebAuthn technology.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-md hover:shadow-lg border border-indigo-100 dark:border-gray-700 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl transform rotate-3 scale-95 opacity-20 dark:opacity-30"></div>
                <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gray-100 dark:bg-gray-700 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="pt-16 px-6 pb-6">
                    <div className="flex items-center justify-center h-64">
                      <div className="w-full max-w-xs mx-auto">
                        <div className="mb-6 text-center">
                          <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
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
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            Authenticate with WebAuthn
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Use your security key or biometrics
                          </p>
                        </div>
                        <div className="relative">
                          <div className="h-10 w-10 mx-auto border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin"></div>
                          <div className="mt-4 text-center text-sm text-indigo-600 dark:text-indigo-400">
                            Verifying your identity...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              Powerful Authentication Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines the security of WebAuthn with the
              convenience of Single Sign-On
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg transform transition-all duration-300 ${
                  activeFeature === index
                    ? "scale-105 shadow-xl ring-2 ring-indigo-500 dark:ring-indigo-400"
                    : "hover:shadow-xl hover:-translate-y-1"
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div
                    className={`p-3 rounded-full mb-4 ${
                      activeFeature === index
                        ? "bg-indigo-100 dark:bg-indigo-900 animate-pulse"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple, secure, and passwordless authentication in three easy
              steps
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 hidden md:block z-0"></div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6 z-10">
                    {index + 1}
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full h-full">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to get started?
                </h2>
                <p className="text-indigo-100 text-lg">
                  Join thousands of organizations using our secure
                  authentication platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-transparent text-white border border-white font-medium rounded-xl hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300 text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No credit card required • Free trial available • Enterprise
              support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Secure Authentication",
    description:
      "Enterprise-grade security with FIDO2 passwordless authentication.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
  {
    title: "Single Sign-On",
    description: "One authentication for all your applications and services.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    title: "Phishing-Resistant",
    description: "Eliminates credential theft and phishing attacks completely.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Cross-Platform",
    description: "Works across all modern browsers and operating systems.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
        />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "Register",
    description:
      "Create an account using your security key, fingerprint, or face recognition.",
  },
  {
    title: "Authenticate",
    description:
      "Sign in with a simple tap or biometric verification - no passwords to remember.",
  },
  {
    title: "Access",
    description:
      "Seamlessly access all your applications with a single authentication.",
  },
];
