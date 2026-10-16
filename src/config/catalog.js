export const MODALITIES = [
  { value: '6', label: 'Pregão eletrônico' },
  { value: '7', label: 'Pregão presencial' },
  { value: '8', label: 'Dispensa de licitação' },
  { value: '9', label: 'Inexigibilidade' },
  { value: '4', label: 'Concorrência' },
]

export const MAX_TAGS = 8
export const MAX_TAG_LENGTH = 100

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function normalizeTags(values) {
  const tags = Array.isArray(values) ? values : [values]
  const normalized = []
  tags.flatMap((value) => String(value || '').split(/[,;\n]+/)).forEach((value) => {
    const tag = value.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH)
    if (tag && !normalized.some((item) => item.localeCompare(tag, 'pt-BR', { sensitivity: 'accent' }) === 0) && normalized.length < MAX_TAGS) normalized.push(tag)
  })
  return normalized
}

export function createDefaultFilters() {
  return { start: localDate(-14), end: localDate(), modality: '6', tags: [], ataSituation: 'all', adhesion: 'all', adhesionCandidatesOnly: false, sort: 'candidate' }
}

export function readInitialSearch() {
  const defaults = createDefaultFilters()
  if (typeof window === 'undefined') return { catalog: 'contratacoes', filters: defaults }
  const params = new URLSearchParams(window.location.search)
  const catalog = params.get('visao') === 'atas' ? 'atas' : 'contratacoes'
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
  const sort = ['candidate', 'expiry', 'recent', 'orgao'].includes(params.get('ordem')) ? params.get('ordem') : defaults.sort
  return {
    catalog,
    filters: {
      ...defaults,
      start: validDate(params.get('inicio')) ? params.get('inicio') : defaults.start,
      end: validDate(params.get('fim')) ? params.get('fim') : defaults.end,
      modality: MODALITIES.some((item) => item.value === params.get('modalidade')) ? params.get('modalidade') : defaults.modality,
      tags: normalizeTags(params.getAll('tag')),
      ataSituation: ['all', 'future', 'vigente', 'naoVigente', 'cancelada', 'unknown'].includes(params.get('situacao')) ? params.get('situacao') : defaults.ataSituation,
      adhesion: ['all', 'yes', 'no', 'unknown'].includes(params.get('adesao')) ? params.get('adesao') : defaults.adhesion,
      adhesionCandidatesOnly: params.get('avaliarAdesao') === '1',
      sort,
    },
  }
}

export function readInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem('radar-pncp-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
