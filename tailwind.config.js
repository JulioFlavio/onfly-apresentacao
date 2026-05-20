/** @type {import('tailwindcss').Config} */
// tailwind.config.js
// Configuracao do Tailwind. A chave "content" e a evolucao do antigo "purge":
// diz ao Tailwind onde varrer classes para gerar apenas o CSS realmente usado.
// Em theme.extend.colors injetamos a paleta da identidade Azulzinho/Onfly.
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A6FFF',       // Azul Onfly - acoes primarias, destaque
        dark: '#0D1117',          // Fundo do app (tema dark padrao)
        surface: '#161B22',       // Superficies elevadas (cards, modais, barras)
        border: '#30363D',        // Bordas e separadores discretos
        'text-main': '#E6EDF3',   // Texto principal sobre fundo escuro
        'text-muted': '#8B949E',  // Texto secundario, legendas, placeholders
        success: '#3FB950',       // Estados positivos (transacao aprovada)
        danger: '#F85149',        // Estados negativos (bloqueio, erro)
        warning: '#D29922',       // Estados de alerta (proximo do limite)
      },
      fontFamily: {
        // "sans" e a famalia default do Tailwind - sobrescrever aqui faz a
        // DM Sans virar a fonte padrao em todo o app sem precisar adicionar
        // a classe font-sans em cada elemento.
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
