# PRESOS — computadores de enigmas

Front-end Angular com terminal verde, efeito discreto de monitor CRT, histórico de entrada/saída e layout para desktop e celular.

## Executar

```sh
npm install
npm start
```

Abra `http://localhost:4200`. Rotas disponíveis:

- `/inno_m1nvl`
- `/sultao_d`
- `/tec_la`
- `/nkai_a`
- `/grd_s0nhadr`
- `/chma_vva`
- `/h_colinas`
- `/caosra_st`
- `/sr_grdabs`
- `/fnt_primdal`

Os nomes exibidos são iguais aos caminhos. A página inicial abre `inno_m1nvl`. As regras são provisórias: `sultao_d` inverte o texto (porta → atrop); os demais usam o deslocamento de três letras (abc → def). Cada terminal tem configuração independente para receber seu enigma. Ainda não há frase-alvo nem validação de vitória.

## Criar outro computador

Adicione um objeto ao array `COMPUTERS` em `src/app/computers.ts`:

```ts
{
  id: 'laboratorio', // caminho único da página, sem barras
  name: 'LAB-03',
  location: 'BLOCO C / LABORATÓRIO',
  serial: 'PRS-003-C',
  welcome: 'Escreva sua mensagem.',
  encode: (text) => text.toUpperCase(),
}
```

A rota `/laboratorio` será criada automaticamente. O componente `Terminal` recebe uma `ComputerConfig`: aparência e interação ficam separadas das regras. As funções de codificação devem ser síncronas, retornar texto e aceitar qualquer entrada de até 2.000 caracteres.

## Interação

- Enter ou botão ↵: envia uma palavra ou frase.
- ↑ / ↓: recupera entradas anteriores e restaura o rascunho ao voltar ao final.
- `/ajuda` ou Ajuda: mostra instruções.
- `/limpar` ou Limpar: limpa apenas o histórico visível, preservando contador e entradas recuperáveis pelas setas.

O histórico fica apenas na memória da sessão e reinicia ao recarregar ou mudar de computador. A codificação de exemplo do primeiro terminal altera apenas A–Z/a–z; acentos, números e pontuação são preservados. Toda a lógica está no front-end e pode ser inspecionada pelo navegador.

## Verificar

```sh
npm run build
npm test -- --watch=false
```
