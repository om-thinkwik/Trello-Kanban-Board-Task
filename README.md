# Trello-style Kanban Board 

A modern, highly interactive project management application built with **Next.js (App Router)** and **Tailwind CSS**. This application mimics the core functionality of Trello, providing a seamless Kanban experience with advanced drag-and-drop capabilities, real-time analytics, and persistent sessions.

##  Getting Started

First, install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

##  Core Features

###  Project Dashboard
- **Create, Read, Update, Delete (CRUD):** Manage all your projects from a beautiful, responsive dashboard.
- **Search & Filter:** Instantly filter your projects by name or description.
- **Dynamic Theming:** Assign preset colors to your projects for quick visual identification.

###  Kanban Board (`/board`)
- **Drag and Drop:** Move tasks seamlessly across columns (To Do, In Progress, Review, Done).
- **Optimistic UI Updates:** Dragging a card instantly updates the UI, making the app feel incredibly fast while synchronizing with the backend behind the scenes.
- **Advanced Filtering:**
  - Search by task title or labels.
  - Filter by Priority (Low, Medium, High, Urgent).
  - Filter by Assignee by simply clicking on their Avatar. Clicking outside the avatars automatically clears the filter!
- **Sticky Sessions:** If you leave the app and come back later, it will automatically remember and redirect you to your last opened project!
- **Fallback States:** If you visit the board without a project ID, you will gracefully see the fallback state:
  > **No project selected**
  > **Go back to Projects**

###  Analytics Dashboard (`/analytics`)
- High-level overview of all your projects and tasks.
- Visual charts and graphs built with **Recharts**.
- Real-time aggregation of task completion rates and project statuses.

###  UX & Aesthetics
- **Skeleton UI:** Custom, beautiful skeleton wireframes are shown during data fetches to prevent layout shifting and provide a premium loading experience.
- **Micro-interactions:** Hover effects, transition animations, and modern glassmorphism elements implemented using pure Tailwind CSS.
- **Custom 404 Pages:** Graceful error handling and "Not Found" routing.

##  Technology Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18+)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) (Primitives) & [Lucide](https://lucide.dev/) (Icons)
- **Forms & Validation:** `react-hook-form` and `zod`
- **Charts:** [Recharts](https://recharts.org/)
- **Database:** In-memory local storage (`db.ts`) simulating a RESTful API with intentional network delays for realistic UX testing.

##  Project Structure
- `src/app/page.tsx` - The main Project Dashboard.
- `src/app/board/page.tsx` - The core Kanban Board logic and Drag-and-Drop handling.
- `src/app/analytics/page.tsx` - The data visualization dashboard.
- `src/components/ui/` - Reusable UI components (Modals, Cards, Skeletons).
- `src/lib/db.ts` - The mock in-memory database and seed data.
