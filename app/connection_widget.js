import document from "document";
import * as logger from "../common/logger";
import { vibration } from "haptics";
import * as settings from "./settings"
import * as messaging from "messaging";

let errorDelay = 200;
let disconnectedDelay = 200;

const STATE_CONNECTED = 1;
const STATE_DISCONNECTED = 0;
const STATE_ERROR = -1;
let state = STATE_DISCONNECTED;

const COLOR_NORMAL = "#006ED6";
const COLOR_DIMMED = "gray";
const COLOR_ERROR = "red";
let color = COLOR_NORMAL;

let widget = document.getElementById("bt");

widget.onclick = function () {
    //    setState(state!=STATE_CONNECTED?STATE_ERROR:STATE_DISCONNECTED);
    setState(state != STATE_CONNECTED ? STATE_CONNECTED : STATE_DISCONNECTED);
}

if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) setState(STATE_CONNECTED);

messaging.peerSocket.addEventListener("open", () => { setState(STATE_CONNECTED); });
messaging.peerSocket.addEventListener("close", () => { setState(STATE_DISCONNECTED); });
messaging.peerSocket.addEventListener("error", () => { setState(STATE_ERROR); });

function setState(newState) {
    vibration.start("bump");
    state = newState;
    logger.debug("Connection state changed: " + state);
    switch (state) {
        case STATE_CONNECTED:
            color = COLOR_NORMAL;
            stopBlinking();
            onConnectionOpen();
            break;
        case STATE_DISCONNECTED:
            color = COLOR_NORMAL;
            startBlinking();
            onConnectionLost();
            break;
        case STATE_ERROR:
            color = COLOR_ERROR;
            startBlinking();
            onConnectionLost();
            break;
        default:
            break;
    }
}

let blinkingTimer = null;
function startBlinking() {
    if (blinkingTimer) {
        clearTimeout(blinkingTimer);
        blinkingTimer = null;
    }
    // setInterval(() => {  
    //     logger.debug(" blinking ");
    //  }, 100);
    blinkingTimer = setInterval(() => {
        widget.style.fill = COLOR_DIMMED;
        setTimeout(() => { widget.style.fill = color; }, 300);
    }, 1000);
}
function stopBlinking() {
    if (blinkingTimer) {
        clearTimeout(blinkingTimer);
        blinkingTimer = null;
    }
    widget.style.fill = color;
}

let snoozeTimer = null;
function onConnectionOpen() {
    //resetSnooze();
}
function onConnectionLost() {
    if (!snoozeTimer) {
        if (settings.get("vibrateOnConnectionLost"),true) vibration.start("nudge");
        if (settings.get("snoozeDialogEnabled"),true) showSnoozeDialog();
    }
}

function showSnoozeDialog() {
    document.location.assign("connection_dialog.view").then(() => {
        logger.debug(" another view loaded" + document.getElementById("btn_snooze"));
        document.getElementById("btn_snooze").addEventListener("click", (evt) => {
            logger.debug("btn_snooze");
            snooze();
        });
        document.getElementById("btn_dismiss").addEventListener("click", (evt) => {
            logger.debug("btn_dismiss");
            dismiss();
        });
    });
}

export function init() {
    logger.debug("connectionWidget init");
}
function resetSnooze() {
    if (snoozeTimer !== null) {
        logger.debug("resetSnooze");
        clearInterval(snoozeTimer);
        snoozeTimer = null;
    }
}
function dismiss() {
    resetSnooze();
    document.history.back();
};
function snooze() {
    document.history.back();
    resetSnooze();
    logger.debug("snoozed for " + settings.get("snoozeDelayMinutes",2)  + " minutes")
    snoozeTimer = setTimeout(function () {
        logger.debug("snooze timeout state: " + state);
        resetSnooze();
        if (state != STATE_CONNECTED) onConnectionLost();
    }, settings.get("snoozeDelayMinutes",2) * 60 * 1000);
}
