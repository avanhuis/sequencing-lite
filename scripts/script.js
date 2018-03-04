// Dimensions of chart.
var width = 1500;
var height = 450;

//initialization of global variables

//globalroot is an object that changes every time buildHierarchy is called in order to keep track of which elements are being filtered out.
//this object is also cloned in the clicked function, in order to optimize the changes to the elements of the page.
var globalroot;

//node is the rectangles on the page, and is updated everytime createVisualization, or zoom is called.
var node;

//globalnode is a reference object for the top 5 function.
var globalnode;

//globaldepth is a reference object for the clicked function.
var globaldepth = 1;
var maxglobaldepth = 10;

var screenw = (jQuery(window).width()) / 10;
// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: screenw, h: 40, s: 3, t: 10
};

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([0, height]);

var legendSet = [];

// Mapping of step names to colors.
var colors = {
  " ": "white",
  "": "white",
  "end_of_path": "white",
  undefined: "black"
};

var legendColors = {
"end_of_path": "white",
};



var randomColors =
['rgb(150, 40, 27)',
  '#0e2f44',
  '#ff4040',
  '#6dc066',
  '#31698a',
  '#8a2be2',
  '#c39797',
  '#daa520',
  '#808080',
  '#f6546a',
  '#794044',
  '#EE4000',
  '#8E8E38',
  '#CD2626',
  '#CD5555',
  '#FF7F24',
  '#FF9912',
  '#CDAD00',
  '#9ACD32',
  '#2E8B57',
  '#228B22',
  '#008B8B',
  '#2F4F4F',
  '#6959CD',
  '	#EE82EE',
  'rgb(27, 163, 156)',
  'rgb(1, 152, 117)',
  'rgb(52, 73, 94)',
  'rgb(190, 144, 212)',
  'rgb(231, 76, 60)',
  'rgb(210, 77, 87)',
  'rgb(217, 30, 24)',
  'rgb(239, 72, 54)',
  'rgb(207, 0, 15)',
  'rgb(246, 71, 71)',
  'rgb(246, 36, 89)',
  'rgb(102, 51, 153)',
  'rgb(129, 207, 224)',
  'rgb(135, 211, 124)',
  'rgb(0, 177, 106)',
  'rgb(235, 149, 50)',
  'rgb(244, 179, 80)',
  'rgb(211, 84, 0)',
  'rgb(108, 122, 137)',
  'rgb(211, 84, 0)']




function colorLegend(){
  legendColors = {
  "end_of_path": "white"
  };
  for(element in legendSet){
    var colorValue =  (function(){
      var color = colors[legendSet[element]["name"]]
      if(color === undefined){

      color = createHex();
      }
      return color;
      })();
  legendColors[legendSet[element]["name"]] = colorValue
  }
  return legendColors;
}

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

//add svg
var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "graph")
    .append("svg:g")
    .attr("id", "container");


var partition = d3.layout.partition()
    .size([width, height])
    .value(function(d) { return d.size; })
    .sort(function(a,b){
      if(a.name === "end_of_path"){return 1}
      if(b.name === "end_of_path"){return -1}
      return b.value - a.value});

//gets the multiplier for the y-axis depending on the depth
function depthMultiplier(depth, nodes, isTrue){
  for(element in nodes){
    if(nodes[element]["clicked"] === isTrue && nodes[element].name !== "end_of_path"){
      var height = (nodes[element].y + nodes[element].dy) * depth;
      if(height >= 450){
        return depthMultiplier(depth - .5, nodes, isTrue);
      }
    }
  }

  return depth;
}
var depthMultiplied = 10;

function endOfPath(d){
function checkTop(){
  if(globalroot.top === true){
    return true;
  }
  for(element in globalroot.children){
    if(globalroot.children[element].top === true){
      return true;
    }
  }
  return false;
}
  if((d.name === "end_of_path" && d.depth === 2 && checkTop()) || d.name !== "end_of_path"){
    return true;
  }
  return false;
}

