# PRESOS — computadores de enigmas

Terminal Angular reutilizável com dois modos, enigmas encadeados e histórico de conversa.

## Executar

```sh
npm install
npm start
```

Abra `http://localhost:4200`. Cada nome é também uma rota: `/inno_m1nvl`, `/sultao_d`, `/tec_la`, `/nkai_a`, `/grd_s0nhadr`, `/chma_vva`, `/h_colinas`, `/caosra_st`, `/sr_grdabs` e `/fnt_primdal`.

## Comandos

Digite o comando e pressione Enter. Maiúsculas/minúsculas e espaços nas pontas são ignorados no reconhecimento dos comandos. A validação das respostas também ignora acentos: `NÓ`, `nó`, `NO` e `no` são equivalentes.

| Comando                   | Resultado                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `limpa`                   | Apaga a conversa e o histórico recuperável com ↑/↓; preserva o modo e o contador da sessão.                    |
| `contexto`                | Consulta somente o último PC da sequência de saídas e seleciona esse PC como destino; sem saída, consulta o próprio terminal. |
| `entd`                    | Nome do computador conectado à entrada.                                                                        |
| `sda`                     | Nome do computador conectado à saída.                                                                          |
| `cncta_ent nome_do_pc`    | Conecta a saída do PC informado à entrada deste terminal.                                                      |
| `cncta_sda nome_do_pc`    | Conecta a saída deste terminal à entrada do PC informado.                                                      |
| `cncta_ent` / `cncta_sda` | Sem argumento (mesmo com espaços no final), são mensagens comuns. Com `nenhum`, desconectam aquele lado.       |
| `lbr_ent`               | Desconecta a entrada deste terminal. Exige a chave do próprio PC.                                               |
| `lbr_sda`               | Desconecta a saída deste terminal. Exige a chave do próprio PC.                                                 |
| `acordado`                | Ativa respostas narrativas aleatórias sobre a identidade do PC, sem repetir imediatamente a mesma fala.        |
| `dormindo`                | Coloca este PC e todos os seguintes pela saída em modo dormindo, mesmo que estejam acordados ou bloqueados.                                                        |
| `/segredos`               | Lista os comandos.                                                                                             |

O terminal começa **acordado**. Cada mensagem enviada recebe uma resposta; não há respostas por tecla. Comandos de controle funcionam nos dois modos e não passam pela cifra. A lista de comandos é revelada apenas por `/segredos`. `ajuda` e `/ajuda` são mensagens comuns. `/limpar` continua aceito. Textos comuns preservam espaços, capitalização e pontuação antes de entrar na cifra.

As mensagens passam automaticamente de PC em PC. Cada máquina em `dormindo` aplica sua cifra ao resultado anterior. O emissor mostra o percurso completo; os receptores registram a entrada, a saída e a máquina de origem em seus históricos. Palavras produzidas pelas cifras nunca são interpretadas como comandos, mesmo que o resultado seja `limpa`, `dormindo` ou `contexto`. Os comandos `dormindo` e `contexto` digitados diretamente têm um fluxo próprio pela rede, sem passar pelas cifras.

Cada PC dormindo verifica se o resultado da própria cifra corresponde à sua palavra-chave antes de encaminhar para a saída. Ao reconhecê-la, a transmissão para nele: o percurso completo e correto libera a chave e mostra a conclusão; um percurso local, incompleto ou fora de ordem mostra a rota numerada necessária, sem liberar a chave. Essa regra funciona mesmo sem consultar `contexto` ou com outro destino selecionado, e a saída permanece conectada para outras mensagens.

O comando `contexto` segue as saídas até o último PC e exibe somente o enigma dele, no emissor e no próprio destino; os intermediários não respondem. Isso funciona nos dois modos e não altera o modo de nenhum PC. Sem saída, o terminal consulta seu próprio enigma. Uma rede circular não tem último PC: nesse caso, o comando informa o ciclo e preserva o destino anterior. A consulta seleciona o último PC como destino da transmissão. Ela para após aplicar a cifra desse PC, mesmo que ele tenha outra saída conectada. Se a palavra-chave não for reconhecida e a ordem completa dos PCs não corresponder ao contexto, o emissor recebe apenas `TRANSMISSÃO INTERROMPIDA: percurso inválido.`. A palavra-resposta permanece oculta. Enigmas com mensagem de conclusão configurada validam também o resultado final; nos demais, apenas o percurso é validado.

