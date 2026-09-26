export default {
  name: "UserManagementPage",
  template: `
    <div class="user-management" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
      <div class="container">
        <h2 class="text-white mb-4">User Management</h2>
        
      
        <div class="glass-card p-4 mb-5">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-user-plus me-2 text-primary fs-4"></i>
            <h4 class="mb-0 text-white">Add New User</h4>
          </div>
          <form @submit.prevent="addUser" autocomplete="off">
            <div class="row g-3">
              <div class="col-md-4">
                <label for="email" class="form-label text-light">Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark text-light"><i class="fas fa-envelope"></i></span>
                  <input v-model="newUser.email" id="email" type="email" 
                         class="form-control bg-dark text-light" 
                         placeholder="user@example.com" required autocomplete="off" />
                </div>
              </div>
              <div class="col-md-3">
                <label for="password" class="form-label text-light">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark text-light"><i class="fas fa-lock"></i></span>
                  <input v-model="newUser.password" id="password" type="password" 
                         class="form-control bg-dark text-light" 
                         placeholder="At least 8 chars" required minlength="8" 
                         autocomplete="new-password" />
                </div>
              </div>
              <div class="col-md-2">
                <label for="role" class="form-label text-light">Role</label>
                <select v-model="newUser.role" id="role" class="form-select bg-dark text-light" required>
                  <option value="" disabled>Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div class="col-md-2">
                <label for="active" class="form-label text-light">Status</label>
                <select v-model="newUser.active" id="active" class="form-select bg-dark text-light" required>
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
              <div class="col-md-1 d-flex align-items-end">
                <button class="btn btn-primary w-100 py-2" :disabled="addingUser">
                  <i class="fas fa-plus me-1"></i>
                  <span v-if="addingUser">Adding...</span>
                  <span v-else>Add</span>
                </button>
              </div>
            </div>
          </form>
        </div>

    
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-light mt-3">Loading users...</p>
        </div>

       
        <div v-else>
          <div class="glass-card p-4">
            <div class="table-responsive">
              <table class="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-4"><i class="fas fa-envelope me-2"></i>Email</th>
                    <th><i class="fas fa-user-tag me-2"></i>Roles</th>
                    <th><i class="fas fa-circle-notch me-2"></i>Status</th>
                    <th class="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id" class="user-row">
                    <td class="ps-4">
                      <div class="d-flex align-items-center">
                        <i class="fas fa-user-circle me-3 fs-4"></i>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-2">
                        <span v-for="role in user.roles" :key="role" 
                              class="badge rounded-pill" 
                              :class="{'bg-primary': role === 'admin', 'bg-info': role === 'user'}">
                          {{ role }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="d-flex align-items-center">
                        <i class="fas fa-circle me-2" :class="{'text-success': user.active, 'text-danger': !user.active}"></i>
                        {{ user.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="text-end pe-4">
                      <button class="btn btn-sm btn-danger ms-2" 
                              @click="deleteUser(user.id)" 
                              :disabled="deletingUserId === user.id">
                        <span v-if="deletingUserId === user.id">
                          <i class="fas fa-spinner fa-spin me-1"></i> Deleting...
                        </span>
                        <span v-else>
                          <i class="fas fa-trash-alt me-1"></i> Delete
                        </span>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="users.length === 0">
                    <td colspan="4" class="text-center text-muted py-4">
                      <i class="fas fa-user-slash fs-1 mb-3"></i>
                      <p class="mb-0">No users found</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      users: [],
      loading: true,
      addingUser: false,
      deletingUserId: null,
      newUser: {
        email: "",
        password: "",
        role: "",
        active: true
      }
    };
  },

  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem('token');
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      };
    },

    async fetchUsers() {
      this.loading = true;
      try {
        const res = await fetch('/api/admin/users', {
          method: 'GET',
          headers: this.getAuthHeaders()
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        this.users = Array.isArray(data) ? data.map(user => ({
          ...user,
          roles: user.roles || []
        })) : [];
      } catch (err) {
        console.error("Error fetching users:", err);
        this.users = [];
      } finally {
        this.loading = false;
      }
    },

    async addUser() {
      if (!this.validateUserForm()) return;
      
      this.addingUser = true;
      try {
        const payload = {
          email: this.newUser.email.trim(),
          password: this.newUser.password,
          roles: [this.newUser.role],
          active: this.newUser.active
        };

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        alert(data.message || "User added successfully!");
        this.resetForm();
        await this.fetchUsers();
      } catch (err) {
        console.error("Error adding user:", err);
        alert(`Error: ${err.message || "Failed to add user"}`);
      } finally {
        this.addingUser = false;
      }
    },

    validateUserForm() {
      if (!this.newUser.email.trim()) {
        alert("Email is required");
        return false;
      }
      if (!this.newUser.password || this.newUser.password.length < 8) {
        alert("Password must be at least 8 characters");
        return false;
      }
      if (!this.newUser.role) {
        alert("Please select a role");
        return false;
      }
      return true;
    },

    resetForm() {
      this.newUser = {
        email: "",
        password: "",
        role: "",
        active: true
      };
    },

    async deleteUser(id) {
      if (!confirm("Are you sure you want to delete this user?\nThis action cannot be undone.")) return;
      
      this.deletingUserId = id;
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        alert(data.message || "User deleted successfully");
        await this.fetchUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
        alert(`Error: ${err.message || "Failed to delete user"}`);
      } finally {
        this.deletingUserId = null;
      }
    }
  },

  mounted() {
    this.fetchUsers();
  }
};