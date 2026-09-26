export default {
  name: "AdminReservationSearch",
  template: `
    <div class="admin-dashboard" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
      <div class="container mt-4">
        <h2 class="text-white">Reservation Search</h2>
        <br><br>

        <div class="glass-card p-4 mb-4">
          <form @submit.prevent="runSearch">
            <div class="row g-2 align-items-end">
              <div class="col-12 col-md-8">
                <input class="form-control bg-dark text-light"
                  placeholder="Search by user email, lot, or spot..."
                  v-model="query"
                  @keyup.enter="runSearch"
                  :disabled="loading"
                />
              </div>
              <div class="col-12 col-md-4">
                <button class="btn btn-primary w-100" type="submit" :disabled="loading">
                  <span v-if="loading">Searching...</span>
                  <span v-else>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        
        <div v-if="loading" class="text-light text-center">Loading...</div>
        <div v-else-if="results.length===0 && !loading && query" class="alert alert-info glass-card text-center">No reservations found.</div>
        <div class="row" v-else>
          <div class="col-md-4 mb-4" v-for="res in results" :key="res.id">
            <div class="glass-card h-100 p-4 d-flex flex-column">
              <div class="mb-2 text-light"><b>User:</b> {{ res.user_email }}</div>
              <div class="mb-2 text-light"><b>Lot:</b> {{ res.lot_name }} <span v-if="res.spot_id">(Spot #{{ res.spot_id }})</span></div>
              <div class="mb-2 text-light">
                <b>Parked at:</b> {{ formatDate(res.parking_timestamp) }}
                <span v-if="res.leaving_timestamp" class="ms-2"><b>| Left at:</b> {{ formatDate(res.leaving_timestamp) }}</span>
              </div>
              <div class="mt-auto">
                <span class="badge bg-info">Cost: ₹{{ res.parking_cost || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  data() {
    return {
      query: "",
      loading: false,
      results: []
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
    async runSearch() {
      this.loading = true;
      this.results = [];

      if (!this.query.trim()) {
        this.loading = false;
        return;
      }

      const endpoint = "/api/admin/reservations";
      const params = `?query=${encodeURIComponent(this.query.trim())}`;

      try {
        const res = await fetch(endpoint + params, {
          method: "GET",
          headers: this.getAuthHeaders()
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (Array.isArray(data)) {
          this.results = data.map(res => ({
            ...res,
            user_email: res.user_email || res.user?.email || "",
            lot_name: res.lot_name || res.lot?.prime_location_name || "",
            spot_id: res.spot_id
          }));
        } else {
          this.results = [];
        }
      } catch (err) {
        console.error("Search error", err);
        this.results = [];
      } finally {
        this.loading = false;
      }
    },
    formatDate(dt) {
      if (!dt) return "-";
      return new Date(dt).toLocaleString();
    }
  }
};
