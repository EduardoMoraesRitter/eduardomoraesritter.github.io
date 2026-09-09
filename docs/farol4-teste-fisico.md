# Farol 4 — teste entre computador e celular

Roteiro preparado em 09/09/2026. **Teste físico ainda não executado.** A emulação de tela e a câmera sintética não comprovam foco, exposição, leitura da tela por uma câmera real nem comportamento do sistema móvel.

## Preparação

- Use um computador como transmissor e um celular como receptor, ambos na mesma versão do Farol 4. Registre navegador, versão do sistema, modelo do celular e revisão do código.
- A página local `http://127.0.0.1:4322/farol4/index.html` funciona apenas no próprio computador. Para o celular, use uma prévia HTTPS acessível aos dois aparelhos. Não publique a versão em produção só para cumprir este roteiro. A câmera pode ficar indisponível em uma URL HTTP da rede local.
- Comece com um arquivo de teste sem informação pessoal, pequeno o suficiente para concluir em poucos minutos. Anote tamanho e SHA-256 do original. Depois repita com um arquivo que gere cerca de 3.000 blocos.
- Use armazenamento normal do navegador, não uma janela privada. Não limpe os dados durante a rodada de retomada.
- Abra o receptor e permita a câmera voluntariamente. Posicione o celular para enquadrar o QR completo, com margem, sem reflexo direto.

## Rodadas e critérios

| Rodada | Ação | Resultado esperado |
| --- | --- | --- |
| Pareamento | Selecione o arquivo no computador e leia o primeiro QR no celular. | Mesmo ID de sala nos dois; conexão ao serviço e confirmação do outro aparelho distintas. O início respeita a opção automática. |
| Transmissão básica | Mantenha ambos parados e aguarde. | Contagem aumenta sem passar do total; estimativa aparece após amostragem suficiente. Salvar só fica disponível após verificar SHA-256. |
| Pausa pelo computador | Pause durante a leitura e aguarde a confirmação. | Ambos mostram pausa confirmada; a contagem deixa de crescer após processar o que já estava em andamento. A câmera pode continuar exibindo a imagem. |
| Retomada pelo celular | Toque em continuar recepção. | Transmissor volta a emitir blocos e receptor volta a contabilizar blocos novos. |
| Pausa pelo celular | Pause a recepção, depois retome pelo computador. | O mesmo comportamento acontece no sentido inverso; não perde os blocos já recebidos. |
| Orientação e tamanho | Gire o celular em retrato/paisagem; abra ajustes e role a tela. | QR/câmera mantêm proporção, controles não cobrem a região de leitura, ação principal é acessível e conteúdo não transborda horizontalmente. |
| Zoom | Use ajuste automático, depois controle manual e reative o automático. | Imagem e área efetivamente decodificada correspondem; o manual desativa o automático. Não se promete recuperar detalhe desfocado com zoom digital. |
| Luz | Repita em luz ambiente normal, pouca luz e com reflexo; altere uma condição de cada vez. | Orientações ajudam a corrigir a posição/luz; baixa qualidade não produz conclusão falsa. Registre blocos novos em 30 segundos para comparar. |
| Interrupção óptica | Cubra a câmera ou aponte para fora durante 15 segundos, depois volte. | Contagem permanece estável no intervalo, estimativa não finge progresso e transmissão recupera blocos faltantes. |
| Perda de internet | Com as páginas carregadas, desligue somente a internet do celular, preservando a câmera; pause nele. | A pausa é local e não deve aparecer falsamente como confirmada nos dois. O outro aparelho pode continuar emitindo até receber a mensagem. |
| Retorno da internet | Religue a internet, aguarde ou use reconectar sem criar outra sala. | Mesma sala, sincronização do estado e pedidos dos faltantes voltam. Não há conclusão falsa nem perda dos blocos persistidos. |
| Recarregar receptor | Após progresso parcial, aguarde alguns segundos e recarregue. | Blocos persistidos reaparecem. A interface informa o que falta; qualquer passo ainda exigido para abrir câmera/parear deve ficar claro. Os últimos segundos ainda não gravados podem precisar de reenvio. |
| Recarregar transmissor | Recarregue e selecione exatamente o mesmo arquivo/tamanho de bloco. | Progresso válido do receptor é preservado e faltantes são priorizados após reestabelecer a sala. Registrar se a versão ainda exige parear novamente. |
| Tela bloqueada | Bloqueie o celular por 20 segundos e volte. | A interface detecta a interrupção e permite recuperar a leitura. Não se exige que o navegador continue câmera/rede em segundo plano. |
| Conclusão | Salve o arquivo, compare SHA-256 com o original e recarregue o receptor. | Arquivo idêntico, transmissor recebe confirmação e para; recepção concluída pode ser restaurada se armazenamento estiver disponível. |

Para calcular o hash no computador: `Get-FileHash -Algorithm SHA256 -LiteralPath 'caminho-do-arquivo'`.

## Registro por rodada

Anote data, aparelhos, revisão, tamanho/blocos, condição de luz, orientação, tempo até parear, tempo total, contagem antes/depois de cada interrupção e resultado **passou / falhou / não executado**. Em falha, registre o texto do status dos dois aparelhos e passos exatos. Evite registrar convite ou segredo da sala em capturas compartilhadas.

Critério para liberar: concluir uma rodada normal e uma rodada com perda de leitura, pausa em ambos os sentidos, reconexão e restauração, sempre com arquivo final idêntico. Falhas de controles inacessíveis, falsa confirmação ou perda de progresso persistido impedem considerar a rodada aprovada.

## Evidência automatizada desta revisão

Executado em 09/09/2026, sessão exclusiva `farol-physical`, usando `tests/farol4-session-browser.js` com Supabase real e câmera gerada por canvas. Passaram: pareamento com IDs iguais, pausa iniciada por cada aparelho, retomada por qualquer lado, recusa de blocos enquanto pausado, reconexão preservando pausa, conclusão verificada, download e restauração após recarregar. O navegador reportou zero erros e um aviso no console. O primeiro acesso encontrou o servidor local desligado; após iniciá-lo, o teste terminou sem falha.

Esse resultado é uma regressão de software durante desenvolvimento. Outros agentes ainda ajustavam a aplicação; a revisão integrada final deve repetir a validação. Não foram executados perda real de rede móvel, câmera física, iluminação, bloqueio de tela ou troca real de orientação de aparelho.
