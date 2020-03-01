const Detalle = require("./!detalle.json");
const DB = require("./!db.js");

const express = require("express");
const Request = require("request");

const telegram = require("telegram-bot-api");
const bot = new telegram({                                                               
  token: <token>,                              
  updates: {enabled: true}                                                             
}); 

/*_________________________Express________________________________________*/
const app = express();
app.use(express.static("public"));

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function responder(chat, texto){
  bot.sendMessage({
        chat_id: chat,
        text: texto,
        parse_mode: "HTML"
  })
}

const indentado = '\n              ';
const hr = '\n__________________________\n';

function listaComandos(listaCmd){
  var salida = "";
  listaCmd.forEach(e => salida += e.comando + " -> " + e.descripcion + "\n");
  return salida
}

const formatear= (string)=>{
  string = string.trim().toLowerCase()
  string = string.replace('é', 'e');
  string = string.replace('á', 'a');
  return string
}


function existeElSigno(signo){
  let signos = ['aries', 'tauro', 'geminis', 'cancer', 'leo', 'virgo', 'libra', 'escorpio', 'sagitario', 'capricornio', 'acuario', 'piscis'];
  return signos.includes(signo);
}

function mensajeYoli(Yoli, zodiac){
  let signo = Yoli.horoscopo[zodiac];
  let fecha = new Date();
  return `<i>${Yoli.titulo} ${fecha.getFullYear()}</i>
<b>${signo.nombre}</b>
<u>${signo.fechaSigno}.</u>
<b>${signo.color} ${signo.numero}</b>

Amor: 
  <i>${signo.amor}</i>\n
Salud: 
  <i>${signo.salud}</i>\n
Dinero: 
  <i>${signo.dinero}</i>\n`;
}

function llamarYoli(chat, zodiac){
  zodiac = formatear(zodiac);
  if (zodiac == "ofiuco")responder(chat, "Ofiuco no cuenta :/");
  else if (zodiac == "")responder(chat, "Utiliza <b>/yoli *tu signo*</b> para ver qué dice Yolanda Sultana sobre tu signo el día de hoy ;)");
  else if (!existeElSigno(zodiac)) responder(chat, "¿Estás seguro/a que ese signo existe? Prueba de nuevo :-(")
  else{  
    Request.get('https://api.adderou.cl/tyaas/', (err, res, body) =>{
      if (body[0] == '{'){
        //La API está on
        var Yoli = JSON.parse(body);
        let signo = Yoli.horoscopo[zodiac];
        let resultado = mensajeYoli(Yoli, zodiac)
        responder(chat, resultado);
      }else{
        //La API está caída
        responder(chat, "Yoli no puede responder en estos momentos, puede ser que son cerca de las 00:00 y se están actualizando los datos, o simplemente se cayó el servidor :(\nDe todas formas, inténtalo más tarde :)");
      }
    });
  }
}


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~°°OOOOOOOOOOO°°~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
const comandos = [
{
  "comando":"/help",
  "descripcion": "Lista todos los comandos disponibles",
  "salida": chat => responder(chat, "Hasta el momento existen los siguientes comandos:\n\n"+ listaComandos(comandos) )
},
{
  "comando": "/info",
  "descripcion": "Info del bot",
  "salida": (chat, a="") => {
    if(a=="completa")responder(chat, `<b>${Detalle.nombre}</b> ${Detalle.version}\npor ${Detalle.autor} en ${Detalle.fecha}.\nAPIs usadas: \n${Detalle.APIS}`)
    else responder(chat, `Wenísimas, mi nombre es <b>${Detalle.nombre}</b> y estoy en la versión <b>${Detalle.version}</b>.`)
  }
},
{
  "comando":"/start",
  "descripcion": "Arranca el bot",
  "salida": chat => responder(chat, 'Wenísimas, soy el PerroBot!')
},
{
  "comando":"/yoli",
  "descripcion": "Horóscopo de la tía Yolanda Sultana."+indentado+"Usa <b>/yoli <u>signo</u></b>",
  "salida": (chat, signo="") => llamarYoli(chat, signo)
},
{
  "comando":"/letra",
  "descripcion": "Busca letra de canciones"+indentado+"Usa <b>/yoli <u>nombre de la canción</u> <u>nombre del artista</u></b>",
  "salida": (chat, cancion="",artista="") => {
    
    if(cancion.length > 0 && artista.length > 0){
      Request.get('https://api.lyrics.ovh/v1/'+artista+'/'+cancion,( err,res,body ) => {
        if (body != undefined){
          let cuerpo = JSON.parse(body);
          if(cuerpo.lyrics != undefined)responder(chat, hr+cuerpo.lyrics+hr);
          else responder(chat, 'No se encontraron datos :(');
        }else{
          responder(chat, "No se pudo completar correctamente la solicitud :(\nQuizás es un problema del servidor, o quizás no.")
        }
      });
    }else{
      responder(chat,"Buscador de letras de canciones. Pueden haber algunos problemas porque no es tan weno el sistema.\nDebes usar la estructura <b>/letra <u>cancion</u>, <u>artista</u></b>");
    }
  }
},
{
  "comando":"/miUsuario",
  "descripcion":"nuevo user en la db"+indentado+"<b>/miUsuario Nombre, Signo</b>",
  "salida": (chat, nombre="", signo="") =>{
    if (nombre.trim().length > 0 && signo.length > 0){
      //Estructura correcta
      
      nombre = nombre.trim();
      signo = formatear(signo);
      
      if (existeElSigno(signo)){
        //signo bien escrito
        
        DB.nuevoUsuario(nombre[0].toUpperCase() + nombre.slice(1), signo, chat, responder(chat,"listo!")); 
      }else{
        //signo mal escrito
        
        responder(chat, 'Ups!, ese signo no lo pude procesar :(')
      }
    }else{
      //Estructura incorrecta
      
      responder(chat,"Necesito más info: /miUsuario Nombre, Signo");
    }
  }
},
{
 "comando": "/borrarMiUsuario",
  "descripcion": "Borrar mi usuario",
  "salida": chat => {
    if (DB.Usuarios[chat] == undefined){
      responder(chat, 'No hay un usuario con esta id :(\nUsa <i>/miUsuario nombre, signoZodiacal</i> para crear tu usuario ;)')
    }else{
     DB.borrarUsuario(chat);
      responder(chat, 'Listo! Usa <i>/miUsuario nombre, signoZodiacal</i> para crear tu usuario ;)')
    }
  }
},
{
  "comando":"/perro",
  "descripcion":"peorop",
  "salida": (chat, arg)=>{
    if(arg=='alarma'){
      let db = DB.Usuarios;
      Request.get('https://api.adderou.cl/tyaas/', (err, res, body) =>{
        if (body[0] == '{'){
          var Yoli = JSON.parse(body);
        
          for (let k in db){
            responder(db[k].chatId, `Wenas, ${db[k].nombre}! Ya son como las 9 de la mallana!\nCómo estás? Yo ando bien jeje\nAquí te va el horóscopo! Ten un buen dia.`);
            setTimeout( ()=>responder(db[k].chatId, mensajeYoli(Yoli, db[k].signo) ), 1000);
          }
        }else{
          for (let k in db){
            responder(db[k].chatId, `Wenas, ${db[k].nombre}! Ya son como las 9 de la mallana!\nCómo estás? Yo ando bien jeje\nHoy no está disponible el horóscopo:( \nTen un buen dia.`);
          }
        }
      });
    }else{
      responder(chat, 'comando de desarrollo');
    }
  }
}
];
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~°°OOOOOOOOOOO°°~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

