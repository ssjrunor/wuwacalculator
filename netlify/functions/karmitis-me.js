import karmitisMeHandler from "../../api/karmitis-me.js";
import { withNodeHandler } from "./_lib/node-handler.js";

export const handler = withNodeHandler(karmitisMeHandler);
