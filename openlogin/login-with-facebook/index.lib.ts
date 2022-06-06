import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";

export interface TestArgs {
  openloginURL: string;
  user: {
    email: string;
    name: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM],
  user: {
    email: "hello@tor.us",
    name: "Torus Labs",
  },
});
