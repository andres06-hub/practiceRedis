import express from 'express';
//Para obtener datos de una api, como un "fech"
import axios from 'axios';
//MODULO PARA MEDIR EL TIEMPO DE RESPUESTA
//Middleware
import responseTime from 'response-time';
//Requerimos redis
import { createClient, RedisClientOptions } from 'redis';

const app = express();

app.use(responseTime());
app.use(express.json());

//////////////////////////////////////////////////////////////

const data = {
	//Redis of port -> 6379
	port : 6000,
	host : '127.0.0.1',
	password : "0606"
} as RedisClientOptions;

//Connection Redis
const client = createClient(data); //CReates a new client


client.on('connect', () =>{
	console.log('Connected');
});

client.connect().then( res => {
	console.log("Client connection done");
}).catch(err => {
	console.error("Error during REDIS client connection", err);
});

app.get('/character', async (req, res) => {

	
	//Antes de todo se busca en redis
	const getValueApiRickAndMorty = await client.get('characters');
	//Validamos que si haya datos
	if(getValueApiRickAndMorty){
		//Si hay lo mostramos
		console.log('Parseando datos a "JSON"...');
		const valueParse = JSON.parse(getValueApiRickAndMorty)
		console.log('Datos parseados');
		
		return res.json(valueParse);
	}
	
	//
	const response = await axios.get("https://rickandmortyapi.com/api/character")

	/**
	 * Cuando se obtiene los datos
	 * los guardamos en redis para tener una respuesta
	 * mas rapida al cliente
	 * 
	 * -> Se guarda como llave valor
	 */

	// console.log(response.data);


	const redisRes = await client.set("characters", JSON.stringify(response.data));
	const age = await client.set('age',19);
	//Respouesta
	console.log('Redis Response : ',redisRes);
	
	
	const getValueApi = await client.get('characters')

	console.log('Response get API : ', getValueApi);
	
	res.json(getValueApi);
	
})

app.listen(3000)
console.log('Server on port 3000');

