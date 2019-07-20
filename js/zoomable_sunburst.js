var width = 1024,
    height = 768,
    radius = (Math.min(width, height) / 2) - 10;

var x = d3.scaleLinear().range([0, 2 * Math.PI]);
var y = d3.scaleSqrt().range([0, radius]);
var zsb_color = d3.scaleOrdinal(d3.schemeCategory20c);
var partition = d3.partition();
var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

var zsb_svg = d3.select("#zoomable_sunburst").append("svg")
    .attr('id', 'zoomable_svg')
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

var growth_tree = { "name":"Market Share","children":[] };
var zsb_tooltip = floatingTooltip('zsb_tooltip', 240);
d3.csv("data/market_share_d3.csv", function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
        var region_category = {
            "name":d.Region,
            "children": [
                {"name":"AP","children":[]},
                {"name":"AS","children":[]},
                {"name":"EE","children":[]},
                {"name":"WE","children":[]},
                {"name":"ME","children":[]},
                {"name":"NA","children":[]},
                {"name":"LA","children":[]}
            ]
        };
        growth_tree.children[growth_tree.children.length] = region_category;
        var newcat = transverseTree(growth_tree, d); // is this a new category? lets assume so & then correct
        if (newcat) {
            var region_category = {
                "name":d.Country,
                "children": [
                    {"name":"AP","children":[]},
                    {"name":"AS","children":[]},
                    {"name":"EE","children":[]},
                    {"name":"WE","children":[]},
                    {"name":"ME","children":[]},
                    {"name":"NA","children":[]},
                    {"name":"LA","children":[]}
                ]
            };
            growth_tree.children[growth_tree.children.length] = region_category;
            transverseTree(growth_tree, d);
        }
    });

    growth_tree.children.forEach(function(child) {
        console.log(child.name)
    });
    root = d3.hierarchy(growth_tree)
        .sum(function (d) { return d.market_share; })
        .sort(function(a, b) {
            return b.value - a.value;
        });

    root.sum(function(d) { return d.market_share; });
    zsb_svg.selectAll("path")
        .data(partition(root).descendants())
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) { return zsb_color((d.children ? d : d.parent).data.name); })
        .on("click", click)
        .on('mouseover', showZSBDetail)
        .on('mouseout', hideZSBDetail);
});

function showZSBDetail(d) {
    var content = '<span class="name">Name: </span><span class="value">' +
        d.data.name +
        '</span><br/>' +
        '<span class="name">Market Share: </span><span class="value">' +
        d.value +
        '</span>';

    zsb_tooltip.showTooltip(content, d3.event);
}


function hideZSBDetail(d) {
    zsb_tooltip.hideTooltip();
}

function click(d) {
    d.parent == null ? d3v3.select("#zoom_annotation").classed("hidden", false) : d3v3.select("#zoom_annotation").classed("hidden", true);
    zsb_svg.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
        .attrTween("d", function(d) { return function() { return arc(d); }; });
}

/*function transverseTree(tree, d) {
  /*  var newcat = true;
    tree.children.forEach(function(child) {
        if (child.name == d.Country) {
            child.children.forEach(function(grandchild) {
                if(grandchild.name == d.Region) {
                    var yelp_restaurant = {"name":d.Subcategory,"market_share":d.Growth_pct_2016_2017};
                    grandchild.children.push(yelp_restaurant);
                    newcat = false; // we matched the category so it's not new
                }
            })
        }
    });

   // if (newcat) { return true; } else { return false; }
    tree.children.forEach(function(child) {
        if (child.name === d.Region) {
            var data_hierarchy = {"name":d.Country};
            child.children.push(data_hierarchy);
            var sub_category={"name":d.Subcategory,"market_share":d.Growth_pct_2016_2017};
            child.children.children.push(sub_category);
        }
    });
}
*/

function transverseTree(tree, d) {
    var newcat = true;
    tree.children.forEach(function(child) {
        if (child.name == d.Country) {
            child.children.forEach(function(grandchild) {
                if(grandchild.name == d.Region) {
                    var yelp_restaurant = {"name":d.Subcategory,"market_share":d.Growth_pct_2016_2017};
                    grandchild.children.push(yelp_restaurant);
                    newcat = false; // we matched the category so it's not new
                }
            })
        }
    });
    if (newcat) { return true; } else { return false; }
}


d3.select(self.frameElement).style("height", height + "px");