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

    if (body.name && body.name.length < 2) {
      return apiError("Name must be at least 2 characters", 400);
    }

    db.projects[index] = {
      ...db.projects[index],
      name: body.name !== undefined ? body.name : db.projects[index].name,
      description: body.description !== undefined ? body.description : db.projects[index].description,
      color: body.color !== undefined ? body.color : db.projects[index].color,
      lead: body.lead !== undefined ? body.lead : db.projects[index].lead,
      status: body.status !== undefined ? body.status : db.projects[index].status,
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
