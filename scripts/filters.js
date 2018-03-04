function getKeys(filters, selectedArray){
  for(element in filters){
    populateDropdown(filters[element], element);
  }
changeValues(selectedArray)
}

function populateDropdown(filterarray, name){
  if(name === "Market"){
    unpackMarket(filterarray);
  }else{
    if(filterarray.indexOf('All') > -1){
      filterarray.splice(filterarray.indexOf('All'),1);
    }
    filterarray = filterarray.sort();
    var total = filterarray.length;
    var element = jQuery('.filterthis[name=' + name.replace(' ','_') + ']');
    if(name !== "Brand" && name !== "Market" && name !== "Date" && name !== "Exposure"){
        element.append('<option value="">All</option>');
    }
    for(var i = 0; i < total; i++){
        element.append('<option data-tokens="' + filterarray[i] + '"value="' + filterarray[i] + '">' + filterarray[i] + '</option>');
    };
  }
}

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

function unpackMarket(filterarray){
    var marketvar = Object.keys(filterarray);
    var element = jQuery('.filterthis[name="Market"]');
    var total = marketvar.length;
    marketvar.sort();
    if(marketvar.indexOf("US") > -1){
      arraymove(marketvar, marketvar.indexOf("US"), 0);
    }
    if(marketvar.indexOf("CA") > -1){
      arraymove(marketvar, marketvar.indexOf("CA"), 1);
    }
    if(marketvar.indexOf("MX") > -1){
      arraymove(marketvar, marketvar.indexOf("MX"), 2);
    }
    for(var i = 0; i < total; i++){
        element.append('<option>' + marketvar[i] + '</option>');
    };
    try{
    var brands = Object.keys(filterarray[Market]);

    }catch(e){debugger;}
    element = jQuery('.filterthis[name="Brand"]');
    total = brands.length;
    for(var i = 0; i < total; i++){
        element.append('<option>' + brands[i] + '</option>');
    };

    element = jQuery('.filterthis[name="Date"]');
    var dates = filterarray[Market][Brand];
    total = dates.length;
    dates = dates.sort().reverse();
    for(var i = 0; i < total; i++){
        element.append('<option>' + dates[i] + '</option>');
    };

}



function changeValues(selectedArray){
  if(selectedArray !== undefined){
    console.log(selectedArray);
  jQuery('select.filterthis').each(function(i){
    jQuery(this).context.value = selectedArray[i];
  });
}

}
function clearKeys(){
var selectedArray = [];
  jQuery('select.filterthis').each(function(){
    selectedValue = jQuery(this).context.value;
    selectedArray.push(selectedValue);
    jQuery(this).children().remove();
  });
  return selectedArray;
}


function filterJson(){
     console.time('test');
     $.ajax({
         type: "POST",
         url: 'http://10.108.194.85/api/v1/custom',
         contentType: 'application/json',
         processData: false,
         data: JSON.stringify(globalfilter),
         success: function(data) {
             jsondata = data;
             Brand = jsondata["Brand"].brand;
             newdate = jsondata["Brand"].date;
             Market = jsondata["Brand"].market;
             jsonArray = jsondata.key_sequence.sequence_id;
             campend = jsondata.Brand.camp_end;
             if(campend !== 0){
               campend = campend.split('-')[1] + '/' + campend.split('-')[2] + '/' + campend.split('-')[0];
             }
             campstart = jsondata.Brand.camp_start;
             if(campstart !== 0){
               campstart = campstart.split('-')[1] + '/' + campstart.split('-')[2] + '/' + campstart.split('-')[0];
             }
             var sequenceObject = createSequenceObject()
             var sequenceArray = [];

             for(element in jsondata["Brand"].fact_session.sequence_id){
             if(jsondata["Brand"].fact_session.sequence_id[element] !== null){
               var sequenceElement = sequenceObject[jsondata["Brand"].fact_session.sequence_id[element]];
               if(sequenceElement !== undefined){
                 sequenceArray.push(sequenceElement);

               }else{console.log("sequence " + jsondata["Brand"].fact_session.sequence_id[element] + " does not exist.")}
             }
             }
             sequenceArray = preprocessing(sequenceArray);
              if(sequenceArray.length === 0){
                showError();
              } else{
                d3.select('#error').text("");
                console.timeEnd("test");
                selectedArray = clearKeys();
                getKeys(jsondata.filters, selectedArray);
                console.time("erasevis");
                EraseVisualization(globalroot);
                var brand = d3.select('#brand')[0][0];
                brand.value = Brand;
                var currentdate = d3.select('select[name="Date"]')[0][0];
                currentdate.value = newdate;
                var currentmarket = d3.select('select[name="Market"]')[0][0];
                currentmarket.value = Market;
                var hierarch = buildHierarchy(sequenceArray);
                // initializeGraph();
                console.timeEnd("erasevis");
                createNewVisualization(hierarch);
                d3.select('#loader').classed('hidden', true);
                d3.select('#chart svg').classed('hidden', false);
              }
          }
      })
 };

 var currentfilter = {};

