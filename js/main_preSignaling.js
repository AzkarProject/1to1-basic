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
exportMediaDevices = [];


// Récupération de la liste des devices (Version2)
// Voir: https://www.chromestatus.com/feature/4765305641369600
// MediaStreamTrack.getSources(gotSources) utilisée jusqu'a présent n'est implémentée que dans Chrome.
// La page https://developers.google.com/web/updates/2015/10/media-devices indique qu'à partir de la version 47
// sont implémentées de nouvelles méthodes crossBrowser: navigator.mediaDevices.enumerateDevices().
// Je passe donc par cette méthode passerelle getAllAudioVideoDevices() qui switche entre les 2 méthodes
// selon les implémentation du navigateur.
// Adapté de  http://stackoverflow.com/questions/14610945/how-to-choose-input-video-device-for-webrtc
function getAllAudioVideoDevices(successCallback, failureCallback) {

    var allMdiaDevices = [];
    var allAudioDevices = [];
    var allVideoDevices = [];

    var audioInputDevices = [];
    var audioOutputDevices = [];
    var videoInputDevices = [];
    var videoOutputDevices = [];

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Firefox 38+, Microsoft Edge, and Chrome 44+ seems having support of enumerateDevices
        navigator.enumerateDevices = function(callback) {
            navigator.mediaDevices.enumerateDevices().then(callback);
        };
    }

    else if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
        navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
    }

    else {
        failureCallback(null, 'Neither navigator.mediaDevices.enumerateDevices navigator MediaStreamTrack.getSources are available.');
        return;
    }

    var allMdiaDevices = [];
    var allAudioDevices = [];
    var allVideoDevices = [];

    var audioInputDevices = [];
    var audioOutputDevices = [];
    var videoInputDevices = [];
    var videoOutputDevices = [];

    navigator.enumerateDevices(function(devices) {
        devices.forEach(function(_device) {
            var device = {};
            for (var d in _device) {
                device[d] = _device[d];
            }

            // make sure that we are not fetching duplicate devics
            var skip;
            allMdiaDevices.forEach(function(d) {
                if (d.id === device.id) {
                    skip = true;
                }
            });

            if (skip) {
                return;
            }

            // if it is MediaStreamTrack.getSources
            if (device.kind === 'audio') {
                device.kind = 'audioinput';
            }

            if (device.kind === 'video') {
                device.kind = 'videoinput';
            }

            if (!device.deviceId) {
                device.deviceId = device.id;
            }

            if (!device.id) {
                device.id = device.deviceId;
            }

            if (!device.label) {
                device.label = 'Please invoke getUserMedia once.';
            }

            if (device.kind === 'audioinput' || device.kind === 'audio') {
                audioInputDevices.push(device);
            }

            if (device.kind === 'audiooutput') {
                audioOutputDevices.push(device);
            }

            if (device.kind === 'videoinput' || device.kind === 'video') {
                videoInputDevices.push(device);
            }

            if (device.kind.indexOf('audio') !== -1) {
                allAudioDevices.push(device);
            }

            if (device.kind.indexOf('video') !== -1) {
                allVideoDevices.push(device);
            }

            // there is no 'videoouput' in the spec.
            // so videoOutputDevices will always be [empty]

            allMdiaDevices.push(device);
        });

        if (successCallback) {
            successCallback({
                allMdiaDevices: allMdiaDevices,
                allVideoDevices: allVideoDevices,
                allAudioDevices: allAudioDevices,
                videoInputDevices: videoInputDevices,
                audioInputDevices: audioInputDevices,
                audioOutputDevices: audioOutputDevices
            });
        }
    });
}

