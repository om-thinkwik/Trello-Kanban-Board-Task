import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay, apiError } from "@/lib/api-utils";
import { Card } from "@/types";

export async function POST(request: Request) {
  await simulateNetworkDelay();
  
  try {
    const body = await request.json();
    const { projectId, columnId, title, description, labels } = body;
    
    if (!projectId || !columnId || !title) {
      return apiError("projectId, columnId, and title are required", 400);
    }

    const board = db.boards[projectId];
    if (!board) {
      return apiError("Board not found", 404);
    }

    const newCard: Card = {
      id: crypto.randomUUID(),
      projectId,
      columnId,
      title,
      description: description || "",
      labels: labels || [],
      priority: body.priority || "Medium",
      assignee: body.assignee || "Alex Morgan",
      dueDate: body.dueDate || undefined,
      order: board.cards.filter(c => c.columnId === columnId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    board.cards.push(newCard);

    return NextResponse.json({ data: newCard }, { status: 201 });
  } catch (error) {
    return apiError("Invalid request body", 400);
  }
}

export async function PUT(request: Request) {
  await simulateNetworkDelay();
  
  try {
    const body = await request.json();
    const { projectId, cardId, columnId, order, ...updates } = body;
    
    if (!projectId || !cardId) {
      return apiError("projectId and cardId are required", 400);
    }

    const board = db.boards[projectId];
    if (!board) {
      return apiError("Board not found", 404);
    }

    const cardIndex = board.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return apiError("Card not found", 404);
    }

    // Handle drag and drop reordering
    if (columnId !== undefined && order !== undefined) {
      // Re-calculate orders if column changed or order changed
      // For a real app, this logic would be more robust, potentially happening in a DB transaction.
      board.cards[cardIndex] = { ...board.cards[cardIndex], columnId, order, ...updates };
      
      // Simple re-sort to fix orders (mock DB approach)
      // We assume the frontend sends the updated order of ALL cards in the affected columns, 
      // or we just trust the specific order sent. Here we just update the specific card.
    } else {
      board.cards[cardIndex] = { ...board.cards[cardIndex], ...updates };
    }

    return NextResponse.json({ data: board.cards[cardIndex] });
  } catch (error) {
    return apiError("Invalid request body", 400);
  }
}

export async function DELETE(request: Request) {
  await simulateNetworkDelay();
  
  try {
    // We expect { projectId, cardId } in the URL search params or body
    // Using URL params for DELETE is more RESTful
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const cardId = url.searchParams.get("cardId");
    
    if (!projectId || !cardId) {
      return apiError("projectId and cardId are required as query params", 400);
    }

    const board = db.boards[projectId];
    if (!board) {
      return apiError("Board not found", 404);
    }

    const cardIndex = board.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return apiError("Card not found", 404);
    }

    board.cards.splice(cardIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("Invalid request", 400);
  }
}
