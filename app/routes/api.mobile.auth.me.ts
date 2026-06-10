import type { Route } from "./+types/api.mobile.auth.me";
import { data } from "react-router";
import { requireMobileUser } from "~/lib/mobile-auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireMobileUser(request);
  if (!user) {
    return data({ message: "Unauthorized" }, { status: 401 });
  }

  return data({ user });
}
