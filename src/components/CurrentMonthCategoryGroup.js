import React, { Component } from "react";
import PropTypes from "prop-types";
import compose from "lodash/fp/compose";
import sortBy from "lodash/fp/sortBy";
import takeWhile from "lodash/fp/takeWhile";
import { sumByProp } from "../optimized";
import { getTransactionMonth } from "../utils";
import PageWrapper from "./PageWrapper";
import CategoryGroupTitle from "./CategoryGroupTitle";
import CurrentMonthCategoryGroupBody from "./CurrentMonthCategoryGroupBody";

class CurrentMonthCategoryGroup extends Component {
  static propTypes = {
    authorized: PropTypes.bool.isRequired,
    budgetId: PropTypes.string.isRequired,
    categoryGroupId: PropTypes.string.isRequired,
    currentMonth: PropTypes.string.isRequired,
    onAuthorize: PropTypes.func.isRequired,
    onRequestBudget: PropTypes.func.isRequired,
    budget: PropTypes.shape({
      categoryGroups: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired
        })
      ).isRequired
    })
  };

  state = { selectedCategoryId: null };

  handleSelectCategory = id => {
    this.setState(state => ({
      ...state,
      selectedCategoryId: id === state.selectedCategoryId ? null : id
    }));
  };

  handleClearCategory = () => {
    this.setState({ selectedCategoryId: null });
  };

  render() {
    const { budget, categoryGroupId, currentMonth, ...other } = this.props;
    const { selectedCategoryId } = this.state;
    let headerMenuOptions = null;
    let categoryStats = {};

    if (budget) {
      const { categories, transactions } = budget;

      const categoriesInGroup = categories.filter(
        category => category.categoryGroupId === categoryGroupId
      );

      const transactionsThisMonth = takeWhile(
        transaction => getTransactionMonth(transaction) === currentMonth
      )(transactions);

      categoryStats = categoriesInGroup.reduce((stats, category) => {
        const transactionsInCategory = transactionsThisMonth.filter(
          transaction => transaction.categoryId === category.id
        );
        return {
          ...stats,
          [category.id]: {
            transactions: transactionsInCategory.length,
            amount: sumByProp("amount")(transactionsInCategory)
          }
        };
      }, {});

      headerMenuOptions = compose([
        sortBy(category => categoryStats[category.id].amount),
        sortBy("name")
      ])(categoriesInGroup);
    }

    return (
      <PageWrapper
        {...other}
        budgetLoaded={!!budget}
        backLink
        bodyStyle={{
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        title={
          budget ? (
            <CategoryGroupTitle
              budget={budget}
              categoryGroupId={categoryGroupId}
              categoryId={selectedCategoryId}
              onClearCategory={this.handleClearCategory}
            />
          ) : (
            ""
          )
        }
        headerMenuOptions={headerMenuOptions}
        optionRenderer={category => <div key={category.id}>{category.name} {categoryStats[category.id].amount}</div>}
        content={() => (
          <CurrentMonthCategoryGroupBody
            budget={budget}
            categoryGroupId={categoryGroupId}
            currentMonth={currentMonth}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={this.handleSelectCategory}
          />
        )}
      />
    );
  }
}

export default CurrentMonthCategoryGroup;
