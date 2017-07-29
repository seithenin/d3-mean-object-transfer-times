// ====================================================
// =    AUTHOR: STEVE SUTCLIFFE
// =	Reproducing works from my published material
// =====================================================

// ======= SUPPORT METHODS:
// -------    Modify the data from the csv to conform to an easy-to-access format
var meanObjectTransferTimesAccessor = function(d) {
	return {
			technique: d['Technique'],
			mean: Number(d['Mean']),
			count: Number(d['Count']),
			loss_from_outliers: Number(d['Loss From Outliers']),
			stdev: Number(d['STDEV']),
			stderr: Number(d['STDERR'])
	};
};

var meanAccidentalHandoff2PairAccessor = function(d) {
	return {
		technique: d['Technique'],
		handoffs: Number(d['Handoffs']),
		count: Number(d['Count']),
		// rate is used for y-axis
		rate: Number(d['Rate']),
		stdev: Number(d['STDEV']),
		stderr: Number(d['STDERR'])
	};
}

var meanTLXResponseAccessor = function(d) {
	return {
		pairs: Number(d['NumOfPairs']),
		technique: d['Technique'],
		mean: Number(d['Mean']),
		stderr: Number(d['StdError']),
		lower: Number(d['LowerBound']),
		upper: Number(d['UpperBound'])
	};
}

var medianSubjectiveRankAccessor = function(d) {
	return {
		pairs: Number(d['NumOfPairs']),
		technique: d['Technique'],
		median: Number(d['Median'])
	};
}

