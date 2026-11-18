# Teste do controlador automático de velocidade (Farol 4)

Data: 13/11/2026. Ambiente: Windows 11, notebook, Chrome 157 (perfil real `C:\ChromeReal`, porta de debug 9222), servidor estático `farol-static` (python http.server, porta 4322).

**Veredito geral: BLOQUEADO.** A matriz de cenários não foi executada. Motivo: o endpoint de debug do Chrome deixou de responder HTTP (porta 9222 escuta, mas `/json/version` dá timeout) e a janela de Chrome não fechou para reinício, conforme o procedimento do CLAUDE.md. Nenhum cenário da matriz completou. Só existem três execuções de validação do harness (abaixo), que não contam como resultado do critério de aceite.

## Checklist do teste

- [ ] Cenário 1: capacidade 12 desde o início (sem mudanças). Não testado (bloqueio do navegador).
- [ ] Cenário 2: capacidade 6 desde o início (desce, fica entre 6 e 9). Não testado formalmente. Ver validação H4.
- [ ] Cenário 3: capacidade 3 desde o início (entre 3 e 5, mínimo 2). Não testado.
- [ ] Cenário 4: capacidade 12 nos primeiros 20 s, depois 4. Não testado.
- [ ] Cenário 5: câmera tapada por 15 s, depois liberada. Não testado.
- [ ] Cenário 6: capacidade 6 com `#autoSpeed` desligado. Não testado.
- [ ] Cenário 7: capacidade 6 com arquivo de 30 KB e de 100 KB. Não testado (30 KB só em validação H2, cap 12).
- [ ] Cenário 8: cenário 2 duas vezes com o mesmo `farol4-device`. Não testado.
- [x] Harness validado com dois peers reais, em janelas separadas e visíveis (ver validação).
- [ ] Relatório com tabela e veredito por critério de aceite. Feito parcialmente: veredito "bloqueado".

## Método

- Dois peers reais na mesma origem (`http://localhost:4322/farol4/index.html?fresh=<id>`): emissor e receptor em janelas separadas, lado a lado (timers a ~60/s nas duas, verificado com sonda `setTimeout` de 16 ms).
- Cada papel tem armazenamento próprio: `localStorage` e `IndexedDB` ganham prefixo por papel (`S-` emissor, `R-` receptor), para que um peer não restaure o estado do outro. Sem isso houve falso "Arquivo verificado" no receptor (corrigido e documentado abaixo).
- Animação: `requestAnimationFrame` sobrescrito por `setTimeout(16 ms)` (como pede a nota de teste).
- Pareamento: o receptor digita o código do emissor (`#pairCode`) e clica em `#joinPair`.
- Câmera simulada: o emissor envia cada quadro renderizado (`putImageData` em `#rgbCanvas`) pelo `BroadcastChannel`. A câmera do receptor (`getUserMedia` substituído por `canvas.captureStream(0)`) mostra o quadro mais recente a `cap` quadros por segundo, com `requestFrame()` a cada quadro mostrado. Tapar a câmera = quadro preto.
- Medições lidas da página a cada 1 s: `#fps`, `#sendFpsLabel`, `#received`, `#transferState`, `#notice`, `#receiveFpsLabel`.
- Ferramenta: cliente CDP mínimo em Python (aiohttp) que só anexa às janelas que ele cria. Não usei Playwright `connect_over_cdp`: ao anexar às ~30 abas do Chrome de debug, travou no início (timeout de 20 s).

## Validação do harness (não são cenários da matriz)

| Run | Entrada | Resultado observado |
|---|---|---|
| H1 `smoke2-c1-30kb` | 30 KB, cap 12 | Emissor 12 fps do início ao fim, sem mudança. Receptor verificado em 6,1 s (52/52 blocos). |
| H2 `smoke4-c2-100kb` | 100 KB, cap 6 | Emissor 12 → 10 em ~1 s → 8 em ~7 s → mantém 8. Receptor verificado em 14,2 s (171/171 blocos). |
| H3 (primeira tentativa, descartada) | 100 KB, cap 6, sem limpar estado | Receptor mostrou "verificado" com 52/52 antes da câmera: estado do run anterior. Corrigido com prefixo por papel e limpeza por run. |

H2 é o único indício do controlador em ação e vem de uma execução só. O salto 12 → 10 ocorreu cerca de 1 s após o início da transferência, antes de o link estabilizar. Isso precisa ser verificado antes de qualquer conclusão.

## Tabela de cenários

| Cenário | Status | Motivo |
|---|---|---|
| 1. cap 12 | Não testado | Bloqueio do navegador |
| 2. cap 6 (100 KB) | Não testado formalmente | Bloqueio; só H2 |
| 2b. cap 6 (1 MB, regime) | Não testado | Bloqueio |
| 3. cap 3 | Não testado | Bloqueio |
| 4. queda 12 → 4 aos 20 s (1 MB) | Não testado | Bloqueio |
| 5. travamento 15 s (1 MB) | Não testado | Bloqueio |
| 6. autoSpeed desligado (1 MB) | Não testado | Bloqueio |
| 7. 30 KB e 100 KB | Não testado | Bloqueio |
| 8. persistência do teto | Não testado | Bloqueio |

## Veredito por critério de aceite

- Nenhum cenário terminou corrompido ou sem verificação: **não avaliado** (nenhum cenário completo).
- Cenário 1 sem mudança: **não avaliado**.
- Cenário 2 com velocidade final entre 6 e 9: **não avaliado formalmente** (H2 deu 8, uma execução).
- Cenário 3 entre 3 e 5: **não avaliado**.
- Cenário 6 sem mudança automática: **não avaliado**.

## Achados

1. **Possível reação no início da transferência (H2).** A velocidade caiu 12 → 10 cerca de 1 s após o início, antes de o receptor ter medição estável. Pode ser transitório de partida; precisa de repetição.
2. **Estado isolado por papel.** No run de validação sem isolamento, o receptor mostrou "Arquivo verificado" com dados de outra transferência. Isso é efeito do harness (mesma origem), não defeito do app, mas mostra que o app depende do armazenamento do navegador para restaurar sessões.
3. **Chrome de debug travado.** Não é defeito do app. Impediu o teste; ver bloqueio.

## Limpeza e estado deixado

- Servidor `farol-static` (porta 4322) parado.
- Código de produção (`public/farol4/*`) não foi alterado. Nenhum commit ou push.
- Scripts e resultados temporários estão em `C:\Users\eduar\AppData\Local\Temp\claude\c4dfb6a38f6f0741\d828d712-48df-4712-ab35-ff1721aa3fd2\scratchpad` (fora do projeto).
- **Pendente:** a janela principal do Chrome de debug não fechou com `CloseMainWindow` (60 s). Pode haver aba com confirmação de saída. Não forcei com `Stop-Process`, por regra. Ainda pode haver janelas de teste abertas no Chrome: confira e feche manualmente.
- **Pendente:** as primeiras execuções (sem isolamento) gravaram chaves `farol4-*` e o banco IndexedDB `farol4` na origem `http://localhost:4322` do perfil real. A limpeza ainda não foi feita. Precisa ser feita com o Chrome de debug de volta.

## O que NÃO foi testado

Todos os cenários da matriz (1 a 8), inclusive a persistência do teto. Também não foi testado no celular real, com câmera real nem com a luz real. Os resultados de H1 e H2 são de harness, não da matriz.

## Próximo passo

Fechar a janela travada do Chrome (ou confirmar a saída), reabrir pelo atalho de debug do CLAUDE.md, rodar os cenários e fazer a limpeza.
