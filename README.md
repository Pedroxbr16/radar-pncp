# Radar PNCP

Aplicação web para consultar contratações públicas e atas de registro de preços a partir dos dados públicos do [Portal Nacional de Contratações Públicas (PNCP)](https://pncp.gov.br/).

## Recursos

- Consulta de contratações por período e modalidade.
- Consulta de atas por período, situação e possibilidade de adesão.
- Busca por palavras-chave com tags.
- Ordenação e filtros locais dos resultados retornados pelo PNCP.
- Links diretos para os registros no portal oficial.
- Tema claro e escuro, layout responsivo e estilos baseados no Design System gov.br.
- Estado da consulta compartilhável pela URL.

## Tecnologias

- React
- Vite
- Tailwind CSS
- Lucide Icons
- Tokens do Design System gov.br

## Como executar

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

## Estrutura

```text
src/
├── components/results/  # cartões e estados de resultado
├── config/              # filtros padrão, tema e modalidades
├── lib/                 # formatação e regras de domínio
├── services/            # cliente da API do PNCP
├── App.jsx              # composição e estado da página
└── index.css            # tema e estilos globais
```

## Dados

As consultas são realizadas diretamente nos endpoints públicos do PNCP. O Radar PNCP não mantém uma cópia própria dos resultados consultados.

## Desenvolvimento

Arquivos gerados localmente, dependências e variáveis de ambiente estão excluídos pelo `.gitignore`.
