import { siteConfig, type ContributionMethod } from "@/config/site";

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
  source: "public_form" | "staff";
  note: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

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

/** Totals by status. */
export function summarise(rows: Pick<Contribution, "amount" | "status">[]) {
  const totals = { pending: { count: 0, amount: 0 }, verified: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 } };
  for (const row of rows) {
    totals[row.status].count += 1;
    totals[row.status].amount += Number(row.amount);
  }
  return totals;
}
