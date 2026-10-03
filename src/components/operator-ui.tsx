"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Headphones,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  complaintCategories,
  complaintStatuses,
  type Complaint,
  type ComplaintStatus,
} from "@/domain/complaints";
import styles from "./operator.module.css";

type ApiError = { success: false; error: { code: string; message: string } };
async function readApiResponse<T extends { success: true }>(
  response: Response,
  fallback: string,
): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok || !body?.success)
    throw new Error(
      body?.success === false && typeof body.error?.message === "string"
        ? body.error.message
        : fallback,
    );
  return body;
}
type ComplaintList = {
  success: true;
  complaints: Complaint[];
  pagination: { page: number; pageSize: number; total: number };
  overview: {
    open: number;
    reviewing: number;
    resolved: number;
    escalated: number;
    receivedToday: number;
  };
};
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function OperatorFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  async function logout() {
    setBusy(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/operator/session", {
        method: "DELETE",
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("Could not end this session. Try again.");
      router.replace("/operator/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Could not end this session.",
      );
      setBusy(false);
    }
  }
  return (
    <div className={styles.frame}>
      <aside className={styles.rail}>
        <Link href="/" className={styles.logo} aria-label="LightLine home">
          <span>
            <Zap size={17} fill="currentColor" />
          </span>
          <b>lightline</b>
        </Link>
        <div className={styles.workspace}>
          <span className={styles.workspaceIcon}>
            <Activity size={15} />
          </span>
          <span>
            <b>Operations desk</b>
            <small>Complaint intake</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <p className={styles.navLabel}>WORKSPACE</p>
        <nav className={styles.sideNav}>
          <Link
            href="/dashboard"
            className={path === "/dashboard" ? styles.selected : ""}
          >
            <LayoutDashboard size={16} />
            Complaint register
          </Link>
        </nav>
        <div className={styles.railBottom}>
          <div className={styles.safeNote}>
            <ShieldCheck size={16} />
            <span>
              Secure operator
              <br />
              workspace
            </span>
          </div>
          <button
            className={styles.userButton}
            onClick={logout}
            disabled={busy}
            aria-label={
              busy
                ? "Signing out of LightLine"
                : "Sign out of LightLine operator access"
            }
          >
            <span className={styles.avatar}>O</span>
            <span>
              <b>Operator</b>
              <small>{busy ? "Signing out…" : "LightLine desk"}</small>
            </span>
            <span className={styles.mobileSignOut}>Sign out</span>
            <LogOut size={15} />
          </button>
          {logoutError && (
            <p className={styles.inlineError} role="alert">
              {logoutError}
            </p>
          )}
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            LightLine <span>/</span>{" "}
            <b>
              {path.includes("/complaints/")
                ? "Complaint detail"
                : "Complaint register"}
            </b>
          </div>
          <div className={styles.topRight}>
            <span className={styles.deskStatus}>
              <i /> Signed in
            </span>
            <span className={styles.topDivider} />
            <span className={styles.operatorBadge}>OL</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function ComplaintRegister() {
  const [data, setData] = useState<ComplaintList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    async function fetchComplaints() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "25",
        });
        if (status) params.set("status", status);
        if (category) params.set("category", category);
        const response = await fetch(`/api/complaints?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          router.replace("/operator/login?expired=1");
          return;
        }
        const body = await readApiResponse<ComplaintList>(
          response,
          "Could not load complaints. Please try again.",
        );
        if (!controller.signal.aborted) {
          setData(body);
          setError("");
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Could not load complaints.",
          );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void fetchComplaints();
    return () => controller.abort();
  }, [page, status, category, refreshKey, router]);
  const complaints = data?.complaints ?? [];
  return (
    <div className={styles.content}>
      <div className={styles.pageHeading}>
        <div>
          <div className={styles.kicker}>
            INTAKE OVERVIEW <span>•</span> OPERATOR VIEW
          </div>
          <h1>Complaint register</h1>
          <p>Review reported electricity issues and keep each record moving.</p>
        </div>
        <button
          className={styles.refresh}
          onClick={() => {
            setRefreshing(true);
            setRefreshKey((k) => k + 1);
          }}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} className={refreshing ? styles.spin : ""} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>
      <section className={styles.stats} aria-label="Complaint totals">
        <Stat
          icon={<CircleAlert />}
          title="Open"
          value={data?.overview.open}
          tone="blue"
        />
        <Stat
          icon={<Clock3 />}
          title="Reviewing"
          value={data?.overview.reviewing}
          tone="amber"
        />
        <Stat
          icon={<Check />}
          title="Resolved"
          value={data?.overview.resolved}
          tone="mint"
        />
        <Stat
          icon={<Bell />}
          title="Escalated"
          value={data?.overview.escalated}
          tone="rose"
        />
        <div className={styles.today}>
          <span>RECEIVED TODAY</span>
          <b>{data?.overview.receivedToday ?? "—"}</b>
          <small>complaints</small>
        </div>
      </section>
      <section className={styles.register}>
        <div className={styles.registerHead}>
          <div>
            <h2>Recent complaints</h2>
            <p>{data?.pagination.total ?? 0} total records</p>
          </div>
          <div className={styles.filters}>
            <select
              value={category}
              onChange={(e) => {
                setLoading(true);
                setError("");
                setPage(1);
                setCategory(e.target.value);
              }}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {complaintCategories.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setLoading(true);
                setError("");
                setPage(1);
                setStatus(e.target.value);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {complaintStatuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className={styles.state}>
            <span className={styles.spinner} />
            <b>Loading complaint register</b>
            <span>Fetching the latest saved records.</span>
          </div>
        ) : error ? (
          <div className={styles.state}>
            <CircleAlert size={23} />
            <b>Complaint register unavailable</b>
            <span>{error}</span>
            <button
              className={styles.retry}
              onClick={() => {
                setLoading(true);
                setError("");
                setRefreshKey((k) => k + 1);
              }}
            >
              Try again <ArrowRight size={14} />
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.emptyIcon}>
              <Headphones size={20} />
            </div>
            <b>
              {data?.pagination.total
                ? "No complaints on this page"
                : "No complaints recorded yet"}
            </b>
            <span>
              {data?.pagination.total
                ? "Try clearing the selected category or status filter."
                : "New call based complaints will appear here after they are saved."}
            </span>
            {(category || status) && (
              <button
                className={styles.retry}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setCategory("");
                  setStatus("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={styles.tableWrap}
              role="region"
              aria-label="Complaint records"
              tabIndex={0}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Complaint</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>
                      <span className={styles.srOnly}>Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          href={`/dashboard/complaints/${encodeURIComponent(c.ticketId)}`}
                          className={styles.ticketLink}
                        >
                          {c.ticketId}
                        </Link>
                        <small>{c.source.toLowerCase()} intake</small>
                      </td>
                      <td>
                        <b className={styles.desc}>{c.description}</b>
                        <small>
                          {c.meterNumber
                            ? `Meter ${c.meterNumber}`
                            : c.customerAccount
                              ? `Account ${c.customerAccount}`
                              : "Details on record"}
                        </small>
                      </td>
                      <td>{c.location}</td>
                      <td>
                        <span className={styles.category}>
                          <i />
                          {label(c.category)}
                        </span>
                      </td>
                      <td>
                        <Status status={c.status} />
                      </td>
                      <td className={styles.date}>{shortDate(c.createdAt)}</td>
                      <td>
                        <Link
                          className={styles.rowArrow}
                          href={`/dashboard/complaints/${encodeURIComponent(c.ticketId)}`}
                          aria-label={`Open ${c.ticketId}`}
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <span>
                Showing {complaints.length} of {data?.pagination.total ?? 0}{" "}
                complaints
              </span>
              <div>
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setPage((p) => p - 1);
                  }}
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span>Page {page}</span>
                <button
                  disabled={page * 25 >= (data?.pagination.total ?? 0)}
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setPage((p) => p + 1);
                  }}
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className={styles.footerHint}>
        <ShieldCheck size={14} /> Complaint information is visible to
        authenticated operators only.
      </p>
    </div>
  );
}
function Stat({
  icon,
  title,
  value,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | undefined;
  tone: string;
}) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.statIcon} ${styles[tone]}`}>{icon}</span>
      <span className={styles.statText}>
        <small>{title}</small>
        <b>{value ?? "—"}</b>
      </span>
    </div>
  );
}
function Status({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`${styles.status} ${styles[status.toLowerCase()]}`}>
      <i />
      {label(status)}
    </span>
  );
}

