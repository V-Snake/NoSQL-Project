import bcrypt from "bcrypt";
const salt = 10;
export const hashPassword = (newPassword) => {
  const NewPasswordHash = bcrypt.hashSync(newPassword, salt);
  return NewPasswordHash;
};
