import type { Metadata } from "next";
import { Suspense } from "react";
import Auth from "@/views/Auth";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <Auth mode="sign-in" />
    </Suspense>
  );
}
