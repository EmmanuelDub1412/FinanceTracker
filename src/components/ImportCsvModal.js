import React, { useState, useMemo, useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { today, mergeCategories } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

// Import en masse de transactions depuis un fichier CSV.
// Colonnes reconnues (francais ou anglais, ordre libre, accents ignores) :
//   date*, description*, compte*, montant*   (obligatoires)
//   type, categorie, devise, frais, statut, beneficiaire (optionnelles)
// Le fichier exporte par l'app (bouton Exporter CSV) est directement reimportable.

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_ALIASES = {
  date: ['date'],
  description: ['description', 'desc', 'libelle', 'label'],
  category: ['categorie', 'category', 'cat'],
  account: ['compte', 'account'],
  amount: ['montant', 'amount'],
  currency: ['devise', 'currency'],
  fee: ['frais', 'fee', 'fees', 'fraisbancaires'],
  status: ['statut', 'status'],
  beneficiary: ['beneficiaire', 'beneficiary', 'beneficiairetiers', 'beneficiaryparty', 'source', 'sourcepayeur', 'tiers', 'payeur'],
  type: ['type'],
};

// Lecture CSV simple : gere les guillemets, les virgules/points-virgules
// comme separateur, et le BOM ajoute par l'export.
function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x.trim() !== '')) rows.push(row);
  return rows;
}

