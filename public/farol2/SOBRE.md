# Farol — transferência de arquivos por QR animado (óptica)

Projeto do Eduardo. Transfere arquivos de uma tela para outra usando **QR animado**: uma
tela pisca os códigos, a câmera do outro aparelho lê. **Sem rede, sem cabo, sem nuvem** —
o dado viaja pela luz. Tudo roda **100% no navegador**; o arquivo transferido **nunca vai
para nenhum servidor**.

- **Farol (v1):** https://eduardomoraesritter.github.io/farol/ · pasta `public/farol` do repo `EduardoMoraesRitter/eduardomoraesritter.github.io`
- **Farol 2 (v2, fountain codes):** https://eduardomoraesritter.github.io/farol2/ · pasta `public/farol2` do mesmo repo

Inspirado no projeto `ganlvtech/qrcode-file-transfer`, mas reescrito do zero e nosso.

---

## Como funciona (o algoritmo)

### Lado que ENVIA
1. Lê os bytes do arquivo na memória do navegador (nada é enviado).
2. **Comprime com gzip** (lib `pako`) — arquivo grande cabe em menos QR.
3. **Fatia** em blocos de X bytes ("bytes por bloco").
4. Gera um **frame de metadados** (nome, tipo, tamanho, total de blocos, flag gzip).
5. Cada pedaço vira um QR com um rótulo `identificador|dados-em-base64`.
6. Pisca os QR em loop.

### Lado que RECEBE
1. Lê o frame de metadados → sabe quantos blocos e o tamanho; reserva o espaço.
2. Cada QR lido: decodifica o base64 e encaixa o pedaço.
3. Quando junta o suficiente, **remonta** e **descomprime (gunzip)** → arquivo original.

### v1 (Farol) — blocos numerados
Cada QR tem um **número (ID)**. O receptor mantém uma lista de faltantes; encaixa cada
bloco pela posição `(número−1)×tamanho`; ignora repetidos (dedup por número). Ordem não
importa; o que perde volta na próxima passada do loop. Mostra **Recebidos / Faltam /
Repetidos** e a **lista dos blocos que faltam** (ex.: `1203, 5900-5910`). O transmissor
pode continuar de um ponto (`a partir do bloco N`) ou mandar **só blocos específicos**.

### v2 (Farol 2) — fountain codes (LT / Luby Transform)
Em vez de mandar blocos numerados, o transmissor gera **"gotas" (droplets)**: cada gota é
o **XOR de um subconjunto aleatório** de blocos, identificada por uma **semente (seed)**.
A mesma semente + o mesmo gerador pseudoaleatório (mulberry32) + a distribuição de graus
(**robust soliton**) permitem ao receptor saber **quais blocos** entraram naquela gota,
sem precisar mandar essa lista.

O receptor decodifica por **peeling (belief propagation)**: toda gota de grau 1 resolve um
bloco; esse bloco é "descascado" (XOR) das outras gotas, que podem virar grau 1, e assim
por diante. Resultado: junta **quaisquer ~K(1+ε) gotas** (ε ≈ 5%) e reconstrói — **não
precisa caçar bloco faltante**. É a técnica usada pelo txqr e pelo libcimbar.

---

## Recursos (ambas as versões, salvo indicado)

- Enviar e receber por QR animado, **100% no navegador**.
- **gzip** automático no envio; **gunzip** ao salvar (qualquer tipo de arquivo).
- Leitor em cascata: **BarcodeDetector nativo** (Android) → **ZXing/WASM** (iPhone/Safari)
  → **jsQR** (fallback). O nativo/ZXing lê em qualquer ângulo/rotação.
- **iPhone/Safari não deixa controlar o foco** (limite conhecido do iOS ≥16): a solução é
  **zoom + distância** — segurar mais longe (~30–40 cm) e usar o controle de **Zoom**
  sobreposto na imagem da câmera.
- **QR de sincronização** no início; o receptor **mede quantos QR/s o aparelho lê** e
  **sugere os fps** ideais para o transmissor.
