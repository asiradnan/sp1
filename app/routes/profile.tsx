import * as React from "react";
import Profile from "../components/Profile";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { redirect } from "react-router";
import type { Route } from "./+types/profile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile - WebAuthn SSO" },
    {
      name: "description",
      content: "View your user profile and SSO token information.",
    },
  ];
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();

  // If not authenticated and not loading, redirect to login
  if (!isAuthenticated && !isLoading) {
    return redirect("/login");
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mt-10">
            <Profile />
          </div>
        </div>
      </div>
    </Layout>
  );
}
