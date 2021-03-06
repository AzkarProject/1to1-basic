// Auteur: Thierry
// Sources originales:
// https://developer.mozilla.org/fr/docs/Web/Guide/API/WebRTC/WebRTC_basics
// https://github.com/louisstow/WebRTC/blob/master/media.html
// ------------------------------------------------------------------------------------------------------------------

// Initialisation des variables, objets et paramètres du script
// NB toutes les variables sont déclarées en global...
function mainSettings() {
    console.log("* mainSettings()");  

    // webRTC -------------------------------

    // flag de connexion
    isStarted = false;

    // shims!
    PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    // Voir évolution de la norme pour getUserMedia:
    // https://developers.google.com/web/updates/2015/10/media-devices
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    // Eléments videos du document html
    video1 = document.getElementById("video");
    video2 = document.getElementById("otherPeer");


    // RTC DataChannel
    // Zone d'affichage (textarea)
    chatlog = document.getElementById("zone_chat_WebRTC");
    // Zone de saisie (input)
    message = document.getElementById("input_chat_WebRTC");

    /*// options pour l'objet PeerConnection
    server = {'iceServers': [{'url': 'stun:23.21.150.121'}]};
    server.iceServers.push({url: 'stun:stun.l.google.com:19302'});
    server.iceServers.push({url: 'stun:stun.anyfirewall.com:3478'});
    server.iceServers.push({url: 'stun:turn1.xirsys.com'});
    // Ajout de serveurs TURN
    server.iceServers.push({url: "turn:turn.bistri.com:80",credential: "homeo",username: "homeo"});
    server.iceServers.push({url: 'turn:turn.anyfirewall.com:443?transport=tcp',credential: 'webrtc',username: 'azkarproject'});
    server.iceServers.push({url: "turn:numb.viagenie.ca",credential: "webrtcdemo",username: "temp20fev2015@gmail.com"});
    server.iceServers.push({url: "turn:turn.anyfirewall.com:443?transport=tcp",credential: "webrtc",username: "webrtc"});
    server.iceServers.push({url: "turn:turn1.xirsys.com:443?transport=tcp",credential: "b8631283-b642-4bfc-9222-352d79e2d793",username: "e0f4e2b6-005f-440b-87e7-76df63421d6f"});
    /**/

    // options pour l'objet PeerConnection
    
    // DEBUG STUN/TURN: 
    server = {'iceServers': []}; 
    
    // Sans STUN ni TURN
    // >>> AZCARY / Azcary(Filaire-I3S) / >>>>> OK !
    // >>> AZCARY / Azcary(Filaire-I3S) <> Thaby(AdHoc) / >>> OK ! 
    // >>> DDNS / Azcary(Filaire-I3S) / >>>>> OK ! 
    // >>> DDNS / Azcary(Filaire-I3S) <> Occulus(Filaire-I3S) / >>>>> OK ! 
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / >>> iceConnectionState > failed (main-1to1.js:241)
    
    // Avec STUN (Sans TURN)
    server.iceServers.push({url: 'stun:stun.l.google.com:19302'});
    server.iceServers.push({url: 'stun:stun.anyfirewall.com:3478'});
    server.iceServers.push({url: 'stun:turn1.xirsys.com'});

    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / >>> OK !
    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Eduroam) / >>> iceConnectionState > failed (main-1to1.js:241)

    // server.iceServers.push({url: 'turn:turn.anyfirewall.com:443?transport=tcp',credential: 'webrtc',username: 'azkarproject'}); // HS
    // >> TURN qui fonctionnait encore le 23/11/2015 sur UNICE et EDUROAM
    // server.iceServers.push({url: "turn:turn.anyfirewall.com:443?transport=tcp",credential: "webrtc",username: "webrtc"}); // HS
    // >> TURN maison - Ne fonctionne pas sous wifi unice/Eduroam
    // server.iceServers.push({"urls": "turn:134.59.130.142:3478?transport=tcp",credential: "robosoft",username: "robosoft"});
    // server.iceServers.push({"urls": "turn:134.59.130.142:3478?transport=udp",credential: "robosoft",username: "robosoft"}); 


    // On teste le serveur RESTUND (en basique (sans authentification))
    //server.iceServers.push({url: "turn:134.59.130.142:3478?transport=tcp"}); // RESTUND sur VM2
    //server.iceServers.push({url: "turn:134.59.130.142:3478?transport=udp"}); // RESTUND sur VM2
    
    // server.iceServers.push({url: "turn:5.196.67.153:3478?transport=tcp"}); // RESTUND chez Hugo (OVH)
    // server.iceServers.push({url: "turn:5.196.67.153:3478?transport=udp"}); // RESTUND chez Hugo (OVH)

    // Test RESTUND avec authentification
    // demo:c5dcdebd926706f33065ec3b65bf103c
    // var username = "demo";
    // var credential = "c5dcdebd926706f33065ec3b65bf103c";
    //server.iceServers.push({urls: "turn:134.59.130.142:3478?transport=tcp",credential: credential ,username: username}); // RESTUND sur VM2
    //server.iceServers.push({urls: "turn:134.59.130.142:3478?transport=udp",credential: credential ,username: username}); // RESTUND sur VM2

    // A Finir ---------------------------------

    // Avec TURN (sans STUN)
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / all turns >>> OK !
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / anyfirewall.tcp >>> iceConnectionState > failed (main-1to1.js:241)
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / sparks.tcp >>> OK !
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / sparks.udp >>> OK !
    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Eduroam) / all turns >>> iceConnectionState > failed (main-1to1.js:241)
    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Unice) / all turns >>> iceConnectionState > failed (main-1to1.js:241)

    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Unice) />>> ??? 
    // >>> DDNS / Surface(Unice) <> Thaby(Eduroam) / >>> ???
    // >>> DDNS / Surface(Eduroam) <> Thaby(Unice) />>> ??? 

    // Avec STUN + TURN
    // >>> DDNS / Azcary(Filaire-I3S) <> Asus(Wifi-DomLivebox) / >>> ????
    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Eduroam) / >>> ????
    // >>> DDNS / Azcary(Filaire-I3S) <> Thaby(Unice) />>> ??? 
    // >>> DDNS / Surface(Unice) <> Thaby(Eduroam) / >>> ???
    // >>> DDNS / Surface(Eduroam) <> Thaby(Unice) />>> ??? 

    // ----------------------------------------

    // Test rfc5766 avec authentification
    TURN_username = "azkar";
    TURN_credential = "azkar";
   // server.iceServers.push({urls: "turn:134.59.130.142:3478",credential: "azkar" ,username: "azkar"}); // rfc5766 sur VM2
    
    // Si on est l'apellant (pilote)
    if (type === "pilote-typeA") {
    	TURN_username = "pilote";
    	TURN_credential = "azkar";
    // Sinon si on est l'apellé (Robot)
    } else if (type === "robot-typeB") {
    	TURN_username = "robot";
    	TURN_credential = "azkar";
    }
    server.iceServers.push({urls: "turn:134.59.130.142:3478",credential: TURN_credential ,username: TURN_username}); // rfc5766 sur VM2
    //server.iceServers.push({urls: "turn:134.59.130.142:443",credential: TURN_credential ,username: TURN_username}); // rfc5766 sur VM2
    // server.iceServers.push({urls: "turn:134.59.130.142:80",credential: TURN_credential ,username: TURN_username}); // rfc5766 sur VM2
	
    // API de Xirsys.com
    // Source: Xirsys.com
	dataServer = null;
	$(document).ready(function() {
	              $.get("https://service.xirsys.com/ice",
	                  {
	                      ident: "azkar",
	                      secret: "aaa8803c-d588-11e5-995c-95d016824523",
	                      domain: "www.azkar.fr",
	                      application: "1to1-basic",
	                      room: "default",
	                      secure: 1
	                  },
	                  function(data, status) {
	                      // alert("Data: " + data + "nnStatus: " + status);
	                      // console.log("Data: " + data + "nnStatus: " + status);
	                      // console.log (data);
	                      var resultServer = data.hasOwnProperty('d');
	                      if (resultServer) {
	                          dataServer = data.d;
	                          console.log (dataServer);
	                          console.log (server);
	                          // On merge les deux listes de serveurs
	                          server.iceServers = dataServer.iceServers.concat(server.iceServers);
	                          console.log ("---------------------");
	                          console.log (dataServer);
	                          console.log (server);
	                }
	        })
	});
	/**/


    /*
    options = {
        optional: [
        	{DtlsSrtpKeyAgreement: true}, 
        	{RtpDataChannels: true }// >>> BUG de récéssion à partir de Chrome 46..
        ]
    }
    /**/

    options = { optional: [{DtlsSrtpKeyAgreement: true }]};

    // Création de l'objet PeerConnection (CAD la session de connexion WebRTC)
    pc = new PeerConnection(server, options);
    localStream = null;
    remoteStream = null;

    // Constraints de l'offre SDP. 
    constraints = {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    // définition de la variable channel
    channel = null;
    debugNbConnect = 0;

    // Etat des clients pour le signaling
    piloteCnxStatus = pc.iceConnectionState;
    robotCnxStatus = pc.iceConnectionState;


}
mainSettings();

