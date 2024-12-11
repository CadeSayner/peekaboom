import { Player } from "../types";
import { createRandomLobbyId } from "../utils";

export class Lobby{
    lobbyID : string;
    status : "waiting" | "playing";
    players : Player[];
    winner : string | null;


    constructor(){
        this.lobbyID = createRandomLobbyId();
        this.status = "waiting";
        this.players = [];
        this.winner = null;
    }

    updateLeaderboard(player_name : string){
        let index = 0;
        if(this.players[0].name !== player_name){
            index = 1;
        }
        this.players[index].score += 1;
    } 

    addPlayer(p : Player){
        this.players.push(p);
    }

    removePlayer(p_name : string){
        this.players = this.players.filter((p) => p.name != p_name)
    }
}