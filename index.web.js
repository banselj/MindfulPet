console.log('DEBUG: index.web.js is being executed');
window.__MINDFULPET_INDEX_WEB = true;

// Fallback: render a visible div if nothing else renders
const fallbackDiv = document.createElement('div');
fallbackDiv.style.background = 'red';
fallbackDiv.style.color = 'white';
fallbackDiv.style.fontWeight = 'bold';
fallbackDiv.style.padding = '32px';
fallbackDiv.style.fontSize = '24px';
fallbackDiv.innerText = 'DEBUG: index.web.js fallback (React not rendering)';
document.body.appendChild(fallbackDiv);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