function getProportion(){
  var root = globalnode[0];
  if(root.top === true){
    if(1/root.value <= .01){
    return true;
    }
    return false;
  }
  return false;
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {
console.time("vis");
  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);
  // Bounding rect underneath the chart, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:rect")
      .attr("width", width)
      .attr("height", height)
      .style("opacity", 0);

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
      .filter(function(d) {
      return (d.dx > .5);
    });

    nodes.forEach(function(x){
      x.legend = {};
      x.clicked = false;
    });

  depthMultiplied = depthMultiplier(10, nodes, false);
  globalnode = nodes;

  globalnode[0].top = true;
  //adds data from the AJAX call to node, and creates the rectangles on the page.
  //addes the class 'bemoused' to the rectangles, which enable the mouseover effect to happen.
  node = vis.data([json]).selectAll(".node")
      .data(nodes)
      .enter().append("rect")
      .attr("class", "node")
      .attr("x", function(d) { return endOfPath(d) ? d.x : 0; })
      .attr("y", function(d) { return d.y * depthMultiplied; })
      .attr("width", function(d) { return endOfPath(d) ? d.dx : 0; })
      .attr("height", function(d) { return d.dy * depthMultiplied; })
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .style("fill", function(d) {
        return checkColors(legendColors, d.name);})
      .style("opacity", 1)
      .classed("bemoused", true)
      .on("mouseover", mouseover)
      .on("click", clickedNode);

  // Add the mouseleave handler to the bounding rect.
  d3.select("#container").classed("bemoused", true).on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = node.node().__data__.value;

  d3.select("#percentage")
    .style("width", "100%")
    .style("visibility", "")
    .text(totalSize.toLocaleString() + " Total Sessions").style("font-weight", "400");
  console.timeEnd("vis");
 };

var hexCounter = randomColors.length
counter = 0;
function createHex(){
  counter++;
  if(hexCounter === 0){hexCounter = randomColors.length}
  var index = Math.floor(hexCounter * Math.random());
  var color = randomColors[index];
  randomColors.splice(index,1);
  randomColors.push(color);

  hexCounter--;
  return color;
}

function checkColors(colors, name){

  //if(name === "end_of_path"){}
  if(colors[name] === undefined){

    colors[name] = createHex();
  }
  return colors[name];
}

var isMousing = false;
// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
    //only activates if the elements have the 'bemoused' class.
    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var percentageString = percentage.toLocaleString() + "%";
    if (percentage < 0.1) {
      percentageString = "< 0.1%";
    }

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray, percentageString);
    var percentOfChildren = percentOfpercent(d);

    d3.select("#percentage")
      .style("width", "100%")
      .style("visibility", "")
      .text(percentageString).style("font-weight", "600")
      .append("span").text(" " + d.value.toLocaleString() + " out of " + totalSize.toLocaleString() + " Sessions").style("font-weight", "400")
      .append("span").html("<br/> " + percentOfChildren);

    // Fade all the segments.
    d3.selectAll(".node")
        .style("opacity", function(d){
          var button = d3.select('.highest').attr('class');
          if(button.indexOf('clicked') > -1){
            if(d.most === true){
              return 1;
            } else if(d.legend[obj] === true) {return .3}
            else{return .16}
          }
          if(d.opaque === true){return .8;}
        for(obj in d.legend){
          if(d.legend[obj] === true) {return .8}
        } return .22;
        });
  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll(".node")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

