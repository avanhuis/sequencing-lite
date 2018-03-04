var jsondata;
var date;
var market;
var jsonArray;
var Brand = "Chevrolet";
var Market = "US";
function stringifyMonth(currentmonth){
  if (currentmonth < 10) { currentmonth = '0' + currentmonth; }
  return currentmonth;
}
var today = new Date();
var todaydate = today.getFullYear()+'-'+(stringifyMonth(today.getMonth()+1))+'-'+(stringifyMonth(today.getDate()));
//10.108.194.138 - Brian's ip
//10.108.194.85 - server ip


function getJsonData(){
     var filterData = {Market:"US",Brand:"Chevrolet",Date:todaydate};
    // console.time('test');
     $.ajax({
        beforeSend: function(){
            // Handle the beforeSend event
            d3.select('#loader').classed('hidden', false);
            d3.select('#chart svg').classed('hidden', true);
          },
         type: "POST",
         url: '//URL HERE',
         contentType: 'application/json',
         processData: false,
         data: JSON.stringify(filterData),
         success: function(data) {
             jsondata = data;
             jsonArray = jsondata.key_sequence.sequence_id;
             var sequenceObject = createSequenceObject();
             //console.log(sequenceObject)
             campend = jsondata.Brand.camp_end;
             campstart = jsondata.Brand.camp_start;
             var sequenceArray = [];
             Brand = jsondata["Brand"].brand;
             newdate = jsondata["Brand"].date;
             market = jsondata["Brand"].market;
             for(element in jsondata["Brand"].fact_session.sequence_id){

             if(jsondata["Brand"].fact_session.sequence_id[element] !== null){

                var sequenceId = jsondata["Brand"].fact_session.sequence_id[element];
                var sequenceString = sequenceObject[sequenceId]; //+ "|" + jsondata.key_sequence.sequence.indexOf(sequenceString);
             sequenceArray.push(sequenceString);

             }
             }
             sequenceArray = preprocessing(sequenceArray);
            //  console.timeEnd("test");
              console.time("gettingKeys");
              getKeys(jsondata.filters);
              console.timeEnd("gettingKeys");
              var brand = d3.select('#brand')[0][0];
              brand.value = Brand;
              var currentdate = d3.select('select[name="Date"]')[0][0];
              currentdate.value = newdate;
              var currentmarket = d3.select('select[name="Market"]')[0][0];
              currentmarket.value = market;
              createVisualization(buildHierarchy(sequenceArray));
              d3.select('#loader').classed('hidden', true);
              d3.select('#chart svg').classed('hidden', false);
          }
      })
 };

function createSequenceObject(){
var sequenceObject = {};
for(element in jsondata.key_sequence.sequence_id){
sequenceObject[jsondata.key_sequence.sequence_id[element]] = jsondata.key_sequence.sequence[element];

}
return sequenceObject;
}

function preprocessing(arr){
// sequenceIDArray = []
console.time("preprocess");
  for(element in arr){
    // sequenceIDIndex = jsondata.key_sequence.sequence.indexOf(arr[element]);
    // sequenceID = jsondata.key_sequence.sequence_id[sequenceIDIndex];
    // sequenceIDArray.push(sequenceID);

    arr[element] = arr[element].split('|').slice(0,17);
   //  .filter(function(item, pos, arr){
     // Always keep the 0th element as there is nothing before it
     // Then check if each element is different than the one before it
       // return pos === 0 || item !== arr[pos-1];
       // });
       arr[element].push('end_of_path');
      // console.log(arr[element]);
       var length = arr[element].length;
       for(var i = 0; i < length - 1; i++){

         arr[element][i] = activityLookUp(arr[element][i]);
       }

   arr[element] = arr[element].join('|');

  }
  console.timeEnd("preprocess");
  return conjunctionSeq(arr);
}

function conjunctionSeq(arr) {
    var a = [], b = [], prev;
    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }
    return seqObject([a, b]);
}

function seqObject(result){
  var array = []
  for(element in result[0]){
    var id = result[0][element];
    var size = result[1][element];
    array.push({"id": id, "size": size})
  }
  return array;
}


getJsonData();
