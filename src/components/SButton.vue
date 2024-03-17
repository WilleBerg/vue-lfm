<template>
    <div class="container">
        <div class="button-container">
            <button 
            :disabled="playing"
            @mouseover="hovering = true"
            @mousedown="hovering = false"
            class="button"
            @click="setPlaying"
            :class="{disabledButton: playing}"
            >
            {{ text }}
            </button>
            <StopButton
            text="Stop Scrobbling"
            v-if="playing"
            @stop-scrobbling="stopScrobbling"
            />
        </div>
        <p v-if="playing">Scrobbling until: {{ time }}</p>
    </div>
</template>

<script>
import StopButton from './StopButton.vue'
import axios from 'axios';
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
    data () {
        return {
            hovering: false,
            playing : false,
            time: ''
        };
    },
    mounted() {
        this.isPlaying(this.playing_prop),
        this.getTime()
    },
    methods: {
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
        async getTime() {
            console.log("Checking getTime on " + this.playing_prop)
            axios.get(`http://localhost:3000/api/timeleft/${this.playing_prop}/${this.listening_prop}`)
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
            this.startScrobbling();
        },
        async isPlaying(user) {
            console.log("Checking isplaying on " + user)
            axios.get('http://localhost:3000/api/ismulti/' + user)
                .then(response => {
                    this.playing = response.data.isMulti;
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
            });
        },
        stopScrobbling() {
            this.playing = false;
            axios.put(`http://localhost:3000/api/stopmulti/${this.playing_prop}/${this.listening_prop}`)
            .then(response => {
                console.log(response.data)
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
        },
        startScrobbling() {
            axios.put(`http://localhost:3000/api/multiscrobble/${this.playing_prop}/${this.listening_prop}`)
            .then(response => {
                console.log(response.data)
                this.time = this.getDate(response.data.timeout);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
        }
    }
}
</script>

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
        margin: 10px;
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
        align-items: center; /* Align items vertically */
    }

    .buttons-container {
        margin-right: 20px; /* Add spacing between buttons and h3 */
    }
</style>