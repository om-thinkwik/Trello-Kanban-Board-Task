"use client";
import { useMemo } from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Column, Card as CardType } from "@/types";
import { BoardCard } from "./BoardCard";
import { Plus } from "lucide-react";

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

  const { over } = useDndContext();
  const isOverColumn = isOver || (over && cards.some(c => String(c.id) === String(over.id)));

  // Sort cards by order
  const cardsHash = cards.map(c => `${c.id}-${c.order}`).join(',');
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => a.order - b.order);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsHash]);


  const getColumnColor = (title: string) => {
    const t = title.toLowerCase();
    if (t === "to do") return "bg-slate-500";
    if (t === "in progress") return "bg-blue-500";
    if (t === "review") return "bg-amber-500";
    if (t === "done") return "bg-emerald-500";
    return "bg-gray-400";
  };

  const getDragOverColor = (title: string) => {
    const t = title.toLowerCase();
    if (t === "to do") return "bg-slate-100";
    if (t === "in progress") return "bg-blue-50";
    if (t === "review") return "bg-amber-50";
    if (t === "done") return "bg-emerald-50";
    return "bg-gray-100";
  };

  return (
    <div className={`flex h-full w-[340px] shrink-0 flex-col rounded-2xl border border-transparent transition-colors duration-200 ${isOverColumn ? getDragOverColor(column.title) : 'bg-[#F8FAFC]'}`}>
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${getColumnColor(column.title)}`} />
          <h3 className="font-bold text-sm text-gray-900">{column.title}</h3>
          <span className="text-xs font-semibold text-gray-400 ml-1">
            {cards.length}
          </span>
        </div>
        <button 
          onClick={() => onAddCard(column.id)}
          className="text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center p-1"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 pt-0"
      >
        <SortableContext items={sortedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[100px]">
            {sortedCards.map((card) => (
              <BoardCard 
                key={card.id} 
                card={card} 
                onClick={onCardClick} 
                isDoneColumn={column.title.toLowerCase() === "done"} 
              />
            ))}
          </div>
        </SortableContext>
        
        {/* Helper text for empty columns */}
        {cards.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 mt-2">
            <span className="text-xs text-gray-400 font-medium">Drop cards here</span>
          </div>
        )}
      </div>
    </div>
  );
}
