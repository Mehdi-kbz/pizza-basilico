import { getMenuData } from "@/lib/menu-data";
import { CarteClient } from "./CarteClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "La carte — Pizza Basilico",
  description: "Pizzas base tomate et base crème, Panuozzo, spécialités, boissons et desserts maison.",
};

export default async function CartePage() {
  const { categories, supplements, orderHref } = await getMenuData();

  return (
    <main className="pt-10 md:pt-14">
      <h1 className="display text-[clamp(2.4rem,7vw,4.2rem)] text-center mb-8 px-5">La carte</h1>
      <CarteClient categories={categories} supplements={supplements} orderHref={orderHref} />
    </main>
  );
}
