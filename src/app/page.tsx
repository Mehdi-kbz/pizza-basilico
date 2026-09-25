import Link from "next/link";
import { getMenuData } from "@/lib/menu-data";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { CarteClient } from "./carte/CarteClient";
import { LoyaltySection } from "@/components/LoyaltySection";
import { ReviewsBadge } from "@/components/ReviewsBadge";
import { NewsletterForm } from "./NewsletterForm";

export const dynamic = "force-dynamic";

const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default async function HomePage() {
  const { categories, supplements, sessions, orderHref, hasOpenSession } = await getMenuData();

  return (
    <main>
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="mx-auto max-w-6xl px-3 sm:px-5 pt-4">
        <div className="panel-peach relative overflow-hidden px-6 sm:px-10 lg:px-14 py-10 md:py-14">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
            <div className="relative z-10">
              <h1 className="display text-[clamp(2.6rem,7vw,4.6rem)] rise">
                Pizzas au <span className="italic text-ember">feu de bois.</span>
              </h1>
              <p className="lede mt-4 rise rise-1">Commandez, choisissez votre créneau, retirez au camion.</p>

              {/* Emplacement de la semaine */}
              <div id="nous-trouver" className="mt-7 flex flex-col gap-2.5 scroll-mt-28 rise rise-2">
                {sessions.length === 0 ? (
                  <a
                    href="https://instagram.com/pizzabasilico2020"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 self-start rounded-full bg-white/80 backdrop-blur pl-4 pr-5 py-3 text-sm shadow-[0_14px_30px_-18px_rgba(160,72,30,0.6)]"
                  >
                    <span aria-hidden="true">📍</span>
                    <span>
                      Prochain emplacement bientôt — <span className="font-semibold text-ember">suivez-nous</span>
                    </span>
                  </a>
                ) : (
                  sessions.slice(0, 3).map((s) => (
                    <a
                      key={s.id}
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.location.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-3 self-start rounded-full bg-white/85 backdrop-blur pl-2.5 pr-5 py-2.5 shadow-[0_14px_30px_-18px_rgba(160,72,30,0.6)] hover:-translate-y-0.5 transition-transform"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-flame to-flame-deep text-white" aria-hidden="true">
                        📍
                      </span>
                      <span className="leading-tight text-left">
                        <span className="block text-sm font-semibold text-fg">{s.location.label}</span>
                        <span className="block text-[0.78rem] text-fg-dim capitalize tnum">
                          {day.format(s.startAt)} · {hour.format(s.startAt)}–{hour.format(s.endAt)}
                        </span>
                      </span>
                    </a>
                  ))
                )}
              </div>

              <div className="mt-8 rise rise-3">
                <a href="#pizzas" className="btn btn-primary !px-8 !py-4 !text-base">
                  {hasOpenSession ? "Commander" : "Voir les pizzas"} <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>

            <div className="relative grid place-items-center">
              <div className="relative w-full max-w-[440px] aspect-square">
                <PizzaPhoto
                  name="hero"
                  src="/pizzas/hero.webp"
                  className="float absolute inset-0 w-full h-full !object-contain drop-shadow-[0_40px_40px_rgba(120,50,20,0.35)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- PIZZAS ------------------------------ */}
      <section id="pizzas" className="scroll-mt-20 pt-16 md:pt-20">
        <h2 className="display text-[clamp(1.9rem,4.4vw,2.9rem)] text-center mb-8 px-5">Nos pizzas</h2>
        <CarteClient categories={categories} supplements={supplements} orderHref={orderHref} showExtras={false} />
      </section>

      {/* ------------------------------ FIDÉLITÉ ----------------------------- */}
      <LoyaltySection />

      {/* ------------------------------ AVIS GOOGLE -------------------------- */}
      <ReviewsBadge />

      {/* ------------------------------ PIED DE PAGE ------------------------- */}
      <section className="mx-auto max-w-6xl px-3 sm:px-5 pt-8 pb-4">
        <div className="panel-peach px-6 sm:px-10 py-8 md:py-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="display text-2xl md:text-3xl">On vous dit où l&rsquo;on s&rsquo;installe.</h2>
          </div>
          <div className="w-full md:w-auto md:min-w-[380px]">
            <NewsletterForm />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mt-6 text-sm text-fg-faint">
          <Link href="/notre-histoire" className="hover:text-fg-dim transition-colors">Notre histoire</Link>
          <span aria-hidden="true">·</span>
          <Link href="/suivi" className="hover:text-fg-dim transition-colors">Suivre une commande</Link>
          <span aria-hidden="true">·</span>
          <Link href="/traiteur" className="hover:text-fg-dim transition-colors">Privatiser le camion</Link>
          <span aria-hidden="true">·</span>
          <Link href="/recrutement" className="hover:text-fg-dim transition-colors">Rejoignez-nous</Link>
        </div>
      </section>
    </main>
  );
}
