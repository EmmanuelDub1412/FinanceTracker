import { useEffect } from 'react';
import { toLocalISODate, today } from '../utils/finance';

// Meme logique d'echeance/alerte que dans LoansCredits.js (dupliquee ici
// volontairement pour eviter un couplage entre le hook et le composant).
function nextDueFromDay(dueDay) {
  const d = Number(dueDay) || 1;
  const now = new Date();
  let cand = new Date(now.getFullYear(), now.getMonth(), d);
  if (cand < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    cand = new Date(now.getFullYear(), now.getMonth() + 1, d);
  }
  return toLocalISODate(cand);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((d - n) / 86400000);
}

// Envoie une notification navigateur (foreground uniquement : pas de serveur
// push, donc ca ne fonctionne que quand l'app est ouverte dans un onglet/PWA)
// pour chaque pret/creance/abonnement dont l'alerte est due, au plus une fois
// par jour et par element (dedupe via localStorage).
export default function useDueDateNotifications(loans = [], settings, t) {
  useEffect(() => {
    if (!settings?.notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const day = today();
    loans.forEach(l => {
      let dueDate = l.dueDate || null;
      if (l.kind === 'loan') dueDate = nextDueFromDay(l.dueDay);
      if (l.kind === 'bond' || l.kind === 'subscription') dueDate = l.nextPaymentDate || null;
      const dLeft = dueDate ? daysUntil(dueDate) : null;
      const isSettled =
        l.kind === 'loan' ? Number(l.remainingBalance) <= 0 :
        (l.kind === 'receivable' || l.kind === 'payable') ? Number(l.amount) <= 0 :
        false;
      const alertFired = !isSettled && (l.alertEnabled === true || l.alertEnabled === 'true') && dLeft !== null && dLeft <= Number(l.alertDays || 0);
      if (!alertFired) return;

      const key = `fintrack_notified_${l.id}_${day}`;
      if (localStorage.getItem(key)) return;

      try {
        new Notification(`FinTrack — ${l.name}`, {
          body: dLeft < 0
            ? (t ? t('loansCredits.overdue') : 'Overdue')
            : `${t ? t('loansCredits.dueOn') : 'Due'} : ${dueDate}`,
          icon: 'icons/icon-192.png',
          tag: key,
        });
        localStorage.setItem(key, '1');
      } catch (e) { /* ignore (permission edge cases, unsupported contexts) */ }
    });
  }, [loans, settings, t]);
}
