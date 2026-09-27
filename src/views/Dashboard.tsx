"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
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
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/components/auth/useAuth";
import { supabase, type Customer, type CustomerBilling, type ServiceRequest } from "@/lib/supabase";
import type { ServiceTier } from "@/lib/services";
import { requestDashboard } from "@/lib/dashboard-request";

type DashboardSubscription = {
  id: string | null;
  status: string;
  monthlyRateCents: number | null;
  productName: string | null;
  priceId: string | null;
  startedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
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
    totalRecurringRevenueCents: number | null;
    totalRevenueCents: number | null;
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

const formatDateTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not completed";

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

const CustomerTable = ({ customers, billingByCustomerId }: {
  customers: Customer[];
  billingByCustomerId: Map<string, CustomerBilling>;
}) => customers.length === 0 ? <p className="text-body">No customers.</p> : (
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
      {customers.map((customer) => {
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
);

const Dashboard = () => {
  const { session, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestUpdating, setRequestUpdating] = useState<string | null>(null);
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

  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    const controller = new AbortController();
    const auth = supabase.auth;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await requestDashboard(auth, controller.signal);
        const payload = await parseApiResponse<DashboardData>(response);
        if (controller.signal.aborted) return;
        if (!response.ok || !payload) {
          setError(response.status === 401
            ? "Please sign out and sign in again to continue."
            : "We couldn’t load your dashboard. Please try again.");
          return;
        }
        setDashboard(payload);
        setForm((current) => ({
          ...current,
          serviceTierId: payload.services?.[0]?.id || current.serviceTierId,
        }));
      } catch {
        if (!controller.signal.aborted) {
          setError("We couldn’t connect. Please check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadDashboard();
    return () => controller.abort();
  }, [user?.id, reloadCount]);

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
      setError("We couldn’t open checkout. Please try again.");
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
      setError("We couldn’t open billing settings. Please try again.");
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
    setError(null);

    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const payload = await parseApiResponse<{
      error?: string;
      serviceRequest?: ServiceRequest;
      emailSent?: boolean;
    }>(response);

    if (!response.ok || !payload?.serviceRequest) {
      console.error("[service-requests] Submission failed.", {
        httpStatus: response.status,
        error: payload?.error || "Unknown API error",
      });
      toast.error("We couldn’t send your request. Check the details and try again.");
      setRequestSaving(false);
      return;
    }

    const serviceRequest = payload.serviceRequest;

    console.info("[service-requests] Submission saved.", {
      requestId: serviceRequest.id,
      httpStatus: response.status,
      emailSent: payload.emailSent,
    });

    if (payload.emailSent === false) {
      console.warn(
        "[service-requests] Request was saved, but its email notification was not sent. Check the server log for the EmailJS stage.",
        { requestId: serviceRequest.id },
      );
    }

    setDashboard((current) =>
      current
        ? {
            ...current,
            serviceRequests: [serviceRequest, ...current.serviceRequests],
          }
        : current,
    );
    setForm((current) => ({
      ...current,
      title: "",
      description: "",
      priority: "normal",
    }));
    toast.success("Request sent successfully.");
    setRequestSaving(false);
  };

  const updateServiceRequest = async (
    requestId: string,
    update: { status?: "completed"; adminComment?: string },
  ) => {
    if (!authHeaders) {
      return;
    }

    setRequestUpdating(requestId);
    setError(null);

    const response = await fetch(`/api/service-requests/${requestId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });
    const payload = await parseApiResponse<{
      error?: string;
      serviceRequest?: ServiceRequest;
    }>(response);

    if (!response.ok || !payload?.serviceRequest) {
      setError("We couldn’t update the request. Please try again.");
      setRequestUpdating(null);
      return;
    }

    const serviceRequest = payload.serviceRequest;

    setDashboard((current) =>
      current
        ? {
            ...current,
            serviceRequests: current.serviceRequests.map((request) =>
              request.id === serviceRequest.id ? serviceRequest : request,
            ),
            admin: current.admin
              ? {
                  ...current.admin,
                  serviceRequests: current.admin.serviceRequests.map(
                    (request) =>
                      request.id === serviceRequest.id
                        ? serviceRequest
                        : request,
                  ),
                }
              : null,
          }
        : current,
    );
    setRequestUpdating(null);
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

  const activeCustomers: Customer[] = [];
  const inactiveCustomers: Customer[] = [];
  for (const customer of dashboard?.admin?.customers ?? []) {
    const status = billingByCustomerId.get(customer.id)?.subscription_status;
    (status === "active" || status === "trialing" ? activeCustomers : inactiveCustomers).push(customer);
  }

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
  const showCustomerServices = dashboard && !dashboard.isAdmin;

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
              {!dashboard?.isAdmin && (
                <>
                  {" "}For any other questions email me:{" "}
                  <a
                    href="mailto:adamesoliman@gmail.com"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    adamesoliman@gmail.com
                  </a>
                </>
              )}
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
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p>{error}</p>
            {!dashboard && (
              <Button variant="outline" className="mt-3" onClick={() => setReloadCount((count) => count + 1)}>
                Try again
              </Button>
            )}
          </div>
        )}

        {showCustomerServices && !dashboard?.hasActiveSubscription && (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-medium">Choose a Service</h2>
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
                <h2 className="text-2xl font-medium">Service Request</h2>
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
                    <dt className="text-muted-foreground">
                      {dashboard.subscription?.cancelAt ||
                      dashboard.subscription?.cancelAtPeriodEnd
                        ? "Cancel date"
                        : "Renewal date"}
                    </dt>
                    <dd>
                      {formatDate(
                        dashboard.subscription?.cancelAt ||
                          dashboard.subscription?.currentPeriodEnd,
                      )}
                    </dd>
                  </div>
                  </dl>
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

        {showCustomerServices && dashboard && (
          <section className="card-minimal overflow-hidden">
            <h2 className="mb-4 text-2xl font-medium">
              Past Service Requests
            </h2>
            <CustomerRequestTable requests={dashboard.serviceRequests} />
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
                <p className="text-caption">Total Recurring Revenue</p>
                <p className="mt-3 text-3xl font-medium">
                  {formatCurrency(
                    dashboard.admin.totalRecurringRevenueCents,
                    dashboard.admin.currency,
                  )}
                  {dashboard.admin.totalRecurringRevenueCents !== null && (
                    <span className="text-base text-muted-foreground"> /mo</span>
                  )}
                </p>
              </article>
              <article className="card-minimal">
                <p className="text-caption">Total Revenue So Far</p>
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
              <h4 className="mb-3 text-sm font-medium">Active users ({activeCustomers.length})</h4>
              <CustomerTable customers={activeCustomers} billingByCustomerId={billingByCustomerId} />
              <Collapsible className="mt-6 border-t border-border pt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="group px-0">
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    Non-active users ({inactiveCustomers.length})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <CustomerTable customers={inactiveCustomers} billingByCustomerId={billingByCustomerId} />
                </CollapsibleContent>
              </Collapsible>
            </article>

            <article className="card-minimal overflow-hidden">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-medium">Service Requests</h3>
                {activeRequests.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                    aria-label={`${activeRequests.length} outstanding service ${activeRequests.length === 1 ? "request" : "requests"}`}
                  >
                    <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    {activeRequests.length}
                  </span>
                )}
              </div>
              <RequestTable
                requests={activeRequests}
                customerById={customerById}
                onUpdate={updateServiceRequest}
                updatingRequestId={requestUpdating}
              />
              <Collapsible
                open={completedOpen}
                onOpenChange={setCompletedOpen}
                className="mt-6 border-t border-border pt-4"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="px-0">
                    <ChevronDown className="h-4 w-4" />
                    Completed Requests ({completedRequests.length})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <RequestTable
                    requests={completedRequests}
                    customerById={customerById}
                    onUpdate={updateServiceRequest}
                    updatingRequestId={requestUpdating}
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
  onUpdate,
  updatingRequestId,
}: {
  requests: ServiceRequest[];
  customerById: Map<string, Customer>;
  onUpdate: (
    requestId: string,
    update: { status?: "completed"; adminComment?: string },
  ) => void;
  updatingRequestId: string | null;
}) => {
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No requests.</p>;
  }

  return (
    <Table className="[&_td]:px-3 [&_td]:py-2.5 [&_th]:h-10 [&_th]:px-3">
      <TableHeader>
        <TableRow>
          <TableHead>Sent</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin Comment</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="min-w-36">
              {formatDateTime(request.created_at)}
            </TableCell>
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
            <TableCell className="min-w-56">
              <Textarea
                className="min-h-16 px-2.5 py-1.5"
                value={commentDrafts[request.id] ?? request.admin_comment ?? ""}
                onChange={(event) =>
                  setCommentDrafts((current) => ({
                    ...current,
                    [request.id]: event.target.value,
                  }))
                }
                placeholder="Leave a comment for the customer"
                maxLength={2000}
                aria-label={`Admin comment for ${request.title || "service request"}`}
              />
            </TableCell>
            <TableCell className="min-w-36">
              {formatDateTime(request.completed_at)}
            </TableCell>
            <TableCell>
              <div className="flex min-w-28 flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5"
                  disabled={updatingRequestId === request.id}
                  onClick={() =>
                    onUpdate(request.id, {
                      adminComment:
                        commentDrafts[request.id] ?? request.admin_comment ?? "",
                    })
                  }
                >
                  {updatingRequestId === request.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save comment
                </Button>
                {request.status !== "completed" && (
                  <Button
                    size="sm"
                    className="h-8 px-2.5"
                    disabled={updatingRequestId === request.id}
                    onClick={() =>
                      onUpdate(request.id, {
                        status: "completed",
                        adminComment:
                          commentDrafts[request.id] ??
                          request.admin_comment ??
                          "",
                      })
                    }
                  >
                    Complete
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const CustomerRequestTable = ({ requests }: { requests: ServiceRequest[] }) => {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have not sent any service requests yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sent</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead>Admin Comment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="min-w-40">
              {formatDateTime(request.created_at)}
            </TableCell>
            <TableCell className="min-w-64">
              <p className="font-medium">{request.title || "Untitled"}</p>
              <p className="mt-1 max-w-md whitespace-pre-wrap text-sm text-muted-foreground">
                {request.description}
              </p>
            </TableCell>
            <TableCell>{statusLabel(request.priority)}</TableCell>
            <TableCell>{statusLabel(request.status)}</TableCell>
            <TableCell className="min-w-40">
              {formatDateTime(request.completed_at)}
            </TableCell>
            <TableCell className="min-w-64 whitespace-pre-wrap text-muted-foreground">
              {request.admin_comment || "No comment yet"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Dashboard;
