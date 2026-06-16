export default function BoardPage() {
  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kanban Board</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop tasks between columns.</p>
      </div>
      <div className="flex-1 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Interactive board will go here</p>
      </div>
    </div>
  );
}
