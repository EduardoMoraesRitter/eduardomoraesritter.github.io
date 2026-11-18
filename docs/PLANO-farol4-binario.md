# Farol 4 · opção 2: blocos em bytes puros (formato binário, dentro do Farol 4)

Pedido (18/11/2026): aplicar a técnica que aumenta os dados por QR e testar com subagente.

> Nome: este é o **formato binário do Farol 4**. Não tem relação com o Farol 5 (`/farol5`, retorno por som). O nome "v5" usado no começo foi trocado para evitar essa confusão.

## Por que

Hoje cada bloco vira texto: `F4|B|<hash de 64 letras>:<bloco>|<índice>|<CRC>|<base64>`. O base64 gasta 4 caracteres para cada 3 bytes, e o cabeçalho gasta ~90 caracteres. Um bloco de 600 bytes ocupa 889 caracteres no QR.

O gerador de QR (`vendor/qrcode.js`) já converte cada caractere com `& 0xff`, então aceita bytes puros. O leitor zxing devolve os bytes crus em `ReadResult.bytes`, e o jsQR em `binaryData`.

## Medido antes de implementar (18/11/2026, `vendor/qrcode.js`, nível M)

| Formato | Dados por QR | Módulos por lado |
|---|---|---|
| Texto, bloco 400 | 400 bytes | 97 |
| Texto, bloco 600 (padrão atual) | 600 bytes | 113 |
| Binário, bloco 600 | 600 bytes | 93 |
| Binário, bloco 880 | 880 bytes | 113 |

Conclusão: no mesmo tamanho de QR do padrão atual, o binário leva 880 bytes em vez de 600 (+47%).

## Formato binário (bloco)

Cabeçalho de 15 bytes, depois os dados:
- 2 bytes: `F5`
- 1 byte: `B`
- 4 bytes: início do hash do arquivo (identifica o arquivo)
- 4 bytes: índice do bloco (inteiro sem sinal, big-endian)
- 4 bytes: CRC32 dos dados

Os metadados (`F4|M|...`) e o pareamento continuam em texto. Os metadados continuam iguais; o tamanho de bloco permitido vai até 880, só no formato binário.

## Checklist

- [x] Medir a capacidade do QR em texto e em binário (tabela acima)
- [x] Empacotar e desempacotar o bloco binário, com testes em node (7 testes: ida e volta, Latin-1, prefixo, CRC, limite de 880, leitor, tamanho do QR)
- [x] Validação: bloco até 880 bytes; metadados continuam em texto; o receptor reconhece o bloco binário pelo prefixo `F5B`
- [x] Transmissor: gera o bloco binário com o interruptor ligado; bloco acima de 600 só no binário
- [x] Receptor: lê `bytes` do zxing e `binaryData` do jsQR, e aceita o bloco binário (`acceptBinary`)
- [x] Interruptor "Formato binário" na página, desligado por padrão, e opção de bloco 880
- [x] Subagente: medir no navegador texto 600 contra binário 600 e binário 880, em 30 KB e 100 KB, com hash conferido → `docs/teste-binario-2026-11-18.md` (18/18 verificaram; em 100 KB a taxa aos 5 s satura; em 200 KB o binário 880 deu +77%; sem commit)
- [x] Decidir o padrão com os números, registrar no README e commitar → padrão novo: binário + bloco 880 (+77% em 200 KB). Desligar o binário volta para 600; teste de leitura limitado a 600; sala salva aceita 880 (18/11/2026)
- [ ] Teste em produção com dois celulares (Eduardo)
