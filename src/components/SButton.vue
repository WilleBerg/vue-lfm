<style scoped>
.disabledButton {
    background-color: #d8d8d8 !important;
    cursor: not-allowed;
}

.button:hover {
    background-color: #3bc1ff;
}

.button {
    color: white;
    margin: 10px 2px 5px 10px;

    border: none;
    padding: 16px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    font-family: Inter;
    background-color: #0ea5e9;
}

.container {
    display: flex;
    align-items: center;
    justify-content: center;
    float: none;
    /* Align items vertically */
}

.buttons-container {
    margin-right: 10px;
    /* Add spacing between buttons and h3 */
}

.inner-divs {
    border: 1px solid #223566;
    border-radius: 6px;
    margin-top: 8px;
    margin-bottom: 8px;
}

.recent-scrobbles {
    /* border: 1px solid #223566; */
    /* border-radius: 6px; */
    margin: 8px;
    margin-top: 15px;
    margin-bottom: 15px;
    justify-content: center;
    align-content: center;
    display: flex;
}

.list {
    margin-top: 10px;
    text-align: center;
    border: 1px solid #223566;
    border-radius: 6px;
}

.item-div {
    margin: 10px;
    display: flex;
    align-items: center;
    overflow: hidden;
    /* Add margin between list items */
}

.item-div img {
    height: auto;
    margin-right: 10px;
    /* Add spacing between image and text */
}

.item-div p {
    margin: 0;
    margin-right: 10px;
    display: flex;
    /* Remove default margin */
}

.scrollable {
    max-height: 200px;
    /* Set a maximum height for the scrollable area */
    overflow-y: auto;
    /* Enable vertical scrolling */
}

.p-time {
    font-size: 10px;
    margin: 0px 10px 0px 10px;
}

