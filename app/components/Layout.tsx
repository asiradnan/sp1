import * as React from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
                >
                  WebAuthn SSO
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`${
                    isActive("/")
                      ? "border-indigo-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  Home
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    className={`${
                      isActive("/profile")
                        ? "border-indigo-500 text-gray-900 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Profile
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="flex items-center">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
              ) : isAuthenticated ? (
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    Hello, {user?.username}
                  </span>
                  <Link
                    to="/profile"
                    className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200"
                  >
                    <span className="sr-only">View profile</span>
                    <svg
                      className="h-6 w-6"
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
                  </Link>
                </div>
              ) : (
                <div className="flex space-x-2 relative">
                  <Link
                    to="/login"
                    className={`
                      inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                      transition-all duration-300 transform
                      ${
                        isActive("/login")
                          ? "bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300 dark:ring-indigo-700"
                          : "text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                      }
                    `}
                  >
                    {isActive("/login") && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                    )}
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`
                      inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                      transition-all duration-300 transform
                      ${
                        isActive("/register")
                          ? "bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300 dark:ring-indigo-700"
                          : "text-white bg-indigo-600 hover:bg-indigo-700"
                      }
                    `}
                  >
                    {isActive("/register") && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                    )}
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            WebAuthn SSO Implementation © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
