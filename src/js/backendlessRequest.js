export default async function backendlessRequest(
  action,
  data = {},
  userToken = null
) {
  const response = await fetch("/.netlify/functions/backendlessHandler", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      data,
      userToken,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Errore dalla serverless.");
  }

  return json;
}
