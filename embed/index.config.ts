import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import indexConfig from "../index.config";

const projects: Array<Pick<PlaywrightWorkerOptions, "browserName">> = [
  { browserName: "chromium" },
  { browserName: "firefox" },
  { browserName: "webkit" },
];

const config: PlaywrightTestConfig = {
  ...indexConfig,
  testDir: __dirname,
  globalSetup: require.resolve("./index.setup"),
  projects: projects.map(({ browserName }) => ({
    name: browserName,
    use: { browserName },
  })),
};

export default config;
