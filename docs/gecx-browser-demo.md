# Demonstração GECX no navegador

Notas de implementação e diagnóstico da página `/gemini-cx-teste/`.
Contratos do SDK e documentação oficial consultados em 11/09/2026. Este documento não constitui uma confirmação de validação final nem de disponibilidade do serviço Google.

## Componentes

- `src/pages/gemini-cx-teste.astro`: interface, chamada, microfone, chat e preferência de idioma.
- `public/gemini-cx-demo/diagnostics.js`: classificação de erros e registo local limitado.
- `tests/gecx-diagnostics.test.mjs`: testes automáticos da classificação e proteção do registo.

O SDK oficial do Google trata da autorização, transmissão do áudio e reprodução das respostas. A página é uma demonstração de conversa por voz no navegador; não disponibiliza, por si só, um número de telefone nem uma fila de operadores humanos. O transbordo desta demonstração é simulado. O consumo do serviço pode gerar custos.

## Interface estável e feedback de áudio

O elemento `chat-messenger` e o respetivo `chat-messenger-container` permanecem montados, ocultos e fora da navegação por teclado. O atributo `enable-audio-input-only` permanece ativo; alternar entre Voz e Chat muda apenas a interface da página, sem reconstruir os elementos internos do Google. O chat visível é uma interface própria que utiliza os pedidos e respostas do mesmo SDK.

`disable-viewport-management`, em `chat-messenger`, desativa a gestão automática do viewport pelo componente. A página gere o seu próprio layout. Esta opção evita o caminho de redimensionamento móvel que chama automaticamente `scrollToBottom`; não é uma garantia de ausência de outras exceções do SDK.

O modo audio-only também tem um efeito funcional: no código do SDK inspecionado, ativa o analisador da reprodução. Retirá-lo permite continuar a transmitir voz, mas deixa de produzir o feedback utilizado pela esfera.

- Entrada: um analisador local lê o `MediaStream` já capturado pelo SDK. Não pede um segundo microfone e não liga a entrada aos altifalantes.
- Saída: `chat-messenger-audio-playback-payload` fornece valores do analisador da reprodução.
- A esfera e os estados distinguem captação local, resposta do assistente, espera e microfone silenciado. A captação local não prova que o serviço recebeu ou processou a fala.
- O mudo altera `MediaStreamTrack.enabled`. Não termina a chamada, não interrompe a reprodução e não suspende os limites de duração ou inatividade.

## Idioma: preferência de conversa, não seleção de voz

O seletor oferece Automático, Português do Brasil, Inglês dos EUA e Espanhol de Espanha. Uma escolha explícita envia uma instrução de idioma ao agente, através de `messenger.sendQuery(...)`. Em Automático não é enviada essa instrução; o utilizador começa a falar na língua pretendida.

```js
// Apenas depois de a ligação BiDi estar estabelecida.
await messenger.sendQuery('Please conduct this conversation in English (United States).');
```

No SDK inspecionado, `sendQuery` verifica primeiro se existe um cliente BiDi ativo. Nesse caso envia `SessionInput.text` pelo fluxo existente e termina esse caminho de execução: não abre um pedido `RunSession` concorrente. Esta preferência faz parte da conversa e pode gerar uma resposta e consumo.

Sem BiDi ativo, o chat utiliza o caminho CES de texto. A preferência é acrescentada à primeira mensagem aplicável. O agente pode ser condicionado pelas suas próprias instruções e pelos idiomas configurados no Google; a preferência não força o modelo, a voz ou um sotaque.

O atributo HTML `language-code` não é equivalente a esta preferência: no caminho CES analisado não é enviado como idioma do `SessionConfig`. `setQueryParameters` também não é utilizado para definir o idioma CES. `setVariables` existe, mas apenas variáveis declaradas na aplicação são utilizadas pelo agente; não deve ser tratado como um seletor de idioma implícito.

