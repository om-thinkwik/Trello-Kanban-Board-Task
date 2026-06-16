export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">View project statistics and charts.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Placeholder for charts */}
        <div className="h-80 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
          <p className="text-sm text-gray-500">Charts will go here</p>
        </div>
      </div>
    </div>
  );
}
