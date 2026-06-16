"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GripVertical } from "lucide-react";
import { Card as CardType } from "@/types";

interface BoardCardProps {
  card: CardType;
  isOverlay?: boolean;
  onClick?: (card: CardType) => void;
}

export function BoardCard({ card, isOverlay, onClick }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 h-24 w-full"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(card)}
      className={`group relative hover:border-blue-300 transition-colors cursor-grab active:cursor-grabbing ${
        isOverlay ? "rotate-2 shadow-xl border-blue-400" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm text-gray-900 leading-tight">{card.title}</h4>
          <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-gray-600">
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {card.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{card.description}</p>
        )}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {card.labels.map((label) => (
              <Badge key={label} variant="info" className="text-[10px] px-1.5 py-0 h-4">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
