import { PUBLIC_COMPUTERS } from './features/terminals/data/public-computers';
import { createTerminalRoutes } from './features/terminals/routing/create-terminal-routes';

export const routes = createTerminalRoutes(PUBLIC_COMPUTERS);
