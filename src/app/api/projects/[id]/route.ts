import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay, apiError } from "@/lib/api-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await simulateNetworkDelay();
  
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const index = db.projects.findIndex(p => p.id === resolvedParams.id);
    
    if (index === -1) {
      return apiError("Project not found", 404);
    }

    db.projects[index] = {
      ...db.projects[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: db.projects[index] });
  } catch (error) {
    return apiError("Invalid request body", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await simulateNetworkDelay();
  
  const resolvedParams = await params;
  const index = db.projects.findIndex(p => p.id === resolvedParams.id);
  
  if (index === -1) {
    return apiError("Project not found", 404);
  }

  db.projects.splice(index, 1);
  delete db.boards[resolvedParams.id];

  return NextResponse.json({ success: true });
}
