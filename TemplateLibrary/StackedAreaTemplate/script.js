/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 80 };

const legendWidth = document.querySelector("#legend").clientWidth;
const legendHeight = document.querySelector("#legend").clientHeight;

/*creating the actual SVG */
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const legend = d3.select("#legend")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

d3.csv("./data/gapminder.csv", parse).then(function (data) {


    /* filter subset of data, grabbing only the rows where the country = China or the US */
    // const filtered_data = data.filter(d => d.country === "China" || d.country === "United States");
    const keys = ["Africa", "Americas", "Asia", "Europe", "Oceania"]

    //set out colors based on our list of keys
    const colorScale = d3.scaleOrdinal()
        .domain(keys)
        .range(["#00A676", "#8F3985", "#C84630", "#235789", "#FF9B42"])

    //group the data by continent
    const by_continent = d3.groups(data, d=>d.continent)
    console.log(by_continent)

    //calculate the total population for each year (by continent)
    let pop_by_year = [] //an empty array to hold our new dataset
    for(let i = 0; i < by_continent.length; i++) {
        let continent = by_continent[i][0]; //grab the name of each continent
        let nested = d3.nest() //create a nested data structure by year
            .key(d => d.year)
            .rollup(d => d3.sum(d, g => g.pop)) //add up populations of every country in that continent for each year
            .entries(by_continent[i][1])
        nested.forEach((d) => d.key = +d.key) //d3.nest generates keys as strings, we need these as numbers to use our linear xScale 
        for(let j = 0; j < nested.length; j++) {
            pop_by_year.push({ //pushes the records created by the nesting function into our new array
                continent: continent,
                year: nested[j].key,
                pop: nested[j].value
            })
        }
    }
    
    //use the arquero library to pivot the data into an array of objects where each object has a year and a key for each continent
    const by_year = aq.from(pop_by_year)
        .groupby("year")
        .pivot("continent", "pop")
        .objects()
    console.log(by_year)

    //generate the dataset we'll feed into our chart
    const stackedData = d3.stack()
        .keys(keys)(by_year)
        .map((d) => {
            return d.forEach(v => v.key = d.key), d;
        })
    console.log(stackedData)
    
    //scales - xScale is a linear scale of the years
    const xScale = d3.scaleLinear()
        .domain([d3.min(by_year, d => d.year), d3.max(by_year, d => d.year)])
        .range([margin.left, width - margin.right]);

    //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the total population maximum
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(by_year, d => d["Africa"] + d["Americas"] + d["Asia"] + d["Europe"] + d["Oceania"])])
        .range([height - margin.bottom, margin.top]);

    //draw the areas
    svg.selectAll("path")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("fill", d => colorScale(d.key))
        .attr("d", d3.area()
            .x((d, i) => {
                return xScale(d.data.year);
            })
            //the starting and ending points for each section of the stack
            .y1(d => yScale(d[0])) 
            .y0(d => yScale(d[1]))
        )
        
    //draw the x and y axis
    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format(".2s"))); //use d3.format to customize your axis tick format

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text("Year");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("World Population");

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

