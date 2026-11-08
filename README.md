# Fatos

Um jogo simples e colorido para crianças praticarem os **fatos básicos** de
**adição, subtração, multiplicação e divisão**. Funciona no computador, no
tablet e no celular.

*A simple, colourful game for kids to practise basic arithmetic facts. The interface is in Brazilian Portuguese. [English summary below](#english).*

## Como jogar

1. No menu de cima, escolha uma ou mais operações: **Adição (+)**, **Subtração (−)**,
   **Multiplicação (×)** e **Divisão (÷)**. Elas podem ser combinadas à vontade.
2. Toque em **Começar**. Depois de uma contagem "3, 2, 1, Já!", o jogo começa
   e o botão vira **Reiniciar**, que zera o tempo e embaralha os fatos de novo.
3. Aparece um fato, por exemplo `4 + 3 =`. Toque ou clique na tela para ver a
   resposta: `4 + 3 = 7`.
4. A criança diz se acertou: toque no **✓ verde (Acertei)** ou no **✗ vermelho
   (Errei)** para ir ao próximo fato. Um fato errado **volta para o fim da fila**
   e aparece de novo, até ser acertado.
   O **placar** lá em cima mostra quantos fatos já foram acertados (✓) e quantos
   foram errados e ainda vão reaparecer (✗). Quando um fato errado é acertado,
   ele sai do ✗ e entra no ✓. O contador de fatos e a barra avançam a cada acerto.
5. Use **Pausar** para parar o cronômetro e **Continuar** para voltar.
   O jogo também pausa sozinho quando a criança sai da aba ou do aplicativo.
6. Quando todos os fatos forem acertados, aparece a tela de **Parabéns!** com o
   tempo total, quantos foram acertados de primeira (e a porcentagem) e quantas
   vezes a criança marcou Errei.

Se as operações forem trocadas no meio do jogo, o jogo para e volta à tela inicial;
é só tocar em **Começar** de novo.
A última seleção fica salva no navegador.

### Atalhos de teclado

| Tecla | Ação |
|---|---|
| Espaço ou Enter | Mostrar a resposta |
| A | Acertei |
| E | Errei |
| P | Pausar / continuar |

## Fatos incluídos

| Operação | Fatos | Regra |
|---|---|---|
| Adição | 121 | Todas as combinações de 0 a 10 |
| Subtração | 121 | Todas as inversas da adição (ex.: 7 − 4 = 3) |
| Multiplicação | 121 | Todas as combinações de 0 a 10 |
| Divisão | 110 | Todas as inversas da multiplicação, sem divisão por zero |

Os fatos são embaralhados e cada um aparece uma vez por rodada; os errados
voltam para o fim da fila até serem acertados.

## Como rodar

É um site estático, sem dependências nem etapa de build:

- **No computador:** abra o arquivo `index.html` no navegador.
- **Servidor local (opcional):** `python3 -m http.server` e acesse `http://localhost:8000`.
- **Na internet:** publique a pasta no GitHub Pages
  (*Settings → Pages → Deploy from a branch*).

A fonte [Baloo 2](https://fonts.google.com/specimen/Baloo+2) é carregada do
Google Fonts; sem internet, o site usa uma fonte do sistema.

## Estrutura

```
index.html   Página e telas do jogo
style.css    Visual, animações e layout responsivo
app.js       Geração dos fatos, cronômetro e lógica do jogo
```

## English

**Fatos** is a static web game for practising addition, subtraction,
multiplication and division facts. Pick one or more operations, press
**Começar** (Start), and tap the screen to reveal each answer, then mark it
right or wrong. Wrong facts go back to the end of the queue and come up again
until they are answered right; the scoreboard shows facts mastered (✓) and
facts still waiting to be retried (✗). It has a timer, a pause button and a progress bar. Addition
and multiplication cover every pair from 0 to 10, and subtraction and division
cover all of their inverses (no division by zero). Open `index.html` in any
browser to play.

## Licença e créditos

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).

O mascote (a estrela) e todos os ícones são desenhos SVG originais feitos para
este projeto e estão sob a mesma licença MIT. O site não usa emojis nem imagens
de terceiros. A única peça externa é a fonte
[Baloo 2](https://fonts.google.com/specimen/Baloo+2), da Ek Type, distribuída
sob a [SIL Open Font License 1.1](https://openfontlicense.org/), que permite
uso livre, inclusive comercial.