Português de Portugal (`pt-PT`) não consta da lista oficial de voz consultada; português do Brasil (`pt-BR`) consta. Pedir vocabulário português não garante sotaque português. A lista GA/Preview e a ligação para a fonte oficial estão disponíveis em **Ajuda e idiomas** na página. O chat escrito tem uma cobertura de idiomas mais ampla. A configuração oficial do agente distingue idioma principal, idiomas adicionais e voz de síntese.

## Sessões, duração e recuperação

O contexto do SDK é registado uma vez. Chamadas repetidas a `createContext` podem adicionar listeners globais de sessão e resposta, pelo que não são utilizadas como mecanismo de recuperação.

`messenger.startNewSession()` limpa a sessão anterior e inicia a renovação da autorização em segundo plano. Não devolve uma promessa que represente a conclusão dessa renovação. Antes de abrir a chamada seguinte, a página aguarda a autorização, através de `chat-messenger-access-token-resolved` e do estado de preparação, com um tempo limite.

O limite local da demonstração é de **quatro minutos após a confirmação da ligação**, não desde o clique inicial. Continua a contar no mudo. O serviço pode terminar uma conversa antes desse limite, por exemplo por inatividade ou erro; isso deve ser distinguido do limite imposto pela página.

Os controlos de recuperação são deliberadamente manuais:

- **Voltar a ligar / Nova conversa:** prepara outra sessão após o clique do utilizador.
- **Atualizar página:** alternativa quando o SDK ou a autorização permanecem pendentes.
- Não existe reconexão automática com nova captura do microfone.
- Não são repetidas automaticamente mensagens, operações ou pedidos de criação de tickets. Um pedido sem resposta visível pode já ter sido executado no serviço; repetir não é uma operação necessariamente segura.

Ao terminar, a página cancela os temporizadores e o analisador local, termina o cliente de voz e liberta as faixas do microfone. Um identificador de tentativa permite rejeitar resultados de arranques anteriores que cheguem depois de o utilizador ter terminado a chamada.

## Contratos utilizados do SDK

A página carrega `prod/latest`. Não deve ser identificado como `v1.16`: essa versão publicada tem diferenças relevantes e não contém os eventos de diagnóstico mais recentes. Não foi encontrada uma propriedade pública fiável que associe `latest` a uma versão fixa. A compatibilidade deve ser revalidada após alterações do serviço.

| Contrato observado | Utilização e limite |
| --- | --- |
| `presenter.toggleBidiSession(true)` | Inicia áudio e devolve o `MediaStream` quando consegue preparar a ligação. É acesso ao presenter do SDK e deve ser verificado antes da chamada. |
| `presenter.terminateBidiClient()` | Termina o cliente de voz; a página também liberta as suas referências e faixas. |
| `messenger.sendQuery(text)` | Envia texto; devolve `Promise<void>`, não a resposta. O SDK pode capturar uma falha internamente, pelo que a resolução da promessa não prova sucesso. |
| `chat-messenger-response-received` | Para o chat: `detail.messages` contém mensagens normalizadas; as de texto têm `type: 'text'` e `text`. `detail.raw` contém a resposta de serviço. Não incluir o conteúdo no diagnóstico. |
| `chat-messenger-bidi-transcript-updated` | Texto reconhecido do utilizador em `detail.transcript`; as atualizações podem ser cumulativas. |
| `chat-messenger-bidi-utterance-updated` | Resposta em `detail.utterance`; as atualizações podem ser cumulativas. |
| `chat-messenger-connect-bidi` / `chat-messenger-disconnect-bidi` | Mudanças da ligação, não prova de sucesso de uma operação de negócio. |
| `chat-messenger-session-ended` | O agente indicou o fim da conversa. |
| `chat-messenger-error` / `chat-messenger-error-v2` | Sinais de erro; podem duplicar informação ou chegar depois de uma desconexão. |
| `chat-messenger-bidi-chunk-logged` | Evento observado no SDK, útil para inspeção pontual. Inclui conteúdo e não é copiado para o registo da página. O áudio pode ser truncado, pelo que não serve para medir fielmente a amplitude. |

