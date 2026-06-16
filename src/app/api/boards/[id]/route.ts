import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay, apiError } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await simulateNetworkDelay();
  
  const resolvedParams = await params;
  const board = db.boards[resolvedParams.id];
  
  if (!board) {
    return apiError("Board not found for this project", 404);
  }

  return NextResponse.json({ data: board });
}
