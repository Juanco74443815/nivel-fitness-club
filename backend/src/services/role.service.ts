import {
  findAllRoles,
  type Role,
} from "../repositories/role.repository.js";

export async function listRoles(): Promise<Role[]> {
  return findAllRoles();
}