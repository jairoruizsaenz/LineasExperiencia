var color_set = d3.scale.linear()
	.range(["#3182bd", "#f33"]);

// load default chart
d3.csv("resources/data/data_02.csv", function(data){

// collect text for first column to adjust left margin
var firstCell = data.map(function(d){return d3.values(d)[0]});

// find the longest text size in the first row to adjust left margin
var textLength = 0;
firstCell.forEach(function(d){
	if (d.length > textLength) textLength = d.length;
});

// get parallel coordinates
graph = d3.parcoords()('#wrapper_02')
	.data(data)
		.margin({ top: 30, left: 3 * textLength, bottom: 40, right: 0 })
		.alpha(0.6)
		.mode("queue")
		.rate(5)
		.render()
		.brushMode("1D-axes")
		.interactive();

//add hover event
d3.select("#wrapper_02 svg")
	.on("mousemove", function() {
	    var mousePosition = d3.mouse(this);			    
	    highlightLineOnClick(mousePosition, true); //true will also add tooltip
	})
	.on("mouseout", function(){
		cleanTooltip();
		graph.unhighlight();
	});
	
});


// Add highlight for every line on click
function getCentroids(data){

	var margins = graph.margin();
	var graphCentPts = [];
	
	data.forEach(function(d){
		
		var initCenPts = graph.compute_centroids(d).filter(function(d, i){return i%2==0;});
		
		// move points based on margins
		var cenPts = initCenPts.map(function(d){
			return [d[0] + margins["left"], d[1]+ margins["top"]]; 
		});

		graphCentPts.push(cenPts);
	});

	return graphCentPts;
}

function getActiveData(){	
	if (graph.brushed()!=false) return graph.brushed();
	return graph.data();
}

function isOnLine(startPt, endPt, testPt, tol){
	
	var x0 = testPt[0];
	var	y0 = testPt[1];
	var x1 = startPt[0];
	var	y1 = startPt[1];
	var x2 = endPt[0];
	var	y2 = endPt[1];
	var Dx = x2 - x1;
	var Dy = y2 - y1;
	var delta = Math.abs(Dy*x0 - Dx*y0 - x1*y2+x2*y1)/Math.sqrt(Math.pow(Dx, 2) + Math.pow(Dy, 2)); 
	//console.log(delta);
	if (delta <= tol) return true;
	return false;
}

function findAxes(testPt, cenPts){
	// finds between which two axis the mouse is
	var x = testPt[0];
	var y = testPt[1];

	// make sure it is inside the range of x
	if (cenPts[0][0] > x) return false;
	if (cenPts[cenPts.length-1][0] < x) return false;

	// find between which segment the point is
	for (var i=0; i<cenPts.length; i++){
		if (cenPts[i][0] > x) return i;
	}
}

function cleanTooltip(){
	// removes any object under #tooltip is
	graph.svg.selectAll("#tooltip_02")
    	.remove();
}

function addTooltip(clicked, clickedCenPts){
	
	// sdd tooltip to multiple clicked lines
    var clickedDataSet = [];
    var margins = graph.margin()

    // get all the values into a single list
    // I'm pretty sure there is a better way to write this is Javascript
    for (var i=0; i<clicked.length; i++){
    	for (var j=0; j<clickedCenPts[i].length; j++){
    		var text = d3.values(clicked[i])[j];
  			// not clean at all!
  			var x = clickedCenPts[i][j][0] - margins.left;
  			var y = clickedCenPts[i][j][1] - margins.top;
  			clickedDataSet.push([x, y, text]);
		}
	};

	// add rectangles
	var fontSize = 14;
	var padding = 2;
	var rectHeight = fontSize + 2 * padding; //based on font size

	graph.svg.selectAll("rect[id='tooltip_02']")
        	.data(clickedDataSet).enter()
        	.append("rect")
        	.attr("x", function(d) { return d[0] - d[2].length * 5;})
			.attr("y", function(d) { return d[1] - rectHeight + 2 * padding; })
			.attr("rx", "2")
			.attr("ry", "2")
			.attr("id", "tooltip_02")
			.attr("fill", "grey")
			.attr("opacity", 0.9)
			.attr("width", function(d){return d[2].length * 10;})
			.attr("height", rectHeight);

	// add text on top of rectangle
	graph.svg.selectAll("text[id='tooltip_02']")
    	.data(clickedDataSet).enter()
    		.append("text")
			.attr("x", function(d) { return d[0];})
			.attr("y", function(d) { return d[1]; })
			.attr("id", "tooltip_02")
			.attr("fill", "white")
			.attr("text-anchor", "middle")
			.attr("font-size", fontSize)
        	.text( function (d){ return d[2];})    
}

function getClickedLines(mouseClick){
    var clicked = [];
    var clickedCenPts = [];

	// find which data is activated right now
	var activeData = getActiveData();

	// find centriod points
	var graphCentPts = getCentroids(activeData);

    if (graphCentPts.length==0) return false;

	// find between which axes the point is
    var axeNum = findAxes(mouseClick, graphCentPts[0]);
    if (!axeNum) return false;
    
    graphCentPts.forEach(function(d, i){
	    if (isOnLine(d[axeNum-1], d[axeNum], mouseClick, 2)){
	    	clicked.push(activeData[i]);
	    	clickedCenPts.push(graphCentPts[i]); // for tooltip
	    }
	});
	
	return [clicked, clickedCenPts]
}


function highlightLineOnClick(mouseClick, drawTooltip){
	
	var clicked = [];
    var clickedCenPts = [];
	
	clickedData = getClickedLines(mouseClick);

	if (clickedData && clickedData[0].length!=0){

		clicked = clickedData[0];
    	clickedCenPts = clickedData[1];

	    // highlight clicked line
	    graph.highlight(clicked);
		
		if (drawTooltip){
			// clean if anything is there
			cleanTooltip();
	    	// add tooltip
	    	addTooltip(clicked, clickedCenPts);
		}

	}
};
