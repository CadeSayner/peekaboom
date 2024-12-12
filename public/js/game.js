
class Vec2{
    x;
    y;

    constructor (x,y){
        this.x = x;
        this.y = y;
    }

    dot(vec){
        return new Vec2(vec.x * this.x + vec.y * this.y);
    }

    magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    
    scalarProduct(scalar){
        return new Vec2(this.x/scalar, this.y/scalar);
    }

    add(vec){
       this.x += vec.x;
       this.y += vec.y; 
    }

    project(vec){
        return vec.scalarProduct(vec.dot(this)/vec.magnitude());
    }
}

class Vec3{
    x;
    y;
    z;
    constructor(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    dot(vec){
        return this.x*vec.x + this.y*vec.y + this.z*vec.z;
    }
    
    magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    sqMagnitude(){
        return this.dot(this);
    }

    scalarProduct(scalar){
        return new Vec3(this.x*scalar, this.y*scalar, this.z*scalar);
    }

    ipScalarProduct(scalar){
        this.x = this.x*scalar;
        this.y = this.y*scalar;
        this.z = this.z*scalar;
    }

    project(vec){
        return vec.scalarProduct(vec.dot(this)/vec.sqMagnitude());
    }
}

class Player{
    position;
    velocity;
    acceleration;
    last_time;
    radius;
    constructor(){
        this.position = new Vec2(150, 400)
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0,0);
        this.last_time = performance.now();
        this.radius = 12;
    }
    update(timestamp){
        const delta_time = timestamp - this.last_time;
        this.last_time = timestamp;
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);

        //process Collisions
        // left wall
        if(this.position.x < this.radius){
            if(this.velocity.x < 0){
                this.velocity.x = 0;
                this.position.x += (this.radius-this.position.x);
            }
        }
        
        if(this.position.x > 300 - this.radius){
            if(this.velocity.x > 0){
                this.velocity.x = 0; 
                this.position.x -= (this.position.x - 300 + this.radius);
            }
        }
        if(this.position.y < this.radius ){
            if(this.velocity.y < 0){
                this.velocity.y = 0; 
                this.position.y += (this.radius - this.position.y) 
            }
        }
        if(this.position.y > 450 - this.radius ){
            if(this.velocity.y > 0){
                this.velocity.y = 0;
                this.position.y -= (this.position.y - 450 + this.radius);
            }
        }
    }
}

class PowerUp{
    location;
    radius;
   constructor(radius){
    if(this.constructor === "PowerUp"){
        throw new Error("This is an abstract class, this function should not be called directly");
    }
    let x = Math.floor( Math.random() * 300);
    let y = Math.floor( Math.random() * 450);
    this.location = new Vec2(x,y);
    this.radius = radius;
   }
}

class BulletPowerUp extends PowerUp{
    bullets;
    constructor(bullets){
        super(10);
        this.bullets = bullets; 
    }

    effect(){
        if(mag_capacity){
            setAmmo(mag_capacity + this.bullets);
        } 
    }

    draw(ctx){
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius/2, 0, Math.PI * 2, true);
        ctx.fillStyle = '#89f336';
        ctx.fill();
    }
}

let powerups = [];
const hideButton = document.getElementById('hide-button');
hideButton.addEventListener('click', ()=>{
    hideWinScreen();
});

const lobbyID = sessionStorage.getItem("lobbyID");
const player_name = sessionStorage.getItem("player_name");
const lobbyLabel = document.getElementById("lobbyID");
lobbyLabel.innerText = lobbyID;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gravityDamping = 0.01;
const projectile_speed_multiplier = 0.5;
const constOffset = 200;
let gameStatus = "waiting";
let winner = null;
let canBegin = false;
let enemyName = '';
let player1;
let player2;
let mag_capacity = 6;
let reloadingDelay = 5000;
const winScreen = document.getElementById("win_screen");
const winSpan = document.getElementById("winner_span");
const winSuffix = document.getElementById("win_suffix");
const leaderboard_player_1_name = document.getElementById("player-1-name");
const leaderboard_player_1_score = document.getElementById("player-1-score");
const leaderboard_player_2_name = document.getElementById("player-2-name");
const leaderboard_player_2_score = document.getElementById("player-2-score");
const startButton = document.getElementById('start-button');
const ammoCount = document.getElementById('ammo-count');
let current_ammo = mag_capacity;
ammoCount.innerText = current_ammo;
let overlayShown = false;
const created = sessionStorage.getItem("created") // are we the client that created the lobby we are about to join

if(created){
    startButton.classList.add("show");
    startButton.addEventListener('click', (e)=>{
        if(canBegin && !overlayShown){
            socket.emit("startGame");
            hideWinScreen();
        }
    });
}

// websocket connection stuff
import { io }  from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
const socket = io();
socket.emit("joinLobby", lobbyID, player_name);

socket.on("lobbyError", ()=>{
    // redirect back to the home page as something has gone wrong on the server side with the lobby
    window.location.href = api_endpoint;
})