Um receptor acordado devolve uma fala e interrompe a transmissão. Enviar `dormindo` no início coloca todos os PCs seguintes em modo dormindo, sem seguir ligações de entrada; o comando funciona mesmo em receptores acordados. Em um ciclo, cada PC alcançado dorme uma vez e o emissor recebe a mensagem de ciclo detectado. Uma saída desconectada também encerra o envio; se havia um destino pendente, o emissor avisa que não foi alcançado. Ciclos são interrompidos antes de processar a mesma máquina pela segunda vez. Sem contexto selecionado, a mensagem segue as saídas até uma dessas condições.

Todos os PCs começam com os comandos de conexão bloqueados. Resolver a cifra com a resposta correta e o percurso completo, no modo dormindo, libera as conexões daquele PC. A resposta é validada para liberar a chave mesmo nos enigmas sem mensagem de conclusão. Digitar a resposta diretamente não libera a chave. Um PC liberado pode usar `cncta_ent` ou `cncta_sda` para se conectar a um PC ainda bloqueado. O bloqueio depende de onde o comando é executado, incluindo desconexões com `nenhum`, `lbr_ent` e `lbr_sda`; conexões existentes continuam transmitindo. Tentativas bloqueadas retornam apenas `Chave não encontrada ou não digitada nos ultimos 30 dias.`. Não há expiração por tempo.

Cada PC tem uma entrada e uma saída. Alterar uma conexão atualiza os dois lados e desfaz as ligações substituídas. `lbr_ent` deixa a entrada vazia e remove a saída correspondente do PC anterior; `lbr_sda` deixa a saída vazia e remove a entrada correspondente do próximo PC. O outro lado permanece intacto e é possível reconectar depois com `cncta_ent` ou `cncta_sda`. Acertar uma palavra-chave encerra somente aquela mensagem: as ligações continuam disponíveis para os próximos envios. Nomes desconhecidos, argumentos excedentes e conexões do PC consigo mesmo são rejeitados sem alterar a rede.

Históricos, conexões, chaves liberadas, modos e destino são mantidos ao trocar de PC e recarregar **na mesma aba** por meio de `sessionStorage`. Abas e dispositivos diferentes não sincronizam a rede. Quando o navegador bloqueia o armazenamento, o jogo funciona em memória. `limpa` apaga apenas a conversa e a recuperação pelas setas do PC atual, preservando modo, conexões, chaves liberadas e contador. Cada inicialização do servidor cria uma nova identificação de sessão. Ao detectar a mudança, o navegador substitui o progresso salvo pelo estado inicial: históricos, rascunho, contadores, destino e chaves são apagados; todos os PCs ficam acordados e somente `chma_vva → tec_la → fnt_primdal` permanece conectado. A verificação ocorre ao abrir/recarregar, a cada 10 segundos e ao retornar à aba ou recuperar a conexão. Recarregar durante a mesma sessão preserva o progresso. Uma falha de rede sozinha não apaga o jogo; o reset ocorre quando o servidor confirma uma nova identificação. Sessões antigas sem identificação são zeradas na primeira confirmação.

## Organização do código

O módulo de terminais fica em `src/app/features/terminals/`. Cada PC tem sua configuração, as cifras e funções são separadas da interface e os testes `*.spec.ts` ficam junto do código correspondente. Veja [a estrutura, as funções reutilizáveis e como adicionar um PC](docs/architecture.md).

## Configuração do mestre

`src/app/features/terminals/data/computers/` contém um arquivo por PC, com sua charada, resposta, falas e referência à cifra. As conexões iniciais e os percursos ficam em `features/terminals/config/`. As cifras e charadas de Hastur, da Tecelã e do sultão estão configuradas para a campanha; as demais ainda são provisórias. As falas são originais, inspiradas nas entidades da campanha, sem mencionar seus nomes; todo o conteúdo pode ser editado pelo mestre. A resposta está no código para referência do mestre, mas não é exibida na interface. Como é um front-end, o código pode ser inspecionado pelo navegador.

A única sequência conectada inicialmente é `chma_vva → tec_la → fnt_primdal`. A entrada de `chma_vva` e a saída de `fnt_primdal` ficam livres; os outros sete PCs começam sem conexões. As demais ligações são feitas pelos jogadores. Sessões salvas pela versão anterior recebem essa configuração uma única vez, preservando históricos, modos e destino. Conexões criadas após a migração continuam salvas normalmente.

