const request = require('request');
var fs = require('fs');
const moment = require('moment');



async function Bucle (resolution){

    let array_acciones = ["AAPL","CSCO","JPM","AMD","MS","MU","SBUX","NKE","GILD","INTC"];

    let operaciones_encontradas = [];
    console.log("Comenzando a analizar los gráficos de "+resolution+" minutos");
   

    let array_operaciones= [];

    for(let accion of array_acciones){

        let inicio = 1633250855;

        let operacion = await Bucle2(accion,resolution,inicio)
        array_operaciones.push(operacion);
        

        
    }
    
    let jugadas = [];

    console.log(array_operaciones.length)
    for(let simbolo of array_operaciones){
        
        for(let señal of simbolo){

            for(let tiempo of señal){

                jugadas.push(tiempo);
            }
        }
    }
    console.log(jugadas[25]);
    console.log(jugadas[26]);
    console.log(jugadas[27]);
    console.log(jugadas[28]);
    console.log(jugadas[29]);
    console.log(jugadas.length)

    let stats = Estadisticas(jugadas);

    console.log("Estadísticas totales----------")
    console.log(stats);

    let obj_direcciones = SepararDireccion(jugadas);

    console.log("Estadísticas Largos----------")
    console.log(Estadisticas(obj_direcciones.largos));
    console.log("Estadísticas Cortos----------")
    console.log(Estadisticas(obj_direcciones.cortos));

    //let catalogo_pelis= JSON.stringify(array_pelis);
    // fs.writeFileSync("pelis.json",catalogo_pelis);
    
    return;
}


async function Bucle2(accion,resolution,fecha) {
    let array = new Array(15);

    let operaciones = [];

    for(let a of array){

        console.log(accion);
        console.log(fecha);

        let operacion = await Peticion(accion,resolution,fecha)
        if(!operacion){
            await Delay();
            operacion = await Peticion(accion,resolution,fecha)
        }

        operaciones.push(operacion);
        fecha = operacion[0].time - 1000000;
    }

    return operaciones;
}


function Peticion(accion,resolution,fecha) {

    let inicio = fecha-50000000;

    return new Promise(resolve => {
                 
        request('https://finnhub.io/api/v1/stock/candle?symbol='+accion+'&resolution='+resolution+'&from='+inicio+'&to='+fecha+'&token=c2qih02ad3ickc1loc60', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            
            if(res.body["error"] == 'API limit reached. Please try again later. Remaining Limit: 0'){
                console.log("entrada")
                return resolve(false);
            }

            let datos = Formatear(res.body);
            console.log(datos.t.length);
            let configuraciones = VBS_1(datos,accion);

            

            resolve(configuraciones);

        }); 
    });
};

async function Inicio(){
    
    let minutos_5= Bucle(5);

}





function VBS3 (array_datos,accion){

    class Señal {
        constructor(time, fecha,entrada,stop,accion,mm20,mm8) {
          this.accion = accion;
          this.time = time;
          this.fecha = fecha;
          this.entrada = entrada;
          this.stop = stop;
          this.mm20 = mm20;
          this.mm8 = mm8;

        }
      }

      let configuraciones=[];

    for(i=20; i < array_datos.c.length; i++){

        let high = array_datos.h[i];
        let high_1 = array_datos.h[i-1];
        let high_2 = array_datos.h[i-2];
    
        let low = array_datos.l[i];
        let low_1 = array_datos.l[i-1];
        let low_2 = array_datos.l[i-2];
    
        let MM20 = Media20(array_datos.c,i);
        let MM20_10 = Media20(array_datos.c,i-10);
        let MM20_20 = Media20(array_datos.c,i-20);
    
        let MM8 = Media8(array_datos.c,i+1);
        let MM8_3 = Media8(array_datos.c,i-2);
        let MM8_5 = Media8(array_datos.c,i-4 );
    
    
        if(MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_3 && MM8_3 > MM8_5 && high < high_1 && high_1 < high_2 && low <= MM8 && high >= MM20){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.h[i], array_datos.l[i],accion,MM20,MM8));

        }
    
        
        if(MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_3 && MM8_3 < MM8_5 && low > low_1 && low_1 > low_2 && high >= MM8 && low <= MM20){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.l[i], array_datos.h[i],accion,MM20,MM8));
        };
                
    }

    return configuraciones;
}



