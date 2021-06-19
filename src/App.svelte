<script>
	import { Datatable, rows } from 'svelte-simple-datatables'
	const settings = { columnFilter: true }
	const settings2 = { columnFilter: false }
	
	//import SvelteTable from "svelte-table"; //npm install -save svelte-table
	import axios from 'axios'

	let analisis = {
		x: null,
		y: null,
		k: "",
	};
	//var dataKNN
	//let data
	var datosTabla = []
	var datosRutas = []
	//$: cols = selectedCols.map(key => COLUMNS[key]);
	const onSubmitHandler = e => {
		//impedir que se limpie pantalla
		datosTabla = []
		datosRutas = []
		e.preventDefault();
		console.log(analisis);
		console.log(typeof analisis.k)
		let strings
		if (typeof analisis.k === "string"){
			console.log("Es un string")
			strings = analisis.k.split(",")
        	for (let i = 0; i < strings.length; i++) {
          		strings[i] = Number(strings[i])
        	}
        	analisis.k = strings
		}

		axios.post(axios.defaults.baseURL + '/api/knn', analisis)
        .then(res => {

          console.log('Resultados del análisis')
          console.log(res.data)
		  let data1 = res.data.data
		  //let data2 = res.clone()
		  procesar_datos(data1)
		  //procesar_caminos(data2.data.caminos)
        })
        .catch(err =>{
          console.log('Error:')
          console.log(err)
        })

		
	};

	function procesar_datos(dataKNN){
		
        let datos = {}
        for (let i = 0; i < dataKNN.length; i++) {

			datos.id = i+1
        	datos.x = dataKNN[i].punto.x
          	datos.y = dataKNN[i].punto.y
          	datos.clase = dataKNN[i].punto.clase
          	datos.distancia = dataKNN[i].distancia
          	datos.departamento = dataKNN[i].departamento
          	datos.distrito = dataKNN[i].distrito
		  	datos.grupo_riesgo = dataKNN[i].grupo_riesgo

          	datosTabla = [...datosTabla, datos]
			//document.getElementById('#datatable').reload();
			//document.getElementById("#datatable").dataTable().fnDraw();
			//datosTabla = datosTabla
          	datos = {}
        }
		console.log(datosTabla)
      }

	function procesar_caminos(resKNN){
		let rutas = {}
		for( let i = 0; i< resKNN.length; i++){
			for( let j = 0; j< resKNN[i].length;j++){

				rutas.nombre = resKNN[i][j].nombre
				rutas.conteo = resKNN[i][j].conteo
				datosRutas = [...datosRutas, rutas]
				rutas = {}
	
			}
		}
		console.log(datosRutas)
	}

</script>



<main>
	<h2> { "Bienvenidos a la interfaz del servicio de KNN!" }!</h2>
<form on:submit={onSubmitHandler}>
	
	<input type=number step = 0.001 bind:value={analisis.x} class="form-control" placeholder="Inserte la edad"
	width="10">
<p>
</p>
	<input type=number step = 0.001 bind:value={analisis.y} class="form-control" placeholder="Inserte el tipo de persona">
<p>
	
</p>
	<input type=string bind:value={analisis.k} class="form-control" placeholder="Inserte la cantidad de vecinos">
<p>
	
</p>
	<button class="btn-primary">
		Ejecutar KNN
	</button>
</form>
<p></p>

	<Datatable settings={settings} data={datosTabla}>
		<thead>
			<th data-key="id">Vecino</th>
			<th data-key="x">Edad</th>
			<th data-key="y">Cod Grupo de Riesgo</th>
			<th data-key="clase">Fabricante</th>
			<th data-key="departamento">Departamento</th>
			<th data-key="distrito">Distrito</th>
			<th data-key="grupo_riesgo">Grupo de Riesgo</th>
			<th data-key="distancia">Dist. Euclideana</th>
		</thead>
		<tbody>
			{#each $rows as row1}
			<tr>
				<td>{row1.id}</td>
				<td>{row1.x}</td>
				<td>{row1.y}</td>
				<td>{row1.clase}</td>
				<td>{row1.departamento}</td>
				<td>{row1.distrito}</td>
				<td>{row1.grupo_riesgo}</td>
				<td>{row1.distancia}</td>

			</tr>
			{/each}
		</tbody>
	</Datatable>

<p></p>
<p></p>

	<!-- <Datatable settings={settings2} data={datosRutas}>
		<thead>
			<th data-key="nombre">Fabricante</th>
			<th data-key="conteo">Cant. Vecinos Presentes</th>
		</thead>
		<tbody>
			{#each $rows as row2}
			<tr>
				<td>{row2.nombre}</td>
				<td>{row2.conteo}</td>
			</tr>
			{/each}
		</tbody>
	</Datatable> -->



</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	input { width: 40%; height: auto; text-align: center; margin: 0 auto;}
	td {height: auto; color: black;}
	thead { color: black;}
	
</style>