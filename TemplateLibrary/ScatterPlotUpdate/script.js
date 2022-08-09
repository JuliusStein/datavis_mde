//Function to set up the tabs interaction
function showVis(evt) {
    // Declare all variables
    let i, tablinks;

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";
}

//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };

const legendWidth = document.querySelector("#legend").clientWidth;
const legendHeight = document.querySelector("#legend").clientHeight;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const legend = d3.select("#legend")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

const keys = ["Africa", "Americas", "Asia", "Europe", "Oceania"]

//The color scale
const colorScale = d3.scaleOrdinal()
    .range(["#00A676", "#8F3985", "#C84630", "#235789", "#FF9B42"])

// Variables for the buttons so we can set up event listeners
const initialBtn = d3.select("#initialData");
const updateBtn = d3.select("#updatedData");

//Loading in the data
d3.csv("data/gapminder.csv", parse).then(function (data) {

    console.log(data);

    //Filtering the data for 1957//
    const filtered_data1957 = data.filter((d) => d.year == 1957);

    //Filtering the data to 2007//
    const filtered_data2007 = data.filter((d) => d.year == 2007);

    //X and Y axis
    let xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`);


    let yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`);

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("Life Expectancy");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("GDP Per Capita");

    //draw the legend
    const legendRects = legend.selectAll("rect")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d,i) => i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => colorScale(d))

    const legendLabels = legend.selectAll("text")
        .data(keys)
        .enter()
        .append("text")
        .attr("class", "legendLabel")
        .attr("x", 27)
        .attr("y", (d,i) => i * 30 + 15)
        .text(d => d)


    //this function handles the data-driven elements
    function draw(dataset) {
        //scales
        let xScale = d3.scaleLinear()
            .domain(d3.extent(dataset, d => d.lifeExp))
            .range([margin.left, width - margin.right]);

        let yScale = d3.scaleLinear()
            .domain(d3.extent(dataset, d => d.gdpPercap))
            .range([height - margin.bottom, margin.top]);

        let rScale = d3.scaleSqrt()
            .domain(d3.extent(dataset, d => d.pop))
            .range([3, 25]);

        //a little helper function for better transitions
        function zeroState(selection) {
            selection.attr('r', 0);
        }

        //select all of the elements in the DOM that meet the criteria of having the class name of "nodes"
        let points = svg.selectAll(".nodes")
            //bind those elements to our dataset using the country dimension as the key
            .data(dataset, (d) => d.country)

        //the enter function creates the elements we need
        points.enter()
            .append("circle")
            .attr("class", "nodes")
            //we're going to set the cx, cy, and fill on enter
            .attr("cx", d => xScale(d.lifeExp))
            .attr("cy", d => yScale(d.gdpPercap))
            .attr("fill", d => colorScale(d.continent))
            //but we call the zero state so there's a nice transition on update
            .call(zeroState)
            //merge with any existing points that have the same key
            .merge(points)
            //transition and duration create that smooth D3 animation we're going for
            .transition()
            .duration(500)
            //now set the attributes of the merged points, including the radius
            .attr("cx", d => xScale(d.lifeExp))
            .attr("cy", d => yScale(d.gdpPercap))
            .attr("fill", d => colorScale(d.continent))
            .attr("r", d => rScale(d.pop));

        //the exit function removes anything we don't need
        points.exit()
            .transition()
            .duration(500)
            //call zero state again so the circles leave the way they came in
            .call(zeroState)
            .remove();

        //axis updates
        xAxis.transition().duration(500).call(d3.axisBottom().scale(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft().scale(yScale).tickFormat(d3.format("$.2s")));
    }
    //initialize with the 1957 dataset
    draw(filtered_data1957);

    //buttons handles switching between datasets
    initialBtn.on("click", function () {
        draw(filtered_data1957);
    });
    updateBtn.on("click", function () {
        draw(filtered_data2007);
    });

});

//get the data in the right format
function parse(d) {
    return {
        country: d.country,
        continent: d.continent,
        year: +d.year,
        lifeExp: +d.lifeExp,
        gdpPercap: +d.gdpPercap,
        pop: +d.pop
    }
}
