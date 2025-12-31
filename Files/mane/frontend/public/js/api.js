/**
 * API Service
 * Handles all HTTP requests to the backend
 */

const API = {
    /* =========================
       Token & User Management
    ========================== */

    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },

    removeToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    getUser() {
        const user = localStorage.getItem(CONFIG.USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    /* =========================
       Core Request Handler
    ========================== */

    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            ...(options.headers || {})
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            let data = null;
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (response.status === 401) {
                this.removeToken();
                if (window.location.pathname !== "/") {
                    window.location.reload();
                }
            }

            if (!response.ok) {
                throw new Error(data?.message || "Request failed");
            }

            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    /* =========================
       Authentication APIs
    ========================== */

    auth: {
       async request(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: "include", // 🔥 REQUIRED
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  // ✅ correct logic
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}
,
        async register(collegeData) {
            const data = await API.request("/auth/register", {
                method: "POST",
                body: JSON.stringify(collegeData)
            });

            if (data?.success) {
                API.setToken(data.data.token);
                API.setUser(data.data.college);
            }

            return data;
        },

        async collegeLogin(loginData) {
            const data = await API.request("/auth/college/login", {
                method: "POST",
                body: JSON.stringify(loginData)
            });

            if (data?.success) {
                API.setToken(data.data.token);
                API.setUser(data.data.college);
            }

            return data;
        },

        async logout() {
            try {
                await API.request("/auth/logout", { method: "POST" });
            } finally {
                API.removeToken();
            }
        },

        async getMe() {
            return API.request("/auth/me");
        },

        async changePassword(currentPassword, newPassword) {
            return API.request("/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword })
            });
        }
    },

    /* =========================
       File APIs
    ========================== */

    files: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.request(`/files${query ? "?" + query : ""}`);
        },

        async getOne(id) {
            return API.request(`/files/${id}`);
        },

        async create(formData) {
            return API.request("/files", {
                method: "POST",
                body: formData
            });
        },

        async update(id, formData) {
            return API.request(`/files/${id}`, {
                method: "PUT",
                body: formData
            });
        },

        async delete(id) {
            return API.request(`/files/${id}`, {
                method: "DELETE"
            });
        },

        getDownloadUrl(id) {
            return `${CONFIG.API_BASE_URL}/files/${id}/download`;
        },

        async download(id) {
            const token = API.getToken();
            const url = this.getDownloadUrl(id);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get("content-disposition");
            let filename = "download";

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },

        async exportToExcel(params = {}) {
            const token = API.getToken();
            const query = new URLSearchParams(params).toString();
            const url = `${CONFIG.API_BASE_URL}/files/export${query ? "?" + query : ""}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Export failed");
            }

            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "file_records_export.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },

        async getStats() {
            return API.request("/files/stats");
        }
    }
};

// Expose globally if needed
window.API = API;
