import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";
import type { TicketStatus } from "@/generated/prisma/client";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved"];

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = new URL(request.url).searchParams.get("status");
  const status = VALID_STATUSES.includes(statusParam as TicketStatus) ? (statusParam as TicketStatus) : undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  return NextResponse.json(
    tickets.map((t) => ({
      id: t.ref,
      subject: t.subject,
      customerName: t.customer.name,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
    })),
  );
}
