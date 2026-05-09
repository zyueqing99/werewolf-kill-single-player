import type { Role, Team } from "@werewolf/shared";

export function getTeam(role: Role): Team {
  return role === "werewolf" ? "werewolves" : "villagers";
}
