# Farol 3 — preparação de mídia para comparação

Recursos integrados em 21/09/2026:

- Prints em ZIP com intervalo em segundos ou minutos.
- Descarte opcional de capturas semelhantes, comparando com a última mantida.
- Compactação JPEG com 800/1200/1600 pixels e qualidade ajustável.
- Prévia antes/depois e estimativa de tamanho.
- Extração de áudio em tempo real no navegador, com ZIP selecionado para enviar.
- Download da cópia do ZIP e cancelamento da preparação.

Os módulos de preparação são compartilhados com Farol 4. A transmissão permanece
no protocolo original Farol 3: fountain codes RGB, gzip quando reduz o tamanho,
FPS manual e retomada por número da gota. O controle agora usa salas Supabase
com QR de pareamento, início automático, progresso, pausa remota e conclusão verificada. O receptor continua usando o armazenamento original, em memória
e snapshots: não equivale ao armazenamento em partes de 100 MB do Farol 4.
Há um limite de entrada de 100 MB, mas o consumo de memória de arquivos grandes
depende do dispositivo e do decoder. Não houve validação óptica física de 100 MB.

Correção: o transmissor agora só envia gzip se for menor que o original. Antes,
gzip maior podia ser enviado com metadados que indicavam arquivo não comprimido.

Para comparar velocidade, baixe um ZIP preparado e selecione exatamente esse
mesmo arquivo nas duas versões, com mesmos aparelhos, câmera, iluminação,
400 bytes por bloco e 6 quadros/s. Compare tempo e bytes úteis recebidos, não
gotas emitidas. O teste automatizado verifica preparação e reconstrução byte a
byte no protocolo, mas não mede a velocidade de câmera real.

## Sala e QR inicial

Ao escolher o arquivo, o transmissor calcula SHA-256 dos bytes que serão enviados, cria uma sala Farol 3 e mostra o QR de conexão. O receptor lê esse QR e entra no mesmo canal Supabase; a confirmação da câmera inicia o envio se a opção automática estiver marcada. Ambos devem abrir Farol 3 atualizado. As salas Farol 3 são separadas das salas Farol 4. O projeto Supabase é o mesmo; a conexão reutiliza Broadcast criptografado, sem armazenar bytes do arquivo no servidor.

Pausar/continuar funciona pelos dois aparelhos. Parar a câmera comunica pausa. Perder contato com um receptor confirmado pausa o transmissor após cerca de 12 segundos. A reconexão preserva pausas manuais. No fim, o receptor verifica o SHA-256 do conteúdo transmitido antes de confirmar a conclusão e liberar o download na sessão pareada.

O contador remoto mostra blocos reconstruídos; fountain codes continuam gerando novas gotas em vez de pedir índices exatos como no Farol 4. FPS permanece manual para comparação. Abrir outro QR com arquivo diferente pede confirmação antes de descartar a recepção anterior. Recepção salva do mesmo arquivo pode ser retomada lendo o novo QR.

`tests/farol3-room-browser.js` valida QR por câmera sintética, Supabase real, sala compartilhada, início automático, pausa nos dois sentidos, reconexão, novo arquivo e parada da câmera. O arquivo baixado foi comparado com o original por SHA-256. Isso não substitui comparação física de velocidade no iPhone.

## Zoom e reinício

O ajuste automático de visão funciona desde o QR inicial: quando reconhece um QR pequeno e centralizado, aumenta gradualmente o zoom digital até 3×. O controle manual desativa o automático; reabrir a câmera reativa o ajuste. O zoom não substitui foco ou boa iluminação.

“Começar do zero” está disponível nos dois modos e pede confirmação. Encerra a sala, para câmera e transmissão e apaga o progresso local do Farol 3. Com o outro aparelho conectado, também solicita o reinício remoto. Sem confirmação do outro lado, informa que apenas a limpeza local foi confirmada. Não limpa dados de outros sites.

## Velocidade e previsão

Os dois lados mostram bytes reconstruídos, velocidade útil recente, tempo decorrido (incluindo pausas), tempo em atividade e previsão restante. A medição usa até 30 segundos de progresso novo; blocos restaurados não contam como velocidade nova. Após 12 segundos sem avanço, a previsão fica indisponível. O transmissor recebe os números pelo canal da sala e sinaliza ausência de atualização. São bytes do conteúdo transmitido, possivelmente comprimido; não gotas emitidas. O cronômetro desta medição reinicia ao recarregar a página ou trocar o arquivo. A previsão em fountain codes oscila porque a reconstrução pode ocorrer em saltos.

## Reconexão com confirmação óptica

Reconectar em qualquer aparelho pausa a transmissão, mantém a sala/arquivo e os blocos recebidos e exibe novamente o QR no transmissor. O receptor pede centralização e relê um identificador novo de sincronização dentro do QR da mesma sala. Só depois de confirmar o progresso pelo canal a transmissão continua. Uma mensagem de câmera pronta antiga não libera essa etapa. O emissor continua a sequência de sementes de gotas em memória, sem zerá-la. Começar do zero permanece a ação separada que apaga o progresso. Sem conexão com o canal, a reconexão aguarda e mostra o erro; não confirma progresso remoto.

## Diagnóstico do início

O painel mantém visíveis projeto Supabase, sala, identidade curta do arquivo, leitura do QR e presença confirmada do outro aparelho. IDs iguais indicam a mesma sala escolhida; somente a presença confirmada indica comunicação real. QR lido não significa canal conectado. Erros de alcance do serviço são separados de erros de leitura. Mensagens criptografadas de controle são processadas em ordem para evitar que confirmação/pausa sejam descartadas por inversão assíncrona. Entrar em outra sala do mesmo arquivo limpa somente a negociação anterior, preservando blocos.
