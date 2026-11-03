import { canManageMoney, getStaff } from "@/lib/auth";
import { methodLabel, statusLabels, todayInMalawi, type Contribution } from "@/lib/contributions";

/** Every contribution as a CSV file that opens in Excel. Admin and treasurer only. */
export async function GET() {
  const staff = await getStaff();
  if (!staff?.user || !canManageMoney(staff.role)) return new Response("Not allowed", { status: 403 });

  const { data, error } = await staff.supabase
    .from("contributions")
    .select("*")
    .order("contributed_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return new Response("Could not load contributions", { status: 500 });

  // Quote every cell, and stop spreadsheet formulas from running ("=", "+", "-", "@").
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const header = ["Date paid", "Donor", "Amount (MWK)", "Method", "Transaction ID", "Status", "Phone", "Name shown", "Thanked as", "School", "Challenge day", "Source", "Note", "Message", "Recorded"];
  const lines = ((data ?? []) as Contribution[]).map((c) =>
    [
      c.contributed_on,
      c.donor_name,
      c.amount,
      methodLabel(c.method),
      c.reference,
      statusLabels[c.status],
      c.donor_phone,
      c.show_name ? "Yes" : "No",
      c.display_name,
      c.school,
      c.challenge_day,
      c.source === "public_form" ? "Website form" : "Staff",
      c.note,
      c.message,
      c.created_at,
    ]
      .map(cell)
      .join(","),
  );

  // The byte-order mark makes Excel read the file as UTF-8.
  const csv = `﻿${[header.map(cell).join(","), ...lines].join("\r\n")}\r\n`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karonga-spikers-contributions-${todayInMalawi()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