async function VBS_1 (array_datos,accion){

    class Señal {
        constructor(time, fecha,entrada,stop,accion,mm20,mm8,dir) {
          this.accion = accion;
          this.time = time;
          this.fecha = fecha;
          this.entrada = entrada;
          this.stop = stop;
          this.mm20 = mm20;
          this.mm8 = mm8;
          this.dir = dir;
        }
      }

      let configuraciones = [];
      let jugadas = [];

    for(i=20; i < array_datos.c.length; i++){

        let high = array_datos.h[i];
        let high_1 = array_datos.h[i-1];
        let high_2 = array_datos.h[i-2];
    
        let low = array_datos.l[i];
        let low_1 = array_datos.l[i-1];
        let low_2 = array_datos.l[i-2];
    
        let MM20 = Media20(array_datos.c,i+1);
        let MM20_10 = Media20(array_datos.c,i-4);
        let MM20_20 = Media20(array_datos.c,i-9);
    
        let MM8 = Media8(array_datos.c,i+1);
        let MM8_3 = Media8(array_datos.c,i-4);
        let MM8_5 = Media8(array_datos.c,i-9);
    
        let MM200 = Media200(array_datos.c,i+1);
    
        if(MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_3 && MM8_3 > MM8_5 && high < high_1 && high_1 < high_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            let señal = new Señal(array_datos.t[i], time.toLocaleString(),array_datos.h[i], array_datos.l[i],accion,MM20,MM8,"L")

            configuraciones.push(señal);
            let activacion = await Analisis(señal,array_datos,jugadas);
            
            if(activacion){

                jugadas.push(activacion);
            }
        }
    
        
        if(MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_3 && MM8_3 < MM8_5 && low > low_1 && low_1 > low_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            let señal = new Señal(array_datos.t[i], time.toLocaleString(),array_datos.l[i], array_datos.h[i],accion,MM20,MM8,"C");

            configuraciones.push(señal);

            let activacion = await Analisis(señal,array_datos,jugadas);
            
            if(activacion){
                jugadas.push(activacion);
            }
        };
                
    }
    
    let cortos = [];

    for(let señal of jugadas){
        let resultado = Gestión4(señal.time,señal.dir,señal.entrada,señal.stop,array_datos);
        señal.resultado = resultado;
    }

    console.log(jugadas[25]);

    console.log(configuraciones.length);
    console.log(jugadas.length)

    return jugadas;
}


function Frenazo (array_datos,accion){
 
    class Señal {
        constructor(time, fecha,entrada,stop,accion,mm20,mm8) {
          this.accion = accion;
          this.time = time;
          this.fecha = fecha;
          this.entrada = entrada;
          this.stop = stop;
          this.mm20 = mm20;
          this.mm8 = mm8;

        }
      }

      let configuraciones=[];

    for(i=20; i < array_datos.c.length; i++){

        let high = array_datos.h[i];
        let high_1 = array_datos.h[i-1];
        let high_2 = array_datos.h[i-2];
    
        let low = array_datos.l[i];
        let low_1 = array_datos.l[i-1];
        let low_2 = array_datos.l[i-2];
    
        let MM20 = Media20(array_datos.c,i+1);
        let MM20_5 = Media20(array_datos.c,i-4);
    
        let MM8 = Media8(array_datos.c,i+1);
        let MM8_5 = Media8(array_datos.c,i-4);
    
    
        if(MM8_5 < MM20_5 && MM8 > MM20 && high < high_1 && high_1 < high_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.h[i], array_datos.l[i],accion,MM20,MM8));

        }
    
        
        if(MM8_5 > MM20_5 && MM8 < MM20 && low > low_1 && low_1 > low_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.l[i], array_datos.h[i],accion,MM20,MM8));
        };
                
    }

    return configuraciones;

}

function VbsCola(array_datos,accion) {
    
    class Señal {
        constructor(time, fecha,entrada,stop,accion,mm20,mm8) {
          this.accion = accion;
          this.time = time;
          this.fecha = fecha;
          this.entrada = entrada;
          this.stop = stop;
          this.mm20 = mm20;
          this.mm8 = mm8;

        }
      }

      let configuraciones=[];

    for(i=20; i < array_datos.c.length; i++){

        let open = array_datos.o[i];
        let close = array_datos.c[i];

        let high = array_datos.h[i];
        let high_1 = array_datos.h[i-1];
        let high_2 = array_datos.h[i-2];
    
        let low = array_datos.l[i];
        let low_1 = array_datos.l[i-1];
        let low_2 = array_datos.l[i-2];
    
        let MM20 = Media20(array_datos.c,i);
        let MM20_5 = Media20(array_datos.c,i-4);
        let MM20_10 = Media20(array_datos.c,i-9);
    
        let MM8 = Media8(array_datos.c,i+1);
        let MM8_3 = Media8(array_datos.c,i-2);
        let MM8_5 = Media8(array_datos.c,i-4 );
        

        let rango = Math.abs(high - low);
        let cuerpo = Math.abs(open - close);

        if(MM20 > MM20_5 && MM20_5 > MM20_10  && high < high_1 && high_1 < high_2 && cuerpo < (0.3 * rango) && open >= low + (0.6*rango) && close >= low + (0.6*rango)){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.h[i], array_datos.l[i],accion,open,close));

        }
    
        
        if(MM20 < MM20_5 && MM20_5 < MM20_10 && low > low_1 && low_1 > low_2 && cuerpo < (0.3 * rango) && open <= low + (0.4*rango) && close <= low + (0.4*rango)){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.l[i], array_datos.h[i],accion,open,close));
        };
                
    }

    return configuraciones;

}

