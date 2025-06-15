import * as React from "react";
import { Welcome } from "../welcome/welcome";
import Layout from "../components/Layout";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "WebAuthn SSO - Secure Passwordless Authentication" },
    {
      name: "description",
      content:
        "Your gateway to seamless authentication and secure access. Enterprise-grade security with easy integration.",
    },
  ];
}

export default function Home() {
  return (
    <Layout>
      <Welcome />
    </Layout>
  );
}
