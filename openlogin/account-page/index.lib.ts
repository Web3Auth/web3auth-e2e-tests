import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  user: {
    email: string;
    name: string;
  };
  FB: {
    password: string;
    email: string;
    name: string;
    firstName: string;
  };
  googleCred: {
    email: string;
    password: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || "prod"],
  user: [
    {
      email: "hello@tor.us",
      name: "Torus Labs",
    },
    { option: true },
  ],
  FB: {
    name: process.env.FB_TEST_USER_NAME || "",
    email: process.env.FB_TEST_USER_EMAIL || "",
    password: process.env.FB_TEST_USER_PASS || "",
    firstName: (process.env.FB_TEST_USER_NAME || "").split(" ")[0],
  },
  googleCred: {
    email: process.env.GOOGLE_TEST_USER_EMAIL || "",
    password: process.env.GOOGLE_TEST_PASSWORD || "",
  },
});
