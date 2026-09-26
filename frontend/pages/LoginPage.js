export default {
  template: `
    <div class="auth-container">
      
      <div class="video-background">
        <video ref="bgVideo" autoplay muted loop playsinline class="bg-video">
          <source src="/static/videos/spotlock-intro.mp4" type="video/mp4">
          <source src="/static/videos/spotlock-intro.webm" type="video/webm">
          <img src="/images/video-fallback.jpg" alt="Background" class="video-fallback">
        </video>
        <div class="video-overlay"></div>
      </div>
  
      <div class="auth-card">
        <div class="auth-form">
          <div class="text-center mb-4">
            <h2 class="auth-title">Login to <span class="highlight">SpotLock</span></h2>
            <p class="auth-subtitle">Smartest Way to Park Your 4-Wheeler</p>
          </div>
          
          <form @submit.prevent="submitLogin">
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
                autocomplete="current-password"
                required
              />
            </div>
            
            <button class="auth-btn" :disabled="loading">
              <span v-if="!loading">Login</span>
              <span v-else>
                <i class="fas fa-spinner fa-spin"></i> Logging in...
              </span>
            </button>
          </form>

          <div class="auth-footer">
            <router-link to="/forgot-password">Forgot password?</router-link>
            <span class="divider">•</span>
            <router-link to="/register">Create account</router-link>
          </div>
        </div>
      </div>
    </div>
  `,


  data() {
    return {
      email: '',
      password: '',
      loading: false,
    }
  },

  methods: {
    async submitLogin() {
      if (!this.email || !this.password) {
        alert("Please enter both email and password.");
        return;
      }
      this.loading = true;
      try {
        const res = await fetch(location.origin + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));

          
          if (this.$store && this.$store.commit) {
            this.$store.commit('setUser');
          }

          if (data.role === 'admin') {
            this.$router.push('/admin-dashboard');
          } else if (data.role === 'user') {
            this.$router.push('/user-dashboard');
          } else {
            alert("Unknown role. Please contact support.");
          }
        } else {
          alert(data.message || "Login failed");
          this.password = '';
        }
      } catch (err) {
        alert("Network error: " + err.message);
        this.password = '';
      } finally {
        this.loading = false;
      }
    },

    initVideo() {
      const video = this.$refs.bgVideo;
      if (!video) return;
     
      const fallback = video.querySelector('.video-fallback');
      if (fallback) fallback.style.display = 'none';

      video.addEventListener('error', () => {
        console.log('Video error - showing fallback');
        if (fallback) fallback.style.display = 'block';
        video.style.display = 'none';
      });

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Playback failed:', err);
          if (fallback) fallback.style.display = 'block';
          video.style.display = 'none';
        });
      }
    }
  }
}
