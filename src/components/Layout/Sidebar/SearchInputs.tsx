import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';

const SearchInputs: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleKeySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SEARCH_FILTER',
      payload: { keySearch: e.target.value },
    });
  };

  const handleValueSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SEARCH_FILTER',
      payload: { valueSearch: e.target.value },
    });
  };

  return (
    <div className="search-inputs">
      <input
        type="text"
        placeholder="Search keys..."
        value={state.searchFilter.keySearch}
        onChange={handleKeySearchChange}
      />
      <input
        type="text"
        placeholder="Search values..."
        value={state.searchFilter.valueSearch}
        onChange={handleValueSearchChange}
      />
    </div>
  );
};

export default SearchInputs;