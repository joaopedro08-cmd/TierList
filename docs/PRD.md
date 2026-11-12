# PRD — SiterList

> **Produto:** plataforma web pessoal para criar, personalizar e exportar tier lists de qualquer tipo de item.
> **Documento:** Product Requirements Document (PRD)
> **Versão:** 0.2 — posicionamento genérico, visual monocromático e fluxo foto-first
> **Data:** 08/11/2026

## Controle do documento

| Campo | Valor |
|---|---|
| Produto | SiterList (nome provisório) |
| Tipo | Web app estática, local-first, sem login no MVP |
| Versão | 0.2 — implementação local-first |
| Data | 08/11/2026 |
| Status | Implementado no protótipo navegável |
| Público | Produto, Design, Engenharia e QA |
| Referência funcional | TierMaker, com personalização e direção visual superiores |

### Histórico de revisões

| Versão | Data | Descrição |
|---|---|---|
| 0.1 | 06/11/2026 | Versão inicial a partir do briefing do produto |
| 0.2 | 08/11/2026 | Posicionamento para qualquer item, chrome monocromático/Poppins e cadastro foto-first |

---

## 1. Resumo executivo

O SiterList é uma aplicação web para criar tier lists de **qualquer tipo de item** — jogos, filmes, personagens, comidas, lugares, álbuns e mais — com liberdade visual muito maior do que a de ferramentas genéricas: capa própria, quantidade e nomes de categorias configuráveis, cores por tier, temas por lista, fundos, tamanhos de card e um editor de capa integrado. O usuário monta o ranking arrastando os itens, adiciona novos itens a qualquer momento e exporta o resultado em alta resolução.

O cadastro é **foto-first**: enviar uma foto basta. O nome é sugerido automaticamente a partir do arquivo, e nome, detalhe, tier e nota são opcionais. Se o nome ficar vazio, o item é salvo como “Sem título”.

O produto é **local-first**: não exige conta no MVP. As tier lists e o ranking são salvos automaticamente no **armazenamento local** do navegador, com até **5 MB**, e um espelho em **cookies** protege estados pequenos contra limpeza acidental. Os arquivos de imagem ficam no **IndexedDB**. O backup da estrutura e do ranking pode ser exportado e reimportado a qualquer momento; o backup completo com as imagens entra na V1.

Os dois pilares de diferenciação são:

1. **Personalização acima da referência:** o layout não é fixo. O usuário controla a estrutura, a aparência e a apresentação da tier list, com presets bonitos prontos para usar e controles avançados para quem quiser ir além.
2. **Design com qualidade de produto:** direção de arte editorial monocromática, tipografia Poppins, temas curados por lista, microinterações, extração de paleta a partir da capa e exportações que parecem pôsteres, não capturas de tela. A cor fica reservada ao conteúdo — capas e tiers — e à personalização de cada lista.

> **Nota técnica sobre armazenamento:** o estado estruturado (título, tiers, ordem, notas e preferências) fica no `localStorage`, com limite de **5 MB** por origem. Um cookie tem limite de aproximadamente 4 KB e é enviado ao servidor a cada requisição de mesma origem, por isso os cookies são usados apenas como **espelho** quando o estado é pequeno (até 32 KB). Imagens ficam no **IndexedDB**. A arquitetura completa está na seção 14.

---

## 2. Contexto e problema

Tier lists são uma forma popular de expressar preferência: filmes, jogos, personagens, comidas e qualquer conjunto de itens podem ser organizados em faixas de qualidade. Ferramentas existentes resolvem o básico, mas costumam impor limitações de personalização, aparência genérica, anúncios, necessidade de conta e pouco controle sobre os dados.

O projeto nasce de uma necessidade pessoal: ter um espaço próprio para criar tier lists de qualquer coisa que dê para colecionar ou fotografar, com liberdade para mudar a capa, a quantidade de categorias, os nomes, as cores e a apresentação, e com a segurança de saber onde os dados estão salvos.

### Problema central

> "Quero criar tier lists bonitas, com a minha identidade, sem depender de uma plataforma que limita o visual e guarda meus dados longe de mim."

### Oportunidade

- Ferramenta para **qualquer item visual**, com a foto em destaque e experiência superior.
- **Cadastro foto-first**: adicionar algo é enviar uma imagem, sem formulário obrigatório.
- **Customização real** sem exigir conhecimento técnico.
- **Propriedade dos dados**: tudo exportável, sem login obrigatório.
- **Mobile-first**: criar e ajustar no celular sem perder qualidade.
- **Zero fricção**: abrir, criar, ranquear e exportar em poucos minutos.

---

## 3. Visão e posicionamento

**Visão:** ser o estúdio pessoal de tier lists — um lugar bonito, rápido e flexível para transformar uma opinião em um ranking visual que dá orgulho de compartilhar.

**Posicionamento:** mais personalizável que a referência, mais bonito por padrão e mais seguro para quem quer manter o controle dos próprios dados.

### Proposta de valor

| Para quem | O produto oferece | Diferente de |
|---|---|---|
| Curadores de coleções | Tier lists de itens, jogos, filmes ou qualquer item com foto, com capas, notas e identidade visual | Planilhas e templates genéricos |
| Criadores de conteúdo | Exportações em alta resolução e cards sociais | Prints de tela de baixa qualidade |
| Usuários casuais | Criação rápida no celular, sem cadastro, começando por uma foto | Ferramentas com login, anúncios e formulários longos |
| Power users | Temas, tipografia, layout e backup | Editores com aparência fixa |

---

## 4. Objetivos e não objetivos

### 4.1 Objetivos do produto

1. Permitir criar uma tier list completa e salva em menos de 3 minutos, começando por uma foto.
2. Oferecer personalização visual claramente superior à referência, com presets bonitos e controles avançados.
3. Garantir que o ranking e as tier lists sobrevivam ao fechamento do navegador e a recarregamentos.
4. Permitir adicionar, remover e reorganizar itens e categorias a qualquer momento, sem exigir metadados.
5. Exportar o resultado em imagem de alta qualidade, com opções de apresentação.
6. Funcionar bem em desktop e celular, com acessibilidade básica desde o MVP.
7. Manter os dados sob controle do usuário, com backup e restauração simples.

### 4.2 Objetivos mensuráveis

| Objetivo | Métrica | Meta inicial |
|---|---|---|
| Ativação | Usuários que criam uma lista e adicionam ≥ 5 itens na primeira sessão | ≥ 60% |
| Tempo até o primeiro valor | Tempo entre abrir o app e a primeira lista salva | < 3 min |
| Confiabilidade | Salvamentos locais bem-sucedidos | ≥ 99,9% |
| Valor percebido | Listas ativas que geram exportação | ≥ 30% |
| Retenção | Retorno em 7 dias | ≥ 20% |
| Qualidade visual | Avaliação qualitativa "o resultado parece bonito o suficiente para compartilhar" | ≥ 8/10 |

### 4.3 Não objetivos do MVP

- Rede social, feed público, comentários ou votação.
- Contas, login, sincronização em nuvem e colaboração em tempo real.
- Aplicativos nativos para iOS/Android.
- Monetização, anúncios ou assinatura.
- Edição de imagem avançada (equivalente a Photoshop).
- Suporte a vídeo ou GIF animado.
- Importação automática de playlists do Spotify (avaliar na V2).

---

## 5. Premissas e restrições

1. **Qualquer item visual é um item.** O modelo é genérico — itens, jogos, filmes, personagens, comidas, lugares — e a experiência do MVP é otimizada para fotos, sem exigir metadados.
2. **Uso pessoal por navegador.** Não há conta; cada navegador tem seu próprio conjunto de dados.
3. **Sem backend no MVP.** O app é uma SPA estática, hospedável em GitHub Pages, Netlify, Vercel ou Cloudflare Pages.
4. **`localStorage` como fonte primária dos dados estruturados, com até 5 MB.** Imagens ficam no IndexedDB; o estado guarda a referência do asset. Cookies funcionam como espelho para estados pequenos.
5. **Navegadores modernos:** duas últimas versões de Chrome, Edge, Firefox e Safari; iOS 16+ e Android 10+.
6. **Idioma:** português do Brasil no MVP, com estrutura para internacionalização.
7. **Servidor local ou HTTPS:** `localStorage` e IndexedDB não funcionam de forma confiável em `file://`; o app precisa ser servido por HTTP(S).
8. **Limites iniciais:** até 12 tiers e 200 itens por lista; até 20 listas salvas. O limite de 5 MB pode reduzir esses limites na prática e a UI deve avisar.
9. **Imagens enviadas pelo usuário:** o produto não hospeda conteúdo publicamente no MVP; o usuário é responsável pelos arquivos que adiciona.

---

## 6. Personas

| Persona | Objetivo | Dores | Critério de sucesso |
|---|---|---|---|
| **Curador de coleções** (primária) | Ranquear favoritos de qualquer tipo — itens, jogos, filmes, personagens — e compartilhar com amigos | Ferramentas presas a um único tipo de mídia, aparência genérica, medo de perder o ranking | Cria uma lista bonita em minutos e exporta |
| **Fã colecionador** | Manter várias listas ao longo do tempo e revisitar | Perder dados ao limpar o navegador, dificuldade de editar depois | Reabre listas antigas e adiciona novos itens |
| **Criador de conteúdo** | Produzir imagens para redes sociais e vídeos | Exportação de baixa qualidade, falta de controle de layout | Gera PNG em alta resolução com identidade própria |
| **Usuário casual** | Fazer uma lista rápida no celular | Interfaces complexas, cadastro obrigatório, formulários longos | Adiciona uma foto e salva sem instruções |

---

## 7. Casos de uso principais

| ID | Caso de uso | Resultado esperado |
|---|---|---|
| UC-01 | Criar uma tier list do zero | Lista com capa, título e tiers configurados, salva automaticamente |
| UC-02 | Adicionar itens por foto | Fotos recortadas e otimizadas; nome sugerido e item disponível no pool |
| UC-03 | Adicionar item por URL | Foto carregada e vinculada ao item |
| UC-04 | Arrastar itens entre tiers | Ranking atualizado e persistido |
| UC-05 | Alterar nomes, cores e quantidade de tiers | Board atualizado sem perda de itens |
| UC-06 | Trocar a capa da tier list | Nova capa aplicada e salva |
| UC-07 | Adicionar novos itens depois | Itens entram no pool e podem ser ranqueados |
| UC-08 | Exportar a tier list | Imagem PNG/WebP em alta resolução |
| UC-09 | Fazer backup | Arquivo JSON com todas as listas e rankings |
| UC-10 | Restaurar backup | Listas reimportadas e validadas |
| UC-11 | Mudar o tema e o layout | Aparência personalizada salva por lista |
| UC-12 | Ranquear com ajuda | Ordem sugerida aplicada ao board |
| UC-13 | Salvar um item só com foto | Item entra no pool como “Sem título”, sem exigir nome, detalhe, tier ou nota |

---

## 8. Escopo priorizado

Legenda: **MVP** = essencial para o lançamento; **V1** = evolução próxima; **V2** = futuro.

| Capacidade | MVP | V1 | V2 |
|---|---|---|---|
| Biblioteca de tier lists | Sim | Melhorias | — |
| Criar, renomear, duplicar e excluir | Sim | Lixeira | — |
| Capa personalizada (upload, URL, gradiente) | Sim | Mosaico automático | — |
| Quantidade, nomes e cores dos tiers | Sim | Ícones por tier | — |
| Upload e edição de fotos de itens | Sim | Busca de metadados | — |
| Arrastar e soltar (mouse, toque) | Sim | Teclado completo | — |
| Seleção múltipla e undo/redo | Sim | Histórico persistente | — |
| Notas por item | Sim | Filtros por nota/tag | Tags |
| Temas curados e modo claro/escuro | Sim | Theme Studio completo | Temas da comunidade |
| Tipografia e layout avançados | Básico | Completo | CSS customizado |
| Autosave local com 5 MB | Sim | Espelho e sync entre abas | — |
| Backup JSON | Sim | Backup em ZIP | — |
| Exportar PNG/WebP | Sim | Cards sociais, PDF | Embed |
| Compartilhar por link local | — | Sim | Links públicos |
| Ranking assistido (A vs B / baldes) | — | Sim | Estatísticas |
| Busca de metadados/capas externas | — | Sim | Integração com fontes por tipo de item |
| PWA offline | — | Sim | — |
| Contas e nuvem | — | — | Sim |
| Galeria pública e colaboração | — | — | Sim |