function VelaCola (array_datos){
    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let high_1 = array_datos.h[array_datos.h.length-2];
    let high_2 = array_datos.h[array_datos.h.length-3];


    let low = array_datos.l[array_datos.l.length-1];
    let low_1 = array_datos.l[array_datos.l.length-2];
    let low_2 = array_datos.l[array_datos.l.length-3];


    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];
    
    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20 = Media20(array_datos.c,array_datos.c.length-1);
    let MM20_10 = Media20(array_datos.c,array_datos.c.length-10);
    let MM20_20 = Media20(array_datos.c,array_datos.c.length-20);



    if(MM20 <= high && MM20 >= low && MM20 > MM20_10 && MM20_10 > MM20_20 && cuerpo < (0.3 * rango) && high_1 > MM20 && high_2 > MM20){

        operacion.jugada = "Vela de cola";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if(MM20 <= high && MM20 >= low && MM20 < MM20_10 && MM20_10 < MM20_20 && cuerpo < (0.3 * rango) && low_1 < MM20 && low_2 < MM20){

        operacion.jugada = "Vela de cola";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }
        
    return false;
}


function NBR (array_datos){
    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let high_2 = array_datos.h[array_datos.h.length-2];
    let high_3 = array_datos.h[array_datos.h.length-3];
    let high_4 = array_datos.h[array_datos.h.length-4];
    let high_5 = array_datos.h[array_datos.h.length-5];

    let low = array_datos.l[array_datos.l.length-1];
    let low_2 = array_datos.l[array_datos.l.length-2];
    let low_3 = array_datos.l[array_datos.l.length-3];
    let low_4 = array_datos.l[array_datos.l.length-4];
    let low_5 = array_datos.l[array_datos.l.length-5];


    let close = array_datos.c[array_datos.c.length-1];
    let close_2 = array_datos.c[array_datos.c.length-2];
    let close_3 = array_datos.c[array_datos.c.length-3];
    let close_4 = array_datos.c[array_datos.c.length-4];
    let close_5 = array_datos.c[array_datos.c.length-5];

    let open = array_datos.o[array_datos.o.length-1];
    let open_2 = array_datos.o[array_datos.o.length-2];
    let open_3 = array_datos.o[array_datos.o.length-3];
    let open_4 = array_datos.o[array_datos.o.length-4];
    let open_5 = array_datos.o[array_datos.o.length-5];

    let MM200 = Media200(array_datos.c,array_datos.c.length-1)
    let MM20 = Media20(array_datos.c,array_datos.c.length-1);
    // let rango = Math.abs(high - low);
    // let rango_2 = Math.abs(high_2 - low_2);
    // let rango_3 = Math.abs(high_3 - low_3);
    // let rango_4 = Math.abs(high_4 - low_4);
    // let rango_5 = Math.abs(high_5 - low_5);
    // rango == Menor([rango,rango_2,rango_3,rango_4,rango_5])


    if(close_5 < open_5 && close_4 < open_4 && close_3 < open_3 && close_2 < open_2 && close < open && ((high >= MM200 && low <= MM200) || (high >= MM20 && low <= MM20))){

        operacion.jugada = "NBR";
        operacion.direccion = "Largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if(close_5 > open_5 && close_4 > open_4 && close_3 > open_3 && close_2 > open_2 && close > open && ((high >= MM200 && low <= MM200) || (high >= MM20 && low <= MM20))){

        operacion.jugada = "NBR";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }
        
    return false;
}



