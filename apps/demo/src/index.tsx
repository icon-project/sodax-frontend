import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Providers from './providers';
import { Buffer } from 'buffer';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

if (!window.Buffer) {
  window.Buffer = Buffer; // Optional, for packages expecting Buffer to be global
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
