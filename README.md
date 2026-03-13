# Eduardo Ritter — Portfolio

Este é o repositório do meu portfolio pessoal. O projeto foi desenvolvido buscando uma estética **premium, editorial e minimalista**, utilizando tecnologias modernas para garantir performance e uma experiência de usuário excepcional.

## 🚀 Tecnologias Utilizadas

- **Astro v5**: Framework para uma web rápida, focada em conteúdo.
- **Vanilla CSS**: Estilização personalizada com design tokens.
- **JavaScript (ES6+)**: Interações dinâmicas e sistemas de tradução/tema.
- **Google Fonts**: Tipografia curada (Cormorant Garamond & Outfit).

## 📁 Estrutura do Projeto

A estrutura foi organizada para seguir as melhores práticas de desenvolvimento com Astro:

- `/src`: Código fonte do projeto.
    - `/components`: Componentes Astro reutilizáveis (Hero, Nav, About, etc).
    - `/pages`: Rotas do site (atualmente apenas `index.astro`).
    - `/styles`: Design system e estilos globais (`global.css`).
    - `/scripts`: Lógica de interatividade (`main.js`).
- `/public`: Arquivos estáticos servidos diretamente.
    - `/assets`: Imagens, ícones e documentos (ex: `Ritter_Resume.pdf`).
- `/legacy`: Backup da versão anterior (HTML/JS/CSS estático).
- `astro.config.mjs`: Configurações do framework.
- `package.json`: Manifesto do projeto e dependências.

## 🛠️ Como Executar

Para rodar o projeto localmente:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. O site estará disponível em `http://localhost:4321`.

## ✨ Funcionalidades

- **Sistema de Temas**: Suporte a Dark/Light mode com persistência.
- **Internacionalização (i18n)**: Suporte a Português e Inglês.
- **Responsive Design**: Totalmente otimizado para dispositivos móveis.
- **Animações de Scroll**: Interações suaves usando Intersection Observer.