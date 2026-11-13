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

## Parte 5 · opção 3: leitor zxing-wasm (13/11/2026)

Pergunta: a opção 3 (leitor mais rápido, em paralelo) rende quanto?

Teste: zxing-wasm 3.1.6 (publicado em 19/10/2026, MIT, arquivo WASM de 947 kB), carregado só para o teste, sem entrar no site. Mesmos frames reais do envio (40 quadros a 606 px; 10 quadros ampliados a 1100 px para simular a câmera). Cada canal lido como imagem em tons de cinza. Aba em primeiro plano. Máquina: notebook, não celular.

| Leitor | 606 px | 1100 px (ampliado) |
|---|---|---|
| jsQR (atual) | 74 ms por quadro, 3/3 canais | 174 ms, 3/3 canais |
| zxing, uma thread | 9,7 ms, 3/3 canais | 30 ms, 3/3 canais |
| zxing, 3 workers (um por canal) | 11 ms (mais lento que uma thread: custo de mensagem) | 16 ms |

- [x] zxing-wasm leu os 3 canais em todos os quadros: sem perda em relação ao jsQR.
- [x] Teto do lado que envia: a tela mostra 12 quadros/s (33 QR/s) neste notebook. O transmissor não é o limite até 12.
- [x] Conclusão: com jsQR, a 1100 px, o leitor aguenta cerca de 6 leituras por segundo, ou seja, o padrão de 6 quadros/s já está no limite. Com zxing em uma thread, cerca de 33 por segundo; com workers, cerca de 60.
- [ ] Limites desta medição: notebook, não celular (celular é mais lento, então o ganho real é menor, mas a folga dos workers protege); a 1100 px os frames foram ampliados, então não provam leitura em câmera real.
- [ ] Para chegar a 12 quadros/s no app, é preciso tirar a trava de 100 ms do leitor (hoje limita a 10 leituras por segundo).
- [ ] Custo para o site: arquivo WASM de 947 kB, mais o código de workers. Não implementado ainda.
- [x] Teste temporário apagado do projeto; nada foi commitado além deste registro.

## Parte 6 · gargalo do receptor (13/11/2026)

Pergunta: por que o receptor no app não acompanha o leitor isolado?

Achados:
- [x] Dentro do app, cada varredura do leitor (3 canais em workers) leva cerca de 45 ms, com 3 pacotes por varredura. Processar os pacotes leva ~0,1 ms. O leitor não é o gargalo com 1100 px. Pela conta, cabe cerca de 20 quadros/s.
- [x] A taxa de animação (`requestAnimationFrame`) do Chrome de teste ficou em 5 por segundo, mesmo com a aba visível e com foco. Esse número é do ambiente de teste, não do celular. Com um timer de 16 ms no lugar, o laço rodou ~13 vezes por segundo.
- [x] A renderização do transmissor também depende da animação: com a taxa baixa, os quadros capturados ficavam iguais. Medições anteriores de "imagens/s" em aba oculta ou com animação lenta não valem.
- [ ] Não consegui fechar o número de blocos aceitos por segundo no app. Causas de teste: receptor preso ao arquivo da medição anterior e transmissor que nem sempre inicia na mesma página. Refazer em página nova, com arquivo de bytes fixos, sem dividir a página entre transmissor e receptor.
- [ ] Instrumentação temporária removida de `app.mjs` (volta à versão com workers, sem marcas de tempo). Nada disso foi commitado.

## Parte 7 · teste 6 contra 12 quadros/s (13/11/2026)

Pergunta: subir o envio de 6 para 12 quadros/s aumenta os blocos recebidos por segundo?

Método: página nova para cada medição, arquivo de bytes aleatórios próprio. 60 quadros reais capturados do transmissor no ritmo testado. Câmera simulada que repete esses quadros no mesmo ritmo do transmissor, com `requestFrame()` a cada quadro. Animação trocada por timer de 16 ms só no teste.

Resultado:
- [x] 6 quadros/s: 11,3 blocos novos/s (leitura de 41 QR/s, cerca de 12 varreduras/s).
- [x] 12 quadros/s: 11,3 blocos novos/s (leitura de 35 QR/s, cerca de 12 varreduras/s).
- [x] Conclusão: o receptor é que limita. Ele faz ~12 varreduras por segundo nos dois casos, e 12 quadros/s não ganha nada enquanto a varredura não ficar mais rápida.
- [ ] Causa provável: cada varredura espera o próximo quadro de animação (16 ms) e leva ~45 ms (preparação dos canais, cópia para os workers, leitura). Ver se a espera pode ser tirada e se a cópia pode ser reduzida.
- [ ] Ainda não medido no celular, onde a animação roda perto de 60 Hz e a leitura pode ser mais lenta.
- [x] Teste feito em uma única página (transmissor e receptor juntos, câmera simulada). Números para comparar entre versões, não valor absoluto de velocidade real.
