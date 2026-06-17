"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, FolderGit2, Trash2, ArrowRight, Edit2, User } from "lucide-react";
import { Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
];

const TEAM_MEMBERS = [
  "Alex Morgan", "Sam Chen", "Jordan Lee", "Riley Park", "Casey Kim"
];

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  color: z.string(),
  lead: z.string().min(1, "Please select a project lead"),
  status: z.enum(["active", "completed", "on-hold"])
});
type ProjectFormValues = z.infer<typeof projectSchema>;

function ProjectsPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("search")?.toLowerCase() || "";

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      color: PRESET_COLORS[0],
      lead: "",
      status: "active"
    }
  });

  const watchColor = watch("color");
  const watchStatus = watch("status");

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      setProjects(json.data);
    } catch {
      setError("Failed to load projects. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    reset({ name: "", description: "", color: PRESET_COLORS[0], lead: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    setIsEditMode(true);
    setEditingId(project.id);
    reset({ 
      name: project.name, 
      description: project.description || "",
      color: project.color || PRESET_COLORS[0],
      lead: project.lead || TEAM_MEMBERS[0],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (project.status as any) || "active",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && editingId) {
        const previousProjects = [...projects];
        
        // Optimistic UI update
        setProjects((prev) => prev.map((p) => p.id === editingId ? { ...p, ...data } : p));
        setIsModalOpen(false);

        const res = await fetch(`/api/projects/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          setProjects(previousProjects);
          throw new Error("Failed to update project");
        }
        
        toast({ title: "Success", description: "Project updated successfully!", type: "success" });
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to create project");
        
        const newProject = await res.json();
        setProjects((prev) => [...prev, newProject.data]);
        setIsModalOpen(false);
        toast({ title: "Success", description: "Project created successfully!", type: "success" });
      }
    } catch {
      toast({ title: "Error", description: isEditMode ? "Could not update project." : "Could not create project.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string, projectName: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    setProjectToDelete({ id, name: projectName });
  };

  const executeDeleteProject = async () => {
    if (!projectToDelete) return;
    const { id } = projectToDelete;

    // Optimistic UI update
    const previousProjects = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Project has been removed." });
    } catch {
      setProjects(previousProjects);
      toast({ title: "Error", description: "Could not delete project.", type: "error" });
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your active projects and boards.</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto bg-primary-accent hover:bg-primary-accent/90">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
              <div className="mt-4">
                <Button variant="danger" size="sm" onClick={fetchProjects}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && !error && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full flex flex-col overflow-hidden border border-gray-100 shadow-sm">
              <Skeleton className="h-2 w-full rounded-none" />
              <CardHeader className="pb-4 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-4/5 mt-2" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center -space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full border-2 border-white" />
                  <Skeleton className="h-8 w-8 rounded-full border-2 border-white" />
                  <Skeleton className="h-8 w-8 rounded-full border-2 border-white" />
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t border-gray-50 bg-gray-50/50 flex flex-col items-start gap-2">
                <div className="flex w-full justify-between items-center mt-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DATA STATE */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.name.toLowerCase().includes(searchQuery) || (p.description && p.description.toLowerCase().includes(searchQuery)))
            .map((project) => (
            <div 
              key={project.id} 
              onClick={() => router.push(`/board?projectId=${project.id}`)} 
              className="group block focus:outline-none cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/board?projectId=${project.id}`);
                }
              }}
            >
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary-accent overflow-hidden flex flex-col">
                <div className="h-2 w-full" style={{ backgroundColor: project.color || PRESET_COLORS[0] }} />
                <CardHeader className="pb-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-5 w-5 text-gray-400" />
                      <CardTitle className="text-lg group-hover:text-primary-accent transition-colors font-heading">
                        {project.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(project, e);
                        }}
                        className="text-gray-400 hover:text-primary-accent p-1 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(project.id, project.name, e);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge 
                      variant={project.status === "completed" ? "default" : project.status === "active" ? "success" : "warning"} 
                      className="w-fit"
                    >
                      {project.status === "completed" ? "Completed" : project.status === "active" ? "Active" : "On Hold"}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      {project.lead || "Unassigned"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-accent">
                    Open Board <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 px-4 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Get started by creating a new project. Each project comes with its own Kanban board.
          </p>
          <Button onClick={openCreateModal} className="mt-6">
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Project" : "Create New Project"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <Input 
              {...register("name")}
              placeholder="e.g. Mobile App Redesign" 
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea 
              {...register("description")}
              placeholder="What is this project about?"
              className="resize-none h-24"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ease-in-out ${
                    watchColor === color ? "border-gray-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project Lead</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent disabled:cursor-not-allowed disabled:bg-gray-100"
              {...register("lead")}
            >
              <option value="" disabled hidden>Select a project lead...</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
            {errors.lead && <p className="text-red-500 text-xs mt-1">{errors.lead.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project Status</label>
            <div className="flex bg-gray-100 p-1 rounded-lg w-full">
              {(["active", "on-hold", "completed"] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setValue("status", status)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    watchStatus === status 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {status.replace("-", " ")}
                </button>
              ))}
            </div>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{isEditMode ? "Save Changes" : "Create Project"}</Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={executeDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? All cards associated with this project will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent" />
      </div>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
}
