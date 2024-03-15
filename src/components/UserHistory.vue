<template>
    <div>
        <div>
            <h1>HELLO</h1>
        </div>
        <div>
            <h1>Search for users!</h1>
                <form @submit.prevent="handleSubmit">
                    <label for="inputValue">Enter a value:</label>
                    <input id="inputValue" type="text" v-model="inputValue">
                    <button type="submit">Submit</button>
                </form>
                <p>Current value: {{ inputValue }}</p>
        </div>
        <div>
            <h1>Result from user search</h1>
            <p v-if="userData == ''">There is no data</p>
            <div v-else>
                <li v-for="song in userData.track">
                    Song: {{ song.name }}, Artist: {{ song.artist['#text'] }}, <img :src="song.image[0]['#text']"/>
                </li>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            test: "TuSTING",
            response: '',
            inputValue: '',
            userData: '',
        }
    },
    methods: {
        async fetchData() {
            console.log("Hello")
            try {
                const response = await axios.get('http://localhost:3000/api/data');
                this.response = response.data.message;
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
        async fetchUserData() {
            axios.put('http://localhost:3000/api/multiscrobble/' + this.inputValue + '/' + this.inputValue)
                .then(response => {
                    this.userData = response.data
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        async handleSubmit() {
            console.log("handled");
            this.fetchUserData();
        }
    }
}
</script>
