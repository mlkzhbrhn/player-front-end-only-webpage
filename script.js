// function to convert seconds to MM:SS format
function secondsToFormat(seconds) {
    if (isNaN(seconds) || seconds <= 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${remainingSeconds}`
}

let songs; // songs array to hold the song names
let currentFolder; // store music folder in songs directory

// fetch songs, and populate the songs array and left side menu
async function getSongs(folder) {
    currentFolder = folder; // set the current folder
    let files = await fetch(`./songs/${folder}`) // fetching the songs directory
    let response = await files.text() // converting response to text
    let div = document.createElement("div") 
    div.innerHTML = response 
    let a = div.getElementsByTagName("a") 
    songs = [] // array to hold song names
    for (let index = 0; index < a.length; index++) {
        const element = a[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`${folder}/`)[1])
        }
    }
    let songUL = document.querySelector(".song-list").querySelector("ul"); // get the song list (ul) element
        for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML +
        `
        <li> 
            <img class="invert" src="assets/img/music.svg" alt="Music">
            <div class="info">
                <div>${song.replaceAll("%", " ")}</div>
                <div>Artist</div>
            </div>
            <div class="play-song">
                <img class="invert" src="assets/img/play.svg" alt="Play">
            </div>
        </li>
        `
    // play song from left side menu event listener
    Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playSong(e.querySelector(".info").firstElementChild.innerHTML);
        })
    });
    }
}

// function to play a song
const playSong = (songName) => {
    currentSong.src = `songs/${currentFolder}/${songName}`;
    currentSong.play()
    play.src = "assets/img/pause.svg";
    document.querySelector(".song-info").innerHTML = songName
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
}

// function to list albums in the left side menu
async function listAlbums() {
    let cardContainer = document.querySelector(".card-container");
    let allFolders = await fetch("./songs/")
    let response = await allFolders.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchorTags = div.getElementsByTagName("a");
    Array.from(anchorTags).forEach(async e => {
        if (e.href.includes("songs/")) {
            let folder = (e.href.split("/").slice(-1)[0])
            let thisFolder = await fetch(`./songs/${folder}/info.json`)
            let response = await thisFolder.json();
            cardContainer.insertAdjacentHTML("beforeend", 
            `
            <div class="card">
                <div class="img-container" style="
                height: 200px;
                background: #2b2b2b;">
                <img src="./songs/${folder}/cover.jpg" alt="Cover">
                </div>
                <h2>${folder}</h2>
                <p>${response.desc}</p>
                <div class="play">
                    <img src="assets/img/play.svg" alt="Play">
                </div>
            </div>
            `)
            let newCard = cardContainer.lastElementChild;
            newCard.addEventListener("click", async () => {
            let folderName = newCard.querySelector("h2").innerHTML;
            let songUL = document.querySelector(".song-list").querySelector("ul");
            songUL.innerHTML = "";
            await getSongs(folderName);
            playSong(songs[0]); // play the first song of the selected folder
        });
        }
    })

}

let currentSong = document.createElement("audio"); // audio element to hold the current song
document.querySelector(".song-time").innerHTML = "00:00 / 00:00"; // initializing song time display

// main function for the music player functionality
async function main() {
    // listing cards from user folders
    listAlbums()

    // play button event listener
    play.addEventListener("click", () => {
        // if the song is not playing, play it, else pause it
        if (currentSong.src === "") {
            playSong(songs[0]); // play the first song if no song is selected
            play.src = "assets/img/pause.svg"; // change play button to pause icon
        } else if (currentSong.paused) {
            currentSong.play();
            play.src = "assets/img/pause.svg";
        } else {
            if (play.src === "assets/img/pause.svg" || !currentSong.paused) {
                currentSong.pause();
                play.src = "assets/img/play.svg";
            }
        }
    });

    // seekbar time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").innerHTML = `${secondsToFormat(currentSong.currentTime)} / ${secondsToFormat(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    // seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        // console.log(e) // offsetX is the x position of the click
        // console.log(e.target.getBoundingClientRect().width) // get width of target (seekbar) respective to the viewport
        document.querySelector(".circle").style.left = `${(e.offsetX / e.target.getBoundingClientRect().width) * 100}%`; // set the left position of the circle in % -- depending on how far the user clicked respective to the seekbar width
        currentSong.currentTime = (e.offsetX / e.target.getBoundingClientRect().width) * currentSong.duration; // set the current time of the song
    });

    // hamburger menu event listener
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0px"; // show the left side menu
    });

    // close button event listener
    document.querySelector(".left .close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"; // hide the left side menu
    })

    // previous button event listener
    document.querySelector("#previous").addEventListener("click", () => {
        let currentSongIndex = songs.indexOf(currentSong.src.split(`/${currentFolder}/`)[1]);
        if (currentSongIndex > 0) {
            playSong(songs[currentSongIndex - 1]);
        }
    });

    // next button event listener
    document.querySelector("#next").addEventListener("click", () => {
        let currentSongIndex = songs.indexOf(currentSong.src.split(`${currentFolder}/`)[1]);
        if (currentSongIndex < songs.length - 1) {
            playSong(songs[currentSongIndex + 1]);
        }
    });

    // volume control
    document.querySelector("#volume").addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100; // 0.0 to 1.0
    })

    // volume icon toggle to mute
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("assets/img/volume.svg")) {
            e.target.src = "assets/img/mute.svg"; // change to mute icon
            currentSong.volume = 0; // mute the song
            document.querySelector("#volume").value = 0; // set the volume slider to 0
        } else {
            e.target.src = "assets/img/volume.svg"; // change to volume icon
            currentSong.volume = 0.1; // unmute the song
            document.querySelector("#volume").value = 10; // set the volume slider to 10
        }
    })
}

main()