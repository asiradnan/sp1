import * as React from "react";
import Login from "../components/Login";
import Layout from "../components/Layout";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - WebAuthn SSO" },
    {
      name: "description",
      content:
        "Login to your account using WebAuthn passwordless authentication.",
    },
  ];
}

export default function LoginPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mt-10">
            <Login />
          </div>
        </div>
      </div>
    </Layout>
  );
}