function VelaElefante (array_datos){

    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let low = array_datos.l[array_datos.l.length-1];
    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];

    let high_2 = array_datos.h[array_datos.h.length-2];
    let high_3 = array_datos.h[array_datos.h.length-3];
    let high_4 = array_datos.h[array_datos.h.length-4];
    let high_5 = array_datos.h[array_datos.h.length-5];
    let high_6 = array_datos.h[array_datos.h.length-6];
    let high_7 = array_datos.h[array_datos.h.length-7];
    let high_8 = array_datos.h[array_datos.h.length-8];
    let high_9 = array_datos.h[array_datos.h.length-9];
    let high_10 = array_datos.h[array_datos.h.length-10];
    let high_11 = array_datos.h[array_datos.h.length-11];

    let max = Mayor([high_2,high_3,high_4,high_5,high_6,high_7,high_8,high_9,high_10,high_11]);

    let low_2 = array_datos.l[array_datos.l.length-2];
    let low_3 = array_datos.l[array_datos.l.length-3];
    let low_4 = array_datos.l[array_datos.l.length-4];
    let low_5 = array_datos.l[array_datos.l.length-5];
    let low_6 = array_datos.l[array_datos.l.length-6];
    let low_7 = array_datos.l[array_datos.l.length-7];
    let low_8 = array_datos.l[array_datos.l.length-8];
    let low_9 = array_datos.l[array_datos.l.length-9];
    let low_10 = array_datos.l[array_datos.l.length-10];
    let low_11 = array_datos.l[array_datos.l.length-11];

    let min = Menor([low_2,low_3,low_4,low_5,low_6,low_7,low_8,low_9,low_10,low_11]);
    
    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20_10 = Media20(array_datos.c,array_datos.c.length-10);

    let MM200 = Media200(array_datos.c,array_datos.c.length-1)


    if(close > open && cuerpo > (0.7 * rango) && close > MM200 && MM200 > MM20_10 && high >= max && low <= MM200){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;
        operacion.mm200 = MM200;

        return operacion;
    }


    if(close < open && cuerpo > (0.7 * rango) && close < MM200 && MM200 < MM20_10 && low <= min && high >= MM200){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;
        operacion.mm200 = MM200;
        
        return operacion;
    }
        
    return false;
}


function VRI (array_datos){

    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let low = array_datos.l[array_datos.l.length-1];
    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];

    let rango = Math.abs(high - low);


    let high_1 = array_datos.h[array_datos.h.length-2];
    let low_1 = array_datos.l[array_datos.l.length-2];
    let close_1 = array_datos.c[array_datos.c.length-2];
    let open_1 = array_datos.o[array_datos.o.length-2];

    // let high_2 = array_datos.h[array_datos.h.length-2];
    // let high_3 = array_datos.h[array_datos.h.length-3];
    // let high_4 = array_datos.h[array_datos.h.length-4];
    // let high_5 = array_datos.h[array_datos.h.length-5];
    // let high_6 = array_datos.h[array_datos.h.length-6];
    // let high_7 = array_datos.h[array_datos.h.length-7];
    // let high_8 = array_datos.h[array_datos.h.length-8];
    // let high_9 = array_datos.h[array_datos.h.length-9];
    // let high_10 = array_datos.h[array_datos.h.length-10];
    // let high_11 = array_datos.h[array_datos.h.length-11];

    // let max = Mayor([high_2,high_3,high_4,high_5,high_6,high_7,high_8,high_9,high_10,high_11]);

    // let low_2 = array_datos.l[array_datos.l.length-2];
    // let low_3 = array_datos.l[array_datos.l.length-3];
    // let low_4 = array_datos.l[array_datos.l.length-4];
    // let low_5 = array_datos.l[array_datos.l.length-5];
    // let low_6 = array_datos.l[array_datos.l.length-6];
    // let low_7 = array_datos.l[array_datos.l.length-7];
    // let low_8 = array_datos.l[array_datos.l.length-8];
    // let low_9 = array_datos.l[array_datos.l.length-9];
    // let low_10 = array_datos.l[array_datos.l.length-10];
    // let low_11 = array_datos.l[array_datos.l.length-11];

    // let min = Menor([low_2,low_3,low_4,low_5,low_6,low_7,low_8,low_9,low_10,low_11]);
    
    let cuerpo_3 = array_datos.h[array_datos.h.length-3] - array_datos.l[array_datos.l.length-3];
    let cuerpo_4 = array_datos.h[array_datos.h.length-4] - array_datos.l[array_datos.l.length-4];
    let cuerpo_5 = array_datos.h[array_datos.h.length-5] - array_datos.l[array_datos.l.length-5];
    let cuerpo_6 = array_datos.h[array_datos.h.length-6] - array_datos.l[array_datos.l.length-6];
    let cuerpo_7 = array_datos.h[array_datos.h.length-7] - array_datos.l[array_datos.l.length-7];
    let cuerpo_8 = array_datos.h[array_datos.h.length-8] - array_datos.l[array_datos.l.length-8];
    let cuerpo_9 = array_datos.h[array_datos.h.length-9] - array_datos.l[array_datos.l.length-9];
    let cuerpo_10 = array_datos.h[array_datos.h.length-10] - array_datos.l[array_datos.l.length-10];
    let cuerpo_11 = array_datos.h[array_datos.h.length-11] - array_datos.l[array_datos.l.length-11];
    let cuerpo_12 = array_datos.h[array_datos.h.length-12] - array_datos.l[array_datos.l.length-12];

    let mayor = Mayor([cuerpo_3],[cuerpo_4],[cuerpo_5],[cuerpo_6],[cuerpo_7],[cuerpo_8],[cuerpo_9],[cuerpo_10],[cuerpo_11],[cuerpo_12]);

    let rango_1 = Math.abs(high_1 - low_1);
    let cuerpo_1 = Math.abs(open_1 - close_1);


    if(close_1 > open_1 && cuerpo_1 > (0.7 * rango_1) &&  rango_1 >= mayor && rango < (rango_1 * 0.5)){

        operacion.jugada = "VRI";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if(close_1 < open_1 && cuerpo_1 > (0.7 * rango_1) &&  rango_1 >= mayor && rango < (rango_1 * 0.5)){

        operacion.jugada = "VRI";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;
        
        return operacion;
    }
        
    return false;
}


