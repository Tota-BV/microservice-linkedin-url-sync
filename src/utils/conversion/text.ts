export const titleCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const stringAvatar = (name?: string) => {
  if (!name) return '';

  return `${name.split(' ')[0]?.[0] ?? ''}${name.split(' ').at(-1)?.[0] ?? ''}`;
};
