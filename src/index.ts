import express from 'express';
import { Request, Response } from 'express';
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
// Dredenciales o datos para la coneccion a Redis
const data = {
	//Redis of port -> 6379
	port : 6000,
	host : '127.0.0.1',
	password : "0606"
} as RedisClientOptions;

//Creamos el cliente de la conección
const client = createClient(data); //CReates a new client

//Connection Redis

client.on('connect', () =>{
	console.log('Connected');
});

client.connect().then( res => {
	console.log("Client connection done");
}).catch(err => {
	console.error("Error during REDIS client connection", err);
});

//Api
app.get('/character', async (req : Request, res : Response) => {

	
	//Antes de todo se busca en redis
	const getValueApiRickAndMorty = await client.get('characters');
	//Validamos que si hay datos que concuerden
	if(getValueApiRickAndMorty){
		//Si hay lo mostramos
		console.log('Parseando datos a "JSON"...');
		const valueParse = JSON.parse(getValueApiRickAndMorty)
		console.log('Datos parseados');
		
		return res.json(valueParse);
	}
	
	//Si no existen los datos 
	//Consultamos api y obtenemos los datos
	const response = await axios.get("https://rickandmortyapi.com/api/character")

	/**
	 * Cuando se obtiene los datos
	 * los guardamos en redis para tener una respuesta
	 * mas rapida al cliente
	 * 
	 * -> Se guarda como llave valor
	 */

	// console.log(response.data);
	//Asingamos la Key y el value para Redis
	const redisRes = await client.set("characters", JSON.stringify(response.data));
	const age = await client.set('age',19);
	//Respouesta
	console.log('Redis Response : ',redisRes);
	
	//Obtenemos el valor
	const getValueApi = await client.get('characters')

	console.log('Response get API : ', getValueApi);
	//respondemos
	return res.json(getValueApi);
	
})
//Obtener datos por ID
app.get('/character/:id', async ( req : Request, res : Response) => {

	//Obtenemos el parametro de ruta
	const { id } = req.params;
	console.log('ID : ', id);
	
	console.log('-> ',req.originalUrl);
	
	try {
		//Buscamos si existe los datos
		const reply = await client.get(req.originalUrl);
		//Validamos
		console.log('** ',reply);
		if (reply) return res.json(JSON.stringify(reply));

		//Si no existe los datos
		//Hcemos la peticion a la API
		const response = await axios.get('https://rickandmortyapi.com/api/character/' + id)

		console.log(response.data);

		const saveDataApi = await client.set(id, JSON.stringify(response.data));
		
		return res.json(response.data);
		
	} catch (err) {
		console.log(err);
		
	}

});

app.listen(3000)
console.log('Server on port 3000');

