import { NextResponse } from "next/server";

import { getAuthUser } from "@/src/lib/auth";
import { isGlobalNotifier } from "@/src/lib/notificationAccess";
import prisma from "@/src/lib/prisma";
import { readBlob } from "@/src/lib/blobAccess";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const viewer = await getAuthUser();
  if (!viewer) return new NextResponse("Não encontrado.", { status: 404 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      image: true,
      troop: { select: { managerId: true } },
      patrol: { select: { leaderId: true, subLeaderId: true } },
    },
  });
  if (!target?.image) return new NextResponse("Não encontrado.", { status: 404 });

  let allowed = viewer.id === id || isGlobalNotifier(viewer);
  allowed ||= target.troop?.managerId === viewer.id;
  allowed ||= target.patrol?.leaderId === viewer.id || target.patrol?.subLeaderId === viewer.id;

  if (!allowed) {
    const tie = await prisma.familyTie.findFirst({
      where: { guardianId: viewer.id, dependentId: id },
      select: { id: true },
    });
    allowed = !!tie;
  }

  if (!allowed) return new NextResponse("Não encontrado.", { status: 404 });

  const blob = await readBlob(target.image);
  if (!blob) return new NextResponse("Não encontrado.", { status: 404 });

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
