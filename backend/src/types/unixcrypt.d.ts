declare module "@bonniernews/unixcrypt-js" {
  export function encrypt(password: string, saltOrHash?: string): string;
  export function verify(password: string, hash: string): boolean;
  const unixcrypt: {
    encrypt(password: string, saltOrHash?: string): string;
    verify(password: string, hash: string): boolean;
  };
  export default unixcrypt;
}
