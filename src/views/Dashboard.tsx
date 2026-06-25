"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/useAuth";
import { supabase, type Customer, type CustomerBilling, type ServiceRequest } from "@/lib/supabase";
import type { ServiceTier } from "@/lib/services";

type DashboardSubscription = {
  id: string | null;
  status: string;
  monthlyRateCents: number | null;
  productName: string | null;
  priceId: string | null;
  startedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type DashboardData = {
  user: {
    id: string;
    email: string | null;
    name: string;
  };
  services: ServiceTier[];
  subscription: DashboardSubscription | null;
  hasActiveSubscription: boolean;
  serviceRequests: ServiceRequest[];
  isAdmin: boolean;
  admin: {
    customers: Customer[];
    billings: CustomerBilling[];
    serviceRequests: ServiceRequest[];
    totalRecurringRevenueCents: number;
    totalRevenueCents: number;
    currency: string;
    revenueNote: string;
  } | null;
};

const formatCurrency = (cents: number | null | undefined, currency = "usd") => {
  if (typeof cents !== "number") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
};

const formatDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Not available";

const statusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const parseApiResponse = async <T,>(response: Response): Promise<T | null> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const { session, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [form, setForm] = useState({
    serviceTierId: "professional",
    title: "",
    priority: "normal",
    description: "",
  });

  const authHeaders = useMemo(
    () =>
      session?.access_token
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : null,
    [session?.access_token],
  );

  const loadDashboard = useCallback(async () => {
    if (!authHeaders) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/dashboard", {
      headers: authHeaders,
    });
    const payload = await parseApiResponse<DashboardData & { error?: string }>(
      response,
    );

    if (!response.ok) {
      setError(payload?.error || "Unable to load dashboard.");
      setLoading(false);
      return;
    }

    if (!payload) {
      setError("Unable to load dashboard.");
      setLoading(false);
      return;
    }

    setDashboard(payload);
    setForm((current) => ({
      ...current,
      serviceTierId: payload.services?.[0]?.id || current.serviceTierId,
    }));
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
  };

  const startCheckout = async (serviceTierId: string) => {
    if (!authHeaders) {
      return;
    }

    setCheckoutLoading(serviceTierId);
    setError(null);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ serviceTierId }),
    });
    const payload = await parseApiResponse<{ error?: string; url?: string }>(
      response,
    );

    if (!response.ok || !payload?.url) {
      setError(payload?.error || "Unable to start checkout.");
      setCheckoutLoading(null);
      return;
    }

    window.location.href = payload.url;
  };

  const openBillingPortal = async () => {
    if (!authHeaders) {
      return;
    }

    setPortalLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: authHeaders,
    });
    const payload = await response.json();

    if (!response.ok || !payload.url) {
      setError(payload.error || "Unable to open billing portal.");
      setPortalLoading(false);
      return;
    }

    window.location.href = payload.url;
  };

  const submitServiceRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!authHeaders) {
      return;
    }

    setRequestSaving(true);
    setRequestMessage(null);
    setError(null);

    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Unable to send service request.");
      setRequestSaving(false);
      return;
    }

    setForm((current) => ({
      ...current,
      title: "",
      description: "",
      priority: "normal",
    }));
    setRequestMessage("Request saved and emailed.");
    setRequestSaving(false);
    await loadDashboard();
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    if (!authHeaders) {
      return;
    }

    const response = await fetch(`/api/service-requests/${requestId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to update request.");
      return;
    }

    await loadDashboard();
  };

  const activeRequests =
    dashboard?.admin?.serviceRequests.filter(
      (request) => request.status !== "completed",
    ) ?? [];
  const completedRequests =
    dashboard?.admin?.serviceRequests.filter(
      (request) => request.status === "completed",
    ) ?? [];
  const customerById = new Map(
    dashboard?.admin?.customers.map((customer) => [customer.id, customer]) ?? [],
  );
  const billingByCustomerId = new Map(
    dashboard?.admin?.billings.map((billing) => [
      billing.customer_id,
      billing,
    ]) ?? [],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-caption">Loading dashboard...</p>
      </main>
    );
  }

  const username =
    dashboard?.user.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "username";
  const showCustomerServices = !dashboard?.isAdmin;

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Adam Soliman
            </Link>
            <h1 className="mt-5 text-3xl font-medium tracking-tight md:text-4xl">
              Hello {username}!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboard?.isAdmin
                ? "Admin dashboard for managing customers, requests, and billing."
                : "Manage your website service, requests, and billing."}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-full px-6"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </header>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {showCustomerServices && !dashboard?.hasActiveSubscription && (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-medium">Choose a service</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start a monthly subscription through Stripe Checkout.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {dashboard?.services.map((service) => (
                <article key={service.id} className="card-minimal">
                  <div className="flex flex-col gap-6">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="text-2xl font-medium">
                          {service.title}
                        </h3>
                        <p className="text-xl font-semibold">
                          {service.priceLabel}
                        </p>
                      </div>
                      <ul className="mt-5 space-y-2">
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex gap-3 text-sm text-muted-foreground"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className="w-full bg-black text-white hover:bg-black/90"
                      onClick={() => startCheckout(service.id)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === service.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Subscribe with Stripe
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {showCustomerServices && dashboard?.hasActiveSubscription && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="card-minimal">
              <h2 className="text-2xl font-medium">Service request</h2>
              <form className="mt-6 space-y-5" onSubmit={submitServiceRequest}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Select
                      value={form.serviceTierId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          serviceTierId: value,
                        }))
                      }
                    >
                      <SelectTrigger id="service">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {dashboard.services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          priority: value,
                        }))
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Homepage copy update"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe what you need changed or built."
                    required
                  />
                </div>
                <Button type="submit" disabled={requestSaving}>
                  {requestSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send request
                </Button>
                {requestMessage && (
                  <p className="text-sm text-muted-foreground">
                    {requestMessage}
                  </p>
                )}
              </form>
            </article>

            <div className="space-y-6">
              <article className="card-minimal">
                <h2 className="text-2xl font-medium">Subscription</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="text-right">
                      {dashboard.subscription?.productName || "Current plan"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Monthly rate</dt>
                    <dd>
                      {formatCurrency(
                        dashboard.subscription?.monthlyRateCents,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{statusLabel(dashboard.subscription?.status || "")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Start date</dt>
                    <dd>{formatDate(dashboard.subscription?.startedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Renewal date</dt>
                    <dd>
                      {formatDate(dashboard.subscription?.currentPeriodEnd)}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="card-minimal">
                <h2 className="text-2xl font-medium">Cancel subscription</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Open Stripe billing management to cancel or update payment
                  details.
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Open billing portal
                </Button>
              </article>
            </div>
          </section>
        )}

        {dashboard?.isAdmin && dashboard.admin && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium">Admin</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Customer, subscription, and service request overview.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="card-minimal">
                <p className="text-caption">Total recurring revenue</p>
                <p className="mt-3 text-3xl font-medium">
                  {formatCurrency(
                    dashboard.admin.totalRecurringRevenueCents,
                    dashboard.admin.currency,
                  )}
                  <span className="text-base text-muted-foreground"> /mo</span>
                </p>
              </article>
              <article className="card-minimal">
                <p className="text-caption">Total revenue so far</p>
                <p className="mt-3 text-3xl font-medium">
                  {formatCurrency(
                    dashboard.admin.totalRevenueCents,
                    dashboard.admin.currency,
                  )}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {dashboard.admin.revenueNote}
                </p>
              </article>
            </div>

            <article className="card-minimal overflow-hidden">
              <h3 className="mb-4 text-xl font-medium">Customers</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Renewal</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.admin.customers.map((customer) => {
                    const billing = billingByCustomerId.get(customer.id);

                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <p className="font-medium">
                            {customer.full_name || "No name"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {customer.email || "No email"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>
                            {billing?.stripe_product_name || "No active plan"}
                          </p>
                          {billing?.stripe_price_id && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {billing.stripe_price_id}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {billing
                            ? statusLabel(billing.subscription_status)
                            : "No billing record"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(billing?.monthly_rate_cents)}
                        </TableCell>
                        <TableCell>
                          {formatDate(billing?.current_period_end)}
                        </TableCell>
                        <TableCell>{formatDate(customer.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </article>

            <article className="card-minimal overflow-hidden">
              <h3 className="mb-4 text-xl font-medium">Service requests</h3>
              <RequestTable
                requests={activeRequests}
                customerById={customerById}
                onComplete={(requestId) =>
                  updateRequestStatus(requestId, "completed")
                }
              />
              <Collapsible
                open={completedOpen}
                onOpenChange={setCompletedOpen}
                className="mt-6 border-t border-border pt-4"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="px-0">
                    <ChevronDown className="h-4 w-4" />
                    Completed requests ({completedRequests.length})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <RequestTable
                    requests={completedRequests}
                    customerById={customerById}
                    onComplete={null}
                  />
                </CollapsibleContent>
              </Collapsible>
            </article>
          </section>
        )}
      </div>
    </main>
  );
};

const RequestTable = ({
  requests,
  customerById,
  onComplete,
}: {
  requests: ServiceRequest[];
  customerById: Map<string, Customer>;
  onComplete: ((requestId: string) => void) | null;
}) => {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No requests.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Created</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          {onComplete && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{formatDate(request.created_at)}</TableCell>
            <TableCell>
              {customerById.get(request.client_id)?.email || request.client_id}
            </TableCell>
            <TableCell>
              <p className="font-medium">{request.title || "Untitled"}</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {request.description}
              </p>
            </TableCell>
            <TableCell>{statusLabel(request.priority)}</TableCell>
            <TableCell>{statusLabel(request.status)}</TableCell>
            {onComplete && (
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onComplete(request.id)}
                >
                  Complete
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Dashboard;
