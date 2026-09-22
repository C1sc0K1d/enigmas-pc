import { ComputerConfig } from '../models/computer.model';
import { inno_m1nvl } from './computers/inno_m1nvl';
import { sultao_d } from './computers/sultao_d';
import { tec_la } from './computers/tec_la';
import { nkai_a } from './computers/nkai_a';
import { grd_s0nhadr } from './computers/grd_s0nhadr';
import { chma_vva } from './computers/chma_vva';
import { h_colinas } from './computers/h_colinas';
import { caosra_st } from './computers/caosra_st';
import { sr_grdabs } from './computers/sr_grdabs';
import { fnt_primdal } from './computers/fnt_primdal';

// A ordem define o seletor e o terminal inicial do site.
export const COMPUTERS: ComputerConfig[] = [
  inno_m1nvl,
  sultao_d,
  tec_la,
  nkai_a,
  grd_s0nhadr,
  chma_vva,
  h_colinas,
  caosra_st,
  sr_grdabs,
  fnt_primdal,
];
