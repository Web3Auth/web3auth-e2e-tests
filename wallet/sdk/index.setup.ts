import http from "http";
import path from "path";
import handler from "serve-handler";

export const HOST = "localhost";
export const PORT = 5000;

export default async function globalSetup() {
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: path.resolve(__dirname, "app"),
    });
  });
  await new Promise<void>((resolve) => server.listen(PORT, HOST, resolve));
  return async function () {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  };
}
