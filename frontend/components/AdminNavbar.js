export default {
  template: `
    <nav class="spotlock-navbar navbar navbar-expand-lg px-4 py-2 bg-dark">
      <router-link class="navbar-brand d-flex align-items-center text-white" to="/admin-dashboard">
        
        <span class="brand-title">SpotLock Admin Dashboard</span>
      </router-link>

      <button
        class="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#adminNavbarNav"
        aria-controls="adminNavbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="adminNavbarNav">
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/admin-dashboard">
              <i class="fas fa-tachometer-alt me-1"></i> Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/admin-users">
              <i class="fas fa-users-cog me-1"></i> User Management
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/admin-search">
              <i class="fas fa-users-cog me-1"></i> Search
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/admin-summary">
              <i class="fas fa-chart-pie me-1"></i> Summary
            </router-link>
          </li>
          <li class="nav-item">
            <button @click="logout" class="btn btn-light ms-3">
              <i class="fas fa-sign-out-alt me-1"></i> Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  `,

  methods: {
    logout() {
      this.$store.commit('logout');
      this.$router.push('/');
    }
  }
};
