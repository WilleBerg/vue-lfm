<style>
div {
    font-family: Inter;
}

.inner-divs {
    border: 1px solid #223566;
    border-radius: 6px;
    margin-top: 8px;
    margin-bottom: 8px;
}
</style>
<template>
    <div>
        <SButton text="Emmy ta Williams scrobbles" :playing_prop="'teitan-'" :listening_prop="'sylt_-'" />
        <SButton text="William ta Emmys scorbbles" :playing_prop="'sylt_-'" :listening_prop="'teitan-'" />
    </div>
</template>

<script>
import axios from 'axios';
import SButton from './SButton.vue';
import StopButton from './StopButton.vue'
import ScrobbleHist from './ScrobbleHist.vue'
import config from '../../config.json'

export default {
    components: {
        SButton,
        StopButton,
        ScrobbleHist,
    },
    data() {
    },
    methods: {

        async fetchData() {
            try {
                const response = await axios.get(`${config.API_IP}/api/data`);
                this.response = response.data.message;
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
    }
}
</script>
