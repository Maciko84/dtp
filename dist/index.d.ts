export type ValidEvent = "abort" | "afterprint" | "animationend" | "animationiteration" | "animationstart" | "beforeprint" | "beforeunload" | "blur" | "canplay" | "canplaythrough" | "change" | "click" | "contextmenu" | "copy" | "cut" | "dblclick" | "drag" | "dragend" | "dragenter" | "dragleave" | "dragover" | "dragstart" | "drop" | "durationchange" | "ended" | "error" | "focus" | "focusin" | "focusout" | "fullscreenchange" | "fullscreenerror" | "input" | "invalid" | "keydown" | "keypress" | "keyup" | "load" | "loadeddata" | "loadedmetadata" | "loadstart" | "message" | "mousedown" | "mouseenter" | "mouseleave" | "mousemove" | "mouseout" | "mouseover" | "mouseup" | "offline" | "online" | "open" | "pagehide" | "pageshow" | "paste" | "pause" | "play" | "playing" | "popstate" | "progress" | "ratechange" | "resize" | "reset" | "scroll" | "search" | "seeked" | "seeking" | "select" | "stalled" | "submit" | "suspend" | "timeupdate" | "toggle" | "touchcancel" | "touchend" | "touchmove" | "touchstart" | "transitionend" | "unload" | "volumechange" | "waiting" | "wheel" | string;
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
export declare class DTPServer {
    private wss;
    private port;
    private apps;
    constructor(port: number);
    register_app(id: string, handler: DTPServerHandler): void;
    listen(): void;
}
