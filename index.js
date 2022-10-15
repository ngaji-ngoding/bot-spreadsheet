const querystring = require("node:querystring");
const fs = require("fs");
const fetch = require("node-fetch");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@adiwajshing/baileys");
const logger = require("pino")({ level: "silent" });
const { Boom } = require("@hapi/boom");

async function runBot() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger,
  });

  //connection
  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection == "close") {
      if (
        new Boom(lastDisconnect.error).output?.statusCode ===
        DisconnectReason.loggedOut
      ) {
        socket.logout();
      } else {
        runBot();
      }
    } else {
      console.log("BOT SIAP DIGUNAKAN");
    }
  });
  //simpan creds
  socket.ev.on("creds.update", saveCreds);

  //pesan
  socket.ev.on("messages.upsert", async (msg) => {
    let pesan = msg.messages[0];
    let sender = pesan.key.remoteJid;
    if (pesan.key.fromMe || pesan.key.remoteJid == "status@broadcast") return;
    if (pesan.message.conversation) {
      pesan = pesan.message.conversation;
    }
    pesan = pesan.split(" ");
    let data = {};
    console.log(pesan);
    if (pesan[0] == "addData") {
      data["email"] = pesan[1];
      data["no wa"] = sender.split("@")[0];
      console.log(data, pesan);
      let urlAppScript =
        "https://script.google.com/macros/s/AKfycby-xK7BtrM79s1IhEPOzSsJQ8XRf_hV-ywHAf0Pny5w7IN_Jgu8xIZcJOeuQwgnJLSrcQ/exec?";
      data = querystring.stringify(data);
      let res = await fetch(urlAppScript + data, { method: "POST" });
      res = await res.json();
      socket.sendMessage(sender, { text: res.result });
    }
  });
}

runBot();
