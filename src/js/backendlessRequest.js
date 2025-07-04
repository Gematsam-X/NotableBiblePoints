/**
 * Funzione riutilizzabile per chiamare la serverless function backendlessHandler
 * @param {string} action - L'azione da eseguire ("login", "register", "saveData", etc)
 * @param {object} data - Dati da inviare
 * @param {object} [extra] - Parametri extra (es. { token, objectId, table })
 * @returns {Promise<object>} - Risposta JSON della funzione serverless
 */
export default async function backendlessRequest(
  action,
  data = {},
  extra = {}
) {
  const payload = {
    action,
    data,
    ...extra,
  };

  const response = await fetch("/.netlify/functions/backendlessHandler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Errore generico da backendlessHandler");
  }

  return json;
}
