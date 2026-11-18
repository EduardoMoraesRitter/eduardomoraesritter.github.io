# Farol 4 · teste do formato binário contra o formato de texto

Data: 18/11/2026. Branch `farol4-binario`. Nenhum código de produção foi alterado.

## Veredito

| Critério | Resultado | Evidência |
|---|---|---|
| 1. B e C chegam a "Arquivo verificado" em todas as medições | **Passou** | 9 de 9 medições B/C do plano verificaram o SHA-256. |
| 2. Em 100 KB, mediana da taxa de C ≥ 1,3 × A | **Falhou** | C = 19,01 KB/s, A = 19,44 KB/s (−2,2%). O teste está saturado: ver abaixo. |
| 3. B não é mais lento que A | **Falhou em 100 KB** | B = 18,60 KB/s contra A = 19,44 KB/s (−4,3%); B terminou em 9,9 s contra 6,7 s. Em 30 KB, empate. |

Por que o critério 2 falha: com 100 KB, o receptor recebe quase o arquivo inteiro em 5 s nas duas configurações (A: 161 a 164 de 167 blocos; C: 108 de 114). A taxa aos 5 s não passa de 100 000 ÷ 5 = 20 KB/s para nenhuma configuração. A métrica bate no teto do arquivo e não mostra o ganho.

Medição extra, fora do plano, para tirar o teto: arquivo de 200 KB e laço de uma volta só. Nela, C ficou **+77%** acima de A na taxa aos 5 s (29,57 contra 16,68 KB/s). B ficou +4,0% acima de A (17,34 contra 16,68 KB/s). Uma das 4 medições B em 200 KB não completou em 30 s (detalhe abaixo).

## Ambiente

- Windows 11, Chrome do computador ("Browser 2") pela extensão claude-in-chrome. A sessão começou ligada a um Chrome de macOS ("Browser 1", outra máquina), que não alcança o localhost; troquei para o Chrome local.
- Servidor `farol-static` (python http.server, porta 4322, `public`). Página `http://localhost:4322/farol4/index.html?fresh=<n>`, um número novo por medição.
- 12 quadros/s (padrão). A página mostrou "Supabase · conectado" durante as medições.

## Método

Cada medição roda numa página só, em duas fases.

1. Limpar o estado: `sessionStorage`, chaves `farol4*` do `localStorage` e o banco IndexedDB `farol4`. Depois navegar com `?fresh=` novo.
2. Na página: `window.confirm=()=>true` e `requestAnimationFrame` trocado por `setTimeout` de 16 ms.
3. Definir `#binaryFormat` e `#blockSize`, nessa ordem. Criar o arquivo com bytes aleatórios (`crypto.getRandomValues`), nome único, via `DataTransfer` em `#file`.
4. Captura: interceptar `putImageData` do contexto de `#rgbCanvas` e copiar cada quadro desenhado pelo transmissor. Clicar `#play`. Capturar até ter `ceil(total/3×1,3)+10` quadros e `#sendCount` em "N / N", mais 2 quadros. Pausar o transmissor.
5. Recepção: canvas de câmera 1100×1100, quadro `floor(t/(1000/12)) % quadros`, `drawImage` sem suavização, `captureStream(0)` com `requestFrame()` a cada 33 ms. `getUserMedia` devolve esse stream. Clicar `#receiveMode`, esperar 1,5 s, clicar `#camera`, esperar 2,5 s, procurar "Receber novo arquivo detectado" por até 4 s, marcar `t0`, clicar `#pauseReceiver` ("Continuar"). Ler `#received` a cada 100 ms por até 30 s.
6. Taxa em regime = blocos aos 5 s × tamanho do bloco ÷ 5. KB = 1000 bytes.

Diferenças em relação ao método pedido, e por quê:

- **Limpeza do IndexedDB e do localStorage.** Só `sessionStorage.clear()` não basta: o receptor guarda a recepção no IndexedDB. A primeira medição (fresh=2001) leu "50 / 50" de um arquivo antigo e marcou 3 ms. Descartei.
- **Captura pelo `putImageData`, não por amostragem a cada 21 ms.** A amostragem perdeu quadros duas vezes (fresh=3004: faltaram os blocos 163-165; fresh=3005: faltaram 130-132). O receptor ficou parado em 164/167. Com a interceptação, cada quadro desenhado entra na captura.
- **Espera de até 3 s pelo início do transmissor**, em vez de 1 s. Com 1 s, 4 medições deram "0 / N" (fresh=4008, 4010, 4013, 4014). O transmissor tinha começado logo depois. Essas 4 foram refeitas com página nova.
- Com o estado limpo, o botão "Receber novo arquivo detectado" não aparece. Então `t0` = fim dos 4 s de espera, logo antes de clicar "Continuar". Antes disso o receptor fica pausado e não conta blocos (`pre` = 0/N em todas as medições).

