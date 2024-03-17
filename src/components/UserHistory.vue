<style>
    div {
        font-family: Inter;
    }
</style>
<template>
    <div>
        <div style="border: 1px solid #223566; border-radius: 6px; margin-bottom: 8px;">
            <SButton 
            text="Emmy ta williams scrobbles"
            :playing_prop="'teitan-'"
            :listening_prop="'sylt_-'"
            />
        </div>
        <div style="border: 1px solid #223566; border-radius: 6px; margin-top: 8px;">
            <SButton 
            text="William ta Emmys scorbbles"
            :playing_prop="'sylt_-'"
            :listening_prop="'teitan-'"
            />
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import SButton from './SButton.vue';
import StopButton from './StopButton.vue'

export default {
    components: {
        SButton,
        StopButton,
    },
    data() {
        return {

        }
    },
    methods: {

        async fetchData() {
            try {
                const response = await axios.get('http://localhost:3000/api/data');
                this.response = response.data.message;
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
    }
}
</script>