//shows which boxes display based on what the user chooses to search for when they pick Channel or Exposure
 function displayBoxes(channel, exposure){
   var formGroup = d3.selectAll('#filters .form-group');
   if(channel === "All" || channel === ''){
     formGroup.classed('hidden', function(){ return this.classList.contains('default') ? false : true;})
   }
   if(channel === "Display"){
     formGroup.classed('hidden', function(){ return this.classList.contains('display') ? false : true;})
   } else if(channel === "Search"){
     formGroup.classed('hidden', function(){ return this.classList.contains('search') ? false : true;})
   } else if(channel === "Social"){
     formGroup.classed('hidden', function(){ return this.classList.contains('social') ? false : true;})
   }

   if(exposure === "Unexposed" && channel === "Search"){
     formGroup.classed('hidden', function(){ return this.children[1].name === "Keyword" || this.classList.contains('default') ? false : true;})
   } else if(exposure === "Unexposed"){
     formGroup.classed('hidden', function(){return this.classList.contains('default') ? false : true;})
   }

   d3.selectAll('#filters .form-group.hidden select')[0].forEach(function(x){x.value = "All"})
 }

 function showError(){
   d3.select('#error').text("No match. Please try another selection.");
 }

//$( "select[name='Exposure']" ).prop( "disabled", true )
//modifies the dropdown boxes in response to activating campaign view
function modifyDropdown(boolean){
  var element;
  if(boolean){element = ".campaigndiv"}
  else{element = ".channeldiv"}
  d3.selectAll( ".disableOption" ).classed("disabled", boolean);
  jQuery( ".disableOption select" ).prop("disabled", boolean);
  jQuery('.devicediv').insertAfter(element);
}

var globalfilter = {};
d3.selectAll('.filterthis').on("change", function(){dropDownCycle(this)})

function dropDownCycle(element){

  var clickedElement = element.name.replace('_', ' ');
  var channel = d3.select('#channel')[0][0].value;
  var exposure = d3.select('#exposure')[0][0].value;

  var index = d3.selectAll('.filterthis')[0].indexOf(element);
  try{
if(globaltest !== undefined){debugger;}
}catch(e){}

  //calls CampaignCheck if a dropdown before and including campaign is changed
  campaignIndex = d3.selectAll('.filterthis')[0].indexOf(jQuery('select[name="Campaign"]')[0])
  //if index is -1, it means the checkbox was clicked.
  if(index === -1){

  }
  else if(index < campaignIndex || (campaignIndex === index && element.value === "")){campaignCheck(true)}
  else if(campaignIndex === index){campaignCheck(false)}

  var campaignView = document.getElementById("campaign").checked;
  modifyDropdown(campaignView)
  jQuery('.filterthis:not(".bootstrap-select")').each(function(){
    var value = jQuery(this).context.value;
    var name = jQuery(this).context.name.replace('_', ' ');
    var indexToCheck = d3.selectAll('.filterthis')[0].indexOf(jQuery(this)[0]);


  //  checks which spot the index of the clicked element is in, in relation to each filter

    if(indexToCheck > index && index !== -1){
      if(name === "Brand" || name === "Exposure"){
        globalfilter[name] = value;
      }
      else{
          jQuery(this).context.value = "All";
        }
        }
   else{
      if(value !== "All" && value !== ""){
           globalfilter[name] = value;
        }
      }

if(name === "Campaign" && campaignView){
  delete globalfilter[name];
  globalfilter["Full Campaign"] = value;
}
  })


  if(clickedElement === "Exposure" || clickedElement === "Channel"){
    displayBoxes(channel, exposure);
  }
  d3.select('#loader').classed('hidden', false);
 d3.select('#chart svg').classed('hidden', true);
  console.log(globalfilter);

 filterJson();
  globalfilter = {};

}

function campaignCheck(boolean){
  d3.select('#campaign').classed('hidden', boolean);
if(boolean){document.getElementById("campaign").checked = false;}

else{d3.select('#campaign').on('click', function(){dropDownCycle(this);});}
}