O percurso de `chma_vva` contém apenas ele mesmo: `chma_vva` (1 computador). Todos os demais percursos incluem `tec_la` exatamente uma vez. A fábrica insere essa máquina depois do início quando ela está ausente, mantendo o destino e as etapas existentes. Se o percurso contém somente o destino, a inserção ocorre antes dele. Rotas que já incluem `tec_la`, como a de SONHO, permanecem iguais. Essa regra não cria conexões na sessão.

`PUZZLE_ORDER` define apenas os percursos de referência dos enigmas, sem conectar os computadores:

```text
inno_m1nvl → grd_s0nhadr → caosra_st → sultao_d → tec_la
→ nkai_a → chma_vva → h_colinas → sr_grdabs → fnt_primdal → inno_m1nvl
```

`createComputer(definition, options)` gera uma configuração a partir de propriedades nomeadas. `steps` e `encode` são opcionais: por padrão, o percurso parte de três PCs e inclui `tec_la` se ela estiver ausente; a cifra desloca A–Z/a–z em três posições. `inno_m1nvl` usa a Cifra da Máscara, `tec_la` usa a Cifra da Teia e `sultao_d` usa a decodificação do Núcleo Caótico, descritas abaixo. Acentos, números e pontuação são preservados pela cifra de deslocamento.

A quantidade inclui **o primeiro computador e o destino**, entre 1 e 10. A função calcula o início do enigma pela ordem de referência dos percursos. Os comandos de conexão alteram a rede da sessão, mas não alteram o desafio definido pelo mestre. Para mudar as ligações iniciais, edite `INITIAL_CONNECTION_CHAIN` em `config/initial-connections.ts`; `PUZZLE_ORDER` em `config/puzzle-routes.ts` afeta apenas os enigmas. Para migrar ligações de sessões salvas, incremente `CONNECTIONS_VERSION` em `config/network.config.ts`. Para mudar a quantidade, a cifra ou a narrativa de um PC, edite sua chamada `createComputer`. A ordem do array `COMPUTERS` determina o terminal inicial do site.

Exemplo do mestre para `caosra_st`: a resposta é `loucura`, passando por `inno_m1nvl → tec_la → grd_s0nhadr → caosra_st`. Com as cifras provisórias:

```text
egtvhjkmnpnpvx → [inno_m1nvl] fuiloow → [tec_la] fiowolu → [grd_s0nhadr] ilrzrox → [caosra_st] loucura
```

Para experimentar o exemplo automaticamente, use a mesma aba, com as chaves de `inno_m1nvl`, `tec_la` e `grd_s0nhadr` já liberadas:

1. Abra `/caosra_st`, execute `contexto` e `dormindo`.
2. Abra `/grd_s0nhadr`, execute `cncta_sda caosra_st` e `dormindo`.
3. Abra `/tec_la`, execute `cncta_sda grd_s0nhadr` e `dormindo`.
4. Abra `/inno_m1nvl`, execute `cncta_sda tec_la`, `dormindo` e envie `egtvhjkmnpnpvx`.
5. A saída exibirá as quatro etapas até `loucura`. Ao voltar a `/caosra_st`, a mensagem recebida estará no histórico.

`TerminalNetwork` em `src/app/features/terminals/services/terminal-network.service.ts` centraliza estado, comandos e transmissão. A interface reutilizável recebe `ComputerConfig`. As cifras devem ser síncronas e aceitar qualquer texto de até 2.000 caracteres; `awakePhrases` exige pelo menos uma fala.

## Verificar

```sh
npm run build
npm test -- --watch=false
npm run test:server
```

## Uso no celular

- Layout adaptado a telas estreitas e ao modo paisagem, respeitando as áreas seguras da tela.
- Campo de envio separado da rolagem do histórico, com tamanho ajustado à área visível quando o teclado abre.
- Campos com fonte de 16 px, correção automática desativada e indicação de Enviar no teclado virtual.
- Botões e seletor com pelo menos 44 px de altura. Os botões ↑/↓ recuperam mensagens sem depender de teclado físico.
- Seletor no topo para trocar de PC na mesma aba e preservar a sessão.
- Sem foco automático ao abrir o terminal em dispositivos de toque; Limpar também não abre o teclado automaticamente.
- Zoom do navegador permanece habilitado. Textos longos quebram linha no histórico.

A validação de responsividade usa tamanhos simulados no navegador; o comportamento do teclado virtual do aparelho deve ser conferido também em Android/iOS.

## Acessar pelo Wi-Fi

No computador que hospeda o projeto, execute:

```sh
npm run start:lan
```

