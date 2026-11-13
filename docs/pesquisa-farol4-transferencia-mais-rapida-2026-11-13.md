# Farol 4 — existe jeito de transferir mais rápido?

Data da consulta: 13/11/2026. Pesquisa feita na web, lendo os repositórios e artigos originais. Todos os links estão no fim.

## Resumo

- **Dá para ir mais rápido, sim.** O Farol 4 mostra hoje cerca de 6,4 KiB/s na tela (6 quadros/s × 3 QR × 400 bytes). Outros projetos que rodam só no navegador já passam de 100 KB/s em condições boas.
- **Quanto dá para ganhar mexendo só no Farol:** uma estimativa de 3 a 6 vezes (algo entre 20 e 40 KiB/s). É estimativa, não medição: precisa ser conferida com o teste de leitura de 8 segundos que o Farol já tem.
- **Por qual caminho:** (1) deixar o leitor mais leve e tirar a leitura da linha principal da página, para aguentar mais quadros por segundo; (2) trocar o texto base64 por bytes puros e encurtar o cabeçalho de cada bloco; (3) em tela grande, mostrar dois ou quatro QR coloridos por quadro.
- **A referência mais forte no navegador é o Decimen** (2026): 199 KB/s de celular para celular e 418 KB/s de um monitor de 49" para um iPhone 17 Pro Max. São as melhores corridas do próprio autor, com arquivo de 1 MB. De notebook para celular o mesmo projeto relata 20 a 25 KB/s depois de ajustar.
- **O mais rápido de todos, o cimbar (106 KB/s), não serve aqui:** a leitura dele só existe em aplicativo Android instalado.
- **Códigos fonte (fountain codes) não aumentam a velocidade quando o canal de retorno está ligado.** Eles ajudam muito quando não há retorno, porque acabam com a espera pelos últimos blocos.
- **O limite físico é a câmera:** ela precisa filmar pelo menos duas vezes mais rápido do que a tela troca de quadro. Com câmera de 30 fps, o teto prático fica perto de 15 quadros/s; com 60 fps, perto de 30.

Para dar noção de tempo, um arquivo de 100 MB leva cerca de 4 h 12 min a 6,4 KiB/s, 1 h 20 min a 20 KiB/s, 41 min a 40 KiB/s e 8 min a 200 KB/s.

## Como o Farol 4 está hoje (lido no código)

- Controle de velocidade de 1 a 12 quadros/s, padrão 6 (`index.html`). A conta 6 × 3 × 400 × 11/12 dá 6.600 bytes/s, os 6,4 KiB/s citados. Um em cada 12 quadros repete os metadados.
- Cada bloco vira o texto `F4|B|<64 letras do hash>:<tamanho>|índice|CRC|base64`. São cerca de 620 caracteres para carregar 400 bytes úteis, ou seja, só 64% do QR é arquivo. Isso pede um QR versão 19 ou 20 (93 a 97 quadradinhos de lado) no nível de correção M.
- O leitor roda na linha principal da página, no máximo uma leitura a cada 100 ms (10 por segundo), com imagem de até 1100 px de largura. Em cada leitura ele chama o jsQR três vezes (uma por cor), com a opção `attemptBoth`, que segundo o próprio jsQR custa cerca de 50% a mais de tempo.
- A câmera é pedida em 1440×1080, sem pedir taxa de quadros.
- O teste físico entre dois aparelhos reais continua pendente (`SOBRE.md`), então não existe número medido de velocidade real do Farol.

## Tabela comparativa

