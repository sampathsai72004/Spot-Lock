export default {
  name: "AdminDashboardPage",
  template: `
    <div class="admin-dashboard" style="background: linear-gradient(to right, #121212 0%, #3366CC 100%); min-height: 100vh; padding: 2rem 0;">
      <div class="container mt-4">
        <h2 class="text-white">Parking Lot Management</h2>
        <br><br>
        
        <div class="glass-card p-4 mb-4">
          <h5 class="mb-3 text-white">Add New Parking Lot</h5>
          <form @submit.prevent="createLot">
            <div class="row mb-2">
              <div class="col">
                <label for="location" class="form-label fw-bold text-light">Location Name</label>
                <input id="location" v-model.trim="newLot.prime_location_name" class="form-control bg-dark text-light" placeholder="e.g. MG Road" required />
              </div>
              <div class="col">
                <label for="address" class="form-label fw-bold text-light">Address</label>
                <input id="address" v-model.trim="newLot.address" class="form-control bg-dark text-light" placeholder="e.g. 123 Main St" required />
              </div>
            </div>
            <div class="row mb-2">
              <div class="col">
                <label for="pin" class="form-label fw-bold text-light">Pin Code</label>
                <input id="pin" v-model.trim="newLot.pin_code" class="form-control bg-dark text-light" placeholder="e.g. 560001" required />
              </div>
              <div class="col">
                <label for="price" class="form-label fw-bold text-light">Price (₹)</label>
                <input
                  type="number"
                  id="price"
                  v-model.number="newLot.price"
                  class="form-control bg-dark text-light"
                  placeholder="e.g. 50"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div class="col">
                <label for="spots" class="form-label fw-bold text-light">Number of Spots</label>
                <input
                  type="number"
                  id="spots"
                  v-model.number="newLot.number_of_spots"
                  class="form-control bg-dark text-light"
                  placeholder="e.g. 120"
                  min="1"
                  required
                />
              </div>
            </div>
            <button class="btn btn-primary mt-2" :disabled="creatingLot">
              <span v-if="creatingLot">Creating...</span>
              <span v-else>Create Parking Lot</span>
            </button>
          </form>
        </div>

        <div v-if="loading" class="text-center">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="lots.length === 0" class="alert alert-info text-center glass-card">
          No parking lots found. Start by adding one above.
        </div>

        <div class="row" v-else>
          <div class="col-md-4 mb-4" v-for="lot in lots" :key="lot.id">
            <div class="glass-card h-100 p-4 d-flex flex-column position-relative">

             
              <div v-if="editingLot === lot.id">
                <div class="mb-2">
                  <label class="form-label text-light">Location Name</label>
                  <input v-model="editingLotFields.prime_location_name" class="form-control bg-dark text-light" />
                </div>
                <div class="mb-2">
                  <label class="form-label text-light">Address</label>
                  <input v-model="editingLotFields.address" class="form-control bg-dark text-light" />
                </div>
                <div class="mb-2 d-flex gap-2">
                  <div>
                    <label class="form-label text-light">Pin Code</label>
                    <input v-model="editingLotFields.pin_code" class="form-control bg-dark text-light" />
                  </div>
                  <div>
                    <label class="form-label text-light">Price (₹)</label>
                    <input type="number" v-model.number="editingLotFields.price" min="1" class="form-control bg-dark text-light" />
                  </div>
                  <div>
                    <label class="form-label text-light">Number of Spots</label>
                    <input type="number" v-model.number="editingLotFields.number_of_spots" min="1" class="form-control bg-dark text-light" />
                  </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                  <button class="btn btn-success btn-sm" @click="saveEditLot(lot)">Save</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEditLot">Cancel</button>
                </div>
              </div>
              
              <div v-else>
                <div class="lot-card-header d-flex align-items-center mb-2">
                  <span class="lot-icon me-2">SLOT</span>
                  <h5 class="fw-bold mb-0 flex-grow-1 text-white">{{ lot.prime_location_name }}</h5>
                  <span class="badge bg-primary ms-2">₹{{ lot.price.toFixed(2) }}</span>
                </div>
                <div class="lot-card-body mb-2">
                  <div class="lot-address mb-1">
                    <span class="text-light">📍 {{ lot.address }}, {{ lot.pin_code }}</span>
                  </div>
                  <div class="lot-spots mb-1">
                    <span class="badge bg-secondary me-1">Total: {{ lot.number_of_spots }}</span>
                    <span class="badge bg-success me-1">Available: {{ lot.available_spots }}</span>
                    <span class="badge bg-danger">Occupied: {{ lot.occupied_spots }}</span>
                  </div>
                </div>
                <div class="mt-auto d-flex justify-content-between">
                  <button class="btn btn-warning btn-sm me-2" @click="startEditLot(lot)">Edit</button>
                  <button class="btn btn-danger btn-sm" @click="deleteLot(lot.id)" :disabled="deletingLotId === lot.id">
                    <span v-if="deletingLotId === lot.id">Deleting...</span>
                    <span v-else>Delete</span>
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      lots: [],
      loading: false,
      creatingLot: false,
      deletingLotId: null,
      newLot: {
        prime_location_name: '',
        address: '',
        pin_code: '',
        price: 0,
        number_of_spots: 0
      },
      editingLot: null,         
      editingLotFields: null    
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

    async fetchLots() {
      this.loading = true;
      try {
        const res = await fetch('/api/admin/parking-lots', {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (res.status === 401) {
          console.warn('401 Unauthorized — Invalid or missing token.');
          this.lots = [];
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          this.lots = data;
        } else {
          this.lots = [];
        }
      } catch (err) {
        console.error("Error fetching parking lots:", err);
        this.lots = [];
      } finally {
        this.loading = false;
      }
    },
   
    async createLot() {
      this.creatingLot = true;
      try {
        const { prime_location_name, address, pin_code, price, number_of_spots } = this.newLot;

        if (!prime_location_name || !address || !pin_code || price <= 0 || number_of_spots <= 0) {
          alert("Please fill all fields with valid values");
          this.creatingLot = false;
          return;
        }

        const payload = {
          prime_location_name: prime_location_name.trim(),
          address: address.trim(),
          pin_code: pin_code.trim(),
          price: parseFloat(price),
          number_of_spots: parseInt(number_of_spots)
        };

        const res = await fetch('/api/admin/create-lot', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          alert("Parking lot created successfully!");
          this.newLot = {
            prime_location_name: '',
            address: '',
            pin_code: '',
            price: 0,
            number_of_spots: 0
          };
          await this.fetchLots();
        } else {
          alert(data.message || "Error creating parking lot");
        }
      } catch (err) {
        console.error("Error creating parking lot:", err);
        alert("Server error: " + err.message);
      } finally {
        this.creatingLot = false;
      }
    },

    async deleteLot(id) {
      if (!confirm("Are you sure you want to delete this parking lot and all its spots?")) return;

      this.deletingLotId = id;
      try {
        const res = await fetch(`/api/admin/delete-lot/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          alert("Parking lot deleted successfully");
          await this.fetchLots();
        } else {
          alert(data.message || "Could not delete parking lot");
        }
      } catch (err) {
        console.error("Error deleting parking lot:", err);
        alert("Server error: " + err.message);
      } finally {
        this.deletingLotId = null;
      }
    },
  
    startEditLot(lot) {
      this.editingLot = lot.id;
      this.editingLotFields = {
        prime_location_name: lot.prime_location_name,
        address: lot.address,
        pin_code: lot.pin_code,
        price: lot.price,
        number_of_spots: lot.number_of_spots
      };
    },

    cancelEditLot() {
      this.editingLot = null;
      this.editingLotFields = null;
    },

    async saveEditLot(lot) {
      try {
        const payload = {
          prime_location_name: this.editingLotFields.prime_location_name.trim(),
          address: this.editingLotFields.address.trim(),
          pin_code: this.editingLotFields.pin_code.trim(),
          price: parseFloat(this.editingLotFields.price),
          number_of_spots: parseInt(this.editingLotFields.number_of_spots)
        };

        if (!payload.prime_location_name || !payload.address || !payload.pin_code ||
            isNaN(payload.price) || payload.price <= 0 ||
            isNaN(payload.number_of_spots) || payload.number_of_spots <= 0) {
          alert("Please fill all fields with valid values for update.");
          return;
        }

        const res = await fetch(`/api/admin/update-lot/${lot.id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          alert("Parking lot updated successfully");
          this.editingLot = null;
          this.editingLotFields = null;
          await this.fetchLots();
        } else {
          alert(data.message || (data.errors && data.errors.join(', ')) || "Could not update parking lot");
        }
      } catch (err) {
        console.error("Error updating lot:", err);
        alert("Server error: " + err.message);
      }
    }
  },

  mounted() {
    this.fetchLots();
  }
};