Parar e executar novamente `npm run start:lan` inicia uma nova sessão e zera o progresso nos navegadores quando eles detectarem o servidor. A mesma regra vale para `npm start` e para o servidor SSR de produção.

O comando detecta os IPv4 atuais do computador, autoriza esses endereços no SSR via `NG_ALLOWED_HOSTS` e mostra os links no console. O servidor aceita conexões da rede na porta 4200. No computador, use `http://localhost:4200`. Nos celulares conectados ao mesmo roteador, use `http://IP_DO_COMPUTADOR:4200` (por exemplo, `http://192.168.15.17:4200`). O computador pode estar conectado por cabo e os celulares por Wi-Fi, desde que o roteador permita a comunicação entre eles.

`localhost` no celular aponta para o próprio celular. Use o IPv4 do computador, consultável com `ipconfig` no Windows; ele pode mudar quando você trocar de rede. Mantenha o computador ligado e o servidor rodando durante a sessão.

Se o Windows solicitar acesso de rede para o Node.js, permita na rede privada usada para o jogo. Se o celular não abrir, verifique a permissão da porta TCP 4200 no firewall e se o Wi-Fi não é uma rede de convidados com isolamento entre dispositivos. Não é necessário encaminhar portas no roteador para uso na mesma rede.

Este comando compartilha o acesso ao site. O estado do jogo continua independente em cada aba/aparelho; sincronizar jogadores exige uma camada de servidor compartilhada.

## Respostas sem dicas

A interface mostra confirmações curtas de estado e mensagens de falha sem sugestões de correção. Em uma transmissão interrompida, o emissor exibe apenas o motivo da falha, sem acrescentar o percurso parcial. O histórico de cada receptor mantém os dados recebidos.

`contexto` fornece a charada, o início, a quantidade de PCs, a lista numerada dos computadores na ordem de travessia e o destino. `/segredos` lista somente os nomes dos comandos, sem explicações, sintaxe ou exemplos. As instruções deste README são destinadas ao mestre e não aparecem na interface dos jogadores.

## Núcleo Caótico — referência do mestre

A cifra de `sultao_d` está em `src/app/features/terminals/ciphers/chaotic-core.ts`. O terminal **decodifica** a inscrição: preserva grupos de 2, 3 e 1 caracteres, descartando um caractere depois de cada grupo; então recua as letras A–Z/a–z em 1, 3 e 5 posições, ciclicamente. Ambos os pulsos reiniciam a cada mensagem, com retorno circular no alfabeto e preservação de maiúsculas/minúsculas.

Qualquer caractere pode ocupar um descarte, incluindo espaço, símbolo ou emoji. O ritmo do ruído conta pontos de código Unicode. Espaços, pontuação e acentos que sobrevivem ao descarte permanecem como estão e não avançam o pulso das letras. Um último grupo incompleto é lido até o fim, sem exigir um descarte inexistente. Não há validação de formato nem dicas na interface.

Exemplos para teste local: `FQQYSDDWW → ENTRAR`; `TRRSIRR → SONHO`. O enigma de `sultao_d` usa a charada fornecida para SONHO e exige esta ordem exata:

`chma_vva → tec_la → fnt_primdal → nkai_a → h_colinas → sr_grdabs → inno_m1nvl → grd_s0nhadr → caosra_st → sultao_d`

Essa é a rota do enigma, definida por `SULTAO_ROUTE`; as conexões iniciais continuam apenas `chma_vva → tec_la → fnt_primdal`. As demais são feitas pelos jogadores. Com a sequência César → Teia → quatro cifras César → Máscara → duas cifras César, enviar `XXZVVXXVVOXMWY` em `chma_vva` faz chegar `TRRSIRR` ao último PC, que devolve `SONHO`. Esse exemplo precisará mudar quando as outras cifras forem definidas.

Somente a resposta SONHO (sem distinção de maiúsculas/minúsculas, ignorando espaços externos), após atravessar a rota completa em ordem e com os PCs dormindo, libera as três frases finais. Elas aparecem no histórico de `sultao_d` e no terminal emissor, mesmo sem consultar `contexto` antes. Uma consulta de contexto seleciona o último PC da sequência de saídas consultada, que pode interromper o trajeto antes. Digitar `sonho` diretamente em `sultao_d`, somente quando dormindo, mostra somente o percurso numerado dos dez PCs. Maiúsculas/minúsculas e espaços externos são ignorados. Essa consulta não encaminha a palavra nem libera a conclusão. Decifrar uma inscrição diretamente no último PC mostra o percurso e não libera a conclusão: a mesma transmissão deve atravessar os nove PCs anteriores na ordem configurada. A mensagem configurável em `context.successMessage` não é encaminhada como parte da cifra.