//get the percentage of the elements children
function percentOfpercent(d){
  var sum = 0;
  if(d.name === "end_of_path"){
    return Math.abs((d.value/d.parent.value) * 100).toPrecision(3) + "% ended their session after " + d.parent.name;
  }
  if(d.parent["name"] !== "root"){
    return d.name + " is " + Math.abs((d.value/d.parent.value) * 100).toPrecision(3) + "% of " + d.parent.name;
  }
  return "";
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
  isMousing = true;
  if(jQuery(this).attr("class").indexOf("bemoused") > -1){
  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

   var num = parseInt(jQuery('.top:checked').attr('value'));

  // Deactivate all segments during transition.
  d3.selectAll(".node").on("mouseover", null);

  d3.select("#percentage")
    .style("width", "100%")
    .style("visibility", "")
    .text(function(){
        if(campend !== 0){
          return totalSize.toLocaleString() + " Total Sessions between " + campend + " and " + campstart;
        }
        else{return totalSize.toLocaleString() + " Total Sessions";}
      }).style("font-weight", "400");

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll(".node")
      .transition()
      .duration(1000)
      .style("opacity", function(d){
        if(legendCount.length === 0 && num === 0){return 1;}
        if(d3.select('.highest').attr('class').indexOf('clicked') > -1){
          if(d.most === true){
            return 1;
          } else if(d.legend[obj] === true) {return .3}
          else{return .16}
        }
        if(d.opaque === true){ return .8;}
        for(obj in d.legend){
          if(d.legend[obj] === true) {return .8}
        } return .22;
      })
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });
  }
  updateBreadcrumbs();
  setTimeout(function(){
      isMousing = false;
  }, 1000);
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", '100%')
      .attr("height", "50px")
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];

  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

//make name smaller
function nameChange(name){
//REDACTED FOR CONFIDENTIALITY
return name;
}



// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray = "", percentageString = "null") {
  if(nodeArray === ""){
    for(element in partitionCopy){
      if(partitionCopy[element].top === true){
        nodeArray = getAncestors(partitionCopy[element]);
      }
    }
  }
  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d, i) {return d.name + i; });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) {return checkColors(legendColors, d.name); });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return nameChange(d.name); });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    var string = "translate(" + i * (b.w + b.s) + ", 0)";
    if(i === 9){
      string = "translate(0," + (b.h + b.s) + ")";
    } else if(i > 9){
      string = "translate(" + (i - 9) * (b.w + b.s) + "," + (b.h + b.s) + ")";
    }

    return string;
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle");

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {
  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 200, h: 10
  };


  d3.select('.legend div').remove();

  var legend = d3.select(".legend");
      // .attr("width", li.w)
      // .attr("height", d3.keys(colors).length * (li.h));
  // for(key in currentColors){
  //   if(currentColors[key] === undefined){
  //     delete currentColors[key];
  //   }
  // }

  var div = legend.selectAll("div")
      .data(d3.entries(colorLegend()));
      div.exit().remove();
      div.enter().append("div");

      div.attr("width", li.w)
      .style("background-color", function(d) { return d.value;})
      .style("border-radius", "5px");

  div.text(function(d) { return nameChange(d.key); });
  jQuery('.legend div:contains("end_of_path")').remove();
  jQuery('.legend div:contains("==")').remove();

    }

var legendCount = [];
function toggleLegend() {
  var legend = d3.selectAll(".legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
    d3.select('.export').style('visibility', '');
    d3.select('.highest').style('visibility', '');
  } else {
    legend.style("visibility", "hidden");
    d3.select('.export').style('visibility', 'hidden');
    d3.select('.highest').style('visibility', 'hidden');
  }

  clickLegendDiv();
}

function clickLegendDiv(){
  d3.selectAll(".legend div").on("click", function(){
    if(!isMousing){
      d3.select('.highest').classed('clicked', false);
      var text = jQuery(this).text();
      var legend = {};

      d3.select(this).classed("svgstroke", function(){
        if(jQuery(this)[0].classList.value.indexOf('svgstroke') > -1){
          legend[text] = false;
          legendCount.splice(legendCount.indexOf(text),1);
          return false;
        } else{
          legend[text] = true;
          legendCount.push(text);
          return true;
        }
      });
          if(secondarynode.length > 0){
          getPaths(text, secondarynode, legend);
          changeOpacity(secondarynode, "legend");
        } else{
          getPaths(text, globalnode, legend);
          changeOpacity(globalnode, "legend");}
    }
  });
}