---

## 9. Paridade com a referência e diferenciais

### 9.1 Funcionalidades de referência

A meta é cobrir o fluxo essencial de criação e ranking da referência, acrescentando personalização e design superiores. A paridade prioriza o editor e a experiência pessoal; recursos de comunidade, conta e moderação não são necessários para o MVP.

| Funcionalidade de referência | Como será atendida | Fase |
|---|---|---|
| Criar tier list sem conta | Criação local imediata | MVP |
| Escolher quantidade de tiers | 1 a 12, com presets | MVP |
| Renomear categorias | Edição inline, 1–20 caracteres | MVP |
| Alterar cores dos tiers | Paleta curada + cor livre + contraste automático | MVP |
| Adicionar itens por foto | Múltiplos arquivos, drag-and-drop e recorte | MVP |
| Adicionar imagens por URL | Validação e preview | MVP |
| Arrastar e soltar | Mouse, toque e menu "Mover para..." | MVP |
| Reordenar itens e tiers | Drag vertical e horizontal | MVP |
| Pool de não classificados | Área dedicada com busca | MVP |
| Randomizar | Embaralhar pool e tiers | MVP |
| Desfazer/refazer | ≥ 50 ações | MVP |
| Editar depois | Autosave e reabertura | MVP |
| Duplicar/remixar | Duplicação local com novo ID | MVP |
| Exportar imagem | PNG/WebP em 1x, 2x e 3x | MVP |
| Compartilhar | Link local comprimido ou arquivo | V1 |
| Templates | Templates de estrutura e de estilo | V1 |
| Busca de metadados | MusicBrainz/Cover Art Archive para música | V1 |
| Galeria pública | — | V2 |
| Comentários e votação | — | V2 |
| Conta e sincronização | — | V2 |
| Mobile | Layout responsivo e drag por toque | MVP |
| Acessibilidade | WCAG 2.1 AA como meta | MVP/V1 |

### 9.2 Matriz de personalização

A comparação abaixo descreve a experiência que motivou o projeto e as escolhas de produto, não uma auditoria exaustiva da referência. O objetivo é entregar mais controle e uma apresentação visual superior.

| Dimensão | Referência (percepção do briefing) | SiterList |
|---|---|---|
| Quantidade de tiers | Limitada a presets | 1–12, livre |
| Nomes dos tiers | Texto simples | Texto com ajuste automático ao quadrado; ícones na V1 |
| Cores | Paleta fixa | Cor livre e paletas acessíveis |
| Capa da lista | Limitada ou ausente | Upload, URL e gradiente; mosaico automático na V1 |
| Layout do board | Grade fixa | Confortável, compacto e pôster; apresentação na V1 |
| Tamanho dos cards | Fixo | Pequeno, médio e grande |
| Tipografia | Fixa | Poppins única no MVP; catálogo na V2 |
| Fundo | Fixo | Lisa, grade e textura |
| Tema global | Claro/escuro | Claro, escuro, sistema ou Mel + 5 temas por lista |
| Conteúdo do card | Capa e nome | Foto, nome, detalhe e nota, com toggles |
| Exportação | Imagem simples | Composição editorial em PNG; card social na V1 |

### 9.3 Diferenciais do produto

1. **Theme Studio:** painel de aparência com presets e controles granulares, tudo com preview ao vivo.
2. **Paleta dinâmica:** extração de cores da capa para gerar destaque, fundo e detalhes harmonizados.
3. **Capa mosaico (V1):** capa gerada automaticamente a partir das fotos dos itens mais bem ranqueados.
4. **Notas e justificativas:** cada item pode ter uma nota curta, exibida no detalhe e opcionalmente na exportação.
5. **Ranking assistido (V1):** comparações A vs B ou modo baldes para descobrir a ordem antes de montar o board.
6. **Modo apresentação (V1):** board em tela cheia, com navegação por teclado, ideal para vídeos e streams.
7. **Exportação editorial:** composições com margem, título, data e fundo, com qualidade de pôster.
8. **Backup sem fricção:** JSON legível, com validação e restauração guiada.
9. **Mobile de verdade:** drag por toque, seleção por long-press e bottom sheets.
10. **Acessibilidade desde o início:** contraste automático, foco visível, teclado e movimento reduzido.
11. **Foto-first:** a foto é o único campo obrigatório de um item; o nome é sugerido pelo arquivo e todo o resto pode ficar para depois.

---

## 10. Requisitos funcionais

Legenda de prioridade:

- **P0:** obrigatório no MVP.
- **P1:** desejável no MVP ou planejado para a V1.
- **P2:** evolução futura.

### 10.1 Biblioteca de tier lists

| ID | Requisito | Prioridade |
|---|---|---|
| RF-BIB-01 | Criar uma nova tier list a partir da home, com título, capa opcional e template inicial de tiers. | P0 |
| RF-BIB-02 | Listar as tier lists salvas em cards com capa, título, quantidade de itens, quantidade de tiers e data de atualização. | P0 |
| RF-BIB-03 | Abrir uma tier list no editor com um clique ou toque. | P0 |
| RF-BIB-04 | Duplicar uma tier list, copiando título, capa, tiers, itens, notas e configurações, com novo ID. | P0 |
| RF-BIB-05 | Renomear uma tier list inline ou no editor, com limite de 90 caracteres. | P0 |
| RF-BIB-06 | Excluir uma tier list com confirmação explícita, removendo seu estado local e assets órfãos. | P0 |
| RF-BIB-07 | Favoritar ou fixar tier lists no topo da biblioteca. | P1 |
| RF-BIB-08 | Ordenar a biblioteca por atualização, criação ou nome; filtrar por favoritas. | P1 |
| RF-BIB-09 | Exibir estado vazio acolhedor, com CTA e opção de abrir uma lista de exemplo. | P0 |
| RF-BIB-10 | Importar e exportar todas as tier lists em um único arquivo de backup. | P0 |

**Regras de negócio**

- Título obrigatório, de 1 a 90 caracteres; títulos duplicados são permitidos.
- A capa é opcional; sem capa, usar gradiente derivado da cor de destaque.
- Limites do MVP: 20 listas, 200 itens por lista e 12 tiers. O limite de 5 MB pode reduzir o limite efetivo e a UI deve informar.
- A exclusão no MVP é definitiva após confirmação; a lixeira com restauração de 7 dias fica na V1.
- Ao duplicar, os assets são referenciados com contagem de uso, sem copiar o binário.
- A ordem padrão da biblioteca é "atualizada recentemente".

### 10.2 Criação e configuração inicial

| ID | Requisito | Prioridade |
|---|---|---|
| RF-CRI-01 | Criar com template padrão de 5 tiers: S, A, B, C e D. | P0 |
| RF-CRI-02 | Escolher a quantidade inicial de tiers (1 a 12) e seus nomes. | P0 |
| RF-CRI-03 | Escolher capa por upload, URL, gradiente ou preset. | P0 |
| RF-CRI-04 | Preencher título e descrição opcional (até 160 caracteres). | P0 |
| RF-CRI-05 | Criar uma lista vazia e adicionar itens depois. | P0 |
| RF-CRI-06 | Criar a partir de um template de estrutura ou de estilo. | P1 |
| RF-CRI-07 | Escolher um tema inicial (Studio, Vinyl, Neon, Paper ou Mono) para a apresentação da lista. | P0 |
| RF-CRI-08 | Salvar rascunho automaticamente durante a criação. | P0 |

**Regras de negócio**

- A criação deve caber em uma única tela, com no máximo três decisões: título, capa opcional e template de tiers.
- O botão principal é "Criar tier list"; a lista nasce vazia e os itens entram pelo editor.
- O template padrão usa as cores da paleta acessível, não cores fixas da referência.
- Se o upload da capa falhar, a lista é criada com o gradiente padrão e um aviso não bloqueante.

### 10.3 Editor e ranking manual

| ID | Requisito | Prioridade |
|---|---|---|
| RF-EDI-01 | Exibir o board com capa, título, descrição, tiers e pool de não classificados. | P0 |
| RF-EDI-02 | Adicionar, remover e reordenar tiers. | P0 |
| RF-EDI-03 | Renomear tier (1 a 20 caracteres) e alterar sua cor por paleta ou código hexadecimal. | P0 |
| RF-EDI-04 | Arrastar itens do pool para tiers, entre tiers e dentro de uma tier. | P0 |
| RF-EDI-05 | Reordenar tiers verticalmente por drag. | P0 |
| RF-EDI-06 | Selecionar múltiplos itens e mover ou excluir em lote. | P0 |
| RF-EDI-07 | Desfazer e refazer pelo menos 50 ações. | P0 |
| RF-EDI-08 | Salvar automaticamente e exibir status: "Salvando...", "Salvo às HH:MM" ou "Erro ao salvar". | P0 |
| RF-EDI-09 | Buscar itens no pool por título ou detalhe. | P0 |
| RF-EDI-10 | Embaralhar o pool e ordenar alfabeticamente. | P1 |
| RF-EDI-11 | Colapsar e expandir tiers. | P1 |
| RF-EDI-12 | Abrir menu de contexto por item: editar, duplicar, mover para tier e remover. | P0 |
| RF-EDI-13 | Mover itens por teclado usando o menu "Mover para..." e atalhos. | P0 |
| RF-EDI-14 | Bloquear uma tier para evitar movimentações acidentais. | P2 |
| RF-EDI-15 | Entrar em modo apresentação em tela cheia. | P1 |
| RF-EDI-16 | Detectar a mesma lista aberta em duas abas e avisar antes de sobrescrever. | P1 |

**Regras de negócio**

- Excluir uma tier move seus itens para o pool; os itens nunca são apagados junto com a tier sem confirmação.
- Adicionar uma tier usa o próximo nome e a próxima cor da paleta; o usuário pode renomear e recolorir imediatamente.
- O limite de 12 tiers deve ser comunicado antes de atingi-lo, não apenas ao tentar adicionar o 13º.
- O drop deve funcionar em tiers vazias, com uma área de soltura claramente visível.
- A ordem dos itens é a ordem do array `items` por `order`; mover um item atualiza os índices afetados.
- O histórico de undo/redo é mantido em memória e reiniciado ao recarregar a página no MVP.
- O autosave tem debounce de 480 ms, com flush em `blur`, `visibilitychange` e `pagehide`.
- Em caso de falha de salvamento, manter o último estado válido no `localStorage` e exibir status de erro com opção de exportar backup.
- Seleção múltipla: Shift/Ctrl/Cmd + clique no desktop; long-press no mobile; barra de ações fixa enquanto houver seleção.
- O menu de contexto deve ser acessível por teclado e por toque, nunca apenas por hover.

**Atalhos de teclado**

| Atalho | Ação |
|---|---|
| `Ctrl/Cmd + Z` | Desfazer |
| `Ctrl/Cmd + Shift + Z` | Refazer |
| `Ctrl/Cmd + S` | Forçar salvamento |
| `Esc` | Limpar seleção ou fechar modal |
| `Delete` / `Backspace` | Remover selecionados, com possibilidade de desfazer |
| `Setas` | Navegar entre itens |
| `Enter` | Abrir detalhes do item |
| `1`–`9` | Mover selecionado para a tier correspondente (V1) |
| `?` | Abrir a lista de atalhos |

