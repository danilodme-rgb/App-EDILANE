# Rotina do Danilo

App de rotina diária: monte sua agenda por período (manhã, tarde e noite), marque
o que foi feito e acompanhe o progresso do dia e da semana. Interface em
português, com tema **verde escuro e claro**.

## Recursos

- Rotina dividida em **Manhã / Tarde / Noite**, com filtro por período
- Toque na tarefa para marcar como concluída (anel de progresso e contadores atualizam na hora)
- **Tira de semana** para navegar entre os dias e ver quais tiveram progresso
- Estatísticas: dias seguidos com rotina 100%, tarefas feitas hoje e média da semana
- Criar / editar / excluir tarefas com **ícone, horário e dias da semana** de repetição
- **Anotações do dia**
- **Tema claro e escuro** (segue o sistema por padrão, com botão para alternar)
- Funciona **offline** e pode ser instalado como app (PWA)
- Dados salvos localmente no aparelho (`localStorage`) — nada é enviado para servidores

## Como usar

Basta abrir o `index.html` no navegador. Para o modo offline/instalável (PWA),
sirva a pasta por HTTP, por exemplo:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Estrutura

```
index.html              interface
styles.css              paleta verde + tema claro/escuro
app.js                  estado, renderização e ações
sw.js                   service worker (cache offline)
manifest.webmanifest    metadados do PWA
assets/icon.svg         ícone do app
```

## Paleta

| Token | Claro | Escuro |
|---|---|---|
| Fundo | `#f1fbf5` | `#06211a` |
| Superfície | `#ffffff` | `#0b3327` |
| Destaque | `#15803d` | `#3ec775` |
| Verde escuro | `#0f5132` | `#062a1e` |
| Verde claro | `#b6f0cd` | `#12452f` |
