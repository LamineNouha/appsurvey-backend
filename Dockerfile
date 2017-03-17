FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies in build server (jenkins)
#COPY package.json /usr/src/app/
#RUN npm install

# Bundle app source
COPY . /usr/src/app

#clean and build app in build server (jenkins)
#RUN npm run clean
#RUN npm run build

EXPOSE 3000 
CMD [ "npm", "start" ]
