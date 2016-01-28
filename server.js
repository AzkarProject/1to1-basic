// ------------------------ Elements communs client/serveur
var tools = require('./js/common_tools'); // méthodes génériques & cionstructeurs
var settings = require('./js/common_settings'); // paramètres de configuration

// ------ Variables d'environnement & paramètrages serveurs ------------------
// Récupération du Nom de la machine 
var os = require("os");
hostName = os.hostname();
dyDns = 'azkar.ddns.net'; // Adresse no-Ip
ipaddress =  "127.0.0.1"; // défaut
port =  80; // défaut

// Machines windows
//if (hostName == "azcary") {ipaddress = "localhost";port = 2000 ;}
if (hostName == "azcary") ipaddress = "192.168.173.1"; // Tablette HP & wifi ad Hoc
else if (hostName == "thaby") ipaddress = "192.168.173.1"; // Tablette HP & wifi ad Hoc
else if (hostName == "azkar-Latitude-E4200") ipaddress = "0.0.0.0"; // Serveur Ubuntu - noip > azkar.ddns.net
else if (hostName == "AZKAR-1") ipaddress = "134.59.130.143"; // IP statique de la VM1 sparks 
else if (hostName == "AZKAR-2") ipaddress = "134.59.130.142"; // IP statique de la VM2 sparks


var app = require('express')(),
    server = require('http').createServer(app),
    //server = require('https').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

var express = require('express');

// affectation du port
app.set('port', port);

// Pour que nodejs puisse servir correctement 
// les dépendances css du document html
app.use(express.static(__dirname));

// ------------ routing ------------

// Chargement de la page index.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/clientA/', function(req, res) {
    res.sendFile(__dirname + '/clientA.html');
});

app.get('/clientB/', function(req, res) {
    res.sendFile(__dirname + '/clientB.html');
});

// On passe la variable hostName en ajax à l'ihm d'accueil
app.get("/getvar", function(req, res){
    res.json({ hostName: hostName });
});


// Lancement du serveur
server.listen(app.get('port'), ipaddress);


// ------ Partie Websocket ------------------

// Adresse de redirection pour les connexions refusées
var indexUrl;
indexUrl = "http://" + ipaddress + ":" + port; // Par défaut...
if (hostName == "azkar-Latitude-E4200") indexUrl = "http://" + dyDns; // Si machine Ubuntu && noip


// liste des clients connectés
var users2 = {};
var nbUsers2 = 0;

// Historique des connexions
var histoUsers2 = {};
var placeHisto2 = 0;
histoPosition2 = 0;

// ID websockets pour les envois non broadcastés
wsIdClientA = '';
wsIdClientB = '';


