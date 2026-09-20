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
FPS manual e retomada por número da gota. Não foram adicionadas salas Supabase
nem pausa remota. O receptor continua usando o armazenamento original, em memória
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
