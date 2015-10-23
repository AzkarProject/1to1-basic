// pré-signaling -------------------------------------------------

// sélecteurs de micros et caméras
local_AudioSelect = document.querySelector('select#local_audioSource');
local_VideoSelect = document.querySelector('select#local_videoSource');

// sélecteurs de micros et caméras (robot) affiché coté pilote 
remote_AudioSelect = document.querySelector('select#remote_audioSource');
remote_VideoSelect = document.querySelector('select#remote_videoSource');

// Pour visualiser toutes les cams dispo coté Robot,
// on laisse par défaut l'affichage des devices.
local_AudioSelect.disabled = false;
local_VideoSelect.disabled = false;

// (pilote-Appelant) > Activation/Désativation préalable 
// Du formulaire de sélection des devices locaux et de demande de connexion
if (type == "pilote-appelant") {
    remote_ButtonDevices.disabled = true;
    local_ButtonDevices.disabled = true;
    //remote_AudioSelect.disabled = true; 
    //remote_VideoSelect.disabled = true; 
    local_AudioSelect.disabled = true;
    local_VideoSelect.disabled = true;
}

// Liste des sources cam/micro
listeLocalSources = {};
listeRemoteSources = {};
// flag d'origine des listes (local/remote)
origin = null;
/**/

// Génération des listes de sélection sources (cam/micro) 
// disponibles localement et a distance
function gotSources(sourceInfos) {

    console.log("* gotSources()" + tools.humanDateER(""));
    //console.log(sourceInfos);

    // Si sources locales (pilote)
    if (origin == "local") {
        listeLocalSources = sourceInfos;

        // Si sources distantes (Robot)
    } else if (origin == "remote") {
        listeRemoteSources = sourceInfos;

    }

    // BUG: Double affichage des options remoteDevices en cas de déco/reco du Robot.
    // FIX ==> On vide la liste du formulaire de ses options.
    // Comment ==> En supprimant tous les enfants du nœud
    if (origin == "remote") {
        // On supprime tous les enfants du noeud précédent...
        while (remote_AudioSelect.firstChild) {
            // La liste n'étant pas une copie, elle sera réindexée à chaque appel
            remote_AudioSelect.removeChild(remote_AudioSelect.firstChild);
        }
        // Idem pour le noeud video
        while (remote_VideoSelect.firstChild) {
            remote_VideoSelect.removeChild(remote_VideoSelect.firstChild);
        }
    }

    for (var i = 0; i !== sourceInfos.length; ++i) {

        var sourceInfo = sourceInfos[i];
        var option = document.createElement('option');
        option.id = sourceInfo.id;
        option.value = sourceInfo.id;

        // Reconstruction de l'objet javascript natif sourceInfo:
        // Quand il est construit sous chromium et transmit par websocket
        // vers Chrome impossible d'accéder à ses attributs une foi transmit... 
        // Ce qui est bizarre, c'est que l'objet natif semble tout à fait normal avant transmission.
        // Par contre, R.A.S quand on le transmet de Chrome à Chrome ou de Chromium à chromium.
        var sourceDevice = new tools.sourceDevice();
        sourceDevice.id = sourceInfo.id;
        sourceDevice.label = sourceInfo.label;
        sourceDevice.kind = sourceInfo.kind;
        sourceDevice.facing = sourceInfo.facing;
        sourceInfos[i] = sourceDevice;

        // Conflit webcam Chromium/Chrome si même device choisi sur le PC local
        // >>> L'ID fournie par L'API MediaStreamTrack.getSources est différente
        // selon le navigateur et ne permet pas de différencier cams et micros correctement
        // TODO: Trouver une solution de contournement pour les tests interNavigateurs sur une même machine

        if (sourceInfo.kind === 'audio') {

            if (origin == "local") {
                option.text = sourceInfo.label || 'localMicro ' + (local_AudioSelect.length + 1) + ' (ID:' + sourceInfo.id + ')';
                local_AudioSelect.appendChild(option);

            } else if (origin == "remote") {
                option.text = sourceInfo.label || 'RemoteMicro ' + (remote_AudioSelect.length + 1) + ' (ID:' + sourceInfo.id + ')';
                remote_AudioSelect.appendChild(option);
            }


        } else if (sourceInfo.kind === 'video') {

            if (origin == "local") {
                option.text = sourceInfo.label || 'localCam ' + (local_VideoSelect.length + 1) + ' (ID:' + sourceInfo.id + ')';
                local_VideoSelect.appendChild(option);

            } else if (origin == "remote") {
                option.text = sourceInfo.label || 'RemoteCam ' + (remote_VideoSelect.length + 1) + ' (ID:' + sourceInfo.id + ')';
                remote_VideoSelect.appendChild(option);
            }

        } else {

            console.log('Some other kind of source: ', sourceInfo);

        }
    }

    // On fait un RAZ du flag d'origine
    origin = null;
}
/**/

// IHM Pilote
// Ouverture du premier des formulaires de selection des devices
// Et par conséquence dévérouillage du lancement de la connexion
function activeManageDevices() {

    console.log("* activeManageDevices() "+tools.humanDateER(""));

    // On active les sélecteurs de listes
    remote_ButtonDevices.disabled = false;
    remote_AudioSelect.disabled = false;
    remote_VideoSelect.disabled = false;

    // Une petite animation CSS pour visualiser l'invite de formulaire...
    document.getElementById("robotDevices").className = "insideFlex oneQuarterbox robot shadowGreen devicesInvite";
}
/**/


