/**
 * CONECTOR DE GMAIL A PROPFINDER BCN (Google Apps Script)
 * 
 * Instrucciones de instalación:
 * 1. Entra en https://script.google.com/
 * 2. Haz clic en "Nuevo proyecto".
 * 3. Pega este código reemplazando todo el contenido de Code.gs.
 * 4. Cambia WEBHOOK_URL por tu URL de despliegue (ej. https://tu-app.vercel.app/api/webhook o ngrok).
 * 5. Haz clic en "Disparadores" (icono de reloj en la barra lateral izquierda) y añade:
 *    - Función: syncGmailAlerts
 *    - Origen: Según tiempo (basado en tiempo)
 *    - Tipo: Temporizador de minutos (cada 5 o 10 minutos).
 */

const CONFIG = {
  // Cambia esto por la URL pública de tu aplicación en Next.js
  WEBHOOK_URL: 'https://tu-dominio.vercel.app/api/webhook?lang=es',
  
  // Clave secreta opcional para proteger tu endpoint
  API_SECRET: 'mi-clave-secreta-propfinder',
  
  // Filtro de búsqueda en Gmail (puedes añadir o quitar portales)
  SEARCH_QUERY: 'is:unread (from:idealista.com OR from:fotocasa.es OR from:habitaclia.com OR subject:"alerta inmobiliaria" OR subject:"nuevo piso")',
  
  // Etiqueta que se le pondrá en Gmail al procesarlo para no duplicar
  PROCESSED_LABEL: 'PropFinder/Procesado',
  
  // Idioma de la evaluación ('es' o 'it')
  LANG: 'es'
};

function syncGmailAlerts() {
  // Aseguramos que la etiqueta exista en Gmail
  let label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }

  // Buscamos hilos no leídos de portales inmobiliarios
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 10);
  
  if (threads.length === 0) {
    Logger.log('No hay nuevos correos de alertas inmobiliarias sin leer.');
    return;
  }

  Logger.log(`Se encontraron ${threads.length} hilos para procesar.`);

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      
      if (message.isUnread()) {
        const subject = message.getSubject();
        const htmlBody = message.getBody();
        const from = message.getFrom();
        const date = message.getDate();

        Logger.log(`Procesando mensaje: "${subject}" de ${from}`);

        // Enviamos el HTML completo a nuestro webhook de Next.js
        const payload = {
          html: htmlBody,
          lang: CONFIG.LANG,
          metadata: {
            subject: subject,
            from: from,
            date: date.toISOString(),
            messageId: message.getId()
          }
        };

        const options = {
          method: 'post',
          contentType: 'application/json',
          headers: {
            'x-api-key': CONFIG.API_SECRET
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        try {
          const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
          const responseCode = response.getResponseCode();
          const responseText = response.getContentText();

          if (responseCode >= 200 && responseCode < 300) {
            Logger.log(`Éxito al enviar mensaje ${message.getId()}: HTTP ${responseCode}`);
            const result = JSON.parse(responseText);
            
            // Si el webhook devolvió el resumen de notificación, lo registramos
            if (result.notificationSummary) {
              Logger.log('Resumen de viabilidad:\n' + result.notificationSummary);
            }
          } else {
            Logger.log(`Error al enviar mensaje ${message.getId()}: HTTP ${responseCode} - ${responseText}`);
          }
        } catch (error) {
          Logger.log(`Excepción al conectar con el webhook: ${error.toString()}`);
        }

        // Marcamos el mensaje como leído y añadimos la etiqueta
        message.markRead();
      }
    }
    
    thread.addLabel(label);
  }
}