Exemplo de extração de resposta de chat, sem interpretar HTML vindo do agente:

```js
messenger.addEventListener('chat-messenger-response-received', ({ detail }) => {
  const text = (detail.messages ?? [])
    .filter(message => message.type === 'text' && typeof message.text === 'string')
    .map(message => message.text)
    .join('\n');
  // Renderizar em elementos próprios com textContent.
});
```

## Diagnóstico e limites da interpretação

O painel **Diagnóstico deste teste** mantém, em memória, um máximo de 40 eventos da página. Usa uma lista restrita de campos: instante, evento, tentativa, modo, preferência de idioma, categoria e códigos numéricos disponíveis. Não guarda áudio, mensagens, nomes, tokens ou cabeçalhos. A cópia para a área de transferência exige uma ação do utilizador; este registo não é enviado a um servidor pela página.

Esta proteção refere-se ao registo de diagnóstico próprio, não ao funcionamento do SDK ou ao tratamento de dados pelo Google. As conversas continuam a ser processadas pelo serviço e podem ser registadas conforme a configuração do projeto.

| Evidência recebida | Interpretação permitida |
| --- | --- |
| `errorCode: 15`, `detailedErrorCode: 3` | Inatividade/ausência de interação indicada pelo SDK. |
| `15/5` | Falha de estabelecimento do fluxo. |
| `15/6` | Falha genérica BiDi. Não prova quota, problema de rede do utilizador ou uma causa única. |
| HTTP `429` ou código SDK `21` | Limite explícito de pedidos ou capacidade; os detalhes exigem consulta no projeto Google. |
| HTTP `401` / `403` | Falha de autorização ou acesso. |
| `NotAllowedError`, `NotFoundError`, `NotReadableError` | Sinais do navegador sobre permissão, ausência ou indisponibilidade do microfone. |
| Fluxo vazio | Falha de arranque sem causa confirmada; não equivale automaticamente a permissão recusada. |

O valor `status: -1` é uma sentinela do SDK, não um estado HTTP. Não deve ocultar o código principal e o detalhe. Uma resposta demorada não prova que a ligação acabou. As exceções de interface são registadas separadamente; a sua ocorrência, por si só, não demonstra que interromperam o áudio.

## Validação

A partir da raiz deste repositório:

```sh
node --test tests/gecx-diagnostics.test.mjs
npm run build
```

Os testes Node verificam a classificação de erros, a preservação dos códigos, o limite do registo, a exclusão de campos sensíveis e a independência das cópias devolvidas. Não substituem um teste integrado com o Google.

Antes de publicar, verificar no navegador: resposta real por voz, mudo e retoma na mesma chamada, feedback de entrada e saída, chat, preferência de idioma, fim pelo agente, nova sessão, erros de microfone/rede, redimensionamento móvel e ausência de chamadas repetidas após falha. Distinguir resultados obtidos com transporte simulado dos obtidos com o serviço real. Não afirmar que estes cenários passaram apenas porque o build ou os testes unitários passaram.

## Fontes oficiais

- [SDK carregado pela demonstração](https://www.gstatic.com/chat-messenger/sdk/prod/latest/chat-messenger.js) — contratos de execução observados no código distribuído pelo Google.
- [Web widget](https://docs.cloud.google.com/gemini-enterprise-cx/cx-agent-studio/deploy/web-widget) — integração, modos, autorização e limitações.
- [Idiomas](https://docs.cloud.google.com/gemini-enterprise-cx/cx-agent-studio/reference/language) — cobertura de voz e texto e estado GA/Preview.
- [Definições do projeto e do agente](https://docs.cloud.google.com/gemini-enterprise-cx/cx-agent-studio/settings) — idioma, voz, inatividade e registos.
- [Referência RPC CES](https://docs.cloud.google.com/gemini-enterprise-cx/cx-agent-studio/reference/rpc/google.cloud.ces.v1beta) — `BidiRunSession`, `SessionConfig`, `SessionInput` e `SessionOutput`.
