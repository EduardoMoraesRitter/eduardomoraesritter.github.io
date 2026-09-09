# Farol 4 — cinco frentes de melhoria

Revisão local de 9 de setembro de 2026. Nenhuma publicação em produção nesta rodada.

## Entregas

1. Teste físico: roteiro em `farol4-teste-fisico.md`, com iluminação, zoom, orientação, perda de rede, pausa e SHA-256. A regressão automatizada passou; teste com celular físico permanece não executado.
2. Retomada: sala por papel salva por até 7 dias; receptor recupera conexão e blocos, transmissor seleciona o mesmo arquivo preservando sala e configuração. Arquivo diferente é rejeitado. Esquecer sala não descarta blocos; descartar recepção remove ambos.
3. Calibração: teste explícito de 8 segundos por QR RGB com canais numerados e CRC. Leituras repetidas não aumentam a contagem; perdas reduzem a sugestão de velocidade. Resultado no receptor, ajuste manual e sem garantia da velocidade futura.
4. Diagnóstico: separa navegador offline, tentativa/erro de conexão, peer sem resposta, câmera desligada, ausência de QR e ausência de novos blocos. Preserva avisos de erro e retomada; pausa não é confirmada sem evidência recente.
5. Acessibilidade: reflow em ampliação CSS de 200%/390 px, acesso direto por teclado, foco, controles e suporte de cores forçadas.

## Validação

- 22 testes unitários aprovados, 1 teste opcional de backend ignorado nesta execução.
- Sessão integrada em dois navegadores com Supabase real e câmera sintética aprovada: pausa cada lado, retomada, reconnect, conclusão, download e restauração.
- Teste de retomada aprovado: mesma sala no transmissor, arquivo incorreto rejeitado, receptor parcialmente completo restaurado em duas recargas e nova sala após esquecer.
- Diagnóstico no navegador aprovado: offline/online, câmera desligada, ausência de QR após margem inicial e preservação dos avisos.
- Oito cenários de reflow aprovados, com transmissor/receptor em desktop, mobile, paisagem e ampliação de 200%; teclado leva ao alvo da transferência e abre ajustes.
- Câmera ativa aprovada em 320×568,390×844,844×390: imagem proporcional, sem overflow horizontal, controles automáticos acessíveis e reativados ao reabrir.
- Build Astro aprovado.

## Limites

Câmera sintética não testa foco, cores, exposição ou restrições de segundo plano de um celular real. Zoom CSS não certifica zoom móvel nem leitor de tela. Persistência depende do navegador e fechamento abrupto durante recepção pode perder o último intervalo de 2,5 segundos ainda não gravado. Câmera exige ação do usuário para reabrir. Diagnóstico usa sinais observados e não identifica toda causa de erro.

Impeccable orientou revisão de layout/acessibilidade. O detector disponível permanece em modo degradado por falta de parsers, portanto resultados sem ocorrências não certificam contraste ou acessibilidade completa.

Calibração no navegador: 21 de 24 canais lidos após omitir um quadro, duplicatas ignoradas e zero blocos de arquivo alterados. Resultado final no mobile inteiramente acima da barra de ações (31 px de folga).
