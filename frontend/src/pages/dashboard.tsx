import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { taskService, type Task } from "@/services/taskService";
import { authService } from "@/services/authService";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Clock,
  Search,
  LogOut,
  ListTodo,
  X,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "react-hot-toast";

type FilterMode = "all" | "pending" | "completed";

interface LoggedUser {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Delete dialog state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const limit = 10;

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load user details
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user details:", e);
      }
    }
  }, []);

  const fetchTasks = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");
      const response = await taskService.getAllTasks(page, limit);
      setTasks(response.tasks);
      setTotalPages(response.totalPages);
      setTotalTasks(response.totalTasks);
      setPendingCount(response.pendingCount || 0);
      setCompletedCount(response.completedCount || 0);
      setCurrentPage(response.currentPage);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg =
        axiosError.response?.data?.message || "Failed to fetch tasks.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const handleLogout = () => {
    authService.logout();
    toast.success("Successfully logged out.");
    navigate("/login");
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setFormData({ title: "", description: "" });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({ title: "", description: "" });
    setFormError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask._id, formData);
        setTasks((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
        toast.success("Task updated successfully!");
      } else {
        await taskService.createTask(formData);
        toast.success("Task created successfully!");
        fetchTasks(1);
      }
      closeForm();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg =
        axiosError.response?.data?.message || "Something went wrong.";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    setActionLoadingId(task._id);
    try {
      const newStatus = task.status === "pending" ? "completed" : "pending";
      const updated = await taskService.toggleStatus(task._id, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      if (newStatus === "completed") {
        setPendingCount((prev) => Math.max(0, prev - 1));
        setCompletedCount((prev) => prev + 1);
      } else {
        setPendingCount((prev) => prev + 1);
        setCompletedCount((prev) => Math.max(0, prev - 1));
      }
      toast.success(
        `Task marked as ${newStatus === "completed" ? "completed ✅" : "pending ⏳"}`
      );
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg =
        axiosError.response?.data?.message || "Failed to update task status.";
      toast.error(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted successfully!");
      const isLastItemOnPage = tasks.length === 1;
      const targetPage = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
      fetchTasks(targetPage);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg =
        axiosError.response?.data?.message || "Failed to delete task.";
      toast.error(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered & searched tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filterMode === "all" || task.status === filterMode;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });



  const getUserInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 transition-colors duration-300">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">TaskFlow</h1>
          </div>

          {/* User profile & controls */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 text-muted-foreground hover:text-foreground"
              title={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </Button>

            {/* Profile Avatar Greeting */}
            {user && (
              <div className="flex items-center gap-2 border-l border-border/60 pl-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-xs shadow-sm">
                  {getUserInitials(user.name)}
                </div>
                <span className="text-sm font-medium text-muted-foreground max-w-[120px] truncate hidden md:inline-block">
                  {user.name}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground h-9"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 transition-colors duration-300">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Tasks
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 transition-colors duration-300">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Pending
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 transition-colors duration-300">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search-tasks"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50 transition-colors duration-300"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1 bg-muted/30 transition-colors duration-300">
            {(["all", "pending", "completed"] as FilterMode[]).map((mode) => (
              <Button
                key={mode}
                variant={filterMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterMode(mode)}
                className={`text-xs capitalize transition-all duration-200 h-8 gap-1.5 ${
                  filterMode === mode
                    ? "bg-foreground text-background shadow-sm hover:bg-foreground/95"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "all" && <ListTodo className="w-3.5 h-3.5" />}
                {mode === "pending" && <Clock className="w-3.5 h-3.5" />}
                {mode === "completed" && <Check className="w-3.5 h-3.5" />}
                {mode}
              </Button>
            ))}
          </div>

          {/* Add Task Button */}
          <Button onClick={openCreateForm} className="h-10 gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Global error backup banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create / Edit Task Form (Slide-down panel) */}
        {showForm && (
          <Card className="mb-6 shadow-lg shadow-black/5 border-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </CardTitle>
                  <CardDescription>
                    {editingTask
                      ? "Update the task details below"
                      : "Fill in the details to add a new task"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={formLoading}
                    className="h-10 bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Input
                    id="task-description"
                    placeholder="Enter task description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    disabled={formLoading}
                    className="h-10 bg-background/50"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="submit" disabled={formLoading} className="h-9">
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editingTask ? "Updating…" : "Creating…"}
                      </>
                    ) : editingTask ? (
                      <>
                        <Check className="w-4 h-4" />
                        Update Task
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Task List (With Skeleton Loading integration) */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((n) => (
              <Card
                key={n}
                className="border-border/50 bg-card/40 animate-pulse transition-colors duration-300"
              >
                <CardContent className="flex items-start gap-4 py-4">
                  {/* Circle checkbox skeleton */}
                  <div className="w-6 h-6 rounded-full bg-muted mt-0.5" />
                  {/* Title & Description skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="flex items-center gap-3 pt-1">
                      <div className="h-5 bg-muted rounded-full w-16" />
                      <div className="h-4 bg-muted rounded w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/60 mb-4 transition-colors duration-300">
              <ListTodo className="w-8 h-8" />
            </div>
            <p className="font-medium text-foreground mb-1">
              {totalTasks === 0 ? "No tasks yet" : "No matching tasks"}
            </p>
            <p className="text-sm">
              {totalTasks === 0
                ? 'Click "Add Task" to create your first task.'
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isActionLoading = actionLoadingId === task._id;

              return (
                <Card
                  key={task._id}
                  className={`group transition-all duration-200 hover:shadow-md hover:shadow-black/5 border-border/50 ${
                    isCompleted ? "opacity-70" : ""
                  }`}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleStatus(task)}
                      disabled={isActionLoading}
                      className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                        isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/30 hover:border-primary/60"
                      }`}
                      title={
                        isCompleted
                          ? "Mark as pending"
                          : "Mark as completed"
                      }
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isCompleted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium leading-snug transition-all ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {task.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60">
                          {new Date(task.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(task)}
                        disabled={isActionLoading}
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        title="Edit task"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTaskToDelete(task)}
                        disabled={isActionLoading}
                        className="w-8 h-8 text-destructive hover:bg-destructive/10"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1.5 flex-wrap animate-in fade-in duration-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTasks(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 gap-1.5"
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => fetchTasks(pageNum)}
                className={`w-9 h-9 p-0 ${
                  currentPage === pageNum
                    ? "bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTasks(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 gap-1.5"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal Overlay */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphism Backdrop */}
          <div
            className="absolute inset-0 bg-background/85 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              if (actionLoadingId === null) setTaskToDelete(null);
            }}
          />
          {/* Modal Container */}
          <Card className="relative w-full max-w-md bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-10 transition-colors duration-300">
            <CardHeader className="flex flex-row items-start gap-4 pb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive mt-0.5 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">Delete Task</CardTitle>
                <CardDescription className="mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground break-words">
                    &ldquo;{taskToDelete.title}&rdquo;
                  </span>
                  ? This action is permanent and cannot be undone.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setTaskToDelete(null)}
                disabled={actionLoadingId !== null}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await handleDelete(taskToDelete._id);
                  setTaskToDelete(null);
                }}
                disabled={actionLoadingId !== null}
                className="h-9 gap-1.5"
              >
                {actionLoadingId === taskToDelete._id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Task
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
