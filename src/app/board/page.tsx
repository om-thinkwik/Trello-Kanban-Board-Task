"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

import { Board, Card as CardType, Column } from "@/types";
import { BoardColumn } from "@/components/kanban/BoardColumn";
import { BoardCard } from "@/components/kanban/BoardCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

function BoardContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  // Create Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string>("");
  const [createFormData, setCreateFormData] = useState({ title: "", description: "" });

  // Edit Form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "", labels: "" });

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
    } catch (err) {
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

  // --- Create Card Handlers ---
  const openCreateModal = (columnId: string) => {
    setActiveColumnId(columnId);
    setCreateFormData({ title: "", description: "" });
    setIsCreateModalOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) {
      toast({ title: "Error", description: "Title is required", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          columnId: activeColumnId,
          title: createFormData.title,
          description: createFormData.description,
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
      
      setIsCreateModalOpen(false);
      toast({ title: "Success", description: "Card created" });
    } catch (error) {
      toast({ title: "Error", description: "Could not create card", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit/Delete Card Handlers ---
  const openEditModal = (card: CardType) => {
    setEditingCard(card);
    setEditFormData({
      title: card.title,
      description: card.description || "",
      labels: card.labels ? card.labels.join(", ") : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editFormData.title.trim()) return;

    const updatedLabels = editFormData.labels
      .split(",")
      .map(l => l.trim())
      .filter(l => l !== "");

    // Optimistic Update
    const previousBoard = board ? { ...board } : null;
    
    setBoard((prev) => {
      if (!prev) return prev;
      const newCards = [...prev.cards];
      const index = newCards.findIndex(c => c.id === editingCard.id);
      if (index !== -1) {
        newCards[index] = { 
          ...newCards[index], 
          title: editFormData.title,
          description: editFormData.description,
          labels: updatedLabels,
        };
      }
      return { ...prev, cards: newCards };
    });

    setIsEditModalOpen(false);

    try {
      const res = await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          cardId: editingCard.id,
          title: editFormData.title,
          description: editFormData.description,
          labels: updatedLabels,
        }),
      });

      if (!res.ok) throw new Error("Failed to update card");
      toast({ title: "Success", description: "Card updated" });
    } catch (error) {
      if (previousBoard) setBoard(previousBoard);
      toast({ title: "Error", description: "Could not update card", type: "error" });
    }
  };

  const handleDeleteCard = async () => {
    if (!editingCard) return;
    if (!confirm("Are you sure you want to delete this card?")) return;

    // Optimistic Delete
    const previousBoard = board ? { ...board } : null;
    setBoard((prev) => {
      if (!prev) return prev;
      return { ...prev, cards: prev.cards.filter(c => c.id !== editingCard.id) };
    });
    
    setIsEditModalOpen(false);

    try {
      const res = await fetch(`/api/cards?projectId=${projectId}&cardId=${editingCard.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete card");
      toast({ title: "Deleted", description: "Card removed" });
    } catch (error) {
      if (previousBoard) setBoard(previousBoard);
      toast({ title: "Error", description: "Could not delete card", type: "error" });
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
      } catch (err) {
        toast({ title: "Sync Error", description: "Could not save card position.", type: "error" });
        fetchBoard();
      }
    }
  };

  if (!projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-medium text-gray-900">No project selected</h2>
        <Link href="/">
          <Button>Go back to Projects</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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

  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kanban Board</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop tasks between columns, or click a card to edit it.</p>
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
                cards={board.cards.filter((c) => c.columnId === column.id)}
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

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Card">
        <form onSubmit={handleCreateCard} className="space-y-4">
          <Input
            label="Card Title"
            placeholder="What needs to be done?"
            value={createFormData.title}
            onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Add more details..."
            value={createFormData.description}
            onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Add Card</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Card">
        <form onSubmit={handleUpdateCard} className="space-y-4">
          <Input
            label="Card Title"
            value={editFormData.title}
            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />
          <Input
            label="Labels (comma-separated)"
            placeholder="frontend, design, bug"
            value={editFormData.labels}
            onChange={(e) => setEditFormData({ ...editFormData, labels: e.target.value })}
          />
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <Button type="button" variant="danger" onClick={handleDeleteCard}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <BoardContent />
    </Suspense>
  );
}
