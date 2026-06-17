import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay, apiError } from "@/lib/api-utils";
import { Project } from "@/types";

export async function GET() {
  await simulateNetworkDelay();
  return NextResponse.json({ data: db.projects });
}

export async function POST(request: Request) {
  await simulateNetworkDelay();
  
  try {
    const body = await request.json();
    
    if (!body.name || body.name.length < 2) {
      return apiError("Name is required and must be at least 2 characters", 400);
    }
    
    const color = body.color || "#4F46E5";
    const lead = body.lead || "Unassigned";

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || "",
      status: body.status || "active",
      color: color,
      lead: lead,
      members: [lead],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.projects.push(newProject);
    
    // Initialize an empty board for this new project
    db.boards[newProject.id] = {
      projectId: newProject.id,
      columns: [
        { id: `col-todo-${crypto.randomUUID()}`, title: "To Do", order: 0 },
        { id: `col-in-progress-${crypto.randomUUID()}`, title: "In Progress", order: 1 },
        { id: `col-review-${crypto.randomUUID()}`, title: "Review", order: 2 },
        { id: `col-done-${crypto.randomUUID()}`, title: "Done", order: 3 },
      ],
      cards: [],
    };

    return NextResponse.json({ data: newProject }, { status: 201 });
  } catch {
    return apiError("Invalid request body", 400);
  }
}
