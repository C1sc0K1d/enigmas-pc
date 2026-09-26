import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { ComputerSummary } from '../models/computer-summary.model';
import { NetworkState } from '../models/network.model';

export interface GameResponse {
  gameId: string;
  revision: number;
  state: NetworkState;
}
export interface CommandRequest {
  computerId: string;
  text: string;
  requestId: string;
  revision: number;
  serverSessionId: string;
}

@Injectable({ providedIn: 'root' })
export class TerminalApi {
  private readonly http = inject(HttpClient);
  catalog(): Promise<ComputerSummary[]> {
    return firstValueFrom(this.http.get<ComputerSummary[]>('/api/computers').pipe(timeout(15000)));
  }
  create(): Promise<GameResponse> {
    return firstValueFrom(this.http.post<GameResponse>('/api/games', {}).pipe(timeout(15000)));
  }
  load(id: string): Promise<GameResponse> {
    return firstValueFrom(
      this.http
        .get<GameResponse>('/api/games/current', { headers: this.headers(id) })
        .pipe(timeout(15000)),
    );
  }
  submit(id: string, command: CommandRequest): Promise<GameResponse> {
    return firstValueFrom(
      this.http
        .post<GameResponse>('/api/games/current/commands', command, { headers: this.headers(id) })
        .pipe(timeout(15000)),
    );
  }
  private headers(id: string): HttpHeaders {
    return new HttpHeaders({ 'X-Game-Session': id });
  }
}
