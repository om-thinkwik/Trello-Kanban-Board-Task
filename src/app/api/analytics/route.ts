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
    { name: "To Do", count: cardsByColumn["To Do"], color: "#94a3b8" }, // slate-400
    { name: "In Progress", count: cardsByColumn["In Progress"], color: "#3b82f6" }, // blue-500
    { name: "Review", count: cardsByColumn["Review"], color: "#f59e0b" }, // amber-500
    { name: "Done", count: cardsByColumn["Done"], color: "#10b981" }, // emerald-500
  ];

  const totalCards = Object.values(cardsByColumn).reduce((a, b) => a + b, 0);

  // Aggregate Team Workload
  const workloadByMember: Record<string, { member: string, todo: number, active: number, done: number, critical: number }> = {};

  Object.values(db.boards).forEach((board) => {
    const columnIdToTitle: Record<string, string> = {};
    board.columns.forEach(col => { columnIdToTitle[col.id] = col.title; });

    board.cards.forEach((card) => {
      const assignee = card.assignee || "Unassigned";
      if (!workloadByMember[assignee]) {
        workloadByMember[assignee] = { member: assignee, todo: 0, active: 0, done: 0, critical: 0 };
      }

      const title = columnIdToTitle[card.columnId]?.toLowerCase() || "";
      if (title === "to do") {
        workloadByMember[assignee].todo++;
      } else if (title === "done") {
        workloadByMember[assignee].done++;
      } else {
        workloadByMember[assignee].active++;
      }

      if (card.priority === "Urgent" || card.priority === "High") {
        workloadByMember[assignee].critical++;
      }
    });
  });

  const teamWorkloadData = Object.values(workloadByMember);

  // Activity Trend (Last 14 days)
  const activityTrendData: { date: string; created: number; completed: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    activityTrendData.push({
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      created: 0,
      completed: 0,
    });
  }

  const getDateStr = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return "";
    }
  };

  Object.values(db.boards).forEach((board) => {
    const columnIdToTitle: Record<string, string> = {};
    board.columns.forEach(col => { columnIdToTitle[col.id] = col.title; });

    board.cards.forEach((card) => {
      if (card.createdAt) {
        const createdStr = getDateStr(card.createdAt);
        const trendItemC = activityTrendData.find(d => d.date === createdStr);
        if (trendItemC) trendItemC.created++;
      }

      const title = columnIdToTitle[card.columnId]?.toLowerCase() || "";
      if (title === "done" && card.updatedAt) {
        const completedStr = getDateStr(card.updatedAt);
        const trendItemD = activityTrendData.find(d => d.date === completedStr);
        if (trendItemD) trendItemD.completed++;
      }
    });
  });

  return NextResponse.json({
    data: {
      summary: {
        totalProjects,
        totalCards,
      },
      projectStatusData,
      cardsDistributionData,
      teamWorkloadData,
      activityTrendData,
    }
  });
}
