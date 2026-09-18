import { COMPUTERS } from './features/terminals/data/computers';
import { createTerminalRoutes } from './features/terminals/routing/create-terminal-routes';

export const routes = createTerminalRoutes(COMPUTERS);
