const express = require('express');
const cors = require('cors');
const md5 = require('md5')


const app = express();
const PORT = 3000;
const TIMEOUT_MS = 10000

const { apiKey, 
    secret, 
    sessionKeySylt, 
    sessionKeyTeitan, 
    tokenSylt, 
    tokenTeitan } = require("./config.json");

const LAST_FM_API_KEY = apiKey;
const LAST_FM_API_BASE = "http://ws.audioscrobbler.com/2.0/";

const {getRecentTracks} = require('./lastfm/get_recent')
let scrobblers = []
ms()

const SCROBBLER_TIMEOUT = 7200000

app.use(cors()); // Enable CORS for all routes

app.get('/api/getRecentSongs/:user', async (req, res) => {
    const username = req.params.user;
    let recentSongs = await getRecentTracks(username, 100, 1)
    console.log(recentSongs)
    console.log(`Username: ${username}`);
    res.json(recentSongs.recenttracks)
});

app.get('/api/ismulti/:user', async (req, res) => {
    console.log("Got ismulti request on " + req.params.user)
    let user = req.params.user;
    is = isScrobbling(user);
    // console.log(`User ${user} is listening: ${is}`);
    res.json({
        isMulti: is,
    })
});

app.get('/api/timeleft/:user/:user_to_listen', async (req, res) => {
    let user = req.params.user;
    let user_to_listen = req.params.user_to_listen;
    console.log("Timeleft call: " + user + " " + user_to_listen);
    let timeleft = time_left(user, user_to_listen);
    if (timeleft == false) {
        res.status(400).json({
            message: "No such user"
        })
    } else {
        res.json({
            timeout: timeleft
        })
    }
});

