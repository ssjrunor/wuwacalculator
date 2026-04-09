import karmitisBackupHandler from "../../api/karmitis-backup.js";
import { withNodeHandler } from "./_lib/node-handler.js";

export const handler = withNodeHandler(karmitisBackupHandler);