function getPaths(text, pathnode, legend){
  for(element in pathnode){
    if(pathnode[element].name === text){
      pathnode[element].legend[Object.keys(legend)[0]] = legend[Object.keys(legend)[0]];
      markParents(pathnode[element], legend);
     markChildren(pathnode[element], legend);
    }
  }

};

d3.select('.highest').on("click", findHighest);

function findHighest(){


  if(legendCount.length !== 1){
    return;
  }
  for(element in globalnode){
    globalnode[element].most = false;
  }
  var nodeToExamine;
  if(secondarynode.length > 0){
    nodeToExamine = secondarynode;
  }
  else{nodeToExamine = globalnode}

  isClicked = d3.select(".highest").attr('class').indexOf('clicked') > -1;
  var text = function(){
    if(!isClicked){return 'legendcount'};
    return 'legend';
  }
var highest = {"value": 0};
for(element in nodeToExamine){
    var name = nodeToExamine[element]["name"];
      if(name === legendCount[0]){
        if(nodeToExamine[element].value > highest.value){
          highest = nodeToExamine[element];
        }
      }
  }

  markParents(highest, {}, true);
  changeOpacity(nodeToExamine, text());


  var button = d3.select('.highest');
  if(button.attr('class').indexOf('clicked') > -1){
    button.classed("clicked", false)
  } else{button.classed("clicked", true);}
}

function markParents(nodes, legend, clicked = false){

  var temp = nodes;
  while(temp.name !== "root"){
    if(clicked === false){
  temp.legend[Object.keys(legend)[0]] = legend[Object.keys(legend)[0]];
}
else{
  temp.most = true;
}
  temp = temp.parent;
  }

};

function markChildren(nodeToBeChanged, legend, clicked = false){
searchnode = globalnode;
var nodeName = nodeToBeChanged.name;
  for(object in searchnode){
    var actualObject = searchnode[object];
    var temp = searchnode[object];
    if(temp.parent !== undefined){
      while(temp.parent.name !== "root"){

        if(temp.parent.name === nodeName){
          actualObject.legend[Object.keys(legend)[0]] = legend[Object.keys(legend)[0]];
          break;
            }
        temp = temp.parent;
      }
    }
  }


};

function deduplication(parts){

  var isDuplicate = false;
  var length = parts.length;
  var startIndex, endIndex;
  for(element in parts){
    if(parseInt(element) === length - 1){
      break;
    }
    if(parts[element] === parts[parseInt(element) + 1]){
      if(isDuplicate === false){
        startIndex = parseInt(element);
      }
          isDuplicate = true;
    } else if((parts[element] !== parts[parseInt(element) + 1]) && (isDuplicate === true)){
      isDuplicate = false; endIndex = parseInt(element);
    }

  }

  if(endIndex - startIndex > 9){

    var element = parts[startIndex];
    parts.splice(startIndex,(endIndex - startIndex))
  }
}

var legendarr = [];

