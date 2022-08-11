var months = ["January","February","March","April","May","June","July", "August","September","October","November","December"];

/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 80 };

const legendWidth = document.querySelector("#legend").clientWidth;
const legendHeight = document.querySelector("#legend").clientHeight;

const multiplesWidth = document.querySelector("#multiples").clientWidth;
const multiplesHeight = document.querySelector("#multiples").clientHeight;

/*creating the actual SVG */
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const legend = d3.select("#legend")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

const multiples = d3.select("#multiples")
    .append("svg")
    .attr("width", multiplesWidth)
    .attr("height", multiplesHeight);

d3.csv("./data/US_Textile_Fiber_Trade.csv", parse).then(function (data) {


    /* filter subset of data, grabbing only the rows where the country = China or the US */
    const filtered = data.filter(d => d.category === "apparel" && d.year === 2020 && d.import_export === "import");
    const keys = ["tops", "bottoms", "other apparel", "suits and coats", "sweaters"]

    //set out colors based on our list of keys
    const colorScale = d3.scaleOrdinal()
        .domain(keys)
        .range(["#68BBE3", "#0E86D4", "#055C9D", "#003060", "#0C2D48"])

    //group the data by continent
    const by_apparel = d3.groups(filtered, d=>d.sub_category)
    console.log(by_apparel)

    //calculate the total import for each month (by apparel type)
    let imports_by_month = [] //an empty array to hold our new dataset
    for(let i = 0; i < by_apparel.length; i++) {
        let apparel = by_apparel[i][0]; //grab the name of each apparel type
        let nested = d3.nest() //create a nested data structure by year
            .key(d => d.month) //key is the month
            .rollup(d => d3.sum(d, g => g.value)) //add up populations of every country in that continent for each year
            .entries(by_apparel[i][1])
        nested.forEach((d) => d.key = +d.key) //d3.nest generates keys as strings, we need these as numbers to use our linear xScale 
        for(let j = 0; j < nested.length; j++) {
            imports_by_month.push({ //pushes the records created by the nesting function into our new array
                apparel: apparel,
                month: nested[j].key,
                value: nested[j].value
            })
        }
    }
    console.log(imports_by_month);
    
    //use the arquero library to pivot the data into an array of objects where each object has a year and a key for each continent
    const by_month = aq.from(imports_by_month)
        .groupby("month")
        .pivot("apparel", "value")
        .objects()
        .sort((a, b) => a.value - b.value) //sort the data by month
        
    console.log(by_month)

    //generate the dataset we'll feed into our chart
    const stackedData = d3.stack()
        .keys(keys)(by_month)
        .map((d) => {
            return d.forEach(v => v.key = d.key), d;
        })
    console.log(stackedData)
    
    //scales - xScale is a linear scale of the years
    const xScale = d3.scaleLinear()
        .domain([d3.min(by_month, d => d.month), d3.max(by_month, d => d.month)])
        .range([margin.left, width - margin.right]);

    //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the total population maximum
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(by_month, d => d["tops"] + d["bottoms"] + d["suits and coats"] + d["sweaters"] + d["other apparel"])])
        .range([height - margin.bottom, margin.top]);

    //draw the areas
    svg.selectAll("path")
        .data(stackedData)
        .enter()
        .append("path")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick)
        .attr('class', 'area')
        .attr("fill", d => colorScale(d.key))
        .attr("d", d3.area()
            .x((d, i) => {
                return xScale(d.data.month);
            })
            //the starting and ending points for each section of the stack
            .y1(d => yScale(d[0])) 
            .y0(d => yScale(d[1]))
        )
        
    //draw the x and y axis
    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale)
        //.tickFormat(d3.format("Y")));
        .tickFormat(function(d, val){return months[val];}));

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
        .text("Month");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Pounds Imported");

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
    
    //draw the multiples
    const xAxis_mult = multiples.append("g")
        .attr("class", "multAxis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("height", "20px")
        .call(d3.axisBottom().scale(xScale)
        //.tickFormat(d3.format("Y")));
        .tickFormat(function(d, val){return months[val];}));

    const yAxis_mult = multiples.append("g")
        .attr("class", "multAxis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format(".2s"))); //use d3.format to customize your axis tick format

    const xAxisLabel_mult = multiples.append("text")
        .attr("class", "multAxisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text("Month");

    const yAxisLabel_mult = multiples.append("text")
        .attr("class", "multAxisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Pounds Imported");    
});
// Create Event Handlers for mouse
function handleMouseOver(d, i) {  // Add interactivity
    console.log('hovered: ', d.key);
    // Use D3 to select element, change opacity to 0.5
    d3.select(this)
        .style("opacity", 0.5);

    //Specify where to put label of text
    svg.append("text").attr({
       id: "t" + d.x + "-" + d.y + "-" + i,  // Create an id for text so we can select it later for removing on mouseout
        x: function() { return xScale(d.x) - 30; },
        y: function() { return yScale(d.y) - 15; },
        text: function() { return d.key; },
        color: "white"
    });
  }

function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this)
        .style("opacity", 1);

    // Select text by id and then remove
    //d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
  }

function handleClick(d, i) {
    console.log('clicked: ', d.key);
}  
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

