# Vapor Dashboard

## Development

#### Setup

Install Node.js:

```
brew install node
```

Install dependencies:

```
npm install
```

##### Add Vapord Deamon
Add a folder named `vapord` under the root folder. Put all the vapord files into that folder.
```
vapor-electron
│   README.md
│
└───vapord
│   │   vapord-darwin_amd64
│   │   vapord-linux_386
│   │   vapord-linux_amd64
│   │   vapord-windows_386.exe
│   │   vapord-windows_amd64.exe
│   │  
``` 


To developer the vapor electron app, run the script.
```
DEV=ture electron .
```

---
#### Package

To package the app for all platform, run the following command. 

```
npm run package
```