### 10.4 Itens e imagens (foto-first)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-ITE-01 | Adicionar itens por upload de foto, com seleção múltipla ou drag-and-drop. | P0 |
| RF-ITE-02 | Adicionar item por URL de imagem. | P0 |
| RF-ITE-03 | Colar uma imagem da área de transferência. | P1 |
| RF-ITE-04 | Editar foto, nome, detalhe, texto alternativo e nota (até 500 caracteres) depois que o item já existe. | P0 |
| RF-ITE-05 | Recortar e ajustar a imagem quadrada com zoom e reposicionamento. | P0 |
| RF-ITE-06 | Substituir a imagem de um item. | P0 |
| RF-ITE-07 | Remover um item da lista e apagar o asset se não estiver em uso. | P0 |
| RF-ITE-08 | Duplicar um item. | P1 |
| RF-ITE-09 | Buscar metadados e capas externas por nome, começando por música (MusicBrainz e Cover Art Archive). | P1 |
| RF-ITE-10 | Adicionar vários itens por uma lista de texto (bulk add). | P1 |
| RF-ITE-11 | Detectar e avisar sobre itens duplicados. | P2 |
| RF-ITE-12 | Validar formato e tamanho e comprimir imagens automaticamente. | P0 |
| RF-ITE-13 | No fluxo de adicionar, pedir apenas a foto. Nome, detalhe, tier e nota não aparecem nem são exigidos; ficam disponíveis na edição. | P0 |

**Regras de negócio**

- **A foto é o único campo obrigatório para criar um item.** Nome, detalhe, tier e nota são opcionais e não bloqueiam o salvamento.
- O botão "Adicionar item" fica desabilitado até uma foto ser escolhida; não há fallback de gradiente no fluxo de adicionar.
- Ao enviar uma foto, o app sugere o nome a partir do nome do arquivo (sem extensão), sem exigir que o usuário veja ou preencha o campo. Se o nome ficar vazio, o item é salvo como “Sem título”.
- Sem tier escolhido, o item entra no pool de não ranqueados. Ao abrir "Adicionar item" a partir de uma tier, ele entra nela.
- As opções de nome, detalhe, tier, nota e capas do estúdio aparecem apenas em "Editar item", depois que o item já existe.
- Formatos aceitos: JPEG, PNG e WebP; tamanho máximo de 10 MB por arquivo.
- A foto do item é recortada em 1:1 e salva em WebP com até 512 × 512 px; a capa da lista usa até 1600 × 900 px.
- O upload deve remover metadados EXIF ao reencodar, evitando vazamento de localização e corrigindo orientação.
- Imagens externas por URL são validadas (`http`/`https` apenas), com `referrerpolicy="no-referrer"`.
- Imagens externas podem falhar na exportação por CORS; o app deve avisar e sugerir reenvio como upload.
- O texto alternativo padrão é "Foto de {título}"; o usuário pode editar.
- A nota é opcional, aparece no painel de detalhes e pode ser incluída ou omitida na exportação.
- Assets são armazenados no IndexedDB com `refCount`; ao excluir itens ou listas, o sistema remove assets com contagem zero.
- O upload múltiplo deve mostrar progresso por arquivo e permitir continuar mesmo se um arquivo falhar.

### 10.5 Aparência, capa e personalização

| ID | Requisito | Prioridade |
|---|---|---|
| RF-APR-01 | Alterar a capa da tier list a qualquer momento. | P0 |
| RF-APR-02 | Recortar e reposicionar a capa em 16:9, com zoom. | P0 |
| RF-APR-03 | Usar gradiente ou preset como capa quando não houver imagem. | P0 |
| RF-APR-04 | Gerar capa mosaico automática com as fotos dos itens. | P1 |
| RF-APR-05 | Escolher entre cinco temas curados por lista: Studio, Vinyl, Neon, Paper e Mono. | P0 |
| RF-APR-06 | Alternar entre modo claro, escuro, sistema e o tema especial Mel. | P0 |
| RF-APR-07 | Extrair a cor de destaque da capa ou escolhê-la manualmente. | P0 |
| RF-APR-08 | Ajustar tamanho dos cards, espaçamento, raio dos cantos e largura do rótulo do tier. | P1 |
| RF-APR-09 | Escolher fundo sólido, gradiente, textura ou imagem. | P1 |
| RF-APR-10 | Usar Poppins em toda a interface e na exportação, sem catálogo de fontes no MVP. | P0 |
| RF-APR-11 | Adicionar ícone ou emoji por tier. | P1 |
| RF-APR-12 | Exibir ou ocultar título, detalhe e indicador de nota nos cards. | P0 |
| RF-APR-13 | Escolher layout do board: linhas, compacto, pôster ou apresentação. | P1 |
| RF-APR-14 | Restaurar a aparência padrão da lista com um clique. | P0 |
| RF-APR-15 | Salvar e reutilizar presets de aparência entre listas. | P2 |
| RF-APR-16 | Exportar e importar um tema como JSON. | P2 |

**Temas curados do MVP**

| Tema | Personalidade | Uso indicado |
|---|---|---|
| **Studio** | Escuro, neutro e sofisticado; destaque vindo da capa | Padrão, uso geral |
| **Vinyl** | Tons quentes, textura sutil e tipografia editorial | Rankings nostálgicos e jazz/rock |
| **Neon** | Fundo quase preto, gradientes elétricos e alto contraste | Pop, eletrônico e tier lists vibrantes |
| **Paper** | Claro, arejado, pastéis e sensação de revista | Tier lists minimalistas e compartilhamento |
| **Mono** | Monocromático, tipografia forte e foco nas capas | Uso profissional e apresentações |

> Por padrão, o chrome do app — navegação, botões, campos e cabeçalhos — é preto, branco e cinza, independentemente do tema da lista. Os temas mudam o quadro, os cards e a personalização da lista. A exceção deliberada é o **tema Mel**, uma preferência global de interface que aplica rosa pastel ao chrome inteiro, com gatinhos e patinhas discretos.

**Tema especial de interface: Mel**

- Ativado em **Configurações → Aparência**, em um card próprio com ilustração de gatinho.
- Aplicado via `data-theme="mel"` no elemento raiz, com paleta rosa pastel, fundo de patinhas, gato decorativo, orelhas na marca e patinha no botão de tema.
- A escolha persiste em `settings.themeMode = "mel"` e não altera os temas curados de cada lista.
- O toggle do topo continua alternando claro e escuro; ao sair do Mel, ele define o modo escuro. O card de Configurações permite reativar ou desativar o Mel.
- O tema respeita `prefers-reduced-motion` e o controle de redução de movimento: as animações decorativas do gato e das patinhas são desligadas.

**Controles de personalização**

| Controle | MVP | V1 | V2 |
|---|---|---|---|
| Tema curado | Sim | Novos temas | Temas da comunidade |
| Claro/escuro/sistema/Mel | Sim | — | — |
| Cor de destaque | Automática + manual | Paletas avançadas | — |
| Fundo | Presets | Sólido, gradiente, textura, imagem | CSS customizado |
| Fonte do título e do board | Poppins | — | — |
| Tamanho do card | 3 opções | Controle contínuo | — |
| Espaçamento e raio | Presets | Controle contínuo | — |
| Largura do rótulo do tier | Presets | Controle contínuo | — |
| Ícone por tier | — | Sim | Biblioteca de ícones |
| Layout do board | 2 layouts | 4 layouts | Layouts customizados |
| Conteúdo do card | Toggles | Badges e notas | Metadados extras |
| Tema por lista | Sim | Presets salvos | Compartilhamento |

**Guardrails de design**

- Toda cor de texto sobre tier, capa ou fundo deve ter contraste mínimo de 4,5:1; o sistema escolhe automaticamente texto claro ou escuro.
- O chrome da interface usa apenas preto, branco e cinzas. Cores aparecem somente em capas, tiers, swatches e conteúdo personalizado da lista. A única exceção é o tema Mel, escolhido explicitamente pelo usuário.
- A tipografia é Poppins em títulos, controles, metadados e exportação.
- O usuário pode escolher qualquer cor de destaque ou de tier, mas recebe um aviso não bloqueante quando o contraste for insuficiente.
- Presets usam paletas seguras para daltonismo; a paleta manual é livre.
- A personalização nunca deve quebrar a legibilidade das capas: o conteúdo do card tem prioridade sobre efeitos.
- O preview é sempre ao vivo e qualquer alteração de aparência pode ser desfeita.
- Rótulos longos de tier se ajustam ao quadrado colorido, com redução de fonte e quebra apenas entre palavras, sem repartir palavras e sem vazar do bloco no editor ou na exportação.
- O design deve ser distinto da referência: não copiar layout, cores, ícones ou identidade visual do TierMaker.

### 10.6 Ranking assistido

| ID | Requisito | Prioridade |
|---|---|---|
| RF-RNK-01 | Oferecer modo comparação A vs B para ordenar itens. | P1 |
| RF-RNK-02 | Oferecer modo baldes: mostrar um item e atribuí-lo a uma tier por atalho ou toque. | P1 |
| RF-RNK-03 | Aplicar distribuição automática por presets: pirâmide, sino e plano. | P1 |
| RF-RNK-04 | Embaralhar o pool e ordenar alfabeticamente. | P1 |
| RF-RNK-05 | Mostrar preview do resultado antes de aplicar ao board. | P1 |
| RF-RNK-06 | Permitir desfazer a aplicação do ranking em uma única ação. | P1 |
| RF-RNK-07 | Exibir estatísticas da lista: distribuição por tier e detalhes. | P2 |
| RF-RNK-08 | Salvar uma sessão de ranking para continuar depois. | P2 |

**Regras de negócio**

- O modo comparação é recomendado para até 32 itens; acima disso, sugerir o modo baldes.
- Empates e "pular" são permitidos e não travam o progresso.
- O algoritmo deve ser previsível e explicado na interface; não usar "caixa-preta".
- A aplicação do resultado nunca apaga notas, títulos ou imagens; apenas altera `tierId` e `order`.
- O preview mostra o board final e exige confirmação explícita.
- A distribuição automática pode ser aplicada sobre a ordem atual do pool ou sobre uma ordem recém-gerada.

### 10.7 Persistência, backup e recuperação

| ID | Requisito | Prioridade |
|---|---|---|
| RF-PER-01 | Salvar automaticamente cada alteração no `localStorage`, com debounce de 480 ms. | P0 |
| RF-PER-02 | Versionar o schema e migrar dados antigos sem perda. | P0 |
| RF-PER-03 | Manter um espelho em cookies de até 1.200 caracteres por valor quando o estado couber em 32 KB. | P0 |
| RF-PER-04 | Reconstruir e validar o JSON na leitura; se falhar, tentar o espelho em cookies. | P0 |
| RF-PER-05 | Gravar o estado no `localStorage` antes de atualizar o espelho em cookies. | P0 |
| RF-PER-06 | Exibir medidor de uso do armazenamento local com limite de 5 MB e estado de atenção perto do limite. | P0 |
| RF-PER-07 | Bloquear novas gravações e pedir exportação quando o limite de 5 MB for atingido, sem descartar o último estado válido. | P0 |
| RF-PER-08 | Manter o espelho em cookies como recuperação para estados pequenos. | P1 |
| RF-PER-09 | Armazenar imagens no IndexedDB com referência por ID. | P0 |
| RF-PER-10 | Exportar backup JSON da estrutura e do ranking de uma lista ou de todas as listas. | P0 |
| RF-PER-11 | Importar backup com validação, preview e resolução de conflito. | P0 |
| RF-PER-12 | Recuperar dados corrompidos a partir do espelho ou de um backup. | P1 |
| RF-PER-13 | Sincronizar abas via `BroadcastChannel` e evitar sobrescrita silenciosa. | P1 |
| RF-PER-14 | Exibir aviso de armazenamento funcional e permitir apagar todos os dados. | P0 |
| RF-PER-15 | Renovar a expiração do espelho em cookies a cada salvamento, com limite de até 400 dias. | P0 |
| RF-PER-16 | Avisar que limpar os dados do navegador apaga as listas e sugerir backup. | P0 |

**Regras de negócio**

