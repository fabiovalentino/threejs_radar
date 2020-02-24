import { Component, OnInit } from '@angular/core';
import { EngineService } from '../../engine/engine.service';

@Component({
  selector: 'app-ui-infobar-top',
  templateUrl: './ui-infobar-top.component.html',
  styleUrls: ['./ui-infobar-top.component.css']
})
export class UiInfobarTopComponent implements OnInit {

  items = [
    { id: 0, name: 'Select Player' },
    { id: 1, name: 'player1' },
    { id: 2, name: 'player2' },
    { id: 3, name: 'player3' },
    { id: 4, name: 'player4' }
  ];
  selected = { id: 0, name: 'Select Player' };

  constructor(private engServ: EngineService) {}

  getValues() {
    if ( this.selected !== undefined && this.selected !== null && this.selected.id !== 0 ) {
      if ( this.selected.name === 'player1' ) {
        this.engServ.playerid = '1';
      } else if ( this.selected.name === 'player2' ) {
        this.engServ.playerid = '2';
      } else if ( this.selected.name === 'player3' ) {
        this.engServ.playerid = '3';
      } else if ( this.selected.name === 'player4' ) {
        this.engServ.playerid = '4';
      }
      this.engServ.setPlayerName(this.selected.name, '0x000000');
    }
  }

  highVisual() {
    this.engServ.highVisual();
  }

  resetVisual() {
    this.engServ.resetVisual();
  }

  refreshVisual() {
    this.engServ.refreshVisual();
  }

  ngOnInit() {
  }

}
