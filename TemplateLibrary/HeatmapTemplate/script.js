//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 250, right: 150, bottom: 150 };

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const parseTime = d3.timeParse("%H");

d3.csv("./data/2018-boston-crimes.csv", parse).then(function (data) {
    //we want to organize the data by the offense code group, so we're using the d3.nest() method
    let groupNest = d3.nest()
        .key(d => d.group) //the attribute that we're nesting by
        .rollup()
        .entries(data) 
        .sort((a, b) => b.values.length - a.values.length); //sorting by the group with the most occurences
    
    //we only want the top 20
    groupNest = groupNest.slice(0, 20);

    //we're going to create a new dataset for our heatmap, so we start with an empty array
    let heatmapData = [];
    //go through each set of values in our nested data
    groupNest.forEach((d) => {
        //nest again by hour
        let hourNest = d3.nest()
            .key(p => p.hour)
            .rollup(v => v.length)
            .entries(d.values)
        //by default, d3.nest returns the key attributes as strings; we want them to show up as time values so we need to reformat them
        hourNest.forEach(p => p.key = parseTime(p.key))
        //sort from earliest in the day to latest in the day
        hourNest.sort((a, b) => a.key - b.key);
        for (let i = 0; i < hourNest.length; i++) {
            heatmapData.push({ //push group, hour, and number of instances into our new array
                group: d.key,
                hour: hourNest[i].key,
                value: hourNest[i].value
            })
        }
    })
    console.log(heatmapData)

    //scales: we'll use a band scale for the bars
    const xScale = d3.scaleBand()
        .domain(heatmapData.map(d => d.hour))
        .range([margin.left, width - margin.right])
        .padding(0.01);

    const yScale = d3.scaleBand()
        .domain(heatmapData.map(d => d.group))
        .range([margin.top, height - margin.bottom])
        .padding(0.01);

    const colorScale = d3.scaleSequential() //sequential colors for the heatmap
        .interpolator(d3.interpolateBlues)
        .domain(d3.extent(heatmapData, (d) => {
            return +d["value"];
        }))

    const bar = svg.selectAll("rect")
        .data(heatmapData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.hour))
        .attr("y", d => yScale(d.group))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.value));

    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.timeFormat("%I %p")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft().scale(yScale));


});

//get the data in the right format
function parse(d) {
    return {
        group: d.OFFENSE_CODE_GROUP,
        hour: +d.HOUR,
    }
}