socket.on("game-update", (e)=>{
    if(e[0].name && e[1].name){
        // two players are in fact present so can set the flag to allow the game to begin in the 
        // event that the game is paused
        canBegin = true;
        player1 = e[0];
        player2 = e[1];
    }
    if(e[0].name === player_name){
        if(e[1].projectiles_fired){
            enemyProjectiles = e[1].projectiles_fired;
            enemyName = e[1].name; 
        }
    }
    else if(e[1].name === player_name){
        if(e[0].projectiles_fired){
            enemyProjectiles = e[0].projectiles_fired;
            enemyName = e[0].name; 
        }
    }
    else{
        console.error("something terrible has happened");
    }
    if(e[2] !== gameStatus){
        gameStatus = e[2];
        if(e[2] === "waiting"){
            // we are in a waiting state now when we previously weren't
            // need to move the player back to the default location 
            player = new Player();
        }
        if(e[2] === "playing"){
            // we are now playing when before we weren't 
            // do stuff here that needs to be done like hiding leaderboards and the like
            hideWinScreen(); // just in case the player hasn't already done so
        }
    }
    if(e[3] !== winner){
        winner = e[3];
        if(e[3]){
            // someone has just won, display the win screen with the correct information
            showWinScreen();
        }
    }

});

function showWinScreen(){
    if(winner){
        let weWon = winner === player_name;
        winSpan.innerHTML = weWon ? "You" : winner;
        winSuffix.innerHTML = weWon ? "Have Won!" : "Has Won!"
        winScreen.classList.add("show");
        overlayShown = true;
        // leaderboard display logic
        leaderboard_player_1_name.innerHTML = player1.name;
        leaderboard_player_1_score.innerHTML = player1.score;
        leaderboard_player_2_name.innerHTML = player2.name;
        leaderboard_player_2_score.innerHTML = player2.score;
    }
}

function hideWinScreen(){
    winScreen.classList.remove("show");
    overlayShown = false;
}

// player color properties
const glowColor = " rgb(255, 165, 0)"; // Core color
let gravity = new Vec3(0,0,0);
let player = new Player();
let enemyProjectiles = [];
let playerProjectiles = [];

window.addEventListener("devicemotion", (event) => {
    gravity.x = event.accelerationIncludingGravity.x- event.acceleration.x;
    gravity.y = event.accelerationIncludingGravity.y - event.acceleration.y;
    gravity.z = event.accelerationIncludingGravity.z - event.acceleration.z;
    gravity.ipScalarProduct(gravityDamping);
});

window.addEventListener('touchstart', (event)=>{
    if(gameStatus === "playing"){
        if(current_ammo  >= 1){
            fire();
            if(current_ammo === 1){
                current_ammo = 0;
                ammoCount.innerText = "RELOADING..."
                setTimeout(()=>{
                    setAmmo(mag_capacity)
                }, reloadingDelay);
            }else{
                setAmmo(current_ammo-1);
            }
        }
    }
})
function setAmmo(ammo){
    current_ammo = ammo;
    ammoCount.innerText = current_ammo;
}
function fire(){
    // push to the client's array immediately for fast rendering
    playerProjectiles.push({
        x_loc:player.position.x,
        y_loc:player.position.y,
        instantiation_time:Date.now(),
    });
    socket.emit('player_update', player.position.x, player.position.y, Date.now());
}

function setPlayerGravity(){
    player.acceleration.x = -gravity.project(new Vec3(1,0,0)).x;
    player.acceleration.y =  gravity.project(new Vec3(0,1,0)).y;
}

function drawPowerups(){
    powerups.forEach(powerup => {
        powerup.draw(ctx);
    });
}

setInterval(()=>{
    if(gameStatus === "playing"){
        if(Math.random() > 0.35){
            let powerup = new BulletPowerUp(10);
            let length = powerups.push(powerup);
            powerup.index = length-1;
            setTimeout(()=>{
                powerups.splice(length-1, 1);
            }, 7000);
        }
    }
}, 10000);

function draw(){
    ctx.clearRect(0,0,300,450);
    setPlayerGravity();
    drawPlayer();
    drawPowerups();
    if(gameStatus === "playing"){
        player.update();
                   // check for collision with powerup
        powerups.forEach(powerup => {
            let {x, y} = powerup.location;
            x -= player.position.x;
            y -= player.position.y;
            const distance = (new Vec2(x, y)).magnitude();
            if(distance < powerup.radius){
                powerup.effect();
                powerups.splice(powerup.index, 1);
            }
        });
        playerProjectiles.forEach(projectile => {
            let epoch_time = Date.now()
            let y = projectile.y_loc - (epoch_time - projectile.instantiation_time)*projectile_speed_multiplier;
            drawCircle(projectile.x_loc, y, 7.5, glowColor);
        });
        enemyProjectiles.forEach(projectile => {
            let epoch_time = Date.now()
            let y =  -((projectile.y_loc) - (epoch_time - projectile.instantiation_time)*projectile_speed_multiplier)  - constOffset;
                
            if(projectile.seen){
                if(y > 0){
                    drawCircle(projectile.x_loc, y, 7.5, glowColor) + projectile.seen;
                }
            }else{
                if(y > 0){
                    projectile.seen = -y;
                }else{
                    projectile.seen = 0;
                }
            }
            // check for any collisions with enemy orbs
            const proj_pos = new Vec2(projectile.x_loc, y);
            proj_pos.add(player.position.scalarProduct(-1))
            const dist = proj_pos.magnitude();
            if(dist < player.radius){
                // we have a collision, let the server know we have lost
                socket.emit("winNotification");
            }
            // check for projectile collisions with bottom wall 
            if(proj_pos.y > 360){
                socket.emit('removeProjectile', projectile.instantiation_time);
            }
        });
    }
    window.requestAnimationFrame(draw)
}

function drawCircle(x, y, radius, color){
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawPlayer(){
    drawCircle(player.position.x,player.position.y,player.radius, 'rgb(111, 66, 193)');
}

draw(performance.now());