//------ Phase 1 Pé-signaling ----------------------------------------------------------


// rejectConnexion', message:message, url:indexUrl);
socket.on('error', errorHandler);
socket.on('rejectConnexion', function(data) {
    alertAndRedirect(data.message, data.url)
})


// Récupération de la liste des devices (Version2)
// Voir: https://www.chromestatus.com/feature/4765305641369600
// MediaStreamTrack.getSources(gotSources) utilisée jusqu'a présent n'est implémentée que dans Chrome.
// La page https://developers.google.com/web/updates/2015/10/media-devices indique qu'à partir de la version 47
// sont implémentées de nouvelles méthodes crossBrowser: navigator.mediaDevices.enumerateDevices().
// Je passe donc par une méthode passerelle getAllAudioVideoDevices() qui switche entre les 2 méthodes
// selon les implémentation du navigateur.
var origin = "local"; // On prévient la fonction apellée que la source sera locale
getAllAudioVideoDevices(function(result) {
    populateListDevices(result,origin);
}, function(error) {
    if (error == null) error = "erreur getAllAudioVideoDevices()";
    alert(error);
});

// ---- Phase 2 Signaling --------------------------------------------------

// initialisation du localStream et appel connexion
function initLocalMedia() {
    console.log("* initLocalMedia() " + tools.humanDateER(""));
    
    // Récupération des caméras et micros selectionnés  
    var audioSource = local_AudioSelect.value;
    var videoSource = local_VideoSelect.value;

    var constraint = {
        audio: {
            optional: [{
                sourceId: audioSource
            }]
        },

        video: {
            optional: [{
                sourceId: videoSource
            }]
        }
    }

    // Initialisation du localStream et lancement connexion
    navigator.getUserMedia(constraint, function(stream) {
        
        localStream = stream;
        video1.src = URL.createObjectURL(localStream);
        
        if (type == "robot-typeB") {
            // On prévient l'autre pair qu'il peut lui aussi ouvrir sa caméra
            // et envoyer une offre
            socket.emit('readyForSignaling', {
                objUser: localObjUser,
                message: "ready"
            });
        }
        pc.addStream(localStream);
        connect();

    }, errorHandler);
};