- O `localStorage` é a fonte primária do estado estruturado: título, capa (referência), tiers, itens, ordem, notas e configurações, com limite de 5 MB.
- Imagens não são gravadas no estado; o item guarda `assetId` ou URL.
- Quando o estado cabe em 32 KB, o app mantém um espelho em cookies (`ts_meta` + `ts_0…n`); acima disso, os cookies guardam apenas um ponteiro `storage: "local"`.
- O status de salvamento deve ser visível e anunciado por leitor de tela.
- O app nunca deve falhar silenciosamente: se o armazenamento local não puder ser gravado, exibir erro, manter o último estado válido e oferecer exportação.
- O backup JSON usa o mesmo schema versionado da aplicação e inclui um campo de versão do app.
- O backup JSON preserva título, tiers, itens, ordem, notas e configurações, mas **não inclui os binários** de imagens enviadas por upload. Para portabilidade completa entre navegadores, a V1 oferece backup em ZIP com os assets; até lá, a UI deve avisar que imagens por upload precisam ser reenviadas em outro navegador.
- A importação valida a estrutura, mostra um preview com contagem de listas e itens e permite substituir tudo ou mesclar.
- IDs conflitantes na importação geram novos IDs; assets referenciados por URL permanecem por URL.
- Dados corrompidos devem abrir uma tela de recuperação, nunca uma tela branca.
- A exclusão de todos os dados exige confirmação explícita em um modal destrutivo.
- A arquitetura completa de armazenamento está na seção 14.

### 10.8 Exportação e compartilhamento

| ID | Requisito | Prioridade |
|---|---|---|
| RF-EXP-01 | Exportar a tier list como PNG. | P0 |
| RF-EXP-02 | Exportar como WebP ou JPEG com qualidade configurável. | P1 |
| RF-EXP-03 | Escolher escala 1x, 2x ou 3x e fundo transparente, do tema ou sólido. | P1 |
| RF-EXP-04 | Incluir ou ocultar capa, título, data, notas e marca d'água. | P1 |
| RF-EXP-05 | Copiar a imagem para a área de transferência. | P1 |
| RF-EXP-06 | Exportar backup JSON da lista ou de todas as listas (P0) e CSV do ranking (P1). | P0 / P1 |
| RF-EXP-07 | Imprimir ou salvar em PDF. | P2 |
| RF-EXP-08 | Gerar card social em 1080 × 1080 e 1920 × 1080. | P1 |
| RF-EXP-09 | Compartilhar por link local com estado comprimido na URL. | P1 |
| RF-EXP-10 | Exportar backup completo em ZIP, incluindo o JSON e as imagens. | P1 |
| RF-EXP-11 | Gerar QR code do link compartilhado. | P2 |
| RF-EXP-12 | Embutir a tier list em outro site por iframe ou script. | P2 |

**Regras de negócio**

- A exportação renderiza apenas o board, sem barras de ferramentas, seleção ou elementos de interface.
- Antes de capturar, aguardar `document.fonts.ready` e a decodificação de todas as imagens visíveis.
- Imagens externas sem CORS devem gerar aviso claro; o fallback é um placeholder ou a exclusão da imagem, nunca uma exportação quebrada em silêncio.
- O nome do arquivo é um slug do título: `meus-favoritos-de-2026.png`.
- A exportação deve mostrar progresso e permitir cancelar em listas grandes.
- O link local usa o fragmento da URL (`#/importar?d=...`), não envia dados a servidor e deve ser tratado como conteúdo não confiável na importação.
- Se o payload comprimido ultrapassar 8.000 caracteres, oferecer arquivo JSON ou imagem no lugar do link.
- Compartilhamento público, galeria e embed exigem backend e ficam para a V2.
- A imagem exportada deve incluir margem, respiro e tipografia, com qualidade de pôster; não é uma captura crua da tela.

### 10.9 Preferências, acessibilidade e idioma

| ID | Requisito | Prioridade |
|---|---|---|
| RF-ACE-01 | Preferências de tema, idioma, movimento reduzido e template padrão. | P0 |
| RF-ACE-02 | Navegação completa por teclado nos fluxos principais. | P0 |
| RF-ACE-03 | Anúncios `aria-live` para salvamento, erros e movimentações. | P1 |
| RF-ACE-04 | Contraste mínimo de 4,5:1 e foco visível em todos os controles. | P0 |
| RF-ACE-05 | Alvos de toque de pelo menos 44 × 44 px. | P0 |
| RF-ACE-06 | Suporte a zoom de 200% sem perda de função. | P1 |
| RF-ACE-07 | Respeitar `prefers-reduced-motion`. | P0 |
| RF-ACE-08 | Paletas seguras para daltonismo. | P1 |
| RF-ACE-09 | Texto alternativo editável para todas as imagens. | P0 |
| RF-ACE-10 | Idioma pt-BR no MVP; inglês na V1. | P0 / P1 |
| RF-ACE-11 | PWA instalável e shell offline. | P1 |
| RF-ACE-12 | Preferências globais separadas das configurações de cada lista. | P0 |

**Regras de negócio**

- A meta de acessibilidade é WCAG 2.1 nível AA para os fluxos principais.
- Nenhuma ação essencial pode depender de hover; menus e controles devem funcionar por toque e teclado.
- O drag-and-drop precisa de alternativa acessível por menu e atalhos.
- O modo de movimento reduzido remove animações de entrada, parallax e transições longas.
- A interface deve funcionar em telas de 320 px de largura sem rolagem horizontal da página.
- O idioma padrão é pt-BR; todos os textos devem passar por um arquivo de tradução, sem strings soltas em componentes.
- A preferência de tema global é usada como padrão, mas cada lista pode ter seu próprio tema.

---

## 11. Fluxos principais

### 11.1 Criar a primeira tier list

1. O usuário abre a home e vê a biblioteca com o botão "Nova tier list", sem hero, spotlight ou card de criação em destaque.
2. Ao clicar, escolhe título, capa (opcional) e quantidade de tiers.
3. O sistema sugere o tema **Studio** e 5 tiers (S, A, B, C, D), com opção de personalizar.
4. Ao confirmar, o app cria um ID, grava o estado inicial no armazenamento local e abre o editor.
5. O board aparece com as tiers vazias e o pool vazio.
6. O usuário clica em "+ Item" e envia apenas uma foto; o item entra no pool.
7. O usuário arrasta os itens para as tiers.
8. O status muda de "Salvando..." para "Salvo às HH:MM".
9. O usuário pode exportar, voltar para a home ou continuar editando.

**Exceções:** falha no upload da capa mantém o gradiente; falha ao gravar no armazenamento local abre o modo de recuperação; IndexedDB indisponível impede uploads, mas não a edição de texto.

### 11.2 Adicionar novos itens depois

1. Abrir a tier list na biblioteca.
2. Clicar em "+ Item" no pool.
3. O drawer mostra apenas a área de foto e o botão "Escolher foto"; nenhum campo de nome, detalhe, tier ou nota é exibido.
4. Escolher uma imagem; o preview aparece e o botão "Adicionar item" é habilitado.
5. Confirmar; o item entra no pool com o nome sugerido pelo arquivo (ou "Sem título").
6. Arrastar para as tiers ou manter no pool.
7. A alteração é salva automaticamente. Nome, detalhe, tier e nota continuam disponíveis em "Editar item".

### 11.3 Ranquear e salvar

1. Arrastar um item do pool para uma tier.
2. Reordenar dentro da tier.
3. Usar undo/redo se necessário.
4. Fechar a aba e reabrir: o estado é restaurado do armazenamento local.
5. Se o armazenamento local foi limpo, a home mostra o estado vazio e a opção "Importar backup".

### 11.4 Personalizar a aparência

1. Abrir o painel "Aparência".
2. Escolher um tema curado ou ajustar controles individuais.
3. Usar "Extrair da capa" para gerar a cor de destaque.
4. Alternar entre os layouts de board e ver o preview ao vivo.
5. Fechar o painel; a configuração é salva por lista.
6. Usar "Restaurar padrão" para voltar ao tema original.

### 11.5 Exportar

1. Clicar em "Exportar".
2. Escolher formato, escala, fundo e elementos incluídos.
3. Visualizar o preview.
4. Clicar em "Baixar"; o app renderiza o board sem interface.
5. O download é iniciado com nome amigável.
6. Um toast confirma e oferece "Copiar imagem".

**Exceções:** imagens externas sem CORS exibem aviso e placeholder; falha de renderização oferece tentar novamente ou exportar em escala menor.

### 11.6 Recuperar backup

1. Abrir "Importar backup" na home ou nas configurações.
2. Selecionar o arquivo JSON.
3. O app valida o schema e mostra um preview com listas, tiers e itens; imagens por upload são marcadas como "reenviar" quando não estiverem no arquivo.
4. Escolher "Substituir tudo" ou "Mesclar".
5. Confirmar; o app grava o estado e os assets.
6. Se o limite de 5 MB for atingido, ativar o modo estendido da V1 e informar o usuário.

### 11.7 Ranking assistido (V1)

1. Abrir "Ranquear com ajuda".
2. Escolher o escopo: todos os itens ou apenas o pool.
3. Escolher comparação A vs B ou modo baldes.
4. Responder às comparações ou atribuir tiers rapidamente.
5. Ver o resultado ordenado e escolher a distribuição.
6. Visualizar o preview no board.
7. Aplicar; o resultado pode ser desfeito em uma ação.

### 11.8 Estados de erro

| Situação | Causa provável | Interface | Recuperação |
|---|---|---|---|
| Armazenamento cheio | Muitas listas ou itens | Banner com uso atual e limites | Exportar, remover listas ou ativar modo estendido |
| Falha ao salvar | Armazenamento bloqueado ou quota | Status "Erro ao salvar" persistente | Tentar novamente, exportar rascunho |
| IndexedDB indisponível | Navegação privada ou bloqueio | Aviso ao tentar upload | Usar URL de imagem ou permitir texto |
| Upload inválido | Formato/tamanho não suportado | Toast por arquivo | Selecionar outro arquivo |
| Imagem externa bloqueada | CORS ou URL inválida | Placeholder com ícone de aviso | Reenviar como upload |
| Dados corrompidos | JSON inválido ou edição manual | Tela de recuperação | Restaurar espelho ou importar backup |
| Duas abas na mesma lista | Edição concorrente | Banner "Lista alterada em outra aba" | Recarregar e continuar |
| Sem conexão | Imagens externas e busca | Aviso não bloqueante | Continuar com dados locais |

---

## 12. Arquitetura da informação e telas

### 12.1 Rotas

| Rota | Tela | Objetivo |
|---|---|---|
| `#/` | Biblioteca | Ver, criar, abrir, favoritar, duplicar e excluir tier lists |
| `#/new` | Nova tier list | Configuração inicial em uma tela |
| `#/list/:id` | Editor | Montar, personalizar e ranquear a lista |
| `#/list/:id/export` | Exportar | Prévia e download da lista em imagem |
| `#/settings` | Configurações | Preferências, backup, armazenamento e privacidade |
| `#/help` | Ajuda | Atalhos, FAQ e limites de armazenamento |
| `*` | Biblioteca | Rota desconhecida volta para a home |

- O roteamento é por hash para funcionar em hospedagem estática sem fallback de servidor.
- Importar backup é um modal acionado pela home e pelas configurações, não uma rota própria.
- O app deve funcionar sem backend; nenhuma rota pode depender de server-side rendering.
- Modo apresentação e link compartilhável ficam para a V1.

### 12.2 Wireframe do editor (desktop)

```text
┌──────────────────────────────────────────────────────────────────┐
│ ← Minhas tier lists  Salvo às 15:42       [Aparência] [Exportar] │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ CAPA 16:9                                                    │ │
│ │                                                            │ │
│ │  Melhores itens de 2026                                   │ │
│ │  12 itens · 5 tiers · atualizado há 2 min                  │ │
│ └──────────────────────────────────────────────────────────────┘ │
├────────┬─────────────────────────────────────────────────────────┤
│   S    │ [capa] [capa] [capa]                          + Item   │
│   A    │ [capa] [capa]                                            │
│   B    │ [capa] [capa] [capa] [capa]                              │
│   C    │ [capa]                                                   │
│   D    │ (vazia)                                                  │
├────────┴─────────────────────────────────────────────────────────┤
│ Pool · 8 itens                            [Buscar] [Embaralhar]│
│ [capa] [capa] [capa] [capa] [capa] [capa] [capa] [capa]         │
└──────────────────────────────────────────────────────────────────┘
```

