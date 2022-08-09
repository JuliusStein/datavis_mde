/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };

/*creating the actual SVG */
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.csv("./data/gapminder.csv", parse).then(function (data) {


    /* filter subset of data, grabbing only the rows where the country = China */
    const filtered_data = data.filter(d => d.country === "China");

    //scales - xScale is a linear scale of the years
    const xScale = d3.scaleLinear()
        .domain([d3.min(filtered_data, d => d.year), d3.max(filtered_data, d => d.year)])
        .range([margin.left, width - margin.right]);

    //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the population maximum
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filtered_data, d => d.gdpPercap)])
        .range([height - margin.bottom, margin.top]);

    //set up the x values and the top and bottom y values of your area
    const area = d3.area()
        .x(d => xScale(d.year))
        .y1(d => yScale(d.gdpPercap))
        .y0(height-margin.bottom);

    //draw the path
    const path = svg.append("path")
        .datum(filtered_data)
        .attr("d", area)
        .attr("fill", "red")
        .attr("stroke-width", 2);

    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format("$.2s"))); //use d3.format to customize your axis tick format


    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("Year");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("GDP Per Capita");

});

//get the data in the right format
function parse(d) {
    return {
        country: d.country,
        year: +d.year,
        lifeExp: +d.lifeExp,
        gdpPercap: +d.gdpPercap,
        pop: +d.pop
    }
}

