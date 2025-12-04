
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

<<<<<<< HEAD
// Interceptar console.error para evitar erros de conversão de objetos
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  try {
    const safeArgs = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message || String(arg);
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return arg;
    });
    originalConsoleError.apply(console, safeArgs);
  } catch (e) {
    // Se falhar, tentar logar de forma mais básica
    try {
      originalConsoleError('Erro ao logar:', String(args[0] || 'Erro desconhecido'));
    } catch {
      // Silenciosamente falhar se não conseguir logar
    }
  }
};

=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
