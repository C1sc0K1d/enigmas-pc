import { Component, computed, input } from '@angular/core';
import { outputDisplayParts } from '../../functions/output-display';
import { TerminalEntry } from '../../models/network.model';

@Component({
  selector: 'span[terminalOutput]',
  templateUrl: './terminal-output.html',
  styleUrl: './terminal-output.scss',
  host: { class: 'terminal-output' },
})
export class TerminalOutput {
  readonly entry = input.required<TerminalEntry>();
  protected readonly parts = computed(() => outputDisplayParts(this.entry()));
}
