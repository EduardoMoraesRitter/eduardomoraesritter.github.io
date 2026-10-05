# Papel

Bloco de texto estático para GitHub Pages, com três folhas e duas formas de conexão: Supabase Realtime por link e WebRTC DataChannel por pareamento manual. Sem API própria, login ou banco de notas online. Reutiliza o SDK Supabase 2.91.0 vendorizado no Farol 4, com licença MIT.

## Sala online por link

## Salas com nome curto

Abrir `/papel/` sem parâmetros conecta automaticamente à sala pública `papel-publico`, na Folha 01, sem abrir painel ou pedir códigos. Todos que abrem esse endereço compartilham as três folhas dessa sala. As salas protegidas e os links específicos continuam abrindo seus próprios destinos. A sala pública não oferece armazenamento central: para recuperar o texto em um aparelho novo, algum navegador com uma cópia precisa estar conectado.

Em Conectar outro dispositivo, informe um nome de 2 a 24 letras sem acentos, números ou hífen, como `mesa1`. Escolha Pública ou Protegida por senha e clique em Criar ou entrar. Os demais aparelhos informam o mesmo nome e tipo. Uma sala com senha exige também a mesma senha, com pelo menos 12 caracteres.

Não há cadastro de sala, dono, reserva de nome ou recuperação de senha. A pública é acessível a qualquer pessoa que conheça ou tente o nome. Na protegida, PBKDF2 SHA-256 com 600.000 iterações e salt separado por nome/tipo deriva uma chave de 256 bits. A senha não é enviada ao Supabase, salva no navegador ou incluída no link. Senhas diferentes geram canais diferentes; não é possível distinguir senha errada de ausência de outro dispositivo. Use uma senha forte, pois senhas fracas podem ser tentadas offline por quem possuir um envelope criptografado.

As folhas são salvas separadamente por sala/chave, sem enviar automaticamente as notas de outra sala. Entrar em outra sala encerra o P2P atual. Os antigos rascunhos de `papel-notes-v1` continuam no armazenamento local; salas novas começam vazias. A lista de até 20 salas recentes guarda apenas nome e tipo neste navegador. Selecionar uma sala protegida na lista exige informar a senha novamente. Limpar lista não apaga as folhas.

O link de uma sala nomeada contém apenas nome e tipo. Ao abrir uma sala pública, a conexão é automática; uma protegida pede a senha. Internet é necessária para sincronização via Supabase. Sem conexão, a edição e o salvamento locais continuam disponíveis.

## Links secretos existentes

1. Abra Conectar outro dispositivo e clique em Criar sala online.
2. Copie o link completo e abra no outro dispositivo. Ele entra automaticamente na mesma sala.
3. Aguarde a confirmação de outro dispositivo e escreva.

O navegador gera uma chave aleatória de 256 bits. Antes do envio ao Supabase, cada mensagem é criptografada com AES-GCM, IV aleatório de 96 bits e autenticação do envelope. A chave fica no fragmento `#sala=...` do link, não é transmitida na requisição HTTP da página nem no payload Realtime. O nome do canal é um hash com separação de domínio. O servidor recebe ciphertext e metadados de conexão, incluindo IP, horários e tamanhos. Quem tiver o link completo pode ler e editar as três folhas. Não é uma sala autenticada por usuário.

O canal Broadcast é público, usa a chave anon já existente no Farol 4 e não cria tabelas. A segurança do conteúdo depende da chave aleatória compartilhada, da criptografia AES-GCM e do código executado nos dispositivos. Envelopes inválidos, repetidos ou com chave diferente são descartados. Limites e disponibilidade do projeto Supabase continuam aplicáveis.

As duas formas podem ficar ligadas simultaneamente. Um navegador conectado ao P2P e à sala online encaminha as versões recebidas entre os canais. As versões do modelo evitam ciclos. Entrar em outro destino online encerra o P2P para evitar encaminhar folhas à sala anterior. Depois, um novo P2P pode ser estabelecido dentro da sala atual.

## Conexão direta P2P

1. Abra `/papel/` nos dois dispositivos.
2. No primeiro, clique em Conectar outro dispositivo, abra Conexão direta P2P e clique em Criar convite. Envie o código completo por um canal de confiança.
3. No segundo, cole o convite em Código recebido e clique em Responder convite. Envie a resposta de volta.
4. No primeiro, cole a resposta e clique em Aplicar resposta. Aguarde Conectado nos dois.
5. Escreva em qualquer folha. Os três números identificam as mesmas folhas nos dois dispositivos.

## Limitações

Internet é necessária entre redes diferentes. STUN público do Google ajuda na descoberta de endereço; o texto é enviado no canal WebRTC criptografado, diretamente quando a rede permite. Não há TURN: redes que bloqueiam conexão direta podem impedir o funcionamento. Não há promessa de funcionamento offline entre máquinas.

Os códigos de conexão contêm metadados de rede. Compartilhe apenas com a pessoa desejada. As três folhas são compartilhadas com esse dispositivo; não são salas públicas acessíveis por nome. Ter o mesmo endereço do site não conecta as pessoas automaticamente.

Cada folha aceita até 12.000 unidades UTF-16 de texto. Edições usam versões lógicas e desempate determinístico. Edições simultâneas da mesma folha não são mescladas: uma versão completa prevalece. Ao conectar, as versões locais são comparadas; exporte textos importantes antes de juntar dispositivos com notas diferentes. Não é um editor colaborativo com CRDT.

localStorage preserva as cópias legíveis em cada navegador. Limpar dados do site ou usar navegação privada pode apagar essas cópias. O arquivo .txt também é legível. Não há armazenamento central das notas. No P2P, fechar/recarregar exige novo pareamento. Uma máquina com cópia precisa estar conectada para recuperar o conteúdo em uma máquina nova. As três folhas da sala atual são compartilhadas com os destinos conectados.

## Testes

`node --test tests/papel.test.mjs`

Os testes unitários verificam isolamento das folhas, recuperação, sincronização bidirecional, ordem das mensagens, conflitos e validação de códigos. O teste de navegador está em `tests/papel-browser.cjs` e exige Playwright instalado: `node tests/papel-browser.cjs`. Inicie o site em `http://127.0.0.1:4337` antes; `PAPEL_URL` permite testar outra URL.

Também verificam AES-GCM, alteração de ciphertext, chaves diferentes e repetição de mensagens. `node tests/papel-relay-browser.cjs` testa o Supabase real, ausência de texto legível nos quadros WebSocket, três folhas, reconexão e passagem Supabase/P2P nos dois sentidos.

`node tests/papel-named-browser.cjs` testa sala pública, sala com senha, isolamento com senha diferente, separação das folhas por sala, lista persistida sem senhas e recarga. Os testes unitários verificam também normalização dos nomes e derivação das chaves.
