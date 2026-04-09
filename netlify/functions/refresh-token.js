import refreshTokenHandler from "../../api/refresh-token.js";
import { withNodeHandler } from "./_lib/node-handler.js";

export const handler = withNodeHandler(refreshTokenHandler);
