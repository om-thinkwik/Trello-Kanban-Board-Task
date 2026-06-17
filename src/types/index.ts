export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  color: string;
  lead: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  labels: string[];
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee: string;
  dueDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface Board {
  projectId: string;
  columns: Column[];
  cards: Card[];
}
