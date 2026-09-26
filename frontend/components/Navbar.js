export default {
  template: `
    <nav class="spotlock-navbar navbar navbar-expand-lg px-4 py-2">
      <router-link class="navbar-brand d-flex align-items-center" to="/">
       
        <span class="brand-title">SpotLock</span>
      </router-link>
      <button
        class="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item">
            <router-link class="nav-link nav-link-custom" to="/">Home</router-link>
          </li>
          <template v-if="!$store.state.loggedIn">
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/login">Login</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/register">Register</router-link>
            </li>
          </template>
          <template v-else-if="$store.state.role === 'admin'">
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/admin-dashboard">Admin Dashboard</router-link>
            </li>
          </template>
          <template v-else-if="$store.state.role === 'user'">
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/feed">Parking Lot Details</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/explore">Booking Confirmation</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/explore">Booking History</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link nav-link-custom" to="/explore">Profile & Settings</router-link>
            </li>
          </template>
          <li class="nav-item" v-if="$store.state.loggedIn">
            <button
              @click="$store.commit('logout')"
              class="btn logout-btn ms-3"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  `
}