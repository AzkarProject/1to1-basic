// Fonctions websocket générales -----------------------------
// Flags divers
var isServerInfoReceived = false; 

// variables diverses
var myPlaceListe = 0;
var nbUsers = 0;

// Initialisation du canal de signalisation
var socket = io.connect(); 

var typeUser = null;
if (type == "pilote-typeA") {typeUser = "Pilote";
} else if (type == "robot-typeB") { typeUser = "Robot";}


// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
//var pseudo = null;
pseudo = prompt('Votre pseudo? (par défaut ce sera "'+typeUser+'")');


if (!pseudo) { pseudo = typeUser;}
// document.title = pseudo + ' - ' + document.title;

// socket.emit('nouveau_client', pseudo); // Version 1
socket.emit('new_client', {pseudo: pseudo, typeUser: typeUser}); // Version objet

// liste des users connectés
var users = {};

// Objet User courant.
var localObjUser;

// ----------------------------------------------------------

// Updater le titre de la page (pour le fun...)
socket.on('myObjectUser', function(objUser) {
     // On affecte l'objet reçu à l'objet user local
     localObjUser = objUser;
     console.log(">> socket.on(myObjectUser,objUser) "+tools.humanDateER(""));
     // console.log(objUser);
     document.title = objUser.pseudo +"("+objUser.typeClient+") - "+document.title;
     myPlaceListe = objUser.placeliste;
})



// Fonctions websocket dédiées au tchat ---------------------------

// Quand un nouveau client se connecte, on affiche l'information
socket.on('new_client', function(objUser) {
    console.log(">> socket.on('new_client', objUser) "+tools.humanDateER(""));
    // console.log(objUser);
    var message = tools.humanDateER("") + " à rejoint le Tchat";
    insereMessage(objUser,message);
})

// Réception d'une info de déconnexion 
// >>> plus réactif que l'écouteur de l'API WebRTC
// >>> On déplace ici l'écouteur ici au cas où la fonction
// Connect n'as pas encore été apellée.
socket.on("disconnected", function(data) { 
  console.log(">> socket.on('disconnected',...)"+tools.humanDateER(""));

  //var dateR = tools.dateER('R');
  var msg = tools.humanDateER("")+' '+data.message;
  insereMessage(data.objUser,msg); // Plante puisque no data.objUser  !!!

  // On met à jour la liste des cliens connectés
  var users = data;
  //var debug = tools.stringObjectDump(users,"users");
  //console.log(debug); 
  
  // On lance la méthode de préparatoire à la renégo WebRTC
  // Todo >>>> Tester déclenchement a la detection WebRTC...
  // Pour voir si ca résoud le problème de déco intempestive sur openShift
  onDisconnect();
  // >>>> Tests en local: renégo webSoket et WebRTC OK
  // >>>> Todo >> Tests en ligne sur OpenShift...
});
  

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
    
    var msg = tools.humanDateER("")+' '+data.message;
    insereMessage(data.objUser,msg);
})

// ----------- Méthodes jquery d'affichage du tchat ------------------------------

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#formulaire_chat_websoket').submit(function () {
    //console.log ("WWWWWWWWWWWWW");
    var message = $('#message').val();
    // On ajoute la dateE au message
    var dateE = '[E-'+tools.dateNowInMs()+']';
    message = dateE + ' '+message;
    socket.emit('message', {objUser:localObjUser,message:message}); // Transmet le message aux autres
    insereMessage(localObjUser, message); // Affiche le message aussi sur notre page
    $('#message').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Affiche le message ds le tchat
function insereMessage(objUser, message) {
    
    var text;
    
    if (objUser){
      text = '['+objUser.typeClient+'] '+ message;
    } else {
      text = '[????] '+ message;
    }
    /**/
    text += '\n';
    
    $('#zone_chat_websocket').prepend(text);
}

