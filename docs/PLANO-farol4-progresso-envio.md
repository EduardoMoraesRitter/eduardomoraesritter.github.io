# Farol 4 · progresso no lado que envia

Pedido (13/11/2026): o lado que envia não mostra o tempo nem a barra de percentual, como o lado que recebe.

Antes: o envio só tinha os contadores "Total / Próximo / Enviados" e uma frase do receptor.

## Parte 1 · painel de progresso no envio

- [x] Sender conta quantos blocos diferentes já passaram na tela (`covered`) — `protocol.mjs`
- [x] Módulo `send-progress.mjs` calcula percentual, tempo restante e velocidade, com teste em `node --test` (4 testes, todos passam)
  - com retorno da sala: usa os blocos confirmados pelo receptor
  - sem retorno: usa os blocos já transmitidos e estima o tempo pela velocidade de quadros
- [x] Painel no envio: `x / total blocos`, percentual, barra, tempo restante, velocidade, resumo de tempo (total, transmitindo, pausas). Fica logo acima do seletor de arquivo no computador e logo abaixo do QR no celular; só aparece com arquivo escolhido
- [x] Zera a contagem ao trocar de arquivo e ao recomeçar do bloco 1; 100% e "Concluído" ao receber "done"
- [x] Testado no navegador (13/11/2026), arquivo de 200 kB, 500 blocos:
  - envio sozinho: "117 / 500 blocos transmitidos · 23% · ~24 s (1ª volta) · 6.4 KiB/s na tela"
  - envio + recepção na mesma sala: "159 / 500 blocos confirmados · 31% · ~30 s · 4.5 KiB/s", terminando em "500 / 500 · 100% · Concluído"
- [x] Commit

## Parte 2 · pedidos seguintes (13/11/2026)

- [x] Pesquisa: existe solução que transfere mais rápido? → `docs/pesquisa-farol4-transferencia-mais-rapida-2026-11-13.md`
- [x] Mostrar a velocidade em unidades fáceis: quadros por segundo, QR por segundo, blocos por segundo e dados por minuto — `speed-meter.mjs`, medido de verdade (janela de 5 s), não só o valor configurado
  - envio: "Na tela: 6.0 quadros/s · 17 QR/s · 403 kB/min · No receptor: 9.9 blocos/s · 237 kB/min"
  - recepção: "Leitura: 23 QR/s · 8.9 blocos novos/s · 213 kB/min" (QR/s conta também as leituras repetidas)
- [x] Na câmera do receptor, moldura em volta do QR encontrado — `qr-overlay.mjs`: verde quando centralizado e no tamanho certo, amarela quando fora do centro, pequeno demais ou perto demais; some 0,45 s depois de perder o QR
- [x] Testado no navegador (13/11/2026) com câmera simulada (a tela do envio espelhada como vídeo): moldura verde no QR centralizado, amarela com o QR deslocado para o canto, e acompanha o zoom digital (diferença de cerca de 1 módulo do QR). Falta conferir com a câmera de um celular de verdade
- [x] Testes de unidade: `tests/farol4-speed-overlay.test.mjs` (4 testes) · suíte farol4 inteira: 42 passam, 1 pulado (Supabase ao vivo, já era pulado)
- [x] Commit

## Parte 3 · envio e recepção conversando sobre velocidade (13/11/2026)

Pedido: os dois lados se comunicarem e mostrarem num canto "aumenta a velocidade" / "diminui a velocidade".

Antes: pela sala só passavam pedidos de blocos, pausa e confirmação. Sobre velocidade só existia a redução automática quando a leitura travava.

- [x] `speed-advice.mjs`: conselho calculado com o que o receptor mede (imagens da câmera analisadas por segundo, blocos novos por segundo) contra o que o envio mostra (quadros e QR por segundo); 5 testes em `node --test`
  - "pode aumentar": 90% ou mais dos QR viram blocos novos e a câmera tem folga
  - "diminua": a tela troca mais rápido do que a câmera analisa, ou menos de 55% dos QR viram blocos novos
  - "não é a velocidade": leitura fraca mesmo com cada quadro visto duas vezes → ajustar distância, foco e brilho
- [x] Receptor manda as medidas junto do pedido de blocos (`scans`, `fresh`); envio calcula o conselho e devolve para o receptor (mensagem `speed`)
- [x] Quadro de velocidade nos dois lados: velocidade atual em quadros/s, conselho e botões "Mais devagar" / "Mais rápido"; no receptor os botões pedem a mudança ao envio (mensagem `speed_request`)
- [x] Selo no canto da câmera do receptor com a velocidade e o conselho ("6 quadros/s · diminua")
- [x] Testado no navegador (13/11/2026), envio e recepção na mesma sala com câmera simulada: os dois lados mostraram "Diminua a velocidade: a câmera analisa 1.0 imagens/s e a tela troca 6.0 vezes/s"; o botão "Mais devagar" do receptor baixou o envio de 6 para 5 quadros/s com o aviso "Receptor pediu menos velocidade". O conselho "pode aumentar" só foi conferido no teste de unidade. Suíte farol4: 47 passam, 1 pulado
- [x] Commit

## Pesquisa

- [x] `docs/pesquisa-farol4-transferencia-mais-rapida-2026-11-13.md` (13 soluções comparadas, 8 recomendações em ordem, 70 links). Resposta curta: dá para ir 3 a 6 vezes mais rápido mexendo só no Farol (estimativa, não medição)

## Parte 4 · qual das 3 opções rende mais (13/11/2026)

Pergunta: qual das três opções da pesquisa dá mais ganho, e testar uma delas.

Medição: 40 frames reais do envio (606×606, três canais por quadro), no navegador, aba em primeiro plano. Cada caso rodou 3 vezes.

- [x] Opção 1, parte A: trocar `attemptBoth` por `dontInvert`. Resultado: **sem ganho** (66 ms por quadro nos dois casos). O jsQR só tenta a versão invertida quando a primeira passada falha, e nesse envio o QR sempre é achado na primeira. O "até 50% a mais" da pesquisa vale só para canal sem QR.
- [x] Opção 1, parte B: reaproveitar os três vetores de pixels. Resultado: ganho desprezível (cerca de 2,5 ms de 66 ms). Não foi commitado.
- [x] Opção 1, parte C: ler a imagem reduzida. Resultado: 0,75× dá cerca de 25% a menos de tempo por quadro; 0,5× dá cerca de 50% a menos, e os três canais continuam sendo lidos. **Não testado no celular**: aqui o QR ocupa o quadro inteiro; com a câmera longe pode perder detalhe.
- [x] Conclusão: o gargalo é o próprio jsQR (cerca de 22 ms por chamada, a 606 px). Em celular, a imagem é maior, então o gargalo fica pior.
- [ ] Próximo passo a decidir: testar a opção 3 (leitor mais rápido em paralelo) ou a parte C da opção 1 (ler em resolução menor só quando o QR estiver grande) no celular.

Obs.: a medição de "imagens/s" da parte 3 (quadro "Diminua a velocidade") foi feita com o receptor em aba em segundo plano, onde o navegador desacelera a leitura da câmera. Esse número não serve para decidir; refazer em aba visível antes de confiar no conselho.
