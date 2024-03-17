<template>
    <button 
    class="button-stop"
    @click="stopScrobbling"
    >
    {{ text }}
    </button>
</template>

<script>
export default {
    props: {
        text: {
            required: true,
        }
    },
    data () {
        return {
            hovering: false,
        };
    },
    methods: {
        stopScrobbling() {
            this.playing = true
            this.$emit('stop-scrobbling') 
        }
    }
}
</script>

<style scoped>
    .button-stop:hover {
        background-color: rgb(255, 101, 101);
    }
    .button-stop {
        color: white;
        margin: 10px;
        border: none;
        padding: 16px 12px;
        border-radius: 6px;
        font-size: 12px; 
        font-weight: bold;
        font-family: Inter;
        background-color: red;
    }
</style>