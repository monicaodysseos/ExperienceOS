const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private setTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  private async refreshToken(): Promise<string | null> {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      this.setTokens(data.access, data.refresh || refresh);
      return data.access;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async fetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    const accessToken = token || this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let res = await fetch(`${this.baseUrl}${path}`, {
      ...fetchOptions,
      headers,
    });

    if (res.status === 401 && !token) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${this.baseUrl}${path}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `Request failed (${res.status})` }));
      let message = `Request failed (${res.status})`;

      if (error.detail) {
        message = typeof error.detail === 'string' ? error.detail : error.detail[0];
      } else if (error.non_field_errors) {
        message = Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors;
      } else if (typeof error === 'object' && error !== null) {
        const firstKey = Object.keys(error)[0];
        if (firstKey) {
          if (Array.isArray(error[firstKey])) {
            message = error[firstKey][0];
          } else if (typeof error[firstKey] === 'string') {
            message = error[firstKey];
          } else {
            message = JSON.stringify(error);
          }
        }
      }

      throw new Error(message || JSON.stringify(error));
    }

    if (res.status === 204) return {} as T;
    return res.json();
  }

  // ─── Auth ───────────────────────────────────────────────────

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: 'participant' | 'provider' | 'hr_manager';
    gdpr_accepted: boolean;
  }) {
    const result = await this.fetch<{
      user: User;
      tokens: { access: string; refresh: string };
    }>("/api/v1/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setTokens(result.tokens.access, result.tokens.refresh);
    return result;
  }

  async login(username: string, password: string) {
    const result = await this.fetch<{ access: string; refresh: string }>(
      "/api/v1/auth/login/",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
    this.setTokens(result.access, result.refresh);
    return result;
  }

  async logout() {
    const refresh = localStorage.getItem("refresh_token");
    await this.fetch("/api/v1/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }).catch(() => { });
    this.clearTokens();
  }

  async getMe() {
    return this.fetch<User>("/api/v1/auth/me/");
  }

  async updateProfile(
    data: Partial<
      Pick<User, "first_name" | "last_name" | "phone" | "avatar_url" | "city" | "preferred_language">
    >
  ) {
    return this.fetch<User>("/api/v1/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.fetch<void>("/api/v1/auth/me/", { method: "DELETE" });
  }

  async requestPasswordReset(email: string) {
    return this.fetch<{ detail: string }>("/api/v1/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.fetch<{ detail: string }>("/api/v1/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyEmail(token: string) {
    return this.fetch<{ detail: string }>("/api/v1/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification() {
    return this.fetch<{ detail: string }>("/api/v1/auth/resend-verification/", {
      method: "POST",
    });
  }

  // ─── Organisation ───────────────────────────────────────────

  async getOrg() {
    return this.fetch<Organisation>("/api/v1/org/");
  }

  async createOrg(data: { name: string; domain?: string; billing_email: string; billing_address?: object }) {
    return this.fetch<Organisation>("/api/v1/org/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateOrg(data: Partial<{ name: string; domain: string; billing_email: string; billing_address: object; logo_url: string }>) {
    return this.fetch<Organisation>("/api/v1/org/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getOrgDashboard() {
    return this.fetch<OrgDashboard>("/api/v1/org/dashboard/");
  }

  async getOrgBookings(params?: { status?: string; q?: string; page?: number }) {
    const query = params ? "?" + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString() : "";
    return this.fetch<PaginatedResponse<Booking>>(`/api/v1/org/bookings/${query}`);
  }

  async getOrgTeam() {
    return this.fetch<{ results: OrganisationMember[]; count: number }>("/api/v1/org/team/");
  }

  async inviteTeamMember(email: string) {
    return this.fetch<{ detail: string }>("/api/v1/org/team/invite/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async acceptOrgInvite(token: string) {
    return this.fetch<Organisation>("/api/v1/org/invite/accept/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async getOrgInvoices() {
    return this.fetch<{ results: Invoice[]; count: number }>("/api/v1/org/invoices/");
  }

  getInvoiceDownloadUrl(invoiceNumber: string): string {
    const token = this.getToken();
    return `${this.baseUrl}/api/v1/org/invoices/${invoiceNumber}/download/?token=${token}`;
  }

  async downloadInvoice(invoiceNumber: string): Promise<Blob> {
    const token = this.getToken();
    const res = await fetch(
      `${this.baseUrl}/api/v1/org/invoices/${invoiceNumber}/download/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Failed to download invoice");
    return res.blob();
  }

  async getOrgAnalytics() {
    return this.fetch<OrgAnalytics>("/api/v1/org/analytics/");
  }

  async getProviderPayouts() {
    return this.fetch<{ results: Payout[]; count: number; total_paid: string }>(
      "/api/v1/payments/payouts/"
    );
  }

  // ─── Platform Admin ─────────────────────────────────────────
  async getAdminStats() {
    return this.fetch<AdminStats>("/api/v1/platform-admin/stats/");
  }

  async getAdminVendors(params?: { verified?: string }) {
    const q = params?.verified != null ? `?verified=${params.verified}` : "";
    return this.fetch<{ results: AdminVendor[]; count: number }>(
      `/api/v1/platform-admin/vendors/${q}`
    );
  }

  async approveVendor(id: number) {
    return this.fetch<AdminVendor>(`/api/v1/platform-admin/vendors/${id}/approve/`, {
      method: "POST",
    });
  }

  async rejectVendor(id: number) {
    return this.fetch<AdminVendor>(`/api/v1/platform-admin/vendors/${id}/reject/`, {
      method: "POST",
    });
  }

  async getAdminExperiences(params?: { status?: string; page?: number }) {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    if (params?.page) p.set("page", String(params.page));
    const q = p.toString() ? `?${p.toString()}` : "";
    return this.fetch<{ results: ExperienceListItem[]; count: number }>(
      `/api/v1/platform-admin/experiences/${q}`
    );
  }

  async approveExperience(slug: string) {
    return this.fetch<ExperienceListItem>(
      `/api/v1/platform-admin/experiences/${slug}/approve/`,
      { method: "POST" }
    );
  }

  async rejectExperience(slug: string, reason?: string) {
    return this.fetch<{ detail: string }>(
      `/api/v1/platform-admin/experiences/${slug}/reject/`,
      { method: "POST", body: JSON.stringify({ reason: reason ?? "" }) }
    );
  }

  async getAdminBookings(params?: { status?: string; q?: string; page?: number }) {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    if (params?.q) p.set("q", params.q);
    if (params?.page) p.set("page", String(params.page));
    const qs = p.toString() ? `?${p.toString()}` : "";
    return this.fetch<{ results: Booking[]; count: number }>(
      `/api/v1/platform-admin/bookings/${qs}`
    );
  }

  async getAdminUsers(params?: { role?: string; q?: string; page?: number }) {
    const p = new URLSearchParams();
    if (params?.role) p.set("role", params.role);
    if (params?.q) p.set("q", params.q);
    if (params?.page) p.set("page", String(params.page));
    const qs = p.toString() ? `?${p.toString()}` : "";
    return this.fetch<{ results: AdminUser[]; count: number }>(
      `/api/v1/platform-admin/users/${qs}`
    );
  }

  // ─── Provider Profile ──────────────────────────────────────

  async getProviderPublic(id: number) {
    return this.fetch<ProviderProfile>(`/api/v1/auth/provider/${id}/`);
  }

  async getProviderProfile() {
    return this.fetch<ProviderProfile>("/api/v1/auth/provider/profile/");
  }

  async createProviderProfile(data: {
    display_name: string;
    bio?: string;
    tagline?: string;
    website?: string;
    instagram?: string;
  }) {
    return this.fetch<ProviderProfile>("/api/v1/auth/provider/profile/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProviderProfile(
    data: Partial<{
      display_name: string;
      bio: string;
      tagline: string;
      website: string;
      instagram: string;
    }>
  ) {
    return this.fetch<ProviderProfile>("/api/v1/auth/provider/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ─── Experiences ────────────────────────────────────────────

  async getExperiences(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.fetch<PaginatedResponse<ExperienceListItem>>(
      `/api/v1/experiences/${query}`
    );
  }

  async getExperience(slug: string) {
    return this.fetch<ExperienceDetail>(`/api/v1/experiences/${slug}/`);
  }

  async getMyExperiences() {
    return this.fetch<PaginatedResponse<ExperienceListItem>>(
      "/api/v1/experiences/mine/"
    );
  }

  async createExperience(data: ExperienceCreatePayload) {
    return this.fetch<ExperienceDetail>("/api/v1/experiences/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getExperienceForEdit(slug: string) {
    return this.fetch<ExperienceDetail>(`/api/v1/experiences/${slug}/update/`);
  }

  async updateExperience(slug: string, data: Partial<ExperienceCreatePayload>) {
    return this.fetch<ExperienceDetail>(`/api/v1/experiences/${slug}/update/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async uploadExperienceImage(
    slug: string,
    data: {
      image_url: string;
      cloudinary_public_id?: string;
      is_cover?: boolean;
      display_order?: number;
    }
  ) {
    return this.fetch<ExperienceImage>(`/api/v1/experiences/${slug}/images/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadImageFile(file: File): Promise<{ url: string; public_id: string }> {
    const token = this.getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${this.baseUrl}/api/v1/experiences/upload-image/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  }

  async deleteExperienceImage(slug: string, imageId: number) {
    return this.fetch<void>(
      `/api/v1/experiences/${slug}/images/?image_id=${imageId}`,
      { method: "DELETE" }
    );
  }

  async getExperiencesForMap(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.fetch<PaginatedResponse<ExperienceMapItem>>(
      `/api/v1/experiences/${query}`
    );
  }

  // ─── Categories ─────────────────────────────────────────────

  async getCategories() {
    return this.fetch<Category[]>("/api/v1/categories/");
  }

  // ─── Time Slots ─────────────────────────────────────────────

  async getTimeSlots(slug: string) {
    return this.fetch<PaginatedResponse<TimeSlot>>(
      `/api/v1/bookings/slots/${slug}/`
    );
  }

  async createTimeSlot(
    slug: string,
    data: { start_datetime: string; end_datetime: string; spots_total: number }
  ) {
    return this.fetch<TimeSlot>(`/api/v1/bookings/slots/${slug}/create/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTimeSlot(
    slug: string,
    pk: number,
    data: Partial<{ start_datetime: string; end_datetime: string; spots_total: number }>
  ) {
    return this.fetch<TimeSlot>(`/api/v1/bookings/slots/${slug}/${pk}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTimeSlot(slug: string, pk: number) {
    return this.fetch<void>(`/api/v1/bookings/slots/${slug}/${pk}/delete/`, {
      method: "DELETE",
    });
  }

  // ─── Bookings ───────────────────────────────────────────────

  async createBooking(data: {
    time_slot_id: number;
    num_participants: number;
    special_requests?: string;
  }) {
    return this.fetch<Booking>("/api/v1/bookings/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMyBookings() {
    return this.fetch<PaginatedResponse<Booking>>("/api/v1/bookings/");
  }

  async getBookingDetail(reference: string) {
    return this.fetch<Booking>(`/api/v1/bookings/${reference}/`);
  }

  async cancelBooking(reference: string, reason?: string) {
    return this.fetch<{
      status: string;
      refund_percentage: number;
      booking_reference: string;
    }>(`/api/v1/bookings/${reference}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getProviderBookings() {
    return this.fetch<PaginatedResponse<Booking>>(
      "/api/v1/bookings/provider/list/"
    );
  }

  // ─── Payments ───────────────────────────────────────────────

  async createCheckoutSession(bookingReference: string) {
    return this.fetch<{ checkout_url: string }>(
      "/api/v1/payments/create-checkout-session/",
      {
        method: "POST",
        body: JSON.stringify({ booking_reference: bookingReference }),
      }
    );
  }

  async directConfirmBooking(bookingReference: string) {
    return this.fetch<{ status: string; booking_reference: string }>(
      "/api/v1/payments/direct-confirm/",
      {
        method: "POST",
        body: JSON.stringify({ booking_reference: bookingReference }),
      }
    );
  }

  async getPaymentStatus(reference: string) {
    return this.fetch<{ status: string; amount: string; currency: string }>(
      `/api/v1/payments/${reference}/status/`
    );
  }

  async startStripeOnboarding() {
    return this.fetch<{ onboarding_url: string }>(
      "/api/v1/payments/stripe/onboarding/",
      { method: "POST" }
    );
  }

  async getStripeStatus() {
    return this.fetch<{
      connected: boolean;
      charges_enabled: boolean;
      onboarding_complete: boolean;
    }>("/api/v1/payments/stripe/status/");
  }

  async mockStripeConnect() {
    return this.fetch<{
      connected: boolean;
      charges_enabled: boolean;
      onboarding_complete: boolean;
    }>("/api/v1/payments/stripe/mock-connect/", { method: "POST" });
  }

  // ─── Reviews ────────────────────────────────────────────────

  async getExperienceReviews(slug: string) {
    return this.fetch<PaginatedResponse<Review>>(
      `/api/v1/reviews/experience/${slug}/`
    );
  }

  async createReview(data: {
    booking_reference: string;
    rating: number;
    comment: string;
  }) {
    return this.fetch<Review>("/api/v1/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async respondToReview(pk: number, response: string) {
    return this.fetch<Review>(`/api/v1/reviews/${pk}/respond/`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  // ─── Messages ───────────────────────────────────────────────

  async getConversations() {
    return this.fetch<PaginatedResponse<Conversation>>(
      "/api/v1/messages/conversations/"
    );
  }

  async createConversation(data: {
    other_user_id: number;
    experience_id?: number;
    message: string;
  }) {
    return this.fetch<Conversation>(
      "/api/v1/messages/conversations/create/",
      { method: "POST", body: JSON.stringify(data) }
    );
  }

  async getMessages(conversationId: number) {
    return this.fetch<PaginatedResponse<Message>>(
      `/api/v1/messages/conversations/${conversationId}/`
    );
  }

  async sendMessage(conversationId: number, content: string) {
    return this.fetch<Message>(
      `/api/v1/messages/conversations/${conversationId}/send/`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  }

  async markConversationRead(conversationId: number) {
    return this.fetch<void>(
      `/api/v1/messages/conversations/${conversationId}/read/`,
      { method: "POST" }
    );
  }

  async getUnreadCount() {
    return this.fetch<{ unread_count: number }>(
      "/api/v1/messages/unread-count/"
    );
  }

  // ─── Notifications ───────────────────────────────────────
  async getNotifications() {
    return this.fetch<{ unread_count: number; results: AppNotification[] }>(
      "/api/v1/notifications/"
    );
  }

  async markNotificationRead(id: number) {
    return this.fetch<void>(`/api/v1/notifications/${id}/read/`, { method: "POST" });
  }

  async markAllNotificationsRead() {
    return this.fetch<void>("/api/v1/notifications/read-all/", { method: "POST" });
  }
}

// ─── Types ──────────────────────────────────────────────────

export type UserRole =
  | 'participant'
  | 'provider'
  | 'both'
  | 'admin'
  | 'hr_manager'
  | 'employee'
  | 'vendor_admin'
  | 'vendor_staff';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  city: string;
  preferred_language: string;
  has_provider_profile: boolean;
  is_email_verified: boolean;
  org_id: number | null;
  org_name: string | null;
  date_joined: string;
}

export interface Organisation {
  id: number;
  name: string;
  domain: string;
  billing_email: string;
  billing_address: {
    street?: string;
    city?: string;
    country?: string;
    postcode?: string;
    vat_number?: string;
  } | null;
  logo_url: string;
  max_users: number;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrgDashboard {
  total_bookings: number;
  total_spend: string;
  upcoming_count: number;
  avg_per_head: string;
  ytd_spend: string;
  recent_bookings: Booking[];
  org: Organisation;
}

export interface OrganisationMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  user_role: UserRole;
  role: 'admin' | 'member';
  joined_at: string | null;
  created_at: string;
}

export interface ProviderProfile {
  id: number;
  user_email: string;
  display_name: string;
  bio: string;
  tagline: string;
  website: string;
  instagram: string;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface ExperienceListItem {
  id: number;
  title: string;
  slug: string;
  category: Category;
  city: string;
  duration_minutes: number;
  price_per_person: string;
  currency: string;
  min_participants: number;
  max_participants: number;
  average_rating: string;
  review_count: number;
  booking_count: number;
  cover_image: string | null;
  provider_name: string;
  status?: string;
}

export interface ExperienceDetail extends ExperienceListItem {
  description: string;
  what_included: string;
  what_to_bring: string;
  meeting_point: string;
  latitude: string | null;
  longitude: string | null;
  languages: string[];
  status: string;
  images: ExperienceImage[];
  provider: {
    id: number;
    user_id: number;
    display_name: string;
    bio: string;
    tagline: string;
    is_verified: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ExperienceCreatePayload {
  title: string;
  description: string;
  what_included?: string;
  what_to_bring?: string;
  meeting_point?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  duration_minutes: number;
  price_per_person: number;
  min_participants?: number;
  max_participants?: number;
  languages?: string[];
  category_id: number;
}

export interface ExperienceMapItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  price_per_person: string;
  currency: string;
  cover_image: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  average_rating: string;
  review_count: number;
}

export interface ExperienceImage {
  id: number;
  image_url: string;
  is_cover: boolean;
  display_order: number;
}

export interface TimeSlot {
  id: number;
  start_datetime: string;
  end_datetime: string;
  spots_total: number;
  spots_remaining: number;
  is_available: boolean;
}

export interface Booking {
  id: number;
  booking_reference: string;
  experience_title: string;
  experience_slug: string;
  experience_city: string;
  time_slot: TimeSlot;
  num_participants: number;
  unit_price: string;
  total_price: string;
  participant_service_fee: string;
  total_charged: string;
  status: string;
  special_requests: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  author_name: string;
  provider_response: string;
  provider_responded_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user_name: string;
  other_user_id: number;
  experience_title: string | null;
  last_message: string | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  is_mine: boolean;
  created_at: string;
}

export interface AppNotification {
  id: number;
  type: "new_message" | "new_booking";
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Invoice {
  id: number;
  invoice_number: string;
  booking_reference: string;
  experience_title: string;
  booking_date: string;
  subtotal: string;
  vat_rate: string;
  vat_amount: string;
  total_with_vat: string;
  currency: string;
  billing_name: string;
  billing_email: string;
  billing_address: {
    street?: string;
    city?: string;
    country?: string;
    postcode?: string;
    vat_number?: string;
  } | null;
  pdf_generated: boolean;
  issued_at: string;
}

export interface Payout {
  id: number;
  stripe_payout_id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface OrgAnalytics {
  category_breakdown: { category: string; spend: string; count: number }[];
  monthly_spend: { month: string; spend: string; count: number }[];
  top_experiences: { title: string; slug: string; spend: string; count: number }[];
}

export interface AdminVendor {
  id: number;
  user_email: string;
  user_name: string;
  display_name: string;
  tagline: string;
  is_verified: boolean;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  experience_count: number;
  joined_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface AdminStats {
  total_users: number;
  total_vendors: number;
  pending_vendors: number;
  total_experiences: number;
  pending_experiences: number;
  total_bookings: number;
  total_revenue: string;
}

export const api = new ApiClient(API_BASE);
