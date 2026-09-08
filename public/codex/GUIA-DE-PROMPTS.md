# GUIA DE PROMPTS-FÁBRICA — edição Codex (OpenAI / GPT)

Versão 1.0 · 8 de setembro de 2026.

Adaptação do [guia original para Claude Code](../claude-code/GUIA-DE-PROMPTS.md).
Preserva a proposta do Wave-Racer: especificar um produto, construir meios de
verificá-lo e corrigir defeitos observados até cumprir a entrega combinada.
O original permanece intacto. Esta edição é uma adaptação editorial pesquisada;
ainda não foi validada construindo um jogo completo com ela.

## 1. Como usar os dois documentos

Este **guia** explica como escrever e adaptar um prompt-fábrica para jogos,
simulações, aplicativos e sites. O [PROMPT-FABRICA.md](PROMPT-FABRICA.md) contém
o molde operacional para copiar, preencher e executar no Codex.

1. Abra o projeto correto no Codex e forneça os arquivos de referência relevantes.
2. Preencha o molde: produto, stack, direção, estrela, escopo e aceitação.
3. Apague alternativas e campos que não se aplicam antes de enviar.
4. Diga que deseja implementar, caso essa seja a intenção. Para apenas elaborar
   uma especificação, peça explicitamente um documento sem executar o projeto.
5. Examine a entrega usando os comandos e evidências relatados.

O alvo desta edição é o **agente Codex com acesso ao projeto e às ferramentas
disponíveis na sessão**, não uma conversa de texto sem acesso ao ambiente.
O nome do modelo e o nível de raciocínio são escolhas da interface/configuração;
este material não exige um modelo fixo nem altera configurações por conta própria.

## 2. O que permanece e o que muda

| Elemento do material original | Tratamento nesta edição |
| --- | --- |
| Produto completo dentro do escopo | Mantido, com requisitos de aceitação explícitos |
| Sete blocos, direção e subsistema-estrela | Mantidos |
| Evidência real e crítico exigente | Mantidos, distinguindo inspeção de suposição |
| `Ultracode.` como gatilho | Substituído por um pedido direto de execução |
| `/loop` no corpo do prompt | Substituído por corrigir, verificar e revisar em linguagem natural |
| Cinco a oito agentes obrigatórios | Delegação explícita, limitada ao trabalho independente e à capacidade disponível |
| Harness completo antes de tudo | Primeiro um caminho mínimo executável e verificável; ampliar conforme o risco |
| Parar quando não houver defeito imaginável | Parar quando a aceitação estiver comprovada e não houver defeitos bloqueantes conhecidos |
| “70% pronto” | Lista de requisitos concluídos, pendentes e não verificados |
| Inglês obrigatório | Português nesta edição; preservar nomes técnicos quando úteis |

Não assumimos que os gatilhos do original sejam comandos nativos de qualquer
produto. Uma instalação pode ter extensões próprias; o molde não depende delas.
As mudanças acima são escolhas de adaptação, não uma comparação experimental
de desempenho entre Claude e GPT.

## 3. Base oficial e decisões editoriais

