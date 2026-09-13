import { Calculator } from "lucide-react";
import { lazy } from "react";
export const apps = [
  {
    id: "renewal",
    icon: Calculator,
    name: "Renewal Calculator",
    category: "Insurance",
    description: "Compare premiums. Simplify renewals.",
    component: lazy(() => import("../apps/renewal/Renewal")),
  },
];
