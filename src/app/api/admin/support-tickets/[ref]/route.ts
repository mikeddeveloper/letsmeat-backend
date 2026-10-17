import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminSession";

const UpdateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ref } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ticket payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.supportTicket.findUnique({ where: { ref } });
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const updated = await prisma.supportTicket.update({
    where: { ref },
    data: { status: parsed.data.status },
    include: { customer: { select: { name: true } } },
  });

  return NextResponse.json({
    id: updated.ref,
    subject: updated.subject,
    customerName: updated.customer.name,
    priority: updated.priority,
    status: updated.status,
    createdAt: updated.createdAt,
  });
}