### 12.3 Comportamento responsivo

**Mobile (< 640 px)**

- Barra superior compacta com voltar, status de salvamento e menu.
- Tiers em linhas com rótulo fixo à esquerda e rolagem horizontal dos cards.
- Long-press para iniciar o arraste; auto-scroll nas bordas.
- Pool em bottom sheet com busca e botão "+ Itens".
- Painel de detalhes do item em bottom sheet.
- Barra de seleção fixa no rodapé.
- Controles de aparência em bottom sheet com preview em miniatura.

**Tablet (640–1024 px)**

- Board completo com cards médios.
- Painel de detalhes em drawer lateral.
- Ferramentas de aparência em popover.

**Desktop (> 1024 px)**

- Board com cards grandes e espaço para o pool.
- Painel de detalhes lateral opcional.
- Atalhos de teclado e menu de contexto.
- Modo apresentação com navegação por setas.

### 12.4 Navegação e hierarquia

- A biblioteca é a home e o ponto de retorno.
- O editor é uma rota própria, compartilhável localmente por link.
- Configurações globais ficam separadas das configurações da lista.
- Ações destrutivas sempre pedem confirmação e oferecem desfazer quando possível.
- O botão "Exportar" é a ação primária no editor; "Aparência" é secundária.

---

## 13. Modelo de dados

### 13.1 Tier list

```json
{
  "version": 1,
  "settings": {
    "themeMode": "dark",
    "reducedMotion": false,
    "defaultTemplate": 5
  },
  "lists": [
    {
      "id": "tl_01J9Z6K3",
      "title": "Melhores itens de 2026",
      "description": "Ranking pessoal até novembro.",
      "cover": {
        "type": "asset",
        "assetId": "as_01J9Z7A1"
      },
      "theme": "studio",
      "accent": "#a1a1aa",
      "favorite": true,
      "createdAt": "2026-11-06T14:30:00.000Z",
      "updatedAt": "2026-11-06T15:42:00.000Z",
      "settings": {
        "layout": "comfortable",
        "size": "medium",
        "showArtist": true,
        "showTitle": false,
        "showNote": true,
        "background": "texture"
      },
      "tiers": [
        { "id": "tr_s", "label": "S", "color": "#c084fc", "order": 0 },
        { "id": "tr_a", "label": "A", "color": "#60a5fa", "order": 1 },
        { "id": "tr_b", "label": "B", "color": "#4ade80", "order": 2 },
        { "id": "tr_c", "label": "C", "color": "#facc15", "order": 3 },
        { "id": "tr_d", "label": "D", "color": "#fb923c", "order": 4 }
      ],
      "items": [
        {
          "id": "it_01J9Z8B2",
          "tierId": "tr_s",
          "order": 0,
          "title": "Item exemplo",
          "artist": "Detalhe exemplo",
          "cover": {
            "type": "asset",
            "assetId": "as_01J9Z8C3"
          },
          "note": "Por que esse item está aqui.",
          "createdAt": "2026-11-06T14:40:00.000Z"
        },
        {
          "id": "it_01J9Z8D4",
          "tierId": null,
          "order": 0,
          "title": "Sem título",
          "artist": "",
          "cover": {
            "type": "asset",
            "assetId": "as_01J9Z8D4"
          },
          "note": "",
          "createdAt": "2026-11-06T14:41:00.000Z"
        }
      ]
    }
  ]
}
```

> O app usa `artist` como nome interno do campo "Detalhe" por compatibilidade com a versão inicial. A interface nunca exibe o rótulo "artista".

### 13.2 Campos principais

| Campo | Tipo | Regra |
|---|---|---|
| `version` | inteiro | Versão do schema; usada para migração |
| `lists[].id` | string | ID único e opaco, prefixado (`tl_`) |
| `lists[].title` | string | 1–90 caracteres |
| `lists[].description` | string | 0–160 caracteres |
| `lists[].cover.type` | enum | `asset`, `url` ou `gradient` |
| `lists[].cover.assetId` | string | Obrigatório quando `type = asset` |
| `lists[].cover.value` | string | Obrigatório quando `type = gradient` |
| `lists[].cover.url` | string | Obrigatório quando `type = url`; apenas http(s) |
| `lists[].theme` | enum | `studio`, `vinyl`, `neon`, `paper` ou `mono` |
| `lists[].accent` | string | Cor de destaque da lista em hexadecimal |
| `lists[].favorite` | booleano | Favorita na biblioteca |
| `lists[].tiers[].label` | string | Até 20 caracteres; reduz e quebra para caber no quadrado |
| `lists[].tiers[].color` | string | Hexadecimal com validação |
| `lists[].tiers[].order` | inteiro | Ordem vertical, sem lacunas |
| `lists[].items[].tierId` | string ou null | `null` significa pool |
| `lists[].items[].order` | inteiro | Ordem horizontal dentro da tier ou do pool |
| `lists[].items[].title` | string | Até 100 caracteres; fallback "Sem título" |
| `lists[].items[].artist` | string | Campo interno do detalhe; até 100 caracteres |
| `lists[].items[].cover` | objeto | Foto do item (`asset`, `url` ou `gradient`) |
| `lists[].items[].note` | string | Até 500 caracteres |
| `lists[].settings` | objeto | Layout, tamanho, metadados visíveis e fundo |
| `settings` | objeto | Preferências globais: tema, movimento e template padrão |
| `createdAt` / `updatedAt` | ISO 8601 | Datas em UTC |

### 13.3 Armazenamento local e espelho em cookies

O estado inteiro é serializado em JSON e gravado no `localStorage` sob a chave `tierlist-studio-backup-v1`, com limite de **5 MB**. Quando o payload cabe em **32 KB**, o app também mantém um espelho em cookies dividido em pedaços de 1.200 caracteres:

```text
localStorage["tierlist-studio-backup-v1"] = {"version":1,"lists":[...],"settings":{...}}

ts_meta  = {"version":1,"storage":"cookies","chunks":7,"bytes":8325,"savedAt":"2026-11-12T21:03:31.082Z"}
ts_0     = {"version":1,"settings":{...
ts_1     = ...continuação do JSON...
...
ts_6     = ...último pedaço...
ts_notice = 1
```

- O `localStorage` é a fonte primária; o espelho em cookies é uma cópia de recuperação para estados pequenos.
- A leitura tenta primeiro o `localStorage`; se ele falhar ou estiver ausente, tenta o espelho em cookies.
- Se um pedaço estiver ausente ou o JSON falhar, o app ignora o espelho e abre a recuperação.
- Acima de 32 KB, os cookies `ts_0…n` são removidos e `ts_meta` guarda apenas o ponteiro `{"storage":"local","chunks":0}`.
- Cada salvamento atualiza o `localStorage` primeiro, depois o espelho e, por último, `ts_meta`, removendo pedaços órfãos de gravações anteriores.

### 13.4 Armazenamento no IndexedDB

| Store | Chave | Conteúdo | Retenção |
|---|---|---|---|
| `assets` | `id` | Blob WebP da foto ou capa | Enquanto houver referência no estado |

- Banco: `tierlist-studio-assets`, versão 1.
- As imagens são carregadas sob demanda e convertidas em `blob:` URLs durante a sessão.
- Ao apagar todos os dados, o store é limpo.

### 13.5 Preferências globais

```json
{
  "themeMode": "dark",
  "reducedMotion": false,
  "defaultTemplate": 5
}
```

- `themeMode`: `dark`, `light`, `system` ou `mel`. O valor `mel` ativa o tema especial de interface; os demais seguem o esquema claro/escuro.
- `defaultTemplate`: número inicial de tiers (1–12) para novas listas.
- O aviso de armazenamento usa um cookie separado (`ts_notice`), não o estado. O idioma é fixo em pt-BR no MVP.

---

## 14. Estratégia de persistência local

### 14.1 Princípios

1. **O `localStorage` é a fonte primária do estado estruturado.** Título, capa (referência), tiers, itens, ordem, notas e configurações ficam no navegador, com limite de 5 MB.
2. **Cookies são espelho, não fonte.** Estados de até 32 KB ganham uma cópia em cookies para sobreviver a limpezas do `localStorage`; acima disso, os cookies guardam apenas um ponteiro.
3. **Imagens não vão para o estado.** Binários ficam no IndexedDB e são referenciados por `assetId`.
4. **Nada de perda silenciosa.** Toda gravação é validada; falhas geram erro visível, último estado válido e opção de backup.
5. **Sempre exportável.** O usuário pode baixar um JSON completo e reimportar em outro navegador.
6. **Degradação graciosa.** Ao atingir 5 MB, o app bloqueia novas gravações e pede exportação sem descartar o estado existente.
7. **Privacidade por padrão.** Apenas armazenamento funcional; nenhum cookie de anúncio ou rastreamento.

### 14.2 Limites técnicos

| Item | Limite | Implicação no produto |
|---|---|---|
| `localStorage` | ~5 MB por origem (limite do produto) | Fonte primária do estado estruturado |
| Tamanho por cookie | ~4 KB (nome + valor + atributos) | Espelho em chunks de 1.200 caracteres |
| Cookies por domínio | Mínimo de 50 (RFC 6265); ~180 no Chrome | Espelho só até 32 KB |
| Envio ao servidor | Todos os cookies da origem vão em cada requisição | Manter o espelho pequeno e opcional |
| Expiração | `Max-Age` de até 400 dias em navegadores modernos | Renovar o espelho a cada salvamento |
| ITP/Safari | Cookies gravados por script podem ser removidos antes | `localStorage` como fonte primária |
| Imagens | Inviáveis no estado serializado | IndexedDB obrigatório para upload |
| `file://` | `localStorage` e IndexedDB funcionam de forma inconsistente | Servir sempre via HTTP(S) |

### 14.3 Estrutura de armazenamento

Chave primária: `tierlist-studio-backup-v1`. Prefixo de cookies reservado: `ts_`.

| Local | Conteúdo | Tamanho típico |
|---|---|---|
| `localStorage` | JSON completo do estado | Até 5 MB |
| `ts_meta` | Metadados: versão, `storage`, chunks, bytes e data | < 200 bytes |
| `ts_<n>` | Pedaço `n` do espelho JSON | ≤ 1.200 caracteres |
| `ts_notice` | Registro do aviso de armazenamento | < 20 bytes |

**Atributos de todos os cookies:**

```text
Path=/; SameSite=Lax; Max-Age=34560000
```

- `Secure` em produção (HTTPS).
- Sem `Domain`, para manter cookies host-only.
- Sem `HttpOnly`, porque o app precisa ler e escrever via JavaScript.
- Nomes curtos para reduzir overhead.

### 14.4 Orçamento e limites

| Faixa | Uso do limite de 5 MB | Comportamento |
|---|---|---|
| Saudável | ≤ 80% (até 4 MB) | Operação normal; indicador discreto |
| Atenção | 80–95% (4–4,75 MB) | Aviso no painel de armazenamento; sugerir exportar |
| Crítico | 95–100% (4,75–5 MB) | Aviso destacado; sugerir remover listas |
| Bloqueado | > 5 MB | Bloquear novas gravações e exigir exportação/limpeza |

**Limites de produto no MVP:**

- 20 tier lists.
- 12 tiers por lista.
- 200 itens por lista.
- Espelho em cookies somente até 32 KB.

A UI deve mostrar o uso real do estado, por exemplo "Armazenamento local: 8,1 KB de 5 MB", com `<1%` para estados pequenos, e explicar o que ocupa espaço.

### 14.5 Gravação atômica

