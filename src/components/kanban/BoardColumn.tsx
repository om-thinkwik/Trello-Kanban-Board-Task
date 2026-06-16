"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Column, Card as CardType } from "@/types";
import { BoardCard } from "./BoardCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BoardColumnProps {
  column: Column;
  cards: CardType[];
  onAddCard: (columnId: string) => void;
  onCardClick: (card: CardType) => void;
}

export function BoardColumn({ column, cards, onAddCard, onCardClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  // Sort cards by order
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-gray-100/50 border border-gray-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-gray-700">{column.title}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            {cards.length}
          </span>
        </div>
        <button 
          onClick={() => onAddCard(column.id)}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 pt-0 transition-colors ${
          isOver ? "bg-gray-200/50" : ""
        }`}
      >
        <SortableContext items={sortedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[100px]">
            {sortedCards.map((card) => (
              <BoardCard key={card.id} card={card} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
        
        {/* Helper text for empty columns */}
        {cards.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <span className="text-xs text-gray-400">Drop cards here</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full text-gray-500 justify-start hover:text-gray-700 hover:bg-gray-200"
          onClick={() => onAddCard(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add a card
        </Button>
      </div>
    </div>
  );
}
