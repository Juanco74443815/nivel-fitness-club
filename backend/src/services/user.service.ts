import bcrypt from "bcryptjs";
import {
  createUser,
  findActiveRoleById,
  findAllUsers,
  findUserByCiExcludingId,
  findUserByCiForValidation,
  findUserByEmailExcludingId,
  findUserByEmailForValidation,
  findUserById,
  updateUserById,
  type UserRecord,
} from "../repositories/user.repository.js";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

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

export async function updateUser(
  idUsuario: number,
  input: UpdateUserInput,
): Promise<UserRecord> {
  const currentUser = await findUserById(idUsuario);

  if (!currentUser) {
    throw new UserError(
      404,
      "El usuario seleccionado no existe",
    );
  }

  const nombres = input.nombres ?? currentUser.nombres;
  const apellidos = input.apellidos ?? currentUser.apellidos;
  const ci =
    input.ci === undefined
      ? currentUser.ci
      : input.ci?.trim() || null;

  const telefono =
    input.telefono === undefined
      ? currentUser.telefono
      : input.telefono?.trim() || null;

  const correo = input.correo ?? currentUser.correo;

  const existingEmail = await findUserByEmailExcludingId(
    correo,
    idUsuario,
  );

  if (existingEmail) {
    throw new UserError(
      409,
      "Ya existe otro usuario registrado con ese correo",
    );
  }

  if (ci) {
    const existingCi = await findUserByCiExcludingId(
      ci,
      idUsuario,
    );

    if (existingCi) {
      throw new UserError(
        409,
        "Ya existe otro usuario registrado con ese CI",
      );
    }
  }

  return updateUserById({
    idUsuario,
    nombres,
    apellidos,
    ci,
    telefono,
    correo,
  });
}