function buildHierarchy(jsonArray) {
  legendSet = [];
  //Do something with download progress
  console.time("build");
  var root = {"name": "root", "children": []};

  var length = jsonArray.length;
  for (var i = 0; i < length; i++) {
    var sequence = jsonArray[i].id;


    var size = jsonArray[i].size;
    if(sequence === undefined){
      debugger;
    }
    var parts = sequence.split('|');
    deduplication(parts);



    var currentNode = root;

    for (var j = 0; j < parts.length; j++) {

        var children = currentNode["children"];
        var nodeName = nameChange(parts[j]);
        if(nodeName !== "end_of_path" && nodeName.indexOf(" vs ") < 0){
          var isInLegend = false;
          for(element in legendSet){
            if(nodeName === legendSet[element]["name"]){
              legendSet[element]["count"] = legendSet[element]["count"] + 1;
              isInLegend = true
            }
          }
          if(!isInLegend){
            try{
            legendSet.push({"name":nodeName, "count":1});
          }catch(e){}

          }

        }
        var childNode;
        var a = [1,2,3], b = [4,1,5,2];

        if (legendarr.indexOf(nodeName)==-1){legendarr.push(nodeName);}

        if (j + 1 < parts.length) {
     // Not yet at the end of the sequence; move down the tree.
            var foundChild = false;
            for (var k = 0; k < children.length; k++) {
              if (children[k]["name"] == nodeName) {
                childNode = children[k];
                foundChild = true;
                break;
              }
            }
            if (!foundChild) {
              childNode = {"name": nodeName, "children": []};
              children.push(childNode);
            }
            currentNode = childNode;
        } else {
      childNode = {"name": nodeName, "size": size};

      children.push(childNode);

        }
    }
  }
  globalroot = root;
  legendSet = legendSet.sort(function(a,b){
    return b.count - a.count;
  })
  console.timeEnd("build");
return root;
};






d3.selectAll('#top').on("change", function(){
  if(secondarynode.length > 0){

    changeOpacity(secondarynode);
  } else{changeOpacity(globalnode);}
});

//to filter the chart
function checkFilter(filter, childNode){
if(isFilterEmpty(filter)){
  return true;
}
for(key in filter){
if(filter[key] !== "" && (filter[key] !== childNode[key])){
return false;
}
}
return true;
}
function isFilterEmpty(filter){
  for(key in filter){
if(filter[key] !== ""){
return false;
}
}
return true;
}

function setChannel(campaign){
  if(campaign.indexOf("Search") > 0){
    return "Search";
  }
  if(campaign.indexOf("Display") > 0){
    return "Display";
  }
  if(campaign.indexOf("Social") > 0){
    return "Social";
  }
};
var filternum;
nameSet = new Set();
var testarray = [];

function createNewVisualization(json) {
  drawLegend();
  clickLegendDiv();
  d3.select("#togglelegend").on("click", toggleLegend);
  secondarynode = [];
  filternum = .9;
do{

  var nodes = partition.nodes(json).filter(function(d) {
      return (d.dx > filternum);
      });

  nodes.forEach(function(x){
        x.legend = {};
        x.clicked = false;
      });

  globalnode = nodes;
  globalnode[0].top = true;
    node = vis.data([json]).selectAll(".node");
  node.data(nodes).enter().append("rect")
  .attr("class", "node")
  node.attr("x", function(d) { return endOfPath(d) ? d.x : 0;  })
      .attr("y", function(d) { return d.y * depthMultiplied; })
      .attr("height", function(d) { return d.dy * depthMultiplied; })
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("width", function(d) { if(nameChange(d.name).length >= 27){nameSet.add(nameChange(d.name));}
        return (!endOfPath(d) || (d.value === 1 && getProportion())) ? 0 : d.dx; })
      .style("fill", function(d) {return checkColors(legendColors, d.name);})
      .style("opacity", 0);

  filternum += .05;
  if(filternum > 5){
    break;
  }
  }while(!checkBoxes())
  partitionCopy = globalroot;
  partitionCopy = partition.nodes(partitionCopy);

 node.transition().duration(650)
      .attr("x", function(d) { testarray.push(d); return endOfPath(d) ? d.x : 0; })
      .attr("y", function(d) { return d.y * depthMultiplied; })
      .attr("width", function(d) { return (!endOfPath(d) || (d.value === 1 && getProportion())) ? 0 : d.dx; })
      .attr("height", function(d) { return d.dy * depthMultiplied; })
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .style("fill", function(d) {return checkColors(legendColors, d.name);})
      .style("opacity", 1);

      node.classed("bemoused", true)
      .on("mouseover", mouseover)
      .on("click", clickedNode);
  // Get total size of the tree = value of root node from partition.
  totalSize = node.node().__data__.value;

  d3.select("#percentage")
    .style("width", "100%")
    .style("visibility", "")
    .text(function(){
        if(campend !== 0){
          return totalSize.toLocaleString() + " Total Sessions between " + campend + " and " + campstart;
        }
        else{return totalSize.toLocaleString() + " Total Sessions";}
      }).style("font-weight", "400");

    resetTopFive();
    resetLegend();
//resetGraph();
};

