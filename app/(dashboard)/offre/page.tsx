import { redirect } from "next/navigation";

export default function OffreRedirect() {
  redirect("/ressources?tab=offres");
}
