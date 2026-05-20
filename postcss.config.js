// postcss.config.js
// Pipeline de PostCSS executado pelo Vite. O plugin tailwindcss expande as
// diretivas @tailwind/@apply no CSS final, e o autoprefixer adiciona prefixos
// de vendor (-webkit-, -moz-) onde necessario para compatibilidade de browsers.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
