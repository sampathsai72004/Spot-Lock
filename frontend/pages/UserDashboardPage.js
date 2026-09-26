export default {
    name: "UserDashboard",
    data() {
        return {
            reservations: [],
            reservation: null,
            searchedLots: [],
            searchQuery: "",
            loading: false,
            error: null,
            success: null,
            selectedLot: null,
            releasingNow: false,

            paymentInProgress: false,
            releasePaymentDialogOpen: false,
            releasePaymentAmount: 0,

            exportingCsv: false,
        };
    },
    mounted() {
        this.searchLots();
        this.fetchReservation();
        this.fetchHistory();
    },
    methods: {

        getAuthHeaders() {
            const token = localStorage.getItem('token');
            return {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            };
        },

        async searchLots() {
            this.loading = true;
            this.error = null;
            try {
                let url = "/api/lots";
                if (this.searchQuery && this.searchQuery.trim().length > 0)
                    url += `?query=${encodeURIComponent(this.searchQuery.trim())}`;
                const res = await fetch(url, { headers: this.getAuthHeaders() });
                if (!res.ok) throw new Error("Failed to load parking lots.");
                this.searchedLots = await res.json();
            } catch (e) {
                this.error = e.message || "Failed to load parking lots.";
                this.searchedLots = [];
            } finally {
                this.loading = false;
            }
        },

        async fetchReservation() {
            try {
                const res = await fetch("/api/my-reservation", { headers: this.getAuthHeaders() });
                if (res.status === 204) {
                    this.reservation = null;
                } else if (res.ok) {
                    this.reservation = await res.json();
                } else {
                    const err = await res.json();
                    this.error = err.message || "Failed to fetch current reservation.";
                    this.reservation = null;
                }
            } catch (e) {
                this.error = "Network error fetching reservation.";
                this.reservation = null;
            }
        },

        async fetchHistory() {
            try {
                const res = await fetch("/api/my-reservations", { headers: this.getAuthHeaders() });
                if (res.ok) {
                    this.reservations = await res.json();
                } else {
                    const err = await res.json();
                    this.error = err.message || "Failed to fetch history.";
                    this.reservations = [];
                }
            } catch (e) {
                this.error = "Network error fetching reservation history.";
                this.reservations = [];
            }
        },

        async reserveSpot(lot) {
            this.error = null;
            this.success = null;
            this.selectedLot = lot;
            this.paymentInProgress = true;

            try {
                const res = await fetch("/api/reserve", {
                    method: "POST",
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ lot_id: lot.id }),
                });
                const data = await res.json();

                if (res.ok) {
                    this.success = data.message || "Spot reserved successfully!";
                    await this.fetchReservation();
                    await this.searchLots();
                    await this.fetchHistory();
                } else {
                    this.error = data.error || "Failed to reserve spot.";
                }
            } catch (e) {
                this.error = "Failed to connect to server.";
            } finally {
                this.paymentInProgress = false;
                this.selectedLot = null;
            }
        },

        async releaseSpot() {
            if (!this.reservation) {
                this.error = "No active reservation to release.";
                return;
            }

            this.releasingNow = true;
            this.error = null;
            this.success = null;

            try {
                const response = await fetch("/api/release", {
                    method: "POST",
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ reservation_id: this.reservation.id }),
                });

                const data = await response.json();

                if (response.ok) {
                    this.releasePaymentAmount = data.total_price;
                    this.releasePaymentDialogOpen = true;
                } else {
                    this.error = data.error || "Failed to release spot.";
                }
            } catch (e) {
                this.error = "Failed to connect to release service.";
            } finally {
                this.releasingNow = false;
            }
        },

        async confirmReleasePayment() {
            this.paymentInProgress = true;
            try {
                await new Promise(resolve => setTimeout(resolve, 1200));
                this.success = `Payment of ₹${this.releasePaymentAmount.toFixed(2)} successful. Spot released!`;
                this.releasePaymentDialogOpen = false;
                await this.searchLots();
                await this.fetchReservation();
                await this.fetchHistory();
            } catch (e) {
                this.error = "Payment simulation failed.";
            } finally {
                this.paymentInProgress = false;
            }
        },

        formatDate(dt) {
            if (!dt) return "-";
            const d = typeof dt === "string" ? new Date(dt) : dt;
            return d.toLocaleString();
        },

        async exportCsv() {
            this.exportingCsv = true;
            this.error = null;
            this.success = null;
            try {
                const res = await fetch("/api/export-csv", {
                    method: "GET",
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                });
                if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "reservations.csv";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    this.success = "CSV exported successfully!";
                } else {
                    const err = await res.json();
                    this.error = err.message || "Failed to export CSV.";
                }
            } catch (e) {
                this.error = "Export failed.";
            } finally {
                this.exportingCsv = false;
            }
        }
    },

    template: `
    <div class="user-dashboard" style="background: linear-gradient(to right, #121212, #3366CC); min-height: 100vh; padding: 2rem;">
        <div class="container">
            <h2 class="text-white mb-4"><i class="fas fa-car me-2"></i>User Dashboard</h2>

            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="success" class="alert alert-success">{{ success }}</div>

          
            <div class="glass-card p-4 mb-4">
                <h5 class="text-white mb-3">Search Parking Lots</h5>
                <form class="row g-2" @submit.prevent="searchLots">
                    <div class="col-9">
                        <input
                            type="text"
                            class="form-control bg-dark text-light"
                            v-model="searchQuery"
                            placeholder="By name, address, or pin..."
                        />
                    </div>
                    <div class="col-3">
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="fas fa-search me-1"></i> Search
                        </button>
                    </div>
                </form>
            </div>

            
            <div v-if="reservation" class="glass-card p-4 mb-4">
                <h5 class="text-primary mb-3"><i class="fas fa-parking me-2"></i>Active Reservation</h5>
                <ul class="list-unstyled text-white fs-6 mb-2">
                    <li><strong>Spot Number:</strong> {{ reservation.spot_number }}</li>
                    <li><strong>Lot:</strong> {{ reservation.lot_name }}</li>
                    <li><strong>Start Time:</strong> {{ formatDate(reservation.parking_timestamp) }}</li>
                    <li><strong>Base Price:</strong> ₹{{ reservation.base_price ? reservation.base_price.toFixed(2) : '0.00' }}</li>
                </ul>
                <button class="btn btn-danger btn-sm mt-2" @click="releaseSpot" :disabled="releasingNow">
                    <i class="fas fa-times me-1"></i>
                    {{ releasingNow ? 'Processing...' : 'Release / Vacate Spot' }}
                </button>
            </div>

           
            <div v-if="searchedLots.length > 0" class="row g-4 mb-4">
                <div class="col-md-4" v-for="lot in searchedLots" :key="lot.id">
                    <div class="glass-card h-100 p-4 d-flex flex-column">
                        <div class="d-flex align-items-center mb-2">
                            <span class="lot-icon me-2 fs-3">🅿️</span>
                            <h5 class="fw-bold mb-0 flex-grow-1 text-white">{{ lot.prime_location_name }}</h5>
                            <span class="badge bg-primary ms-2">₹{{ lot.price.toFixed(2) }}</span>
                        </div>
                        <div class="mb-1 text-light">
                            <i class="fas fa-map-marker-alt me-1"></i>{{ lot.address }}, {{ lot.pin_code }}
                        </div>
                        <div class="mb-2">
                            <span class="badge bg-success me-1">Available: {{ lot.available_spots }}</span>
                            <span class="badge bg-danger me-1">Occupied: {{ lot.occupied_spots }}</span>
                        </div>
                        <button
                            class="btn btn-outline-primary mt-auto"
                            :disabled="lot.available_spots === 0 || reservation"
                            @click="reserveSpot(lot)"
                        >
                            <i class="fas fa-ticket-alt me-1"></i>
                            Reserve
                            <span v-if="paymentInProgress && selectedLot?.id === lot.id" class="spinner-border spinner-border-sm ms-2"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="alert alert-info glass-card">
                No parking lots match your search.
            </div>

            
            <div class="glass-card p-4 mb-4">
                <h5 class="text-white mb-3">Export Data</h5>
                <button class="btn btn-info" @click="exportCsv" :disabled="exportingCsv">
                    <i class="fas fa-download me-1"></i>
                    {{ exportingCsv ? 'Exporting...' : 'Export Reservations to CSV' }}
                </button>
            </div>

           
            <div class="glass-card p-4 mb-4">
                <h5 class="text-white mb-3">Recent Parking History</h5>
                <div v-if="reservations.length === 0" class="text-light">No past reservations.</div>
                <table v-else class="table table-dark table-hover table-sm rounded">
                    <thead>
                        <tr>
                            <th>Spot</th>
                            <th>Lot</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="hist in reservations" :key="hist.id">
                            <td>{{ hist.spot_number }}</td>
                            <td>{{ hist.lot_name }}</td>
                            <td>{{ formatDate(hist.parking_timestamp) }}</td>
                            <td>{{ hist.leaving_timestamp ? formatDate(hist.leaving_timestamp) : '-' }}</td>
                            <td>
                                <span :class="hist.leaving_timestamp ? 'badge bg-secondary' : 'badge bg-success'">
                                    {{ hist.leaving_timestamp ? 'Parked Out' : 'Active' }}
                                </span>
                            </td>
                            <td>₹{{ hist.price ? hist.price.toFixed(2) : '0.00' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            
            <div v-if="releasePaymentDialogOpen" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5);">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content glass-card p-4">
                        <div class="modal-header border-0">
                            <h5 class="modal-title text-success">Complete Payment</h5>
                            <button type="button" class="btn-close" @click="releasePaymentDialogOpen=false"></button>
                        </div>
                        <div class="modal-body text-white">
                            <p class="mb-2"><b>Total Amount:</b> ₹{{ releasePaymentAmount.toFixed(2) }}</p>
                            <p>This is the exact price calculated based on your parking duration.</p>
                            <div class="alert alert-info">Dummy payment only — no actual charge.</div>
                        </div>
                        <div class="modal-footer border-0">
                            <button class="btn btn-secondary" @click="releasePaymentDialogOpen=false">Cancel</button>
                            <button class="btn btn-primary" @click="confirmReleasePayment" :disabled="paymentInProgress">
                                Confirm Payment
                                <span v-if="paymentInProgress" class="spinner-border spinner-border-sm ms-2"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="text-center glass-card p-4 mb-4">
                <div class="spinner-border text-light" role="status"></div>
                <span class="text-white ms-2">Loading...</span>
            </div>
        </div>
    </div>
    `

};
