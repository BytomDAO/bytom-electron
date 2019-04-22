# Bytom Dashboard

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

##### Add Bytomd Deamon
Add a folder named `bytomd` under the root folder. Put all the bytomd files into that folder.
```
bytom-electron
│   README.md
│
└───bytomd
│   │   bytomd-darwin_amd64
│   │   bytomd-linux_386
│   │   bytomd-linux_amd64
│   │   bytomd-windows_386.exe
│   │   bytomd-windows_amd64.exe
│   │  
``` 


To developer the bytom electron app, run the script.
```
DEV=ture electron .
```

---
#### Package

To package the app for all platform, run the following command. 

```
npm run package
```
