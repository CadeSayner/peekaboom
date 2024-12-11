const form = document.getElementById("join-form");

form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = new FormData(form);
    const lobbyID = formData.get("lobbyID");
    const player_name = formData.get("player_name");
    sessionStorage.setItem("lobbyID", lobbyID);
    sessionStorage.setItem("player_name", player_name);
    window.location.href = `${api_endpoint}/game.html`;
});

window.onload = (event) =>{
    sessionStorage.removeItem("created");
}