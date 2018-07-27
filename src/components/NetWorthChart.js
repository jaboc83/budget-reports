import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import compose from "lodash/fp/compose";
import eq from "lodash/fp/eq";
import findIndex from "lodash/fp/findIndex";
import get from "lodash/fp/get";
import identity from "lodash/fp/identity";
import includes from "lodash/fp/includes";
import mapRaw from "lodash/fp/map";
import sortBy from "lodash/fp/sortBy";
import sumBy from "lodash/fp/sumBy";
import {
  selectedPlotBandColor,
  primaryColor,
  lightPrimaryColor,
  negativeChartColor
} from "../styleVariables";
import Chart from "./Chart";

const map = mapRaw.convert({ cap: false });

const FIRST_STACK = "liability";
const CREDIT_ACCOUNTS = ["mortgage", "creditCard"];
const getStack = ({ type, id, mortgageAccounts }) => {
  if (mortgageAccounts[id]) {
    return "liability";
  }

  return includes(type)(CREDIT_ACCOUNTS) ? "liability" : "asset";
};

const NetWorthChart = ({
  data,
  months,
  mortgageAccounts,
  selectedMonth,
  onSelectMonth
}) => {
  const categories = map(month => moment(month).format("MMM"))(months);
  const selectedIndex = findIndex(eq(selectedMonth))(months);
  const plotBands = selectedMonth
    ? [
        {
          color: selectedPlotBandColor,
          from: selectedIndex - 0.5,
          to: selectedIndex + 0.5
        }
      ]
    : [];
  const netWorthData = map((_, index) => sumBy(get(["data", index]))(data))(
    months
  );

  return (
    <Chart
      options={{
        chart: {
          type: "column",
          events: {
            click: event => {
              onSelectMonth(months[Math.round(event.xAxis[0].value)]);
            }
          }
        },
        yAxis: { visible: false, endOnTick: false },
        xAxis: { categories, plotBands },
        plotOptions: {
          column: { stacking: "normal" }
        },
        series: compose([
          sortBy(({ stack }) => (stack === FIRST_STACK ? 0 : 1)),
          map(({ data, id, type }) => {
            const stack = getStack({ type, id, mortgageAccounts });
            return {
              data: map(
                compose([Math.abs, stack === "liability" ? n => -n : identity])
              )(data),
              borderWidth: 0,
              enableMouseTracking: false,
              color:
                stack === "liability" ? negativeChartColor : lightPrimaryColor,
              stack
            };
          })
        ])(data).concat({
          color: primaryColor,
          data: netWorthData,
          enableMouseTracking: false,
          name: "Net Income",
          type: "line"
        })
      }}
    />
  );
};

NetWorthChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.arrayOf(PropTypes.number).isRequired,
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    })
  ).isRequired,
  months: PropTypes.arrayOf(PropTypes.string).isRequired,
  mortgageAccounts: PropTypes.objectOf(PropTypes.bool).isRequired,
  onSelectMonth: PropTypes.func.isRequired,
  selectedMonth: PropTypes.string
};

export default NetWorthChart;