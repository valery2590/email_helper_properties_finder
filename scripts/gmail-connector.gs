/**
 * ==============================================================================
 * PROPFINDER BCN - CONECTOR DE GMAIL (Google Apps Script)
 * ==============================================================================
 * Este script automatiza la lectura de correos de alertas inmobiliarias en tu Gmail
 * (Idealista, Fotocasa, Habitaclia, Yaencontre, etc.) y los envía al motor financiero
 * de tu aplicación para calcular viabilidad, cuota francesa, ITP y comparador broker.
 *
 * INSTRUCCIONES DE INSTALACIÓN (2 MINUTOS):
 * 1. Abre tu navegador y entra en: https://script.google.com/
 * 2. Haz clic en el botón superior izquierdo: "Nuevo proyecto" (o "+ New project").
 * 3. Borra el código de ejemplo que aparece y pega TODO este archivo.
 * 4. Ajusta la variable WEBHOOK_URL abajo con la URL de tu app:
 *    - Si ya está desplegada (ej. Vercel): https://tu-dominio.vercel.app/api/webhook?lang=es
 *    - Si la estás probando en local: usa tu túnel de ngrok (ej. https://xxxx.ngrok-free.app/api/webhook?lang=es)
 * 5. Haz clic en el icono de Disco (Guardar) y pulsa "Ejecutar" una vez para conceder permisos de lectura a tu Gmail.
 * 6. Ve al menú de la izquierda, haz clic en "Disparadores" (icono de reloj ⏰) -> "Añadir activador":
 *    - Función que se debe ejecutar: syncGmailAlerts
 *    - Selecciona origen del evento: Basado en tiempo
 *    - Tipo de temporizador: Temporizador de minutos
 *    - Intervalo de minutos: Cada 5 minutos (o 10 minutos).
 *    - Haz clic en Guardar. ¡Listo!
 * ==============================================================================
 */

const CONFIG = {
  // 1. URL pública de tu endpoint Webhook en Next.js
  WEBHOOK_URL: 'https://tu-dominio.vercel.app/api/webhook?lang=es',

  // 2. Filtro de búsqueda en tu Gmail (portales más frecuentes)
  SEARCH_QUERY: 'is:unread (from:idealista.com OR from:fotocasa.es OR from:habitaclia.com OR from:yaencontre.com OR from:pisos.com OR subject:"alerta inmobiliaria" OR subject:"nuevo piso")',

  // 3. Etiquetas automáticas en Gmail para clasificar tus correos por colores
  LABEL_PROCESSED: 'PropFinder/Procesado',
  LABEL_VIABLE: 'PropFinder/Viable-Directo',
  LABEL_BROKER_VIABLE: 'PropFinder/Viable-Con-Broker',
  LABEL_NOT_VIABLE: 'PropFinder/No-Viable',

  // 4. Idioma de análisis ('es' o 'it')
  LANG: 'es',

  // 5. Clave de seguridad opcional (si decides activarla en tu webhook)
  API_SECRET: 'mi-clave-secreta-propfinder'
};

/**
 * Función principal ejecutada periódicamente por el temporizador
 */
function syncGmailAlerts() {
  // Aseguramos que existan las etiquetas en Gmail
  const labelProcessed = getOrCreateLabel(CONFIG.LABEL_PROCESSED);
  const labelViable = getOrCreateLabel(CONFIG.LABEL_VIABLE);
  const labelBroker = getOrCreateLabel(CONFIG.LABEL_BROKER_VIABLE);
  const labelNotViable = getOrCreateLabel(CONFIG.LABEL_NOT_VIABLE);

  // Buscamos correos no leídos
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 10);

  if (threads.length === 0) {
    Logger.log('ℹ️ No hay correos nuevos de portales inmobiliarios pendientes.');
    return;
  }

  Logger.log(`📬 Se han encontrado ${threads.length} hilos de correo nuevos.`);

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();

    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];

      if (message.isUnread()) {
        const subject = message.getSubject();
        const from = message.getFrom();
        const date = message.getDate();
        const htmlBody = message.getBody();

        Logger.log(`🔍 Analizando email: "${subject}" de [${from}]`);

        // Estructura enviada al webhook
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

        const fetchOptions = {
          method: 'post',
          contentType: 'application/json',
          headers: {
            'x-api-key': CONFIG.API_SECRET
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        try {
          const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, fetchOptions);
          const statusCode = response.getResponseCode();
          const responseText = response.getContentText();

          if (statusCode >= 200 && statusCode < 300) {
            const data = JSON.parse(responseText);
            Logger.log(`✅ Evaluado con éxito (HTTP ${statusCode}). Inmuebles detectados: ${data.stats ? data.stats.receivedCount : 0}`);

            // Clasificación automática de la etiqueta en Gmail según viabilidad
            if (data.results && data.results.length > 0) {
              const bestResult = data.results[0];

              if (bestResult.status === 'VIABLE') {
                thread.addLabel(labelViable);
                thread.markImportant(); // Le pone la flecha amarilla de importante
                Logger.log(`⭐ Inmueble VIABLE DIRECTO encontrado: ${bestResult.property.title} (${bestResult.propertyPrice} €)`);
              } else if (data.brokerScenariosComparison && data.brokerScenariosComparison.some(s => s.status === 'VIABLE' && s.ltvPercent > 80)) {
                thread.addLabel(labelBroker);
                Logger.log(`🤝 Inmueble VIABLE MEDIANTE BROKER (90%-100%): ${bestResult.property.title}`);
              } else {
                thread.addLabel(labelNotViable);
                Logger.log(`⚠️ Inmueble no viable financieramente (>40% DTI): ${bestResult.property.title}`);
              }
            }

            if (data.notificationSummary) {
              Logger.log(`\n--- RESUMEN FINANCIERO ---\n${data.notificationSummary}`);
            }
          } else {
            Logger.log(`❌ Error devuelto por el servidor (HTTP ${statusCode}): ${responseText}`);
          }
        } catch (error) {
          Logger.log(`⚠️ Excepción de conexión: ${error.toString()}`);
        }

        // Marcamos como leído para no repetir el proceso
        message.markRead();
      }
    }

    // Marcamos el hilo completo como procesado por PropFinder
    thread.addLabel(labelProcessed);
  }
}

/**
 * Función auxiliar para obtener o crear etiquetas en Gmail
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}
