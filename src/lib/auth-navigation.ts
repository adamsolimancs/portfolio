const fallbackPath = "/dashboard";
const allowedPaths = new Set(["/", "/dashboard"]);

export const getPostAuthRedirect = (value: string | null): string => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return fallbackPath;
  }

  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid" || !allowedPaths.has(url.pathname)) {
      return fallbackPath;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallbackPath;
  }
};

export const getAuthErrorMessage = (error: { code?: string }): string => {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don’t match. Please try again.";
    case "email_not_confirmed":
      return "Please check your email and confirm your account before signing in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Please sign in.";
    case "weak_password":
      return "Please choose a stronger password with a mix of letters, numbers, and symbols.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return "We couldn’t complete that request. Please try again in a moment.";
  }
};