bot.on('message', (message)=>{
  
  if( /^\//.test(message.text) ){
    //Tiene sintaxis de comando
    
    let [comando, ...txt] = message.text.split(' '); //Sistema de argumentos//
    let args = txt.join(" ").split(',');             //~~~~~~~~~~~~~~~~~~~~~//
    
    let esValido=false;
    
    comandos.forEach( elemento =>{
        if(comando == elemento.comando){
          //Es un comando existente
          
          elemento.salida(message.chat.id, ...args);
          
          esValido=true;
        }
    });
    
    if(!esValido) 
      //No es un comando existente
      responder(message.chat.id, 'Ups! ese comando <b><u>no existe</u></b> :(\nRevisa los comandos que <i>sí</i> existen usando <i>/help</i> :)');
    
  }else{
    //Es un mensaje
    responder( message.chat.id, `Recibí este mensaje: <b>${message.text} </b>:)` );  //Rellenar acá, esto se ganaría un major change
  }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function alarma(){
  let Actual = new Date;
  var minuto = 60000;  //Para hacerla más legible jeje
  
  if ( Actual.getHours() == 12 && Actual.getMinutes() >= 0 && Actual.getMinutes() <5 ){
    //Contenido de la alarma
    
    let db = DB.Usuarios;
    Request.get('https://api.adderou.cl/tyaas/', (err, res, body) =>{
      if (body[0] == '{'){
        var Yoli = JSON.parse(body);
        
        for (let k in db){
        responder(db[k].chatId, `Wenas, ${db[k].nombre}! Ya son como las 9 de la mallana!\nCómo estás? Yo ando bien jeje\nAquí te va el horóscopo! Ten un buen dia.`);
        setTimeout( ()=>responder(db[k].chatId, mensajeYoli(Yoli, db[k].signo) ), 1000 )
        }
      }else{
        for (let k in db){
        responder(db[k].chatId, `Wenas, ${db[k].nombre}! Ya son como las 9 de la mallana!\nCómo estás? Yo ando bien jeje\nHoy no está disponible el horóscopo:( \nTen un buen dia.`);
        }
      }
    });
    
  }else{
    //Vuelve a revisar cada 10 minutos
    setTimeout(alarma, 5*minuto);
  }
}
alarma();
