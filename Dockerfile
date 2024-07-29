# Get the base image of Node version 16
FROM node:20

# Get the latest version of Playwright
FROM mcr.microsoft.com/playwright:focal

# Set the work directory for the application
WORKDIR /app

# Set the environment path to node_modules/.bin
ENV PATH /app/node_modules/.bin:$PATH

# COPY the needed files to the app folder in Docker image
COPY package.json /app/
COPY openloginV4/ /app/openloginV4
COPY openloginV3/ /app/openloginV3
COPY bin/ /app/bin
COPY index.config.ts /app/
COPY wallet/ /app/wallet
# COPY --no-error .env /app/

# Get the needed libraries to run Playwright
# RUN apt-get update && apt-get -y install libnss3 libatk-bridge2.0-0 libdrm-dev libxkbcommon-dev libgbm-dev libasound-dev libatspi2.0-0 libxshmfence-dev libx11-xcb1

# Set up dependencies for playwright/chromium
# See https://github.com/opstrace/opstrace/pull/182#issuecomment-747426156
RUN apt-get update && apt-get install -y -q --no-install-recommends \
    libnss3 libcups2 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libdbus-c++-1-0v5 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libgtk-3-0 libgtk-3-0 \
    libasound2 libatspi2.0-0

# Install the dependencies in Node environment
RUN npm install

RUN dbus-uuidgen > /var/lib/dbus/machine-id
RUN mkdir -p /var/run/dbus
RUN dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address
