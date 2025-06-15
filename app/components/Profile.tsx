import * as React from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout, ssoToken } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
          {user.username}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Account Information
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
            <span className="text-gray-800 dark:text-gray-200">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Username:</span>
            <span className="text-gray-800 dark:text-gray-200">
              {user.username}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="text-gray-800 dark:text-gray-200">
              {user.email || "Not provided"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          SSO Information
        </h3>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
            {ssoToken}
          </p>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This token can be used to authenticate with other services that
          support this SSO provider.
        </p>
      </div>

      <div className="mt-6">
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
