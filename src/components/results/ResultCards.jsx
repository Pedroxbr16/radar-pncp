import { ArrowUpRight, Building2, FileSearch, MapPin } from 'lucide-react'
import {
  ataSituation,
  formatDate,
  formatMoney,
  matchingTagsCount,
  pncpAtaUrl,
  pncpUrl,
  remainingDays,
} from '../../lib/records'

function StatusPill({ record }) {
  const days = remainingDays(record.dataEncerramentoProposta)
  if (days !== null && days >= 0) {
    return <span className="govbr-card-pill govbr-card-pill-open inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Propostas abertas</span>
  }
  return <span className="govbr-card-pill govbr-card-pill-neutral inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{record.situacaoCompraNome || 'Publicada'}</span>
}

function AtaStatusPill({ record }) {
  const situation = ataSituation(record)
  if (situation === 'cancelada') return <span className="govbr-card-pill govbr-card-pill-cancelled inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Cancelada</span>
  if (situation === 'future') return <span className="govbr-card-pill govbr-card-pill-future inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Vigência futura</span>
  if (situation === 'vigente') return <span className="govbr-card-pill govbr-card-pill-current inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Vigente</span>
  if (situation === 'unknown') return <span className="govbr-card-pill govbr-card-pill-warning inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Vigência não informada</span>
  return <span className="govbr-card-pill govbr-card-pill-neutral inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Não vigente</span>
}

function AdhesionPill({ possibility }) {
  if (possibility === true) return <span className="govbr-card-pill govbr-adhesion-yes rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">Permite adesão</span>
  if (possibility === false) return <span className="govbr-card-pill govbr-adhesion-no rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">Não permite adesão</span>
  return <span className="govbr-card-pill govbr-adhesion-unknown rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">Adesão não informada</span>
}

export function ContractCard({ record }) {
  const days = remainingDays(record.dataEncerramentoProposta)
  return (
    <article className="govbr-card group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(20,34,30,.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(20,34,30,.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <StatusPill record={record} />
        {record.srp && <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">SRP</span>}
      </div>
      <h3 className="line-clamp-3 text-[15px] font-bold leading-6 text-slate-900">{record.objetoCompra || 'Objeto não informado'}</h3>
      <div className="mt-4 flex items-start gap-2.5 text-sm text-slate-600"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="line-clamp-2">{record.orgaoEntidade?.razaoSocial || 'Órgão não informado'}</span></div>
      <div className="mt-2 flex items-center gap-2.5 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0 text-slate-400" /><span>{record.unidadeOrgao?.municipioNome || 'Localidade não informada'}{record.unidadeOrgao?.ufSigla ? ` · ${record.unidadeOrgao.ufSigla}` : ''}</span></div>
      <div className="my-5 grid grid-cols-2 gap-3 border-y border-stone-100 py-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimado</p><p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(record.valorTotalEstimado)}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Encerramento</p><p className={`mt-1 text-sm font-bold ${days !== null && days >= 0 && days <= 3 ? 'text-amber-700' : 'text-slate-800'}`}>{days !== null && days >= 0 ? `${days === 0 ? 'Hoje' : `${days} dia${days === 1 ? '' : 's'}`}` : formatDate(record.dataEncerramentoProposta, { day: '2-digit', month: 'short' })}</p></div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-medium text-slate-500">{record.modalidadeNome || 'Contratação pública'}</span><a href={pncpUrl(record)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition group-hover:text-emerald-800">Ver no PNCP <ArrowUpRight className="h-4 w-4" /></a></div>
    </article>
  )
}

export function AtaCard({ record, tags }) {
  const days = remainingDays(record.vigenciaFim)
  const matches = matchingTagsCount(record, 'atas', tags)
  return (
    <article className="govbr-card group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(20,34,30,.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(20,34,30,.08)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><AtaStatusPill record={record} /><AdhesionPill possibility={record.possibilidadeAdesao} /></div>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Ata nº {record.numeroAtaRegistroPreco || 'Não informado'}{record.anoAta ? `/${record.anoAta}` : ''}</p>
      <p className="mt-1 break-all text-[11px] font-semibold text-slate-400">ID PNCP: {record.numeroControlePNCPAta || 'Não informado'}</p>
      <h3 className="mt-2 line-clamp-3 text-[15px] font-bold leading-6 text-slate-900">{record.objetoContratacao || 'Objeto não informado'}</h3>
      <div className="mt-4 flex items-start gap-2.5 text-sm text-slate-600"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="line-clamp-2">{record.nomeOrgao || 'Órgão não informado'}</span></div>
      <div className="mt-2 flex items-center gap-2.5 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0 text-slate-400" /><span className="line-clamp-1">{record.nomeUnidadeOrgao || 'Unidade não informada'}</span></div>
      <div className="my-5 grid grid-cols-2 gap-3 border-y border-stone-100 py-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Início da vigência</p><p className="mt-1 text-sm font-bold text-slate-800">{formatDate(record.vigenciaInicio, { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Fim da vigência</p><p className={`mt-1 text-sm font-bold ${days !== null && days >= 0 && days <= 30 ? 'text-amber-700' : 'text-slate-800'}`}>{formatDate(record.vigenciaFim, { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
      </div>
      <details className="mb-4 rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-bold text-emerald-800 marker:text-emerald-700">Ver dados da ata</summary>
        <dl className="mt-3 grid gap-3 border-t border-stone-200 pt-3 text-xs sm:grid-cols-2">
          <div><dt className="font-semibold uppercase tracking-wide text-slate-400">ID da contratação</dt><dd className="mt-1 break-all font-medium text-slate-700">{record.numeroControlePNCPCompra || 'Não informado'}</dd></div>
          <div><dt className="font-semibold uppercase tracking-wide text-slate-400">Publicação no PNCP</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(record.dataPublicacaoPncp)}</dd></div>
          <div><dt className="font-semibold uppercase tracking-wide text-slate-400">Última atualização</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(record.dataAtualizacaoGlobal || record.dataAtualizacao)}</dd></div>
          <div><dt className="font-semibold uppercase tracking-wide text-slate-400">Órgão sub-rogado</dt><dd className="mt-1 font-medium text-slate-700">{record.nomeOrgaoSubrogado || 'Não informado'}</dd></div>
        </dl>
      </details>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-words text-xs font-medium text-slate-500">{tags.length ? `${matches} correspondência${matches === 1 ? '' : 's'} · ` : ''}{record.usuario || 'Ata de registro de preços'}</span><a href={pncpAtaUrl(record)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition group-hover:text-emerald-800">Ver no PNCP <ArrowUpRight className="h-4 w-4" /></a></div>
    </article>
  )
}

export function EmptyState({ hasQuery, catalog }) {
  const noun = catalog === 'atas' ? 'ata' : 'contratação'
  return <div className="govbr-card rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><FileSearch className="mx-auto h-10 w-10 text-emerald-700" /><h2 className="mt-4 text-lg font-bold text-slate-900">{hasQuery ? `Nenhuma ${noun} encontrada` : 'Comece uma consulta'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{hasQuery ? 'Ajuste os filtros ou tente um período diferente.' : 'Selecione o período para consultar os dados públicos do PNCP.'}</p></div>
}
