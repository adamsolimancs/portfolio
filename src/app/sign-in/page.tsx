import { Suspense } from "react";
import Auth from "@/views/Auth";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <Auth mode="sign-in" />
    </Suspense>
  );
}
