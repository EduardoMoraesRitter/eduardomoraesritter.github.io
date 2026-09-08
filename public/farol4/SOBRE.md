# Farol 4 — RGB com recuperação direcionada

O arquivo é transmitido por QR RGB, com até três blocos numerados por quadro.
O receptor mostra o que falta e, opcionalmente, pede esses blocos pelo Supabase
Realtime. O transmissor os prioriza e para quando recebe a confirmação de
integridade. Farol 1, 2 e 3 permanecem separados.

## Usar

1. Abra `/farol4/` nos dois aparelhos. No celular, o modo receptor é selecionado automaticamente; você ainda pode trocar para enviar.
2. No transmissor, escolha um arquivo. Com a opção automática marcada, a sala é criada e o primeiro QR é o de conexão. **Criar conexão** continua disponível para criar outra sala manualmente.
3. No receptor, toque em **Ligar câmera e escanear**, permita a câmera e aponte para esse QR.
4. O receptor conecta ao Supabase e confirma que está pronto. O transmissor inicia automaticamente, se a opção correspondente estiver marcada. Uma pausa manual é respeitada; use **Transmitir** para continuar.
5. Para parear novamente, use **Mostrar QR de conexão**. O convite por link e a entrada manual do código continuam disponíveis.
6. O receptor solicita lotes de até 512 faltantes a cada três segundos. Pedidos repetidos compensam desconexões e mensagens perdidas.
7. Após receber todos os blocos, verifica o SHA-256 e libera **Salvar arquivo verificado**. A confirmação via internet para o transmissor automaticamente.

## Status da sala

A faixa no topo separa **Supabase conectado** de **outro aparelho confirmado**. O ID curto da sala deve ser igual nos dois aparelhos; ele é derivado do tópico, não é o segredo de pareamento. Uma confirmação exige mensagens autenticadas entre aparelhos em modos opostos. Após 12 segundos sem resposta, a faixa informa a ausência de confirmação recente. **Reconectar** usa o mesmo código de sala. Desconectar manualmente impede que a câmera reconecte sozinha ao mesmo QR.

O primeiro QR carrega o projeto, o segredo aleatório da sala e a identificação do arquivo. A chave pública já vem da configuração do site, tornando o QR menor. Depois da confirmação, chegam os metadados completos e os blocos RGB. O receptor aceita também o formato anterior do QR. Atualize a página nos dois aparelhos para usar este fluxo.

O teste `tests/farol4-pairing-browser.js` verifica pareamento antes dos metadados, IDs iguais, confirmação nos dois sentidos e reconexão à mesma sala, com o Supabase real e câmera sintética.

## Câmera e uso no celular

Ao ligar a câmera no celular, a imagem ocupa o fundo da tela, preservando sua proporção, com status e controles compactos sobrepostos. Na horizontal, os controles se distribuem pelas laterais. **Ajustar visão automaticamente** é ativado a cada abertura da câmera; mover o zoom continua desativando esse ajuste. Sem zoom digital, a prévia usa a imagem inteira, sem corte para preencher o painel. Os detalhes de recuperação e configuração reaparecem ao parar a câmera. `tests/farol4-camera-layout.js` testa câmeras sintéticas verticais e horizontais e a reabertura.

No celular, o progresso fica acima da câmera, e os botões de câmera e salvar ficam fixos no rodapé. Os detalhes de recuperação, conexão e ajustes ficam recolhidos. A velocidade útil conta apenas bytes novos aceitos; repetições não aceleram a estimativa. O tempo restante usa uma janela recente de aproximadamente 20 segundos, após pelo menos 3 segundos de amostragem. Após 8 segundos sem novos blocos, mostra uma interrupção da leitura. Ao recarregar ou religar a câmera, a estimativa é calculada novamente a partir do progresso restaurado.