1. Serializar o estado completo em JSON.
2. Calcular os bytes reais do payload (`new Blob([json]).size`).
3. Se ultrapassar 5 MB, abortar a gravação, manter o último estado válido e oferecer exportação.
4. Gravar o JSON no `localStorage` (`tierlist-studio-backup-v1`).
5. Se o payload tiver até 32 KB, dividir em pedaços de 1.200 caracteres e gravar `ts_0` até `ts_{n-1}` com `Path=/`, `SameSite=Lax` e `Max-Age` de 400 dias.
6. Atualizar `ts_meta` por último com `version`, `storage`, `chunks`, `bytes` e `savedAt`.
7. Acima de 32 KB, remover os pedaços antigos e gravar `ts_meta` com `storage: "local"` e `chunks: 0`.
8. Se a gravação falhar, manter o último estado válido, marcar o status como "Erro ao salvar" e oferecer exportação.

**Exemplo de payload pequeno:**

```text
ts_0 = {"version":1,"settings":{"themeMode":"dark"...
ts_1 = ...continuação do JSON...
ts_2 = ...último pedaço...
ts_meta = {"version":1,"storage":"cookies","chunks":3,"bytes":2650,"savedAt":"..."}
```

**Exemplo de estado grande:**

```text
localStorage["tierlist-studio-backup-v1"] = {"version":1,"lists":[...]}
ts_meta = {"version":1,"storage":"local","chunks":0,"bytes":43367,"savedAt":"..."}
```

### 14.6 Leitura e recuperação

1. Ler `localStorage["tierlist-studio-backup-v1"]` e validar o JSON com `normalizeState`.
2. Se ausente ou inválido, ler `ts_meta` e verificar `storage`.
3. Se `storage` for `local`, não há espelho recuperável; abrir a recuperação.
4. Se `storage` for `cookies`, ler `ts_0` até `ts_{chunks-1}`; se faltar um pedaço, considerar o estado corrompido.
5. Concatenar os pedaços, validar o JSON e usar o espelho como recuperação.
6. Se ambos falharem, abrir a tela de recuperação com opções: tentar novamente, importar backup ou excluir a lista corrompida.
7. Se a versão for antiga, aplicar migrações em sequência e regravar no formato atual.
8. Exibir a lista somente depois da validação completa.

### 14.7 Modo estendido (transbordo para IndexedDB)

> **Status:** planejado para a V1. No MVP, quando o limite de 5 MB é atingido, o app avisa, mantém o último estado válido e pede exportação; não há transbordo automático para IndexedDB.

Quando o limite de 5 MB for atingido, uma lista grande ou muitas imagens no estado:

- O payload completo é gravado no IndexedDB, no store `payloads`.
- `ts_meta` mantém `storage: "idb"`, geração, bytes e checksum.
- A lista continua funcionando normalmente; o usuário vê um selo "Armazenamento estendido".
- Se o IndexedDB não estiver disponível, o app bloqueia novas adições e pede exportação; nunca descarta dados.
- Ao liberar espaço (excluir listas ou itens), o app pode migrar o estado de volta para o `localStorage`.

### 14.8 Modo somente cookies (legado, opcional)

Se for requisito absoluto que **todo** o conteúdo fique em cookies:

- Capas e itens só podem usar URL externa ou gradiente; upload de imagens fica desabilitado.
- Sem fonte primária no `localStorage` e sem modo estendido.
- Limites menores: cerca de 8 listas e 50 itens por lista, dependendo do texto.
- Ao atingir o limite, o app bloqueia novas alterações e exige exportação.
- O risco de perda por limpeza de cookies é maior.

**Recomendação:** não usar o modo estrito como padrão. Ele existe apenas para quem quiser cumprir a restrição literal de "tudo em cookies". A decisão está registrada na seção 22.

### 14.9 Segurança

- **XSS:** todo texto do usuário é escapado antes de entrar no HTML; nunca interpolar título, nome ou nota sem escape.
- **URLs:** aceitar apenas `http` e `https`; bloquear `javascript:`, `data:` e `file:` em campos de URL.
- **CSP:** `default-src 'self'`; `img-src 'self' data: blob: https:`; `connect-src` restrito às APIs permitidas.
- **Uploads:** validar decodificação da imagem, limitar dimensões e reencodar para remover metadados.
- **Cookies:** `Secure` em produção, `SameSite=Lax`, `Path=/`, host-only; usados apenas como espelho pequeno.
- **Dados sensíveis:** não armazenar senhas, tokens ou informações pessoais no `localStorage` nem em cookies; ambos são legíveis por qualquer script da origem.
- **Links externos:** `rel="noopener noreferrer"` e `referrerpolicy="no-referrer"` em imagens externas.
- **Dependências:** lockfile, auditoria e CSP para reduzir superfície de ataque.

### 14.10 Ciclo de vida, privacidade e LGPD

- O estado fica no `localStorage` até o usuário apagar os dados ou limpar o navegador.
- O espelho em cookies usa `Max-Age` de 400 dias e é renovado a cada salvamento; acima de 32 KB, os cookies de chunk são removidos.
- O aviso deve dizer: "Usamos armazenamento local e cookies funcionais para salvar suas tier lists neste navegador. Nada é enviado a um servidor."
- O aviso não deve bloquear a criação da primeira lista; ele aparece no primeiro uso e fica registrado em `ts_notice`.
- O usuário pode apagar todos os dados em Configurações → Armazenamento, com confirmação explícita; a ação remove o `localStorage`, os cookies e os assets do IndexedDB.
- Limpar os dados do navegador apaga as listas; a UI deve lembrar disso e sugerir backup.
- Um lembrete não bloqueante de backup é desejável na V1; no MVP, o aviso de armazenamento e a ação "Exportar backup" cobrem a necessidade.
- Não há backend nem banco de dados no MVP. O host estático apenas entrega arquivos; o espelho em cookies pode ser enviado a ele em requisições HTTP, mas não é processado nem armazenado. Requisições a APIs externas de capas (V1) devem ser divulgadas e limitadas ao necessário.
- A avaliação jurídica deve confirmar a base legal aplicável. Armazenamento estritamente funcional normalmente dispensa consentimento, mas o aviso transparente é recomendado para a confiança do usuário.

### 14.11 Testes de persistência

| Teste | O que valida |
|---|---|
| Round-trip de lista pequena | Serializar, gravar no `localStorage`, ler e comparar |
| Limite de chunk | Payload que gera 1, 2 e 10 chunks de espelho |
| Caracteres especiais | Emoji, acentos, aspas e quebras de linha |
| Espelho corrompido | JSON inválido e recuperação pelo `localStorage` |
| `localStorage` ausente | Fallback para o espelho em cookies |
| Quota excedida | Aviso, último estado preservado e opção de exportar |
| Estado acima de 32 KB | Chunks removidos e `ts_meta` com `storage: "local"` |
| IndexedDB indisponível | Bloqueio de upload e modo somente URL |
| Duas abas | Detecção de conflito e aviso |
| Migração | Schema v1 → v2 sem perda |
| Limpeza de dados | Estado vazio + importação de backup |
| Lista com 200 itens | Performance e tamanho do payload |
| Safari/Firefox | Atributos, expiração e leitura |

### 14.12 Alternativas consideradas

| Alternativa | Vantagens | Desvantagens | Decisão |
|---|---|---|---|
| localStorage | 5 MB; simples; não enviado ao servidor | Só strings; síncrono | Fonte primária do estado |
| Cookies | Legível por JS; sobrevive à limpeza do localStorage | 4 KB por cookie; enviado em toda requisição; frágil | Espelho para estados ≤ 32 KB |
| IndexedDB | Grande capacidade; blobs | API assíncrona; menos portável | Imagens; transbordo na V1 |
| Backend/banco | Sincronização e compartilhamento | Contas, custo, privacidade | V2 |
| Estado na URL | Compartilhamento sem servidor | Limite de URL; não persiste sozinho | Apenas links locais |

---

## 15. Requisitos não funcionais

| Categoria | Requisito | Meta |
|---|---|---|
| Performance | LCP em conexão 4G | ≤ 2,5 s |
| Performance | INP em interações de edição | ≤ 200 ms |
| Performance | Arrastar e soltar | 60 fps com 100 itens |
| Performance | Salvamento local | ≤ 150 ms para 50 itens |
| Performance | Abertura de lista com 200 itens | ≤ 1 s após o carregamento do app |
| Confiabilidade | Gravações locais bem-sucedidas | ≥ 99,9% |
| Confiabilidade | Perda de dados em falha de gravação | Zero, com rollback e rascunho |
| Compatibilidade | Navegadores | 2 últimas versões de Chrome, Edge, Firefox e Safari |
| Compatibilidade | Mobile | iOS 16+ e Android 10+ |
| Responsividade | Larguras suportadas | 320 px a 1920 px |
| Acessibilidade | Meta | WCAG 2.1 AA nos fluxos principais |
| Acessibilidade | Contraste | ≥ 4,5:1 para texto normal |
| Acessibilidade | Teclado | Todas as ações essenciais acessíveis |
| Segurança | Sanitização | Nenhum HTML de usuário renderizado sem escape |
| Segurança | CSP | Cabeçalhos restritivos em produção |
| Privacidade | Cookies | Apenas funcionais; sem rastreamento |
| Privacidade | Dados | Locais; exportáveis e apagáveis |
| Manutenibilidade | Código | JavaScript modular, funções nomeadas e nenhuma dependência de build |
| Manutenibilidade | Validação | `normalizeState` em toda leitura do estado local ou backup |
| Manutenibilidade | Testes | Matriz manual documentada; automação quando houver bundler |
| Observabilidade | Erros | Log local e tela de recuperação; Sentry opcional com consentimento |
| Offline | PWA | Shell do app disponível offline na V1 |
| SEO | App | `noindex` nas rotas internas; landing page indexável se existir |

---

## 16. Arquitetura técnica recomendada

### 16.1 Stack

| Camada | Escolha no MVP | Motivo |
|---|---|---|
| Build | Nenhum: HTML, CSS e JS estáticos | Simplicidade, portabilidade e zero dependência de toolchain |
| UI | HTML semântico + CSS com custom properties | Controle visual total e tema monocromático |
| Estado | Objeto `state` + `normalizeState` | Um único modelo previsível, fácil de serializar |
| Rotas | Hash router próprio | Funciona em qualquer hospedagem estática |
| Drag-and-drop | HTML5 Drag and Drop + menu "Mover para" | Mouse, teclado e alternativa acessível |
| Validação | Normalização estrutural na leitura e importação | Evita schema externo e mantém o app sem build |
| Persistência | `localStorage` com 5 MB + espelho em cookies | Atende ao requisito local-first e permite recuperação |
| Imagens | Canvas API + WebP + IndexedDB | Recorte, reencode e remoção de EXIF |
| Exportação | `html2canvas` vendorizado | Board em alta resolução sem servidor |
| Fontes | Poppins vendorizada em `fonts/` | Fidelidade visual e funcionamento offline |
| Testes | Matriz manual + console + Lighthouse | Validação do protótipo sem Node.js |
| Deploy | Qualquer host estático com HTTPS | Sem backend, banco ou variáveis de ambiente |

> Se o produto crescer para múltiplos desenvolvedores ou testes automatizados, a evolução recomendada é migrar para Vite + React + TypeScript + dnd-kit + Zod, mantendo o mesmo modelo de dados e o mesmo adapter de persistência.

### 16.2 Arquitetura em alto nível

```text
┌─────────────────────────────────────────────────────┐
│ Navegador — app estático                            │
│                                                     │
│  index.html + styles.css                            │
│  app.js                                             │
│   ├─ render / views (home, lista, nova, config)     │
│   ├─ estado + undo/redo                             │
│   ├─ drag-and-drop + edição de tiers                │
│   ├─ storage (localStorage + cookies)               │
│   ├─ assets (IndexedDB + blob URLs)                 │
│   └─ exportação (html2canvas)                       │
└────────────┬────────────────────────────────────────┘
             │
     ┌───────────────┬──────────────┬──────────────┐
     │ localStorage  │ cookies      │ IndexedDB    │
     │ estado (5 MB) │ espelho ≤32K │ imagens      │
     └───────────────┴──────────────┴──────────────┘
```

