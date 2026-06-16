import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay, apiError } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await simulateNetworkDelay();
  
  const board = db.boards[params.id];
  
  if (!board) {
    return apiError("Board not found for this project", 404);
  }

  return NextResponse.json({ data: board });
}