// initialisation de la connexion
function connect() {
    console.log ("* connect() "+tools.humanDateER(""));
    // debugNbConnect += 1;
    // console.log("@ connect(" + debugNbConnect + ") > rôle: " + type);
    isStarted = true;


    // Ecouteurs de l'API WebRTC -----------------

    // Ecouteur déclenché à la génération d'un candidate 
    pc.onicecandidate = function(e) {
        // vérifie que le candidat ne soit pas nul
        if (!e.candidate) return;
        console.log("@ pc.onicecandidate // -- Send Candidate >>> ");
        // Envoi du candidate généré à l'autre pair
        socket.emit("candidate", e.candidate);
    };


    // Ecouteur déclenché a la reception d'un remoteStream
    pc.onaddstream = function(e) {
        console.log("@ pc.onaddstream > " + tools.humanDateER(""));
        remoteStream = e.stream;
        video2.src = URL.createObjectURL(remoteStream);
    };


    // Ecouteurs de changement de statut de connexion
    // Permet de déterminer si le pair distant s'est déconnecté.
    pc.oniceconnectionstatechange = function(e) {
        console.log("@ pc.oniceconnectionstatechange > " + tools.humanDateER(""));


        console.log(">>> iceConnectionState > " + pc.iceConnectionState);
        $(chatlog).prepend(tools.humanDateER("") + ' [iceConnectionState] ' + pc.iceConnectionState + '\n');
        //console.log(localStream.active);
        //console.log(remoteStream.active);

        // On informe l'autre pair de son statut de connexion   
        if (type == 'pilote-typeA') {
            piloteCnxStatus = pc.iceConnectionState;
            socket.emit("piloteCnxStatus", piloteCnxStatus);
            // Si on change de status suite à une déco du robot
            // On redéclenche l'ouverture des formulaires de connexion 
            // a la condition que le robot soit lui aussi prêt a se reconnecter... (new...)
            if (piloteCnxStatus == 'new' && robotCnxStatus == 'new') {
                activeManageDevices(); // On active les formulaires permettant de relancer la connexion
            }

        } else if (type == 'robot-typeB') {
            robotCnxStatus = pc.iceConnectionState;
            socket.emit("robotCnxStatus", robotCnxStatus);
        }
        /**/

        // On lance le processus de déconnexion pour préparer une reconnexion
        if (pc.iceConnectionState == 'disconnected') {
            onDisconnect();
        }
    };

    // .
    pc.onremovestream = function(e) {
        console.log("@ pc.onremovestream(e) > " + tools.humanDateER(""));
        console.log(e);
    }



    // Si on est l'apellant (pilote)
    if (type === "pilote-typeA") {
        
        // l'apellant crée un dataChannel
        channel = pc.createDataChannel("1to1-channel", {reliable:false});
        console.log("@ pc.createDataChannel('1to1-channel') > " + tools.humanDateER(""));
        // et il lance l'écouteur d'évènement sur ce datachannel
        bindEvents();
        /**/

        // création et envoi de l'offre SDP
        pc.createOffer(function(sdp){
                pc.setLocalDescription(sdp);
                console.log ("------------ Send Offer >>> "+tools.humanDateER(""));
                //var data = {from: localObjUser, message: sdp}
                
                // BUG > Robot(Chrome44) <> Pilote(Chrome51)
                // Error on Robot Client: 
                // -----------------------
                // >>> Uncaught (in promise) Failed to set remote offer sdp: 
                // >>> Session error code: ERROR_CONTENT. Session error description: Failed to set video send codecs..
                // >>> CreateAnswer can't be called before SetRemoteDescription.
                // ------------------------
                // Par contre si Pilote(Chrome44) <> Robot(Chrome51) > OK !

                /*// Tentative d'overWrite des codecs du l'offre sdp: Echec !!!
                // m=video 9 UDP/TLS/RTP/SAVPF 100 101 116 117 96 97 98 (Chrome 51)
                var stringCodecChrome51 = "m=video 9 UDP/TLS/RTP/SAVPF 100 101 116 117 96 97 98";
                // m=video 9 RTP/SAVPF 100 116 117 96 (Chrome 44)
                var stringCodecChrome44 = "m=video 9 RTP/SAVPF 100 116 117 96";
                sdp.sdp = sdp.sdp.replace(stringCodecChrome51,stringCodecChrome44);
                console.log (sdp.sdp);
                /**/


                socket.emit("offer", sdp);
            }
            , errorHandler, 
            constraints
        );


    // Sinon si on est l'apellé (Robot)
    } else if (type === "robot-typeB") {
   
        
        /*// answerer must wait for the data channel
        // Ecouteur d'ouverture d'un data channel
        // L'apellé doit attendre l'ouverture du datachannel
        // pour lancer son écouteur...
        pc.ondatachannel = function(e) {
            channel = e.channel;
            console.log("@ pc.ondatachannel(e)... "+tools.humanDateER(""));
            bindEvents();
        };
        /**/
    }
}