| Solução | Velocidade medida e condição | Licença | Navegador sem instalar? |
|---|---|---|---|
| **Farol 4** (este projeto) | 6,4 KiB/s na tela (projeto, não medido em aparelho real) | do site | Sim |
| [Decimen Optical Transfer](https://github.com/bashalarmistalt/decimen-optical-transfer) | 199,2 KB/s celular→celular (2 QR por quadro) e 418,5 KB/s monitor 49"→iPhone 17 Pro Max (4 QR por quadro), arquivo de 1 MB, melhor corrida do autor, 09/08/2026. Artigo de terceiros: 128 KB/s na mão; notebook→celular "alguns KB/s" no padrão e 20–25 KB/s ajustado | AGPL-3.0 desde a v0.4.0 (MIT até a v0.3.0) | Sim |
| [libcimbar](https://github.com/sz3/libcimbar) + app [cfc](https://github.com/sz3/cfc) | 852 kbit/s (~106 KB/s): 4,69 MB em 44 s, modo B (4 cores), receptor Android com Snapdragon 625 | MPL-2.0 | Só o envio (cimbar.org). A leitura exige app Android |
| [RescQR](https://hhannuaa.github.io/papers/tmc2024_hhan.pdf) (artigo IEEE, 2024) | 402 kbit/s úteis (~50 KB/s): QR colorido RGB versão 19, tela a 31 quadros/s, câmera a 60 fps, 45–50 cm | artigo, sem código público | Não (app Android de laboratório) |
| RainBar+, ChromaCode, AirCode (citados no RescQR) | 325 kbit/s a 12 cm; 120 kbit/s; 159 kbit/s úteis | artigos | Não |
| [FrameSend](https://www.pirillo.com/arcade/framesend.html) | "6 a 16 KB por segundo", informado pelo site, sem detalhar aparelhos | não informada (feito sobre o Decimen MIT) | Sim |
| [TXQR](https://github.com/divan/txqr) | Sem fountain: melhor 13 KB em 1,4 s (~9 KB/s), típico 1–2 KB/s. Com fountain LT: 13 KB em 501 ms (~26 KB/s), a 12 quadros/s, 1850 bytes por QR, correção baixa | MIT | Não (app iOS em Go) |
| [Animated QR da Dynamsoft](https://www.dynamsoft.com/codepool/transfer-data-with-animated-qr-codes.html) | 2 a 16 KB/s com arquivo de 16 KB em iPhone SE 2016; 2 a 3 KB/s com arquivo de 231 KB | leitor comercial | Sim, mas com leitor pago |
| [Qrs](https://github.com/qifi-dev/qrs) (qifi-dev) | Não mede velocidade | MIT | Sim |
| [BC-UR / QR animado de carteiras](https://developer.blockchaincommons.com/animated-qrs/) | Não mede velocidade. Feito para dados pequenos (transações) | varia por biblioteca | Depende da carteira |
| [JAB Code](https://github.com/jabcode/jabcode) | Não mede transferência animada. Promete cerca de 3× a densidade de um QR com 8 cores | ver arquivo LICENSE do repositório (não conferido) | Não (biblioteca em C) |
| HCCB / Microsoft Tag | Sem medição. Serviço encerrado em 19/08/2015 | proprietária | Não |
| qr-send (relato em comentário no Hacker News) | Autor afirma ~100 kB/s e diz ter visto ~250 kB/s em 1080p a 60 fps. Não há medição publicada | não conferida | Sim |

Observações sobre a tabela:

- Os números do Decimen, do cimbar e do qr-send vêm dos próprios autores. Não achei medição independente.
- O Qrs aparece em buscas ligado ao Anthony Fu. O repositório é da conta qifi-dev e o README cita a ferramenta de QR dele como referência. Não confirmei a autoria.
- O RescQR é o caso mais parecido com o Farol: também usa QR com três cores sobrepostas. Ele mostra duas coisas úteis. A cor só funcionou até uns 80 cm; mais longe, só preto e branco entregou dados. E um leitor comum para de ler quando a tela troca de quadro mais rápido que metade da taxa da câmera.

## O que cada frente da pesquisa mostrou

### 1. Códigos fonte (fountain codes)

A ideia: em vez de mandar o bloco 1, 2, 3…, cada quadro leva uma mistura de blocos. O receptor junta qualquer conjunto um pouco maior que o original e reconstrói o arquivo, sem precisar de um bloco específico.

- **Frente a pedir os faltantes pelo canal de retorno (o caso normal do Farol):** quase não há ganho. Pedir exatamente o que falta já é o método mais econômico. O Farol tirou os fountain codes na versão 4 por esse motivo e a decisão continua certa.
- **Frente a repetir em volta, sem retorno:** o ganho é grande. Conta minha, não medição: perdendo 30% dos blocos por passada, um arquivo de 1.000 blocos precisa de umas 6 passadas completas para pegar os últimos; com fountain bastaria cerca de 1,5 passada. Em arquivo de 100 MB a diferença sobe para perto de 10 passadas contra 1,6.
- **Medição real disponível:** só a do TXQR, que passou de 1,4 s para 0,5 s no melhor caso com 13 KB, e relata que a variação do tempo "despencou".

Bibliotecas que rodam no navegador:

| Biblioteca | O que é | Sobra necessária | Licença |
|---|---|---|---|
| [luby-transform](https://github.com/qifi-dev/qrs/tree/main/packages/luby-transform) | LT em JavaScript puro | "um pouco mais" que o original, sem número; o Decimen, com LT próprio, cita ~15% | MIT |
| [wirehair](https://github.com/catid/wirehair) (há pacote `wirehair-wasm` no npm, v1.0.5) | Fountain em C compilado para WASM | média de N + 0,02 blocos; até 64.000 blocos | BSD-3 (biblioteca C); a do pacote WASM não foi conferida |
| [raptorq](https://github.com/cberner/raptorq) (Rust; há builds WASM de terceiros) | RaptorQ, padrão RFC 6330 | 99,6% de chance com exatamente N blocos, 99,998% com N+1 | Apache-2.0 |

Cuidados: o wirehair aceita no máximo 64.000 blocos, e o Farol chega a 250.000 em 100 MB, então seria preciso aplicar por partes de 8 MiB (divisão que o Farol já usa na interface). O RaptorQ tem histórico de patentes da Qualcomm; a página de patentes do IETF bloqueou a consulta, então a situação atual não foi conferida.

### 2. Leitores mais rápidos que o jsQR

| Leitor | Pontos principais | Licença |
|---|---|---|
| [jsQR](https://github.com/cozmo/jsQR) (atual) | JavaScript puro, um QR por chamada, devolve os cantos e os bytes crus. `attemptBoth` custa ~50% | Apache-2.0 |
| [BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) (nativo) | Vários códigos por imagem, devolve os quatro cantos, funciona em Web Worker. O valor lido vem como texto | do navegador |
| [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) (zxing-cpp) | Vários códigos por imagem (`maxNumberOfSymbols`), tem versão de script simples sem empacotador, arquivo WASM de ~1,04 MiB que pode ser hospedado junto do site | MIT + Apache-2.0 |
| [zbar-wasm](https://github.com/undecaf/zbar-wasm) | ~330 kB, vários códigos por quadro, roda em worker, carrega por `<script>` | LGPL-2.1 |
| [nimiq/qr-scanner](https://github.com/nimiq/qr-scanner) | Usa o BarcodeDetector quando existe e um motor próprio em Web Worker quando não existe; padrão de 25 leituras/s; desenha o contorno do código | MIT |
| [qr-scanner-wechat](https://github.com/antfu/qr-scanner-wechat) | OpenCV + modelo do WeChat; lê códigos difíceis; ~2,5 MB comprimido | MIT |

Suporte do BarcodeDetector em 2026 (caniuse e documentação do Chrome):

- Funciona: Chrome e Edge no Android (precisa do Google Play Services), no macOS e no ChromeOS; Samsung Internet; Opera Mobile.
- Não funciona: Firefox (nenhuma versão), Safari no iPhone e no Mac (existe mas vem desligado, da versão 17 à 27).
- Chrome no Windows e no Linux: a documentação do Chrome não lista essas plataformas e relatos indicam que não funciona. Não achei fonte oficial recente dizendo o contrário.
- Conclusão: serve como atalho no Android, mas o iPhone obriga a ter um leitor em WASM de qualquer jeito.

Números de velocidade de leitura encontrados:

- zxing-wasm: mediana de 74 ms por imagem em 7.894 fotos reais de códigos (teste da Dynamsoft). São fotos difíceis, não QR nítido em tela, então serve só como ordem de grandeza.
- jsQR contra quirc em WASM: ~47 ms contra ~29 ms em média, com picos de 1 segundo no jsQR; com Web Worker a linha principal ficou ocupada só ~6 ms por leitura. Fonte: artigo da Tokopedia, lido pelo resumo da busca porque a página bloqueou o acesso direto.
- zbar-wasm e qr-scanner-wechat não publicam números.
- Não existe comparação direta entre todos eles lendo QR em tela. O jeito certo é medir no próprio Farol.

O Decimen confirma o desenho que funciona: zxing-cpp em WASM dentro de vários workers; quando todos estão ocupados o quadro é descartado ("um quadro velho vale menos que o próximo"); e depois de achar o código uma vez, ele lê só o recorte onde o código estava.

### 3. Ajustes no próprio formato

- **Bytes puros em vez de base64.** O base64 gasta 4 letras para cada 3 bytes. O gerador usado pelo Farol (`qrcode-generator`) já grava bytes crus, e o jsQR devolve `binaryData`. Somando um cabeçalho curto (uns 13 bytes no lugar de ~90 letras), o mesmo QR versão 20 nível M levaria ~653 bytes úteis no lugar de 400: **+63%**. No nível L, ~845 bytes: **+111%**.
- **Nível de correção.** O TXQR mediu que o nível baixo (L) ganhou. O Decimen usa L por padrão. Atenção: no Farol as três cores se misturam um pouco na câmera, e isso gera erros que o nível M corrige. Só teste dirá se o L aguenta.
- **Densidade do QR.** O Decimen usa a versão 40 (177 de lado, 2.953 bytes), mas avisa que isso só funciona de celular para celular bem perto e "é exatamente o que falha num monitor comum à distância de um braço". Para monitor recomenda a versão 27 (1.465 bytes). O Farol está na versão 19–20, então há espaço, mas QR colorido pede mais pixels por quadradinho do que preto e branco.
- **Quadros por segundo.** Regra confirmada em três fontes (LightSync, RescQR, Decimen): a câmera precisa filmar pelo menos o dobro da taxa da tela. No Decimen, tela de 60 Hz mostrando 60 quadros/s teve só 20% a 40% dos quadros lidos; a recomendação lá é 24 a 30. No iPhone, pedir `frameRate: {ideal: 60}` entrega 30 em silêncio; é preciso pedir `{exact: 60}`, que funciona em 1280 de largura. O TXQR achou 6–7 quadros/s o melhor ponto sem fountain e 11–12 com fountain.
- **Mais de 3 canais de cor.** Tela e câmera só têm três cores primárias. Mais "cores" significa vários níveis de brilho por canal, o que deixa de ser QR e pede leitor próprio. O cimbar testou 8 cores (943 kbit/s contra 852 com 4 cores) e removeu o modo na versão 0.6.0.
- **Mais QR por quadro.** O Decimen oferece 1, 2, 4 ou 6 códigos lado a lado; os recordes dele usam 2 e 4. Cada código é independente. Só vale quando a câmera tem resolução sobrando, na prática em monitor grande.
- **Compressão.** Decimen aplica gzip só quando o arquivo encolhe; cimbar usa zstd. O navegador já tem `CompressionStream`. Para MP4, JPEG e ZIP o ganho é zero; para texto e planilhas é grande.

### 4. Moldura que acompanha o QR na câmera

Como o Telegram faz (código aberto do app Android, `CameraScanActivity.java`):

- Sem código à vista, mostra um quadrado no centro com lado igual ao menor lado da imagem dividido por 1,5.
- Quando o leitor acha o código, pega os quatro cantos, calcula o retângulo em volta e soma uma folga.
- A moldura desliza da posição antiga para a nova em 75 ms a cada detecção. É isso que dá a sensação de "grudar" no código sem tremer.
- Só os quatro cantos são desenhados, brancos, arredondados, com 4 dp de espessura e 20 dp de comprimento. O lado de fora da moldura fica escurecido com preto a 50%.
- A moldura só volta ao centro depois de mais de 4 leituras seguidas sem achar nada.

O Farol já tem a base nesta árvore de trabalho (`public/farol4/qr-overlay.mjs`): converte os cantos do jsQR para a tela e desenha o contorno com cantos grossos, verde ou âmbar. O que falta para ficar igual ao Telegram é pouco:

1. Guardar os cantos anteriores e os novos, e desenhar num laço próprio de `requestAnimationFrame`, interpolando entre os dois durante ~75 ms. Hoje o desenho só muda quando chega uma leitura, por isso pula.
2. Manter a última posição por algumas leituras falhas antes de apagar (hoje apaga em 450 ms) e voltar suave para um quadrado central.
3. Opcional: escurecer o lado de fora e arredondar os cantos com `arcTo`.

Qualquer leitor serve para isso: o jsQR devolve `location`, o BarcodeDetector devolve `cornerPoints`, o zxing devolve a posição. O nimiq/qr-scanner faz o mesmo com um SVG por cima do vídeo.

## Recomendações para o Farol 4, em ordem

Antes de tudo: rodar o teste físico pendente e anotar a velocidade real de hoje. Sem esse número não dá para saber quanto cada mudança rendeu.

1. [ ] **Aliviar o leitor atual, sem trocar de biblioteca.** Usar `dontInvert` no lugar de `attemptBoth` (conferir antes que o QR de pareamento também é escuro sobre claro), reaproveitar os três vetores de pixels em vez de criar a cada leitura, ler só o recorte onde o QR foi achado da última vez, e tirar a trava de 100 ms usando `requestVideoFrameCallback`.
   - Ganho esperado: até ~2× se o leitor for o gargalo, porque permite subir de 6 para 10–12 quadros/s.
   - Esforço: pequeno. Risco: baixo.
2. [ ] **Bytes puros e cabeçalho curto (protocolo versão 5).** Trocar base64 por bytes, e o hash de 64 letras por um identificador curto de 4 bytes dentro de cada bloco (o hash completo continua nos metadados).
   - Ganho esperado: +50% a +60% no nível M com o mesmo tamanho de QR; até ~2× se o nível L aguentar.
   - Esforço: pequeno a médio. Risco: médio. Não conversa com a versão 4, então os dois aparelhos precisam atualizar; o nível L pode falhar com cor; o BarcodeDetector devolve texto, então a leitura de bytes precisa ser testada nele.
3. [ ] **Leitura em Web Workers com zxing-wasm**, um worker por cor, usando o BarcodeDetector nativo onde existir. Quadro que chega com os workers ocupados é descartado.
   - Ganho esperado: sustentar 12–15 quadros/s com câmera de 30 fps e 24–30 com câmera de 60 fps, ou seja, 2× a 4× sobre hoje. Também destrava a interface durante a leitura.
   - Esforço: médio. Risco: médio (1 MiB de WASM por worker, memória em celular antigo, hospedar o arquivo junto do site).
4. [ ] **Dois ou quatro QR coloridos por quadro em tela grande**, com opção na interface e padrão de um só no celular.
   - Ganho esperado: 2× (ou 4×) de monitor para celular.
   - Esforço: médio. Risco: médio. Depende do item 3, porque o jsQR só lê um código por imagem.
5. [ ] **Pedir 60 fps à câmera e liberar o controle até 24–30 quadros/s**, mantendo a redução automática que já existe.
   - Ganho esperado: até 2× sobre o item 3 em celulares que entregam 60 fps.
   - Esforço: pequeno. Risco: médio (o iPhone exige `exact: 60` e resolução menor; imagem mais escura).
6. [ ] **Blocos de reparo com fountain code quando não há canal de retorno.** Os blocos numerados continuam; depois da primeira passada o transmissor passa a mandar misturas. Usar `luby-transform` (MIT) ou wirehair em WASM, por partes de 8 MiB.
   - Ganho esperado: nenhum com retorno ligado; sem retorno, corta o tempo final em várias vezes (ver a conta da seção 1).
   - Esforço: médio a grande. Risco: médio (memória, e o receptor precisa de um caminho novo de decodificação).
7. [ ] **Compressão gzip quando o arquivo encolher**, com `CompressionStream` do navegador.
   - Ganho esperado: zero em vídeo, foto e ZIP; grande em texto.
   - Esforço: pequeno. Risco: baixo.
8. [ ] **Suavizar a moldura do QR** (seção 4). Não muda a velocidade, melhora o enquadramento, que é o que mais derruba a leitura.
   - Esforço: pequeno. Risco: baixo.

Somando os itens 1 a 3, a estimativa é sair de 6,4 para algo perto de 20 KiB/s; com o item 4 em monitor, perto de 40 KiB/s. São contas sobre o formato, não medições.

## O que não vale a pena

- **Adotar o cimbar.** É o mais rápido medido, mas a leitura só existe em app Android nativo (C++ com OpenCV). Portar o leitor para o navegador é um projeto grande, e o limite dele é 33 MB por arquivo.
- **Copiar código do Decimen atual.** Desde a v0.4.0 a licença é AGPL-3.0, que obriga a publicar o Farol sob a mesma licença. As ideias podem ser usadas; o código, só o da versão MIT (até a v0.3.0).
- **JAB Code e HCCB.** Não têm leitor para navegador nem medição de transferência animada. O HCCB foi encerrado em 2015.
- **Mais de três cores ou vários níveis por cor.** Exige leitor próprio, e o cimbar abandonou as 8 cores por ganho pequeno. O RescQR mostra que a cor já é a parte mais frágil com a distância.
- **Trocar o canal de retorno por fountain codes.** Com retorno, pedir os faltantes já é o mais econômico. Fountain entra só como reserva (item 6).
- **RaptorQ.** Mais pesado e com histórico de patentes. LT ou wirehair resolvem.
- **QR versão 40 em monitor.** O próprio Decimen diz que falha à distância de um braço.
- **Subir os quadros por segundo acima da metade da taxa da câmera.** Os quadros chegam misturados e a leitura cai em vez de subir.
- **BC-UR.** Feito para dados pequenos de carteiras, com codificação em texto, e sem velocidade medida.
- **qr-scanner-wechat (OpenCV).** Pesa 2,5 MB comprimido e é pensado para fotos difíceis, não para velocidade.
- **Usar o nimiq/qr-scanner inteiro.** Ele controla a câmera por conta própria e devolve um código só, o que não encaixa na leitura de três cores. As ideias (worker, nativo quando existe) valem.

## Links consultados (13/11/2026)

Projetos de transferência tela→câmera:

- https://github.com/bashalarmistalt/decimen-optical-transfer
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/README.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/benchmarks/records.json
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/technical/architecture.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/technical/protocol.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/technical/platform-quirks.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/technical/diagnostics.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/user/sending.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/docs/user/troubleshooting.md
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/shared/send-settings.ts
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/shared/worker-pool.ts
- https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/main/vendor/decimen-codec/NOTICE.md
- https://betterstack.com/community/guides/linux/decimen-optical/
- https://www.tomshardware.com/networking/streaming-qr-codes-at-60-fps-achieves-nearly-190-kb-s-data-rate-in-phone-to-phone-tests-browser-based-method-requires-no-app-no-networking-no-pairing-and-no-permissions-beyond-camera-access (só o título foi lido)
- https://github.com/sz3/libcimbar
- https://raw.githubusercontent.com/sz3/libcimbar/master/README.md
- https://raw.githubusercontent.com/sz3/libcimbar/master/PERFORMANCE.md
- https://raw.githubusercontent.com/sz3/libcimbar/master/DETAILS.md
- https://github.com/sz3/cfc
- https://github.com/divan/txqr
- https://divan.dev/posts/animatedqr/
- https://divan.dev/posts/fountaincodes/
- https://github.com/qifi-dev/qrs
- https://raw.githubusercontent.com/qifi-dev/qrs/main/README.md
- https://www.pirillo.com/arcade/framesend.html
- https://www.dynamsoft.com/codepool/transfer-data-with-animated-qr-codes.html
- https://hn.svelte.dev/item/48234287 (discussão no Hacker News sobre o ShadowCat, com o relato do qr-send)
- https://hhannuaa.github.io/papers/tmc2024_hhan.pdf (RescQR, IEEE Transactions on Mobile Computing, maio de 2024)
- https://developer.blockchaincommons.com/animated-qrs/
- https://docs.rs/crate/bc-mur/0.1.0
- https://github.com/jabcode/jabcode
- https://en.wikipedia.org/wiki/High_Capacity_Color_Barcode

Códigos fonte:

- https://github.com/qifi-dev/qrs/tree/main/packages/luby-transform
- https://github.com/catid/wirehair
- https://www.pkgstats.com/pkg:wirehair-wasm
- https://github.com/cberner/raptorq
- https://datatracker.ietf.org/ipr/search/?rfc=6330&submit=rfc (bloqueou a consulta, erro 403)

Leitores de QR:

- https://github.com/cozmo/jsQR
- https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
- https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
- https://caniuse.com/mdn-api_barcodedetector
- https://developer.chrome.com/docs/capabilities/shape-detection
- https://github.com/Sec-ant/zxing-wasm
- https://cdn.jsdelivr.net/npm/zxing-wasm/README.md
- https://github.com/Sec-ant/barcode-detector
- https://github.com/undecaf/zbar-wasm
- https://github.com/nimiq/qr-scanner
- https://github.com/danimoh/qr-scanner-benchmark (a página não mostra os números)
- https://github.com/antfu/qr-scanner-wechat
- https://www.dynamsoft.com/codepool/benchmark-barcode-reading-javascript-zxing-wasm-dynamsoft-barcode-reader.html (lido pelo resumo da busca)
- https://medium.com/tokopedia-engineering/building-60-fps-qr-scanner-for-the-mobile-web-eb0deddce099 (bloqueou a leitura direta; números vindos do resumo da busca)

Moldura do leitor:

- https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/java/org/telegram/ui/CameraScanActivity.java

Páginas que falharam e não entraram como fonte: npmjs.com (erro 403 para `luby-transform` e `wirehair-wasm`), chromestatus.com (veio vazia), zxing-wasm.deno.dev (fora do ar).