function parseAmount(raw) {
  let s = String(raw ?? '').replace(/[\s ]/g, '').replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  const lastC = s.lastIndexOf(','), lastD = s.lastIndexOf('.');
  if (lastC > -1 && lastD > -1) {
    // Le dernier separateur est la decimale, l'autre sert aux milliers.
    s = lastC > lastD ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastC > -1) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(raw) {
  const s = String(raw ?? '').trim();
  let y, m, d, mt;
  if ((mt = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
  else return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const STATUS_MAP = {
  confirmed: 'confirmed', confirme: 'confirmed', confirmee: 'confirmed',
  pending: 'pending', enattente: 'pending', attente: 'pending',
  cancelled: 'cancelled', canceled: 'cancelled', annule: 'cancelled', annulee: 'cancelled',
};
const TYPE_MAP = {
  income: 'income', revenu: 'income', revenus: 'income', entree: 'income', credit: 'income',
  expense: 'expense', depense: 'expense', depenses: 'expense', sortie: 'expense', debit: 'expense',
};

export default function ImportCsvModal({ accounts, categories, catLabelOf, onImport, onClose }) {
  const { t } = useLanguage();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null); // { rows: [...] } | { error }

  const allCats = useMemo(() => mergeCategories(categories), [categories]);
  const catIndex = useMemo(() => {
    const idx = {};
    allCats.forEach(c => {
      idx[norm(c.id)] = c;
      idx[norm(c.label)] = c;
      idx[norm(catLabelOf(c.id))] = c;
    });
    return idx;
  }, [allCats, catLabelOf]);
  const accIndex = useMemo(() => Object.fromEntries(accounts.map(a => [norm(a.name), a])), [accounts]);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const grid = parseCsv(String(reader.result || ''));
      if (grid.length < 2) { setParsed({ error: t('transactions.impErrEmpty') }); return; }
      const colOf = {};
      grid[0].forEach((h, i) => {
        const key = norm(h);
        Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
          if (colOf[field] === undefined && aliases.includes(key)) colOf[field] = i;
        });
      });
      const missing = ['date', 'description', 'account', 'amount'].filter(f => colOf[f] === undefined);
      if (missing.length) { setParsed({ error: t('transactions.impErrColumns') + ' ' + missing.map(f => t(`transactions.impCol_${f}`)).join(', ') }); return; }

      const get = (r, f) => (colOf[f] === undefined ? '' : String(r[colOf[f]] ?? '').trim());
      const rows = grid.slice(1).map((r, i) => {
        const errors = [], warnings = [];
        const date = parseDate(get(r, 'date'));
        if (!date) errors.push(t('transactions.impErrDate'));
        const description = get(r, 'description');
        if (!description) errors.push(t('transactions.impErrDesc'));
        const rawAmount = parseAmount(get(r, 'amount'));
        if (!Number.isFinite(rawAmount) || rawAmount === 0) errors.push(t('transactions.impErrAmount'));
        const account = accIndex[norm(get(r, 'account'))];
        if (!account) errors.push(t('transactions.impErrAccount') + ' "' + get(r, 'account') + '"');

        // Type : colonne explicite > type de la categorie > signe du montant.
        const catRaw = get(r, 'category');
        let cat = catRaw ? catIndex[norm(catRaw)] : null;
        let txType = TYPE_MAP[norm(get(r, 'type'))];
        if (!txType && cat && (cat.type === 'income' || cat.type === 'expense')) txType = cat.type;
        if (!txType) txType = rawAmount < 0 ? 'expense' : 'income';
        if (catRaw && !cat) warnings.push(t('transactions.impWarnCat'));
        if (cat && cat.type !== txType) { warnings.push(t('transactions.impWarnCatType')); cat = null; }
        const category = cat ? cat.id : (txType === 'income' ? 'REV-DIV' : 'DEP-DIV');

        const curRaw = get(r, 'currency').toUpperCase();
        if (account && curRaw && curRaw !== account.currency) errors.push(t('transactions.impErrCurrency') + ' ' + account.currency);

        const feeRaw = get(r, 'fee');
        const fee = feeRaw ? Math.abs(parseAmount(feeRaw)) : 0;
        if (feeRaw && !Number.isFinite(fee)) errors.push(t('transactions.impErrFee'));

        const status = STATUS_MAP[norm(get(r, 'status'))] || 'confirmed';
        const amount = Math.abs(rawAmount);
        const tx = errors.length ? null : {
          date, description, category, txType,
          debitAccount: txType === 'expense' ? account.id : '',
          creditAccount: txType === 'income' ? account.id : '',
          amount, currency: account.currency, fee: fee || 0, status,
          beneficiary: get(r, 'beneficiary'), notes: '',
        };
        return { line: i + 2, description, amount, errors, warnings, tx };
      });
      setParsed({ rows });
    };
    reader.readAsText(file, 'utf-8');
  };

  const downloadTemplate = () => {
    const acc = accounts[0]?.name || 'Compte';
    const csv = [
      'date,type,description,categorie,compte,montant,devise,frais,statut,beneficiaire',
      `${today()},depense,Courses,Alimentation,${acc},2500,HTG,0,confirmed,Marche`,
      `${today()},revenu,Salaire,,${acc},45000,HTG,0,confirmed,Employeur`,
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fintrack-modele-import.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rows = parsed?.rows || [];
  const valid = rows.filter(r => r.tx);
  const invalid = rows.filter(r => !r.tx);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-hd">
          <div className="modal-ttl"><Upload size={18} style={{ color: 'var(--g1)' }} /> {t('transactions.importTitle')}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('transactions.importHelp')}</div>
          <div className="flex g8" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}><Download size={13} /> {t('transactions.importTemplate')}</button>
            <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}><FileText size={13} /> {t('transactions.importChoose')}</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
            {fileName && <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>{fileName}</span>}
          </div>

          {parsed?.error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{parsed.error}</div>}

          {parsed?.rows && (
            <>
              <div className="fb" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--g1)', fontWeight: 700 }}>{valid.length} {t('transactions.importValid')}</span>
                {invalid.length > 0 && <span style={{ color: 'var(--red)', fontWeight: 700 }}>{invalid.length} {t('transactions.importInvalid')}</span>}
              </div>
              <div style={{ display: 'grid', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {rows.map(r => (
                  <div key={r.line} style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 6,
                    background: r.tx ? 'var(--bg3)' : 'var(--red-bg)',
                    border: `1px solid ${r.tx ? 'var(--border)' : 'rgba(229,62,62,.25)'}`,
                  }}>
                    <div className="fb">
                      <span><b>{t('transactions.importLine')} {r.line}</b> · {r.description || '-'}</span>
                      <span>{r.tx ? `${r.tx.txType === 'income' ? '+' : '-'}${r.amount} ${r.tx.currency}` : ''}</span>
                    </div>
                    {r.errors.length > 0 && <div style={{ color: 'var(--red)' }}>{r.errors.join(' · ')}</div>}
                    {r.warnings.length > 0 && <div style={{ color: 'var(--text3)' }}>{r.warnings.join(' · ')}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>{t('transactions.cancel')}</button>
            <button className="btn btn-primary" disabled={!valid.length}
              onClick={() => { onImport(valid.map(r => r.tx)); onClose(); }}>
              {t('transactions.importConfirm')} ({valid.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