// Affectation et traitement des résultats générées par getAllAudioVideoDevices()
function populateListDevices(result,sourceDevices) {

    // Si sources locales (pilote)
    if (sourceDevices == "local") {
        listeLocalSources = result;
    // Si sources distantes (Robot)
    } else if (sourceDevices == "remote") {
        listeRemoteSources = result;
    }

    // BUG: Double affichage des options remoteDevices en cas de déco/reco du Robot.
    // FIX ==> On vide la liste du formulaire de ses options.
    // Comment ==> En supprimant tous les enfants du nœud
    if (sourceDevices == "remote") {
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

    
    
    
    if (sourceDevices == "remote") {

        result.forEach(function(sourceInfo) {
            populateFormDevices(sourceInfo,sourceDevices)
        });
    

    } else if (sourceDevices == "local") {

        var countEatch = 0;
        result.allMdiaDevices.forEach(function(sourceInfo) {

            populateFormDevices(sourceInfo,sourceDevices)

            // BUG: Quand il sont construit sous chrome V47 les objets javascript natif "device" 
            // retournés par navigator.mediaDevices.enumerateDevices() sont impossible à sérialiser 
            // ils plantent sur 'JSON.stringify(...)' bien qu'on puisse leur faire un 'JSON.parse(...)'.
            // Quand on les envoie par websocket, ca provoque systématiquement un "illegal invoke" ds socket.io.
            // FIX: comme il est impossible de cloner proprement l'objet, il faut le reconstuire propriétés par propriétés.
            var exportDevice = new tools.sourceDevice();
            exportDevice.id = sourceInfo.id;
            exportDevice.label = sourceInfo.label;
            exportDevice.kind = sourceInfo.kind;
            exportDevice.facing = sourceInfo.facing;
            exportMediaDevices[countEatch] = exportDevice;
            countEatch ++;

        });

        if (type == "robot-typeB") socket.emit('remoteListDevices', {listeDevices: exportMediaDevices}); 
    
    } 
    
    // On fait un RAZ du flag d'origine
    sourceDevices = null;
}

// Génération des listes de devices pour les formulaires
function populateFormDevices(device,sourceDevices) {

    var option = document.createElement('option');
    option.id = device.id;
    option.value = device.id;

    if (device.kind === 'audioinput' || device.kind === 'audio') {

        if (sourceDevices == "local") {
            option.text = device.label || 'localMicro ' + (local_AudioSelect.length + 1) + ' (ID:' + device.id + ')';
            local_AudioSelect.appendChild(option);

        } else if (sourceDevices == "remote") {
            option.text = device.label || 'RemoteMicro ' + (remote_AudioSelect.length + 1) + ' (ID:' + device.id + ')';
            remote_AudioSelect.appendChild(option);
        } 


    } else if (device.kind === 'videoinput'|| device.kind === 'video') {

        if (sourceDevices == "local") {
            option.text = device.label || 'localCam ' + (local_VideoSelect.length + 1) + ' (ID:' + device.id + ')';
            local_VideoSelect.appendChild(option);

        } else if (sourceDevices == "remote") {
            option.text = device.label || 'RemoteCam ' + (remote_VideoSelect.length + 1) + ' (ID:' + device.id + ')';
            remote_VideoSelect.appendChild(option);
        } 

    } else {

        console.log('Some other kind of source: ', device);

    }
}


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

        // On renseigne  le flag d'ogigine
        var origin = "remote";

        // On construit la listes des micro/caméra distantes
        populateListDevices(data.listeDevices,origin);
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
    users = data;

    // si on est l'apellé  (Robot)
    // On renvoie à l'autre pair la liste de ses devices
    
    if (type == "robot-typeB") {

        if ( tools.isEmpty(listeLocalSources) == false) {
            socket.emit('remoteListDevices', {listeDevices: exportMediaDevices});
        }

        // On lui envoie ensuite son etat de connexion
        robotCnxStatus = pc.iceConnectionState;
        socket.emit("robotCnxStatus", robotCnxStatus);
    }

    // si on est l'apellant (Pilote)
    if (type == "pilote-typeA") {
        // todo
    }
})
