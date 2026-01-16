// Source - https://stackoverflow.com/a

declare namespace Express {
  export interface Request {
    user: {
      userId: number;
      username: string;
    };
  }
}
