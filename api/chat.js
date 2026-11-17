import { ai, route } from './_lib/http.js';
export default route((b) => ai.chat({ message: b.message, context: b.context, long: b.long }));
