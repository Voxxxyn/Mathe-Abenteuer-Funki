/* Mathe-Abenteuer (Funki) – zentrale Versionsangaben.
   Bei jeder neuen Version: APP hier erhöhen UND VERSION in service-worker.js anpassen (tests prüfen, dass beide passen). */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};
  MA.VERSION = {
    app: '2.0.0',      // angezeigte App-Version (Elternbereich)
    schema: 2,         // Version des Speicherformats (localStorage / Export)
    appId: 'mathe-abenteuer-funki'
  };
})(typeof window !== 'undefined' ? window : globalThis);
