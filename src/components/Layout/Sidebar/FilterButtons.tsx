import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';

const FilterButtons: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const toggleShowMissing = () => {
    dispatch({
      type: 'UPDATE_SEARCH_FILTER',
      payload: { showMissing: !state.searchFilter.showMissing },
    });
  };

  const toggleShowCompleted = () => {
    dispatch({
      type: 'UPDATE_SEARCH_FILTER',
      payload: { showCompleted: !state.searchFilter.showCompleted },
    });
  };

  return (
    <div className="filter-buttons">
      <button
        className={state.searchFilter.showMissing ? 'active' : ''}
        onClick={toggleShowMissing}
      >
        Show Missing
      </button>
      <button
        className={state.searchFilter.showCompleted ? 'active' : ''}
        onClick={toggleShowCompleted}
      >
        Show Completed
      </button>
    </div>
  );
};

export default FilterButtons;