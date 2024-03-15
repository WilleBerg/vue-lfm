const { apiKey, secret } = require("../config.json");
const { axios } = require('axios')

const LAST_FM_API_KEY = apiKey;
const LAST_FM_API_BASE = "http://ws.audioscrobbler.com/2.0/";

async function getRecentTracks(username, limit, page) {
    try {
        var url =
            `${LAST_FM_API_BASE}` +
            `?method=user.getrecenttracks&user=${username}` +
            `&api_key=${LAST_FM_API_KEY}` +
            `&format=json&limit=${limit}` +
            `&page=${page}`;
        return await fetch(url).then((response) => response.json());
    } catch (error) {
        log(`Error from getRecentTracks: ${error}`);
        return "error";
    }
}

module.exports =  { getRecentTracks }