**Não há servidor no MVP.** Toda a lógica roda no navegador. APIs externas de metadados são opcionais na V1 e devem ser isoladas atrás de uma camada de serviço.

### 16.3 Estrutura de pastas sugerida

```text
TierList/
  index.html          # shell, marca, favicon e sprite de ícones
  styles.css          # design system monocromático + responsivo
  app.js              # estado, rotas, views, storage e exportação
  fonts/
    poppins-400.woff2
    poppins-500.woff2
    poppins-600.woff2
    poppins-700.woff2
  vendor/
    html2canvas.min.js
  docs/
    PRD.md
    screens/
  serve.ps1           # servidor local de teste
```

> A separação em módulos (`storage.js`, `assets.js`, `export.js`) é desejável se o `app.js` passar de ~2.000 linhas. No MVP, a prioridade é manter o carregamento simples e sem bundler.

### 16.4 Decisões de implementação

- **Estado único:** `state = { version, lists, settings }`; toda leitura passa por `normalizeState` antes de renderizar.
- **Persistência:** `saveState` grava o JSON no `localStorage` e, se ele couber em 32 KB, também cria um espelho em cookies de 1.200 caracteres; `scheduleSave` aplica debounce de 480 ms.
- **IDs:** `crypto.randomUUID()` com prefixos (`tl_`, `tr_`, `it_`, `as_`).
- **Datas:** sempre ISO 8601 em UTC; formatar na camada de apresentação.
- **Migrações:** a versão fica no topo do estado; migrações futuras devem ser aplicadas antes da normalização.
- **Undo/redo:** snapshots em memória por lista; limite de 50 ações; o histórico é limpo ao trocar de lista.
- **Imagens:** validação → decode → crop 1:1 → resize 512 px → WebP → IndexedDB; retornar `assetId`.
- **Exportação:** clonar o board em um nó oculto, aguardar fontes e imagens, chamar `html2canvas`, baixar o blob e liberar o nó.
- **Rótulos de tier:** `fitLabelText` reduz a fonte por busca binária até a palavra inteira caber no quadrado, quebrando apenas entre palavras; `fitTierLabels` reaplica em resize, troca de tema e exportação.
- **Segurança:** todo texto interpolado passa por `escapeHtml`/`escapeAttr`; URLs externas só são aceitas com `http`/`https`.
- **Erros:** falhas de storage nunca apagam o espelho; a UI mostra toast, status de erro e opção de exportar.
- **Multi-aba:** desejável na V1 via `BroadcastChannel`; no MVP, a última gravação vence.

### 16.5 Estratégia de testes

- **Manual guiada:** criar lista, adicionar item só com foto, editar metadados, arrastar, recarregar, exportar e importar backup.
- **Console:** nenhum erro ou warning crítico durante os fluxos principais.
- **Persistência:** simular `localStorage` ausente, JSON inválido, espelho ausente e estado acima de 32 KB; validar a tela de recuperação.
- **Responsivo:** 390 px, 768 px, 1024 px e 1440 px; sem rolagem horizontal da página.
- **Compatibilidade:** Chrome, Edge, Firefox e Safari iOS, com atenção a `localStorage`, cookies e IndexedDB.
- **Acessibilidade:** navegação por teclado, foco visível, contraste e leitor de tela nos fluxos principais.
- **Visual:** capturas em desktop e mobile comparadas com a direção de arte da seção 17.

### 16.6 Deploy e operação

- Publicação estática com HTTPS obrigatório.
- Headers de segurança: CSP, `X-Content-Type-Options`, `Referrer-Policy`.
- Cache curto para `index.html`, `app.js` e `styles.css`; cache longo para fontes e `html2canvas`.
- Sem service worker no MVP; PWA na V1.
- Monitoramento de erros opcional e desativado por padrão.
- `serve.ps1` é apenas para desenvolvimento local; não faz parte do deploy.

---

## 17. Design e experiência

### 17.1 Princípios

1. **A capa é a protagonista.** A interface recua para que as imagens dos itens apareçam.
2. **Bonito por padrão.** O usuário não deve precisar customizar para ter um resultado bonito.
3. **Customização com curadoria.** Presets excelentes primeiro; controles avançados para quem quiser.
4. **Reversível.** Toda ação visual pode ser desfeita; nada destrutivo acontece sem confirmação.
5. **Mobile de verdade.** O fluxo completo funciona no celular, não é uma versão reduzida.
6. **Rápido e silencioso.** Sem pop-ups desnecessários, sem anúncios, sem fricção.

### 17.2 Direção de arte

**Conceito:** "Editorial Monochrome" — a precisão de um catálogo impresso em preto e branco, com a cor reservada ao conteúdo.

- **Preto, branco e cinzas** no chrome: navegação, botões, campos, cabeçalhos, drawers e modais.
- **Poppins em tudo:** títulos, controles, metadados e exportação; sem catálogo de fontes no MVP.
- **A cor vem das capas e dos tiers:** cada lista pode ter sua paleta, mas a interface nunca compete com ela.
- **Cards de item grandes**, com sombra suave e cantos consistentes.
- **Detalhes discretos:** linhas finas, badges pequenos, transições curtas.
- **Nada de excesso:** sem glassmorphism gratuito, sem gradientes em botões, sem animações chamativas.
- **Contraste alto e respiro:** a hierarquia vem de escala, peso e espaço, não de cor.

### 17.3 Tokens visuais iniciais

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#09090b` | Fundo principal escuro |
| `--bg-soft` | `#0d0d10` | Fundo da sidebar e áreas rebaixadas |
| `--surface` | `#121214` | Cards e painéis |
| `--surface-2` | `#18181b` | Controles e campos |
| `--surface-3` | `#212124` | Hover e estados ativos |
| `--border` | `rgba(255,255,255,.09)` | Divisórias e contornos |
| `--border-strong` | `rgba(255,255,255,.18)` | Foco e ênfase |
| `--text` | `#f4f4f5` | Texto principal |
| `--text-2` | `#a3a3ad` | Texto secundário |
| `--text-3` | `#8a8a93` | Texto terciário e placeholders |
| `--brand` | `#f4f4f5` | Logo e ações primárias |
| `--accent` | `#f4f4f5` | Destaque monocromático |
| `--danger` | `#ff7b7b` | Erros e ações destrutivas |
| `--radius-sm` | `8px` | Cards pequenos |
| `--radius-md` | `12px` | Cards e botões |
| `--radius-lg` | `18px` | Modais e capa |
| `--shadow-md` | `0 16px 40px rgb(0 0 0 / .28)` | Cards e drawers |
| `--ease` | `cubic-bezier(.2,.7,.2,1)` | Microinterações |

No tema claro, `--bg` vira `#f5f5f4`, `--surface` vira `#ffffff` e `--text` vira `#111113`; a lógica monocromática é a mesma.

No tema Mel (`data-theme="mel"`), `--bg` vira `#fff6f9`, `--surface` vira `#fffbfd`, `--text` vira `#4a2735` e `--accent` vira `#d9648e`. A interface usa rosa pastel, `theme-color` `#fff5f8` e padrões de patinha em SVG inline. O tema é aplicado ao chrome inteiro por escolha explícita e não substitui os temas curados da lista.

### 17.4 Tipografia

- **Fonte única:** Poppins, em títulos, controles, metadados, tiers e exportação.
- **Pesos:** 400 para corpo, 500 para controles, 600 para ênfase e títulos, 700 para números grandes.
- **Escala:** 11, 12, 13, 15, 18, 24, 32 e 44 px; no máximo 5 tamanhos por tela.
- Títulos com `letter-spacing` negativo leve; textos longos com largura máxima de 65 caracteres.
- Os arquivos ficam vendorizados em `fonts/` (woff2), garantindo exportação fiel e funcionamento offline.
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

### 17.5 Paleta dinâmica

1. Cada lista tem um tema curado (`Studio`, `Vinyl`, `Neon`, `Paper` ou `Mono`) e uma cor de destaque própria.
2. O usuário escolhe a cor de destaque entre presets, uma cor livre ou o botão "Puxar da capa"; a extração é opcional e nunca sobrescreve a escolha sem ação.
3. Os tiers usam cores individuais, com texto claro ou escuro escolhido por contraste.
4. A interface do app permanece monocromática; a paleta personalizada aparece apenas no board e na exportação.
5. Na V1, a extração de cor da capa pode ser adicionada como sugestão, nunca como obrigação.
6. Se uma cor falhar no contraste, o sistema ajusta o texto e avisa sem bloquear.

### 17.6 Microcopy

| Contexto | Texto |
|---|---|
| Home vazia | "Sua biblioteca está vazia. Comece uma tier list e adicione itens com uma foto." |
| Criar | "Dê um nome, escolha uma capa e monte suas faixas." |
| Adicionar item | "Envie uma foto. Nome, detalhe e nota podem ficar para depois." |
| Foto escolhida | "Foto pronta. Só falta adicionar." |
| Item sem nome | "Sem título" |
| Salvando | "Salvando..." |
| Salvo | "Salvo neste navegador às 15:42." |
| Erro ao salvar | "Não conseguimos salvar. Seus dados estão seguros em um rascunho local." |
| Aviso de armazenamento | "Usamos armazenamento local e cookies funcionais para guardar suas tier lists neste navegador. Não há contas nem rastreadores." |
| Armazenamento cheio | "Quase sem espaço no armazenamento local. Exporte um backup ou remova itens." |
| Excluir lista | "Excluir ‘{título}’? Essa ação não pode ser desfeita." |
| Importar | "Confira o que será importado antes de substituir seus dados." |
| Exportar | "Sua tier list está sendo renderizada em alta resolução." |
| CORS | "Esta imagem externa não pôde ser incluída. Reenvie o arquivo para garantir a exportação." |
| Mobile drag | "Segure e arraste para mover. Toque para abrir os detalhes." |

### 17.7 Estados vazios e de carregamento

- **Biblioteca vazia:** ilustração simples, frase acolhedora e botão "Criar minha primeira tier list".
- **Pool vazio:** "Os itens que você adicionar aparecem aqui antes de serem ranqueados."
- **Tier vazia:** área tracejada com "Solte um item aqui".
- **Carregamento:** skeletons com a mesma silhueta dos cards; nunca spinner de tela inteira.
- **Erro:** mensagem clara, ação de recuperação e link para ajuda.

### 17.8 Barra de qualidade visual

- Nenhum componente nativo sem estilo (selects, inputs, scrollbars quando possível).
- Ícones consistentes, com espessura uniforme.
- Foco visível e transições curtas.
- Nenhum texto cortado em telas de 320 px.
- A exportação deve parecer um pôster, não um print.
- Testar com capas claras, escuras, coloridas e com contraste baixo.

### 17.9 Diferenciação visual da referência

- Identidade própria, sem copiar marca, layout ou paleta do TierMaker.
- Chrome monocromático e Poppins como assinatura visual; a cor fica no conteúdo.
- Layout editorial com capa grande e respiro, em vez de grade densa.
- Temas curados por lista e microinterações suaves no drag.
- Exportações com composição, margem e tipografia.
- Marca SiterList com logo de quatro barras horizontais decrescentes.

---

## 18. Métricas de sucesso

| Métrica | Definição | Meta inicial | Como medir |
|---|---|---|---|
| Ativação | Sessões que criam lista e adicionam ≥ 5 itens | ≥ 60% | Eventos locais opcionais |
| Tempo até o primeiro valor | Abertura → primeira lista salva | < 3 min | Eventos locais |
| Sucesso de salvamento | Gravações sem erro / total | ≥ 99,9% | Telemetria local agregada |
| Exportação | Listas ativas com ≥ 1 exportação | ≥ 30% | Eventos locais |
| Retenção 7 dias | Usuários que voltam em 7 dias | ≥ 20% | Eventos locais opcionais |
| Mobile | Sessões mobile com conclusão de ranking | ≥ 50% | Eventos locais |
| Erros de armazenamento | Sessões com erro de localStorage/cookie/IDB | < 0,5% | Log local agregado |
| Acessibilidade | Problemas críticos em auditoria | 0 | axe + revisão manual |
| Qualidade percebida | Resposta "o resultado parece bonito" | ≥ 8/10 | Pesquisa com usuários |

