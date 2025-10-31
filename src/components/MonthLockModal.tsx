'use client';
import { useEffect, useMemo, useState } from 'react';

export type MonthLockMap = Record<number, boolean>;

export type MonthLockItem = {
  /** ISO yyyy-MM-01 */
  competencia: string;
  /** true = bloqueado, false = desbloqueado */
  bloqueado: boolean;
};

export interface MonthLockModalProps {
  initialYear?: number;
  initialLockMap?: MonthLockMap;
  loadYear?: (year: number) => Promise<MonthLockMap> | MonthLockMap;
  onSave?: (items: MonthLockItem[]) => void;
  onClose: () => void;
  labels?: {
    title?: string;
    year?: string;
    blocked?: string;
    unblocked?: string;
    save?: string;
    close?: string;
    confirmTitle?: string;
    confirmDesc?: string;
    confirmYes?: string;
    confirmNo?: string;
    noneChanged?: string;
    monthNames?: string[];
  };
}

function createAllBlocked(): MonthLockMap {
  return Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, true])) as MonthLockMap;
}

function diffMaps(original: MonthLockMap, current: MonthLockMap) {
  const blocked: number[] = [];
  const unblocked: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const before = !!original[m];
    const now = !!current[m];
    if (before !== now) {
      if (now) blocked.push(m);
      else unblocked.push(m);
    }
  }
  return { blocked, unblocked };
}

function formatMonths(months: number[], year: number) {
  return months.map((m) => `${String(m).padStart(2, '0')}/${year}`).join(', ');
}

