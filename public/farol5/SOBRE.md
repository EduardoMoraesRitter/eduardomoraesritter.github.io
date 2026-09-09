# Farol 5 — QR com retorno por som

Versão experimental independente do Farol 4. O computador mostra blocos RGB em QR; o celular responde pelo alto-falante e o computador escuta pelo microfone. Não utiliza Supabase nem outro servidor de mensagens.

## Teste em dois aparelhos

1. Abra `/farol5/` no computador e no celular. Comece com um arquivo de 1–10 kB.
2. No computador, escolha **Enviar arquivo**, ative o microfone e selecione o arquivo.
3. No celular, escolha **Receber arquivo** e **Ativar som e câmera**. Autorize a câmera, deixe o volume de mídia ligado e retire os fones.
4. Aponte para o QR inteiro e mantenha o alto-falante próximo ao microfone do computador. O envio aguarda o primeiro retorno sonoro.
5. Espere a confirmação nos dois aparelhos e salve o arquivo verificado no celular.

O som é audível. Cada retorno leva alguns segundos; ruído, volume, distância e processamento do microfone influenciam o resultado. Esta versão precisa de teste físico em cada combinação de aparelhos. Não promete compatibilidade universal. Os relógios devem estar ajustados automaticamente: mensagens com diferença superior a 60 segundos são rejeitadas.

## Funcionamento

- QR inicial: identificação do arquivo e código aleatório da sessão.
- Arquivo: blocos de 400 bytes, três canais RGB por quadro, CRC por bloco e SHA-256 final.
- Som: quantidade recebida e até 16 índices faltantes por pedido; comandos de pausa, retomada e conclusão. O transmissor envia apenas o lote solicitado e volta a mostrar o QR de estado.
- Retorno autenticado por HMAC-SHA256 com etiqueta de 8 bytes, sequência e validade temporal. Não é criptografia do arquivo. Quem consegue ler o QR da sessão pode obter seu código; use em ambiente controlado.
- Pausa no celular chega ao computador por som; pausa no computador e confirmações chegam ao celular pelo QR. Mantenha a câmera aberta até a confirmação final.
- IndexedDB `farol5`: conserva bytes, blocos e tempos no navegador. Após recarregar, selecione o mesmo arquivo no computador e leia seu novo QR; o celular informa os faltantes. O navegador pode remover armazenamento local. Só o arquivo baixado é uma cópia permanente.
- A página e seus recursos precisam carregar pela internet inicialmente. A transmissão entre páginas já carregadas não usa rede. Não há instalação offline/service worker nesta versão.

O limite técnico é 32 MiB, mas o retorno acústico por lotes pequenos prioriza experimentar a confiabilidade. Arquivos grandes podem levar muito tempo. O V4 continua disponível sem alterações.

## Dependências

- ggwave: https://github.com/ggerganov/ggwave — MIT, `vendor/LICENSE-ggwave.txt`.
- Distribuição JavaScript/WASM local obtida em 2026-09-09 de https://ggwave-js.ggerganov.com/ggwave.js. SHA-256: `b0f15dcda2537a43fc67f1298845273c6e0015dca3eca97539616a548513e7e2`.
- Integração baseada no exemplo oficial `examples/ggwave-js`, usando AudioWorklet para a captura. Protocolo audível FAST, amostragem de 48 kHz. O WASM está embutido no arquivo JavaScript.
- qrcode e jsQR: cópias locais, licenças em `vendor/`.

## Validação

Testes automatizados cobrem autenticação, rejeição de mensagens alteradas/repetidas/antigas, retomada seletiva, integridade do arquivo e conversão real ggwave de mensagem em PCM e de PCM em mensagem. O teste de navegador usa câmera e entrada de áudio sintéticas; não substitui o teste acústico entre alto-falante e microfone reais.
