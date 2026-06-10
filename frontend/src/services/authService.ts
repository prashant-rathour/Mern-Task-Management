import axiosInstance from "@/utils/axiosInstance";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export const authService = {
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post<AuthResponse>("/auth/register", data);
    return res.data;
  },

  registerUser: async (data: RegisterPayload): Promise<AuthResponse> => {
    return authService.register(data);
  },

  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post<AuthResponse>("/auth/login", data);
    return res.data;
  },

  loginUser: async (data: LoginPayload): Promise<AuthResponse> => {
    return authService.login(data);
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
