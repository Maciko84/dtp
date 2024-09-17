# DTP
DTP (DOM Transfer Protocol) is a simple protocol based on WebSocket that allows you to manipulate a chunk of dom on the server side. 

## Setting Up The Front End
Firstly, import the DTP frontend api:
```html
<script type="text/javascript" src=""></script>
```

after that, connect an div / the body using the dtp function:
```js
dtp(document.body, "ws://localhost:8080", "example") // initialize a dtp connection for the body for url ws://localhost:8080 and application "example"

```

## Setting Up The Back End

Firtly, initalize a npm package:
```sh
npm init -y
```
then install dtp:
```sh
npm i github:maciko84/dtp
```

after that, create a index.js file with the following code:
```js
const dtp = require('dtp'); // import the dtp module

const server = new dtp.DTPServer(8080); // initialize the dtp server

server.register_app("example", (dtp) => { // register an application named "example"
    dtp.create("h1", "header", { innerText: "Hello, world!", style: { color: "blue" } }); // create a blue header with the text "Hello, world"
    dtp.set_parent("header", "main"); // assign the header to the root element
});

server.listen(); // run the server
```

then run the code:
```sh
node .
```

the server should be listening now. try to open the frontend, and if everything is done correctly, then you should see a big, blue Hello, world header on the page.

If you want to learn more about the dtp protocol, feel free to read the source code of the project. Aslo contributions are welcome.