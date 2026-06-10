import type { Route } from "./+types/api.auth.logout";
import { destroyUserSession } from "~/lib/auth.server";
export async function action({ request }: Route.ActionArgs) { return destroyUserSession(request); }
