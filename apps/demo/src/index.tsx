import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Providers from './providers';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
