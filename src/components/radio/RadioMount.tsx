import { headers } from "next/headers";
import { RadioDock } from "./RadioDock";
import { RadioProvider } from "./RadioProvider";
import {
  radioDockEnabled,
  radioModuleEnabled,
  radioStations,
} from "@/lib/radio/config";

/**
 * Single audio graph for /radio page + floating dock.
 * No-op when the radio feature is off / foundation Offline / admin routes.
 */
export async function RadioMount({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") || "";
  if (pathname.startsWith("/admin")) return <>{children}</>;
  if (!radioModuleEnabled()) return <>{children}</>;

  const stations = radioStations();
  if (!stations.length) return <>{children}</>;

  return (
    <RadioProvider stations={stations}>
      {children}
      {radioDockEnabled() ? <RadioDock /> : null}
    </RadioProvider>
  );
}