**Privacidade das métricas:** qualquer analytics é opcional, sem cookies de terceiros e com consentimento. O produto deve funcionar plenamente sem telemetria.

---

## 19. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Limite de 5 MB e perda de dados | Alta | Alto | Medidor, bloqueio de gravação, modo estendido na V1 e backup |
| Dados removidos por ITP ou limpeza do navegador | Média | Alto | Aviso claro, espelho em cookies, lembrete de exportação |
| Exportação falhar por CORS | Alta | Médio | Priorizar uploads locais, proxy opcional na V1, aviso e placeholder |
| Drag-and-drop ruim no mobile | Média | Médio | dnd-kit, long-press, auto-scroll, menu "Mover para..." e testes em dispositivos |
| Escopo crescer além do MVP | Alta | Médio | Gate de MVP, priorização P0/P1/P2 e revisão semanal |
| Performance com muitas imagens | Média | Médio | Compressão, lazy loading, limites e testes com 200 itens |
| Acessibilidade insuficiente | Média | Médio | axe, teclado, contraste, testes com leitor de tela |
| Exportação com fontes/imagens faltando | Média | Baixo | Fontes empacotadas, `document.fonts.ready`, decode de imagens e testes |
| Direitos autorais das capas | Baixa | Médio | Uso pessoal, sem hospedagem pública no MVP, aviso ao usuário |
| Privacidade/LGPD | Baixa | Médio | Cookies funcionais, aviso, sem tracking e dados apagáveis |
| Nome/marca conflitar com produto existente | Baixa | Médio | Pesquisa de nome e identidade visual própria |
| Complexidade do modo estendido | Média | Médio | Implementar atrás de feature flag e testar com dados reais |

---

## 20. Roadmap

| Fase | Duração estimada | Entregas | Critério de saída |
|---|---|---|---|
| **Fase 0 — Descoberta e design** | 1–2 semanas | Wireframes, design tokens, protótipo navegável, decisão de arquitetura de storage | Protótipo validado e escopo do MVP congelado |
| **Fase 1 — Fundação e biblioteca** | 2 semanas | Setup, design system, home, criação, listagem, exclusão e duplicação | Criar e reabrir uma lista vazia |
| **Fase 2 — Editor e itens** | 2–3 semanas | Tiers, upload, recorte, drag-and-drop, seleção múltipla e undo/redo | Ranquear itens com mouse e toque |
| **Fase 3 — Persistência e backup** | 2 semanas | Cookies, chunking, checksum, IndexedDB, autosave, importação e exportação JSON | Round-trip completo e recuperação de falha |
| **Fase 4 — Aparência e exportação** | 2 semanas | Temas, capa, paleta dinâmica, controles de layout e exportação PNG/WebP | Exportar um board bonito em 2x |
| **Fase 5 — Qualidade e lançamento** | 1–2 semanas | Acessibilidade, performance, testes E2E, microcopy e deploy | Critérios de aceite do MVP atendidos |

**MVP:** aproximadamente 8–11 semanas, dependendo da disponibilidade de design e desenvolvimento.

### 20.1 V1 (4–6 semanas após o MVP)

- Ranking assistido (A vs B e baldes).
- Busca de metadados e capas (MusicBrainz/Cover Art Archive).
- Templates de estrutura e de estilo.
- Theme Studio avançado: fontes, ícones por tier, layout de pôster.
- Link local comprimido e cards sociais.
- Backup completo em ZIP (JSON + imagens).
- Lixeira e histórico de versões.
- PWA offline.
- Espelho de recuperação e sincronização entre abas.
- Inglês.

### 20.2 V2 (futuro)

- Contas e sincronização em nuvem.
- Galeria pública e compartilhamento por link permanente.
- Colaboração em tempo real.
- Integração com Spotify para importar playlists.
- Embed em sites.
- Temas da comunidade e CSS customizado.
- Aplicativo nativo ou wrapper.

### 20.3 Gate do MVP

O MVP só é lançado quando:

1. Todos os requisitos P0 estiverem implementados.
2. Os critérios de aceite da seção 21 passarem.
3. Não houver bugs críticos ou bloqueantes.
4. O round-trip do backup de estrutura e ranking for confiável.
5. Os fluxos principais funcionarem em mobile e desktop.
6. A auditoria básica de acessibilidade não tiver problemas críticos.
7. A exportação em 2x for visualmente aprovada.
8. As telas principais (biblioteca, editor e exportação) passarem por revisão visual alinhada à direção de arte da seção 17.

---

## 21. Critérios de aceite do MVP

| ID | Cenário | Resultado esperado |
|---|---|---|
| CA-01 | Criar lista com título, capa e 5 tiers; recarregar a página | Lista, capa, tiers e configurações são restaurados |
| CA-02 | Renomear, recolorir e reordenar tiers | Alterações persistem após recarregar |
| CA-03 | Arrastar item do pool para uma tier, entre tiers e dentro da tier | Ordem e posição persistem |
| CA-04 | Adicionar item depois de salvar, enviando apenas uma foto | Item entra no pool com nome sugerido; contador atualiza |
| CA-05 | Excluir uma tier com itens | Itens vão para o pool; nada é perdido |
| CA-06 | Executar 50 ações e desfazer/refazer | Histórico funciona sem corromper o estado |
| CA-07 | Editar e aguardar 600 ms | Status muda para "Salvando..." e depois "Salvo" |
| CA-08 | Preencher o limite de 5 MB | Aviso aparece e o último estado válido é preservado |
| CA-09 | Exportar em PNG 2x | Imagem sem UI, com capa, título, tiers e itens |
| CA-10 | Exportar JSON e importar em outro navegador | Estrutura, rankings, notas e configurações são restaurados; imagens por upload são sinalizadas para reenvio |
| CA-11 | Limpar os dados do navegador e abrir o app | Estado vazio com opção de importar backup |
| CA-12 | Usar o editor em 375 px | Drag por toque funciona sem overflow horizontal |
| CA-13 | Navegar por teclado e mover um item pelo menu | Ação funciona e é anunciada |
| CA-14 | Verificar contraste e foco | Textos legíveis e foco visível |
| CA-15 | Arrastar com 100 itens | Interação a 60 fps |
| CA-16 | Abrir o console em produção | Sem erros, warnings críticos ou violações de CSP |
| CA-17 | Abrir o app pela primeira vez | Aviso de armazenamento aparece e pode ser aceito |
| CA-18 | Trocar tema, capa e layout | Preview ao vivo e persistência por lista |
| CA-19 | Excluir todos os dados | Confirmação explícita e estado limpo |
| CA-20 | Falhar ao gravar no localStorage | Erro visível, último estado válido preservado e opção de exportar |
| CA-21 | Abrir "Adicionar item" | Apenas área de foto e botão de escolher; sem campos de nome, detalhe, tier ou nota; salvar desabilitado até escolher foto |
| CA-22 | Editar item já existente | Nome, detalhe, tier e nota disponíveis, com fallback "Sem título" |
| CA-23 | Usar um tier com nome longo | Rótulo reduz a fonte e mantém palavras inteiras, sem vazar no editor e na exportação |
| CA-24 | Abrir a home em desktop e mobile | Visual monocromático, Poppins, sem hero ou card de criação em destaque |

---

## 22. Questões em aberto e decisões necessárias

| # | Decisão | Status | Resolução |
|---|---|---|---|
| 1 | Escopo dos itens | Resolvido | Qualquer imagem: álbuns, jogos, filmes, personagens, comidas, lugares e mais |
| 2 | Armazenamento local | Resolvido | `localStorage` de 5 MB como fonte primária + espelho em cookies ≤ 32 KB; imagens no IndexedDB |
| 3 | Upload de imagens | Resolvido | IndexedDB com `assetId` referenciado no estado |
| 4 | Compartilhamento | Resolvido para o MVP | JSON no MVP; link local e ZIP com imagens na V1; backend na V2 |
| 5 | Contas e nuvem | Resolvido | Sem conta, backend ou sincronização no MVP |
| 6 | Nome e marca | Resolvido | SiterList, com logo de barras horizontais e favicon próprio |
| 7 | Fonte de metadados | Planejado para V1 | MusicBrainz + Cover Art Archive, começando por música |
| 8 | Analytics | Resolvido | Nenhum por padrão; opt-in na V1, sem cookies de terceiros |
| 9 | Limite de listas | Resolvido | 20 listas, 12 tiers e 200 itens por lista, com aviso de armazenamento |
| 10 | Fontes | Resolvido | Poppins única, vendorizada; sem catálogo ou upload no MVP |
| 11 | Backup com imagens | Planejado para V1 | ZIP com JSON + assets; no MVP, avisar que uploads precisam ser reenviados |
| 12 | Modo estendido | Planejado para V1 | Transbordo para IndexedDB quando os 5 MB não comportarem |
| 13 | Testes automatizados | Em aberto | Adotar Playwright se o projeto migrar para um bundler |

---

## 23. Glossário

| Termo | Definição |
|---|---|
| **Tier list** | Ranking visual composto por faixas e itens |
| **Tier / faixa / categoria** | Linha do ranking (S, A, B, C, D…) |
| **Item** | Card visual com foto, nome, detalhe e nota opcionais |
| **Cadastro foto-first** | Fluxo em que a foto é o único passo obrigatório para adicionar um item |
| **Detalhe** | Campo livre opcional do item (ano, autor, estúdio etc.); internamente chamado de `artist` |
| **Chrome** | Navegação, botões, campos e cabeçalhos da interface |
| **Pool** | Área de itens ainda não classificados |
| **Board** | Conjunto visual de tiers e itens |
| **Capa** | Imagem de destaque da tier list |
| **Asset** | Arquivo de imagem armazenado no IndexedDB |
| **Tema** | Conjunto de aparência (cores, fontes, fundos) |
| **Preset** | Configuração pronta de tiers, layout ou tema |
| **Autosave** | Salvamento automático após alterações |
| **Modo estendido** | Transbordo do payload para IndexedDB quando os 5 MB não comportam |
| **Espelho** | Cópia de recuperação do estado em cookies, limitada a 32 KB |
| **Backup** | Arquivo exportável (JSON ou ZIP) com dados e, opcionalmente, imagens |
| **Ranking assistido** | Modo de comparação ou baldes para ajudar a ordenar |

---

## 24. Referências

- TierMaker — referência funcional: <https://tiermaker.com/>
- MDN — Window.localStorage: <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
- MDN — HTTP cookies: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies>
- RFC 6265 — HTTP State Management Mechanism: <https://datatracker.ietf.org/doc/html/rfc6265>
- MDN — Compression Streams: <https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API>
- MDN — IndexedDB: <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>
- WCAG 2.1: <https://www.w3.org/TR/WCAG21/>
- dnd-kit: <https://dndkit.com/>
- html-to-image: <https://github.com/bubkoo/html-to-image>
- idb-keyval: <https://github.com/jakearchibald/idb-keyval>
- MusicBrainz API: <https://musicbrainz.org/doc/MusicBrainz_API>
- Cover Art Archive: <https://coverartarchive.org/>
- ANPD/LGPD: <https://www.gov.br/anpd/pt-br>

---

> **Nota:** TierMaker é marca de seus respectivos proprietários. O nome é usado apenas como referência funcional; este produto não é afiliado à plataforma e não deve copiar sua identidade visual.

> **Próximos passos sugeridos:** validar as decisões da seção 22, criar o protótipo visual da home e do editor, e detalhar o design system antes de iniciar a implementação.

