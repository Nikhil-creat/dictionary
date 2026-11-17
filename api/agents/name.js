import { ai, route } from '../_lib/http.js';
export default route((b) => ai.name({ name: b.name }));
