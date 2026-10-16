const CONTRACTS_ENDPOINT = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao'
const ATAS_ENDPOINT = 'https://pncp.gov.br/api/consulta/v1/atas'

function toPncpDate(value) {
  return value?.replaceAll('-', '')
}

export async function searchPncp({ catalog, filters, page }) {
  const params = new URLSearchParams({
    dataInicial: toPncpDate(filters.start),
    dataFinal: toPncpDate(filters.end),
    pagina: page,
    tamanhoPagina: 12,
  })
  if (catalog === 'contratacoes') params.set('codigoModalidadeContratacao', filters.modality)

  const response = await fetch(`${catalog === 'atas' ? ATAS_ENDPOINT : CONTRACTS_ENDPOINT}?${params}`)
  if (!response.ok) throw new Error(`O PNCP não aceitou esta consulta. Verifique o período${catalog === 'contratacoes' ? ' e a modalidade' : ''}.`)
  return response.json()
}
