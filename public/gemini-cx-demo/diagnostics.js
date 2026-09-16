/* Shared, dependency-free error policy. No audio, conversation text or tokens are logged. */
(function (root) {
  function codes(detail = {}) {
    const numeric = value => /^\d{1,4}$/.test(String(value)) ? Number(value) : undefined;
    // The SDK emits both {code, status} and {error: {error: {code, status}}}.
    // Keep only known numeric fields, never the accompanying response text.
    const sources = [detail, detail?.error, detail?.error?.error].filter(value => value && typeof value === 'object');
    const http = sources.flatMap(value => [numeric(value.status), numeric(value.code)])
      .find(value => value >= 100 && value <= 599);
    const code = sources.map(value => numeric(value.errorCode)).find(value => value !== undefined);
    const errorDetail = sources.map(value => numeric(value.detailedErrorCode)).find(value => value !== undefined);
    return {
      ...(http !== undefined ? { http } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(errorDetail !== undefined ? { detail: errorDetail } : {}),
    };
  }

  function describe(detail = {}) {
    const values = codes(detail);
    const result = (kind, title, message, action = 'retry') => ({ kind, title, message, action, ...values });
    if (detail.kind === 'offline') return result('offline', 'Sem ligação à Internet', 'O navegador indica que está offline. Quando a ligação voltar, podes iniciar uma nova conversa.');
    if (detail.kind === 'sdk-load') return result('sdk-load', 'O assistente não carregou', 'Não foi possível preparar o componente do Google. Atualiza a página. Se persistir, verifica a rede e os bloqueadores de conteúdo.', 'reload');
    if (detail.kind === 'authorization-timeout' || detail.kind === 'authorization-unavailable') return result(detail.kind, 'Não foi possível autorizar a conversa', 'O componente carregou, mas não conseguimos confirmar uma autorização válida. Atualiza a página; se persistir, verifica o acesso ao serviço e os bloqueadores de conteúdo.', 'reload');
    const serviceStatus = [detail.status, detail.error?.status, detail.error?.error?.status];
    if (values.http === 429 || values.code === 21 || serviceStatus.includes('RESOURCE_EXHAUSTED')) return result('capacity', 'Limite de pedidos ou capacidade', 'O Google recusou este pedido por limite de utilização ou capacidade. Aguarda antes de tentar novamente. O detalhe da quota deve ser consultado no projeto Google.');
    if (values.http === 401 || values.http === 403) return result('access', 'Acesso ao assistente recusado', 'A autorização do teste não foi aceite pelo Google. Atualiza a página; se continuar, o responsável pelo projeto deve verificar a publicação e as permissões.', 'reload');
    if (detail.name === 'NotAllowedError' || detail.name === 'SecurityError') return result('permission', 'Acesso ao microfone bloqueado', 'Permite o microfone nas definições deste site e volta a tentar. A chamada não foi iniciada.');
    if (detail.name === 'NotFoundError') return result('microphone', 'Microfone não encontrado', 'Liga ou seleciona um microfone no navegador e volta a tentar.');
    if (detail.name === 'NotReadableError' || values.code === 4) return result('microphone', 'Microfone indisponível', 'Verifica o dispositivo e a permissão do navegador. Outra aplicação pode estar a utilizar o microfone.');
    if (values.code === 15 && values.detail === 3) return result('inactivity', 'Conversa terminada por inatividade', 'O serviço terminou o fluxo sem receber interação. Podes iniciar uma nova conversa; o mudo não suspende os limites de inatividade.');
    if (detail.kind === 'connect-timeout') return result('connect-timeout', 'A ligação demorou demasiado', 'Não foi possível confirmar a ligação em 45 segundos. Verifica a permissão do microfone e a rede. Podes voltar a tentar.');
    if (detail.kind === 'pending-cancel') return result('pending-cancel', 'Início da chamada cancelado', 'O navegador ou o componente do Google ainda está a concluir o pedido de acesso. Fecha o pedido do microfone ou atualiza a página para recomeçar em segurança.', 'reload');
    if (detail.kind === 'chat-response-timeout') return result('chat-response-timeout', 'A resposta está a demorar', 'O pedido continua pendente no Google. Podes aguardar ou atualizar a página para reiniciar a interface. Não reenviamos mensagens automaticamente; uma ação já recebida pelo serviço pode ainda ser concluída.', 'reload');
    if (detail.kind === 'empty-stream') return result('empty-stream', 'Não foi possível iniciar o áudio', 'O componente do Google não devolveu um fluxo de áudio. Isto não confirma uma recusa do microfone. Tenta uma nova conversa.');
    if (detail.kind === 'response-timeout') return result('response-timeout', 'O assistente está a demorar', 'Já recebemos a transcrição, mas ainda não chegou uma resposta. Podes aguardar, terminar ou voltar a ligar. Uma nova chamada começa uma nova conversa.');
    if (detail.mode === 'chat') return result('chat-request', 'Não foi possível concluir a mensagem', 'O serviço não concluiu o pedido de chat. Este erro não identifica a causa. A mensagem não será reenviada automaticamente.');
    return result('stream', 'A ligação ao assistente foi interrompida', 'O fluxo de áudio terminou inesperadamente. Este erro, por si só, não identifica se a causa é a rede, o serviço ou outra limitação. Podes iniciar uma nova conversa.');
  }

  function createJournal(max = 40) {
    const entries = [];
    const safe = value => typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,64}$/.test(value) ? value : undefined;
    return {
      add(event, data = {}) {
        const entry = { at: new Date().toISOString(), event: safe(event) || 'unknown', ...codes(data) };
        for (const key of ['attempt', 'mode', 'language', 'kind']) {
          const value = safe(String(data[key] ?? ''));
          if (value) entry[key] = value;
        }
        entries.push(entry);
        if (entries.length > max) entries.splice(0, entries.length - max);
        return { ...entry };
      },
      entries: () => entries.map(entry => ({ ...entry })),
    };
  }

  root.GecxDiagnostics = Object.freeze({ codes, describe, createJournal });
})(globalThis);
