// Use proxy in dev (Vite proxies /api to backend), or explicit URL in production
// Fixed: Added parentheses to ensure correct operator precedence
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + "/api/v1"
  : import.meta.env.DEV
    ? "/api/v1"
    : "http://localhost:5000/api/v1";

class ApiService {
  /* ================= CORE REQUEST WITH RETRY ================= */

  static async request(endpoint, options = {}, retryCount = 0) {
    const token = localStorage.getItem("token");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        data = { message: "Invalid server response" };
      }

      // Handle 429 (Too Many Requests) with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s

        console.log(`Rate limited. Retrying after ${waitTime}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.request(endpoint, options, retryCount + 1);
      }

      if (!response.ok) {
        // Provide user-friendly error messages
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error(
          data.message || data.error || `Error ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      // Check if it's a network error
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        console.error("Network error - is the backend server running?");
        throw new Error("Unable to connect to server. Please check your connection and try again.");
      }
      console.error("API ERROR:", error.message);
      throw error;
    }
  }

  /* ================= AUTH ================= */

  static async signup(userData) {
    const res = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // Handle OTP verification flow
    if (res.success && res.requiresVerification) {
      // Don't store token yet - user needs to verify OTP first
      return res;
    }

    // Handle direct login (if OTP is disabled)
    if (res.success && res.data?.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res;
  }

  static async login(credentials) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (res.success && res.data?.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res;
  }

  static logout() {
    localStorage.clear();
  }

  /* ================= POSTS ================= */

  static async createPost(postData) {
    return this.request("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  static async getPosts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/posts${params ? `?${params}` : ""}`);
  }

  static async updatePost(postId, postData) {
    return this.request(`/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  }

  static async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: "DELETE",
    });
  }

  static async getMyPosts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/posts/my-posts${params ? `?${params}` : ""}`);
  }

  static async likePost(postId) {
    return this.request(`/posts/${postId}/review`, { method: "POST", body: JSON.stringify({ rating: 5 }) });
  }

  static async unlikePost(postId) {
    return this.request(`/posts/${postId}/review`, { method: "DELETE" });
  }

  static async reviewPost(postId, rating, review) {
    return this.request(`/posts/${postId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, review }),
    });
  }

  static async updatePostReview(reviewId, rating, review) {
    return this.request(`/posts/review/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify({ rating, review }),
    });
  }

  static async deletePostReview(reviewId) {
    return this.request(`/posts/review/${reviewId}`, {
      method: "DELETE",
    });
  }

  static async getPostReviews(postId) {
    return this.request(`/posts/${postId}/reviews`);
  }

  static async getRequests(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/requests${params ? `?${params}` : ""}`);
  }

  /* ================= FILE UPLOAD ================= */

  // For post attachments, profile images, etc. Uses /upload/upload

  static async uploadFile(file, title = "Untitled") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    return this.request("/upload/upload", {
      method: "POST",
      body: formData,
    });
  }

  /* ================= TRAINER ================= */
  // ⚠ Using singular because backend uses /trainer

  static async createTrainerProfile(data) {
    return this.request("/trainer/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getMyTrainerProfile() {
    return this.request("/trainer/profile");
  }

  static async getProfileSummary() {
    return this.request("/users/profile-summary");
  }

  static async getMyReviews() {
    return this.request("/trainer/reviews");
  }

  static async getUserProfile(id) {
    const url = id ? `/users/profile/${id}` : "/users/profile";
    return this.request(url);
  }

  static async updateGeneralProfile(data) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async searchPeople(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/search${query ? `?${query}` : ""}`);
  }

  static async updateTrainerProfile(data) {
    return this.request("/trainer/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async searchTrainers(filters = {}) {
    // Map frontend filter names to backend query params
    const query = {
      skill: filters.skills || filters.skill,
      location: filters.location,
      minExp: filters.minExperience ?? filters.minExp,
      maxExp: filters.maxExperience ?? filters.maxExp,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      sort: filters.sort ?? "newest",
    };
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query).filter(([, v]) => v != null && v !== ""),
      ),
    ).toString();
    return this.request(`/trainer/search${params ? `?${params}` : ""}`);
  }

  static async searchInstitutions(filters = {}) {
    // Map frontend filter names to backend query params
    const query = {
      location: filters.location,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      sort: filters.sort ?? "newest",
    };
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query).filter(([, v]) => v != null && v !== ""),
      ),
    ).toString();
    return this.request(`/institution/search${params ? `?${params}` : ""}`);
  }

  static async getTrainerProfile(id) {
    return this.request(`/trainer/${id}`);
  }

  /* ================= INSTITUTION ================= */

  static async createInstitutionProfile(data) {
    return this.request("/institution/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getMyInstitutionProfile() {
    return this.request("/institution/profile");
  }

  static async updateInstitutionProfile(data) {
    return this.request("/institution/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /* ================= REQUESTS ================= */
  // Backend: POST /, PATCH /:id/respond, PATCH /:id/complete

  static async createRequest(data) {
    return this.request("/requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async respondToRequest(requestId, data) {
    return this.request(`/requests/${requestId}/respond`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async completeRequest(requestId) {
    return this.request(`/requests/${requestId}/complete`, {
      method: "PATCH",
    });
  }

  /* ================= REVIEWS ================= */

  static async createReview(data) {
    return this.request("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ================= MATERIAL ================= */
  // Backend: POST /material/upload (multipart), GET /material/:trainerId

  static async getTrainerMaterials(trainerId) {
    return this.request(`/material/${trainerId}`);
  }

  static async uploadMaterial(file, title) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    return this.request("/material/upload", {
      method: "POST",
      body: formData,
    });
  }

  /* ================= MATERIAL RATING ================= */
  // Backend: POST /, PATCH /:ratingId, DELETE /:ratingId, GET /material/:materialId, GET /my-ratings

  static async getMyMaterialRatings() {
    return this.request("/material-rating/my-ratings");
  }

  static async rateMaterial(materialId, rating, comment) {
    return this.request("/material-rating", {
      method: "POST",
      body: JSON.stringify({ materialId, rating, comment }),
    });
  }

  static async updateMaterialRating(ratingId, rating, comment) {
    return this.request(`/material-rating/${ratingId}`, {
      method: "PATCH",
      body: JSON.stringify({ rating, comment }),
    });
  }

  static async deleteMaterialRating(ratingId) {
    return this.request(`/material-rating/${ratingId}`, {
      method: "DELETE",
    });
  }

  static async getMaterialRatings(materialId, query = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request(
      `/material-rating/material/${materialId}${params ? `?${params}` : ""}`,
    );
  }

  /* ================= REPORTS (Admin) ================= */
  // Backend: GET /reports, PATCH /reports/:id, POST /reports/suspend/:userId, POST /reports/unsuspend/:userId

  static async getReports(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/reports${params ? `?${params}` : ""}`);
  }

  static async updateReport(reportId, data) {
    return this.request(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async suspendUser(userId) {
    return this.request(`/reports/suspend/${userId}`, {
      method: "POST",
    });
  }

  static async unsuspendUser(userId) {
    return this.request(`/reports/unsuspend/${userId}`, {
      method: "POST",
    });
  }

  /* ================= NETWORKING ================= */

  static async connectUser(userId) {
    return this.request(`/networking/connect/${userId}`, { method: "POST" });
  }

  static async respondToConnection(requestId, status) {
    return this.request(`/networking/respond/${requestId}`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  }

  static async getMyNetwork() {
    return this.request("/networking/my-network");
  }

  static async getPendingConnections() {
    return this.request("/networking/pending");
  }

  static async getNetworkingSuggestions() {
    return this.request("/networking/suggestions");
  }

  static async removeConnection(userId) {
    return this.request(`/networking/remove/${userId}`, { method: "DELETE" });
  }

  static async expressHireInterest(trainerId) {
    return this.request(`/networking/hire-interest/${trainerId}`, { method: "POST" });
  }

  /* ================= ANALYTICS ================= */

  static async getUserAnalytics(userId = null) {
    const url = userId ? `/analytics/${userId}` : "/analytics";
    return this.request(url);
  }

  /* ================= MESSAGING ================= */

  static async createConversation(data) {
    return this.request("/messaging/conversation", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async getConversations() {
    return this.request("/messaging/conversations");
  }

  static async getAvailableUsers() {
    return this.request("/messaging/available-users");
  }

  static async sendMessage(data) {
    return this.request("/messaging/send", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async getMessages(conversationId) {
    return this.request(`/messaging/${conversationId}/messages`);
  }

  static async markMessagesAsRead(conversationId) {
    return this.request(`/messaging/read/${conversationId}`, { method: "PATCH" });
  }

  /* ================= NOTIFICATIONS ================= */

  static async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? `?${query}` : ""}`);
  }

  static async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, { method: "PATCH" });
  }

  static async markAllNotificationsAsRead() {
    return this.request("/notifications/read-all", { method: "PATCH" });
  }

  static async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, { method: "DELETE" });
  }

  /* ================= ADMIN ================= */
  // Backend: GET /admin/users, PATCH /admin/users/:id/verify, PATCH /admin/users/:id/ban
  // GET /admin/reports, PATCH /admin/reports/:id/action, GET /admin/analytics

  static async getAdminUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/admin/users${params ? `?${params}` : ""}`);
  }

  static async verifyUser(userId, verified = true) {
    return this.request(`/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    });
  }

  static async banUser(userId, banned = true, reason) {
    return this.request(`/admin/users/${userId}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ banned, reason }),
    });
  }

  static async getAdminReports(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/admin/reports${params ? `?${params}` : ""}`);
  }

  static async takeReportAction(reportId, data) {
    return this.request(`/admin/reports/${reportId}/action`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async getAdminAnalytics() {
    return this.request("/admin/analytics");
  }

  static async transferAdmin(data) {
    return this.request("/admin/transfer-admin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ================= EMAIL VERIFICATION ================= */

  static async sendVerificationOTP(data) {
    return this.request("/auth/send-verification-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async verifyEmail(data) {
    return this.request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async resendVerificationOTP(data) {
    return this.request("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ================= PASSWORD RESET ================= */

  static async forgotPassword(data) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async verifyResetOTP(data) {
    return this.request("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async resetPassword(data) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ================= ADMIN PASSWORD RESET ================= */

  // Admin Authentication
  static async adminSignup(data) {
    return this.request("/admin/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async adminVerifySignupOTP(data) {
    return this.request("/admin/verify-signup-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async adminResendSignupOTP(data) {
    return this.request("/admin/resend-signup-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async adminForgotPassword(data) {
    return this.request("/admin/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async adminVerifyResetOTP(data) {
    return this.request("/admin/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async adminResetPassword(data) {
    return this.request("/admin/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* ================= OPTIONAL (not in backend - return empty to avoid errors) ================= */


  static async getPopularSkills(limit = 10) {
    try {
      const trainers = await this.searchTrainers({ limit: 50 });
      const skills = new Set();
      (trainers.data || []).forEach((t) =>
        (t.skills || []).forEach((s) => skills.add(s)),
      );
      return { success: true, data: [...skills].slice(0, limit) };
    } catch {
      return { success: true, data: [] };
    }
  }

  static async getPopularLocations(limit = 10) {
    try {
      const trainers = await this.searchTrainers({ limit: 50 });
      const locations = [
        ...new Set(
          (trainers.data || []).map((t) => t.location).filter(Boolean),
        ),
      ];
      return { success: true, data: locations.slice(0, limit) };
    } catch {
      return { success: true, data: [] };
    }
  }

  /* ================= VERIFICATION ================= */

  static async requestVerification(message = null) {
    return this.request("/verification/request", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  static async getVerificationStatus() {
    return this.request("/verification/status");
  }

  static async cancelVerificationRequest() {
    return this.request("/verification/request", {
      method: "DELETE",
    });
  }

  // Admin endpoints
  static async getVerificationRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/verification-requests${query ? `?${query}` : ""}`);
  }

  static async reviewVerificationRequest(requestId, action, adminNote = null) {
    return this.request(`/admin/verification-requests/${requestId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ action, adminNote }),
    });
  }
}

export default ApiService;