function checkBoxes(){

var yMinArray = [];
jQuery('rect').each(function(){
var num = parseFloat(this.getAttribute("y"));
if(!isNaN(num) && num !== 0){
yMinArray.push(num)}})
var minimumY = d3.min(yMinArray)


var sum = 0;
jQuery('rect').each(function(){
if(parseFloat(this.getAttribute("y")) === minimumY){
sum += parseFloat(this.getAttribute("width"))
}
})

if(sum > (width - 60)){
  return true;
}
return false;

}


 function changeOpacity(json, text="") {

  //finds the top 5,10,15 or 20 elements and temporarily changes their opacity so that they're easier to see.
   var nodes = json;
   var num = parseInt(jQuery('.top:checked').attr('value'));
   isClicked = allFalse(nodes)
   if(num === 0 && text === ""){
     node.style("fill", function(d) { d.opaque = false; return checkColors(legendColors, d.name); }).style("opacity", 1);
   }
   if(num !== 0 && text === ""){

     var slicenodes = nodes.filter(function(d){return (d.name !== "end_of_path" && d.clicked === isClicked && d.name !== "root")})
     slicenodes = Array.from(new Set(slicenodes)).sort(
      function(a, b){
        return b.value - a.value;
  }
).slice(0, num);

     node.style("opacity", function(d){
       if(slicenodes.indexOf(d) !== -1){d.opaque = true; return .8} else{return .22}
     });

     // Get total size of the tree = value of root node from partition.
     totalSize = node.node().__data__.value;
   }
   if(text.indexOf('legend') > -1){
     node.style("fill", function(d) { return checkColors(legendColors, d.name); }).style("opacity", function(d){
         if(legendCount.length === 0){
           if(num !== 0){
           if(d.opaque === true){
             return .8;
           }else{return .22;}
         } return 1;}
      for(obj in d.legend){
        if(text.indexOf('count') > -1){
          if(d.most === true){
            return 1;
          } else if(d.legend[obj] === true) {return .3}
          else{return .16}
        }
        if(d.legend[obj] === true) {return .8}
      } return .16;
   });

   // Get total size of the tree = value of root node from partition.
   totalSize = node.node().__data__.value;}
  };

function allFalse(nodes){
    for(element in nodes){
      if(nodes[element]["clicked"] === true){
        return true;
      }
    }
    return false;
}

function EraseVisualization(json) {
vis.selectAll('.node').remove();
  node = undefined;
  globalroot = undefined;
  globalnode = undefined;

};

// zooms in on click
var secondarynode = [];

function zoom(json) {
  secondarynode = [];
  d3.select("#container").classed("bemoused", false);
    var nodes = json.filter(function(d) {
    return (d.dx > 1.2);
  });
  depthMultiplied = depthMultiplier(10, nodes, true);

  node.data(nodes).classed("bemoused", false);
      node.transition().duration(300).style("opacity", function(d){ if(d.clicked === true){secondarynode.push(d); return .75} return 0;})
      .attr("x", function(d) { if(d.clicked === true){return endOfPath(d) ? d.x : 0; } return 0})
      .attr("y", function(d) { return d.y * depthMultiplied; })
      .style("fill", function(d) { return checkColors(legendColors, d.name); })
      .attr("display", function(d) {
      return d.depth ? null : "none"; })
      .attr("width", function(d) { if(d.clicked === true){return !endOfPath(d) ? 0 : d.dx;} return 0})
      .attr("height", function(d) { return d.dy * depthMultiplied; })
      .style("opacity", 1)

    setTimeout(function(){
    d3.select("#container").classed("bemoused", true);
    node.data(nodes).classed("bemoused", true);
    }, 200);


    secondarynode.forEach(function(x){
      if(x.legend === undefined){
        x.legend = {};
      };
    });
  // Get total size of the tree = value of root node from partition.
  // totalSize = node.node().__data__.value;
};


