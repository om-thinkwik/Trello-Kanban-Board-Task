export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your active projects and boards.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for project cards */}
        <div className="h-40 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
          <p className="text-sm text-gray-500">Project list will go here</p>
        </div>
      </div>
    </div>
  );
}
