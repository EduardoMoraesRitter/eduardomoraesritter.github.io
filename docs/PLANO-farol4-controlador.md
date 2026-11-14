# Farol 4 · controlador automático de velocidade

Pedido (13/11/2026): a velocidade deve se ajustar sozinha ao que cada celular aguenta. Depende do aparelho, da bateria e da luz, então precisa ser medido e testado, não fixado por regra.

Versão boa guardada: tag `farol4-600-12` (bloco 600, 12 quadros/s), no `main` em `f6ed669`.

## Como funciona

- O receptor mede blocos novos aceitos por segundo e manda para o transmissor, junto com um identificador do aparelho (`device`, guardado no navegador do receptor).
- O transmissor calcula a eficiência: blocos novos ÷ blocos que os quadros atuais poderiam trazer (3 canais, com 1 quadro de metadados a cada 12).
- Eficiência ≥ 0,9 por 2 medições seguidas: sobe 1 quadro/s, até o teto aprendido.
- Eficiência < 0,7 por 2 medições seguidas: desce 2 quadros/s e guarda o teto (um a menos que o ponto que falhou).
- Entre 0,7 e 0,9: mantém. Mudanças têm pelo menos 6 s de intervalo.
- Travamento (sem bloco novo por 8 s): não sobe nunca; a regra antiga de recuperação continua valendo.
- O controle só julga o link quando os quadros estão cheios (primeira passada, ou fila de reparo com pelo menos 3 quadros de blocos). No fim do arquivo, quadros quase vazios não contam como lentidão do celular.
- O interruptor "Ajustar a velocidade sozinho" fica ligado por padrão e pode ser desligado.
- O teto aprendido fica guardado no navegador do transmissor, por aparelho (`farol4-speed-profiles`).

## Checklist

- [x] Guardar a versão atual com tag `farol4-600-12` e publicá-la
- [x] Controlador puro (`speed-controller.mjs`) com 7 testes em node, incluindo simulação de celular com capacidade fixa
- [x] Ajuste de limiar: 0,5 não separava nada; faixa 0,7–0,9
- [x] Correção: começar nunca acima do teto aprendido
- [x] Ligação no transmissor (`missing`) e identificador do aparelho no receptor
- [x] Só julgar o link com quadros cheios
- [ ] Teste de navegador com dois peers reais (envio e recepção), em cenários de capacidade, queda no meio, travamento e tamanhos de arquivo
- [ ] Relatório do teste em `docs/`, e decisão de subir para o `main`
- [ ] Teste no celular real (fora do alcance desta sessão)

## Limites conhecidos

- Testes em notebook com câmera simulada. A capacidade real do celular depende de luz, distância, bateria e temperatura.
- Sender e receiver precisam ser peers reais (Supabase), porque o controle roda no transmissor e recebe as medições pelo canal de retorno.
