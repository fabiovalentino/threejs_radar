import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Player } from './player';
import { Observable } from 'rxjs';

// const urlPlayers = 'https://myhost.com/rest/listPlayers';
const urlPlayers = 'assets/mock/listPlayers.json';


@Injectable({
  providedIn: 'root'
})

export class ApiService {

  constructor( private http: HttpClient ) {
   }

  getPlayer(): Observable<HttpResponse<Player>> {
    return this.http.get<Player>(
      urlPlayers, { observe: 'response' });
  }

}
