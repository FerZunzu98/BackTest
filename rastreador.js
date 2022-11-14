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
        Procesar_datos(array);
      });
}

function Procesar_datos (array_datos){
    console.log(array_datos[0]);
    let array_vbs1 = VBS1(array_datos);
    console.log(array_vbs1[146]); 
    
}

class Señal {
    constructor(time, fecha) {
      this.time = time;
      this.fecha = fecha;
    }
  }

//En esta voy a buscar VBS simplemente tratando de localizar tras velas seguidas con mínimos menores que estés por encima de las mm8 y mm20 ascendentes
function VBS1 (array_datos){
    let configuraciones = [];
    let id=0;

    for(i=20;i<array_datos.length; i++){
        let time = new Date(array_datos[i].time * 1000)
        let open = parseFloat(array_datos[i].open.replace(",","."));
        let high = parseFloat(array_datos[i].high.replace(",","."));
        let low = parseFloat(array_datos[i].low.replace(",","."));
        let close = parseFloat(array_datos[i].close.replace(",","."));
        let MM200 = parseFloat(array_datos[i].MA1.replace(",","."));
        let MM20 = parseFloat(array_datos[i].MA2.replace(",","."));
        let MM8 = parseFloat(array_datos[i].MA3.replace(",","."));

        let MM20_10 = parseFloat(array_datos[i-10].MA2.replace(",","."));
        let MM20_20 = parseFloat(array_datos[i-20].MA2.replace(",","."));
        let MM8_10 = parseFloat(array_datos[i-10].MA3.replace(",","."));
        let MM8_20 = parseFloat(array_datos[i-20].MA3.replace(",","."));

        let high_1 = parseFloat(array_datos[i-1].high.replace(",","."));
        let high_2 = parseFloat(array_datos[i-2].high.replace(",","."));
        let high_3 = parseFloat(array_datos[i-3].high.replace(",","."));


        if(MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_10 && MM8_10 > MM8_20 && high < high_1 && high_1 < high_2){
            if(id==0){
                
                configuraciones.push(new Señal(array_datos[i].time, time.toLocaleString()));
                id=1;
            }
        }else{
            id=0;
        };
    };
    
    return configuraciones;
}


function VelaCola (array_datos){
    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-2];
    let high_1 = array_datos.h[array_datos.h.length-3];
    let high_2 = array_datos.h[array_datos.h.length-4];


    let low = array_datos.l[array_datos.l.length-2];
    let low_1 = array_datos.l[array_datos.l.length-3];
    let low_2 = array_datos.l[array_datos.l.length-4];


    let close = array_datos.c[array_datos.c.length-2];
    let open = array_datos.o[array_datos.o.length-2];
    
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
        operacion.riesgo = high - low;
        operacion.lotes = operacion.ru /operacion.riesgo;

        return operacion;
    }


    if(MM20 <= high && MM20 >= low && MM20 < MM20_10 && MM20_10 < MM20_20 && cuerpo < (0.3 * rango) && low_1 < MM20 && low_2 < MM20){

        operacion.jugada = "Vela de cola";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = high - low;
        operacion.lotes = operacion.ru /operacion.riesgo;

        return operacion;
    }
        
    return false;
}
