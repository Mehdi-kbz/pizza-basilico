import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isEffectivelyAvailable } from "@/lib/menu-availability";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { NewsletterForm } from "./NewsletterForm";

export const dynamic = "force-dynamic";

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function formatDay(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);
}
function formatHour(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function HomePage() {
  const now = new Date();

  const [sessions, allItems] = await Promise.all([
    prisma.serviceSession.findMany({
      where: { endAt: { gt: now } },
      orderBy: { startAt: "asc" },
      take: 4,
      include: { location: true },
    }),
    prisma.menuItem.findMany({
      include: { sizes: true, ingredients: { include: { ingredient: true } }, category: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const available = allItems.filter(isEffectivelyAvailable);
  const signatures = available.filter((i) => i.isSpecialty || i.isNew).slice(0, 3);
  const classiques = available
    .filter((i) => ["Margherita", "Capricciosa", "Quatre fromages"].includes(i.name))
    .slice(0, 3);
  const featured = [...signatures, ...classiques].slice(0, 6);

  const openSession = sessions.find((s) => s.isOrderingOpen);
  const orderHref = openSession ? `/commander/${openSession.id}` : "/carte";

  return (
    <main>
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="mx-auto max-w-6xl px-3 sm:px-5 pt-4">
        <div className="panel-peach relative overflow-hidden px-6 sm:px-10 lg:px-14 py-12 md:py-16">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
            <div className="relative z-10">
              <p className="eyebrow rise">Food truck · Pizzas artisanales</p>

              <h1 className="display text-[clamp(2.8rem,7.4vw,5rem)] mt-4 rise rise-1">
                Le feu de bois
                <br />
                <span className="italic text-ember">change tout.</span>
              </h1>

              <p className="lede mt-6 rise rise-2">
                Pâte travaillée à la main, cuisson vive au four à bois, service à la commande. Vous
                commandez à l&rsquo;avance, vous arrivez, c&rsquo;est prêt — plus de file d&rsquo;attente devant le camion.
              </p>

              <div className="flex flex-wrap gap-3 mt-8 rise rise-3">
                <Link href={orderHref} className="btn btn-primary">
                  {openSession ? "Commander maintenant" : "Découvrir la carte"}
                </Link>
                <Link href="/carte" className="btn btn-ghost">
                  Voir la carte
                </Link>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-9 rise rise-4">
                <span className="chip chip-brass">Championnats internationaux</span>
                <span className="chip chip-basil">Pâte maison</span>
                <span className="chip">Retrait sans attente</span>
              </div>
            </div>

            <div className="relative grid place-items-center">
              <div className="relative w-full max-w-[460px] aspect-square">
                <PizzaPhoto
                  name="hero"
                  src="/pizzas/hero.webp"
                  className="float absolute inset-0 w-full h-full !object-contain drop-shadow-[0_40px_40px_rgba(120,50,20,0.35)]"
                />
              </div>

              {openSession && (
                <Link
                  href={`/commander/${openSession.id}`}
                  className="absolute left-0 sm:left-4 bottom-2 flex items-center gap-3 rounded-full bg-white/90 backdrop-blur pl-3 pr-5 py-2.5 shadow-[0_18px_36px_-18px_rgba(160,72,30,0.55)] hover:-translate-y-0.5 transition-transform"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-full bg-basil/15 text-basil">●</span>
                  <span className="text-left leading-tight">
                    <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-basil">Ouvert</span>
                    <span className="block text-sm text-fg">{openSession.location.label}</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- CRÉNEAUX / USP -------------------------- */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="eyebrow">Comment ça marche</p>
            <h2 className="display text-[clamp(1.9rem,4.4vw,2.9rem)] mt-3 max-w-[22ch]">
              Un créneau réel, pas une estimation optimiste.
            </h2>
          </div>
          <p className="text-sm text-fg-dim max-w-sm leading-relaxed">
            Le four a une capacité limitée. Quand un créneau est plein, le site ne vous promet pas
            « tout de suite » : il vous donne l&rsquo;heure à laquelle votre pizza sortira vraiment du four.
          </p>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Vous composez",
              text: "La carte complète, les suppléments, et uniquement ce qui est réellement disponible ce soir.",
            },
            {
              n: "02",
              title: "Vous réservez le créneau",
              text: "Le système calcule la prochaine fenêtre de cuisson qui a encore de la place, et vous la réserve.",
            },
            {
              n: "03",
              title: "Vous retirez",
              text: "Notification dès que c'est prêt. Vous donnez votre nom au comptoir, et c'est tout.",
            },
          ].map((step) => (
            <li key={step.n} className="card p-7 relative overflow-hidden transition-transform duration-500 hover:-translate-y-1">
              <span className="grid place-items-center h-11 w-11 rounded-full bg-surface-2 display text-lg text-ember">{step.n}</span>
              <h3 className="display text-xl mt-4 text-fg">{step.title}</h3>
              <p className="text-sm text-fg-dim mt-2.5 leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------ LA CARTE ----------------------------- */}
      <section className="relative py-16 md:py-20 bg-white/45">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
            <div>
              <p className="eyebrow">Nos pizzas</p>
              <h2 className="display text-[clamp(1.9rem,4.4vw,2.9rem)] mt-3">Quelques signatures</h2>
            </div>
            <Link href="/carte" className="btn btn-ghost !py-2.5 !px-5 !text-[0.85rem]">
              Toute la carte →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-fg-dim">La carte arrive très bientôt.</p>
          ) : (
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => {
                const min = Math.min(...item.sizes.map((s) => s.priceCents));
                const multi = item.sizes.length > 1;
                return (
                  <article
                    key={item.id}
                    className="card arch !rounded-b-[28px] px-6 pb-6 pt-8 flex flex-col items-center text-center gap-3 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
                  >
                    <PizzaPhoto name={item.name} className="pizza-ring h-40 w-40" />

                    <h3 className="display text-[1.35rem] text-fg leading-tight mt-4">{item.name}</h3>

                    <p className="text-[0.85rem] text-fg-dim leading-relaxed flex-1">
                      {item.ingredients
                        .slice(0, 6)
                        .map((l) => l.ingredient.name)
                        .join(" · ")}
                    </p>

                    <div className="flex flex-wrap justify-center gap-1.5">
                      {item.isSpecialty && <span className="chip chip-brass">Spécialité</span>}
                      {item.isNew && <span className="chip chip-flame">Nouveau</span>}
                      {item.isVegetarian && <span className="chip chip-basil">Végétarien</span>}
                      {item.isSpicy && <span className="chip chip-flame">Épicé</span>}
                    </div>

                    <p className="tnum text-ember font-bold text-lg">
                      {multi ? "dès " : ""}
                      {eur(min)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------- NOTRE HISTOIRE -------------------------- */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="panel-peach relative aspect-[4/3] overflow-hidden">
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div>
                <p className="display text-[clamp(3.4rem,10vw,6rem)] text-ember leading-none">90s</p>
                <p className="text-sm text-fg-dim mt-3 max-w-[26ch] mx-auto leading-relaxed">
                  Le temps d&rsquo;une cuisson au feu de bois. C&rsquo;est là que tout se joue.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow">Notre histoire</p>
            <h2 className="display text-[clamp(1.9rem,4.4vw,2.9rem)] mt-3 max-w-[24ch]">
              Une obsession pour la pâte et la braise.
            </h2>
            <p className="lede mt-5">
              Derrière Pizza Basilico, un pizzaïolo qui a défendu son travail dans plusieurs
              championnats internationaux de pizza. Même farine, même four, même exigence — que ce
              soit en compétition ou sur la place du village.
            </p>
            <Link href="/notre-histoire" className="btn btn-ghost mt-7">
              Lire l&rsquo;histoire
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------- NOUS TROUVER --------------------------- */}
      <section id="nous-trouver" className="relative py-16 md:py-20 bg-white/45 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className="eyebrow">Nous trouver</p>
          <h2 className="display text-[clamp(1.9rem,4.4vw,2.9rem)] mt-3 mb-9">Le camion cette semaine</h2>

          {sessions.length === 0 ? (
            <div className="card p-8 max-w-2xl">
              <p className="display text-2xl text-fg">Pas de service programmé pour l&rsquo;instant.</p>
              <p className="text-fg-dim mt-3 leading-relaxed">
                Nos emplacements changent au fil de la semaine. Le prochain est annoncé sur Instagram —
                ou laissez-nous votre e-mail plus bas, on vous prévient.
              </p>
              <a
                href="https://instagram.com/pizzabasilico2020"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost mt-6"
              >
                Suivre sur Instagram
              </a>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sessions.map((s) => (
                <div key={s.id} className="card p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="display text-xl text-fg capitalize">{formatDay(s.startAt)}</p>
                      <p className="tnum text-sm text-ember mt-1">
                        {formatHour(s.startAt)} – {formatHour(s.endAt)}
                      </p>
                      <p className="text-sm text-fg-dim mt-2.5">{s.location.label}</p>
                      <p className="text-xs text-fg-faint">{s.location.address}</p>
                    </div>
                    <span className={`chip ${s.isOrderingOpen ? "chip-basil" : ""}`}>
                      {s.isOrderingOpen ? "Commandes ouvertes" : "Commandes fermées"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {s.isOrderingOpen && (
                      <Link href={`/commander/${s.id}`} className="btn btn-primary !py-2.5 !px-5 !text-[0.85rem]">
                        Commander
                      </Link>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.location.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost !py-2.5 !px-5 !text-[0.85rem]"
                    >
                      Itinéraire
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------- NEWSLETTER ---------------------------- */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16 md:py-20">
        <div className="panel-peach p-8 md:p-14 relative overflow-hidden">
          <div className="relative max-w-xl">
            <p className="eyebrow">Ne rien manquer</p>
            <h2 className="display text-[clamp(1.7rem,4vw,2.5rem)] mt-3">
              On vous dit où l&rsquo;on s&rsquo;installe.
            </h2>
            <p className="text-fg-dim mt-3 text-sm leading-relaxed">
              Les prochains emplacements et les nouveautés de la carte, sans spam. Désinscription en un clic.
            </p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-10 text-sm text-fg-faint">
          <Link href="/suivi" className="hover:text-fg-dim transition-colors">
            Suivre une commande en cours
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/traiteur" className="hover:text-fg-dim transition-colors">
            Privatiser le camion
          </Link>
        </div>
      </section>
    </main>
  );
}
