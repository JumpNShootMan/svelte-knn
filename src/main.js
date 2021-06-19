import App from './App.svelte';
import axios from 'axios';

axios.defaults.baseURL = "http://localhost:8080"
const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;