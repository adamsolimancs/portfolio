import { Suspense } from "react";
import Auth from "@/views/Auth";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <Auth mode="sign-up" />
    </Suspense>
  );
}