function Reversa (array_datos){

    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let low = array_datos.l[array_datos.l.length-1];
    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];

    let high_2 = array_datos.h[array_datos.h.length-2];
    let high_3 = array_datos.h[array_datos.h.length-3];
    let high_4 = array_datos.h[array_datos.h.length-4];
    let high_5 = array_datos.h[array_datos.h.length-5];
    let high_6 = array_datos.h[array_datos.h.length-6];
    let high_7 = array_datos.h[array_datos.h.length-7];
    let high_8 = array_datos.h[array_datos.h.length-8];
    let high_9 = array_datos.h[array_datos.h.length-9];
    let high_10 = array_datos.h[array_datos.h.length-10];
    let high_11 = array_datos.h[array_datos.h.length-11];


    let low_2 = array_datos.l[array_datos.l.length-2];
    let low_3 = array_datos.l[array_datos.l.length-3];
    let low_4 = array_datos.l[array_datos.l.length-4];
    let low_5 = array_datos.l[array_datos.l.length-5];
    let low_6 = array_datos.l[array_datos.l.length-6];
    let low_7 = array_datos.l[array_datos.l.length-7];
    let low_8 = array_datos.l[array_datos.l.length-8];
    let low_9 = array_datos.l[array_datos.l.length-9];
    let low_10 = array_datos.l[array_datos.l.length-10];
    let low_11 = array_datos.l[array_datos.l.length-11];

    
    
    let open_2 = array_datos.o[array_datos.o.length-2];
    let open_3 = array_datos.o[array_datos.o.length-3];
    let open_4 = array_datos.o[array_datos.o.length-4];
    let open_5 = array_datos.o[array_datos.o.length-5];
    let open_6 = array_datos.o[array_datos.o.length-6];
    let open_7 = array_datos.o[array_datos.o.length-7];
    let open_8 = array_datos.o[array_datos.o.length-8];
    let open_9 = array_datos.o[array_datos.o.length-9];
    let open_10 = array_datos.o[array_datos.o.length-10];



    let close_2 = array_datos.c[array_datos.c.length-2];
    let close_3 = array_datos.c[array_datos.c.length-3];
    let close_4 = array_datos.c[array_datos.c.length-4];
    let close_5 = array_datos.c[array_datos.c.length-5];
    let close_6 = array_datos.c[array_datos.c.length-6];
    let close_7 = array_datos.c[array_datos.c.length-7];
    let close_8 = array_datos.c[array_datos.c.length-8];
    let close_9 = array_datos.c[array_datos.c.length-9];
    let close_10 = array_datos.c[array_datos.c.length-10];



    if((close_10 < open_10 || high_11 > high_10) && (close_9 < open_9 || high_10 > high_9) && (close_8 < open_8 || high_9 > high_8) && (close_7 < open_7 || high_8 > high_7) &&(close_6 < open_6 || high_7 > high_6) &&(close_5 < open_5 || high_6 > high_5) && (close_4 < open_4 || high_5 > high_4) && (close_3 < open_3 || high_4 > high_3) && (close_2 < open_2 || high_3 > high_2) && (close < open || high_2 > high)){

        operacion.jugada = "Reversa";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if((close_10 > open_10 || low_11 < low_10) && (close_9 > open_9 || low_10 < low_9) && (close_8 > open_8 || low_9 < low_8) && (close_7 > open_7 || low_8 < low_7) && (close_6 > open_6 || low_7 < low_6) && (close_5 > open_5 || low_6 < low_5) && (close_4 > open_4 || low_5 < low_4) && (close_3 > open_3 || low_4 < low_3) && (close_2 > open_2 || low_3 < low_2) && (close > open || low_2 < low)){

        operacion.jugada = "Reversa";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }
        
    return false;
}



