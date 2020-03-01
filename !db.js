var admin = require("firebase-admin");
var serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proyecto-node-tobias.firebaseio.com"
});

var db = admin.database();
var PBdb = db.ref("perroBot");
var usuariosRef = PBdb.child("usuarios");

const nuevoUsuario = (nombre, signo, chatid) => {
  usuariosRef.child(chatid).set({
          nombre: nombre,
          signo: signo,
          chatId: chatid
  });
}
const borrarUsuario = (chatid) => {
  usuariosRef.child(chatid).remove();
}

usuariosRef.once('value', snapshot => {
  exports.Usuarios = snapshot.val();
})

exports.borrarUsuario = borrarUsuario;
exports.nuevoUsuario = nuevoUsuario;
