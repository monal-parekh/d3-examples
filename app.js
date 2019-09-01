let scatterData = _.filter(claimData, { 'High Cost': 1 })

let minYear = d3.min(claimData, function (val) {
  let lossDate = val["Loss Date"];
  return parseInt(lossDate.split('/')[2]);
});

let maxYear = d3.max(claimData, function (val) {
  let lossDate = val["Loss Date"];
  return parseInt(lossDate.split('/')[2]);
});

let maxClaimValue = d3.max(claimData, function (val) {
  if (_.isInteger(val["Claim Cost"])) {
    return val["Claim Cost"];
  } else {
    return parseInt(val['Claim Cost'].replace(/,/g, ''));
  }
});

let minClaimValue = d3.min(claimData, function (val) {
  if (_.isInteger(val["Claim Cost"])) {
    return val["Claim Cost"];
  } else {
    return parseInt(val['Claim Cost'].replace(/,/g, ''));
  }
});

const lossTypes = _.uniqBy(claimData, 'Loss Type').map(function (obj) {
  return obj['Loss Type'];
});

const sectors = _.uniqBy(claimData, 'Sector/Industry').map(function (obj) {
  return obj['Sector/Industry'];
});

let heatmapData = [];
lossTypes.forEach(function (type) {
  sectors.forEach(function (sector) {
    const data = _.filter(claimData, { 'Loss Type': type, 'Sector/Industry': sector, 'High Cost': 1 }),
      avgValue = _.sumBy(data, function (val) {
        if (_.isInteger(val["Claim Cost"])) {
          return val["Claim Cost"];
        } else {
          let value = parseInt(val['Claim Cost'].replace(/,/g, ''));
          return isNaN(value) ? 0 : value
        }
      }),
      obj = {
        lossType: type,
        sector: sector,
        count: data.length,
        value: avgValue || 0
      };
    heatmapData.push(obj);
  });
});

let colorMin = d3.min(heatmapData, function (val) {
  return val.value
});

let colorMax = d3.max(heatmapData, function (val) {
  return val.value
});

let onHeatmapCellClick = function (rec) {
  const data = _.filter(scatterData, { 'Loss Type': rec.lossType, 'Sector/Industry': rec.sector });

  let minYear = d3.min(data, function (val) {
    let lossDate = val["Loss Date"];
    return parseInt(lossDate.split('/')[2]);
  });

  let maxYear = d3.max(data, function (val) {
    let lossDate = val["Loss Date"];
    return parseInt(lossDate.split('/')[2]);
  });

  let maxClaimValue = d3.max(data, function (val) {
    if (_.isInteger(val["Claim Cost"])) {
      return val["Claim Cost"];
    } else {
      return parseInt(val['Claim Cost'].replace(/,/g, ''));
    }
  });

  let minClaimValue = d3.min(data, function (val) {
    if (_.isInteger(val["Claim Cost"])) {
      return val["Claim Cost"];
    } else {
      return parseInt(val['Claim Cost'].replace(/,/g, ''));
    }
  });

  xScale.domain([minYear - 1, maxYear + 1]);
  xAxisHM.transition().duration(1000).call(d3.axisBottom(xScale));
  yScale.domain([minClaimValue, maxClaimValue]);
  yAxisHM.transition().duration(1000).call(d3.axisLeft(yScale));
  let circle = scatter.selectAll("circle")
  circle.exit()
  circle.remove()
  scatter.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      let lossDate = d["Loss Date"];
      return xScale(parseInt(lossDate.split('/')[2]));
    })
    .attr("cy", function (d) {
      let claimCost = d["Claim Cost"];
      if (_.isInteger(claimCost)) {
        return yScale(claimCost);
      } else {
        return yScale(parseInt(claimCost.replace(/,/g, '')) || 0);
      }
    })
    .attr("r", 3.5)
    .style("fill", function (d) {
      let litigation = d['Litigation'];
      let val = d["Cause Description"].search('BURN') >= 0 ? 1 : d["Cause Description"].search('BURN');
      if (val >= 0) {
        return 'yellow';
      } else if(litigation.toLowerCase() === 'yes'){
        return 'red';
      } else {
        return '#cbcbcb';
      }
    })
    .on("mouseover", function (d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html('<b>No.</b> '+d["Case Number"] + "<br/><b>CC</b>: " + d["Claim Cost"] + "<br/><b>CD</b>: " + d["Cause Description"] + "<br/><b>Li</b>:" + d["Litigation"])
        .style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
  document.querySelector("#scatterTitle").remove();
  //  Add title to graph
  scatter.append("text")
    .attr("x", 0)
    .attr("y", -50)
    .attr("id","scatterTitle")
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text(`Scatter plot to analyze high cost Litigation Cases for ${rec.lossType} and ${rec.sector}`);
}