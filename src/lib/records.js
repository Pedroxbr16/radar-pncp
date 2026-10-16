export function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return 'Não informado'
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', options).format(parsed)
}

export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(amount)
}

export function remainingDays(value) {
  if (!value) return null
  const days = Math.ceil((new Date(value) - new Date()) / 86400000)
  return Number.isFinite(days) ? days : null
}

export function compareDates(value) {
  if (!value) return null
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function ataSituation(record) {
  if (record.cancelado) return 'cancelada'
  const start = compareDates(record.vigenciaInicio)
  const end = compareDates(record.vigenciaFim)
  if (!end) return 'unknown'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (start && start > now) return 'future'
  return end >= now ? 'vigente' : 'naoVigente'
}

export function isAdhesionCandidate(record) {
  return ataSituation(record) === 'vigente' && record.possibilidadeAdesao === true
}

export function recordSearchableText(record, catalog) {
  const fields = catalog === 'atas'
    ? [record.numeroAtaRegistroPreco, record.objetoContratacao, record.nomeOrgao, record.nomeUnidadeOrgao, record.numeroControlePNCPAta]
    : [record.objetoCompra, record.orgaoEntidade?.razaoSocial, record.unidadeOrgao?.municipioNome, record.processo, record.numeroCompra]
  return fields.join(' ').toLocaleLowerCase('pt-BR')
}

export function matchingTagsCount(record, catalog, tags) {
  const searchableText = recordSearchableText(record, catalog)
  return tags.filter((tag) => searchableText.includes(tag.toLocaleLowerCase('pt-BR'))).length
}

export function pncpUrl(record) {
  const cnpj = record?.orgaoEntidade?.cnpj
  if (!cnpj || !record?.anoCompra || record?.sequencialCompra === undefined) return 'https://pncp.gov.br/app/editais'
  return `https://pncp.gov.br/app/editais/${cnpj}/${record.anoCompra}/${record.sequencialCompra}`
}

export function pncpAtaUrl(record) {
  const match = record?.numeroControlePNCPAta?.match(/^(\d{14})-1-(\d+)\/(\d{4})-(\d+)$/)
  if (match) return `https://pncp.gov.br/app/atas/${match[1]}/${match[3]}/${Number(match[2])}/${Number(match[4])}`
  return 'https://pncp.gov.br/app/atas'
}
