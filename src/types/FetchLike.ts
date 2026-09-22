export type FetchLike = (
  input: string | URL | Request,
) => Promise<Response>;
