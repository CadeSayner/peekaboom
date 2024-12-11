const newGameButton = document.getElementById("newGameButton");
const joinGameButton = document.getElementById("joinGameButton");
newGameButton.onclick = newGameButtonClick;
joinGameButton.onclick = joinGameButtonClick;

function newGameButtonClick(){
    window.location.href = `${api_endpoint}/create.html`;
}

function joinGameButtonClick(){
    window.location.href = `${api_endpoint}/join.html`;
}

window.onload = (event) =>{
    sessionStorage.removeItem("created");
}


