// src/main.tsx
// Entry point da aplicacao: monta o componente raiz <App /> dentro do <div id="root">
// do index.html. Tudo o que o usuario ve comeca aqui.
//
// - React.StrictMode ativa checks adicionais em desenvolvimento (renders duplicados
//   para detectar efeitos com side-effects). Em producao ele e um no-op.
// - BrowserRouter habilita o roteamento client-side via History API, permitindo
//   navegar entre /, /assistente e /bloqueio/:id sem reload completo.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
