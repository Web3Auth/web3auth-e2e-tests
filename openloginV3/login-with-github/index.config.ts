// import path from "path";
// import {
//   PlaywrightTestConfig,
//   PlaywrightWorkerOptions,
// } from "@playwright/test";
// import { TestArgs } from "./index.lib";
// import indexConfig from "../../index.config";

// const projects: Array<
//   Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
// > = [
//   {
//     browserName: "chromium",
//     user: { email: "connie.washington.1981@gmail.com" },
//   },
//   {
//     browserName: "firefox",
//     user: { email: "tafgithub1@gmail.com" },
//   },
//   {
//     browserName: "webkit",
//     user: { email: "tafgithub2@gmail.com" },
//   },
// ];

// const config: PlaywrightTestConfig<TestArgs> = {
//   ...indexConfig,
//   testDir: __dirname,
//   projects: projects.map(({ browserName, user }) => ({
//     name: browserName,
//     use: {
//       browserName,
//       storageState: path.resolve(__dirname, `${browserName}.json`),
//       user,
//     },
//   })),
// };

// export default config;