// =============== QUEUE =================
// =	queue the data, perform 'await'  =
// =    once all data has been loaded    =
// =======================================
d3.queue()
	.defer(d3.csv, '/data/MeanObjectTransferTimes1Pair.csv', meanObjectTransferTimesAccessor)
	.defer(d3.csv, '/data/MeanObjectTransferTimes2Pair.csv', meanObjectTransferTimesAccessor)
	.defer(d3.csv, '/data/MeanAccidentalHandoff2Pair.csv', meanAccidentalHandoff2PairAccessor)
	.defer(d3.csv, '/data/MeanTLXResponses.csv', meanTLXResponseAccessor)
	.defer(d3.csv, '/data/MedianSubjectiveRank.csv', medianSubjectiveRankAccessor)
	.await(function(error, 
			meanObjectTransferTimes1Pair, 
			meanObjectTransferTimes2Pair, 
			meanAccidentalHandoff2Pair, 
			meanTLXResponses, 
			medianSubjectiveRank ){

		if(error) { throw error; }

	// =========== CHART SETUP =====================

	// ----------- conform the data to 1 & two pairs -----------
	var meanTLXResponsesByPair = d3.nest().key(function(d) { return d.pairs; })
		.entries(meanTLXResponses);

	var medianSubjectiveRankByPair = d3.nest().key(function(d) { return d.pairs; })
		.entries(medianSubjectiveRank);

	// ------------ CHART SETUP: size & margins ----------
	var margin = { top: 80, right: 50, bottom: 100, left: 80};
	var height = 500 - margin.top - margin.bottom;
	var width = 650 - margin.left - margin.right;

	// ------------ CHART SETUP: details specific to each chart -----
	// - create the yscales, ticks and other params that 			-
	// - differentiate the charts									-														-
	// --------------------------------------------------------------
	
	// ------ Millisecond scales -----------
	var yScaleMS = d3.scaleLinear()
		// time in milliseconds
		.domain([0, 2500])
		.range([height, 0])
		// no values should occur outside this range
		.clamp(true);

	// ------ Rate scales -----------------
	var yScaleRate = d3.scaleLinear()
		.domain([0, 0.3])
		.range([height, 0])
		.clamp(true);

	// ------ TLX scales ------------------
	var yScaleTLX = d3.scaleLinear()
		.domain([0,10])
		.range([height, 0])
		.clamp(true);

	// ------- Median scales --------------
	var yScaleMedian = d3.scaleLinear()
		.domain([1,5])
		.range([height, 0])
		.clamp(true);

	// ------- Create Tick marks and tick offsets for each --------
	//	------   	offsets just create a tick mark that extends  -
	//	------		past the edge of the chart 					  -
	// ------------------------------------------------------------
	// -------- Millisecond scales
	var yAxisTicksMS = d3.axisLeft(yScaleMS)
		.ticks(6) // number of tick marks (best attempt by d3)
		.tickSizeInner(-(width)) // size of the middle ticks
		.tickSizeOuter(0) // size of the end ticks
		.tickPadding(10) // distance values from tick marks
		.tickFormat(d3.format(""));
	// -------- Millisecond offset
	var yAxisTicksOffsetMS = d3.axisLeft(yScaleMS).ticks(6)
		.tickSizeInner(5).tickSizeOuter(5).tickFormat("");
	// -------- Rate scales
	var yAxisTicksRate = d3.axisLeft(yScaleRate)
		.ticks(7) // number of tick marks (best attempt by d3)
		.tickSizeInner(-(width)) // size of the middle ticks
		.tickSizeOuter(0) // size of the end ticks
		.tickPadding(10) // distance values from tick marks
		.tickFormat(d3.format(".0%"));
	// -------- Rate offset
	var yAxisTicksOffsetRate = d3.axisLeft(yScaleRate).ticks(7)
		.tickSizeInner(5).tickSizeOuter(5).tickFormat("");
	// -------- TLX scales
	var yAxisTicksTLX = d3.axisLeft(yScaleTLX)
		.ticks(11) // number of tick marks (best attempt by d3)
		.tickSizeInner(-(width)) // size of the middle ticks
		.tickSizeOuter(0) // size of the end ticks
		.tickPadding(10) // distance values from tick marks
		.tickFormat(d3.format(""));
	// -------- TLX offset
	var yAxisTicksOffsetTLX = d3.axisLeft(yScaleTLX).ticks(11)
		.tickSizeInner(5).tickSizeOuter(5).tickFormat("");
	// -------- Median scales
	var yAxisTicksMedian = d3.axisLeft(yScaleMedian)
		.ticks(9)
		.tickSizeInner(-(width))
		.tickSizeOuter(0)
		.tickPadding(10)
		.tickFormat(d3.format(".2n"));
	// -------- Median offset
	var yAxisTicksOffsetMedian = d3.axisLeft(yScaleMedian).ticks(9)
		.tickSizeInner(5).tickSizeOuter(5).tickFormat("");

	// =========== CHART CREATION =================================
	// =	pass in parameters as a single object 				  =
	// =														  =
	// ============================================================
	// ----------- ONE PAIR TRANSFER TIMES ---------
	createChart({
		data: meanObjectTransferTimes1Pair,
		chartID: "#chart-one-pair-transfer-times",
		chartTitle: 'Transfer Times One Pair',
		yAxisTitle: 'Mean Object Transfer Time (ms)',
		yScale: yScaleMS,
		yAxisTicks: yAxisTicksMS,
		yAxisTicksOffset: yAxisTicksOffsetMS,
		yScaleValue: 'mean',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: true
	});

	// ----------- TWO PAIR TRANSFER TIMES ---------
	createChart({
		data: meanObjectTransferTimes2Pair,
		chartID: '#chart-two-pair-transfer-times',
		chartTitle: 'Transfer Times Two Pair',
		yAxisTitle: 'Mean Object Transfer Time (ms)',
		yScale: yScaleMS,
		yAxisTicks: yAxisTicksMS,
		yAxisTicksOffset: yAxisTicksOffsetMS,
		yScaleValue: 'mean',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: true
	});

	// ----------- MEAN ACCIDENTAL HANDOFF ---------
	createChart({
		data: meanAccidentalHandoff2Pair,
		chartID: '#chart-mean-accidental-handoff',
		chartTitle: 'Mean Accidental Handoff Two Pair',
		yAxisTitle: 'Mean Accidental Handoff Rate',
		yScale: yScaleRate,
		yAxisTicks: yAxisTicksRate,
		yAxisTicksOffset: yAxisTicksOffsetRate,
		yScaleValue: 'rate',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: true
	});

	// ----------- TLX RESPONSE ONE PAIR ---------
	createChart({
		data: meanTLXResponsesByPair[0].values,
		chartID: '#chart-mean-tlx-responses-one-pair',
		chartTitle: 'TLX Responses One Pair',
		yAxisTitle: 'Mean TLX Response',
		yScale: yScaleTLX,
		yAxisTicks: yAxisTicksTLX,
		yAxisTicksOffset: yAxisTicksOffsetTLX,
		yScaleValue: 'mean',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: true
	});

	// ----------- TLX RESPONSE TWO PAIR ---------
	createChart({
		data: meanTLXResponsesByPair[1].values,
		chartID: '#chart-mean-tlx-responses-two-pair',
		chartTitle: 'TLX Responses Two Pair',
		yAxisTitle: 'Mean TLX Response',
		yScale: yScaleTLX,
		yAxisTicks: yAxisTicksTLX,
		yAxisTicksOffset: yAxisTicksOffsetTLX,
		yScaleValue: 'mean',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: true
	});

	// ----------- MEDIAN SUBJECTIVE RANK ONE PAIR ---------
	createChart({
		data: medianSubjectiveRankByPair[0].values,
		chartID: '#chart-preferences-one-pair',
		chartTitle: 'Preferences One Pair',
		yAxisTitle: 'Median Subjective Rank',
		yScale: yScaleMedian,
		yAxisTicks: yAxisTicksMedian,
		yAxisTicksOffset: yAxisTicksOffsetMedian,
		yScaleValue: 'median',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: false
	});

	// ----------- MEDIAN SUBJECTIVE RANK TWO PAIR ---------
	createChart({
		data: medianSubjectiveRankByPair[1].values,
		chartID: '#chart-preferences-two-pair',
		chartTitle: 'Preferences Two Pair',
		yAxisTitle: 'Median Subjective Rank',
		yScale: yScaleMedian,
		yAxisTicks: yAxisTicksMedian,
		yAxisTicksOffset: yAxisTicksOffsetMedian,
		yScaleValue: 'median',
		chartSetup: {
			margin: margin,
			height: height,
			width: width,
		},
		hasErrorBars: false
	});

}); // end of await