// L'apellé doit attendre de recevoir une offre SDP
// avant de générer une réponse SDP
socket.on("offer", function(data) {
    
    console.log ("------------ >>> Receive Offer "+tools.humanDateER(""));
   
        // answerer must wait for the data channel
        // Ecouteur d'ouverture d'un data channel
        // L'apellé doit attendre l'ouverture du datachannel
        // par l'apellant pour lancer son écouteur...
        pc.ondatachannel = function(e) {
            channel = e.channel;
            console.log("@ pc.ondatachannel(e)... "+tools.humanDateER(""));
            bindEvents();
        };


        var offer = new SessionDescription(data.message);
            
        // Une foi l'offre reçue et celle-ci enregistrée dans un setRemoteDescription,
        pc.setRemoteDescription(offer); 

        // création de la réponse SDP
        pc.createAnswer(function(sdp){
                pc.setLocalDescription(sdp);
                console.log ("------------ Send Answer >>> "+ tools.humanDateER("") );
                socket.emit("answer", sdp);
            }
            , errorHandler, 
            constraints
        );



});



// Réception d'une réponse à une offre
socket.on("answer", function(data) {
        console.log ("------------ >>> Receive Answer "+tools.humanDateER(""));
        pc.setRemoteDescription(new SessionDescription(data.message));
});

