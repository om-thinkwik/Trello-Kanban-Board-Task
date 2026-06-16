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
import { Loader2 } from "lucide-react";
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

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string>("");
  const [formData, setFormData] = useState({ title: "", description: "" });

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

  // Form Handlers
  const openCreateModal = (columnId: string) => {
    setActiveColumnId(columnId);
    setFormData({ title: "", description: "" });
    setIsModalOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
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
          title: formData.title,
          description: formData.description,
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
    } catch (error) {
      toast({ title: "Error", description: "Could not create card", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag Handlers
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

    // Moving a card over another card
    if (isActiveCard && isOverCard) {
      setBoard((board) => {
        if (!board) return board;
        
        const activeIndex = board.cards.findIndex((c) => c.id === activeId);
        const overIndex = board.cards.findIndex((c) => c.id === overId);
        
        const newCards = [...board.cards];
        const activeCard = newCards[activeIndex];
        const overCard = newCards[overIndex];

        // If they are in different columns, move to the new column
        if (activeCard.columnId !== overCard.columnId) {
          activeCard.columnId = overCard.columnId;
          // Reorder logic will be handled below during arrayMove
        }
        
        return {
          ...board,
          cards: arrayMove(newCards, activeIndex, overIndex).map((card, index) => {
            // Re-assign orders based on new positions for the affected columns
            // Simple approach: re-assign all orders based on array order
            return { ...card, order: index };
          }),
        };
      });
    }

    // Moving a card into an empty column
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

    // Find the updated card in our state
    if (!board || !activeData) return;
    
    const updatedCard = board.cards.find(c => c.id === activeId);
    if (!updatedCard) return;

    // If it actually moved or changed order, sync with backend
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
        // Revert could be implemented here by re-fetching the board
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
        <p className="text-sm text-gray-500 mt-1">Drag and drop tasks between columns.</p>
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
              />
            ))}
            <DragOverlay>
              {activeCard ? <BoardCard card={activeCard} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Card">
        <form onSubmit={handleCreateCard} className="space-y-4">
          <Input
            label="Card Title"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Add more details..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Add Card</Button>
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
