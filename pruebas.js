const request = require('request');


Peticion("AAPL",5,1633250855)

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

