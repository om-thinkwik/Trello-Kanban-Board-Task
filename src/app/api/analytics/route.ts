import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateNetworkDelay } from "@/lib/api-utils";

export async function GET() {
  await simulateNetworkDelay();

  const totalProjects = db.projects.length;
  
  // Aggregate Project Status
  const projectStatusCount = {
    active: 0,
    completed: 0,
    "on-hold": 0,
  };

  db.projects.forEach((p) => {
    projectStatusCount[p.status]++;
  });

  const projectStatusData = [
    { name: "Active", value: projectStatusCount.active, color: "#3b82f6" },
    { name: "On Hold", value: projectStatusCount["on-hold"], color: "#f59e0b" },
    { name: "Completed", value: projectStatusCount.completed, color: "#10b981" },
  ].filter(item => item.value > 0); // Only return statuses that have projects

  // Aggregate Cards by Column
  const cardsByColumn: Record<string, number> = {
    "To Do": 0,
    "In Progress": 0,
    "Review": 0,
    "Done": 0,
  };

  // We loop through all boards and map their cards to the column titles
  Object.values(db.boards).forEach((board) => {
    // Map column ID to column Title for this board
    const columnIdToTitle: Record<string, string> = {};
    board.columns.forEach(col => {
      columnIdToTitle[col.id] = col.title;
    });

    board.cards.forEach((card) => {
      const title = columnIdToTitle[card.columnId];
      if (title && cardsByColumn[title] !== undefined) {
        cardsByColumn[title]++;
      }
    });
  });

  const cardsDistributionData = [
    { name: "To Do", count: cardsByColumn["To Do"] },
    { name: "In Progress", count: cardsByColumn["In Progress"] },
    { name: "Review", count: cardsByColumn["Review"] },
    { name: "Done", count: cardsByColumn["Done"] },
  ];

  const totalCards = Object.values(cardsByColumn).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    data: {
      summary: {
        totalProjects,
        totalCards,
      },
      projectStatusData,
      cardsDistributionData,
    }
  });
}
