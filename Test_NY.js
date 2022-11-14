const request = require('request');
var fs = require('fs');
const moment = require('moment');
const { format } = require('path');
const { compileFunction } = require('vm');


async function Bucle (resolution){

    let array_acciones = ["AAPL","CSCO","JPM","ORCL","AMD","C","KO","SBUX","MU"];

    let operaciones_encontradas = [];
    console.log("Comenzando a analizar los gráficos de "+resolution+" minutos");
   


    let array_operaciones= [];

    for(let accion of array_acciones){
        let now= new Date();
        let fecha= Math.round(now.getTime()/1000);



        let operacion = await Bucle2(accion,resolution,fecha)
        array_operaciones.push(operacion);
        

        
    }

    console.log(array_operaciones.length)
    for(let simbolo of array_operaciones){
        
        for(let señal of simbolo){

            for(let tiempo of señal){
                
                await Crear_Json(tiempo);
            }
        }
    }
    //let catalogo_pelis= JSON.stringify(array_pelis);
    // fs.writeFileSync("pelis.json",catalogo_pelis);
    
    return;
}


async function Bucle2(accion,resolution,fecha) {
    let array = new Array(8);

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
        fecha = operacion[0].time - 5000000;
    }

    return operaciones;
}


function Peticion(accion,resolution,fecha) {

    let inicio = fecha-10000000;

    return new Promise(resolve => {
                 
        request('https://finnhub.io/api/v1/stock/candle?symbol='+accion+'&resolution='+resolution+'&from='+inicio+'&to='+fecha+'&token=c2qih02ad3ickc1loc60', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            
            if(res.body["error"] == 'API limit reached. Please try again later. Remaining Limit: 0'){
                console.log("entrada")
                return resolve(false);
            }

            let datos = Formatear(res.body);

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



function VBS_1 (array_datos,accion){

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
        let MM20_10 = Media20(array_datos.c,i-4);
        let MM20_20 = Media20(array_datos.c,i-9);
    
        let MM8 = Media8(array_datos.c,i+1);
        let MM8_3 = Media8(array_datos.c,i-4);
        let MM8_5 = Media8(array_datos.c,i-9);
    
    
        if(MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_3 && MM8_3 > MM8_5 && high < high_1 && high_1 < high_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.h[i], array_datos.l[i],accion,MM20,MM8));

        }
    
        
        if(MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_3 && MM8_3 < MM8_5 && low > low_1 && low_1 > low_2){
            
            let time = new Date(array_datos.t[i] * 1000);

            configuraciones.push(new Señal(array_datos.t[i], time.toLocaleString(),array_datos.l[i], array_datos.h[i],accion,MM20,MM8));
        };
                
    }

    return configuraciones;
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


Inicio();







