import React, { Component } from "react";
import PropTypes from "prop-types";
import { Route, Switch } from "react-router-dom";
import moment from "moment";
import keyBy from "lodash/fp/keyBy";
import { getBudgets, getUpdatedBudget, AUTHORIZE_URL, setLastLocation } from "../ynabRepo";
import {
  setSetting,
  getSetting,
  INVESTMENT_ACCOUNTS,
  MORTGAGE_ACCOUNTS
} from "../uiRepo";
import topLevelPages from "../topLevelPages";
import Unauthorized from "./Unauthorized";
import NotFound from "./NotFound";
import ErrorBoundary from "./ErrorBoundary";
import Budgets from "./Budgets";
import Settings from "./Settings";
import CurrentMonthCategoryGroup from "./CurrentMonthCategoryGroup";
import CurrentMonthCategory from "./CurrentMonthCategory";
import Payee from "./Payee";
import Category from "./Category";

class App extends Component {
  static propTypes = {
    hasToken: PropTypes.bool.isRequired
  };

  state = {
    authorized: true,
    budgetsLoaded: false,
    budgetIds: [],
    budgets: {},
    budgetDetails: {},
    currentMonth: moment().format("YYYY-MM")
  };

  handleRequestBudgets = callback => {
    getBudgets().then(({ budgets }) => {
      this.setState(
        {
          budgetsLoaded: true,
          budgetIds: budgets.map(b => b.id),
          budgets: keyBy("id")(budgets)
        },
        callback
      );
    });
  };

  handleRequestBudget = id => {
    getUpdatedBudget(id).then(({ budget, authorized }) => {
      this.setState(state => ({
        ...state,
        authorized,
        budgetDetails: {
          ...state.budgetDetails,
          [id]: budget
        }
      }));
    });
  };

  handleAuthorize = () => {
    setLastLocation();
    window.location.replace(AUTHORIZE_URL);
  };

  render() {
    const { hasToken } = this.props;
    const {
      authorized,
      budgetsLoaded,
      budgetIds,
      budgets,
      budgetDetails,
      currentMonth
    } = this.state;

    if (!hasToken) {
      return <Unauthorized onAuthorize={this.handleAuthorize} />;
    }

    return (
      <ErrorBoundary>
        <Switch>
          <Route
            path="/"
            exact
            render={() => (
              <Budgets
                budgetsLoaded={budgetsLoaded}
                budgets={budgetIds.map(id => budgets[id])}
                onRequestBudgets={this.handleRequestBudgets}
              />
            )}
          />
          <Route
            path={`/budgets/:budgetId/settings`}
            exact
            render={({ match }) => (
              <Settings
                authorized={authorized}
                budget={budgetDetails[match.params.budgetId]}
                budgetId={match.params.budgetId}
                investmentAccounts={getSetting(
                  INVESTMENT_ACCOUNTS,
                  match.params.budgetId
                )}
                mortgageAccounts={getSetting(
                  MORTGAGE_ACCOUNTS,
                  match.params.budgetId
                )}
                onAuthorize={this.handleAuthorize}
                onRequestBudget={this.handleRequestBudget}
                onUpdateAccounts={({ type, value }) => {
                  if (type === "investment") {
                    setSetting(
                      INVESTMENT_ACCOUNTS,
                      match.params.budgetId,
                      value
                    );
                    this.forceUpdate();
                  }
                  if (type === "mortgage") {
                    setSetting(MORTGAGE_ACCOUNTS, match.params.budgetId, value);
                    this.forceUpdate();
                  }
                }}
              />
            )}
          />
          {topLevelPages.map(({ path, title, Component }) => (
            <Route
              key={path}
              path={`/budgets/:budgetId${path}`}
              exact
              render={({ match }) => (
                <Component
                  authorized={authorized}
                  budget={budgetDetails[match.params.budgetId]}
                  budgetId={match.params.budgetId}
                  currentMonth={currentMonth}
                  investmentAccounts={getSetting(
                    INVESTMENT_ACCOUNTS,
                    match.params.budgetId
                  )}
                  mortgageAccounts={getSetting(
                    MORTGAGE_ACCOUNTS,
                    match.params.budgetId
                  )}
                  title={title}
                  onAuthorize={this.handleAuthorize}
                  onRequestBudget={this.handleRequestBudget}
                />
              )}
            />
          ))}
          <Route
            path="/budgets/:budgetId/current/category-groups/:categoryGroupId"
            exact
            render={({ match }) => (
              <CurrentMonthCategoryGroup
                authorized={authorized}
                budget={budgetDetails[match.params.budgetId]}
                budgetId={match.params.budgetId}
                categoryGroupId={match.params.categoryGroupId}
                currentMonth={currentMonth}
                onAuthorize={this.handleAuthorize}
                onRequestBudget={this.handleRequestBudget}
              />
            )}
          />
          <Route
            path="/budgets/:budgetId/current/categories/:categoryId"
            exact
            render={({ match }) => (
              <CurrentMonthCategory
                authorized={authorized}
                budget={budgetDetails[match.params.budgetId]}
                budgetId={match.params.budgetId}
                categoryId={match.params.categoryId}
                currentMonth={currentMonth}
                onAuthorize={this.handleAuthorize}
                onRequestBudget={this.handleRequestBudget}
              />
            )}
          />
          <Route
            path="/budgets/:budgetId/categories/:categoryId"
            exact
            render={({ match }) => (
              <Category
                authorized={authorized}
                budget={budgetDetails[match.params.budgetId]}
                budgetId={match.params.budgetId}
                categoryId={match.params.categoryId}
                onAuthorize={this.handleAuthorize}
                onRequestBudget={this.handleRequestBudget}
              />
            )}
          />
          <Route
            path="/budgets/:budgetId/payees/:payeeId"
            exact
            render={({ match }) => (
              <Payee
                authorized={authorized}
                budget={budgetDetails[match.params.budgetId]}
                budgetId={match.params.budgetId}
                payeeId={match.params.payeeId}
                onAuthorize={this.handleAuthorize}
                onRequestBudget={this.handleRequestBudget}
              />
            )}
          />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    );
  }
}

export default App;
