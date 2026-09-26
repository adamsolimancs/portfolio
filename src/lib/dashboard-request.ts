type SessionResult = {
  data: { session: { access_token: string } | null };
  error: unknown;
};

type SessionClient = {
  getSession: () => Promise<SessionResult>;
  refreshSession: () => Promise<SessionResult>;
};

// Only a rejected user session warrants renewal. A server/database failure
// must not sign the customer out or start a refresh loop.
export const requestDashboard = async (
  auth: SessionClient,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Response> => {
  const current = await auth.getSession();
  signal.throwIfAborted();
  if (current.error || !current.data.session) {
    return new Response(null, { status: 401 });
  }

  const request = (token: string) =>
    fetcher("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal,
    });

  const response = await request(current.data.session.access_token);
  if (response.status !== 401) return response;

  const renewed = await auth.refreshSession();
  signal.throwIfAborted();
  if (renewed.error || !renewed.data.session) return response;
  return request(renewed.data.session.access_token);
};
