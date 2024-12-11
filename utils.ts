const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];

export function createRandomLobbyId(){
    let id  = ''
    for(let i = 0; i < 6; i++){
        id+= alphabet[Math.floor(Math.random() * 10)];
    }
    return id;
}

