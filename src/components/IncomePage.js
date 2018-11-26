import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import {
  useMonthExclusions,
  useSelectedEntityId,
  useSelectedMonth
} from "../commonHooks";
import { notAny, simpleMemoize } from "../dataUtils";
import {
  getFirstMonth,
  getTransactionMonth,
  isIncome,
  isStartingBalanceOrReconciliation,
  isTransfer,
  sanitizeName
} from "../budgetUtils";
import PageLayout from "./PageLayout";
import MonthByMonthSection from "./MonthByMonthSection";
import GenericEntitiesSection from "./GenericEntitiesSection";

const getFilteredTransactions = simpleMemoize(
  (budget, investmentAccounts, excludeFirstMonth, excludeLastMonth) => {
    const firstMonth = getFirstMonth(budget);
    const lastMonth = moment().format("YYYY-MM");
    return budget.transactions.filter(
      notAny([
        isStartingBalanceOrReconciliation(budget),
        isTransfer(investmentAccounts),
        transaction =>
          excludeFirstMonth && getTransactionMonth(transaction) === firstMonth,
        transaction =>
          excludeLastMonth && getTransactionMonth(transaction) === lastMonth
      ])
    );
  }
);

const getFilteredIncomeTransactions = simpleMemoize(
  (budget, investmentAccounts, excludeFirstMonth, excludeLastMonth) =>
    getFilteredTransactions(
      budget,
      investmentAccounts,
      excludeFirstMonth,
      excludeLastMonth
    )
      .filter(transaction => isIncome(budget)(transaction))
      .map(transaction => ({ ...transaction, amount: -transaction.amount }))
);

const IncomePage = ({ budget, investmentAccounts, title, wrapperProps }) => {
  const {
    excludeFirstMonth,
    excludeLastMonth,
    months,
    onSetExclusion
  } = useMonthExclusions(budget);
  const [selectedMonth, onSelectMonth] = useSelectedMonth();
  const [selectedPayeeId, onSelectPayeeId] = useSelectedEntityId();

  const { payeesById } = budget;
  const filteredTransactions = getFilteredIncomeTransactions(
    budget,
    investmentAccounts,
    excludeFirstMonth,
    excludeLastMonth
  );
  const transactionsInSelectedMonth =
    selectedMonth &&
    filteredTransactions.filter(
      transaction => getTransactionMonth(transaction) === selectedMonth
    );

  return (
    <PageLayout
      {...wrapperProps}
      title={title}
      fixedContent={
        budget && (
          <MonthByMonthSection
            excludeFirstMonth={excludeFirstMonth}
            excludeLastMonth={excludeLastMonth}
            highlightFunction={
              selectedPayeeId &&
              (transaction => transaction.payee_id === selectedPayeeId)
            }
            months={months}
            selectedMonth={selectedMonth}
            title={
              selectedPayeeId
                ? `Month by Month: ${sanitizeName(
                    budget.payeesById[selectedPayeeId].name
                  )}`
                : "Month by Month"
            }
            transactions={filteredTransactions}
            onSelectMonth={onSelectMonth}
            onSetExclusion={onSetExclusion}
          />
        )
      }
      content={
        budget && (
          <GenericEntitiesSection
            key={`payee-${selectedMonth || "all"}`}
            entityKey="payee_id"
            entitiesById={payeesById}
            title={
              selectedMonth
                ? `Payees: ${moment(selectedMonth).format("MMMM")}`
                : "Payees"
            }
            transactions={transactionsInSelectedMonth || filteredTransactions}
            selectedEntityId={selectedPayeeId}
            onClickEntity={onSelectPayeeId}
            showAverageToggle={false}
            showAverage={!selectedMonth}
            numMonths={months.length}
            limitShowing
          />
        )
      }
    />
  );
};

IncomePage.propTypes = {
  budget: PropTypes.object.isRequired,
  investmentAccounts: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  wrapperProps: PropTypes.object.isRequired
};

export default IncomePage;