app.put('/api/multiscrobble/:user/:user_to_follow', (req, res) => {
    console.log(`Multiscrobble request ${req.params.user} to follow ${req.params.user_to_follow}`)
    try {
        let user = req.params.user
        let user_to_follow = req.params.user_to_follow
        // let user_to_follow = 'teitan-'
        let sessionKey = ''
        if (user == 'sylt_-') {
        sessionKey = sessionKeySylt; 
        } else if (user == 'teitan-') {
            sessionKey = sessionKeyTeitan
        }
        scrobblers.push({
            user: user,
            userToListen: user_to_follow,
            lastScrobbledTrack: null,
            sessionKey: sessionKey,
            isFirstScrobble: true,
            _id: 0,
            remove: false,
            timeout: SCROBBLER_TIMEOUT,
        })
        res.status(200).json({ message: 'Success', timeout: SCROBBLER_TIMEOUT});
    } catch {
        res.status(400).json({message: "Something went wrong"})
    }
});
app.put('/api/stopmulti/:user/:user_to_follow', (req, res) => {
    let user = req.params.user;
    let user_to_follow = req.params.user_to_follow;
    console.log(`Multiscrobble stop request from ${req.params.user} to follow ${req.params.user_to_follow}`)
    let removed = stopscrobbling(user)
    if (removed) {
        res.status(200).json({ message: 'Success' });
    } else {
        res.status(400).json({message: "Something went wrong"});
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function ms() {
    let currentScrobblersAmount = getCurrentScrobblers().length;
    let lastCurrentScrobblersAmount = currentScrobblersAmount;
    while (true) {
        let currentScrobblersAmount = getCurrentScrobblers().length;
        if (currentScrobblersAmount != lastCurrentScrobblersAmount) {
            console.log(getCurrentScrobblers())
        }
        updateScrobblers()
        await sleep(TIMEOUT_MS)
        lastCurrentScrobblersAmount = currentScrobblersAmount
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentScrobblers() {
    return scrobblers;
}

function isScrobbling(user) {
    for (var i = 0; i < scrobblers.length; i++) {
        if (scrobblers[i]['user'] == user) {
            return true;
        }
    }
    return false;
}

function time_left(user, user_to_follow) {
    for (var i = 0; i < scrobblers.length; i++) {
        if (scrobblers[i]['user'] == user && scrobblers[i]['userToListen'] == user_to_follow) {
            return scrobblers[i].timeout;
        }
    }
    return false;
}

async function updateScrobblers() {
    for (var i = 0; i < scrobblers.length; i++) {
        if (scrobblers[i].remove) {
            scrobblers.splice(i, 1);
            if (scrobblers.length == 0) {
                break;
            }
            i--;
        }
        scrobblers[i].timeout -= TIMEOUT_MS;
        if (scrobblers[i].timeout <= 0) {
            scrobblers[i].remove = true;
        }
        var userToListen = scrobblers[i]["userToListen"];
        var sessionKey = scrobblers[i]["sessionKey"];
        var userLastScrobbled = scrobblers[i]["lastScrobbledTrack"];

        var recentTracks = await getRecentTracks(userToListen, 3, 1);
        if (recentTracks == "error") {
            continue;
        }
        if (recentTracks == null) {
            continue;
        }
        try {
            var mostRecentTrack = recentTracks["recenttracks"]["track"][0];
            var isPlaying =
                mostRecentTrack["@attr"] != null &&
                mostRecentTrack["@attr"]["nowplaying"] == "true";
            var secondMostRecentTrack =
                recentTracks["recenttracks"]["track"][1];
        } catch (err) {
            continue;
        }

        try {
            if (isPlaying) {
                var trackName = mostRecentTrack["name"];
                var artistName = mostRecentTrack["artist"]["#text"];
                var albumName = mostRecentTrack["album"]["#text"];

                var result = await updateNowPlaying(
                    trackName,
                    artistName,
                    albumName,
                    sessionKey
                );
                if (
                    result["message"] != null &&
                    result["message"].startsWith("Invalid session key")
                ) {
                    scrobblers[i].remove = true;
                    continue;
                }
                if (result == "error") {
                    continue;
                }
                var resultScrobble = tryScrobble(
                    secondMostRecentTrack,
                    userLastScrobbled,
                    sessionKey,
                    scrobblers[i]["user"].username,
                    scrobblers[i].isFirstScrobble
                );
                if (resultScrobble || userLastScrobbled == null) {
                    scrobblers[i].isFirstScrobble = false;
                    scrobblers[i]["lastScrobbledTrack"] = secondMostRecentTrack;
                } else continue;
            } else {
                var resultScrobble = tryScrobble(
                    secondMostRecentTrack,
                    userLastScrobbled,
                    sessionKey,
                    scrobblers[i]["user"].username
                );
                if (resultScrobble) {
                    scrobblers[i].isFirstScrobble = false;
                    scrobblers[i]["lastScrobbledTrack"] = secondMostRecentTrack;
                } else continue;
            }
        } catch (err) {
            continue;
        }
    }
}

function tryScrobble(
    secondMostRecentTrack,
    userLastScrobbled,
    sessionKey,
    username,
    isFirstScrobble
) {
    if (isSameScrobble(secondMostRecentTrack, userLastScrobbled)) {
        return false;
    } else {
        if (isFirstScrobble) {
            return true;
        }
        var res = scrobbleSong(
            secondMostRecentTrack["name"],
            secondMostRecentTrack["artist"]["#text"],
            secondMostRecentTrack["album"]["#text"],
            secondMostRecentTrack["date"]["uts"],
            sessionKey
        );
        if (res != "error") {
        } else {
        }
        return true;
    }
}

async function scrobbleSong(
    songName,
    artistName,
    album,
    timestamp,
    sessionKey
) {
    var auth_sig =
        `album${album}` +
        `api_key${LAST_FM_API_KEY}` +
        `artist${artistName}` +
        `methodtrack.scrobblesk${sessionKey}` +
        `timestamp${timestamp}` +
        `track${songName}` +
        `${secret}`;
    var auth_sig_md5Hex = md5(auth_sig);
    songName = encodeURIComponent(songName);
    album = encodeURIComponent(album);
    artistName = encodeURIComponent(artistName);
    try {
        const url =
            `${LAST_FM_API_BASE}?method=track.scrobble` +
            `&api_key=${LAST_FM_API_KEY}` +
            `&sk=${sessionKey}` +
            `&artist=${artistName}` +
            `&track=${songName}` +
            `&album=${album}` +
            `&timestamp=${timestamp}` +
            `&format=json&api_sig=${auth_sig_md5Hex}`;
        const response = await fetch(url, { method: "POST" });
        const data = await response.json();
        return data;
    } catch (error) {
        return "error";
    }
}


function isSameScrobble(track1, track2) {
    var isNull1 = track1 == null;
    var isNull2 = track2 == null;
    if (isNull1 || isNull2) return false;
    var isSameName = track1["name"] == track2["name"];
    var isSameArtist = track1["artist"]["#text"] == track2["artist"]["#text"];
    var isSameAlbum = track1["album"]["#text"] == track2["album"]["#text"];
    var isSameTime = track1["date"]["uts"] == track2["date"]["uts"];
    return isSameName && isSameArtist && isSameAlbum && isSameTime;
}

async function updateNowPlaying(songName, artistName, album, sessionKey) {
    var auth_sig =
        `album${album}` +
        `api_key${LAST_FM_API_KEY}` +
        `artist${artistName}` +
        `methodtrack.updateNowPlayingsk${sessionKey}` +
        `track${songName}` +
        `${secret}`;
    var auth_sig_md5Hex = md5(auth_sig);
    songName = encodeURIComponent(songName);
    album = encodeURIComponent(album);
    artistName = encodeURIComponent(artistName);
    const url =
        `${LAST_FM_API_BASE}` +
        `?method=track.updateNowPlaying&api_key=${LAST_FM_API_KEY}` +
        `&sk=${sessionKey}` +
        `&artist=${artistName}` +
        `&track=${songName}` +
        `&album=${album}` +
        `&format=json&api_sig=${auth_sig_md5Hex}`;
    try {
        const response = await fetch(url, { method: "POST" });
        const data = await response.json();
        return data;
    } catch (error) {
        log(`Error from updateNowPlaying: ${error}`);
        return "error";
    }
}

async function stopscrobbling(user) {
    removed = false
    for (let i = 0; i < scrobblers.length; i++) {
        if (scrobblers[i]["user"] == user) {
            scrobblers.splice(i, 1);
            removed = true
            return removed;
        }
    }
    return removed;
}