"use client";

import { useSortable } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Calendar } from "lucide-react";
import { Card as CardType } from "@/types";

interface BoardCardProps {
  card: CardType;
  isOverlay?: boolean;
  onClick?: (card: CardType) => void;
  isDoneColumn?: boolean; // We pass this to determine if the card is done for the overdue logic
}

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
};

const PRIORITY_STYLES = {
  Low: { bg: "bg-slate-500", text: "text-slate-500" },
  Medium: { bg: "bg-blue-500", text: "text-blue-500" },
  High: { bg: "bg-amber-500", text: "text-amber-500" },
  Urgent: { bg: "bg-red-500", text: "text-red-500" }
};

export function BoardCard({ card, isOverlay, onClick, isDoneColumn }: BoardCardProps) {
  const sortableData = useMemo(() => ({
    type: "Card",
    card,
  }), [card]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: isOverlay ? `${card.id}-overlay` : card.id,
    data: sortableData,
    disabled: isOverlay, // Prevent DragOverlay from registering a duplicate ID
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-dashed border-primary-accent rounded-xl bg-primary-accent/10 min-h-[100px] w-full"
      />
    );
  }

  const isOverdue = card.dueDate 
    ? new Date(card.dueDate) < new Date() && !isDoneColumn 
    : false;

  const cardContent = (
    <Card
      onClick={() => !isOverlay && onClick?.(card)}
      className={`group relative hover:border-primary-accent/50 transition-colors border-transparent shadow-sm rounded-xl ${
        isDoneColumn ? "bg-gray-50/80" : "bg-white"
      } ${
        isOverlay ? "rotate-2 shadow-xl border-primary-accent cursor-grabbing" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <CardHeader className="p-3 pb-2 space-y-2">
        {/* LABELS */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.slice(0, 3).map((label) => (
              <span key={label} className="bg-indigo-50 text-indigo-600 text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[80px]">
                {label}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span className="bg-gray-50 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h4 className={`font-bold text-sm leading-snug ${isDoneColumn ? "text-gray-500 line-through decoration-gray-300" : "text-gray-900"}`}>{card.title}</h4>
          {card.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 mt-2">
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4">
            {/* PRIORITY BADGE */}
            {card.priority && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${PRIORITY_STYLES[card.priority]?.text || 'text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[card.priority]?.bg || 'bg-gray-500'}`} />
                {card.priority}
              </div>
            )}

            {/* DUE DATE */}
            {card.dueDate && (
              <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                <Calendar className="w-3.5 h-3.5" />
                {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          {/* ASSIGNEE AVATAR */}
          {card.assignee && (
            <div 
              className="w-6 h-6 rounded-full bg-primary-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
              title={card.assignee}
            >
              {getInitials(card.assignee)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isOverlay) {
    return cardContent;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {cardContent}
    </div>
  );
}