// IHM Pilote:
// Traitement du formulaire de selection des devices du robot
// et ouverture du formulaire de selection des devices du pilote 
// Avec animation CSS d'invite du formulaire
function remoteManageDevices() {

    console.log("* remoteManageDevices() "+tools.humanDateER(""));
    // Activation
    if (type == "pilote-typeA") {
        local_ButtonDevices.disabled = false;
    }
    local_AudioSelect.disabled = false;
    local_VideoSelect.disabled = false;

    // Invite de formulaire...
    document.getElementById("piloteDevices").className = "insideFlex oneQuarterbox pilote devices shadowGreen devicesInvite";
}
/**/

// IHM Pilote:
// Au submit du bouton d'ouverture de connexion -> 
// > Désactivation des formulaires remote et local de selection des devices
// > Animation CSS de désactivation
// > Envoi au robot des settings de benchmarks
// > Envoi au Robot la liste des devices à activer.
function localManageDevices() {

    console.log("* localManageDevices() "+ tools.humanDateER(""));
    if (type == "pilote-typeA") {
        local_ButtonDevices.disabled = true;
    }

    local_AudioSelect.disabled = true;
    local_VideoSelect.disabled = true;

    remote_ButtonDevices.disabled = true;
    remote_AudioSelect.disabled = true;
    remote_VideoSelect.disabled = true;

    // Animation CSS de désactivation du formulaire devices robot...
    document.getElementById("robotDevices").className = "insideFlex oneQuarterbox  robot devices shadowBlack device";

    // On balance au robot les paramètres de benchmarkings 
    // socket.emit('settingBenchmarks', {objUser:localObjUser,listeDevices:selectList}); // Version Objet

    // On balance coté robot les devices sélectionnés...
    if (type == "pilote-typeA") {
        var selectAudio = remote_AudioSelect.value;
        var selectVideo = remote_VideoSelect.value;
        var selectList = {
            selectAudio, selectVideo
        };
        // Coté serveur >> socket.broadcast.emit('selectedRemoteDevices', {objUser:data.objUser, listeDevices:data.listeDevices});
        socket.emit('selectedRemoteDevices', {
            objUser: localObjUser,
            listeDevices: selectList,
        }); 

        // Animation CSS de désactivation du formulaire devices pilote...
        document.getElementById("piloteDevices").className = "insideFlex oneQuarterbox pilote devices shadowBlack device";
    }
}


// -- > ecouteurs webSocket de pré-signaling

// Ecouteurs Websockets exclusifs au Pilote (appelant)
if (type == "pilote-typeA") {

    // Reception de la liste des Devices du Robot V2 (version objet)
    // coté serveur >> socket.broadcast.emit('remoteListDevices', {objUser:data.objUser, listeDevices:data.listeDevices});
    socket.on('remoteListDevices', function(data) {
        console.log(">> socket.on('remoteListDevices',...)" + tools.humanDateER(""));

        // console.log(data.listeDevices);
        // console.log("--------------------------------------");

        // On renseigne  le flag d'ogigine
        origin = "remote";

        // On alimente les listes de micro/caméra distantes
        gotSources(data.listeDevices);

    })

    // Reception du signal de fin pré-signaling
    socket.on("readyForSignaling", function(data) {
        console.log(">> socket.on('readyForSignaling',...)" + tools.humanDateER(""));

        if (data.message == "ready") {
            initLocalMedia();
        }
    })


    // Reception du statut de connexion du robot
    socket.on("robotCnxStatus", function(data) {
        robotCnxStatus = data.message;
        // On vérifie l'état de sa propre connexion et de celle du robot
        if (piloteCnxStatus == 'new' && robotCnxStatus == 'new') {
            activeManageDevices(); // On acive les formulaires permettant de relancer la connexion
        }
    });
}

// Ecouteurs Websockets exclusifs au Robot (appelé)
if (type == "robot-typeB") {

    // Reception cam et micro selectionnés par le pilote (apellant) V2 Objet
    // Coté serveur >> socket.broadcast.emit('selectedRemoteDevices', {objUser:data.objUser, listeDevices:data.listeDevices});
    socket.on('selectedRemoteDevices', function(data) {
        console.log(">> socket.on('selectedRemoteDevices',...) "+tools.humanDateER(""));

        // On rebalance au formulaire les caméras/micros choisies par le pilote
        document.getElementById(data.listeDevices.selectAudio).selected = "selected";
        document.getElementById(data.listeDevices.selectVideo).selected = "selected";

        // On lance l'initlocalmedia
        initLocalMedia();

        var infoMicro = "<strong> Micro Activé </strong>"
        var infoCam = "<strong> Caméra Activée </strong>"
        document.getElementById("messageDevicesStateMicro").innerHTML = infoMicro;
        document.getElementById("messageDevicesStateCams").innerHTML = infoCam;

    })

    // Reception du statut de connexion du pilote
    socket.on("pilotetCnxStatus", function(data) {
        piloteCnxStatus = data.message;
    });

}

// Quand on reçoit une mise à jour de la liste 
// des connectés de cette session websocket
// C.A.D un nouvel arrivant...
socket.on('updateUsers', function(data) {

    console.log(">> socket.on('updateUsers',...)" + tools.humanDateER(""));
    // On met à jour la liste locale des connectés...
    // console.log(data);
    users = data;
    //console.log(users);
    //console.log(type);

    // si on est l'apellé  (Robot)
    // On renvoie à l'autre pair la liste de ses devices
    if (type == "robot-typeB") {
        socket.emit('remoteListDevices', {
            objUser: localObjUser,
            listeDevices: listeLocalSources
        });
        // On lui envoie ensuite son etat de connexion
        robotCnxStatus = pc.iceConnectionState;
        socket.emit("robotCnxStatus", robotCnxStatus);
    }

    // si on est l'apellant (Pilote)
    // ... En cas de besoin...
    if (type == "pilote-typeA") {
        // 1 on vérifie l'état de sa propre connexion
    }
})
