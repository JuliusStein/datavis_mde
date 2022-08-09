//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.csv("./data/US_Textile_Fiber_Trade.csv", parse).then(function (data) {

    /* filter subset of data, grabbing only the rows where the country = China */
    const filtered = data.filter(d => d.year == 2020);

    //scales: we'll use a band scale for the bars
    const xScale = d3.scaleBand()
        .domain(filtered.map(d => d.month))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.fiber_type)])
        .range([height - margin.bottom, margin.top]);

    //append the bars to the svg
    const btn = d3.select("#btn");
    btn.on('click', function () {
        svg.selectAll("rect").transition().duration(1000).attr("fill", "blue");
    });
    /*making the bars in the barchart:
    uses filtered data
    defines height and width of bars
    */

    let bar = svg.selectAll("rect")
        .data(filtered)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.month))
        .attr("y", d => yScale(d.fiber_type))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.fiber_type))
        .attr("fill", "black");

    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft().scale(yScale)
        .tickFormat(d3.format("$.2s")));

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("Month");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Fiber Type");
});

//get the data in the right format
function parse(d) {
    return {
        fiber_type: d.fiber_type, //cotton, silk, wool, etc.
        import_export: d.import_export, //this is a binary value
        category: d.category, //yarn, apparel, home, etc.
        sub_category: d.sub_category, //type of yarn, type of home
        year: +d.year, //we want this as a number
        month: +d.month, //we want this as a number
        value: +d.value //we want this as a number
    }
}