export function MonthLockModal({
  initialYear,
  initialLockMap,
  loadYear,
  onSave,
  onClose,
  labels,
}: MonthLockModalProps) {
  const L = {
    title: labels?.title ?? 'Bloquear e Desbloquear Competências Múltiplas',
    year: labels?.year ?? 'Ano',
    blocked: labels?.blocked ?? 'Bloqueado',
    unblocked: labels?.unblocked ?? 'Desbloqueado',
    save: labels?.save ?? 'Salvar',
    close: labels?.close ?? 'Fechar',
    confirmTitle: labels?.confirmTitle ?? 'Confirmar alterações',
    confirmDesc: labels?.confirmDesc ?? 'Você confirma a alteração dos períodos selecionados?',
    confirmYes: labels?.confirmYes ?? 'Confirmar',
    confirmNo: labels?.confirmNo ?? 'Cancelar',
    noneChanged: labels?.noneChanged ?? 'Nenhuma alteração realizada.',
    monthNames:
      labels?.monthNames ?? [
        'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
      ],
  };

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(initialYear ?? currentYear);
  const [lockMap, setLockMap] = useState<MonthLockMap>(initialLockMap ?? createAllBlocked());
  const [originalMap, setOriginalMap] = useState<MonthLockMap>(initialLockMap ?? createAllBlocked());
  const [loading, setLoading] = useState(false);

  // animação de abertura
  const [show, setShow] = useState(false);

  // confirmação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<{ blocked: number[]; unblocked: number[] } | null>(null);
  const [confirmShow, setConfirmShow] = useState(false);

  // toasts simples
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const pushToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - 2 + i),
    [currentYear]
  );

  useEffect(() => { setShow(true); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!loadYear) {
        const next = initialLockMap ?? createAllBlocked();
        setLockMap(next);
        setOriginalMap(next);
        return;
      }
      setLoading(true);
      try {
        const data = await loadYear(year);
        if (mounted && data) {
          setLockMap(data);
          setOriginalMap(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [year, loadYear, initialLockMap]);

  const toggle = (m: number) => setLockMap((p) => ({ ...p, [m]: !p[m] }));

  const handleSaveClick = () => {
    const d = diffMaps(originalMap, lockMap);
    if (d.blocked.length === 0 && d.unblocked.length === 0) {
      pushToast(L.noneChanged);
      closeWithFade();
      return;
    }
    setPendingDiff(d);
    setConfirmOpen(true);
    requestAnimationFrame(() => setConfirmShow(true));
  };

  const reallySave = () => {
    if (!pendingDiff) return;
    const items: MonthLockItem[] = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return { competencia: `${year}-${month}-01`, bloqueado: !!lockMap[i + 1] };
    });

    onSave?.(items);

    if (pendingDiff.unblocked.length > 0) {
      pushToast(`Períodos desbloqueados: ${formatMonths(pendingDiff.unblocked, year)}`);
    }
    if (pendingDiff.blocked.length > 0) {
      pushToast(`Períodos bloqueados: ${formatMonths(pendingDiff.blocked, year)}`);
    }

    setOriginalMap(lockMap);
    setPendingDiff(null);
    setConfirmShow(false);
    setTimeout(() => {
      setConfirmOpen(false);
      closeWithFade();
    }, 700);
  };

  const closeWithFade = () => {
    setShow(false);
    setTimeout(() => onClose(), 700);
  };

  return (
    <>
      {/* Modal principal */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
          'transition-opacity duration-[700ms]',
          show ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div
          className={[
            'w-full max-w-3xl rounded-2xl bg-white shadow-xl',
            'transition-all duration-[700ms] transform',
            show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{L.title}</h2>
            <button
              className="rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              onClick={closeWithFade}
              aria-label={L.close}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{L.year}</span>
              <select
                className="rounded-md border px-2 py-1 transition-colors"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={loading}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {L.monthNames.map((name, idx) => {
                const m = idx + 1;
                const isBlocked = !!lockMap[m];
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggle(m)}
                    aria-pressed={isBlocked}
                    disabled={loading}
                    title={`${name} ${year} — ${isBlocked ? L.blocked : L.unblocked}`}
                    className={[
                      'flex flex-col justify-between rounded-xl border p-3 text-left shadow-sm',
                      'transition-all duration-[700ms] ease-out active:scale-[.98]',
                      'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isBlocked
                        ? 'border-red-300 bg-red-50 focus:ring-red-300'
                        : 'border-emerald-300 bg-emerald-50 focus:ring-emerald-300',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold transition-colors duration-[700ms]">{name}</span>
                        <span className="text-xs text-gray-500 transition-colors duration-[700ms]">
                          {String(m).padStart(2, '0')}/{year}
                        </span>
                      </div>
                      {/* Ícone sem rotação (corrigido) com fade suave */}
                      <span
                        aria-hidden
                        className={[
                          'shrink-0 text-base',
                          'transition-opacity duration-[700ms]',
                          isBlocked ? 'text-red-500 opacity-100' : 'text-emerald-600 opacity-100',
                        ].join(' ')}
                      >
                        {isBlocked ? '🔒' : '🔓'}
                      </span>
                    </div>

                    <div
                      className={[
                        'mt-2 text-[11px] font-medium transition-colors duration-[700ms]',
                        isBlocked ? 'text-red-600' : 'text-emerald-700',
                      ].join(' ')}
                    >
                      {isBlocked ? L.blocked : L.unblocked}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t p-4">
            <button
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              onClick={closeWithFade}
              disabled={loading}
            >
              {L.close}
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              onClick={handleSaveClick}
              disabled={loading}
            >
              {loading ? '...' : L.save}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmOpen && (
        <div
          className={[
            'fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4',
            'transition-opacity duration-[700ms]',
            confirmShow ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <div
            className={[
              'w-full max-w-lg rounded-2xl bg-white shadow-xl',
              'transition-all duration-[700ms] transform',
              confirmShow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
            ].join(' ')}
          >
            <div className="border-b p-4">
              <h3 className="text-base font-semibold">{L.confirmTitle}</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p>{L.confirmDesc}</p>

              {pendingDiff && (
                <div className="space-y-2">
                  {pendingDiff.unblocked.length > 0 && (
                    <div>
                      <div className="font-medium text-emerald-700">Serão desbloqueados:</div>
                      <div className="text-gray-700">{formatMonths(pendingDiff.unblocked, year)}</div>
                    </div>
                  )}
                  {pendingDiff.blocked.length > 0 && (
                    <div>
                      <div className="font-medium text-red-700">Serão bloqueados:</div>
                      <div className="text-gray-700">{formatMonths(pendingDiff.blocked, year)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t p-4">
              <button
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                onClick={() => {
                  setConfirmShow(false);
                  setTimeout(() => {
                    setConfirmOpen(false);
                    setPendingDiff(null);
                  }, 700);
                }}
              >
                {L.confirmNo}
              </button>
              <button
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                onClick={reallySave}
              >
                {L.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex max-w-md flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-lg transition-all duration-[700ms]"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
