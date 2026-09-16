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

  /* Wording tables. The Portuguese text is the original copy and stays unchanged;
     English is an added translation. describe() keeps defaulting to Portuguese. */
  const MESSAGES = {
    pt: {
      offline: ['Sem ligação à Internet', 'O navegador indica que está offline. Quando a ligação voltar, podes iniciar uma nova conversa.'],
      'sdk-load': ['O assistente não carregou', 'Não foi possível preparar o componente do Google. Atualiza a página. Se persistir, verifica a rede e os bloqueadores de conteúdo.'],
      authorization: ['Não foi possível autorizar a conversa', 'O componente carregou, mas não conseguimos confirmar uma autorização válida. Atualiza a página; se persistir, verifica o acesso ao serviço e os bloqueadores de conteúdo.'],
      capacity: ['Limite de pedidos ou capacidade', 'O Google recusou este pedido por limite de utilização ou capacidade. Aguarda antes de tentar novamente. O detalhe da quota deve ser consultado no projeto Google.'],
      access: ['Acesso ao assistente recusado', 'A autorização do teste não foi aceite pelo Google. Atualiza a página; se continuar, o responsável pelo projeto deve verificar a publicação e as permissões.'],
      permission: ['Acesso ao microfone bloqueado', 'Permite o microfone nas definições deste site e volta a tentar. A chamada não foi iniciada.'],
      'microphone-missing': ['Microfone não encontrado', 'Liga ou seleciona um microfone no navegador e volta a tentar.'],
      'microphone-busy': ['Microfone indisponível', 'Verifica o dispositivo e a permissão do navegador. Outra aplicação pode estar a utilizar o microfone.'],
      inactivity: ['Conversa terminada por inatividade', 'O serviço terminou o fluxo sem receber interação. Podes iniciar uma nova conversa; o mudo não suspende os limites de inatividade.'],
      'connect-timeout': ['A ligação demorou demasiado', 'Não foi possível confirmar a ligação em 45 segundos. Verifica a permissão do microfone e a rede. Podes voltar a tentar.'],
      'pending-cancel': ['Início da chamada cancelado', 'O navegador ou o componente do Google ainda está a concluir o pedido de acesso. Fecha o pedido do microfone ou atualiza a página para recomeçar em segurança.'],
      'chat-response-timeout': ['A resposta está a demorar', 'O pedido continua pendente no Google. Podes aguardar ou atualizar a página para reiniciar a interface. Não reenviamos mensagens automaticamente; uma ação já recebida pelo serviço pode ainda ser concluída.'],
      'empty-stream': ['Não foi possível iniciar o áudio', 'O componente do Google não devolveu um fluxo de áudio. Isto não confirma uma recusa do microfone. Tenta uma nova conversa.'],
      'response-timeout': ['O assistente está a demorar', 'Já recebemos a transcrição, mas ainda não chegou uma resposta. Podes aguardar, terminar ou voltar a ligar. Uma nova chamada começa uma nova conversa.'],
      'chat-request': ['Não foi possível concluir a mensagem', 'O serviço não concluiu o pedido de chat. Este erro não identifica a causa. A mensagem não será reenviada automaticamente.'],
      stream: ['A ligação ao assistente foi interrompida', 'O fluxo de áudio terminou inesperadamente. Este erro, por si só, não identifica se a causa é a rede, o serviço ou outra limitação. Podes iniciar uma nova conversa.'],
    },
    en: {
      offline: ['No internet connection', 'The browser reports that you are offline. Once the connection is back, you can start a new conversation.'],
      'sdk-load': ['The assistant did not load', 'The Google component could not be prepared. Reload the page. If it keeps failing, check your network and any content blockers.'],
      authorization: ['The conversation could not be authorized', 'The component loaded, but no valid authorization could be confirmed. Reload the page. If it persists, check service access and content blockers.'],
      capacity: ['Request or capacity limit', 'Google refused this request because of a usage or capacity limit. Wait before trying again. Quota details have to be checked in the Google project.'],
      access: ['Access to the assistant was refused', 'Google did not accept the authorization for this test. Reload the page. If it continues, the project owner has to check the deployment and its permissions.'],
      permission: ['Microphone access blocked', 'Allow the microphone in this site settings and try again. The call was not started.'],
      'microphone-missing': ['Microphone not found', 'Connect or select a microphone in the browser and try again.'],
      'microphone-busy': ['Microphone unavailable', 'Check the device and the browser permission. Another application may be using the microphone.'],
      inactivity: ['Conversation ended by inactivity', 'The service closed the stream without receiving any interaction. You can start a new conversation. Muting does not suspend inactivity limits.'],
      'connect-timeout': ['The connection took too long', 'The connection could not be confirmed within 45 seconds. Check the microphone permission and your network. You can try again.'],
      'pending-cancel': ['Call start cancelled', 'The browser or the Google component is still finishing the access request. Dismiss the microphone prompt or reload the page to restart safely.'],
      'chat-response-timeout': ['The answer is taking a while', 'The request is still pending at Google. You can wait or reload the page to restart the interface. Messages are never resent automatically, and an action the service already received may still complete.'],
      'empty-stream': ['Audio could not be started', 'The Google component did not return an audio stream. This does not confirm that the microphone was refused. Try a new conversation.'],
      'response-timeout': ['The assistant is taking a while', 'The transcript arrived, but there is still no answer. You can wait, hang up or call again. A new call starts a new conversation.'],
      'chat-request': ['The message could not be completed', 'The service did not complete the chat request. This error does not identify the cause. The message will not be resent automatically.'],
      stream: ['The connection to the assistant dropped', 'The audio stream ended unexpectedly. On its own, this error does not say whether the cause is the network, the service or another limit. You can start a new conversation.'],
    },
  };

  function describe(detail = {}, lang = 'pt') {
    const values = codes(detail);
    const pack = MESSAGES[lang] || MESSAGES.pt;
    const result = (id, kind, action = 'retry') => {
      const [title, message] = pack[id] || MESSAGES.pt[id];
      return { kind, title, message, action, ...values };
    };
    if (detail.kind === 'offline') return result('offline', 'offline');
    if (detail.kind === 'sdk-load') return result('sdk-load', 'sdk-load', 'reload');
    if (detail.kind === 'authorization-timeout' || detail.kind === 'authorization-unavailable') return result('authorization', detail.kind, 'reload');
    const serviceStatus = [detail.status, detail.error?.status, detail.error?.error?.status];
    if (values.http === 429 || values.code === 21 || serviceStatus.includes('RESOURCE_EXHAUSTED')) return result('capacity', 'capacity');
    if (values.http === 401 || values.http === 403) return result('access', 'access', 'reload');
    if (detail.name === 'NotAllowedError' || detail.name === 'SecurityError') return result('permission', 'permission');
    if (detail.name === 'NotFoundError') return result('microphone-missing', 'microphone');
    if (detail.name === 'NotReadableError' || values.code === 4) return result('microphone-busy', 'microphone');
    if (values.code === 15 && values.detail === 3) return result('inactivity', 'inactivity');
    if (detail.kind === 'connect-timeout') return result('connect-timeout', 'connect-timeout');
    if (detail.kind === 'pending-cancel') return result('pending-cancel', 'pending-cancel', 'reload');
    if (detail.kind === 'chat-response-timeout') return result('chat-response-timeout', 'chat-response-timeout', 'reload');
    if (detail.kind === 'empty-stream') return result('empty-stream', 'empty-stream');
    if (detail.kind === 'response-timeout') return result('response-timeout', 'response-timeout');
    if (detail.mode === 'chat') return result('chat-request', 'chat-request');
    return result('stream', 'stream');
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