O layout foi testado em navegador com telas de 320×568, 360×640, 390×844, 430×932 e 844×390, incluindo controles fixos durante a rolagem. Execute `tests/farol4-mobile.js` com o mesmo comando `playwright-cli run-code --filename` usado abaixo para repetir esses testes.

O controle de zoom usa a câmera quando o navegador oferece esse recurso; caso contrário, usa aproximação digital de até 3×, aplicada também à leitura. O zoom digital não recupera detalhes fora de foco. Mexer no controle desativa o ajuste automático; a caixa permite reativá-lo.

O ajuste automático faz pequenos passos após reconhecer um QR centralizado. Os avisos estimam luminosidade, contraste e enquadramento; não são uma medição calibrada nem garantem foco. Foco, exposição e balanço de branco contínuos são solicitados somente quando suportados pela câmera. A permissão para ligar a câmera ainda exige uma ação no aparelho.

Só a conexão de retorno precisa de internet durante a transferência. As páginas
e bibliotecas precisam estar carregadas; esta versão não instala um service worker
nem promete abrir novamente o site sem rede.

## Recuperação manual

Sem Realtime, a transmissão percorre os blocos em ciclos. O receptor mostra
os faltantes, por exemplo `12, 45, 800-820`. Copie o lote e cole em **Recuperação
manual** no transmissor. Clique em **Priorizar estes blocos**. A numeração visível
começa em 1. Se pausado, clique em Transmitir.

O ponto **Começar no bloco** permite retomar uma posição. Para restaurar uma
recepção parcial, use exatamente o mesmo arquivo e tamanho de bloco. O IndexedDB
salva periodicamente os blocos recebidos; fechar abruptamente pode perder os
últimos segundos. O transmissor precisa selecionar o arquivo novamente após
recarregar. O código de pareamento não é salvo automaticamente.

## Protocolo

- `F4|P|<base64(JSON)>`: configuração pública, segredo de pareamento e ID do arquivo. O receptor só conecta automaticamente ao projeto configurado.
- `F4|M|<base64(JSON)>`: versão, nome, tamanho, tamanho de bloco, total,
  SHA-256 do arquivo e ID derivado de hash + tamanho de bloco.
- `F4|B|<ID>|<índice zero-based>|<CRC32>|<base64(bytes)>`: bloco direto.
- A cada 12 quadros, um quadro monocromático repete os metadados.
- Cada outro quadro usa R, G e B para até três pacotes.
- CRC32 rejeita blocos danificados; SHA-256 confere o arquivo completo antes
  de salvar ou confirmar a conclusão.
- O receptor ignora pacotes de outro arquivo, índices inválidos e duplicatas.
- O receptor só troca de arquivo após descartar a recepção atual.
- Se a verificação final falhar, a recepção reinicia e solicita os blocos novamente.

Os fountain codes das versões 2/3 foram substituídos por blocos diretos nesta
versão. Isso permite solicitar partes exatas e simplifica recuperação,
deduplicação e validação. Os protocolos não são compatíveis entre versões.
Sem conexão de retorno, ciclos completos podem ser menos eficientes que fountain
codes sob perdas aleatórias. O objetivo da v4 é o reenvio direcionado.

## Supabase

Projeto dedicado: `farol4` (`jabjrarpaukcmouhqqrz`), região `sa-east-1`.
O arquivo `config.json` contém apenas URL e chave pública. Não há tabela de
arquivos, upload do conteúdo nem chave secret/service_role no frontend.

Esta versão usa **Realtime Broadcast público como transporte**, protegido na
aplicação por mensagens AES-256-GCM com chave aleatória de 256 bits por conexão.
O tópico é derivado por SHA-256 do código de pareamento. O convite leva a chave
no fragmento da URL, que não é enviado na requisição HTTP ao servidor do site.
Ao abrir o convite, a aplicação retira o fragmento da barra de endereços.

