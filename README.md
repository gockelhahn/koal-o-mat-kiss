# qual-o-mat-kiss

Dieses Repository enthält einen simplen POC (Proof of concept) eines "Wahl-*tools*", welcher mit JSON Daten wie in [https://github.com/gockelhahn/qual-o-mat-data] gefüttert werden kann.

## Preview

[https://cdn.rawgit.com/gockelhahn/qual-o-mat-kiss/master/index.html]

## Setup

Da es sich hier um reines HTML(5) und clientseitiges JavaScript handelt, braucht man die Dateien einfach nur auf einen Webserver packen und die Datei *index.html* im Browser aufrufen.

## Konfiguration

In der Datei *js/common.js* wird mit der Variable **data_url** die Herkunft der zu benutzenden Daten definiert.
```javascript
var data_url = 'https://raw.githubusercontent.com/gockelhahn/qual-o-mat-data/master';
```
Für selbst gehostete Daten, kann man auch einen relativen Pfad setzen.

## Offline Modus

Natürlich kann man das Ganze auch ohne Webserver von der lokalen Platte laden. Dazu einfach alle Dateien in einen Ordner legen und die oben genannte Variable auf einen relativen Pfad setzen:
```javascript
var data_url = 'data';
```
In diesem Unterordner müssen dann die Daten, die man benutzen möchte, abgelegt werden.

*Hinweis*:
Da Chromium/Google Chrome XMLHttpRequest (XHR) auf "file:///" defaultmäßig verbietet, muss man diese Browser für eine funktionierende Offline-Unterstützung mit dem folgenden Parameter starten:
```
--allow-file-access-from-files
```

## Lizenz

Für alle Dateien in diesem Repository gilt [folgende Lizenz](LICENSE.md).
