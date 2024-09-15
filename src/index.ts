import { RawData, WebSocketServer } from "ws";

export type ValidEvent =
    | "abort"
    | "afterprint"
    | "animationend"
    | "animationiteration"
    | "animationstart"
    | "beforeprint"
    | "beforeunload"
    | "blur"
    | "canplay"
    | "canplaythrough"
    | "change"
    | "click"
    | "contextmenu"
    | "copy"
    | "cut"
    | "dblclick"
    | "drag"
    | "dragend"
    | "dragenter"
    | "dragleave"
    | "dragover"
    | "dragstart"
    | "drop"
    | "durationchange"
    | "ended"
    | "error"
    | "focus"
    | "focusin"
    | "focusout"
    | "fullscreenchange"
    | "fullscreenerror"
    | "input"
    | "invalid"
    | "keydown"
    | "keypress"
    | "keyup"
    | "load"
    | "loadeddata"
    | "loadedmetadata"
    | "loadstart"
    | "message"
    | "mousedown"
    | "mouseenter"
    | "mouseleave"
    | "mousemove"
    | "mouseout"
    | "mouseover"
    | "mouseup"
    | "offline"
    | "online"
    | "open"
    | "pagehide"
    | "pageshow"
    | "paste"
    | "pause"
    | "play"
    | "playing"
    | "popstate"
    | "progress"
    | "ratechange"
    | "resize"
    | "reset"
    | "scroll"
    | "search"
    | "seeked"
    | "seeking"
    | "select"
    | "stalled"
    | "submit"
    | "suspend"
    | "timeupdate"
    | "toggle"
    | "touchcancel"
    | "touchend"
    | "touchmove"
    | "touchstart"
    | "transitionend"
    | "unload"
    | "volumechange"
    | "waiting"
    | "wheel"
    | string;

export interface DTPServerModifier {
    create(type: string, id: string, contents?: any, events?: ValidEvent[]): void;
    update(id: string, contents?: any, events?: ValidEvent[]): void;
    delete(id: string): void;
    set_parent(child_id: string, parent_id: string): void;
    get_parent(id: string): Promise<string | null>;
    get_prop(id: string, prop: string): Promise<any>;
    on_event(id: string, event: ValidEvent, callback: () => void): void;
    on_error(callback: (msg: string, critical: boolean) => void): void;
}

export type DTPServerHandler = (dtp: DTPServerModifier) => void;

export class DTPServer {
    private wss: WebSocketServer | null;
    private port: number;
    private apps: Map<string, DTPServerHandler>;

    constructor(port: number) {
        this.wss = null;
        this.port = port;
        this.apps = new Map();
    }

    register_app(id: string, handler: DTPServerHandler) {
        this.apps.set(id, handler);
    }

    listen() {
        this.wss = new WebSocketServer({ port: this.port });
        this.wss.on("connection", (ws) => {
            ws.once("message", (msg) => {
                if (this.apps.has(msg.toString())) {
                    const app = this.apps.get(msg.toString());
                    const api: DTPServerModifier = {
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
                                const handler = (msg: RawData) => {
                                    const data = JSON.parse(msg.toString());
                                    if (data.type === "response") {
                                        res(data.value);
                                    } else {
                                        ws.once("message", handler);
                                    }
                                }
                                ws.once("message", handler);
                            });

                        },
                        get_prop: (id, prop) => {
                            ws.send(JSON.stringify({ type: "get_prop", id, path: prop }));
                            return new Promise((res) => {
                                const handler = (msg: RawData) => {
                                    const data = JSON.parse(msg.toString());
                                    if (data.type === "response") {
                                        res(data.value);
                                    } else {
                                        ws.once("message", handler);
                                    }
                                }
                                ws.once("message", handler);
                            });
                        },

                        on_event(id, event, callback) {
                            ws.on("message", (msg) => {
                                const msgp = JSON.parse(msg.toString());
                                if(msgp.type === "event" && msgp.id === id && msgp.name === event) {
                                    callback();
                                }
                            });
                        },

                        on_error(callback) {
                            ws.on("message", (msg) => {
                                const msgp = JSON.parse(msg.toString());
                                if(msgp.type === "error") {
                                    callback(msgp.message, msgp.critical);
                                }
                            })
                        },
                    };
                    (app ?? ((dtp: DTPServerModifier) => { }))(api);
                } else {
                    ws.send(JSON.stringify({ type: "create", id: "header", mode: "h1", props: { style: { color: "red" }, innerText: "Error: Cannot Find Application Named '" + msg.toString() + "'!" } }));
                    ws.close();
                }
            });
        })
    }
}
