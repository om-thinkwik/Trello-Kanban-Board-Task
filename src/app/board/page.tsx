"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { 
  Board, 
  Card as CardType,
  Project 
} from "@/types";
import { BoardColumn } from "@/components/kanban/BoardColumn";
import { BoardCard } from "@/components/kanban/BoardCard";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Trash2, Search, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const TEAM_MEMBERS = ["Alex Morgan", "Sam Chen", "Jordan Lee", "Riley Park", "Casey Kim"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const cardSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  status: z.string().min(1, "Status is required"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"], { message: "Please select a priority" }),
  assignee: z.string().min(1, "Please select an assignee"),
  dueDate: z.string().min(1, "Due date is required"),
  labels: z.string().optional(),
});
type CardFormValues = z.infer<typeof cardSchema>;

function BoardContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  // Drag state
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<{id: string, title: string} | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors, isDirty, isSubmitting } } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: "" as any,
      assignee: "",
      dueDate: "",
      labels: "",
    }
  });

  const fetchBoard = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/boards/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      const json = await res.json();
      setBoard(json.data);
      setProject(json.project);
    } catch {
      setError("Failed to load board.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px tolerance to allow clicking buttons inside cards
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const openCreateModal = (columnId: string) => {
    setIsEditMode(false);
    setEditingCardId(null);
    reset({
      title: "",
      description: "",
      status: columnId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: "" as any,
      assignee: "",
      dueDate: "",
      labels: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (card: CardType) => {
    setIsEditMode(true);
    setEditingCardId(card.id);
    reset({
      title: card.title,
      description: card.description || "",
      status: card.columnId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: card.priority as any,
      assignee: card.assignee,
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : "",
      labels: card.labels ? card.labels.join(", ") : "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CardFormValues) => {
    const labelsArray = data.labels
      ? data.labels
          .split(",")
          .map(l => l.trim())
          .filter(l => l !== "")
      : [];

    if (isEditMode && editingCardId) {
      // Edit
      const previousBoard = board ? { ...board } : null;
      
      setBoard((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.cards];
        const index = newCards.findIndex(c => c.id === editingCardId);
        if (index !== -1) {
          newCards[index] = { 
            ...newCards[index], 
            title: data.title,
            description: data.description,
            columnId: data.status,
            priority: data.priority,
            assignee: data.assignee,
            dueDate: data.dueDate || undefined,
            labels: labelsArray,
          };
        }
        return { ...prev, cards: newCards };
      });

      setIsModalOpen(false);

      try {
        const res = await fetch("/api/cards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            cardId: editingCardId,
            title: data.title,
            description: data.description,
            columnId: data.status,
            priority: data.priority,
            assignee: data.assignee,
            dueDate: data.dueDate || undefined,
            labels: labelsArray,
          }),
        });

        if (!res.ok) throw new Error("Failed to update card");
        toast({ title: "Success", description: "Card updated" });
      } catch {
        if (previousBoard) setBoard(previousBoard);
        toast({ title: "Error", description: "Could not update card", type: "error" });
      }
    } else {
      // Create
      try {
        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            columnId: data.status,
            title: data.title,
            description: data.description,
            priority: data.priority,
            assignee: data.assignee,
            dueDate: data.dueDate || undefined,
            labels: labelsArray,
          }),
        });

        if (!res.ok) throw new Error("Failed to create card");
        const json = await res.json();
        
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cards: [...prev.cards, json.data],
          };
        });
        
        setIsModalOpen(false);
        toast({ title: "Success", description: "Card created" });
      } catch {
        toast({ title: "Error", description: "Could not create card", type: "error" });
      }
    }
  };

  const handleDeleteCard = () => {
    if (!editingCardId || !isEditMode) return;
    
    const cardTitle = board?.cards.find(c => c.id === editingCardId)?.title || "Card";
    setCardToDelete({ id: editingCardId, title: cardTitle });
  };

  const executeDeleteCard = async () => {
    if (!cardToDelete) return;
    const { id } = cardToDelete;

    // Optimistic Delete
    const previousBoard = board ? { ...board } : null;
    setBoard((prev) => {
      if (!prev) return prev;
      return { ...prev, cards: prev.cards.filter(c => c.id !== id) };
    });
    
    setIsModalOpen(false);

    try {
      const res = await fetch(`/api/cards?projectId=${projectId}&cardId=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete card");
      toast({ title: "Deleted", description: "Card deleted" });
    } catch {
      if (previousBoard) setBoard(previousBoard);
      toast({ title: "Error", description: "Could not delete card", type: "error" });
    } finally {
      setCardToDelete(null);
    }
  };

  // --- Drag Handlers ---
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { data } = active;
    if (data.current?.type === "Card") {
      setActiveCard(data.current.card);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === "Card";
    const isOverCard = over.data.current?.type === "Card";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveCard) return;

    if (isActiveCard && isOverCard) {
      setBoard((board) => {
        if (!board) return board;
        
        const activeIndex = board.cards.findIndex((c) => c.id === activeId);
        const overIndex = board.cards.findIndex((c) => c.id === overId);
        
        const newCards = [...board.cards];
        const activeCard = newCards[activeIndex];
        const overCard = newCards[overIndex];

        if (activeCard.columnId !== overCard.columnId) {
          activeCard.columnId = overCard.columnId;
        }
        
        return {
          ...board,
          cards: arrayMove(newCards, activeIndex, overIndex).map((card, index) => {
            return { ...card, order: index };
          }),
        };
      });
    }

    if (isActiveCard && isOverColumn) {
      setBoard((board) => {
        if (!board) return board;

        const activeIndex = board.cards.findIndex((c) => c.id === activeId);
        const newCards = [...board.cards];
        
        newCards[activeIndex] = { 
          ...newCards[activeIndex], 
          columnId: String(overId),
        };

        return { ...board, cards: newCards };
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const activeData = active.data.current?.card;

    if (!board || !activeData) return;
    
    const updatedCard = board.cards.find(c => c.id === activeId);
    if (!updatedCard) return;

    if (
      updatedCard.columnId !== activeData.columnId || 
      updatedCard.order !== activeData.order
    ) {
      try {
        await fetch("/api/cards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            cardId: updatedCard.id,
            columnId: updatedCard.columnId,
            order: updatedCard.order,
          }),
        });
      } catch {
        toast({ title: "Sync Error", description: "Failed to move card — reverting", type: "error" });
        fetchBoard(); // Revert
      }
    }
  };

  if (!projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-medium text-gray-900 font-heading">No project selected</h2>
        <Link href="/">
          <Button>Go back to Projects</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <p>{error || "Board not found"}</p>
      </div>
    );
  }

  // --- UI Helpers & Filtering ---
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

  const filteredCards = board.cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (card.labels && card.labels.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPriority = priorityFilter === "All priorities" || card.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === null || card.assignee === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const doneColumnId = board.columns.find(c => c.title.toLowerCase() === "done")?.id;
  const doneCardsCount = board.cards.filter(c => c.columnId === doneColumnId).length;
  const totalCardsCount = board.cards.length;
  const progressPercent = totalCardsCount === 0 ? 0 : Math.round((doneCardsCount / totalCardsCount) * 100);

  return (
    <div className="flex h-full flex-col">
      {/* TOP HEADER AREA */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 text-sm font-medium mr-2">
            <ArrowLeft className="w-4 h-4" /> All projects
          </Link>
          {project && (
            <>
              <div 
                className="w-8 h-8 rounded-lg shadow-sm" 
                style={{ backgroundColor: project.color || "#4F46E5" }}
              />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-heading">
                {project.name}
              </h1>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* PROGRESS BAR */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500">
                {doneCardsCount}/{totalCardsCount} done
              </span>
            </div>

            {/* AVATARS */}
            {(() => {
              const doneAssignees = Array.from(new Set(board.cards.filter(c => c.columnId === doneColumnId && c.assignee).map(c => c.assignee)));
              
              if (doneAssignees.length === 0) return null;

              return (
                <div className="flex items-center -space-x-2">
                  {doneAssignees.map((member, i) => (
                    <div 
                      key={member}
                      onClick={() => setAssigneeFilter(prev => prev === member ? null : member)}
                      className={`w-7 h-7 rounded-full bg-primary-accent border-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-10 relative cursor-pointer transition-transform hover:scale-110 ${assigneeFilter === member ? 'ring-2 ring-primary-accent ring-offset-1 border-white' : 'border-white'}`}
                      style={{ zIndex: 10 - i, backgroundColor: ["#4F46E5", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"][i % 5] }}
                      title={`${member} (Completed a task). Click to filter.`}
                    >
                      {getInitials(member)}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                className="pl-9 pr-4 py-1.5 w-48 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* PRIORITY FILTER */}
            <select
              className="py-1.5 pl-3 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent bg-white text-gray-600 font-medium"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All priorities">All priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* ADD CARD BUTTON */}
            <Button onClick={() => openCreateModal(board.columns[0].id)} className="bg-primary-accent hover:bg-primary-accent/90 shadow-sm py-1.5 h-auto">
              <Plus className="mr-1.5 h-4 w-4" /> Add card
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-6 px-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            {board.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                cards={filteredCards.filter((c) => c.columnId === column.id)}
                onAddCard={openCreateModal}
                onCardClick={openEditModal}
              />
            ))}
            <DragOverlay>
              {activeCard ? <BoardCard card={activeCard} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Card" : "Add New Card"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Input label="Card Title" placeholder="What needs to be done?" {...field} autoFocus />
                {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <Textarea label="Description" placeholder="Add more details..." {...field} />
                {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...field} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent">
                    {board.columns.map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                  {errors.status && <span className="text-xs text-red-500">{errors.status.message}</span>}
                </div>
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select {...field} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent">
                    <option value="" disabled hidden>Select...</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.priority && <span className="text-xs text-red-500">{errors.priority.message}</span>}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="assignee"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Assignee</label>
                  <select {...field} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent">
                    <option value="" disabled hidden>Select...</option>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.assignee && <span className="text-xs text-red-500">{errors.assignee.message}</span>}
                </div>
              )}
            />

            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => {
                const formStatus = watch("status");
                const isOverdue = isEditMode && field.value && new Date(field.value) < new Date() && board.columns.find(c => c.id === formStatus)?.title.toLowerCase() !== "done";
                
                return (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <Input type="date" {...field} className={isOverdue ? "text-red-500 font-medium" : ""} />
                    {errors.dueDate && <span className="text-xs text-red-500 block">{errors.dueDate.message}</span>}
                    {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue!</span>}
                  </div>
                );
              }}
            />
          </div>

          <Controller
            name="labels"
            control={control}
            render={({ field }) => (
              <Input label="Labels (comma-separated)" placeholder="frontend, design, bug" {...field} />
            )}
          />

            <div className="flex justify-between items-center pt-4 border-t border-hairline mt-6">
            {isEditMode ? (
              <Button type="button" variant="danger" onClick={handleDeleteCard}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting} disabled={isEditMode && !isDirty}>
                {isEditMode ? "Save Changes" : "Create Card"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={executeDeleteCard}
        title="Delete Card"
        description={`Are you sure you want to delete "${cardToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-accent" /></div>}>
      <BoardContent />
    </Suspense>
  );
}
