import { getValue } from "/src/js/indexedDButils.js";

export default async function shouldUseServer() {
  if (!navigator.onLine) return false;
  else if (await getValue("userNotes")) return false;
  else if (!(await getValue("userNotes"))) return true;
}
