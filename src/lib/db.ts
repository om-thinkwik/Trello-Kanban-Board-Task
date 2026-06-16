import { Project, Board, Column, Card } from "@/types";

// In a real app, this would be a database.
// We use a global variable to persist state in memory across API route calls during development.

const defaultColumns: Column[] = [
  { id: "col-todo", title: "To Do", order: 0 },
  { id: "col-in-progress", title: "In Progress", order: 1 },
  { id: "col-review", title: "Review", order: 2 },
  { id: "col-done", title: "Done", order: 3 },
];

const initialProjects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "Overhaul the main marketing website with the new brand guidelines.",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    name: "Mobile App V2",
    description: "Launch the React Native app for iOS and Android.",
    status: "on-hold",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const initialCards: Card[] = [
  {
    id: "card-1",
    columnId: "col-todo",
    title: "Design Homepage Hero",
    description: "Create 3 variations of the hero section.",
    labels: ["design"],
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "card-2",
    columnId: "col-in-progress",
    title: "Implement Navigation",
    description: "Build the responsive navbar and mobile menu.",
    labels: ["frontend", "high-priority"],
    order: 0,
    createdAt: new Date().toISOString(),
  }
];

// Next.js API routes are stateless between requests in production, but in development 
// global variables can persist across HMR reloads. To be safe, we wrap it in a global object.
const globalForDb = global as unknown as {
  mockDb: {
    projects: Project[];
    boards: Record<string, Board>;
  };
};

if (!globalForDb.mockDb) {
  globalForDb.mockDb = {
    projects: initialProjects,
    boards: {
      "proj-1": {
        projectId: "proj-1",
        columns: defaultColumns,
        cards: initialCards,
      },
      "proj-2": {
        projectId: "proj-2",
        columns: defaultColumns,
        cards: [],
      }
    },
  };
}

export const db = globalForDb.mockDb;
