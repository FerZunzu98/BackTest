const request = require('request');
var fs = require('fs');
const moment = require('moment');
const { format } = require('path');
const { compileFunction } = require('vm');

async function Inicio() {
    
    let velas_desde_senal = 0;
    let fecha = 1629224100 + (300 * velas_desde_senal);
    let dirección = "C";
    let riesgo = 50;
    let simbolo = "AAPL";

    let operación = {
        fecha:fecha,
        dirección:dirección,
        entrada: 149.99,
        stop_loss: 150.18,

    }

    operación.unidad_riesgo = Math.abs(Math.round( (operación.entrada - operación.stop_loss) * 100000 ) / 100000);
    operación.lotes = Math.round(riesgo / operación.unidad_riesgo);
    operación.tercio = (dirección == "L")? Math.round((operación.entrada + (operación.unidad_riesgo * 2 / 3))*100000) / 100000 : Math.round((operación.entrada - (operación.unidad_riesgo * 2 / 3))*100000) / 100000;
    operación.BE = (dirección == "L")? Math.round((operación.entrada + operación.unidad_riesgo)*100000) / 100000 : Math.round((operación.entrada - operación.unidad_riesgo)*100000) / 100000;
    operación.doble = (dirección == "L")? Math.round((operación.entrada + operación.unidad_riesgo * 2)*100000) / 100000 : Math.round((operación.entrada - operación.unidad_riesgo * 2)*100000) / 100000;
    operación.salida = 0;

    console.log(operación)

    await Peticion(simbolo,5,fecha,operación)

}


function Peticion(accion,resolution,fecha,operacion) {

    let inicio = fecha - 1000000; 
    let fin = fecha + 1000000;

    return new Promise(resolve => {
                 
        request('https://finnhub.io/api/v1/stock/candle?symbol='+accion+'&resolution='+resolution+'&from='+inicio+'&to='+fin+'&token=c2qih02ad3ickc1loc60', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            
            let datos = Formatear(res.body);

            console.log("Resultado Gestión 1: "+Gestión1(operacion,datos));
            console.log("Resultado Gestión 2: "+Gestión2(operacion,datos));
            console.log("Resultado Gestión 3: "+Gestión3(operacion,datos));
            console.log("Resultado Gestión 4: "+Gestión4(operacion,datos));
            console.log("Resultado Gestión 5: "+Gestión5(operacion,datos));


            resolve(datos);

        }); 
    });
};


//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 tomo 1/3 de mi operción
//Con el rompimiento vela a vela tomo otro tercio 
//Con el rompimiento de la mm8 me salgo de la operación
function Gestión1 (operacion, array_datos){

    let operación = JSON.parse(JSON.stringify(operacion));
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=0;i<array_datos.c.length; i++){


        if(array_datos.t[i] <= operación.fecha){
            continue;
        }

        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let MM8 = Media8(array_datos.c,i);
        let high_1 = array_datos.h[i-1];
        
        if(operación.dirección == "L"){
            if(bbb && low < low_1-0.01){
                salidas.push(low_1-0.01);
 

                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                console.log("mm8");
                operación.stop_loss = low - 0.02;
            }

            if(low <= operación.stop_loss){

                if(!doble && bbb){
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }else{
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                }
                break;
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3) ;
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(high >= operación.doble && doble){
                
                salidas.push(operación.doble)
                console.log(array_datos.t[i]);
                doble = false;
                bbb = true;
            }
        }else{

            if(bbb && high > high_1+0.01){
                salidas.push(high_1+0.03);
                console.log("Rompimiento vela a vela");
 
                bbb=false;
                m8=true;
            }

            if(m8 && high>MM8 && high < operación.stop_loss){
                console.log("beeee");

                operación.stop_loss = high + 0.02;
            }

            if(high >= operación.stop_loss){

                if(!doble && bbb){
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }else{
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                }
                break;
            }

            if(low <= operación.tercio && low > operación.BE && tercio){
                
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);

                tercio=false;
                console.log("afasa")

            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;

            }

            if(low <= operación.doble && doble){
                
                salidas.push(operación.doble)
                console.log(array_datos.t[i]);
                doble = false;
                bbb = true;
            }
        }
    }

    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
}


//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 ajusto mi stop a 1:1
//Con el rompimiento vela a vela tomo la mitad, si es por encima de 2:1 
//Con el rompimiento de la mm8 me salgo de la operación
function Gestión2 (operacion, array_datos){

    let operación = JSON.parse(JSON.stringify(operacion));
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=true;
    let m8=false;
    for(i=0;i<array_datos.c.length; i++){

        if(array_datos.t[i] <= operación.fecha){
            continue;
        }


        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let high_1 = array_datos.h[i-1];

        let MM8 = Media8(array_datos.c,i);


        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.01 && low_1 > operación.doble){
                salidas.push(low_1-0.01);
                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                
                operación.stop_loss = low - 0.02;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(high >= operación.doble && doble){
                operación.stop_loss = operación.BE;
                doble = false;
            }
        }else{

            if(bbb && high > high_1+0.01 && high_1 < operación.doble){
                salidas.push(high_1+0.01);
                bbb=false;
                m8=true;

            }

            if(m8 && high>MM8 && high < operación.stop_loss){
                
                operación.stop_loss = high + 0.02;
            }

            if(high >= operación.stop_loss){
            

                salidas.push(operación.stop_loss);
                break;
            }

            if(low <= operación.tercio && low > operación.BE && tercio){
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(low <= operación.doble && doble){
                operación.stop_loss = operación.BE;
                doble = false;
            }
        }
    }
    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
}