// Réception d'un ICE Candidate
socket.on("candidate", function(data) {
        console.log ("------------ >>>> Receive Candidate ");
        pc.addIceCandidate(new IceCandidate(data.message)); // OK
});



// ----- Phase 3 Post-Signaling --------------------------------------------

// Réception d'un ordre de déconnexion
socket.on("closeConnectionOrder",function(data) {
    console.log(">>> closeConnectionOrder from (" + data.placeListe + ")" + data.pseudo);
    // on lance le processus préparatoire a une reconnexion
    onDisconnect();
});


// A la déconnection du pair distant:
function onDisconnect() {

    console.log("* onDisconnect() "+ tools.humanDateER(""));

    // On vérifie le flag de connexion
    if (isStarted == false) return;

    // on retire le flux remoteStream
    video1.src = "";
    video2.src = "";

    // on coupe le RTC Data channel
    if (channel) channel.close();
    channel = null;

    // On vide et on ferme la connexion courante
    pc.close();
    pc = null;

    stopAndStart();
}

// Fermeture et relance de la connexion p2p par le client B (Robot)
function stopAndStart() {

    console.log("* stopAndStart() "+tools.humanDateER(""));
    input_chat_WebRTC.disabled = true;
    input_chat_WebRTC.placeholder = "RTCDataChannel close";
    env_msg_WebRTC.disabled = true;

    pc = new PeerConnection(server, options);
};

// -------------------- Méthodes RTCDataChannel ----------------------

// bind the channel events
function bindEvents() {

    console.log("@ channel.onopen() "+tools.humanDateER(""));

    // écouteur d'ouverture
    channel.onopen = function() {
        console.log("* bindEvents() "+tools.humanDateER(""));

        input_chat_WebRTC.focus();
        input_chat_WebRTC.placeholder = "RTCDataChannel is Open !";
        input_chat_WebRTC.disabled = false;
        env_msg_WebRTC.disabled = false;
    };

    // écouteur de reception message
    channel.onmessage = function(e) {
        var dateR = tools.humanDateER("");
        console.log("@ channel.onmessage() "+dateR);
        // si c'est un message de type string
        if (tools.isJson(e.data) == false) {
            $(chatlog).prepend(dateR+ ' ' + e.data + "\n");
        }
    };
}

// envoi message par WebRTC
function sendMessage() {
    console.log("* sendMessage() "+tools.humanDateER(""));
    var dateE = tools.humanDateER("");
    var msgToSend = ' [' + localObjUser.typeClient + '] ' + message.value;
    channel.send(msgToSend);
    message.value = "";
    // Affiche le message dans le chatlog websocket
    $(chatlog).prepend(dateE+" "+msgToSend + "\n");
}


// Bouton d'envoi du formulaire de chat WebRTC
$('#formulaire_chat_webRTC').submit(function() {
    var message = $('#send_chat_WebRTC').val() + '\n';
    channel.send(msg);
    message.value = "";
    $('#send_chat_WebRTC').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// --------------------- Messages d'erreur & contôles d'accès ------------------

function errorHandler(err) {
    console.log("ON-ERROR");
    console.error(err);
}

function alertAndRedirect(message, url) {
    window.alert(message)
    window.location.href = url;
}

// Pour débugg:
video1.addEventListener("playing", function () {
    var dateR = tools.humanDateER("");
    var LocalStreamDef = "LocalStream: " + video1.videoWidth + "x" + video1.videoHeight
    console.log (LocalStreamDef)
    $(chatlog).prepend(dateR + ' ' + LocalStreamDef + "\n");
});

video2.addEventListener("playing", function () {
    var dateR = tools.humanDateER("");
    var RemoteStreamDef = "RemoteStream: " + video1.videoWidth + "x" + video1.videoHeight
    console.log (RemoteStreamDef)
    $(chatlog).prepend(dateR + ' ' + RemoteStreamDef + "\n");
});