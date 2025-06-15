import * as React from "react";
import Registration from "../components/Registration";
import Layout from "../components/Layout";
import type { Route } from "./+types/register";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Register - WebAuthn SSO" },
    {
      name: "description",
      content:
        "Create a new account using WebAuthn passwordless authentication.",
    },
  ];
}

export default function RegisterPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mt-10">
            <Registration />
          </div>
        </div>
      </div>
    </Layout>
  );
}
