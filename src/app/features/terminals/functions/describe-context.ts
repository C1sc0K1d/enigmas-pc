import { ComputerConfig } from '../models/computer.model';
import { describeRoute } from './describe-route';

export function describeContext(computer: ComputerConfig): string {
  return [computer.context.riddle, '', describeRoute(computer)].join('\n');
}
