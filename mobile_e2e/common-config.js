const platform_map = {
  ANDROID: {
    device: "Samsung Galaxy S9 Plus",
    realMobile: "true",
    os_version: "9.0",
    browserName: "android",
    name: "BStack-[NodeJS] Sample Test", // test name
    build: "BStack Build Number 2-android", // CI/CD job or build name
  },
  IOS: {
    device: "iPhone 11",
    realMobile: "true",
    os_version: "14.0",
    browserName: "iphone",
    name: "BStack-[NodeJS] Sample Test", // test name
    build: "BStack Build Number 1", // CI/CD job or build name
  },
};

const env_map = {
  PROD: "https://app.openlogin.com",
  STAGING: "https://beta.openlogin.com",
};

const browserStackURL = `https://toruslabs_YyIj5W:4qPkLZqhFsn1GrFRwn3U@hub-cloud.browserstack.com/wd/hub`;

module.exports = { platform_map, env_map, browserStackURL };