## As 18 medições do plano

Configurações: A = texto, bloco 600. B = binário, bloco 600. C = binário, bloco 880. "Blocos/s" lista os blocos lidos a cada segundo depois de `t0`.

| # | Config | Arquivo | Blocos | Quadros no laço | Blocos aos 5 s | Taxa aos 5 s (KB/s) | Tempo até completar (s) | Verificou | Blocos por segundo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | A | 30 KB | 50 | 34 | 50 | 6,00 | 2,06 | sim | 30, 50 |
| 2 | A | 30 KB | 50 | 34 | 50 | 6,00 | 2,11 | sim | 33, 50 |
| 3 | A | 30 KB | 50 | 34 | 50 | 6,00 | 2,07 | sim | 30, 50 |
| 4 | B | 30 KB | 50 | 34 | 50 | 6,00 | 2,49 | sim | 33, 48 |
| 5 | B | 30 KB | 50 | 34 | 50 | 6,00 | 2,04 | sim | 33, 50 |
| 6 | B | 30 KB | 50 | 34 | 50 | 6,00 | 2,05 | sim | 36, 50 |
| 7 | C | 30 KB | 35 | 28 | 35 | 6,16 | 2,32 | sim | 33, 33 |
| 8 | C | 30 KB | 35 | 28 | 35 | 6,16 | 1,03 | sim | 35 |
| 9 | C | 30 KB | 35 | 28 | 35 | 6,16 | 1,10 | sim | 35 |
| 10 | A | 100 KB | 167 | 85 | 162 | 19,44 | 8,77 | sim | 36, 66, 96, 132, 162, 164, 164, 164 |
| 11 | A | 100 KB | 167 | 85 | 164 | 19,68 | 5,46 | sim | 33, 66, 99, 132, 164 |
| 12 | A | 100 KB | 167 | 85 | 161 | 19,32 | 6,74 | sim | 33, 69, 99, 135, 161, 164 |
| 13 | B | 100 KB | 167 | 85 | 147 | 17,64 | 10,72 | sim | 33, 63, 93, 123, 147, 149, 158, 158, 161, 164 |
| 14 | B | 100 KB | 167 | 85 | 155 | 18,60 | 9,59 | sim | 36, 69, 90, 123, 155, 155, 155, 155, 155 |
| 15 | B | 100 KB | 167 | 85 | 162 | 19,44 | 9,91 | sim | 33, 66, 96, 132, 162, 164, 164, 164, 164, 167 |
| 16 | C | 100 KB | 114 | 63 | 108 | 19,01 | 5,21 | sim | 33, 60, 69, 78, 108 |
| 17 | C | 100 KB | 114 | 62 | 108 | 19,01 | 9,93 | sim | 36, 66, 72, 75, 108, 111, 111, 111, 111, 114 |
| 18 | C | 100 KB | 114 | 62 | 108 | 19,01 | 5,48 | sim | 30, 63, 72, 78, 108 |

Ordem real: rodadas intercaladas (A30, B30, C30, A100, B100, C100, depois de novo). Páginas fresh=3006 e 4001 a 4021.

## Medianas por configuração e tamanho

| Config | Arquivo | Taxa aos 5 s (KB/s) | Tempo até completar (s) | Arquivo ÷ tempo (KB/s) |
|---|---|---|---|---|
| A | 30 KB | 6,00 | 2,07 | 14,51 |
| B | 30 KB | 6,00 | 2,05 | 14,66 |
| C | 30 KB | 6,16 | 1,10 | 27,30 |
| A | 100 KB | 19,44 | 6,74 | 14,85 |
| B | 100 KB | 18,60 | 9,91 | 10,09 |
| C | 100 KB | 19,01 | 5,48 | 18,24 |

## Ganho sobre A (medianas)

| Arquivo | Config | Taxa aos 5 s | Tempo até completar | Arquivo ÷ tempo |
|---|---|---|---|---|
| 30 KB | B | +0,0% | −1,0% | +1,0% |
| 30 KB | C | +2,7% | −46,8% | +88,1% |
| 100 KB | B | −4,3% | +47,2% | −32,1% |
| 100 KB | C | −2,2% | −18,6% | +22,8% |

