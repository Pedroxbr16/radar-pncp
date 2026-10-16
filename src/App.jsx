import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileSearch,
  Filter,
  Landmark,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const API_BASE = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao'

const modalities = [
  { value: '6', label: 'Pregão eletrônico' },
  { value: '7', label: 'Pregão presencial' },
  { value: '8', label: 'Dispensa de licitação' },
  { value: '9', label: 'Inexigibilidade' },
  { value: '4', label: 'Concorrência' },
]

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function toPncpDate(value) {
  return value?.replaceAll('-', '')
}

function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return 'Não informado'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', options).format(parsed)
}

function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(amount)
}

function remainingDays(value) {
  if (!value) return null
  const now = new Date()
  const due = new Date(value)
  const days = Math.ceil((due - now) / 86400000)
  return Number.isFinite(days) ? days : null
}

function pncpUrl(record) {
  const cnpj = record?.orgaoEntidade?.cnpj
  if (!cnpj || !record?.anoCompra || record?.sequencialCompra === undefined) return 'https://pncp.gov.br/app/editais'
  return `https://pncp.gov.br/app/editais/${cnpj}/${record.anoCompra}/${record.sequencialCompra}`
}

function StatusPill({ record }) {
  const days = remainingDays(record.dataEncerramentoProposta)
  if (days !== null && days >= 0) {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Propostas abertas</span>
  }
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{record.situacaoCompraNome || 'Publicada'}</span>
}

