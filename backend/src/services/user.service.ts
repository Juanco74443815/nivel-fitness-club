import bcrypt from "bcryptjs";
import {
  createUser,
  findActiveRoleById,
  findAllUsers,
  findUserByCiForValidation,
  findUserByEmailForValidation,
  type UserRecord,
} from "../repositories/user.repository.js";
import type { CreateUserInput } from "../validators/user.validator.js";

export class UserError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export async function registerUser(
  input: CreateUserInput,
): Promise<UserRecord> {
  const role = await findActiveRoleById(input.id_rol);

  if (!role) {
    throw new UserError(
      400,
      "El rol seleccionado no existe o se encuentra inactivo",
    );
  }

  const existingEmail = await findUserByEmailForValidation(
    input.correo,
  );

  if (existingEmail) {
    throw new UserError(
      409,
      "Ya existe un usuario registrado con ese correo",
    );
  }

  const ci = input.ci?.trim() || null;

  if (ci) {
    const existingCi = await findUserByCiForValidation(ci);

    if (existingCi) {
      throw new UserError(
        409,
        "Ya existe un usuario registrado con ese CI",
      );
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return createUser({
    idRol: input.id_rol,
    nombres: input.nombres,
    apellidos: input.apellidos,
    ci,
    telefono: input.telefono?.trim() || null,
    correo: input.correo,
    passwordHash,
  });
}
export async function listUsers(): Promise<UserRecord[]> {
  return findAllUsers();
}