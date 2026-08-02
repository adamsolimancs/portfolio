import type { Metadata } from "next";
import { Suspense } from "react";
import Auth from "@/views/Auth";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <Auth mode="sign-up" />
    </Suspense>
  );
}