Quem recebe o convite participa da conexão. O payload de controle contém
somente tipo de mensagem, ID do arquivo, índices faltantes, contagem, hash de
conclusão, identificador de cliente, sequência e horário. Não contém os bytes
do arquivo nem o nome. Mensagens inválidas, antigas ou repetidas são rejeitadas.
Os relógios dos aparelhos devem estar razoavelmente sincronizados (tolerância
de um minuto). Cada conexão suporta um transmissor e um receptor; crie outra
conexão para outro par.

Essa proteção no cliente **não é RLS nem autenticação Supabase**. Ela impede
interpretar ou forjar controles sem o segredo, mas não impede abuso de quota
com a chave pública. O serviço observa tópicos e tráfego, ainda que o payload
esteja criptografado. Para operação pública de maior escala, acrescente Auth,
canais privados e autorização de membros por sessão antes de ampliar o uso.

Em outro projeto, habilite Realtime Broadcast e permita canais públicos para
este cliente. Preencha a URL e a chave pública na seção de configuração. Não
é necessário criar tabelas ou habilitar replicação Postgres para Broadcast.
Uma falha de conexão não interrompe o envio óptico; a lista manual continua útil.
Nenhum recebimento é confirmado apenas pelo ACK do servidor: a conclusão vem
do receptor, depois do hash.

Documentação consultada:
- [Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Autorização de canais](https://supabase.com/docs/guides/realtime/authorization)

## Limites desta versão

- Até 32 MiB, 256/400/600 bytes por bloco, sem compressão.
- Câmera exige HTTPS ou localhost; leitura RGB depende de foco, exposição,
  distância e reprodução de cores. Não há promessa de ganho fixo de velocidade.
- Bibliotecas locais: qrcode-generator 1.4.4, jsQR 1.4.0 e supabase-js 2.91.0.
  Licenças preservadas em `vendor/`.
- O conteúdo óptico não é criptografado. SHA-256 verifica integridade, não
  comprova a identidade de quem está mostrando o QR.
- Estado local ocupa espaço aproximadamente proporcional ao arquivo; a
  persistência pode falhar em navegação privada ou com armazenamento cheio.
- Abas suspensas pelo sistema podem atrasar transmissão, câmera e mensagens.

## Validação

Da raiz do repositório:

```powershell
node --test tests/farol4.test.mjs
$env:FAROL_LIVE='1'
node --test tests/farol4.test.mjs
Remove-Item Env:FAROL_LIVE
npm run build
```

O teste com `FAROL_LIVE=1` usa o projeto real configurado, abre dois clientes
efêmeros, troca pedidos de faltantes e confirma recuperação com SHA-256. O teste
padrão cobre desordem, duplicatas, corrupção, identidade, limites, persistência,
criptografia e rejeição de mensagens.

Para repetir a verificação no navegador, inicie o servidor:

```powershell
node node_modules/astro/astro.js dev --host 127.0.0.1 --port 4322
```

Em outro terminal:

```powershell
New-Item -ItemType Directory -Path output/playwright -Force
node -e "require('fs').writeFileSync('output/playwright/farol4-source.bin',Uint8Array.from({length:3200},(_,i)=>(i*13)%256))"
npx --yes --package @playwright/cli playwright-cli -s=farol4 open http://127.0.0.1:4322/farol4/index.html
npx --yes --package @playwright/cli playwright-cli -s=farol4 run-code --filename tests/farol4-browser.js
```

O roteiro usa duas páginas e uma câmera sintética para exercitar os QR reais,
o scanner e o canal Supabase real. Em 8 de setembro de 2026, recebeu inicialmente
3/8 blocos, pediu 4–8, reconstruiu, verificou, baixou arquivo idêntico e confirmou
parada automática. Também verificou restauração, modo receptor no celular, zoom digital, pareamento óptico, início automático, respeito à pausa manual e ausência de overflow em 390px.
Isso não substitui um teste físico entre dois aparelhos; esse teste permanece
pendente.