function Analisis(señal,datos,jugadas) {

    let position = datos.t.indexOf(señal.time);
    
    let date = new Date(señal.time * 1000).toISOString();
    let date2 = date.split("T")[0] + "T19:30:00.000Z";
    let date3 = date.split("T")[0] + "T14:00:00.000Z"
    
    return new Promise(resolve => {
        if(moment(date2).isBefore(date) || moment(date3).isAfter(date)){
            resolve(false);
        }
    
        if(!datos.h[position+20]){
            resolve(false);
        }
    
        if(señal.dir == "L"){
            if(datos.h[position+1]>datos.h[position]){
        
                let comprobacion = jugadas.find(element => element.time == señal.time && element.accion == señal.accion);
                if(comprobacion){
                    resolve(false);
                }
                señal.entrada = datos.h[position] + 0.02;
    
                if(datos.l[position+1] < datos.l[position]){
                    
                    señal.stop = datos.l[position+1] - 0.03;
                
                }else{
    
                    señal.stop = datos.l[position] - 0.03;
                    
                }
    
    
    
    
                resolve(señal);
            
            }else if(datos.h[position+2]>datos.h[position+1]){
                
    
                señal.time = datos.t[position+1];
                señal.fecha= new Date(datos.t[position+1] * 1000).toLocaleString();
                señal.entrada = datos.h[position+1] + 0.02;
    
                let comprobacion = jugadas.find(element => element.time == señal.time && element.accion == señal.accion);
                if(comprobacion){
                    resolve(false);
                }
                if(señal.time == 1630505100){
                    console.log(datos.l[position+2]);
                }
                if(datos.l[position+2] < datos.l[position+1]){
                    
                    señal.stop = datos.l[position+2] - 0.03;
                
                }else{
    
                    señal.stop = datos.l[position+1] - 0.03;
                    
                }
    
                
    
                resolve(señal);
    
            }else{
                resolve(false);
            }
        }else{
            
            if(datos.l[position+1] < datos.l[position]){
        
                let comprobacion = jugadas.find(element => element.time == señal.time && element.accion == señal.accion);
                if(comprobacion){
                    resolve(false);
                }
                señal.entrada = datos.l[position] - 0.02;
    
                if(datos.h[position+1] > datos.h[position]){
                    
                    señal.stop = datos.h[position+1] + 0.03;
                
                }else{
    

                    señal.stop = datos.h[position] + 0.03;
                    
                }
        
    
                resolve(señal);
            
            }else if(datos.l[position+2] < datos.l[position+1]){
                
    
                señal.time = datos.t[position+1];
                señal.fecha= new Date(datos.t[position+1] * 1000).toLocaleString();
                señal.entrada = datos.l[position+1] - 0.02;
    
                let comprobacion = jugadas.find(element => element.time == señal.time && element.accion == señal.accion);
                if(comprobacion){
                    resolve(false);
                }
    
                if(datos.h[position+2] > datos.h[position+1]){
                    
                    señal.stop = datos.h[position+2] + 0.03;
                
                }else{
    
                    señal.stop = datos.h[position+1] + 0.03;
                    
                }
        
    
                resolve(señal);
    
            }else{
                resolve(false);
            }
        }
    });   
   
}