//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 empiezo a usar el trailing stop
//Con el rompimiento vela a vela tomo la mitad, aunque sea por debajo de 2:1
//Con el rompimiento de la mm8 me salgo de la operación
function Gestión3 (operacion, array_datos){

    let operación = JSON.parse(JSON.stringify(operacion));
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=0;i<array_datos.c.length; i++){


        if(array_datos.t[i] <= operación.fecha){
            continue;
        }


        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let MM8 = Media8(array_datos.c,i);
        let high_1 = array_datos.h[i-1];

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.01){
                salidas.push(low_1-0.01);
                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                
                operación.stop_loss = low - 0.02;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(high >= operación.doble && doble){
                doble = false;
                bbb = true;
            }
        }else{
                        
            if(bbb && high > high_1+0.01){
                salidas.push(high_1+0.01);
                bbb=false;
                m8=true;
            }

            if(m8 && high>MM8 && high < operación.stop_loss){
                
                operación.stop_loss = high + 0.02;
            }

            if(high >= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(low <= operación.tercio && low > operación.BE && tercio){
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(low <= operación.doble && doble){
                doble = false;
                bbb = true;
            }
        }
    }
    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
}



//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 empiezo a usar el trailing stop
//Con el rompimiento vela a vela tomo la mitad, pero tiene que ser por encima de 2:1
//Con el rompimiento de la mm8 me salgo de la operación aunque no esté por encima de 2:1 pero si que tiene que haber llegado a BE primero
function Gestión4 (operacion, array_datos){

    let operación = JSON.parse(JSON.stringify(operacion));
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=true;
    let m8=false;
    for(i=0;i<array_datos.c.length; i++){

        if(array_datos.t[i] <= operación.fecha){
            continue;
        }


        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let MM8 = Media8(array_datos.c,i);
        let high_1 = array_datos.h[i-1];

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.01 && low_1 > operación.doble){
                salidas.push(low_1-0.01);
                bbb=false;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(m8 && low<MM8){
                
                if(operación.stop_loss<low - 0.01){
                    operación.stop_loss = low - 0.01;
                }
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                m8 = true;
            }

        }else{

            if(bbb && high > high_1+0.01 && high_1 < operación.doble){
                salidas.push(high_1+0.01);
                bbb=false;
            }

            if(high >= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(m8 && high > MM8){
                console.log("dentro")
                if(operación.stop_loss>high + 0.01){
                    operación.stop_loss = high + 0.01;
                }
            }

            if(low <= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                m8 = true;
            }

        }
    }
    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
}

//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 tomo 1/3 de mi operación 
//Con el rompimiento vela a vela tomo otro tercio, pero tiene que ser por encima de 2:1
//Con el rompimiento de la mm8 me salgo de la operación aunque no esté por encima de 2:1 pero si que tiene que haber llegado a BE primero
function Gestión5 (operacion, array_datos){

    let operación = JSON.parse(JSON.stringify(operacion));
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=0;i<array_datos.c.length; i++){


        if(array_datos.t[i] <= operación.fecha){
            continue;
        }


        let open = array_datos.o[i];
        let high = array_datos.h[i];
        let low = array_datos.l[i];
        let close = array_datos.c[i];

        let low_1 = array_datos.l[i-1];
        let high_1 = array_datos.h[i-1];

        let MM8 = Media8(array_datos.c,i-1);

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.01 && low > operación.doble){
                salidas.push(low_1-0.01);
                bbb=false;
                m8=true;
            }

            if(low <= operación.stop_loss){

                if(!doble && bbb){
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }else{
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }
                break;
            }
            if(m8 && low<MM8 && low > operación.stop_loss){
                if(operación.stop_loss<low - 0.01){
                    operación.stop_loss = low - 0.01;
                }

            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= operación.entrada - (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                m8=true;
            }

            if(high >= operación.doble && doble){
                salidas.push(operación.doble)
                doble = false;
                bbb = true;
            }
        }else{
            
            if(bbb && high > high_1+0.01 && high_1 < operación.doble){
                salidas.push(high_1+0.01);
                bbb=false;
                m8=true;
            }

            if(high >= operación.stop_loss){

                if(!doble && bbb){
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }else{
                    salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);

                }
                break;
            }
            if(m8 && high>MM8 && high < operación.stop_loss){
                if(operación.stop_loss> high + 0.01){
                    operación.stop_loss = high + 0.01;
                }

            }

            if(low <= operación.tercio && low < operación.BE && tercio){
                operación.stop_loss= operación.entrada + (operación.unidad_riesgo / 3);
                tercio=false;
            }

            if(low <= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
                m8=true;
            }

            if(low <= operación.doble && doble){
                salidas.push(operación.doble)
                doble = false;
                bbb = true;
            }
        }
    }
    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
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


function Media8 (data,position){
    let cierres = data.slice(position-8, position);
    return CalcularMedia(cierres);
}


function CalcularMedia (datos){
    let media = 0;

    for(let a of datos){
        media = media + a; 
    }
    return media/datos.length;
}

function Suma (array){

    let suma=0;
    
    for(let a of array){
        suma= suma + a;
    }
    return suma;
}

Inicio()