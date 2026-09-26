export default {
  name: "UserProfilePage",
  data() {
    return {
      loading: false,
      error: null,
      user: { id: null, email: "-", name: null, username: null },
      stats: { total_reservations: 0, active_reservation: false, total_spent: 0.0 },
      reservations: [],
      activeReservation: null,
      alerts: [],
      reservationsChart: null,
      trendChart: null,
      trendData: [],
      currentDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  },
  async mounted() {
    await this.loadProfileData();
  },
  computed: {
    spotUsageCounts() {
      const freq = {};
      this.reservations.forEach((r) => {
        if (r.spot_number) freq[r.spot_number] = (freq[r.spot_number] || 0) + 1;
      });
      return Object.entries(freq)
        .map(([spot, count]) => ({ spot, count }))
        .sort((a, b) => Number(a.spot) - Number(b.spot));
    },
    uniqueSpotCount() {
      return this.spotUsageCounts.length;
    },
  },
  methods: {
    async loadProfileData() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          this.error = "Authentication required. Please log in.";
          this.loading = false;
          return;
        }

        const authHeaders = { Authorization: `Bearer ${token}` };

        const fetchJson = async (url) => {
          const res = await fetch(url, { headers: authHeaders });
          if (res.status === 204) {
            return null;
          }
          if (!res.ok) {
            const errorText = await res.text();
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(
                errorData.message ||
                  `API Error: ${url} (Status: ${res.status})`
              );
            } catch {
              throw new Error(
                `API Error: ${url} (Status: ${res.status}) - ${
                  errorText || "Unknown error"
                }`
              );
            }
          }
          return res.json();
        };

        
        this.user = (await fetchJson("/api/my-profile")) || {
          id: null,
          email: "-",
          name: null,
          username: null,
        };

        this.stats =
          (await fetchJson("/api/my-profile-stats")) || {
            total_reservations: 0,
            active_reservation: false,
            total_spent: 0.0,
          };

        this.reservations = (await fetchJson("/api/my-reservations")) || [];
        this.activeReservation = await fetchJson("/api/my-reservation");

     
        const summary = await fetchJson("/api/my-summary");
        if (summary && summary.trend) {
          this.trendData = summary.trend;
        }
      } catch (e) {
        console.error("Error loading user profile page data:", e);
        this.error =
          e.message ||
          "Failed to load profile summary due to an unexpected error.";
        this.user = { id: null, email: "-", name: null, username: null };
        this.stats = {
          total_reservations: 0,
          active_reservation: false,
          total_spent: 0.0,
        };
        this.reservations = [];
        this.activeReservation = null;
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.initCharts();
          this.initTrendChart();
        });
      }
    },

    formatDate(dt) {
      if (!dt) return "-";
      const dateObj = typeof dt === "string" ? new Date(dt) : dt;
      if (isNaN(dateObj.getTime())) return "-";
      return dateObj.toLocaleString();
    },
    formatTime(dt) {
      if (!dt) return "-";
      const dateObj = typeof dt === "string" ? new Date(dt) : dt;
      if (isNaN(dateObj.getTime())) return "-";
      return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },

    
    initCharts() {
      if (!this.$refs.reservationsChart) return;
      if (this.reservationsChart) this.reservationsChart.destroy();

      const ctx = this.$refs.reservationsChart.getContext("2d");
      if (!ctx) return;

      const spots = this.spotUsageCounts.map((x) => `Spot #${x.spot}`);
      const counts = this.spotUsageCounts.map((x) => x.count);

      this.reservationsChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: spots.length ? spots : ["No reservations yet"],
          datasets: [
            {
              label: "Number of Times Parked",
              data: counts.length ? counts : [0],
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: "x",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: "rgba(255,255,255,0.9)" },
              grid: { color: "rgba(255,255,255,0.08)" },
            },
            y: {
              ticks: { color: "rgba(255,255,255,0.9)" },
              grid: { color: "rgba(255,255,255,0.08)" },
            },
          },
        },
      });
    },

    
    initTrendChart() {
      if (!this.$refs.trendChart) return;
      if (this.trendChart) this.trendChart.destroy();

      const ctx = this.$refs.trendChart.getContext("2d");
      const labels = this.trendData.map((d) => d.date);
      const counts = this.trendData.map((d) => d.count);

      this.trendChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Reservations per Day",
              data: counts,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: "white" },
              grid: { color: "rgba(255,255,255,0.08)" },
            },
            y: {
              ticks: { color: "white" },
              grid: { color: "rgba(255,255,255,0.08)" },
              beginAtZero: true,
            },
          },
        },
      });
    },
  },

  template: `
    <div class="admin-summary" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
      <div class="container">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-light" role="status"></div>
          <p class="text-white mt-2">Loading user profile...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger glass-card text-center py-4">
          <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
          <p class="mt-2 mb-0">Please check your network connection or try logging in again.</p>
          <button @click="loadProfileData" class="btn btn-sm btn-outline-danger mt-3">Retry Load</button>
        </div>

        <div v-else>
         
          <div class="d-flex align-items-center mb-4">
            <div>
              <h1>User Profile</h1>
              <h2 class="text-white mb-0">
                <i class="fas fa-user-circle me-2"></i>
                {{ user.name || user.username || user.email || "-" }}
              </h2>
              <div class="text-light small"><i class="fas fa-calendar-alt me-2"></i>{{ currentDate }}</div>
            </div>
          </div>

          
          <div class="glass-card p-4 mb-4">
            <h5 class="mb-2 text-primary"><i class="fas fa-parking me-2"></i>Current Booking</h5>
            <div v-if="activeReservation" class="text-white">
              <b>Lot:</b> {{ activeReservation.lot_name }} |
              <b>Spot:</b> #{{ activeReservation.spot_number }} |
              <b>Start:</b> {{ formatDate(activeReservation.parking_timestamp) }}
            </div>
            <div v-else class="text-muted">No current/active reservation.</div>
          </div>

          
          <div class="row g-4 mb-4">
            <div class="col-xl-4 col-lg-6">
              <div class="glass-card p-4 h-100">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase text-muted mb-2">Total Reservations</h6>
                    <h2 class="mb-0 text-primary">{{ stats.total_reservations }}</h2>
                  </div>
                  <div class="icon-circle bg-primary-light">
                    <i class="fas fa-calendar-check text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-4 col-lg-6">
              <div class="glass-card p-4 h-100">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase text-muted mb-2">Active Reservation</h6>
                    <h2 class="mb-0" :class="stats.active_reservation ? 'text-warning' : 'text-secondary'">
                      <span v-if="stats.active_reservation">Yes</span>
                      <span v-else>No</span>
                    </h2>
                  </div>
                  <div class="icon-circle bg-warning-light">
                    <i class="fas fa-ticket-alt text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-4 col-lg-12">
              <div class="glass-card p-4 h-100">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase text-muted mb-2">Total Amount Spent</h6>
                    <h2 class="mb-0 text-success">₹{{ stats.total_spent.toFixed(2) }}</h2>
                  </div>
                  <div class="icon-circle bg-success-light">
                    <i class="fas fa-rupee-sign text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <div class="glass-card p-4 mb-4" v-if="!loading && !error">
            <h5 class="text-white mb-3"><i class="fas fa-chart-bar me-2"></i>Parking Spot Usage (All Time)</h5>
            <div class="chart-container" style="height: 260px;">
              <canvas ref="reservationsChart"></canvas>
            </div>
          </div>

         
          <div class="glass-card p-4 mb-4" v-if="trendData.length">
            <h5 class="text-white mb-3"><i class="fas fa-chart-line me-2"></i>Reservation Trend (Last 7 Days)</h5>
            <div class="chart-container" style="height: 260px;">
              <canvas ref="trendChart"></canvas>
            </div>
          </div>

        
          <div class="row">
            <div class="col-lg-7">
              <div class="glass-card p-4 h-100">
                <h5 class="text-white mb-3"><i class="fas fa-clock me-2"></i>Recent Reservations</h5>
                <div class="table-responsive">
                  <table class="table table-dark table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Lot</th>
                        <th>Spot</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in reservations.slice(0, 7)" :key="r.id">
                        <td>{{ r.lot_name }}</td>
                        <td>{{ r.spot_number }}</td>
                        <td>{{ formatDate(r.parking_timestamp) }}</td>
                        <td>{{ r.leaving_timestamp ? formatDate(r.leaving_timestamp) : '-' }}</td>
                        <td>
                          <span :class="r.leaving_timestamp ? 'badge bg-secondary' : 'badge bg-success'">
                            {{ r.leaving_timestamp ? 'Parked Out' : 'Active' }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="reservations.length === 0">
                        <td colspan="5" class="text-center text-muted py-3">No recent reservations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};