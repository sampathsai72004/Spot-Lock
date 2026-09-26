import axios from 'axios';
import store from './store';
import router from './router';

axios.interceptors.request.use(config => {
  const token = store.getters.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.commit('logout');
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axios;