import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import Providers from './providers';
import './index.css';

// bigint serialization — wallet SDKs serialize state to JSON in places.
// `Object.defineProperty` adds the method without asserting the prototype shape.
Object.defineProperty(BigInt.prototype, 'toJSON', {
  value: function toJSON(this: bigint) {
    return this.toString();
  },
  writable: true,
  configurable: true,
});

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
