export default {
  template: `
    <div class="auth-container">
     
      <div class="video-background">
        <video autoplay muted loop playsinline>
          <source src="./video/spotlock-intro.mp4" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
      </div>
    
      <div class="auth-card">
        <div class="auth-form">
          <div class="text-center mb-4">
            <h2 class="auth-title">Register for <span class="highlight">SpotLock</span></h2>
            <p class="auth-subtitle">Create your account to park smarter</p>
          </div>
          
          <form @submit.prevent="submitRegistration">
            <div class="input-wrapper">
              <i class="fas fa-envelope input-icon"></i>
              <input
                type="email"
                class="auth-input"
                placeholder="Email"
                v-model="email"
                autocomplete="username"
                required
              />
            </div>
            
            <div class="input-wrapper">
              <i class="fas fa-lock input-icon"></i>
              <input
                type="password"
                class="auth-input"
                placeholder="Password"
                v-model="password"
                autocomplete="new-password"
                required
              />
            </div>
            
            <button class="auth-btn" :disabled="loading">
              <span v-if="!loading">Register</span>
              <span v-else>
                <i class="fas fa-spinner fa-spin"></i> Registering...
              </span>
            </button>
          </form>

          <div class="auth-footer">
            <span>Already have an account?</span>
            <router-link to="/login">Login here</router-link>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      email: null,
      password: null,
      role: "user",  
      loading: false
    }
  },
  methods: {
    async submitRegistration() {
      this.loading = true;
      try {
        const res = await fetch(location.origin + '/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
            role: this.role  
          })
        });

        if (res.ok) {
          alert('Registration successful! Please login with your credentials.');
          this.$router.push('/login');
        } else {
          const err = await res.json();
          alert(err.message || "Registration failed");
        }
      } catch (error) {
        alert("An error occurred during registration");
        console.error(error);
      } finally {
        this.loading = false;
      }
    }
  }
}
