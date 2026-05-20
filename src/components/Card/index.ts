// src/components/Card/index.ts
// Barrel export. Permite importar como:
//   import CardVisual from '../components/Card';
// em vez de:
//   import CardVisual from '../components/Card/CardVisual';
//
// Vantagem: o caller não precisa saber o nome interno do arquivo, e podemos
// refatorar a estrutura interna da pasta (quebrar em sub-arquivos, etc.) sem
// quebrar os imports das páginas.
export { default } from './CardVisual';