function ContractCard({ record }) {
  const days = remainingDays(record.dataEncerramentoProposta)
  return (
    <article className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(20,34,30,.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(20,34,30,.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <StatusPill record={record} />
        {record.srp && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">SRP</span>}
      </div>
      <h3 className="line-clamp-3 text-[15px] font-bold leading-6 text-slate-900">{record.objetoCompra || 'Objeto não informado'}</h3>
      <div className="mt-4 flex items-start gap-2.5 text-sm text-slate-600">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span className="line-clamp-2">{record.orgaoEntidade?.razaoSocial || 'Órgão não informado'}</span>
      </div>
      <div className="mt-2 flex items-center gap-2.5 text-sm text-slate-600">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
        <span>{record.unidadeOrgao?.municipioNome || 'Localidade não informada'}{record.unidadeOrgao?.ufSigla ? ` · ${record.unidadeOrgao.ufSigla}` : ''}</span>
      </div>
      <div className="my-5 grid grid-cols-2 gap-3 border-y border-stone-100 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimado</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(record.valorTotalEstimado)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Encerramento</p>
          <p className={`mt-1 text-sm font-bold ${days !== null && days >= 0 && days <= 3 ? 'text-amber-700' : 'text-slate-800'}`}>
            {days !== null && days >= 0 ? `${days === 0 ? 'Hoje' : `${days} dia${days === 1 ? '' : 's'}`}` : formatDate(record.dataEncerramentoProposta, { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">{record.modalidadeNome || 'Contratação pública'}</span>
        <a href={pncpUrl(record)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition group-hover:text-emerald-800">Ver no PNCP <ArrowUpRight className="h-4 w-4" /></a>
      </div>
    </article>
  )
}

function EmptyState({ hasQuery }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
    <FileSearch className="mx-auto h-10 w-10 text-emerald-700" />
    <h2 className="mt-4 text-lg font-bold text-slate-900">{hasQuery ? 'Nenhuma contratação encontrada' : 'Comece uma consulta'}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{hasQuery ? 'Ajuste os filtros ou tente um intervalo e modalidade diferentes.' : 'Selecione o período e a modalidade para consultar os dados públicos do PNCP.'}</p>
  </div>
}

export default function App() {
  const [filters, setFilters] = useState({ start: localDate(-14), end: localDate(), modality: '6', term: '' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queried, setQueried] = useState(false)

  const search = async (targetPage = 1) => {
    setLoading(true)
    setError('')
    setQueried(true)
    const params = new URLSearchParams({
      dataInicial: toPncpDate(filters.start),
      dataFinal: toPncpDate(filters.end),
      codigoModalidadeContratacao: filters.modality,
      pagina: targetPage,
      tamanhoPagina: 12,
    })
    try {
      const response = await fetch(`${API_BASE}?${params}`)
      if (!response.ok) throw new Error('O PNCP não aceitou esta consulta. Verifique o período e a modalidade.')
      const payload = await response.json()
      setData(payload)
      setPage(targetPage)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível consultar o PNCP agora.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { search(1) }, [])

  const records = useMemo(() => {
    const term = filters.term.trim().toLocaleLowerCase('pt-BR')
    if (!term) return data?.data || []
    return (data?.data || []).filter((record) => [record.objetoCompra, record.orgaoEntidade?.razaoSocial, record.unidadeOrgao?.municipioNome, record.processo, record.numeroCompra].join(' ').toLocaleLowerCase('pt-BR').includes(term))
  }, [data, filters.term])

  const headline = data ? `${new Intl.NumberFormat('pt-BR').format(data.totalRegistros || 0)} contratações encontradas` : 'Consultas públicas, em tempo real'
  const selectedModality = modalities.find((item) => item.value === filters.modality)?.label || 'modalidade selecionada'

  return <main className="min-h-screen bg-[#f6f7f4] text-slate-800">
    <header className="border-b border-emerald-950/10 bg-[#123c32] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="Radar PNCP, início">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c8e48c] text-[#123c32]"><Landmark className="h-5 w-5" /></span>
          <span><span className="block text-base font-extrabold tracking-tight">Radar PNCP</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200">Contratações públicas</span></span>
        </a>
        <a href="https://pncp.gov.br/app/editais" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white sm:flex">Portal oficial <ExternalLink className="h-4 w-4" /></a>
      </div>
    </header>

    <section id="top" className="relative overflow-hidden bg-[#123c32] pb-16 pt-10 text-white sm:pb-20 sm:pt-16">
      <div className="pointer-events-none absolute -right-28 -top-20 h-80 w-80 rounded-full bg-[#4f8a71] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[20%] h-60 w-60 rounded-full bg-[#c8e48c] opacity-10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-100/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" /> Dados públicos, sem cadastro</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Encontre oportunidades<br className="hidden sm:block" /> no mercado público.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">Consulte contratações publicadas no Portal Nacional de Contratações Públicas. Nada é armazenado: os resultados vêm direto da fonte oficial.</p>
        </div>
      </div>
    </section>

    <section className="relative z-10 mx-auto -mt-7 max-w-7xl px-5 sm:-mt-9 sm:px-8">
      <form onSubmit={(event) => { event.preventDefault(); search(1) }} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xl shadow-emerald-950/10 sm:p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-800"><SlidersHorizontal className="h-4 w-4 text-emerald-700" /> Configure sua busca</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_auto] xl:items-end">
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Modalidade</span><select value={filters.modality} onChange={(event) => setFilters({ ...filters, modality: event.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">{modalities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Data inicial</span><input value={filters.start} max={filters.end} onChange={(event) => setFilters({ ...filters, start: event.target.value })} type="date" required className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Data final</span><input value={filters.end} min={filters.start} onChange={(event) => setFilters({ ...filters, end: event.target.value })} type="date" required className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
          <button disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"><Search className="h-4 w-4" />{loading ? 'Consultando...' : 'Consultar'}</button>
        </div>
      </form>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">{selectedModality}</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{headline}</h2><p className="mt-1 text-sm text-slate-500">Resultados publicados entre {formatDate(filters.start, { day: '2-digit', month: 'long' })} e {formatDate(filters.end, { day: '2-digit', month: 'long', year: 'numeric' })}.</p></div>
        <label className="relative block w-full lg:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={filters.term} onChange={(event) => setFilters({ ...filters, term: event.target.value })} placeholder="Filtrar nesta página" className="h-11 w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />{filters.term && <button type="button" onClick={() => setFilters({ ...filters, term: '' })} aria-label="Limpar filtro" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}</label>
      </div>

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong className="block">Não foi possível concluir a consulta</strong><span>{error}</span></div></div>}
      {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-stone-200 bg-white"><div className="text-center"><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" /><p className="mt-3 text-sm font-semibold text-slate-600">Consultando dados oficiais...</p></div></div> : records.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => <ContractCard key={record.numeroControlePNCP} record={record} />)}</div> : <EmptyState hasQuery={queried} />}

      {!!data?.totalPaginas && !loading && <nav aria-label="Paginação" className="mt-8 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3"><span className="hidden text-sm text-slate-500 sm:block">Página <strong className="text-slate-800">{data.numeroPagina}</strong> de {new Intl.NumberFormat('pt-BR').format(data.totalPaginas)}</span><button onClick={() => search(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" />Anterior</button><button onClick={() => search(page + 1)} disabled={page >= data.totalPaginas} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-35">Próxima<ChevronRight className="h-4 w-4" /></button></nav>}
    </section>

    <footer className="border-t border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>Radar PNCP · Consulta sem persistência de dados.</span><a className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900" href="https://pncp.gov.br" target="_blank" rel="noreferrer">Fonte: Portal Nacional de Contratações Públicas <ExternalLink className="h-3 w-3" /></a></div></footer>
  </main>
}
