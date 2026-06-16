"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderGit2, Trash2, ArrowRight } from "lucide-react";
import { Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

export default function ProjectsPage() {
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      setProjects(json.data);
    } catch (err) {
      setError("Failed to load projects. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({ title: "Error", description: "All fields are required.", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create project");
      
      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject.data]);
      setIsModalOpen(false);
      setFormData({ name: "", description: "" });
      toast({ title: "Success", description: "Project created successfully!", type: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Could not create project.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation since card is wrapped in a link
    
    if (!confirm("Are you sure you want to delete this project?")) return;

    // Optimistic UI update
    const previousProjects = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Project has been removed." });
    } catch (err) {
      // Revert on error
      setProjects(previousProjects);
      toast({ title: "Error", description: "Could not delete project.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your active projects and boards.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
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
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-100 rounded-t-xl" />
              <CardContent className="h-20 bg-gray-50 rounded-b-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* DATA STATE */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/board?projectId=${project.id}`} className="group block focus:outline-none">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="text-gray-400 hover:text-red-500 p-1 -mr-1 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Badge 
                    variant={project.status === "active" ? "success" : "warning"} 
                    className="mt-2 w-fit"
                  >
                    {project.status === "active" ? "Active" : "On Hold"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                    Open Board <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
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
          <Button onClick={() => setIsModalOpen(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g., Marketing Website"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="What is this project about?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
