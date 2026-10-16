import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileText,
  Landmark,
  LoaderCircle,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react'
import { MAX_TAG_LENGTH, MAX_TAGS, MODALITIES, createDefaultFilters, normalizeTags, readInitialSearch, readInitialTheme } from './config/catalog'
import { ataSituation, compareDates, formatDate, isAdhesionCandidate, matchingTagsCount, recordSearchableText, remainingDays } from './lib/records'
import { searchPncp } from './services/pncp'
import { AtaCard, ContractCard, EmptyState } from './components/results/ResultCards'

export default function App() {
  const initialSearch = readInitialSearch()
  const [filters, setFilters] = useState(initialSearch.filters)
  const [keywordInput, setKeywordInput] = useState('')
  const [catalog, setCatalog] = useState(initialSearch.catalog)
  const [theme, setTheme] = useState(readInitialTheme)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queried, setQueried] = useState(false)

  const search = async (targetPage = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    setQueried(true)
    try {
      const payload = await searchPncp({ catalog, filters: activeFilters, page: targetPage })
      setData(payload)
      setPage(targetPage)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível consultar o PNCP agora.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { search(1) }, [catalog])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('visao', catalog)
    params.set('inicio', filters.start)
    params.set('fim', filters.end)
    params.set('ordem', filters.sort)
    filters.tags.forEach((tag) => params.append('tag', tag))
    if (catalog === 'contratacoes') params.set('modalidade', filters.modality)
    if (catalog === 'atas') {
      if (filters.ataSituation !== 'all') params.set('situacao', filters.ataSituation)
      if (filters.adhesion !== 'all') params.set('adesao', filters.adhesion)
      if (filters.adhesionCandidatesOnly) params.set('avaliarAdesao', '1')
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }, [catalog, filters])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('radar-pncp-theme', theme)
  }, [theme])

  const selectCatalog = (nextCatalog) => {
    if (nextCatalog === catalog) return
    setData(null)
    setPage(1)
    setCatalog(nextCatalog)
  }

  const addKeywordTags = () => {
    const additions = normalizeTags(keywordInput)
    if (!additions.length) return filters
    const tags = normalizeTags([...filters.tags, ...additions])
    const nextFilters = { ...filters, tags }
    setFilters(nextFilters)
    setKeywordInput('')
    return nextFilters
  }

  const removeKeywordTag = (tagIndex) => setFilters({ ...filters, tags: filters.tags.filter((_, index) => index !== tagIndex) })

  const resetFilters = () => {
    const nextFilters = createDefaultFilters()
    setFilters(nextFilters)
    setKeywordInput('')
    search(1, nextFilters)
  }

  const records = useMemo(() => {
    const filteredRecords = (data?.data || []).filter((record) => {
      if (catalog === 'atas') {
        if (filters.ataSituation !== 'all' && ataSituation(record) !== filters.ataSituation) return false
        if (filters.adhesion === 'yes' && record.possibilidadeAdesao !== true) return false
        if (filters.adhesion === 'no' && record.possibilidadeAdesao !== false) return false
        if (filters.adhesion === 'unknown' && record.possibilidadeAdesao !== null && record.possibilidadeAdesao !== undefined) return false
        if (filters.adhesionCandidatesOnly && !isAdhesionCandidate(record)) return false
      }
      const searchableText = recordSearchableText(record, catalog)
      return filters.tags.every((tag) => searchableText.includes(tag.toLocaleLowerCase('pt-BR')))
    })
    return filteredRecords.sort((first, second) => {
      if (filters.sort === 'orgao') return (catalog === 'atas' ? first.nomeOrgao : first.orgaoEntidade?.razaoSocial || '').localeCompare(catalog === 'atas' ? second.nomeOrgao : second.orgaoEntidade?.razaoSocial || '', 'pt-BR')
      if (filters.sort === 'recent') return (compareDates(second.dataAtualizacao || second.dataPublicacaoPncp)?.getTime() || 0) - (compareDates(first.dataAtualizacao || first.dataPublicacaoPncp)?.getTime() || 0)
      if (filters.sort === 'expiry') return (compareDates(first.vigenciaFim || first.dataEncerramentoProposta)?.getTime() || Number.MAX_SAFE_INTEGER) - (compareDates(second.vigenciaFim || second.dataEncerramentoProposta)?.getTime() || Number.MAX_SAFE_INTEGER)
      if (catalog === 'atas') {
        const priority = Number(isAdhesionCandidate(second)) - Number(isAdhesionCandidate(first))
        if (priority) return priority
        return (compareDates(first.vigenciaFim)?.getTime() || Number.MAX_SAFE_INTEGER) - (compareDates(second.vigenciaFim)?.getTime() || Number.MAX_SAFE_INTEGER)
      }
      return matchingTagsCount(second, catalog, filters.tags) - matchingTagsCount(first, catalog, filters.tags)
    })
  }, [catalog, data, filters.adhesion, filters.adhesionCandidatesOnly, filters.ataSituation, filters.sort, filters.tags])

  const catalogLabel = catalog === 'atas' ? 'Atas de registro de preços' : 'Contratações públicas'
  const nounPlural = catalog === 'atas' ? 'atas encontradas' : 'contratações encontradas'
  const hasPageRefinement = filters.tags.length > 0 || (catalog === 'atas' && (filters.ataSituation !== 'all' || filters.adhesion !== 'all' || filters.adhesionCandidatesOnly))
  const headline = data ? (hasPageRefinement ? `${records.length} resultados nesta página` : `${new Intl.NumberFormat('pt-BR').format(data.totalRegistros || 0)} ${nounPlural}`) : 'Consultas públicas, em tempo real'
  const selectedModality = MODALITIES.find((item) => item.value === filters.modality)?.label || 'modalidade selecionada'
  const ataSummary = catalog === 'atas' ? {
    candidates: records.filter(isAdhesionCandidate).length,
    expiring: records.filter((record) => { const days = remainingDays(record.vigenciaFim); return ataSituation(record) === 'vigente' && days !== null && days <= 30 }).length,
    future: records.filter((record) => ataSituation(record) === 'future').length,
  } : null

  return <main className="govbr-app min-h-screen bg-[#f6f7f4] text-slate-800">
    <header className="govbr-header border-b border-emerald-950/10 bg-[#123c32] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <a className="flex min-w-0 items-center gap-2.5 sm:gap-3" href="#top" aria-label="Radar PNCP, início">
          <span className="govbr-brand-symbol grid h-9 w-9 place-items-center rounded-xl bg-[#c8e48c] text-[#123c32]"><Landmark className="h-5 w-5" /></span>
          <span className="min-w-0"><span className="block text-base font-extrabold tracking-tight">Radar PNCP</span><span className="block text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-200 sm:tracking-[.18em]">Contratações e atas</span></span>
        </a>
        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <nav className="govbr-tabs hidden items-center gap-1 rounded-xl border border-emerald-200/20 bg-emerald-950/20 p-1 md:flex" aria-label="Visões de consulta" role="tablist">
            <button type="button" role="tab" aria-selected={catalog === 'contratacoes'} onClick={() => selectCatalog('contratacoes')} className={`govbr-tab rounded-lg px-3 py-1.5 text-sm font-bold transition ${catalog === 'contratacoes' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:bg-white/10 hover:text-white'}`}>Contratações</button>
            <button type="button" role="tab" aria-selected={catalog === 'atas'} onClick={() => selectCatalog('atas')} className={`govbr-tab rounded-lg px-3 py-1.5 text-sm font-bold transition ${catalog === 'atas' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:bg-white/10 hover:text-white'}`}>Atas</button>
          </nav>
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="govbr-icon-button inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200/25 bg-white/10 text-emerald-50 transition hover:bg-white/20" aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <a href={catalog === 'atas' ? 'https://pncp.gov.br/app/atas' : 'https://pncp.gov.br/app/editais'} target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white lg:flex">Portal oficial <ExternalLink className="h-4 w-4" /></a>
        </div>
      </div>
    </header>

    <section id="top" className="govbr-hero relative overflow-hidden bg-[#123c32] pb-14 pt-9 text-white sm:pb-20 sm:pt-16">
      <div className="pointer-events-none absolute -right-28 -top-20 h-80 w-80 rounded-full bg-[#4f8a71] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[20%] h-60 w-60 rounded-full bg-[#c8e48c] opacity-10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
        <div className="max-w-3xl fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-100/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" /> Dados públicos</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{catalog === 'atas' ? 'Encontre atas de registro de preços.' : <>Encontre oportunidades<br className="hidden sm:block" /> em compras públicas.</>}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">{catalog === 'atas' ? 'Consulte vigência, órgãos e possibilidade de adesão diretamente no PNCP.' : 'Pesquise contratações publicadas no PNCP por período, modalidade e palavras-chave.'}</p>
        </div>
      </div>
    </section>

    <section className="relative z-10 mx-auto -mt-7 max-w-7xl px-4 sm:-mt-9 sm:px-8">
      <form onSubmit={(event) => { event.preventDefault(); search(1, addKeywordTags()) }} className="govbr-panel rounded-2xl border border-stone-200 bg-white p-4 shadow-xl shadow-emerald-950/10 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><SlidersHorizontal className="h-4 w-4 text-emerald-700" /> Filtros para {catalogLabel.toLocaleLowerCase('pt-BR')}</div>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <div className="govbr-tabs inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-100 p-1 md:hidden" role="tablist" aria-label="Visões de consulta">
              <button type="button" role="tab" aria-selected={catalog === 'contratacoes'} onClick={() => selectCatalog('contratacoes')} className={`govbr-tab inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold transition sm:px-3 ${catalog === 'contratacoes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Landmark className="h-4 w-4" />Contratações</button>
              <button type="button" role="tab" aria-selected={catalog === 'atas'} onClick={() => selectCatalog('atas')} className={`govbr-tab inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold transition sm:px-3 ${catalog === 'atas' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><FileText className="h-4 w-4" />Atas</button>
            </div>
            <button type="button" onClick={resetFilters} disabled={loading} className="govbr-secondary-button inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-wait disabled:opacity-60"><RotateCcw className="h-3.5 w-3.5" />Resetar filtros</button>
          </div>
        </div>
        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Palavras-chave</span>
          <div className="govbr-tag-editor flex min-h-11 min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {filters.tags.map((tag, index) => <span key={`${tag}-${index}`} className="govbr-tag inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">{tag}<button type="button" onClick={() => removeKeywordTag(index)} aria-label={`Remover ${tag}`} className="rounded text-emerald-700 hover:bg-emerald-200 hover:text-emerald-950"><X className="h-3.5 w-3.5" /></button></span>)}
            <input type="search" value={keywordInput} maxLength={MAX_TAG_LENGTH} onChange={(event) => setKeywordInput(event.target.value)} onBlur={addKeywordTags} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',' || event.key === ';') { event.preventDefault(); addKeywordTags() } else if (event.key === 'Backspace' && !keywordInput && filters.tags.length) removeKeywordTag(filters.tags.length - 1) }} placeholder={filters.tags.length ? 'Adicionar outra palavra...' : (catalog === 'atas' ? 'Ex.: medicamentos, informática, veículo ou nome do órgão' : 'Ex.: limpeza, obra, tecnologia ou nome do órgão')} className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400 sm:min-w-48" />
          </div>
          <span className="mt-1.5 block text-xs text-slate-500">Pressione Enter, vírgula ou ponto e vírgula para criar uma tag. Até {MAX_TAGS} tags refinam objeto, órgão, unidade e identificadores nesta página.</span>
        </div>
        {catalog === 'atas' && <label className="govbr-adhesion-toggle mb-4 inline-flex cursor-pointer items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={filters.adhesionCandidatesOnly} onChange={(event) => setFilters({ ...filters, adhesionCandidatesOnly: event.target.checked, ...(event.target.checked ? { ataSituation: 'vigente', adhesion: 'yes' } : {}) })} className="govbr-checkbox mt-0.5 h-4 w-4 accent-emerald-700" /><span><strong className="govbr-adhesion-title block font-bold text-emerald-900">Somente atas para avaliar adesão</strong><span className="govbr-adhesion-description block text-xs text-slate-500">Vigentes, não canceladas e com adesão prevista no PNCP.</span></span></label>}
        <div className={`grid gap-4 md:grid-cols-2 ${catalog === 'contratacoes' ? 'xl:grid-cols-[1.15fr_1fr_1fr_1fr_auto]' : 'xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]'} xl:items-end`}>
          {catalog === 'contratacoes' && <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Modalidade</span><select value={filters.modality} onChange={(event) => setFilters({ ...filters, modality: event.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{MODALITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{catalog === 'atas' ? 'Vigência inicial' : 'Data inicial'}</span><input value={filters.start} max={filters.end} onChange={(event) => setFilters({ ...filters, start: event.target.value })} type="date" required className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{catalog === 'atas' ? 'Vigência final' : 'Data final'}</span><input value={filters.end} min={filters.start} onChange={(event) => setFilters({ ...filters, end: event.target.value })} type="date" required className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
          {catalog === 'atas' && <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Situação</span><select value={filters.ataSituation} onChange={(event) => setFilters({ ...filters, ataSituation: event.target.value, adhesionCandidatesOnly: false })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"><option value="all">Todas</option><option value="future">Vigência futura</option><option value="vigente">Vigente</option><option value="naoVigente">Não vigente</option><option value="cancelada">Cancelada</option><option value="unknown">Não informada</option></select></label>}
          {catalog === 'atas' && <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Possibilidade de adesão</span><select value={filters.adhesion} onChange={(event) => setFilters({ ...filters, adhesion: event.target.value, adhesionCandidatesOnly: false })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"><option value="all">Todas</option><option value="yes">Permite adesão</option><option value="no">Não permite adesão</option><option value="unknown">Não informada</option></select></label>}
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Ordenar</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"><option value="candidate">{catalog === 'atas' ? 'Adesão e vencimento' : 'Mais relevantes'}</option><option value="expiry">{catalog === 'atas' ? 'Vencimento mais próximo' : 'Encerramento mais próximo'}</option><option value="recent">Atualização mais recente</option><option value="orgao">Órgão (A–Z)</option></select></label>
          <button disabled={loading} className="govbr-primary-button inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"><Search className="h-4 w-4" />{loading ? 'Consultando...' : 'Consultar'}</button>
        </div>
      </form>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">{catalog === 'atas' ? catalogLabel : selectedModality}</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{headline}</h2><p className="mt-1 text-sm text-slate-500">{catalog === 'atas' ? 'Atas com vigência no período de' : 'Resultados publicados entre'} {formatDate(filters.start, { day: '2-digit', month: 'long' })} e {formatDate(filters.end, { day: '2-digit', month: 'long', year: 'numeric' })}.</p>{ataSummary && <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="govbr-summary-pill govbr-summary-candidate rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{ataSummary.candidates} para avaliar adesão</span><span className="govbr-summary-pill govbr-summary-expiring rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{ataSummary.expiring} vencem em até 30 dias</span><span className="govbr-summary-pill govbr-summary-future rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{ataSummary.future} com vigência futura</span></div>}</div>
        {filters.tags.length > 0 && <button type="button" onClick={() => setFilters({ ...filters, tags: [] })} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-stone-300 hover:text-slate-900 lg:self-auto"><X className="h-4 w-4" />Limpar palavras-chave</button>}
      </div>

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong className="block">Não foi possível concluir a consulta</strong><span>{error}</span></div></div>}
      {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-stone-200 bg-white"><div className="text-center"><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" /><p className="mt-3 text-sm font-semibold text-slate-600">Consultando dados oficiais...</p></div></div> : records.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => catalog === 'atas' ? <AtaCard key={record.numeroControlePNCPAta} record={record} tags={filters.tags} /> : <ContractCard key={record.numeroControlePNCP} record={record} />)}</div> : <EmptyState hasQuery={queried} catalog={catalog} />}

      {!!data?.totalPaginas && !loading && <nav aria-label="Paginação" className="govbr-panel mt-8 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3"><span className="hidden text-sm text-slate-500 sm:block">Página <strong className="text-slate-800">{data.numeroPagina}</strong> de {new Intl.NumberFormat('pt-BR').format(data.totalPaginas)}</span><button onClick={() => search(page - 1)} disabled={page <= 1} className="govbr-secondary-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" />Anterior</button><button onClick={() => search(page + 1)} disabled={page >= data.totalPaginas} className="govbr-primary-button inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-35">Próxima<ChevronRight className="h-4 w-4" /></button></nav>}
    </section>

    <footer className="govbr-footer border-t border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>Radar PNCP</span><a className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900" href="https://pncp.gov.br" target="_blank" rel="noreferrer">Fonte: Portal Nacional de Contratações Públicas <ExternalLink className="h-3 w-3" /></a></div></footer>
  </main>
}
