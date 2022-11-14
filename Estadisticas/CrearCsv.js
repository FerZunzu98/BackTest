var fs = require('fs');
const csv = require('csv-parser');



fs.readdir("./Json", function (err, archivos) {
  if (err) {
  onError(err);
  return;
  }
  console.log(archivos);
  for(let a of archivos){
    crearCSV(a);
  }
  });




async function crearCSV(archivo){

  await fs.readFile('./Json/'+archivo, 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
    obj = JSON.parse(data); //now it an object
    console.log(obj.table[obj.table.length-1])
    console.log(crearCSV(obj.table,archivo.split(".")[0]))
}});

function crearCSV (array,archivo){
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: archivo+'.csv',
  header: [
    {id: 'accion', title: 'Simbolo'},
    {id: 'time', title: 'Time'},
    {id: 'fecha', title: 'Fecha'},
    {id: 'entrada', title: 'Entrada'},
    {id: 'stop', title: 'Stop'},
    {id: 'mm20', title: 'MM20'},
    {id: 'mm8', title: 'MM8'},


  ]
});

const data = array;

csvWriter
  .writeRecords(data)
  .then(()=> console.log('The CSV file was written successfully'));
}

}