A orientação oficial de prompting privilegia objetivo, contexto, formato e
limites relevantes. Aqui isso vira um contrato de produto, com método detalhado
apenas quando ele é necessário para verificar a qualidade.
[Fonte: Prompting](https://learn.chatgpt.com/docs/prompting).

O Codex usa `AGENTS.md` para instruções persistentes de projeto. Guarde ali
convenções estáveis; mantenha os requisitos desta entrega no prompt ou em um
documento indicado por ele. Confira os arquivos de instrução aplicáveis para
evitar conflitos. Não sobrescreva um `AGENTS.md` existente com este guia inteiro.
[Fonte: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

O Codex oferece subagentes; a documentação orienta solicitá-los explicitamente
e alerta para custo adicional e conflitos em edição paralela. Nosso molde pede
delegação de partes independentes e prevê execução sequencial caso o recurso
não esteja disponível na sessão.
[Fonte: Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

As recomendações de direção artística, matrizes de aceitação, métricas e revisão
abaixo são a nossa metodologia, derivada dos documentos fornecidos. Não são
requisitos oficiais da OpenAI. Números e resultados históricos do Wave-Racer
citados no original não foram reproduzidos nesta adaptação.

## 4. Os dez princípios, aplicados ao Codex

1. **Descreva a experiência final.** “Corrida de três voltas com reinício” é mais
   verificável que “jogo incrível”. Ambição acompanha um escopo finito.
2. **Feche as decisões importantes.** Declare stack obrigatória, compatibilidade
   e dados a preservar. Deixe detalhes internos reversíveis para o agente resolver.
3. **Transforme qualidade em observações.** Diga onde olhar, como reproduzir e
   o que caracteriza falha. Uma captura não prova a simulação inteira.
4. **Declare a estrela.** Concentre implementação e revisão no sistema que
   sustenta a experiência, sem dispensar requisitos essenciais dos demais.
5. **Nomeie atalhos ruins.** Exemplo: a tinta não pode ser apenas uma textura
   decorativa se o território pintado determina a vitória.
6. **Crie cedo uma forma de testar.** Em motor de regras, casos determinísticos;
   em UI, um fluxo executável; em áudio, uma saída reproduzível.
7. **Revise evidências, não promessas.** Ler CSS não equivale a olhar a página;
   gerar WAV não equivale a ouvi-lo; build não prova jogabilidade.
8. **Use paralelismo com fronteiras.** Defina arquivos, contratos e entrega de
   cada subagente. O agente principal integra e confere o conjunto.
9. **Trabalhe por marcos executáveis.** Cada etapa deve deixar um caminho útil
   funcionando. Não transforme cada marco em uma nova aprovação obrigatória.
10. **Conclua com rastreabilidade.** Aceitação satisfeita, evidências acessíveis
    e limitações registradas. Falta de ferramenta não vira teste aprovado.

## 5. Os sete blocos do prompt

### Bloco 1 — Abertura e resultado

Escreva produto, público, ambiente e experiência em poucas frases. “Produto
finalizado” significa finalizado **no escopo descrito**, não equivalência a todo
o conteúdo de um jogo comercial de grande orçamento.

Exemplo: “Implemente uma corrida de barcos estilizada para navegador, com uma
pista, quatro competidores e três voltas. Quero largar, disputar, terminar e
reiniciar sem recarregar. O resultado precisa ser utilizável, não uma cena parada.”

### Bloco 2 — Restrições

Defina stack, comandos, recursos permitidos, dispositivos e ações autorizadas.
Em projeto existente, respeite a arquitetura e o gerenciador já usados.

Se desejar zero assets externos, esclareça o alcance: modelos, texturas, fontes,
ícones, áudio e chamadas de rede. Bibliotecas de código são uma categoria
diferente de assets; decida se são permitidas. Uma restrição procedural não
garante por si só qualidade visual, segurança ou ausência de problemas de licença.

Para performance, substitua “retina a 60 fps” por um cenário de medição:
hardware, navegador, viewport, DPR, quantidade de entidades, duração e métrica.
Um exemplo de meta, a ajustar: 60 fps médios e tempo de frame p95 de até 20 ms
durante 60 segundos após aquecimento. Se o hardware-alvo estiver indisponível,
o agente deve informar onde mediu e deixar a validação no alvo como pendente.

### Bloco 3 — Direção de arte ou design

Escolha uma direção, duas ou três referências e quais qualidades extrair delas.
Acrescente técnicas e falhas observáveis. Referências orientam linguagem visual;
não são autorização para copiar arquivos ou identidade de terceiros.

Exemplos de especificidade: três bandas de luz com transições controladas,
contornos legíveis nas distâncias da câmera, paleta consistente em cenário e HUD.
Para um app: hierarquia de dados, estados vazios, contraste, foco e leitura do
relatório exportado. Preserve controles semânticos e acessíveis ao estilizar.

### Bloco 4 — A estrela

| Produto | Estrela | Evidência principal |
| --- | --- | --- |
| Wave-Racer | Água e relação casco/onda | Sequência em movimento + estado físico |
| Vila Viva | Rotinas e reações | Linha do tempo da simulação + observação |
| Tabuleiro Zumbi | Regras e decisões de turno | Casos legais/ilegais + partida completa |
| App de Carga | Solver e ajuste manual | Validação geométrica + fluxo de edição |
| Ink Tide | Tinta que altera o território | Estado de cobertura + imagem correspondente |

Especifique três a cinco comportamentos da estrela. Exija que visual e lógica
leiam os mesmos dados quando representarem o mesmo fenômeno. Não basta uma
animação de onda desconectada da flutuação do barco.

### Bloco 5 — Escopo verificável

Para jogos, marque **entra / corta / estrela** em cada categoria:

| Camada | Categorias |
| --- | --- |
| Núcleo | Mecânicas, level design, balanceamento, resposta aos comandos |
| Apresentação | Arte, VFX, personagens, animação, som, atmosfera, HUD |
| Estrutura | Narrativa, progressão, onboarding, save, multiplayer |
| Fundação | Controles, desempenho, acessibilidade, recuperação de erros |

Para apps: fluxos principais, dados, validação, persistência, exportação,
estados de carregamento/vazio/erro, responsividade e acessibilidade.

Declare controles e feedback. Som e movimento podem reforçar ações de jogo,
mas precisam respeitar volume, redução de movimento e legibilidade. Toda ação
rejeitada deve explicar o motivo; não dependa exclusivamente de hover ou cor.

Acrescente um momento memorável e um teste de retorno: terminar uma corrida e
querer tentar de novo; exportar um plano de carga utilizável pelo cliente.
O agente pode demonstrar o fluxo, mas a reação humana não deve ser inventada.

### Bloco 6 — Método e verificação

Comece por inspecionar o projeto, identificar comandos reais e estabelecer o
primeiro caso de aceitação. Depois implemente em fatias. Um harness é apenas
o conjunto de ferramentas que dirige cenários e coleta evidências; não precisa
ser um framework grande antes da primeira funcionalidade.

| Natureza | Instrumento | Limite da evidência |
| --- | --- | --- |
| Regras | Testes do motor, seeds, limites e casos adversários | Não prova apresentação |
| Visual | Navegador real, estados conhecidos, capturas | Um frame não prova movimento |
| Simulação | Relógio controlado, eventos e invariantes | Determinismo deve ter escopo definido |
| Áudio | Gravação, níveis, clipping, reprodução | Métrica não substitui escuta |
| Performance | Medição no cenário declarado | Resultado depende do ambiente |

Use seeds e tempo controlado quando aplicável. Capturas podem variar entre
GPUs, fontes e navegadores; igualdade de pixels não é uma garantia universal.

Formato útil de uma ocorrência:

```text
ID: VIS-03
Critério: C4 — tinta e território representam o mesmo estado
Reprodução: seed 17, volta 1, cruzar o trecho norte
Esperado: o HUD reflete a área pintada após a atualização
Observado: HUD permanece em zero
Evidência: caminho da captura e registro de estado
Impacto: bloqueia o resultado correto da partida
Situação: aberto / corrigido e verificado / não reproduzido
```

Peça um crítico separado quando houver ferramenta para isso. Sem subagentes,
faça uma etapa distinta de revisão e diga que ela não foi independente. Não
simule nomes de agentes nem pareceres que não ocorreram.

Repita implementação → execução → inspeção → correção enquanto existir falha
reproduzível no escopo acordado. Não acrescente novos critérios indefinidamente.
Após mudanças relevantes, rode as verificações afetadas e os checks exigidos
pelo projeto. Não repita suítes sem uma mudança, falha ou dúvida que justifique.

Se houver impedimento real, registre o requisito pendente, o que foi tentado
e o dado ou recurso necessário. Continue as partes independentes possíveis.
Limite de tempo ou de recursos produz uma entrega parcial declarada, não um
“pronto” artificial.

### Bloco 7 — Entrega

Peça código no projeto, README com comandos reais, mapa requisito/evidência,
limitações e próximos passos apenas para o que ficou fora da aceitação.
Não exija `npm test` em um repositório que usa outro comando: use o existente
ou crie um comando adequado se a tarefa exigir testes novos.

Separe os estados: arquivos locais, commit, envio remoto, deploy e URL testada.
Só peça publicação quando ela fizer parte do objetivo. Um build bem-sucedido
não significa que o site foi publicado.

## 6. Trabalho longo e retomada

Para projetos grandes, proponha um arquivo de progresso curto contendo objetivo,
decisões, critérios, evidências, pendências e próxima ação. É um artefato de
trabalho para retomar contexto, não um mecanismo que garante execução contínua.
Atualize-o após marcos importantes; não use um diário enorme como substituto
para implementação.

O pedido “continue até concluir” indica persistência durante o trabalho possível;
não configura agendamento, orçamento ilimitado ou atividade depois que a sessão
terminar. Configurações e permissões do ambiente continuam valendo.

## 7. Erros a evitar

- Trocar apenas “Claude” por “GPT” e manter dependências de ferramentas não verificadas.
- Achar que os sete blocos exigem sete agentes ou uma quantidade fixa de etapas.
- Confundir uma preferência estética com critério técnico automaticamente mensurável.
- Pedir certeza visual, sonora ou de desempenho sem disponibilizar meios de inspeção.
- Prometer porcentagens de qualidade sem uma lista de requisitos definida.
- Construir todos os recursos antes de testar uma sessão ou fluxo completo.
- Mudar testes para esconder um defeito ou retirar um critério para conseguir aprovação.
- Transformar “produto finalizado” em autorização implícita para excluir dados ou publicar.
- Inventar arquivos dos exemplos históricos que não foram fornecidos.
- Exigir raciocínio interno detalhado; prefira decisões breves e evidências verificáveis.

## 8. Checklist antes de enviar

- [ ] Produto, público e fluxo completo definidos.
- [ ] Stack e comandos compatíveis com o projeto.
- [ ] Uma direção, uma estrela e cortes explícitos.
- [ ] Controles, estados de erro e acessibilidade considerados.
- [ ] Critérios observáveis com evidência correspondente.
- [ ] Recursos de navegador, áudio e performance condicionados à disponibilidade real.
- [ ] Delegação solicitada explicitamente, com alternativa sequencial.
- [ ] Condição de conclusão e tratamento de bloqueios definidos.
- [ ] Escopo de commit/publicação declarado.
- [ ] Nenhum campo do molde ficou sem preencher por acidente.

## 9. Próximo passo

Abra o [molde Codex](PROMPT-FABRICA.md), preencha e use apenas o bloco de execução.
Ele inclui também prompts curtos de revisão e retomada. Para consultar a origem,
veja o [estudo original](../claude-code/PROMPT-FABRICA.md); exemplos e métricas
históricas pertencem àquele material, não a uma validação desta edição.