// =================== CREATE CHART FUNCTION ======================
// =	chart creation following similar formats (static x-axis,  =
// =       static layout)							              =
// ================================================================
// params {
//	data: the data to be built by d3
//	chartID: the div element id
//	chartTitle: the name of the chart as it will appear
//	yAxisTitle: the title of the y axis as it will appear
//	yScale: scale method used to conform the y-axis
//	yAxisTicks: tick marks
//	yAxisTicksOffset: offset tick marks that extend past the edge
//	yScaleValue: the value from the dataset to use in the y-axis
//	chartSetup: the margin,width, and height of the chart, not yet
//		implemented to be dynamic
// }
function createChart(params) {

	// ------------ CHART SETUP: sizes/positions ----------
	var margin = params.chartSetup.margin;
	var height = params.chartSetup.height;
	var width = params.chartSetup.width;
	var axisLabelsPosV = { x: (margin.left / 3), y: ((height + margin.top + margin.bottom) / 2)};
	var axisLabelsPosH = { x: ((width/2) + margin.left ), y: ( (height + margin.top + margin.bottom) - (margin.bottom / 3)) };
	var chartTitle = { x: ((width + margin.left + margin.right) / 2), y: (margin.top / 1.6) };

	// ------------ CHART SETUP: scales and axes ------------

	// ------------ x scale: technique -----------------
	// NOTE: in version 4 of d3 you still use scaleBand as opposed to 
	//		ordinal().rangeBands()
	var xScale = d3.scaleBand()
		// ordinal data in terms of technique: Slide, Flick, etc.
		.domain(params.data.map(function(d) { return d.technique; }))
		.range([0, width]).padding(0.50);

	// xAxis ticks will not have tick marks, add those with line generator
	var xAxisTicks = d3.axisBottom(xScale)
		.tickSizeInner(0).tickSizeOuter(0)
		.tickPadding(10); //tick padding the space between tick and label

	// ticks(6) will just estimate values, so don't really need to change
	//		it in the function
	var yAxisTicksOffset = params.yAxisTicksOffset;

	var bandwidthSize = xScale.bandwidth();

	// ----------- CHART SETUP: chart base
	// Create the chart svg base (aka chart area)
	var svg = d3.select(params.chartID)
		.append('svg')
			.attr('height', height + margin.top + margin.bottom)
			.attr('width', width + margin.left + margin.right)
			.attr('class', 'background');

	// Create the plot-area (pa) background (draw first to put behind everything)
	svg.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
		.attr('class', 'plot-area-bg')
		.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height);

	// ---------- CHART SETUP: axes - drawn first -----------------------

	// ---------- create on/above surface segmentation ------------------
	// apply this to the axis group, but create it first so it naturally
	//	falls behind the tick marks
	// Variable for all the labels
	var axisLabels = svg
		.append('g').attr("transform", "translate(" + 0 + ", " + 0 + ")")
		.attr('class', 'axis-labels');

	// segment section split calculation
	var segSplitOnX = (xScale('SurfaceFF')) + (1.5 * (bandwidthSize));

	// create the segment rectangles that differentiate on/above surface
	//		on-surface segment
	axisLabels.append('g').attr('class', 'on-surface')
		.attr("transform", "translate(" + margin.left + ", " + (height + margin.top) + ")")
		.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('height', margin.bottom/1.4)
		.attr('width', segSplitOnX);

	// 		above-surface segment
	axisLabels.append('g').attr('class', 'above-surface')
		.attr("transform", "translate(" + margin.left + ", " + (height + margin.top) + ")")
		.append('rect')
		.attr('x', (xScale('SurfaceFF')) + (1.5 * (bandwidthSize)))
		.attr('y', 0)
		.attr('height', margin.bottom/1.4)
		.attr('width', width - segSplitOnX );

	// ----------- AXIS SETUP: add axes -------------------
	axisLabels.append('g').attr('class', 'domain-text')
		.attr("transform", "translate(" + margin.left + ", " + (height + margin.top) + ")")
		.call(xAxisTicks);
	// ----------- create tick lines between each value on xAxis
	// -----------    manually create lines, and offset the group
	axisLabels.append('g').attr('class', 'tick')
		.attr("transform", "translate(" + 
			((bandwidthSize/2) + margin.left) + ", " + 
			(margin.top) + ")")
		.selectAll('line.xAxisTickMarks')
		.data(params.data)
		.enter()
		.append('line').attr('class', 'xAxisTickMarks')
			.attr('x1', function(d,i) {
				return (xScale(d.technique)) + bandwidthSize;
			})
			.attr('x2', function(d, i) {
				return (xScale(d.technique))  + bandwidthSize;
			})
			.attr('y1', height)
			.attr('y2', height + 5)
			.attr('stroke', 'black').attr('stroke-width', 2);

	// ---------- create tick marks (lines across yaxis)
	axisLabels.append('g').attr('class', 'range-text')
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
		.call(params.yAxisTicks);
	// --------- to get small tick marks on opposite side of plot-area
	//			create a second group of tick marks
	axisLabels.append('g').attr('class', 'tick')
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
		.call(yAxisTicksOffset);

	// ----------- labels: add axes labels ---------------

	// --- techniques positioned in middle of segSplitOnX
	axisLabels.append('text').attr('class', 'horizontal on-surface')
		.attr('text-anchor', 'middle')
		.attr('x', (segSplitOnX/2) + margin.left)
		.attr('y', (height + margin.top + margin.bottom) - (margin.bottom/2))
		.text('ON-SURFACE');

	axisLabels.append('text').attr('class', 'horizontal above-surface')
		.attr('text-anchor', 'middle')
		.attr('x', (segSplitOnX + margin.left) + (width - segSplitOnX)/2) 
		.attr('y', (height + margin.top + margin.bottom) - (margin.bottom/2))
		.text('ABOVE-SURFACE');

	// --- y axis title
	axisLabels.append('text').attr('class', 'vertical')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'middle')
		.attr('x', axisLabelsPosV.x).attr('y', axisLabelsPosV.y)
		.text(params.yAxisTitle)
		.attr('transform', 'rotate(-90 ' + axisLabelsPosV.x + ',' + axisLabelsPosV.y + ')'); // rotate around the x & y coordinates

	// --- title for the chart
	var chartTitle = svg.append('g')
		.attr("transform", "translate(" + 0 + ", " + 0 + ")")
		.attr('class', 'chart-title')
		.append('text').attr('text-anchor', 'middle')
		.attr('x', chartTitle.x).attr('y', chartTitle.y)
		.text(params.chartTitle);

	// --- notes such as explaining the error bars
	if(params.hasErrorBars) {
		var notes = svg.append('g')
		.attr("transform", "translate(" + 0 + ", " + 0 + ")")
		.attr('class', 'notes')
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('x', width)
		.attr('y', (height + margin.top + margin.bottom - 12))
		.text('*Error bars showing standard error');
	}

	// =============== DATA-SERIES ====================
	// Create the plot-area (pa) for the data
	var pa_transferTimes1p = svg.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
		.attr('class', 'plot-area');

	// --------------- DATA-SERIES: create the group with data
	var rectArea = pa_transferTimes1p.append('g')
		.attr('class', 'data-series')
		.selectAll('rect.one-pair')
		.data(params.data).enter().append('g');

	// --------------- DATA-SERIES: create the data bars
	rectArea.append('rect').attr('class', 'one-pair')
			.attr('x', function(d) { return xScale(d.technique); })
			.attr('y', function(d) { 
				return params.yScale(d[params.yScaleValue]); 
			})
			.attr('width', function(d) { 
				return (bandwidthSize); 
			})
			.attr('height', function(d) { 
				return height - params.yScale(d[params.yScaleValue]); 
			});

	// --------------- DATA-SERIES: error bars
	var errorBarWidth = 3; // width of the error bar caps
	// --------------- append error bars: a little tricky here ----
	if(params.hasErrorBars) {
		rectArea
		// error bars are added by passing 3 data points to .enter()
		//		for each data bar
		.append('g').attr('class', 'error-bar')
			.selectAll('line.err') // need an accessor, name doesn't matter
			// data uses 3 points: 
			//				_ top horizontal bar, 
			//				| middle vertical bar,
			//				─ bottom horizontal bar

			// data top: shift +/- 5, lower = upper
			// data middle: shift +/- 0, upper (bar+err), lower(bar-err)
			// data bottom: shift +/- 5, upper = lower
			.data( function(d) {
				var ar = []; // build the array for data
				// TOP: lower <- upper, xShift +/- errrorBarWidth
				//	 lower has the same value as upper, x coords are opposite
				ar.push({
					'tech': d.technique, 
					'xShift': errorBarWidth, 
					'upper': d[params.yScaleValue] + d.stderr,
					'lower': d[params.yScaleValue] + d.stderr	
				});
				// MIDDLE: lower, upper are unique values
				//	 no shift in x, all x values the same (vertical bar)
				ar.push({
					'tech': d.technique, 
					'xShift': 0, 
					'upper': d[params.yScaleValue] + d.stderr, 
					'lower': d[params.yScaleValue] - d.stderr
				});
				// BOTTOM: upper <- lower, xShift +/- errorBarWidth
				//	  upper has the same value as lower (horizontal)
				ar.push({
					'tech': d.technique, 
					'xShift': errorBarWidth, 
					'upper': d[params.yScaleValue] - d.stderr, 
					'lower': d[params.yScaleValue] - d.stderr	
				});

				return ar;
			})
			.enter()
			// now with the created data calculate the positions of error bars
			.append('line')
				// x1 - scale according to x (starting point on data bar)
				//		-add half the bandwidth size, then shift - errorBarWidth
				.attr('x1', function(d) {
					return (xScale(d.tech) + (bandwidthSize/2)) - d.xShift;
				})
				// x2 - same process as x1, but shift the other direction (+errorBarsWidth)
				.attr('x2', function(d) {
					return (xScale(d.tech) + (bandwidthSize/2)) + d.xShift;
				})
				// y1 - scale according to the y, for top bar the lower value is the same
				//		as the upper value, middle will have a unique upper and lower,
				//		bottom will have upper the same value as lower
				.attr('y1', function(d) {
					return params.yScale(d.upper);
				})
				.attr('y2', function(d) {
					return params.yScale(d.lower);
				});
		}
}