function resetpartition(){
  var globalpartition = partition.nodes(globalroot);
  for(item in partitionCopy){
  partitionCopy[item]["clicked"] = false;
  partitionCopy[item]["depth"] = globalpartition[item]["depth"];
  }
};

function testchildren(node){
  if(node.name != undefined){
    testchildren(node.child);
  }

};

var partitionCopy;

//for when a user clicks the node
function clickedNode(d) {
if(d.name === "end_of_path"){return;}
  resetpartition();
if(d.top === true){
  clickedBox = d.parent;
}
else{
clickedBox = d;
}
partitionCopy = globalroot;
partitionCopy = partition.nodes(partitionCopy);

for(element in partitionCopy){
  var elementName = partitionCopy[element]["name"];
  var elementDepth = partitionCopy[element]["depth"];
  var elementSize = partitionCopy[element]["value"];
  var elementX = partitionCopy[element]["x"];
  var elementY = partitionCopy[element]["y"];

  if((clickedBox.name === elementName) && (clickedBox.depth === elementDepth) && (clickedBox.value === elementSize) && (clickedBox.x === elementX) && (clickedBox.y === elementY)){
    clickedBox = partitionCopy[element];
    break;
  }
}
var counter = 0;
var RNAPartition = partition.nodes(clickedBox);
try{
$.grep(partitionCopy, function(x){return x.top === true})[0].top = false
}catch(e){}
RNAPartition[0]["top"] = true;
var index = partitionCopy.indexOf(RNAPartition[0]);
var length = RNAPartition.length;

while(counter < length){
  partitionCopy[index]["clicked"] = true;
  if(clickedBox.name !== "root"){
  partitionCopy[index]["depth"] = partitionCopy[index]["depth"] + 1;
}

index++;
counter++;
};
zoom(partitionCopy);

};


function resetTopFive(){
for(element in globalnode){
  globalnode[element]["opaque"] = false;
  globalnode[element]["legend"] = {};
}
jQuery('#top').val("0");
jQuery('#top').trigger('change');
}
function resetLegend(){
  legendCount = [];
  d3.selectAll('.svgstroke').classed('svgstroke',false);
}

function resetGraph(){

  for(element in partitionCopy){
    partitionCopy[element].top = false;
  }
  var element = globalnode["0"].children["0"];
  element.top = true;
  clickedNode(element);
  updateBreadcrumbs();
  resetTopFive();
  resetLegend();

}

function activityLookUp(activityId){
  var parsedActivity = parseInt(activityId);
  if(isNaN(parsedActivity) || parsedActivity < 10000 || parsedActivity === undefined){
    return activityId;
  }
  // if(activityId === "root"){
  //   return "root";
  // }
  // if(activityId === "end_of_path"){
  //   return "end_of_path";
  // }
  var activityArray = jsondata.key_activity.activity;
  var sequenceArray = jsondata.key_activity.activity_id;
  var index = sequenceArray.indexOf(parseInt(activityId));
  if(activityArray[index] === undefined){console.log("error: activity id:" + activityId + ' not found'); return activityId;}
  activityArray[index] = activityArray[index].replace(/Reveal\s\-\s\s/,'Reveal - ')
  var tier = activityArray[index].split('»')[2];
  var activity = activityArray[index].split('»')[4];
  if(tier === "Dealer"){activity = "T3: " + activity}
  return activity;
}

function sessionLookUp(sequenceId){
  var sessionArray = jsondata[brand].fact_session.session_id;
  var sequenceArray = jsondata[brand].fact_session.sequence_id;
  var index = sequenceArray.indexOf(sequenceId);
  return sessionArray[index];
}
