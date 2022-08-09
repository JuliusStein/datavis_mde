//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.csv("./data/gapminder.csv", parse).then(function (data) {

    /* filter subset of data, grabbing only the rows where the year = 1957 */
    const filtered = data.filter(d => d.year == 1957);

    //before we create our distribution, we need to set the xScale based on the possible values
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.gdpPercap)])
        .range([margin.left, width - margin.right])

    //we need to create a binned dataset using the d3.histogram() method
    const histogramValues = d3.histogram()
        .value(d => d.gdpPercap) //sets the distribution based on a dimension of the data - GDP Per Capita
        .domain(xScale.domain()) //based on the xScale
        .thresholds(xScale.ticks(100)) //how many bins

    const bins = histogramValues(filtered)
    console.log(bins)

    //our yScale is based off of the new binned dataset - the max value is the bin with the most records
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    let bar = svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr("height", d => height - margin.bottom - yScale(d.length))
        .attr("fill", "black");

    let xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("$.2s")));

    let yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft().scale(yScale));

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("GDP Per Capita");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Count");

});

//get the data in the right format
function parse(d) {
    return {
        country: d.country,
        year: +d.year,
        lifeExp: +d.lifeExp,
        gdpPercap: +d.gdpPercap
    }
}

