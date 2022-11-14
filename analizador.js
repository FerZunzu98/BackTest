const csv = require('csv-parser');
const fs = require('fs');
const { resolve } = require('path');


Leer_Csv("datos3.csv");

function Leer_Csv(nombre){
    let array = [];

    fs.createReadStream(nombre)
      .pipe(csv())
      .on('data', (row) => {
          
          array.push(row);
        
    
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        CalcularResutados(array);
      });
}

function CalcularResutados(array_datos){
    
    let fecha = 1612882800;
    let dirección = "L";
    let riesgo = 500;

    let vela_entrada = array_datos.find(element => element.time == fecha);

    let high = parseFloat(vela_entrada.high.replace(",","."));
    let low = parseFloat(vela_entrada.low.replace(",","."));
    let close = parseFloat(vela_entrada.close.replace(",","."));

    
    
    let operación = {
        fecha:fecha,
        dirección:dirección,
        entrada: (dirección == "L")? high + 0.0001: low - 0.0001,
        stop_loss: (dirección == "L")? low - 0.00015: high + 0.00015,
        
    }

    operación.unidad_riesgo = Math.abs(Math.round( (operación.entrada - operación.stop_loss) * 100000 ) / 100000);
    operación.lotes = Math.round(riesgo / operación.unidad_riesgo);
    operación.tercio = (dirección == "L")? Math.round((operación.entrada + (operación.unidad_riesgo * 2 / 3))*100000) / 100000 : Math.round((operación.entrada - (operación.unidad_riesgo * 2 / 3))*100000) / 100000;
    operación.BE = (dirección == "L")? Math.round((operación.entrada + operación.unidad_riesgo)*100000) / 100000 : Math.round((operación.entrada - operación.unidad_riesgo)*100000) / 100000;
    operación.doble = (dirección == "L")? Math.round((operación.entrada + operación.unidad_riesgo * 2)*100000) / 100000 : Math.round((operación.entrada - operación.unidad_riesgo * 2)*100000) / 100000;
    operación.salida = 0;

    let resultado1 = Math.round(Gestión1(operación,array_datos)*100) /100;
    let resultado2 = Math.round(Gestión2(operación,array_datos)*100) /100;
    let resultado3 = Math.round(Gestión3(operación,array_datos)*100) /100;
    let resultado4 = Math.round(Gestión4(operación,array_datos)*100) /100;
    let resultado5 = Math.round(Gestión5(operación,array_datos)*100) /100;

    console.log(operación);

    console.log("El resultado de Gestión1 = "+resultado1);

    console.log("El resultado de Gestión2 = "+resultado2);

    console.log("El resultado de Gestión3 = "+resultado3);

    console.log("El resultado de Gestión4 = "+resultado4);

    console.log("El resultado de Gestión5 = "+resultado5);

}

//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 tomo 1/3 de mi operción
//Con el rompimiento vela a vela tomo otro tercio 
//Con el rompimiento de la mm8 me salgo de la operación
function Gestión1 (operation, array_datos){

    let operación = JSON.parse(JSON.stringify(operation));
    let vela_entrada = array_datos.find(element => element.time == operación.fecha);
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=array_datos.indexOf(vela_entrada);i<array_datos.length; i++){

        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));

        let low_1 = parseFloat(array_datos[i-1].low.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.0001){
                salidas.push(low_1-0.0001);
                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                
                operación.stop_loss = low - 0.0001;
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
                operación.stop_loss= Math.round((operación.entrada - (operación.unidad_riesgo / 3))*100000 / 100000) ;
                tercio=false;
            }

            if(high >= operación.BE && break_even){
                operación.stop_loss = operación.entrada
                break_even = false;
            }

            if(high >= operación.doble && doble){
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

//En esta gestión lo que voy a hacer es:
//Con 1:1 muevo mi stop a BE
//Con 2:1 ajusto mi stop a 1:1
//Con el rompimiento vela a vela tomo la mitad, si es por encima de 2:1 
//Con el rompimiento de la mm8 me salgo de la operación
function Gestión2 (operation, array_datos){

    let operación = JSON.parse(JSON.stringify(operation));
    let vela_entrada = array_datos.find(element => element.time == operación.fecha);
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=true;
    let m8=false;
    for(i=array_datos.indexOf(vela_entrada);i<array_datos.length; i++){

        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));

        let low_1 = parseFloat(array_datos[i-1].low.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.0001 && low_1 > operación.doble){
                salidas.push(low_1-0.0001);
                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                
                operación.stop_loss = low - 0.0001;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= Math.round((operación.entrada - (operación.unidad_riesgo / 3))*100000 / 100000) ;
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
function Gestión3 (operation, array_datos){

    let operación = JSON.parse(JSON.stringify(operation));
    let vela_entrada = array_datos.find(element => element.time == operación.fecha);
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=array_datos.indexOf(vela_entrada);i<array_datos.length; i++){

        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));

        let low_1 = parseFloat(array_datos[i-1].low.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.0001){
                salidas.push(low_1-0.0001);
                bbb=false;
                m8=true;
            }

            if(m8 && low<MM8 && low > operación.stop_loss){
                
                operación.stop_loss = low - 0.0001;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= Math.round((operación.entrada - (operación.unidad_riesgo / 3))*100000 / 100000) ;
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
function Gestión4 (operation, array_datos){

    let operación = JSON.parse(JSON.stringify(operation));
    let vela_entrada = array_datos.find(element => element.time == operación.fecha);
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=array_datos.indexOf(vela_entrada);i<array_datos.length; i++){

        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));

        let low_1 = parseFloat(array_datos[i-1].low.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.0001 && low > operación.doble){
                salidas.push(low_1-0.0001);
                bbb=false;
            }

            if(low <= operación.stop_loss){

                salidas.push(Math.round( operación.stop_loss * 100000 ) / 100000);
                break;
            }

            if(m8 && low<MM8){
                if(operación.stop_loss<low - 0.0001){
                    operación.stop_loss = low - 0.0001;
                }
            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= Math.round((operación.entrada - (operación.unidad_riesgo / 3))*100000 / 100000) ;
                tercio=false;
            }

            if(high >= operación.BE && break_even){
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
function Gestión5 (operation, array_datos){

    let operación = JSON.parse(JSON.stringify(operation));
    let vela_entrada = array_datos.find(element => element.time == operación.fecha);
    let salidas = [];
    let resultado = 0;

    let doble = true;
    let tercio = true;
    let break_even = true;
    let bbb=false;
    let m8=false;
    for(i=array_datos.indexOf(vela_entrada);i<array_datos.length; i++){

        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));

        let low_1 = parseFloat(array_datos[i-1].low.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        if(operación.dirección == "L"){
            
            if(bbb && low < low_1-0.0001 && low > operación.doble){
                salidas.push(low_1-0.0001);
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
                if(operación.stop_loss<low - 0.0001){
                    operación.stop_loss = low - 0.0001;
                }

            }

            if(high >= operación.tercio && high < operación.BE && tercio){
                operación.stop_loss= Math.round((operación.entrada - (operación.unidad_riesgo / 3))*100000 / 100000) ;
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
        }
    }
    console.log(salidas)

    operación.salida = Math.round( Suma(salidas) / salidas.length * 100000 )  / 100000

    resultado = (operación.salida - operación.entrada) * operación.lotes;

    return resultado;
}

function Suma (array){

    let suma=0;
    
    for(let a of array){
        suma= suma + a;
    }
    return suma;
}