//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 empiezo a usar el trailing stop
//Con el rompimiento vela a vela tomo la mitad, pero tiene que ser por encima de 2:1
//Con el rompimiento de la mm8 me salgo de la operación aunque no esté por encima de 2:1 pero si que tiene que haber llegado a BE primero
function Gestión4 (time,dir,entrada,stop, array_datos){

    let riesgo = 50;

    let operación = {
        fecha:time,
        dirección:dir,
        entrada: Math.round( entrada * 1000 ) / 1000,
        stop_loss: stop,

    }
    

    operación.unidad_riesgo = Math.abs(Math.round( (operación.entrada - operación.stop_loss) * 1000 ) / 1000);
    operación.lotes = Math.round(riesgo / operación.unidad_riesgo);
    operación.tercio = (dir == "L")? Math.round((operación.entrada + (operación.unidad_riesgo * 2 / 3))*1000) / 1000 : Math.round((operación.entrada - (operación.unidad_riesgo * 2 / 3))*1000) / 1000;
    operación.BE = (dir == "L")? Math.round((operación.entrada + operación.unidad_riesgo)*1000) / 1000 : Math.round((operación.entrada - operación.unidad_riesgo)*1000) / 1000;
    operación.doble = (dir == "L")? Math.round((operación.entrada + operación.unidad_riesgo * 2)*1000) / 1000 : Math.round((operación.entrada - operación.unidad_riesgo * 2)*1000) / 1000;
    operación.salida = 0;

    let salidas = [];
    let resultado = 0;

    let gestion = [];

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=true;
    let m8=false;
    
    let respuesta = {
        gest : gestion,
        result : 0,
        salida:0
    }
    let inicio = 0;

    for(i=0;i<array_datos.c.length; i++){

        if(array_datos.t[i] <= operación.fecha){
            inicio = i;
            continue;
        }


        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let MM8 = Media8(array_datos.c,i+1);
        let high_1 = array_datos.h[i-1];

        if(operación.dirección == "L"){
            
            let date = new Date(array_datos.t[i] * 1000).toISOString();
            let date2 = date.split("T")[0] + "T19:54:00.000Z";

            if(moment(date).isAfter(date2)){
                salidas.push(open);
                break;
            }

            if(bbb && low < low_1-0.01 && low_1 > operación.doble){
                salidas.push(Math.round( (low_1-0.01) * 1000 ) / 1000);
                bbb=false;
                gestion.push("Rompimiento vela a vela  "+ (low_1-0.01));
        
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 1000 ) / 1000);
                gestion.push("Salida por stop  "+ ( operación.stop_loss * 100000 ) / 100000);
                respuesta.salida = i - inicio;
                break;
            }

            if(m8 && low<MM8){
                
                if(operación.stop_loss<low - 0.01){
                    operación.stop_loss = Math.round( (low_1-0.01) * 1000 ) / 1000;

                    gestion.push("Posible rompimiento mm8  "+ array_datos.t[i]);

                }
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3);
                tercio=false;
                gestion.push("Ajusto mis stop a 1/3 de mi RU");
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                tercio=false;
                m8 = true;
                gestion.push("Ajusto mi stop a BE");
            }

        }else{
       
            let date = new Date(array_datos.t[i] * 1000).toISOString();
            let date2 = date.split("T")[0] + "T19:54:00.000Z";

            if(moment(date).isAfter(date2)){
                salidas.push(open);
                break;
            }

            if(bbb && high > high_1+0.01 && high_1 < operación.doble){
                salidas.push(Math.round( (high_1+0.01) * 1000 ) / 1000);
                bbb=false;
                gestion.push("Rompimiento vela a vela  "+ (high_1+0.01));

            }

            if(high >= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 1000 ) / 1000);
                gestion.push("Salida por stop  "+ ( operación.stop_loss * 100000 ) / 100000)
                respuesta.salida = i - inicio;

                break;                
            }

            if(m8 && high > MM8){

                if(operación.stop_loss>high + 0.01){
                    operación.stop_loss = high + 0.01;
                    gestion.push("Posible rompimiento mm8 "+ array_datos.t[i]);

                }
            }

            if(low <= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);
                tercio=false;
                gestion.push("Ajusto mis stop a 1/3 de mi RU");

            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                m8 = true;
                tercio=false;
                gestion.push("Ajusto mi stop a BE");

            }

        }
    }

    if(operación.dirección == "L"){
        
        operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

        resultado = (operación.salida - operación.entrada) * operación.lotes;
    }else{
        operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

        resultado = (operación.entrada - operación.salida) * operación.lotes;
    }

    respuesta.result =resultado;

    return respuesta;
}

function Estadisticas(jugadas) {
    
    let ganadoras = [];
    let perdedoras = [];
    let break_even = [];

    let ganancias = 0;
    let perdidas = 0;
    let balance = 0;
    let mayor = 0;
    let menor = 0;

    let estadisticas = {
        jugadas_total:jugadas.length,
        ganandoras:0,
        perdedoras:0,
        break_even:0,
        porcentaje_acierto:0,
        ganancia_media:0,
        perdida_media:0,
        mayor_ganancia:0,
        mayor_perdida:0,
        balance:0

    }

    for(let jugada of jugadas){
        
        if(jugada.resultado.result > -7){

            if(jugada.resultado.result > 7){
                
                ganadoras.push(jugada);
                ganancias = ganancias + jugada.resultado.result;
                if(jugada.resultado.result > mayor){ mayor = jugada.resultado.result}

            }else{
                break_even.push(jugada);
                balance = balance + jugada.resultado.result;
            }

        }else{

            perdedoras.push(jugada);
            perdidas = perdidas + jugada.resultado.result;
            if(jugada.resultado.result < menor){ menor = jugada.resultado.result}

        }
    }

    estadisticas.ganandoras = ganadoras.length;
    estadisticas.perdedoras = perdedoras.length;
    estadisticas.break_even = break_even.length;
    estadisticas.porcentaje_acierto = (ganadoras.length + break_even.length) * 100 / jugadas.length;
    estadisticas.ganancia_media = ganancias / ganadoras.length;
    estadisticas.perdida_media = perdidas / perdedoras.length;
    estadisticas.balance = ganancias + perdidas + balance;
    estadisticas.mayor_ganancia = mayor;
    estadisticas.mayor_perdida = menor;
    estadisticas.beneficio_operacion = Math.round(estadisticas.balance / jugadas.length * 1000) / 1000;

    return estadisticas;

}

