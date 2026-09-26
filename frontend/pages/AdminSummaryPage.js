export default {
  name: "AdminSummaryPage",
  template: `
    <div class="admin-summary" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="text-white mb-0"><i class="fas fa-tachometer-alt me-3"></i>Summary Report</h1>
          <div class="text-light">
            <i class="fas fa-calendar-alt me-2"></i>
            {{ currentDate }}
          </div>
        </div>

       
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-lg-6">
            <div class="glass-card p-4 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-uppercase text-muted mb-2">Total Users</h6>
                  <h2 class="mb-0 text-primary">{{ summaryData.totalUsers }}</h2>
                </div>
                <div class="icon-circle bg-primary-light">
                  <i class="fas fa-users text-primary"></i>
                </div>
              </div>
              <div class="mt-3">
                <span class="badge bg-success">
                  <i class="fas fa-arrow-up me-1"></i>
                  {{ summaryData.userGrowth }}% this month
                </span>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-6">
            <div class="glass-card p-4 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-uppercase text-muted mb-2">Parking Lots</h6>
                  <h2 class="mb-0 text-info">{{ summaryData.totalParkingLots }}</h2>
                </div>
                <div class="icon-circle bg-info-light">
                  <i class="fas fa-parking text-info"></i>
                </div>
              </div>
              <div class="mt-3">
                <span class="badge" :class="summaryData.lotGrowth >= 0 ? 'bg-success' : 'bg-danger'">
                  <i :class="summaryData.lotGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'" class="me-1"></i>
                  {{ Math.abs(summaryData.lotGrowth) }}% this month
                </span>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-6">
            <div class="glass-card p-4 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-uppercase text-muted mb-2">Active Reservations</h6>
                  <h2 class="mb-0 text-warning">{{ summaryData.activeReservations }}</h2>
                </div>
                <div class="icon-circle bg-warning-light">
                  <i class="fas fa-calendar-check text-warning"></i>
                </div>
              </div>
              <div class="mt-3">
                <span class="badge bg-success">
                  <i class="fas fa-arrow-up me-1"></i>
                  {{ summaryData.reservationGrowth }}% today
                </span>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-lg-6">
            <div class="glass-card p-4 h-100">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-uppercase text-muted mb-2">Revenue</h6>
                  <h2 class="mb-0 text-success">₹{{ summaryData.revenue.toLocaleString() }}</h2>
                </div>
                <div class="icon-circle bg-success-light">
                  <i class="fas fa-rupee-sign text-success"></i>
                </div>
              </div>
              <div class="mt-3">
                <span class="badge" :class="summaryData.revenueGrowth >= 0 ? 'bg-success' : 'bg-danger'">
                  <i :class="summaryData.revenueGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'" class="me-1"></i>
                  {{ Math.abs(summaryData.revenueGrowth) }}% this month
                </span>
              </div>
            </div>
          </div>
        </div>

       
        <div class="row g-4 mb-4">
          
          <div class="col-lg-8">
            <div class="glass-card p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="text-white mb-0"><i class="fas fa-chart-line me-2"></i>Reservations Trend</h5>
                <select disabled class="form-select bg-dark text-light" style="width: 150px;">
                  <option>Last 7 Days</option>
                </select>
              </div>
              <div class="chart-container" style="height: 300px;">
                <canvas ref="reservationsChart"></canvas>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="glass-card p-4 h-100">
              <h5 class="text-white mb-3"><i class="fas fa-chart-pie me-2"></i>Parking Utilization</h5>
              <div class="chart-container" style="height: 300px;">
                <canvas ref="utilizationChart"></canvas>
              </div>
            </div>
          </div>
        </div>

       
        <div class="row">
          <div class="col-lg-6">
            <div class="glass-card p-4 h-100">
              <h5 class="text-white mb-3"><i class="fas fa-clock me-2"></i>Recent Reservations</h5>
              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Location</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="reservation in recentReservations" :key="reservation.id">
                      <td>{{ reservation.userEmail }}</td>
                      <td>{{ reservation.location }}</td>
                      <td>{{ formatDate(reservation.time) }}</td>
                      <td>
                        <span class="badge" :class="{
                          'bg-success': reservation.status === 'active',
                          'bg-secondary': reservation.status === 'completed'
                        }">
                          {{ reservation.status }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="recentReservations.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">No recent reservations</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      currentDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      summaryData: {
        totalUsers: 0,
        userGrowth: 0,
        totalParkingLots: 0,
        lotGrowth: 0,
        activeReservations: 0,
        reservationGrowth: 0,
        revenue: 0,
        revenueGrowth: 0
      },
      recentReservations: [],
      systemAlerts: [],
      chartUsage: { labels: [], data: [] },
      utilization: { labels: [], data: [] },
      reservationsChart: null,
      utilizationChart: null
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

    async fetchSummaryData() {
      try {
        const res = await fetch('/api/admin/summary', {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        this.summaryData = data.summary;
        this.recentReservations = data.recentReservations;
        this.systemAlerts = data.systemAlerts;
        this.chartUsage = data.chartUsage || {labels: [], data: []};
        this.utilization = data.utilization || {labels: [], data: []};

        
        this.$nextTick(() => {
          this.initCharts();
        });
      } catch (err) {
        console.error("Error fetching summary data:", err);
      }
    },

    initCharts() {
    
      if (this.reservationsChart) this.reservationsChart.destroy();
      if (this.utilizationChart) this.utilizationChart.destroy();

      
      const reservationsCtx = this.$refs.reservationsChart.getContext('2d');
      this.reservationsChart = new Chart(reservationsCtx, {
        type: 'line',
        data: {
          labels: this.chartUsage.labels,
          datasets: [{
            label: 'Reservations',
            data: this.chartUsage.data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: 'rgba(255,255,255,0.7)' }
            },
            x: {
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: 'rgba(255,255,255,0.7)' }
            }
          }
        }
      });

     
      const utilizationCtx = this.$refs.utilizationChart.getContext('2d');
      this.utilizationChart = new Chart(utilizationCtx, {
        type: 'doughnut',
        data: {
          labels: this.utilization.labels,
          datasets: [{
            data: this.utilization.data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'rgba(255,255,255,0.7)' }
            }
          },
          cutout: '70%'
        }
      });
    },

    formatDate(dt) {
      if (!dt) return "-";
      const d = new Date(dt);
      return d.toLocaleString();
    }
  },

  mounted() {
    this.fetchSummaryData();
  
    this.interval = setInterval(this.fetchSummaryData, 300000);
  },

  beforeUnmount() {
    clearInterval(this.interval);
    if (this.reservationsChart) this.reservationsChart.destroy();
    if (this.utilizationChart) this.utilizationChart.destroy();
  }
};