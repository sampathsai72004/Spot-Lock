import AdminNavbar from "./components/AdminNavbar.js"
import Navbar from "./components/Navbar.js"
import UserNavbar from "./components/UserNavbar.js"
import router from "./utils/router.js"
import store from "./utils/store.js"


const app = new Vue({
  el: '#app',
  template: `
    <div>
      <component :is="navbarComponent" />
      <router-view></router-view>
    </div>
  `,
  components: {
    AdminNavbar,
    UserNavbar,
    Navbar,
  },
  computed: {
    navbarComponent() {
      if (this.$store.state.role === 'admin') {
        return 'AdminNavbar'
      } else if (this.$store.state.role === 'user') {
        return 'UserNavbar'
      } else {
        return 'Navbar'
      }
    }
  },
  router,
  store,
})
