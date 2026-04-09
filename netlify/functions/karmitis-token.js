import karmitisTokenHandler from "../../api/karmitis-token.js";
import { withNodeHandler } from "./_lib/node-handler.js";

export const handler = withNodeHandler(karmitisTokenHandler);