.now-playing-div {
    flex: 40%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.now-playing-text {
    font-size: 14px;
    float: right;
}

.now-playing-gif {
    width: 50%;
    height: 50%;
    max-height: 64px;
    float: right;
    overflow: hidden;
}

.song-div {
    flex: 60%;
    display: flex;
    align-content: center;
}
</style>
<template>
    <div :class="{ 'inner-divs': playing }">
        <div class="container">
            <div class="button-container">
                <button :disabled="playing" @mouseover="hovering = true" @mousedown="hovering = false" class="button"
                    @click="setPlaying" :class="{ disabledButton: playing }">
                    {{ text }}
                </button>
                <StopButton text="Stop Scrobbling" v-if="playing" @stop-scrobbling="stopScrobbling" />
                <p class="p-time" v-if="playing">Started scrobbling: {{
        this.formatDate(startedScrobbling) }}
                </p>
                <p class="p-time" v-if="playing">Scrobbling until: {{ time }}</p>
            </div>

        </div>
        <div v-if="playing && songsScrobbled.length > 0" class="recent-scrobbles">
            <div>
                <h2>Songs scrobbled:</h2>
                <div class="list" v-if="songsScrobbled.length >= 3">
                    <div class="scrollable">
                        <div v-for="(song, index) in songsScrobbled" :key="index" class="item-div">
                            <div class="song-div">
                                <img :src="song.image[1]['#text']" alt="Song image" />
                                <p>{{ song.artist['#text'] }} - {{ song.name }}</p>
                            </div>
                            <div class="now-playing-div"
                                v-if="song['@attr'] != undefined && song['@attr'].nowplaying == 'true'">
                                <p class="now-playing-text">Now playing...</p>
                                <img class="now-playing-gif" src="../assets/cat-jam.gif" alt="cat dancing" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="list" v-else>
                    <div v-for="(song, index) in songsScrobbled" :key="index" class="item-div">
                        <div class="song-div">
                            <img :src="song.image[1]['#text']" alt="Song image" />
                            <p>{{ song.artist['#text'] }} - {{ song.name }}</p>
                        </div>
                        <div class="now-playing-div"
                            v-if="song['@attr'] != undefined && song['@attr'].nowplaying == 'true'">
                            <p class="now-playing-text">Now playing...</p>
                            <img class="now-playing-gif" src="../assets/cat-jam.gif" alt="cat dancing" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

</template>

<script>
import StopButton from './StopButton.vue'
import axios from 'axios';
import config from '../../config.json'

const INTERVAL = 60000;

export default {
    components: {
        StopButton
    },
    props: {
        text: {
            required: true,
        },
        playing_prop: {
            required: true,
        },
        listening_prop: {
            required: true,
        }
    },
    data() {
        return {
            hovering: false,
            playing: false,
            time: '',
            startedScrobbling: '',
            intervalId: '',
            songsScrobbled: '',
            first_time: true
        };
    },
    mounted() {
        this.isPlaying(this.playing_prop),
            this.getTime(),
            this.getRecentSometimes(),
            this.getStart()
    },
    beforeDestroy() {
        this.stopGetRecentSometimes()
    },
    methods: {
        async getStart() {
            console.log("Checking getStart on " + this.playing_prop)
            axios.get(`${config.API_IP}/api/started/${this.playing_prop}`)
                .then(response => {
                    console.log(response.data)
                    this.startedScrobbling = new Date(response.data.started);
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        stopGetRecentSometimes() {
            clearInterval(this.intervalId)
        },
        getRecentSometimes() {
            this.intervalId = setInterval(this.getRecent, INTERVAL)
        },
        async getRecent() {
            if (!this.playing && !this.first_time) { return }
            this.first_time = false
            console.log("getting for " + this.playing_prop)
            axios.get(`${config.API_IP}/api/getRecentSongs/${this.playing_prop}`)
                .then(response => {
                    let tmp = [];
                    let tracks = response.data.recenttracks.track;
                    console.log(tracks)
                    for (let song of tracks) {
                        console.log(song.name)
                        if (song["@attr"] != undefined) {
                            if (song["@attr"].nowplaying) {
                                tmp.push(song);
                            }
                        } else {
                            const d = new Date(song.date.uts * 1000);
                            console.log(`this is for${song.name}`)
                            console.log("d" + d)
                            console.log("started" + this.startedScrobbling)
                            console.log(d > this.startedScrobbling)
                            if (d > this.startedScrobbling) {
                                tmp.push(song);
                            } else {
                                break;
                            }
                        }
                    }
                    this.songsScrobbled = tmp;
                    //console.log(this.songsScrobbled)
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        getDate(time_ms) {
            let timeout = time_ms;
            const currentDate = new Date();
            const newDate = new Date(currentDate.getTime() + timeout)

            const formattedDate = newDate.toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // Use 24-hour format
            });
            return formattedDate
        },
        formatDate(d) {
            const formattedDate = d.toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // Use 24-hour format
            });
            return formattedDate
        },
        async getTime() {
            console.log("Checking getTime on " + this.playing_prop)
            axios.get(`${config.API_IP}/api/timeleft/${this.playing_prop}/${this.listening_prop}`)
                .then(response => {
                    console.log(response.data)
                    let timeout = response.data.timeout;
                    this.time = this.getDate(timeout);
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    this.time = 'unknown';
                });
        },
        async setPlaying() {
            this.playing = true;
            await this.startScrobbling();
            this.getRecent();
        },
        async isPlaying(user) {
            console.log("Checking isplaying on " + user)
            axios.get(`${config.API_IP}/api/ismulti/` + user)
                .then(response => {
                    this.playing = response.data.isMulti;
                    if (this.playing) {
                        this.getRecent();
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        stopScrobbling() {
            this.playing = false;
            axios.put(`${config.API_IP}/api/stopmulti/${this.playing_prop}/${this.listening_prop}`)
                .then(response => {
                    console.log(response.data)
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        async startScrobbling() {
            axios.put(`${config.API_IP}/api/multiscrobble/${this.playing_prop}/${this.listening_prop}`)
                .then(response => {
                    console.log(response.data)
                    this.time = this.getDate(response.data.timeout);
                    this.startedScrobbling = new Date((new Date).getTime() - 60000)
                    this.startedScrobbling = this.startedScrobbling.toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false // Use 24-hour format
                    });
                    this.getStart();
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }
    }
}
</script>
