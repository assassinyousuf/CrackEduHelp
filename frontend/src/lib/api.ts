const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'specialist' | 'ambassador' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface OrderFile {
  id: string;
  order_id: string;
  uploaded_by: string;
  file_name: string;
  file_key: string;
  file_size: number;
  file_type: string;
  file_category: 'source' | 'draft' | 'final' | 'revision';
  is_clean: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  student_id: string;
  amount: number;
  payment_type: 'deposit' | 'final';
  payment_method: 'bank_transfer' | 'wise' | 'paypal';
  status: 'pending' | 'approved' | 'rejected';
  proof_file_key: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message_text: string;
  attachment_key?: string;
  created_at: string;
  sender: User;
}

export interface Order {
  id: string;
  student_id: string;
  specialist_id?: string;
  title: string;
  university: string;
  course_name: string;
  service_type: string;
  task_description: string;
  word_count?: number;
  slide_count?: number;
  deadline: string;
  priority_level: 'standard' | 'urgent' | 'express';
  status: string;
  quote_amount?: number;
  deposit_amount?: number;
  final_amount?: number;
  admin_override_quote: boolean;
  created_at: string;
  updated_at: string;
  files: OrderFile[];
  payments: Payment[];
  student?: User;
  specialist?: User;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  published: boolean;
  created_at: string;
}

export interface AmbassadorStats {
  clicks: number;
  registrations: number;
  converted_orders: number;
  total_earnings: number;
  current_balance: number;
  referrals: any[];
}

export interface AdminStats {
  total_orders: number;
  pending_orders: number;
  active_specialists: number;
  total_revenue: number;
  referral_payout_liability: number;
  active_users: number;
}

// Request helpers
function getHeaders(token?: string, isMultipart = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("eduhelp_token") : "");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("eduhelp_token", data.access_token);
      localStorage.setItem("eduhelp_user", JSON.stringify(data.user));
    }
    return data;
  },

  async register(payload: any, profilePicture?: File) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });
    if (profilePicture) {
      formData.append("profile_picture", profilePicture);
    }

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(undefined, true), // true sets isMultipart so Content-Type is omitted
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eduhelp_token");
      localStorage.removeItem("eduhelp_user");
    }
  },

  getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("eduhelp_user");
      return u ? JSON.parse(u) : null;
    }
    return null;
  },

  async fetchMe(): Promise<User> {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load orders");
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load order detail");
    return res.json();
  },

  async createOrder(payload: any): Promise<Order> {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Creation failed" }));
      throw new Error(err.detail || "Failed to submit order");
    }
    return res.json();
  },

  async updateOrder(id: string, payload: any): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update order");
    return res.json();
  },

  async estimateQuote(payload: any) {
    const res = await fetch(`${API_URL}/orders/estimate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Estimation error" }));
      throw new Error(err.detail || "Failed to fetch estimate");
    }
    return res.json();
  },

  async uploadOrderFile(orderId: string, category: string, file: File): Promise<OrderFile> {
    const formData = new FormData();
    formData.append("file_category", category);
    formData.append("file", file);

    const res = await fetch(`${API_URL}/orders/${orderId}/files`, {
      method: "POST",
      headers: getHeaders(undefined, true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Failed to upload file");
    }
    return res.json();
  },

  getDownloadUrl(fileId: string): string {
    const activeToken = typeof window !== "undefined" ? localStorage.getItem("eduhelp_token") : "";
    return `${API_URL}/orders/files/${fileId}/download?token=${activeToken}`;
  },

  // Payments
  async submitPaymentProof(orderId: string, amount: number, type: string, method: string, file: File): Promise<Payment> {
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("amount", amount.toString());
    formData.append("payment_type", type);
    formData.append("payment_method", method);
    formData.append("proof", file);

    const res = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: getHeaders(undefined, true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Failed to submit receipt proof");
    }
    return res.json();
  },

  async getPayments(): Promise<Payment[]> {
    const res = await fetch(`${API_URL}/payments`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load payments");
    return res.json();
  },

  async verifyPayment(paymentId: string, status: 'approved' | 'rejected'): Promise<Payment> {
    const res = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to verify payment");
    return res.json();
  },

  // Chat
  async getMessages(orderId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_URL}/chat/${orderId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch chat logs");
    return res.json();
  },

  async sendMessage(orderId: string, text: string, attachmentKey?: string): Promise<ChatMessage> {
    const res = await fetch(`${API_URL}/chat/${orderId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message_text: text, attachment_key: attachmentKey }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  // Referrals
  async getAmbassadorProfile(): Promise<any> {
    const res = await fetch(`${API_URL}/referrals/profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch referral settings");
    return res.json();
  },

  async getAmbassadorStats(): Promise<AmbassadorStats> {
    const res = await fetch(`${API_URL}/referrals/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch referral metrics");
    return res.json();
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load administrative overview metrics");
    return res.json();
  },

  async overrideQuote(orderId: string, quoteAmount: number): Promise<Order> {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/override`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ quote_amount: quoteAmount }),
    });
    if (!res.ok) throw new Error("Failed to override order quote amount");
    return res.json();
  },

  async assignSpecialist(orderId: string, specialistId: string): Promise<Order> {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/assign/${specialistId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to assign specialist to order");
    return res.json();
  },

  async getSpecialists(): Promise<User[]> {
    const res = await fetch(`${API_URL}/admin/specialists`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load specialists directory");
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load user directories");
    return res.json();
  },

  // Blog & Marketing
  async getPosts(): Promise<BlogPost[]> {
    const res = await fetch(`${API_URL}/blog`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load study guides");
    return res.json();
  },

  async getPost(slug: string): Promise<BlogPost> {
    const res = await fetch(`${API_URL}/blog/${slug}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load study guide article details");
    return res.json();
  },

  async submitLead(payload: any) {
    const res = await fetch(`${API_URL}/blog/lead`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to submit inquiry");
    return res.json();
  }
};
