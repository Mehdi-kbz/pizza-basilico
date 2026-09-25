/**
 * Moyens de paiement acceptés + mention de sécurité (pied de page).
 * Marques dessinées en SVG/texte stylisés — à remplacer par les visuels officiels si souhaité.
 */

const pill =
  "inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-2.5 shadow-[0_1px_2px_rgba(160,72,30,0.08)]";

function Visa() {
  return (
    <span className={pill} title="Visa" role="img" aria-label="Visa">
      <span className="text-[0.95rem] font-black italic tracking-tight text-[#1a1f71]">VISA</span>
    </span>
  );
}
function Mastercard() {
  return (
    <span className={pill} title="Mastercard" role="img" aria-label="Mastercard">
      <svg viewBox="0 0 36 22" className="h-[18px] w-auto" aria-hidden="true">
        <circle cx="13" cy="11" r="9" fill="#eb001b" />
        <circle cx="23" cy="11" r="9" fill="#f79e1b" />
        <path d="M18 3.9a9 9 0 0 1 0 14.2 9 9 0 0 1 0-14.2z" fill="#ff5f00" />
      </svg>
    </span>
  );
}
function CB() {
  return (
    <span className={pill} title="Carte Bancaire" role="img" aria-label="Carte Bancaire">
      <span className="rounded-[4px] bg-[#0b3a82] px-1.5 py-[1px] text-[0.72rem] font-extrabold tracking-wide text-white">CB</span>
    </span>
  );
}
function ApplePay() {
  return (
    <span className={`${pill} !border-black !bg-black`} title="Apple Pay" role="img" aria-label="Apple Pay">
      <span className="text-[0.78rem] font-semibold tracking-tight text-white">Apple Pay</span>
    </span>
  );
}
function GooglePay() {
  return (
    <span className={pill} title="Google Pay" role="img" aria-label="Google Pay">
      <span className="text-[0.78rem] font-semibold tracking-tight text-[#3c4043]">
        <span className="text-[#4285f4]">G</span> Pay
      </span>
    </span>
  );
}
function Cash() {
  return (
    <span className={pill} title="Espèces" role="img" aria-label="Espèces">
      <svg viewBox="0 0 28 18" className="h-[16px] w-auto" aria-hidden="true">
        <rect x="1" y="2" width="26" height="14" rx="2.5" fill="#dff3e4" stroke="#2f8a4a" strokeWidth="1.4" />
        <circle cx="14" cy="9" r="3.2" fill="none" stroke="#2f8a4a" strokeWidth="1.4" />
        <circle cx="5" cy="9" r="1" fill="#2f8a4a" />
        <circle cx="23" cy="9" r="1" fill="#2f8a4a" />
      </svg>
      <span className="ml-1.5 text-[0.72rem] font-bold text-[#2f8a4a]">Espèces</span>
    </span>
  );
}
function Ticket({ label, color, bg = "#fff" }: { label: string; color: string; bg?: string }) {
  return (
    <span className={pill} style={{ background: bg }} title={label} role="img" aria-label={label}>
      <span className="text-[0.72rem] font-extrabold tracking-tight whitespace-nowrap" style={{ color }}>
        {label}
      </span>
    </span>
  );
}

export function PaymentBadges() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div>
          <p className="eyebrow mb-2.5">Paiement en ligne</p>
          <div className="flex flex-wrap gap-2">
            <Visa />
            <Mastercard />
            <CB />
            <ApplePay />
            <GooglePay />
          </div>
        </div>

        <div>
          <p className="eyebrow mb-2.5">Au camion</p>
          <div className="flex flex-wrap gap-2">
            <Cash />
            <Ticket label="Ticket Restaurant" color="#d9251d" />
            <Ticket label="Swile" color="#1d1d1b" />
            <Ticket label="Pluxee" color="#0a3a9c" />
            <Ticket label="Chèque Déjeuner" color="#e6007e" />
            <Ticket label="Apetiz" color="#2c8a3d" />
          </div>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-fg-dim">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-basil" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l7.5 3v5.5c0 4.5-3.100 8.200-7.500 9.500-4.400-1.300-7.500-5-7.500-9.500V6L12 3z" />
          <path d="M8.800 12.200l2.300 2.300 4.200-4.600" />
        </svg>
        <span>
          <strong className="text-fg">Paiement 100 % sécurisé</strong> · cryptage SSL · 3D Secure · aucune donnée de carte
          conservée sur nos serveurs
        </span>
      </p>
    </div>
  );
}