export function ComplaintDetail({ ticketId }: { ticketId: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [nextStatus, setNextStatus] = useState<ComplaintStatus | "">("");
  const [retry, setRetry] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    async function fetchComplaint() {
      try {
        const r = await fetch(
          `/api/complaints/${encodeURIComponent(ticketId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (r.status === 401 || r.status === 403) {
          router.replace("/operator/login?expired=1");
          return;
        }
        const body = await readApiResponse<{
          success: true;
          complaint: Complaint;
        }>(r, "Could not load complaint. Please try again.");
        setComplaint(body.complaint);
        setNextStatus(body.complaint.status);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Could not load complaint.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchComplaint();
    return () => controller.abort();
  }, [ticketId, retry, router]);
  async function save() {
    if (!nextStatus || !complaint) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const r = await fetch(`/api/complaints/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (r.status === 401 || r.status === 403) {
        router.replace("/operator/login?expired=1");
        return;
      }
      const body = await readApiResponse<{
        success: true;
        complaint: Complaint;
      }>(r, "Could not save status. Please try again.");
      setComplaint(body.complaint);
      setNextStatus(body.complaint.status);
      setMessage("Status saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save status.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.content}>
      <Link href="/dashboard" className={styles.back}>
        <ArrowLeft size={15} /> Back to complaint register
      </Link>
      {loading ? (
        <div className={styles.state}>
          <span className={styles.spinner} />
          <b>Loading complaint</b>
          <span>Retrieving the saved ticket record.</span>
        </div>
      ) : error && !complaint ? (
        <div className={styles.state}>
          <CircleAlert size={23} />
          <b>Complaint unavailable</b>
          <span>{error}</span>
          <button
            className={styles.retry}
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        complaint && (
          <>
            <div className={styles.detailHeading}>
              <div>
                <div className={styles.kicker}>
                  COMPLAINT RECORD <span>•</span> {complaint.source} INTAKE
                </div>
                <h1>{complaint.ticketId}</h1>
                <p>
                  Received {shortDate(complaint.createdAt)} <span>·</span>{" "}
                  Updated {shortDate(complaint.updatedAt)}
                </p>
              </div>
              <Status status={complaint.status} />
            </div>
            <div className={styles.detailGrid}>
              <section className={styles.record}>
                <div className={styles.recordTitle}>
                  <span className={styles.recordIcon}>
                    <Headphones size={17} />
                  </span>
                  <div>
                    <h2>Complaint details</h2>
                    <p>Information provided for operator review</p>
                  </div>
                </div>
                <div className={styles.description}>
                  <small>DESCRIPTION</small>
                  <p>{complaint.description}</p>
                </div>
                <dl className={styles.fields}>
                  <Field label="Category" value={label(complaint.category)} />
                  <Field label="Location" value={complaint.location} />
                  <Field label="Priority" value={label(complaint.priority)} />
                  <Field label="Meter number" value={complaint.meterNumber} />
                  <Field
                    label="Customer account"
                    value={complaint.customerAccount}
                  />
                  <Field label="Caller phone" value={complaint.callerPhone} />
                  {complaint.providerCallId && (
                    <Field
                      label="Provider call reference"
                      value={complaint.providerCallId}
                    />
                  )}
                </dl>
              </section>
              <aside className={styles.statusPanel}>
                <div className={styles.panelLabel}>
                  <Activity size={15} /> RECORD STATUS
                </div>
                <h2>Move this complaint forward</h2>
                <p>
                  Update the ticket status to reflect its current place in the
                  review process.
                </p>
                <label htmlFor="next-status">New status</label>
                <select
                  id="next-status"
                  value={nextStatus}
                  onChange={(e) => {
                    setNextStatus(e.target.value as ComplaintStatus);
                    setMessage("");
                    setError("");
                  }}
                >
                  {complaintStatuses.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.saveButton}
                  onClick={() => void save()}
                  disabled={saving || nextStatus === complaint.status}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className={styles.spin} /> Saving
                      status
                    </>
                  ) : (
                    <>
                      Save status <ArrowRight size={15} />
                    </>
                  )}
                </button>
                {message && (
                  <p className={styles.successMsg} role="status">
                    <Check size={15} />
                    {message}
                  </p>
                )}
                {error && (
                  <p className={styles.inlineError} role="alert">
                    {error}
                  </p>
                )}
                <div className={styles.panelNote}>
                  <ShieldCheck size={15} /> Status changes are saved to this
                  complaint record.
                </div>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value || <span className={styles.notProvided}>Not provided</span>}
      </dd>
    </div>
  );
}
