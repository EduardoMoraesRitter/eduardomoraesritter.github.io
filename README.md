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

## 📡 Farol 4 — transferência de arquivos por luz

Projeto em `public/farol4/`. O transmissor mostra os blocos do arquivo como QR codes coloridos (três canais RGB por quadro); o receptor lê a câmera de outro aparelho. Funciona no navegador, sem instalar nada. Página no ar: [eduardomoraesritter.github.io/farol4](https://eduardomoraesritter.github.io/farol4/). Detalhes técnicos e teste físico: [`public/farol4/SOBRE.md`](public/farol4/SOBRE.md).

### O que mudou em 13/11/2026

| Commit | O que foi feito |
|---|---|
| `1dc4e09` | O lado que envia mostra barra de progresso, percentual, tempo restante, velocidade e resumo de tempo (total, transmitindo, pausas). Com a sala conectada, os números vêm dos blocos confirmados pelo receptor; sem sala, dos blocos já mostrados na tela. |
| `0a695ce` | Velocidade em unidades simples nos dois lados: quadros/s, QR/s, blocos/s e kB/min, medidos numa janela de 5 s. O receptor desenha uma moldura verde (QR centralizado, tamanho bom) ou amarela (fora do centro, pequeno ou perto demais) em volta do QR que achou. |
| `6b6ecc6` | Envio e receptor trocam medidas de velocidade e mostram o mesmo conselho: "pode aumentar", "diminua" ou "não é a velocidade" (enquadramento). Botões "Mais devagar" / "Mais rápido" nos dois lados; no receptor, o pedido vai ao transmissor. |
| `5ca4627` | Leitura da câmera com **zxing-wasm** em três workers, um por canal, em paralelo. Buffers são transferidos e reaproveitados, sem cópia. O laço de leitura roda na cadência da câmera, não na animação. Se os workers falharem, volta para o jsQR. |
| `a473eb1` | Pesquisa sobre transferência mais rápida (13 soluções, 70 links): [`docs/pesquisa-farol4-transferencia-mais-rapida-2026-11-13.md`](docs/pesquisa-farol4-transferencia-mais-rapida-2026-11-13.md). |
| `7f46f88`, `489fd40`, `9d45776`, `d6d1ea9` | Registros das medições (opções da pesquisa, leitor zxing, gargalo do receptor, 6 contra 12 quadros/s). Checklist: [`docs/PLANO-farol4-progresso-envio.md`](docs/PLANO-farol4-progresso-envio.md). |

### Números medidos

Todos em navegador, com câmera simulada ou com quadros reais do transmissor. **Nenhum número foi medido em celular ou entre dois aparelhos reais.**

**Leitor isolado** (40 quadros reais do envio, três canais por quadro, notebook):

| Leitor | 606 px | 1100 px (ampliado) |
|---|---|---|
| jsQR (antes) | 74 ms por quadro | 174 ms por quadro |
| zxing-wasm, uma thread | 9,7 ms | 30 ms |
| zxing-wasm, três workers | 11 ms | 16 ms |

**Receptor no app** (câmera simulada a 1100 px):

| Medida | Antes | Depois |
|---|---|---|
| Varreduras por segundo | cerca de 12 | cerca de 26 |
| Leituras de QR por segundo | cerca de 35 | cerca de 79 (~2,2×) |

**Transmissão** (blocos novos por segundo recebidos):

| Velocidade do envio | Antes da otimização do laço | Depois |
|---|---|---|
| 6 quadros/s | 11,3 blocos/s | não medido de forma limpa |
| 12 quadros/s | 11,3 blocos/s | não medido de forma limpa |

Antes da otimização, o receptor era o gargalo: fazia ~12 varreduras por segundo nos dois casos, então subir o envio de 6 para 12 não mudou nada. Depois da otimização o receptor lê mais, mas a medição de blocos por segundo ficou presa ao tamanho da captura de teste (159 blocos distintos). **Ainda não há um ganho de tempo de transmissão confirmado.**

**Teto teórico do envio** (conta, não medição): 6 quadros/s × 3 QR × 400 bytes × 11/12 (um quadro em 12 repete os metadados) = 6.600 bytes/s, os 6,4 KiB/s da página. Com 12 quadros/s, o dobro. Um arquivo de 100 MB levaria cerca de 4 h 12 min a 6,4 KiB/s.

### Lições dos testes

- O `requestAnimationFrame` roda a cerca de 5 Hz na janela de teste usada, mesmo com a aba visível. Isso segura o laço de leitura e a renderização do transmissor. Medições feitas assim não servem; o conselho "diminua a velocidade" que apareceu nos testes era artefato disso.
- Transmissor e receptor na mesma página compartilham o estado de pausa. Para testar, é preciso limpar a `sessionStorage` e usar arquivo novo a cada medição.
- A câmera simulada precisa de `requestFrame()` por quadro, senão o canvas congela.

### Padrões novos: bloco de 600 bytes e 12 quadros/s (medido em 13/11/2026)

Antes, o Farol vinha com bloco de 400 bytes e 6 quadros/s. Agora o bloco padrão é de 600 bytes e a velocidade padrão é de 12 quadros/s (os dois continuam ajustáveis na página, e o envio ainda reduz sozinho a velocidade se o receptor travar).

Medidas com o mesmo método de antes (quadros reais do transmissor, câmera simulada a 1100 px, notebook). Taxa em régime = blocos aceitos nos primeiros 5 s × tamanho do bloco ÷ 5.

| Arquivo | Antes (400 bytes, 6 quadros/s) | Agora (600 bytes, 12 quadros/s) | Diferença |
|---|---|---|---|
| 30 KB (completo e verificado) | 5,6 s · ~5,4 KB/s | 2,5 s · ~12 KB/s | tempo −55%, velocidade +124% |
| 100 KB (taxa em régime) | ~7,0 KB/s | ~17,3 KB/s | velocidade +147% |

Só para comparar as etapas: o bloco de 600 sozinho, a 6 quadros/s, deu ~10,4 KB/s (+49%); o bloco de 400 a 12 quadros/s deu ~12,1 KB/s (+73%). Ou seja, quase metade do ganho vem da velocidade e o resto do bloco maior.

Na conta, 1 MB passaria de cerca de 2 min 23 s para cerca de 1 min, e 100 MB de cerca de 3 h 58 min para cerca de 1 h 36 min. Essas duas últimas são contas a partir da taxa medida, não transferências feitas.

**Limites destas medidas:** foram feitas com câmera simulada em notebook. O QR de 600 bytes é maior, então fica mais difícil de ler a distância; isso precisa ser visto no celular real (o botão "Testar leitura" continua disponível). O protocolo não mudou: o tamanho do bloco vem no cabeçalho do arquivo, então versões antigas e novas continuam conversando.

### Formato binário com bloco de 880 bytes: novo padrão (medido em 18/11/2026)

O bloco passa a ir como bytes puros, com cabeçalho de 15 bytes ('F5B' + 4 bytes do hash + número do bloco + CRC32), no lugar do texto em base64 com o hash de 64 letras. Um bloco binário de 880 bytes cabe no mesmo tamanho de QR (113 módulos) que um bloco de texto de 600 bytes. Os metadados continuam em texto. O nome do prefixo não tem relação com o Farol 5: o formato é do Farol 4.

Mesmo método das medidas anteriores. Arquivo de 200 KB, 12 quadros/s, mediana de 3 rodadas, taxa nos primeiros 5 s:

| Formato | Taxa | Diferença sobre o texto 600 |
|---|---|---|
| Texto, bloco 600 (padrão anterior) | 16,7 KB/s | — |
| Binário, bloco 600 | 17,3 KB/s | +4% |
| Binário, bloco 880 (padrão novo) | 29,6 KB/s | **+77%** |

- **Integridade:** as 9 medições binárias do plano chegaram a "Arquivo verificado" (SHA-256 conferido).
- **Limites:** câmera simulada em notebook. Em todos os formatos, os últimos blocos demoram a chegar sem o pedido de blocos faltantes; uma rodada binária de 600 parou em 331 de 334. Falta teste em celular real.
- **Compatibilidade:** o receptor precisa estar nesta versão para ler blocos binários. Na página, desligar "Formato binário" volta o bloco para 600 em texto; escolher 880 liga o binário. O teste de leitura usa no máximo 600 bytes.
- Detalhes: [`docs/teste-binario-2026-11-18.md`](docs/teste-binario-2026-11-18.md) e [`docs/PLANO-farol4-binario.md`](docs/PLANO-farol4-binario.md).

### Próximas soluções (backlog)

Em ordem de prioridade. Os ganhos são estimativas da pesquisa, não medições do Farol.

1. **Medir a velocidade real entre dois aparelhos** (teste físico em [`farol4-teste-fisico.md`](docs/farol4-teste-fisico.md)). Pré-requisito para medir qualquer ganho.
2. ~~Ganhar mais dados por QR com bytes puros~~: feito (formato binário, +77% medido; ver acima).
3. **Mais de um QR por canal em tela grande** (dois ou quatro por quadro), com opção na interface. Estimativa: até 2× (ou 4×) de monitor para celular. Depende de o leitor achar vários códigos por imagem.
4. **Aumentar o teto de quadros/s:** o controle hoje vai até 12. Com câmera de 60 fps (`exact: 60`, quando o aparelho aceita), dá para ir a 24–30. Precisa de teste em celular.
5. ~~Subir a velocidade sozinho~~: feito (controle automático, opção "Velocidade automática", ligada por padrão). Tem testes de unidade; o teste ponta a ponta ficou para o celular real ([`docs/teste-controlador-2026-11-13.md`](docs/teste-controlador-2026-11-13.md)).
6. **Leitura em resolução menor quando o QR estiver grande.** Na bancada, meia resolução cortou o tempo de leitura pela metade e manteve os três canais. Não testado no celular, onde QR pequeno pode deixar de ser lido.
7. **Fountain code (LT ou wirehair) para o modo sem canal de retorno.** Não ajuda com o retorno ligado; sem retorno, corta o tempo final. Esforço médio a grande.
8. **Compressão gzip quando o arquivo encolher** (`CompressionStream`). Zero em vídeo, foto e ZIP; grande em texto.
9. **Suavizar a moldura do QR** (desliza entre detecções e só some depois de algumas leituras falhas). Não muda a velocidade; melhora o enquadramento, que é o que mais derruba a leitura.

**Não vale a pena**, segundo a pesquisa: adotar o cimbar (leitor só em app Android nativo), copiar código do Decimen atual (AGPL-3.0 desde a v0.4.0), JAB Code e HCCB (sem leitor para navegador), mais de três cores por QR, RaptorQ (patentes, peso), QR versão 40 em tela, subir o quadro acima da metade da taxa da câmera, BC-UR (feito para dados pequenos de carteira).