Leitura: em 30 KB todas as configurações terminam antes de 5 s, então a taxa aos 5 s é só 30 KB ÷ 5. Em 100 KB, A e C chegam a 95-98% do arquivo em 5 s; as taxas batem no teto de 20 KB/s.

## Medição extra: 200 KB, laço de uma volta (fora do plano)

Objetivo: medir a taxa sem o teto do arquivo. Mesmo método, com duas mudanças: arquivo de 200 KB e captura parando logo depois que o transmissor cobre todos os blocos (sem a margem de 1,3×). O laço então não tem quadros repetidos.

| Config | Blocos | Quadros | Blocos aos 5 s | Taxa aos 5 s (KB/s) | Tempo até completar (s) | Verificou |
|---|---|---|---|---|---|---|
| A | 334 | 130 | 139 | 16,68 | 16,38 | sim |
| A | 334 | 128 | 148 | 17,76 | 17,08 | sim |
| A | 334 | 135 | 130 | 15,60 | 22,38 | sim |
| B | 334 | 125 | 153 | 18,36 | 16,03 | sim |
| B | 334 | 133 | 136 | 16,32 | 11,12 | sim |
| B | 334 | 133 | 136 | 16,32 | não completou em 30 s (331/334) | **não** |
| B | 334 | 125 | 157 | 18,84 | 15,87 | sim (rodada extra) |
| C | 228 | 94 | 171 | 30,10 | 6,80 | sim |
| C | 228 | 88 | 162 | 28,51 | 20,75 | sim |
| C | 228 | 92 | 168 | 29,57 | 13,60 | sim |

Medianas: A 16,68 KB/s; B 17,34 KB/s (4 medições); C 29,57 KB/s. Ganho na taxa aos 5 s: **C +77,3%**, B +4,0% (sem a rodada extra, B fica em 16,32 KB/s, −2,2%). Tempo até completar (medianas das que verificaram): A 17,1 s, B 15,9 s, C 13,6 s.

A medição B que não completou (fresh=5009): faltaram os blocos 166-168 (numeração da página). Conferi a captura com o jsQR da página, canal por canal: o quadro 61 tem os blocos 165, 166 e 167 (índice do cabeçalho, base 0) e decodifica bem. Nenhum bloco faltava na captura. O receptor não leu esse quadro em cerca de 2,5 voltas do laço. É uma falha de leitura do receptor, não da captura e não do formato (o arquivo não chegou a ser montado, então não houve erro de hash). O mesmo tipo de cauda longa apareceu com texto (A, 22,4 s, parado em 331 por 11 s) e com C (20,8 s, parado em 222-225).

## Outras observações

- O receptor lê cerca de 30 a 36 blocos/s em todas as configurações. A diferença entre formatos vem dos bytes por bloco, não de mais blocos por segundo.
- O tempo até completar depende muito da fase do laço e de quadros que o receptor perde. A variação entre rodadas iguais chega a 2× (C 100 KB: 5,2 s a 9,9 s).
- Velocidade de desenho do transmissor neste navegador (quadros desenhados ÷ tempo de captura, mediana): A 8,0 quadros/s, B 11,6, C 8,4 em 100 KB. Nenhum chegou a 12 quadros/s. Esse número inclui o custo de copiar cada quadro na captura. Ele não entra na taxa medida, porque o receptor recebe sempre 12 quadros/s do laço.

## O que NÃO foi testado

- Celular real, câmera real, distância, ângulo, foco, luz ambiente, reflexo e tremor. A câmera aqui é um canvas perfeito, ampliado para 1100×1100.
- Dois aparelhos. Transmissor e receptor rodaram na mesma página.
- Velocidade real do transmissor: o laço toca a 12 quadros/s mesmo quando o transmissor desenha mais devagar.
- Outros quadros/s além de 12, blocos 256 e 400, e arquivos acima de 200 KB.
- O pedido de blocos faltantes pela sala Supabase (o transmissor estava pausado na recepção).
- Mais de 3 rodadas por combinação; as medianas têm pouca amostra.

## Medições descartadas

| Página (fresh) | Motivo |
|---|---|
| 2001 | Estado antigo no IndexedDB: leu "50 / 50" de outro arquivo. |
| 2002, 3004 | Captura por amostragem perdeu o quadro dos blocos 163-165. |
| 3005 | Captura por amostragem perdeu o quadro dos blocos 130-132. |
| 3001, 3002, 3003 | Verificaram, mas usaram a captura antiga. Refeitas com o método final. |
| 4008, 4010, 4013, 4014 | Transmissor ainda em "0 / N" após 1 s. Refeitas. |
