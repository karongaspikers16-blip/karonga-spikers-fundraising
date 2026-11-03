import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Eye, Globe, Pencil, Plus } from "lucide-react";
import { canManageMoney, getStaff } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { methodLabel, statusLabels, summarise, type Contribution, type ContributionStatus } from "@/lib/contributions";
import { formatDay } from "@/lib/challenge";
import { ContributionStatusButtons } from "@/components/admin/ContributionActions";

type Props = { searchParams: Promise<{ status?: string; q?: string; saved?: string }> };

const tabs: (ContributionStatus | "all")[] = ["pending", "verified", "rejected", "all"];

export default async function ContributionsPage({ searchParams }: Props) {
  const staff = await getStaff();
  if (!staff?.user || !staff.role) return null;
  if (!canManageMoney(staff.role)) redirect("/admin");

  const params = await searchParams;
  const [{ data, error }, { data: people }] = await Promise.all([
    staff.supabase.from("contributions").select("*").order("created_at", { ascending: false }).limit(2000),
    staff.supabase.from("profiles").select("id, full_name"),
  ]);
  const rows = (data ?? []) as Contribution[];
  const names = new Map((people ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "staff"]));
  const totals = summarise(rows);

  const requested = tabs.find((t) => t === params.status);
  const status = requested ?? (totals.pending.count > 0 ? "pending" : "all");
  const q = (params.q ?? "").trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (!q ||
        [r.donor_name, r.display_name, r.reference].some((v) => (v ?? "").toLowerCase().includes(q))),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none text-forest">Contributions</h1>
        <div className="flex gap-2">
          <a
            href="/admin/contributions/export"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-3 font-semibold text-forest hover:bg-club-tint"
          >
            <Download className="size-5" aria-hidden /> <span className="max-sm:sr-only">Export CSV</span>
          </a>
          <Link
            href="/admin/contributions/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-club px-4 py-3 font-bold text-white hover:bg-forest"
          >
            <Plus className="size-5" aria-hidden /> Record
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-forest p-4 text-white">
          <dt className="text-sm text-white/75">Verified total</dt>
          <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">
            {formatMoney(totals.verified.amount)}
          </dd>
          <dd className="text-xs text-white/70">{totals.verified.count} contributions</dd>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <dt className="text-sm text-ink-soft">Waiting to check</dt>
          <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-forest sm:text-3xl">
            {formatMoney(totals.pending.amount)}
          </dd>
          <dd className="text-xs text-ink-soft">{totals.pending.count} contributions</dd>
        </div>
      </dl>

      {params.saved && (
        <p role="status" className="mt-4 rounded-lg bg-club-tint px-4 py-3 text-sm font-medium text-forest">
          Saved. The public total updates within a minute.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-gold-tint px-4 py-3 text-ink">
          Contributions could not be loaded. Check your connection and refresh.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/contributions?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            aria-current={status === t ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
              status === t ? "bg-forest text-white" : "bg-white text-forest ring-1 ring-line hover:bg-club-tint"
            }`}
          >
            {t === "all" ? "All" : statusLabels[t]}
            {t !== "all" && <span className="ml-1.5 tabular-nums opacity-75">{totals[t].count}</span>}
          </Link>
        ))}
      </div>

      <form className="mt-3" role="search">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name or transaction ID"
          aria-label="Search contributions"
          className="block w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink focus:border-club focus:outline-none"
        />
      </form>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-ink-soft ring-1 ring-line">
          {status === "pending" ? "Nothing waiting to be checked." : "No contributions here yet."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-ink">
                    <span className="truncate">{c.donor_name}</span>
                    {c.show_name && <Eye className="size-4 shrink-0 text-club" aria-label="Name shown publicly" />}
                  </p>
                  {c.show_name && c.display_name && (
                    <p className="text-sm text-ink-soft">Thanked as “{c.display_name}”</p>
                  )}
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {methodLabel(c.method)} · {formatDate(c.contributed_on)}
                    {c.challenge_day && c.challenge_day !== c.contributed_on && ` · counts for ${formatDay(c.challenge_day)}`}
                  </p>
                </div>
                <p className="shrink-0 font-display text-2xl font-bold tabular-nums text-forest">{formatMoney(c.amount)}</p>
              </div>

              {c.reference && (
                <p className="mt-2 text-sm text-ink-soft">
                  Transaction ID{" "}
                  <span className="block break-all font-mono text-lg font-semibold tracking-wide text-ink">{c.reference}</span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                {c.donor_phone && (
                  <a href={`tel:${c.donor_phone.replace(/\s+/g, "")}`} className="text-club hover:underline">
                    {c.donor_phone}
                  </a>
                )}
                {c.source === "public_form" && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="size-3.5" aria-hidden /> From website
                  </span>
                )}
                {c.status === "verified" && c.verified_by && <span>Verified by {names.get(c.verified_by) ?? "staff"}</span>}
              </div>
              {c.message && <p className="mt-2 rounded-lg bg-mist p-2.5 text-sm text-ink">“{c.message}”</p>}
              {c.note && <p className="mt-2 text-sm text-ink-soft">Note: {c.note}</p>}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ContributionStatusButtons id={c.id} status={c.status} />
                <Link
                  href={`/admin/contributions/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-club hover:bg-club-tint"
                >
                  <Pencil className="size-4" aria-hidden /> Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
