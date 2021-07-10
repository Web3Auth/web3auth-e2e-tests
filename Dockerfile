FROM mcr.microsoft.com/playwright:focal

RUN mkdir /e2e
ADD . /e2e/
WORKDIR /e2e
RUN yarn install
RUN yarn install:system-deps
RUN chmod +x statping.sh

ENTRYPOINT [ "/e2e/statping.sh" ]
