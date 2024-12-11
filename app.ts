import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Lobby } from './classes/lobby';
import cors from 'cors';
import { Player } from "./types";

const app : express.Application = express();
app.use(express.static('public'));
app.use(cors())
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;
const interval = 100;
const lobbies : Lobby[] = [];
const socketToPlayerMap : Map<string, {player_name : string, lobbyID : string}> = new Map();

io.on('connection', (socket) => {
   socket.on('joinLobby', (lobbyID:string, p_name:string)=>{
        let player : Player = {
            name : p_name,
            projectiles_fired : [],
            score: 0,
        }
        let lobby = lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0];
        if(lobby){
            lobby.addPlayer(player);
            socket.join(lobbyID);
            socketToPlayerMap.set(socket.id, {player_name: p_name, lobbyID:lobbyID});
        }else{
            // inform the client that the lobby does not exist
            socket.emit("lobbyError");
        }
   });

   socket.on('leaveLobby', (lobbyID:string, p_name:string)=>{
        lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0].removePlayer(p_name);
   });

   socket.on("winNotification", ()=>{
        const player_lobby = socketToPlayerMap.get(socket.id);
        if(player_lobby){
            const {player_name, lobbyID} = player_lobby;
            const lobby = lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0];
            const player = lobby.players.filter((p)=>p.name !== player_name)[0]; // get the opposite player
            if(!lobby.winner){
                lobby.winner = player.name;
                lobby.status = "waiting";
                lobby.updateLeaderboard(player.name);
            }
        }
   })

   socket.on("player_update", (proj_x:number, proj_y:number, instantiation_time:number)=>{
        const player_lobby = socketToPlayerMap.get(socket.id);
        if(player_lobby){
            const {player_name, lobbyID} = player_lobby
            const lobby = lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0];
            const player = lobby.players.filter((p)=>p.name === player_name)[0];
            player.projectiles_fired.push({x_loc:proj_x, y_loc:proj_y, instantiation_time:instantiation_time})
        };
   });
    
   socket.on("startGame", ()=>{
        const player_lobby = socketToPlayerMap.get(socket.id);
        if(player_lobby){
            const {lobbyID} = player_lobby;
            const lobby = lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0];
            lobby.status = "playing";
            // when the game starts no one has won
            lobby.winner = null; // refresh the winner here
        }
   });

   socket.on("removeProjectile", (instantiation_time:number)=>{
        const player_lobby = socketToPlayerMap.get(socket.id);
        if(player_lobby){
            const {player_name, lobbyID} = player_lobby;
            const lobby = lobbies.filter((lobby) => lobby.lobbyID === lobbyID)[0];
            const player = lobby.players.filter((p)=>{p.name === player_name})[0];
            player.projectiles_fired = player.projectiles_fired.filter((proj) => proj.instantiation_time === instantiation_time);
        }
   });

   socket.on('disconnect', ()=>{
        console.log("Trying to remove someone");
        const player_tuple = socketToPlayerMap.get(socket.id);
        if(player_tuple){
            lobbies.filter((lobby) => lobby.lobbyID === player_tuple.lobbyID)[0].removePlayer(player_tuple.player_name);
        }
        socketToPlayerMap.delete(socket.id);
        console.log(lobbies);
   })
});

app.get('/createLobby', (req, res)=>{
    let lobby = new Lobby();
    lobbies.push(lobby)
    setInterval(()=>{
        const payload = [...lobby.players, lobby.status, lobby.winner] as (string|Player|null)[];
        io.to(lobby.lobbyID).emit("game-update", payload)
    }, interval);
    res.json({
        success:true,
        lobbyID : lobby.lobbyID, 
    });
    console.log(lobbies);
})

server.listen(port, ()=>{
    console.log(`listening on port ${port}`);
})