function SepararDireccion(jugadas) {
    let objeto_direccion = {
        largos:[],
        cortos:[]
    };

    for(let jugada of jugadas){
    
        if(jugada.dir == "L"){
    
            objeto_direccion.largos.push(jugada);
    
        }else{
    
            objeto_direccion.cortos.push(jugada);
    
        }
    }

    return objeto_direccion;
}


function Formatear (array_datos){
    //console.log(array_datos);
    let datos_procesados = {
        c:[],
        h:[],
        l:[],
        o:[],
        t:[]
    }
    if(!array_datos.t){
        console.log(array_datos);
    }

    for(i=0;i<array_datos.t.length; i++){
        let date = new Date(array_datos.t[i] * 1000).toISOString();
        let date2 = date.split("T")[0] + "T20:00:00.000Z";
        let date3 = date.split("T")[0] + "T13:25:00.000Z"


        if(moment(date).isBefore(date2) && moment(date).isAfter(date3)){
            datos_procesados.c.push(array_datos.c[i]);
            datos_procesados.h.push(array_datos.h[i]);
            datos_procesados.l.push(array_datos.l[i]);
            datos_procesados.o.push(array_datos.o[i]);
            datos_procesados.t.push(array_datos.t[i]);
        }

    }

    return datos_procesados;
}


function Media20 (data,position){
    let cierres = data.slice(position-20, position);
    return CalcularMedia(cierres);
}

function Media8 (data,position){
    let cierres = data.slice(position-8, position);
    return CalcularMedia(cierres);
}

function Media200 (data,position){
    let cierres = data.slice(position-200, position);
    return CalcularMedia(cierres);
}



function CalcularMedia (datos){
    let media = 0;

    for(let a of datos){
        media = media + a; 
    }
    return media/datos.length;
}

function Menor (array){
    let menor = array[0];

    for(let a of array){
        if(a<menor){
            menor=a;
        }
    }
    return menor;
}


function Mayor (array){
    let mayor = array[0];

    for(let a of array){
        if(a>mayor){
            mayor=a;
        }
    }
    return mayor;
}

function Suma (array){

    let suma=0;
    
    for(let a of array){
        suma= suma + a;
    }
    return suma;
}


function Crear_Json(jugada){

    return new Promise(resolve => {
        fs.readFile('./Estadisticas/Json/VBS_1.json', 'utf8', function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
            obj = JSON.parse(data); //now it an object
            obj.table.push(jugada); //add some data
            json = JSON.stringify(obj); //convert it back to json
            fs.writeFile('./Estadisticas/Json/VBS_1.json', json, 'utf8', ()=>{ resolve(console.log("hecho"))}); // write it back 
        }});
    });

}

function Delay(){
    console.log("Iniciando pausa de la API");
    
    return new Promise(resolve => {
        setTimeout(function () {
            resolve("Continuando"); 
            }, 50000)
    });    
}



// MM20(res.body.c,res.body.c.length-1) Media movil vela anterior a la en desarrollo pero es la que voy a usar para ver el patrón
// MM20(res.body.c,res.body.c.length-10) Media movil de -11 contando la que está en desarrollo 
// MM20(res.body.c,res.body.c.length-20) 

//Programación stop alternativo para largos
//ACTIVACIÓN EN LA PRIMERA VELA
// if((señal.entrada - datos.l[position+1]) >= 0.07 ){
//     señal.stop = datos.l[position+1] - 0.03;

// }else{
//     señal.stop = datos.l[position] - 0.03;
// }
//ACTICACIÓN EN LA SEGUNDA VELA
// if((señal.entrada - datos.l[position+2]) >= 0.07 ){
//     señal.stop = datos.l[position+2] - 0.03;

// }else{
//     señal.stop = datos.l[position+1] - 0.03;
// }


Inicio();







