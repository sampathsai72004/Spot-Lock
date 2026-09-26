export default {
  template: `
    <nav class="spotlock-navbar navbar navbar-expand-lg px-4 py-2 bg-dark">
      <router-link class="navbar-brand d-flex align-items-center text-white" to="/user-dashboard">
        <span class="brand-title">SpotLock User Dashboard</span>
      </router-link>
      
      <button
        class="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#userNavbarNav"
        aria-controls="userNavbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="userNavbarNav">
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/user-dashboard">
              Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/user-reservations">
              My Reservations
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom text-white" to="/user-profile">
              Profile
            </router-link>
          </li>
          <li class="nav-item">
            <button
              @click="logout"
              class="btn btn-light ms-3"
            >
              Logout
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
}
