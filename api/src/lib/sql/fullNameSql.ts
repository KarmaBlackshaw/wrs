export const fullNameSql = (alias: string) => `concat(${alias}.first_name, ' ', ${alias}.last_name)`;
