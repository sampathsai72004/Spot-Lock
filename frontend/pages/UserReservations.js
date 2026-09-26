export default {
  name: "UserReservations",
  data() {
    return {
      reservations: [],
      loading: false,
      error: null,
    };
  },
  mounted() {
    this.fetchReservations();
  },
  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem("token");
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      };
    },
    async fetchReservations() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch('/api/my-reservations', {
          headers: this.getAuthHeaders()
        });
        if (!res.ok) throw new Error();
        this.reservations = await res.json();
      } catch (e) {
        this.error = "Failed to load reservations.";
        this.reservations = [];
      } finally {
        this.loading = false;
      }
    },
    formatDate(dt) {
      if (!dt) return "";
      return new Date(dt).toLocaleString();
    }
  },
  template: `
  <div class="user-reservations" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
    <div class="container mt-4">
      <h2 class="text-white mb-4"><i class="fas fa-history me-2"></i>My Reservations</h2>

      <div v-if="error" class="alert alert-danger glass-card mb-4">{{ error }}</div>
      <div v-if="loading" class="glass-card p-4 text-center text-white mb-4">
        <div class="spinner-border text-light" role="status"></div>
        <div class="mt-3">Loading...</div>
      </div>

      <div v-if="!loading && reservations.length" class="glass-card p-4 mb-4">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Spot</th>
                <th>Start</th>
                <th>End</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reservations" :key="r.id">
                <td>
                  <span class="fw-bold text-white">{{ r.lot_name }}</span>
                </td>
                <td>{{ r.spot_id }}</td>
                <td><span class="badge bg-info">{{ formatDate(r.parking_timestamp) }}</span></td>
                <td>
                  <span v-if="r.leaving_timestamp" class="badge bg-secondary">{{ formatDate(r.leaving_timestamp) }}</span>
                  <span v-else class="badge bg-warning text-dark">Active</span>
                </td>
                <td>₹{{ r.price !== undefined ? r.price.toLocaleString() : "--" }}</td>
                <td>
                  <span v-if="!r.leaving_timestamp" class="badge bg-success">Current</span>
                  <span v-else class="badge bg-secondary">Past</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="!loading && !reservations.length" class="glass-card alert alert-info text-center mt-4">
        <i class="fas fa-calendar-times fa-2x mb-2 text-info"></i>
        <div>No reservations found.</div>
      </div>
    </div>
  </div>
  `
};
