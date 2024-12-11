
const form = document.getElementById("join-form");

form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = new FormData(form);
    let response = await fetch(`${api_endpoint}/createLobby`);
    let json_res = await response.json();
    const lobbyID = json_res.lobbyID; 
    const player_name = formData.get("player_name");
    sessionStorage.setItem("lobbyID", lobbyID);
    sessionStorage.setItem("player_name", player_name);
    sessionStorage.setItem("created", "true");
    window.location.href = `${api_endpoint}/game.html`;
});

window.onload = (event) =>{
    sessionStorage.removeItem("created");
}