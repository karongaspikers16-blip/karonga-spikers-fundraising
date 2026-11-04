import { siteConfig, type ContributionMethod, type SupporterType } from "@/config/site";

export type ContributionStatus = "pending" | "verified" | "rejected";

export type Contribution = {
  id: string;
  donor_name: string;
  donor_phone: string | null;
  amount: number;
  method: ContributionMethod;
  reference: string | null;
  contributed_on: string;
  show_name: boolean;
  /** How the supporter wants to be thanked; null means donor_name. */
  display_name: string | null;
  /** The challenge day it counts for (set by the database). */
  challenge_day: string | null;
  message: string | null;
  status: ContributionStatus;
  /** "online": paid through PayChangu on /donate. */
  source: "public_form" | "staff" | "online";
  note: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  /** Online payments only: "KSVC-<uuid>". */
  tx_ref: string | null;
  paychangu_status: "initiated" | "success" | "failed" | "cancelled" | null;
  /** "paychangu" when PayChangu confirmed it automatically. */
  confirmed_by: "paychangu" | null;
  donor_email: string | null;
  supporter_type: SupporterType | null;
  organisation: string | null;
  campaign: string;
};

/** An online checkout that has not been paid (yet). Not for the treasurer to check by hand. */
export function awaitingOnline(c: Pick<Contribution, "source" | "status">) {
  return c.source === "online" && c.status === "pending";
}

export const CONTRIBUTION_METHODS = Object.keys(siteConfig.contributionMethods) as ContributionMethod[];
export const CONTRIBUTION_STATUSES: ContributionStatus[] = ["pending", "verified", "rejected"];

export const statusLabels: Record<ContributionStatus, string> = {
  pending: "To check",
  verified: "Verified",
  rejected: "Rejected",
};

export function methodLabel(method: ContributionMethod) {
  return siteConfig.contributionMethods[method] ?? method;
}

/** Today's date in Malawi as YYYY-MM-DD, for date inputs. */
export function todayInMalawi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Blantyre" }).format(new Date());
}

/** Totals by status. Unpaid online checkouts are left out: they are not waiting for anyone to check them. */
export function summarise(rows: Pick<Contribution, "amount" | "status" | "source">[]) {
  const totals = { pending: { count: 0, amount: 0 }, verified: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 } };
  for (const row of rows) {
    if (awaitingOnline(row)) continue;
    totals[row.status].count += 1;
    totals[row.status].amount += Number(row.amount);
  }
  return totals;
}
