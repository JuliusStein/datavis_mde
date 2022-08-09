//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 100, right: 100, bottom: 150 };

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//Loading in the data
d3.csv("data/gapminder.csv", parse).then(function (data) {



    //Filtering the data to 2007//
    const filtered_data = data.filter((d) => d.year == 2007);
    console.log(filtered_data);



    //scales
    let xScale = d3.scaleLinear()
        .domain(d3.extent(filtered_data, (d) => {
            return +d["gdpPercap"];
        }))
        .range([margin.left, width - margin.right]);

    let rScale = d3.scaleSqrt()
        .domain(d3.extent(filtered_data, (d) => {
            return +d["pop"];
        }))
        .range([3, 25]);

    //X axis
    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height / 2 + 40})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("$.2s")));

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height / 2 + margin.bottom)
        .text("GDP Per Capita");

    let simulation = d3.forceSimulation(filtered_data)
        .force("x", d3.forceX((d) => {
            return xScale(+d["gdpPercap"])
        }).strength(0.1))
        .force("y", d3.forceY((height / 2 - margin.bottom / 2)).strength(0.1))
        .force("collide", d3.forceCollide((d) => {
            return rScale(+d["pop"]) + 0.5
        }))

    for (let i = 0; i < filtered_data.length; i++) {
        simulation.tick(10);
    }

    //define the tooltip
    let tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip");

    //select all of the elements in the DOM that meet the criteria of having the class name of "nodes"
    let points = svg.selectAll(".nodes")
        //bind those elements to our dataset using the country dimension as the key
        .data(filtered_data, (d) => d.country)

    //the enter function creates the elements we need
    points.enter()
        .append("circle")
        .attr("class", "nodes")
        .attr("fill", "red")
        //merge with any existing points that have the same key
        .merge(points)
        //now set the attributes of the merged points, including the radius
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => rScale(d.pop))
        //tooltip interactivity
        .on("mouseover", function (d) { /*d is referencing each of the cirlces*/
            //grab the position of the node that we're hovering on    
            var cx = +d3.select(this).attr("cx") + 10;
            var cy = +d3.select(this).attr("cy") - 15;
            //make the tooltip visible
            tooltip.style("visibility", "visible")
                .style("left", cx + "px")
                .style("top", cy + "px")
                .text(d.country + ": $" + Math.round(d.gdpPercap)); //the text that shows up in the tooltip
            //all other circles fall away slightly
            d3.selectAll("circle")
                .attr("opacity", 0.5)
            //the cirlce we're hovering on comes into focus
            d3.select(this)
                .attr("opacity", 1)
        }).on("mouseout", function () {
            //tooltip goes away
            tooltip.style("visibility", "hidden");
            //all circles return to full opacity
            d3.selectAll("circle")
                .attr("opacity", 1)
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
