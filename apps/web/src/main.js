import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import { initAnalytics } from './lib/analytics';

initAnalytics();

createApp(App).mount('#app');