- Feedback: moldura **azul procurando / verde ao encontrar**, bip e vibração.
- Progresso: **%**, velocidade ao vivo (**blocos/s, KB/s**) e **tempo estimado restante**.
- **Retoma após recarregar/cair**: o progresso do receptor é salvo no navegador
  (**IndexedDB**) e restaurado; botão **Descartar e recomeçar**. Aviso antes de recarregar
  no meio.
- Mobile: abre na câmera, layout responsivo (câmera em primeiro), tocar no preview liga.
- v1 também: **Recebidos/Faltam/Repetidos**, lista de faltantes, `a partir do bloco N`
  (com −10/+10 e setas do teclado), `só estes blocos`.
- v2 também: **fountain codes** (sem caçar faltantes); métrica "Gotas".

---

## Privacidade / rede

- Escolher o arquivo **não é upload** — o navegador só o **lê** localmente.
- O arquivo transferido **nunca trafega pela rede**. A transferência é **óptica**
  (tela → câmera). Funciona até em **modo avião**.
- A única coisa que vem da internet é **o código do app** (HTML + bibliotecas), baixado do
  GitHub Pages/CDN uma vez. Recarregar re-baixa só o app, nunca os seus dados. Para zero
  rede, dá para salvar o `index.html` e abrir offline.
- O código do app é público (GitHub Pages); os **arquivos transferidos, não**.

---

## Desempenho e limites

O gargalo é a **taxa de leitura do receptor** (câmera + foco + motor de QR), não a de
gerar. Regra de bolso:

| Cenário | Leitura útil | Velocidade prática |
|---|---|---|
| Celular c/ detector nativo, bem focado | ~8–12 QR/s | ~1–3 KB/s |
| Webcam de PC (jsQR) | ~3–6 QR/s | menos |

Ajuste ao receptor: **bytes por bloco** o maior que a câmera ainda leia; **fps** ≈ ao que
o aparelho lê de verdade (o app sugere). Com gzip, um CSV de 12 MB → ~2–4 MB, viável em
minutos. Para arquivos realmente grandes/rápidos, QR não é o ideal — ver "cor" abaixo.

---

## Comparação com projetos de referência

| Projeto | Técnica | Densidade | Velocidade |
|---|---|---|---|
| **Farol / Farol 2** (nosso) | QR P&B (1 bit/célula) + gzip (+ fountain no v2) | baixa | ~1–3 KB/s |
| [divan/txqr](https://github.com/divan/txqr) | QR P&B + fountain (LT) | baixa | poucos KB/s |
| [sz3/libcimbar](https://github.com/sz3/libcimbar) | **ícones coloridos** (~6 bits/célula) + fountain (wirehair) + zstd | alta | **~850 kbps (~106 KB/s)** |
| [JAB Code](https://en.wikipedia.org/wiki/JAB_Code) (Fraunhofer) | quadrados coloridos (4/8 cores) | alta | — |
| [HCCB](https://www.microsoft.com/en-us/research/project/high-capacity-color-barcodes-hccb/) (Microsoft) | triângulos coloridos | alta | — |

Os dois eixos de eficiência são: **(1) fountain codes** (Farol 2 já tem) e **(2) cor**
(mais bits por célula — ainda não).

---

## Próxima fase possível: cor (mais bits por célula)

QR preto-e-branco carrega 1 bit por módulo. Usar **cor** multiplica isso (2 bits com
4 cores; ~6 bits no cimbar). Opções:

- **QR multiplexado por canal (R/G/B):** compor 3 QR P&B nos canais vermelho/verde/azul de
  uma imagem → 3× dados por quadro, decodificando cada canal com um leitor comum. Ganho
  real, mas sensível a diafonia de cor/registro da câmera.
- **Integrar o libcimbar (WASM):** estado da arte, mas os leitores nativos não leem esse
  formato — exige o decoder próprio do cimbar rodando no navegador.

Decisão em aberto — o v2 ficou no eixo "fountain codes", que é o que dá robustez sem
depender de câmera boa.

---

## Stack

HTML/CSS/JS puro (sem build). Bibliotecas via CDN (jsdelivr), carregadas no navegador:
`qrcode-generator` (gera QR), `jsQR` + `barcode-detector`/ZXing-WASM + BarcodeDetector
nativo (lê QR), `pako` (gzip). Fonte: IBM Plex. Hospedagem: GitHub Pages.
