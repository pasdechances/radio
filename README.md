# RadioProject
Il s'agit d'une version low syncr d'une radio.

## Fonctions serveur actuelles : 

 - Split d'un fichier audio en segment d'une seconde.
 - Broadcast des segment audio toutes seconde.
 - Exposition d'une interface graphique low.
 - Utilise une source externe via API pour récupérer un fichier audio.
 - Préload le fichier X temps avant la fin du fichier courrant.
 - Les titre change aléatoirement (API).

## Améliorations possibles

### front
- il faudrait que les clients purgent le lecteur de temps à autre.
- améliorer la syncro du lecteur.
- interagir avec cette chronologie pour réécouter un passage en syncr.
- revenir sur le titre précédent.
- changer le composant audio pour du WAA(Web Audio API).

### back
- réaliser des "room" avec différentes pistes audio.
- brodcaster les commandes play/stop.
- brodcaster la chronologie client et la syncr.
- revenir sur le titre précédent.


## installation

prérequis : 
npm et https://ffmpeg.org/download.html

installation : 

    cd /opt/
    git clone https://github.com/pasdechances/radio.git
    cd radio
    npm i
    node server.js
