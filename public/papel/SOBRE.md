# Papel

Bloco de texto estático para GitHub Pages, com três folhas e conexão WebRTC DataChannel entre dois navegadores. Sem API própria, login, banco online ou dependências externas de JavaScript.

## Conectar

1. Abra `/papel/` nos dois dispositivos.
2. No primeiro, clique em Conectar outro dispositivo e Criar convite. Envie o código completo por um canal de confiança.
3. No segundo, cole o convite em Código recebido e clique em Responder convite. Envie a resposta de volta.
4. No primeiro, cole a resposta e clique em Aplicar resposta. Aguarde Conectado nos dois.
5. Escreva em qualquer folha. Os três números identificam as mesmas folhas nos dois dispositivos.

## Limitações

Internet é necessária entre redes diferentes. STUN público do Google ajuda na descoberta de endereço; o texto é enviado no canal WebRTC criptografado, diretamente quando a rede permite. Não há TURN: redes que bloqueiam conexão direta podem impedir o funcionamento. Não há promessa de funcionamento offline entre máquinas.

Os códigos de conexão contêm metadados de rede. Compartilhe apenas com a pessoa desejada. As três folhas são compartilhadas com esse dispositivo; não são salas públicas acessíveis por nome. Ter o mesmo endereço do site não conecta as pessoas automaticamente.

Cada folha aceita até 12.000 unidades UTF-16 de texto. Edições usam versões lógicas e desempate determinístico. Edições simultâneas da mesma folha não são mescladas: uma versão completa prevalece. Ao conectar, as versões locais são comparadas; exporte textos importantes antes de juntar dispositivos com notas diferentes. Não é um editor colaborativo com CRDT.

localStorage preserva as cópias em cada navegador. Limpar dados do site ou usar navegação privada pode apagar essas cópias. Não há armazenamento central. Fechar/recarregar exige novo pareamento. Uma terceira máquina precisa de uma nova conexão com uma máquina que possua as notas.

## Testes

`node --test tests/papel.test.mjs`

Os testes unitários verificam isolamento das folhas, recuperação, sincronização bidirecional, ordem das mensagens, conflitos e validação de códigos. O teste de navegador está em `tests/papel-browser.cjs` e exige Playwright instalado: `node tests/papel-browser.cjs`. Inicie o site em `http://127.0.0.1:4337` antes; `PAPEL_URL` permite testar outra URL.
