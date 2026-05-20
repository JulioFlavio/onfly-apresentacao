// src/App.tsx
// Componente raiz da aplicação. Seu único papel é declarar o MAPA de rotas:
// dada a URL atual, qual tela renderizar.
//
// É deliberadamente fino. Não decide layout (cada página tem o seu), não
// busca dados (cada página/hook faz isso), não trata estado global (não
// temos). Mantê-lo enxuto facilita ler "como o app se monta" num só lugar.
//
// O <BrowserRouter> fica no main.tsx (um nível acima), por separação de
// responsabilidades: main.tsx cuida da INFRAESTRUTURA de boot (criar root,
// ativar StrictMode, plugar o roteador no histórico do navegador), enquanto
// App.tsx cuida só da TOPOLOGIA de rotas. Essa divisão também facilita
// testes — em testes a gente embrulha <App /> num <MemoryRouter> sem
// precisar arrancar o <BrowserRouter> de lugar nenhum.

import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import BlockDetail from './pages/BlockDetail';

export default function App() {
  return (
    // <Routes> é o "switch" do React Router: ele OLHA todas as <Route>
    // filhas e renderiza APENAS A PRIMEIRA cujo path bate com a URL atual.
    // Sem o <Routes>, várias rotas poderiam ficar ativas ao mesmo tempo —
    // não é o que queremos numa SPA com telas mutuamente exclusivas.
    <Routes>
      {/* Tela inicial — o colaborador vê o cartão, o saldo e a lista de
          transações. É a "casa" do app: ponto de partida e destino do botão
          de voltar das outras páginas. */}
      <Route path="/" element={<Dashboard />} />

      {/* Chat com o Copilot — usuário chega aqui clicando no CTA flutuante
          do Dashboard ou no botão "Falar com o Copilot" da tela de bloqueio. */}
      <Route path="/assistente" element={<Assistant />} />

      {/* Detalhe de bloqueio — :id é um parâmetro dinâmico capturado via
          useParams dentro da página. O usuário chega aqui clicando numa
          transação com status "bloqueada" no Dashboard. */}
      <Route path="/bloqueio/:id" element={<BlockDetail />} />
    </Routes>
  );
}
