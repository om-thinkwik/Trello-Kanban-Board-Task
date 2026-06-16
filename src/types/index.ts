export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  labels: string[];
  order: number;
  createdAt: string;
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
