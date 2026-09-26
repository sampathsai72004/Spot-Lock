const Home = {
  mounted() {
    setTimeout(() => this.showContent = true, 300);
  
    this.initVideoBackground();
      
    this.slots.forEach((slot, idx) => {
      
    });
  },

  methods: {
    initVideoBackground() {
      const video = document.querySelector('.video-background video');
      if (video) {
       
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            
            video.muted = true;
            video.play().catch(e => {
              console.error("Video playback failed:", e);
              this.showVideoFallback();
            });
          });
        }
      } else {
        this.showVideoFallback();
      }
    },
    
    showVideoFallback() {
      const videoContainer = document.querySelector('.video-background');
      if (videoContainer) {
        videoContainer.style.backgroundImage = 'url(/images/fallback.jpg)';
        const video = videoContainer.querySelector('video');
        if (video) video.style.display = 'none';
      }
    }
  },
  data() {
    return {
      showContent: false,
      slots: [
        { occupied: false, carLeft: -70, parked: false },
        { occupied: false, carLeft: -70, parked: false },
        { occupied: false, carLeft: -70, parked: false },
        { occupied: false, carLeft: -70, parked: false },
        { occupied: false, carLeft: -70, parked: false },
      ],
      features: [
        {
          icon: '🚀',
          title: 'Instant Parking',
          desc: 'Instant Parking offers real-time spot reservations for hassle-free and quick parking.It ensures convenience, efficiency, and smart space utilization in busy areas.'
        },
        {
          icon: '📱',
          title: 'Seamless Website',
          desc: 'Seamless Website with a beautiful interface designed to make parking effortless and intuitive.Enjoy a smooth, user-friendly experience from booking to arrival.'
        },
        {
          icon: '💰',
          title: 'Save Money',
          desc: 'Save Money with dynamic pricing that finds you the best parking deals.Pay only for what you need, exactly when you need it.'
        }
      ],
      stats: [
        { value: '10K+', label: 'Happy Users' },
        { value: '95%', label: 'Success Rate' },
        { value: '24/7', label: 'Support' }
      ]
    }
  },

  mounted() {
    setTimeout(() => this.showContent = true, 300);
    
    this.slots.forEach((slot, idx) => {
      setTimeout(() => {
        this.$set(this.slots, idx, { occupied: true, carLeft: -70, parked: false });
        let pos = -70;
        const interval = setInterval(() => {
          if (pos < 10) {
            pos += 4;
            this.$set(this.slots, idx, { occupied: true, carLeft: pos, parked: false });
          } else {
            clearInterval(interval);
            this.$set(this.slots, idx, { occupied: true, carLeft: 10, parked: true });
          }
        }, 18);
      }, 800 + idx * 600);
    });
  },

  template: `
  <div class="home-container">
    <div class="video-background">
      <video autoplay muted loop playsinline poster="/images/video-poster.jpg">
        <source src="/static/videos/spotlock-intro.mp4" type="video/mp4">
  
        Your browser does not support HTML5 video.
      </video>
      <div class="video-overlay"></div>
    </div>
            
      <section class="hero">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-6">
              <h1 class="hero-title">Park Smarter, <span class="highlight">Not Harder</span></h1>
              <p class="hero-subtitle">The future of urban parking is here.Find, reserve, and pay for parking in just seconds — all in one seamless platform.</p>
              
              <div class="cta-buttons">
                <router-link to="/register" class="btn btn-primary btn-lg mr-3">
                  Get Started
                </router-link>
                <a href="#how-it-works" class="btn btn-outline-light btn-lg">
                  Learn More
                </a>
              </div>
            </div>
            
            <div class="col-lg-6">
              <div class="parking-animation-container">
                <div class="parking-lot">
                  <div class="parking-slots">
                    <div v-for="(slot, idx) in slots" :key="idx" class="parking-slot">
                      <div
                        v-if="slot.occupied"
                        class="car"
                        :class="{ parked: slot.parked }"
                        :style="{ left: slot.carLeft + 'px' }"
                      >
                        <div class="car-body"></div>
                        <div class="car-window"></div>
                        <div class="car-light"></div>
                      </div>
                      <div v-if="slot.parked" class="parked-indicator">
                        <span>✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     
      <section class="stats-section">
        <div class="container">
          <div class="stats-grid">
            <div v-for="(stat, index) in stats" :key="index" class="stat-card">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </section>

     
      <section id="how-it-works" class="features-section">
        <div class="container">
          <h2 class="section-title">How SpotLock Works</h2>
          
          <div class="features-grid">
            <div v-for="(feature, index) in features" :key="index" class="feature-card">
              <div class="feature-icon">{{ feature.icon }}</div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </section>


<section class="features-showcase">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6">
        <div class="dashboard-mockup">
          <div class="browser-window">
            <div class="browser-header">
              <div class="browser-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="browser-screen">
              <img src="/static/images/bg2.jpg" alt="SpotLock Dashboard" class="img-fluid">
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h2 class="section-title">Your Parking <span class="highlight">Dashboard</span></h2>
        <p class="section-subtitle">Our web platform gives you complete control over your parking experience with these powerful features:</p>
        
        <div class="feature-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-map-marked-alt"></i>
            </div>
            <div class="feature-content">
              <h3>Real-Time Availability</h3>
              <p>See all available parking spots in your area with live updates</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="feature-content">
              <h3>Instant Reservations</h3>
              <p>Book your spot in seconds with our streamlined interface</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <div class="feature-content">
              <h3>Secure Payments</h3>
              <p>Pay safely with multiple payment options</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="feature-content">
              <h3>Usage Analytics</h3>
              <p>Track your parking history and spending patterns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

  
      <section class="cta-section">
        <div class="container">
          <h2 class="cta-title">Ready to Transform Your Parking Experience?</h2>
          <p class="cta-subtitle">Join thousands of happy users parking smarter every day</p>
          <router-link to="/register" class="btn btn-primary btn-lg cta-button">
            Get Started - It's Free
          </router-link>
        </div>
      </section>


      <footer class="footer">
        <div class="container">
          <div class="row">
            <div class="col-md-4">
              <h5 class="footer-heading">SpotLock</h5>
              <p>Making urban parking effortless, efficient and eco-friendly.</p>
            </div>
            <div class="col-md-2">
              <h5 class="footer-heading">Product</h5>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">App</a></li>
              </ul>
            </div>
            <div class="col-md-2">
              <h5 class="footer-heading">Company</h5>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div class="col-md-4">
              <h5 class="footer-heading">Stay Connected</h5>
              <div class="social-links">
                <a href="#"><i class="fab fa-facebook"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
                <a href="#"><i class="fab fa-linkedin"></i></a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© 2023 SpotLock. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
  `
}