io.on('connection', function(socket, pseudo) {

    onSocketConnected(socket);

    // Quand un User rentre un pseudo (version objet), 
    // on le stocke en variable de session et on informe les autres Users
    socket.on('new_client', function(data) {

        console.log('>>> Socket.on("new_client")');
        console.log(data);
        // Contrôle d'accès minimal
        // Si 2 clients A >> Accès refusé
        // Si 2 clients B >> Accès refusé
    
        var isAuthorized = true;
        var authMessage;
        var rMsg = "> Connexion Rejetée: ";
        var rReason;
        
        if (data.typeUser == "Robot") {

            // Teste la présence d'un robot dans la liste des clients connectés
            // Paramètres: (hashTable,attribute,value,typeReturn) typeReturn >> boolean ou count...
            var isOtherBot = tools.searchInObjects(users2, "typeClient", "Robot", "boolean");
            if (isOtherBot == true) {
                isAuthorized = false;
                authMessage = "Client B is busy...\n please wait.";
                rReason = " > Because 2 Robots";
            }

        } else if (data.typeUser == "Pilote") {
            var isOtherPilot = tools.searchInObjects(users2, "typeClient", "Pilote", "boolean");
            if (isOtherPilot == true) {
                isAuthorized = false;
                authMessage = "Client A is busy...\n please wait.";
                rReason = " > Because 2 Pilotes";
            }
        }

        if (isAuthorized == false) {
            console.log(rMsg + "(ID: " + socket.id + ") " + rReason);
            io.to(socket.id).emit('rejectConnexion', {
                message: authMessage,
                url: indexUrl
            });
            return;
        } else {
            // Si tt est ok pour enregistrement ds la liste des connectés,
            // On renseigne la variable d'identité du pilote et du robot
            // pour les transferts de messages non broadcastés.
            if (data.typeUser == "Pilote") wsIdClientA = socket.id;
            if (data.typeUser == "Robot") wsIdClientB = socket.id;
        }

        // On lui attribue un numéro correspondant a sa position d'arrivée dans la session:
        // pour ce faire , on passe par un objet contenant tous les users connectés
        // depuis le début de la session (comme une sorte de log, d'historique..)
        // et on comptera simplement le nombre de propriétés de l'objet.
        histoUsers2[socket.id] = data.pseudo + " timestamp:" + Date.now();
        var userPlacelist = tools.lenghtObject(histoUsers2);
        // On crée un User - Fonction de référence ds la librairie tools:
        // exports.client = function client (id,pseudo,placeliste,typeClient,connectionDate,disConnectionDate){
        var p1 = socket.id;
        var p2 = ent.encode(data.pseudo);
        var p3 = userPlacelist;
        var p4 = data.typeUser;
        var p5 = Date.now();
        var p6 = null;
        var objUser = new tools.client(p1, p2, p3, p4, p5, p6);

        // On ajoute l'User à la liste des connectés
        users2[socket.id] = objUser;

        // On renvoie l'User crée au nouveau connecté
        // pour l'informer entre autre de son ordre d'arrivée ds la session
        io.to(socket.id).emit('myObjectUser', objUser);
        
        // 2 - on signale à tout les autres connectés l'arrivée de l'User
        socket.broadcast.emit('new_client', objUser);

        // 3 - On envoie la liste mise a jour a chaque client"
        nbUsers2 = tools.lenghtObject(users2);
        io.sockets.emit('updateUsers', {
            listUsers: users2
        });
        console.log("> Il y a " + nbUsers2 + " connectés");

    });

    // Quand un user se déconnecte
    socket.on('disconnect', function() {
        var dUser = users2[socket.id];

        //console.log ("-------------------------------");
        var message = "> Connexion sortante: ";
        console.log(message + "(ID: " + socket.id + ")");

        // on retire le connecté de la liste des utilisateurs
        delete users2[socket.id];
        socket.broadcast.emit('disconnected', {
            listUsers: users2
        });
        
        // On prévient tout le monde
        socket.broadcast.emit('message', {
            objUser: dUser,
            message: message
        });
        
        // On actualise le nombre de connectés  
        nbUsers = tools.lenghtObject(users2)
        console.log("> Il reste " + nbUsers + " connectés");
    });
    /**/

    // Transmission de messages génériques 
    socket.on('message', function(data) {
        // console.log(data);
        if (data.message) {
            message = ent.encode(data.message); // On vire les caractères html...
            socket.broadcast.emit('message', {
                objUser: data.objUser,
                message: message
            });
        }
        console.log("@ message from " + data.objUser.placeliste + "-" + data.objUser.pseudo + ": " + message);
    });


    // ----------------------------------------------------------------------------------
    // Partie 'signaling'. Ces messages transitent par websocket 
    // mais n'ont pas vocation à s'afficher dans le tchat client...
    // Ces messages sont relayés à tous les autres connectés (sauf à celui qui l'a envoyé)

    socket.on('candidate', function(message) {
        console.log("@ candidate >>>> ");
        socket.broadcast.emit('candidate', {
            message: message
        });
    });

    socket.on('offer', function(message) {
        console.log("@ offer >>>> ");
        socket.broadcast.emit('offer', {
            message: message
        });
    });

    socket.on('answer', function(message) {
        console.log("@ answer >>>> ");
        socket.broadcast.emit('answer', {
            message: message
        });
    });


    // ----------------------------------------------------------------------------------
    // Phase pré-signaling ( selections caméras et micros du robot par l'IHM pilote et status de la connexion WebRTC de chaque client)

    // Retransmission du statut de connexion WebRTC du pilote
    socket.on('piloteCnxStatus', function(message) {
        console.log("@ piloteCnxStatus >>>> ");
        socket.broadcast.emit('piloteCnxStatus', {
            message: message
        });
    });

    // Retransmission du statut de connexion WebRTC du robot
    socket.on('robotCnxStatus', function(message) {
        console.log("@ robotCnxStatus >>>> ");
        socket.broadcast.emit('robotCnxStatus', {
            message: message
        });
    });

    // Robot >> Pilote: Offre des cams/micros disponibles coté robot
    socket.on('remoteListDevices', function(data) {
        console.log("@ remoteListDevices >>>> ");
        socket.broadcast.emit('remoteListDevices', {
            objUser: data.objUser,
            listeDevices: data.listeDevices
        });
    });

    // Pilote >> Robot: cams/micros sélectionnés par le Pilote
    socket.on('selectedRemoteDevices', function(data) {
        console.log("@ selectedRemoteDevices >>>> ");
        socket.broadcast.emit('selectedRemoteDevices', {
            objUser: data.objUser,
            listeDevices: data.listeDevices,
            appSettings: data.appSettings
        });
    });

    // Robot >> Pilote: Signal de fin pré-signaling...
    socket.on('readyForSignaling', function(data) {
        console.log("@ readyForSignaling >>>> ");
        socket.broadcast.emit('readyForSignaling', {
            objUser: data.objUser,
            message: data.message
        });
    });

});

// ------------ fonctions Diverses ------------

// Pour Contrôle des connectés coté serveur
// Ecouteur de connexion d'un nouveau client
function onSocketConnected(socket) {
    // console.log ("-------------------------------");
    console.log("> Connexion entrante: (ID: " + socket.id + ")");
}


// ----- Contrôles pour débuggage coté serveur

// Contrôle des versions node.modules (Pour debugg sur Openshift)
var ioVersion = require('socket.io/package').version;
var expressVersion = require('express/package').version;
var entVersion = require('ent/package').version;

// Affichage de contrôle coté serveur
console.log("***********************************");
console.log("** Socket.IO Version: " + ioVersion);
console.log("** Express Version: " + expressVersion);
console.log("** Ent  Version: " + entVersion);
console.log("***********************************");
console.log("** Adresse IP = " + ipaddress);
console.log("** N° de port = " + port);
console.log("***********************************");
