"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTPServer = void 0;
const ws_1 = require("ws");
class DTPServer {
    constructor(port) {
        this.wss = null;
        this.port = port;
        this.apps = new Map();
    }
    register_app(id, handler) {
        this.apps.set(id, handler);
    }
    listen() {
        this.wss = new ws_1.WebSocketServer({ port: this.port });
        this.wss.on("connection", (ws) => {
            ws.once("message", (msg) => {
                if (this.apps.has(msg.toString())) {
                    const app = this.apps.get(msg.toString());
                    const api = {
                        create: (type, id, contents, events) => {
                            ws.send(JSON.stringify({ type: "create", mode: type, id, props: contents, events }));
                        },
                        update: (id, contents, events) => {
                            ws.send(JSON.stringify({ type: "update", id, props: contents, events }));
                        },
                        delete: (id) => {
                            ws.send(JSON.stringify({ type: "delete", id }));
                        },
                        set_parent: (child_id, parent_id) => {
                            ws.send(JSON.stringify({ type: "set_parent", child_id, parent_id }));
                        },
                        get_parent: (id) => {
                            ws.send(JSON.stringify({ type: "get_parent", id }));
                            return new Promise((res) => {
                                const handler = (msg) => {
                                    const data = JSON.parse(msg.toString());
                                    if (data.type === "response") {
                                        res(data.value);
                                    }
                                    else {
                                        ws.once("message", handler);
                                    }
                                };
                                ws.once("message", handler);
                            });
                        },
                        get_prop: (id, prop) => {
                            ws.send(JSON.stringify({ type: "get_prop", id, path: prop }));
                            return new Promise((res) => {
                                const handler = (msg) => {
                                    const data = JSON.parse(msg.toString());
                                    if (data.type === "response") {
                                        res(data.value);
                                    }
                                    else {
                                        ws.once("message", handler);
                                    }
                                };
                                ws.once("message", handler);
                            });
                        },
                        on_event(id, event, callback) {
                            ws.on("message", (msg) => {
                                const msgp = JSON.parse(msg.toString());
                                if (msgp.type === "event" && msgp.id === id && msgp.name === event) {
                                    callback();
                                }
                            });
                        },
                        on_error(callback) {
                            ws.on("message", (msg) => {
                                const msgp = JSON.parse(msg.toString());
                                if (msgp.type === "error") {
                                    callback(msgp.message, msgp.critical);
                                }
                            });
                        },
                    };
                    (app !== null && app !== void 0 ? app : ((dtp) => { }))(api);
                }
                else {
                    ws.send(JSON.stringify({ type: "create", id: "header", mode: "h1", props: { style: { color: "red" }, innerText: "Error: Cannot Find Application Named '" + msg.toString() + "'!" } }));
                    ws.close();
                }
            });
        });
    }
}
exports.DTPServer = DTPServer;