import AdminDashboardPage from "../pages/AdminDashboardPage.js";
import UserDashboardPage from "../pages/UserDashboardPage.js";
import LoginPage from "../pages/LoginPage.js";
import RegisterPage from "../pages/RegisterPage.js";
import UserMan from "../pages/UserMan.js";
import AdminSummaryPage from "../pages/AdminSummaryPage.js";
import store from './store.js'
import UserReservations from "../pages/UserReservations.js";
import UserProfilePage from "../pages/UserProfilePage.js";
import AdminSearchPage from "../pages/AdminSearchPage.js";


const routes = [
    { path: '/', component: Home },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/admin-dashboard', component: AdminDashboardPage, meta: { requiresLogin: true, role: "admin" } },
    { path: '/admin-summary', component: AdminSummaryPage, meta: { requiresLogin: true, role: "admin" } },
    { path: '/admin-users', component: UserMan, meta: { requiresLogin: true, role: "admin" } },
    { path: '/user-reservations', component: UserReservations, meta: { requiresLogin: true, role: "user" } },
    { path: '/user-dashboard', component: UserDashboardPage, meta: { requiresLogin: true, role: "user" } },
    { path: '/user-profile', component: UserProfilePage, meta: { requiresLogin: true, role: "user" } },
    { path: '/admin-search', component: AdminSearchPage, meta: { requiresLogin: true, role: "admin" } },
];

const router = new VueRouter({
    routes
})


router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresLogin)){
        if (!store.state.loggedIn){
            next({path : '/login'})
        } else if (to.meta.role && to.meta.role != store.state.role){
            alert('role not authorized')
             next({path : '/'})
        } else {
            next();
        }
    } else {
        next();
    }
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAdminRoute = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (isAdminRoute && !store.getters.isAdmin) {
    next('/unauthorized');
  } else {
    next();
  }
});


export default router;