As três frases finais são:

> A primeira mentira foi aceita.
> Aquilo que não existe agora conhece teu nome.
> Não desperte ainda.

## Cifra da Máscara — referência do mestre

A cifra de `inno_m1nvl` fica em `src/app/features/terminals/ciphers/mask.ts`. Para cada par A–Z/a–z, calcula a distância circular para a frente entre a primeira e a segunda letra e avança metade dessa distância, arredondada para baixo. A ordem importa: `RT → S`, mas `TR → F`. Pares consecutivos no sentido de leitura, como `AB`, `BC` e `ZA`, produzem um espaço em branco. A ordem continua importando: `BA → N` e `AZ → M`. Pares de letras iguais também produzem um espaço. Uma letra sem par é lida como se estivesse duplicada e, portanto, produz um espaço.

O resultado mantém a ordem dos pares: `PO → B` e `PORTA → "BS "` (com espaço ao final). A caixa da primeira letra define a caixa da saída de cada par. Espaços, pontuação, números, acentos e emojis são preservados e separam os trechos de letras; pares não atravessam esses separadores. Cada mensagem reinicia a leitura.

A charada fornecida tem resposta `PALCO`. O percurso é `sr_grdabs → tec_la → inno_m1nvl`, definido por `HASTUR_ROUTE`. Com as cifras atuais, `LMNKWAYYHJ → OPQNZDBBKM → OQZBKMBDNP → PALCO`. Apenas a resposta correta após a travessia completa, em ordem e com os PCs dormindo, mostra a conclusão no destino e no emissor:

> O papel estava vazio. Agora ele pertence a você.

Digitar uma inscrição diretamente em Hastur permite experimentar a cifra; se resultar em `PALCO`, o terminal mostra o percurso necessário e encerra o envio sem liberar essa conclusão. As regras da cifra e os exemplos deste README não aparecem na interface dos jogadores.

## Cifra da Teia — referência do mestre

`src/app/features/terminals/ciphers/web.ts` contém `weaveText` e sua inversa `unweaveText`. O terminal aplica `weaveText`: reúne os caracteres das posições ímpares na ordem original, depois acrescenta os das posições pares em ordem inversa. Exemplos: `PORTA → PRATO`, `SOOHN → SONHO`, `ABCDEFGH → ACEGHFDB`.

As posições contam pontos de código Unicode na mensagem inteira, incluindo espaços, pontuação, acentos e emojis. Nenhum caractere é inserido, descartado ou substituído; nenhuma normalização é aplicada. Sequências compostas por vários pontos de código, como letras com acento combinante, podem ser separadas pela permutação, mas a inversa recupera a sequência original exatamente. A inversa é uma função para ferramentas do mestre e testes, sem comando adicional na interface.

A charada da Tecelã tem como resposta exata `TODO FIO ENCONTRA O MESMO NÓ`, comparada sem distinção de maiúsculas/minúsculas ou acentos. Seu percurso é `chma_vva → tec_la`, definido por `WEB_ROUTE`. As conexões iniciais permanecem `chma_vva → tec_la → fnt_primdal`; o acerto encerra a transmissão na Tecelã. Produzir a frase somente em `tec_la` mostra `chma_vva → tec_la`, sem encaminhar à Fonte nem liberar a chave. Produzi-la vindo de `chma_vva` aceita a chave e mostra as frases de conclusão, também sem encaminhar à Fonte.

Com a cifra atual de `chma_vva`, envie `QÓLKA LL JCPFBLJ  BLK ZXLOKQ` para que chegue `TÓOND OO MFSIEOM  EON CAORNT` à Tecelã e ela produza a resposta. Os dois espaços consecutivos nesses exemplos fazem parte da entrada.

Após acertar pelo percurso completo, o destino e o emissor exibem:

> O nó foi fechado.
> O caminho que entrou já não é o caminho que sai.

A fala “Nenhum fio é criado. Nenhum fio é perdido. Apenas o caminho muda.” participa das respostas aleatórias no modo acordado. Nos demais envios, o terminal continua mostrando apenas o resultado da cifra, sem diagramas ou instruções extras. `tec_la` continua obrigatória nos demais percursos da campanha; `chma_vva` é a exceção, com percurso local.
