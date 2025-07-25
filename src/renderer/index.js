import './styles.css';
import { ChatApp } from './chat-app.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new ChatApp();
  app.init();
});