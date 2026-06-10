import axiosInstance from "@/utils/axiosInstance";

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: "pending" | "completed";
}

export interface PaginatedTasksResponse {
  tasks: Task[];
  totalTasks: number;
  totalPages: number;
  currentPage: number;
  pendingCount: number;
  completedCount: number;
}

export const taskService = {
  getAllTasks: async (page: number = 1, limit: number = 10): Promise<PaginatedTasksResponse> => {
    const res = await axiosInstance.get<PaginatedTasksResponse>("/tasks", {
      params: { page, limit },
    });
    return res.data;
  },

  createTask: async (data: CreateTaskPayload): Promise<Task> => {
    const res = await axiosInstance.post<Task>("/tasks", data);
    return res.data;
  },

  updateTask: async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const res = await axiosInstance.put<Task>(`/tasks/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string, status: "pending" | "completed"): Promise<Task> => {
    const res = await axiosInstance.patch<Task>(`/tasks/${id}`, { status });
    return res.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/tasks/${id}`);
  },
};
