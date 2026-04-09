import exchangeCodeHandler from "../../api/exchange-code.js";
import { withNodeHandler } from "./_lib/node-handler.js";

export const handler = withNodeHandler(exchangeCodeHandler);
