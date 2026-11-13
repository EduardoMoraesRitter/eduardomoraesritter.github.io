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

- [ ] Pesquisa: existe solução que transfere mais rápido? → `docs/pesquisa-farol4-transferencia-mais-rapida-2026-11-13.md`
- [x] Mostrar a velocidade em unidades fáceis: quadros por segundo, QR por segundo, blocos por segundo e dados por minuto — `speed-meter.mjs`, medido de verdade (janela de 5 s), não só o valor configurado
  - envio: "Na tela: 6.0 quadros/s · 17 QR/s · 403 kB/min · No receptor: 9.9 blocos/s · 237 kB/min"
  - recepção: "Leitura: 23 QR/s · 8.9 blocos novos/s · 213 kB/min" (QR/s conta também as leituras repetidas)
- [x] Na câmera do receptor, moldura em volta do QR encontrado — `qr-overlay.mjs`: verde quando centralizado e no tamanho certo, amarela quando fora do centro, pequeno demais ou perto demais; some 0,45 s depois de perder o QR
- [x] Testado no navegador (13/11/2026) com câmera simulada (a tela do envio espelhada como vídeo): moldura verde no QR centralizado, amarela com o QR deslocado para o canto, e acompanha o zoom digital (diferença de cerca de 1 módulo do QR). Falta conferir com a câmera de um celular de verdade
- [x] Testes de unidade: `tests/farol4-speed-overlay.test.mjs` (4 testes) · suíte farol4 inteira: 42 passam, 1 pulado (Supabase ao vivo, já era pulado)
- [x] Commit
